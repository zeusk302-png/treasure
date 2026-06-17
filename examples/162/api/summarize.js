// =====================================================================
// 실습 162 — 서버 쪽 '중간 창구' (Vercel 서버리스 함수)
//   "한 줄 요약기"의 핵심 두뇌가 여기 있습니다.
//
// 이 파일은 Vercel 서버에서만 실행됩니다. 브라우저로는 절대 안 내려갑니다.
// 그래서 두 가지를 여기에만 둡니다.
//   ① 비밀 키(ANTHROPIC_API_KEY) — process.env 로만 읽습니다. 코드에 안 적습니다.
//   ② '요약 프롬프트' — AI에게 시킬 지시문을 코드에 고정(하드코딩)합니다.
//
// 왜 프롬프트를 서버에 고정하나요?
//   - 브라우저가 보내는 건 '요약할 원문'뿐입니다. "어떻게 요약할지"(한 줄로,
//     군더더기 없이 등)는 사용자가 바꾸지 못하도록 서버가 정해 둡니다.
//   - 이렇게 하면 우리 사이트의 'AI 기능'이 항상 똑같은 규칙으로 동작합니다.
//     (= 'AI를 내 사이트의 한 기능으로 부리기')
//
// 비밀 키는 이 코드에 직접 적지 않습니다.
//   → Vercel 대시보드 > Settings > Environment Variables 에
//     ANTHROPIC_API_KEY = sk-ant-... 로 넣어 둡니다. (진짜 키는 여기에만)
//   → 코드에서는 process.env.ANTHROPIC_API_KEY 로만 읽습니다.
// =====================================================================

// ──────────────────────────────────────────────────────────────────
// 요약 규칙(프롬프트)을 코드에 '고정'합니다.
// 사용자가 보낸 원문은 이 system 지시문 아래, user 메시지로만 들어갑니다.
// (사용자가 system 지시문을 바꿔치기할 수 없습니다.)
// ──────────────────────────────────────────────────────────────────
const SUMMARY_SYSTEM_PROMPT = [
  "당신은 한국어 글을 한 줄로 요약하는 요약기입니다.",
  "규칙:",
  "1) 입력된 글의 핵심을 '한 문장'으로만 요약합니다. (대략 60자 이내)",
  "2) 인사말·머리말·'요약:' 같은 군더더기 없이, 요약 문장만 출력합니다.",
  "3) 원문에 없는 사실을 지어내지 않습니다.",
  "4) 글이 비어 있거나 요약할 내용이 없으면 '요약할 내용이 없습니다.'라고만 답합니다.",
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

  // 3) 브라우저가 보낸 '요약할 원문' 꺼내기
  const { text } = req.body || {};
  if (!text || typeof text !== "string" || !text.trim()) {
    return res.status(400).json({ error: "요약할 글(text)이 필요합니다." });
  }

  // 너무 긴 입력은 잘라서 비용·시간을 보호한다 (한 줄 요약기에는 충분한 길이)
  const MAX_CHARS = 6000;
  const original = text.slice(0, MAX_CHARS);

  try {
    // 4) 여기서 진짜 Claude 를 호출한다. 비밀 키는 서버 안에서만 붙는다.
    //    - system: 코드에 고정한 '요약 규칙'
    //    - messages: 사용자가 보낸 '원문'만 user 로
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey, // ← 비밀 키. 서버에서만 붙는다. 브라우저는 못 본다.
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 256, // 한 줄 요약이라 짧게
        system: SUMMARY_SYSTEM_PROMPT,
        messages: [
          { role: "user", content: "다음 글을 한 줄로 요약해 줘:\n\n" + original },
        ],
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      // Claude 쪽 에러는 메시지만 전달. 비밀 키는 절대 담지 않는다.
      const msg = data?.error?.message || `Claude API 오류 (${anthropicRes.status})`;
      return res.status(anthropicRes.status).json({ error: msg });
    }

    // 5) 응답에서 텍스트만 골라 한 줄로 정리해 돌려준다.
    //    응답 content 는 블록 배열이라, type === "text" 인 블록을 모은다.
    const summary = (data.content || [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim()
      .replace(/\s*\n\s*/g, " "); // 혹시 줄바꿈이 있어도 한 줄로

    return res.status(200).json({ summary: summary || "(빈 응답)" });
  } catch (err) {
    return res.status(502).json({ error: "서버에서 Claude 호출 실패: " + err.message });
  }
}
