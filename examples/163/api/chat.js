// =====================================================================
// 실습 163 — 서버 쪽 '중간 창구' (Vercel 서버리스 함수) · 스트리밍 버전
//   "타자 치듯 흘러나오는 AI 챗"의 핵심 두뇌가 여기 있습니다.
//
// 이 파일은 Vercel 서버에서만 실행됩니다. 브라우저로는 절대 안 내려갑니다.
// 그래서 두 가지를 여기에만 둡니다.
//   ① 비밀 키(ANTHROPIC_API_KEY) — process.env 로만 읽습니다. 코드에 안 적습니다.
//   ② '챗봇 성격(시스템 프롬프트)' — AI에게 시킬 지시문을 코드에 고정합니다.
//
// 162(한 줄 요약기)와 다른 점은 단 하나입니다.
//   162: Claude 답을 '한 번에' 다 받아서 한 줄로 돌려줬습니다. (await res.json())
//   163: Claude 답을 '조각조각(스트리밍)' 받아서, 받는 즉시 브라우저로 흘려보냅니다.
//        → 사용자는 답이 다 완성되기를 기다리지 않고, 글자가 '타자 치듯' 차오르는 걸 봅니다.
//        → 긴 답일수록 '체감 속도'가 확 빨라집니다.
//
// 비밀 키는 이 코드에 직접 적지 않습니다.
//   → Vercel 대시보드 > Settings > Environment Variables 에
//     ANTHROPIC_API_KEY = sk-ant-... 로 넣어 둡니다. (진짜 키는 여기에만)
//   → 코드에서는 process.env.ANTHROPIC_API_KEY 로만 읽습니다.
// =====================================================================

// ──────────────────────────────────────────────────────────────────
// 챗봇 성격(프롬프트)을 코드에 '고정'합니다.
// 사용자가 보낸 질문은 이 system 지시문 아래, user 메시지로만 들어갑니다.
// (사용자가 system 지시문을 바꿔치기할 수 없습니다.)
// ──────────────────────────────────────────────────────────────────
const CHAT_SYSTEM_PROMPT = [
  "당신은 비전공자 웹개발 학습자를 돕는 친절한 한국어 도우미입니다.",
  "규칙:",
  "1) 쉬운 말로, 너무 길지 않게 설명합니다.",
  "2) 코드가 필요하면 짧은 예시만 곁들입니다.",
  "3) 모르면 모른다고 솔직히 말합니다.",
].join("\n");

export default async function handler(req, res) {
  // 1) POST 요청만 허용 (브라우저 script.js 가 POST 로 부른다)
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 받습니다." });
  }

  // 2) 비밀 키를 '환경변수'에서만 읽는다. 코드에는 키가 없다.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // 키를 안 넣었을 때 친절한 안내 (절대 키 값 자체를 노출하지 않는다)
    return res.status(500).json({
      error:
        "서버에 ANTHROPIC_API_KEY 환경변수가 없습니다. " +
        "Vercel > Settings > Environment Variables 에 키를 추가하고 다시 배포하세요.",
    });
  }

  // 3) 브라우저가 보낸 '질문' 꺼내기
  const { message } = req.body || {};
  if (!message || typeof message !== "string" || !message.trim()) {
    return res.status(400).json({ error: "질문(message)이 필요합니다." });
  }

  // 너무 긴 입력은 잘라서 비용·시간을 보호한다
  const MAX_CHARS = 4000;
  const question = message.slice(0, MAX_CHARS);

  try {
    // 4) 여기서 진짜 Claude 를 호출한다. 비밀 키는 서버 안에서만 붙는다.
    //    ★ 핵심: "stream": true 를 켜면 Claude 가 답을 통째로가 아니라
    //      SSE(Server-Sent Events) 형식으로 '조각조각' 보내 준다.
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey, // ← 비밀 키. 서버에서만 붙는다. 브라우저는 못 본다.
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 1024,
        stream: true, // ★ 스트리밍 켜기
        system: CHAT_SYSTEM_PROMPT,
        messages: [{ role: "user", content: question }],
      }),
    });

    // Claude 가 에러를 주면(스트림 시작 전), 키 노출 없이 메시지만 전달
    if (!anthropicRes.ok) {
      let msg = `Claude API 오류 (${anthropicRes.status})`;
      try {
        const errData = await anthropicRes.json();
        msg = errData?.error?.message || msg;
      } catch (_) {
        /* 본문이 JSON 이 아니면 위 기본 메시지 사용 */
      }
      return res.status(anthropicRes.status).json({ error: msg });
    }

    // 5) ★ 스트리밍 중계(파이프).
    //    브라우저에게는 '순수 텍스트 조각'만 흘려보낸다.
    //    (Claude 의 복잡한 SSE 포맷은 여기 서버에서 해석해서 텍스트만 추려 보낸다.)
    res.setHeader("Content-Type", "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-cache, no-transform");

    const reader = anthropicRes.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      // { stream: true }: 조각 경계에서 글자(여러 바이트)가 잘릴 수 있으므로, 잘린 부분을
      // 다음 조각까지 기억해 깨지지 않게 풀어 준다. buffer 에 계속 이어 붙여 둔다.
      buffer += decoder.decode(value, { stream: true });

      // SSE 는 줄 단위. "data: {...}" 줄에서 JSON 만 꺼낸다.
      const lines = buffer.split("\n");
      buffer = lines.pop() || ""; // 마지막 미완성 줄은 다음 청크와 이어 붙인다

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data:")) continue;

        const json = trimmed.slice(5).trim();
        if (!json || json === "[DONE]") continue;

        try {
          const event = JSON.parse(json);
          // 글자 조각은 content_block_delta 이벤트의 delta.text 에 담겨 온다
          if (event.type === "content_block_delta" && event.delta?.text) {
            res.write(event.delta.text); // ← 받는 즉시 브라우저로 흘려보낸다
          }
        } catch (_) {
          /* 깨진 줄은 조용히 건너뛴다 */
        }
      }
    }

    res.end(); // 스트림 끝
  } catch (err) {
    // 스트림이 시작되기 전이면 JSON 에러, 시작된 뒤면 그냥 종료
    if (!res.headersSent) {
      res.status(502).json({ error: "서버에서 Claude 호출 실패: " + err.message });
    } else {
      res.end();
    }
  }
}
