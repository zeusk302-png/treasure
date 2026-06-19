/*
  이 파일은 무엇인가:
  브라우저(index.html)와 Claude API 사이에 서는 "작은 중계 서버"입니다.
  브라우저가 /api/chat 으로 메시지를 보내면, 이 서버가 Claude에게 대신 물어보고,
  Claude가 글자를 흘려보내는(스트리밍) 응답을 그대로 브라우저로 다시 흘려보냅니다.

  왜 서버가 따로 필요한가 (이 실습의 핵심 보안 포인트):
  - Claude의 API 키(ANTHROPIC_API_KEY)는 "비밀값"입니다. 키가 있으면 누구나 내 요금으로 호출할 수 있어요.
  - 그래서 키를 브라우저 코드(index.html/script.js)에 절대 넣으면 안 됩니다. (F12로 다 보임)
  - 키는 오직 이 "서버"에서만 .env 파일을 통해 읽습니다. 브라우저는 키를 한 글자도 못 봅니다.
  - 즉 서버 = 키를 쥐고 있는 안전한 주방, 브라우저 = 주문만 넣는 손님. 손님은 주방 금고를 못 봅니다.
*/

import "dotenv/config";           // .env 파일의 값을 process.env 로 읽어오는 라이브러리 — 키를 코드에 박지 않으려고 씀
import express from "express";    // 가벼운 웹 서버 프레임워크 — /api/chat 같은 주소를 만들기 위해 씀
import Anthropic from "@anthropic-ai/sdk"; // Claude 공식 SDK — 직접 HTTP를 짜지 않고 안전하게 호출하려고 씀

const app = express();

// 브라우저가 보낸 JSON 본문(메시지 목록 등)을 자동으로 해석하게 해줍니다.
app.use(express.json());

// index.html / script.js / style.css 같은 정적 파일을 현재 폴더에서 그대로 제공합니다.
// 왜: 따로 라이브 서버를 안 켜도 이 서버 하나로 화면 + API를 둘 다 처리하려고.
app.use(express.static("."));

// Claude 클라이언트 한 번만 만들어 재사용합니다.
// api_key 를 직접 넘기지 않으면 SDK가 환경변수 ANTHROPIC_API_KEY 를 자동으로 읽습니다.
// 왜 환경변수로: 키를 소스코드에 적지 않기 위해 (.env → 환경변수 경로).
const anthropic = new Anthropic();

// 핵심 주소: 브라우저가 사용자의 말 + 시스템 프롬프트 + 지금까지의 대화를 보내는 곳.
app.post("/api/chat", async (req, res) => {
  // 브라우저가 보낸 값 꺼내기.
  // - system: "챗봇의 성격/규칙" (예: "너는 친절한 부산 사투리 여행 가이드야")
  // - messages: 지금까지의 대화 기록 [{role:"user"|"assistant", content:"..."}]
  //   왜 대화 기록 전체를 받나: Claude API는 "기억"이 없어서, 맥락 유지를 위해 매번 전체를 보내야 함.
  const { system, messages } = req.body;

  // 아주 기본적인 입력 검증 — 형식이 틀리면 Claude를 부르기 전에 막습니다.
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: "messages 배열이 필요합니다." });
  }

  try {
    // 브라우저로 "글자를 조금씩 흘려보낼" 수 있도록 SSE(Server-Sent Events) 헤더를 켭니다.
    // 왜: 답이 다 끝나길 기다렸다 한 번에 주면 "타이핑되는 느낌"이 안 납니다.
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    // Claude에게 스트리밍으로 요청합니다.
    // .stream() 은 글자 조각(델타)을 하나씩 이벤트로 내보내 줍니다.
    const stream = anthropic.messages.stream({
      model: "claude-opus-4-8", // 사용할 모델 — Claude의 가장 강력한 Opus 계열. 정확한 모델 ID 그대로 씀.
      max_tokens: 1024,         // 한 번에 받을 답의 최대 길이(토큰). 너무 작으면 답이 중간에 잘립니다.
      system: system || "당신은 한국어로 답하는 친절한 도우미입니다.", // 시스템 프롬프트(없으면 기본값)
      messages: messages,       // 지금까지의 대화 전체
    });

    // 글자 조각이 도착할 때마다 그 텍스트만 뽑아 브라우저로 즉시 흘려보냅니다.
    // 왜 JSON.stringify: 줄바꿈 등 특수문자가 SSE 한 줄을 깨지 않도록 안전하게 감싸기 위해.
    stream.on("text", (textChunk) => {
      res.write(`data: ${JSON.stringify({ text: textChunk })}\n\n`);
    });

    // 스트림이 끝나면 "끝났다"는 신호를 보내고 연결을 닫습니다.
    // 왜: 브라우저가 언제 입력창을 다시 풀어줄지 알게 하려고.
    stream.on("end", () => {
      res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
      res.end();
    });

    // 도중에 에러가 나면 에러도 브라우저로 알려주고 닫습니다.
    stream.on("error", (err) => {
      console.error("스트림 오류:", err);
      res.write(`data: ${JSON.stringify({ error: "스트리밍 중 오류가 발생했습니다." })}\n\n`);
      res.end();
    });
  } catch (err) {
    // 여기까지 오면 보통 키가 없거나(.env 미설정) 네트워크 문제입니다.
    console.error("요청 처리 실패:", err);
    res.status(500).json({ error: "서버에서 Claude 호출에 실패했습니다. .env의 키를 확인하세요." });
  }
});

// 서버를 켭니다. 포트는 환경변수에 있으면 그걸, 없으면 3000번을 씁니다.
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
  // 키가 안 들어왔으면 미리 친절히 경고 — 초보가 가장 자주 막히는 지점이라 알려줍니다.
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn("경고: ANTHROPIC_API_KEY 가 비어 있습니다. .env.example 을 복사해 .env 를 만들고 키를 넣으세요.");
  }
});
