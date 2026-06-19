/*
  이 파일은 무엇인가:
  "글 요약 버튼" 앱의 백엔드(서버) 코드입니다. Express로 작은 웹서버를 띄워
  (1) public 폴더의 화면(index.html)을 보여 주고,
  (2) POST /api/summarize 로 들어온 긴 글을 Claude API로 보내 3줄 요약을 받아 돌려줍니다.

  왜 서버가 필요한가 (이 실습의 핵심):
  Claude API 키는 "돈이 나가는 비밀 키"라서 브라우저(누구나 F12로 볼 수 있는 곳)에 두면 도용됩니다.
  그래서 키는 이 서버에만 두고, 브라우저는 키 없이 우리 서버에게 "요약해 줘"라고 부탁만 합니다.
  즉 이 서버가 브라우저와 Claude 사이의 '경리부(프록시)' 역할을 합니다.
*/

// dotenv: .env 파일에 적어 둔 비밀값(ANTHROPIC_API_KEY 등)을 process.env 로 읽어오게 해 줍니다.
// 왜: 비밀 키를 코드에 직접 박지 않고 .env(깃에 안 올라감)에서만 읽기 위함입니다.
require("dotenv").config();

const express = require("express");
const path = require("path");

// 공식 Anthropic Node.js SDK. Claude API를 안전하고 편하게 호출하게 해 줍니다.
const Anthropic = require("@anthropic-ai/sdk");

const app = express();

// 들어오는 요청 본문이 JSON일 때 자동으로 객체로 풀어 줍니다.
// limit을 둔 이유: 너무 거대한 글이 한 번에 들어와 서버가 휘청이는 걸 막는 안전장치입니다.
app.use(express.json({ limit: "1mb" }));

// public 폴더(=index.html)를 정적 파일로 서빙합니다.
// 왜: 사용자가 http://localhost:3000 으로 접속하면 바로 요약 화면이 뜨게 하기 위함입니다.
app.use(express.static(path.join(__dirname, "public")));

// Anthropic 클라이언트 만들기.
// apiKey는 process.env.ANTHROPIC_API_KEY 에서만 읽습니다(코드에 키를 절대 안 적음).
// 왜: 이 한 줄이 "키는 서버 환경변수에만 둔다"는 보안 원칙을 코드로 강제합니다.
const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

// 사용할 모델 이름. 정확히 이 문자열이어야 합니다(오타가 나면 404 에러).
// claude-opus-4-8 은 Anthropic의 고성능 모델입니다.
const MODEL = "claude-opus-4-8";

// 요약 엔드포인트: 브라우저가 여기로 긴 글을 보내면, 서버가 Claude로 요약해 돌려줍니다.
app.post("/api/summarize", async (req, res) => {
  try {
    // 브라우저가 보낸 JSON에서 글(text)을 꺼냅니다.
    const text = (req.body && req.body.text ? String(req.body.text) : "").trim();

    // 입력 검증: 빈 글이나 너무 짧은 글은 Claude를 부르지 않습니다.
    // 왜: 불필요한 API 호출은 곧 불필요한 비용이라, 미리 걸러 돈과 시간을 아낍니다.
    if (text.length < 20) {
      return res
        .status(400)
        .json({ error: "요약할 글이 너무 짧습니다. 한 문단 이상 넣어 주세요." });
    }

    // Claude API 호출. 공식 SDK의 messages.create 를 씁니다.
    const message = await anthropic.messages.create({
      model: MODEL,
      // max_tokens: 응답 길이의 상한선. 3줄 요약엔 이 정도면 넉넉합니다.
      max_tokens: 1024,
      // system: 모델의 '역할/규칙'을 정해 주는 지시문입니다.
      // 왜: "한국어로, 군더더기 없이 3줄"처럼 출력 형식을 못 박아 두면 결과가 일정해집니다.
      system:
        "당신은 한국어 요약 도우미입니다. 사용자가 준 글의 핵심만 골라 정확히 3줄로 요약하세요. " +
        "각 줄은 '- '로 시작하는 짧은 문장으로 쓰고, 군더더기·인사말·사족은 넣지 마세요.",
      // messages: 실제 사용자 입력. user 역할로 요약할 글을 그대로 전달합니다.
      messages: [
        {
          role: "user",
          content: `다음 글을 한국어 3줄로 요약해 줘:\n\n${text}`,
        },
      ],
    });

    // 응답에서 텍스트 블록만 골라 이어 붙입니다.
    // 왜: 응답 content 는 여러 블록(텍스트/도구 등)일 수 있어, 텍스트(type === "text")만 안전하게 추립니다.
    const summary = message.content
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("\n")
      .trim();

    // 결과를 JSON으로 브라우저에 돌려줍니다. (키는 절대 함께 보내지 않습니다.)
    return res.json({ summary });
  } catch (err) {
    // 서버 콘솔에는 자세한 원인을 남겨 개발자가 디버깅할 수 있게 합니다.
    console.error("요약 중 오류:", err);

    // 사용자에게는 친절하고 '안전한' 메시지만 보냅니다.
    // 왜: 에러 원문에는 키 일부나 내부 경로가 섞일 수 있어, 그대로 노출하면 안 됩니다.
    return res
      .status(500)
      .json({ error: "요약에 실패했습니다. 잠시 후 다시 시도해 주세요." });
  }
});

// 서버 시작.
// PORT는 환경변수에 있으면 그 값을, 없으면 3000을 씁니다(배포 환경마다 포트가 달라서).
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  // 키가 아예 비어 있으면 미리 경고해 줍니다(흔한 실수 예방).
  if (!process.env.ANTHROPIC_API_KEY) {
    console.warn(
      "경고: ANTHROPIC_API_KEY가 비어 있습니다. .env 파일에 키를 넣고 서버를 다시 켜세요."
    );
  }
  console.log(`http://localhost:${PORT} 에서 실행 중`);
});
