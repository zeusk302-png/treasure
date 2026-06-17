// =====================================================================
// 실습 161 — 서버 쪽 '중간 창구' (Vercel 서버리스 함수)
//
// 이 파일은 Vercel 서버에서만 실행됩니다. 브라우저로는 절대 내려가지 않습니다.
// 그래서 여기에서만 비밀 키(ANTHROPIC_API_KEY)를 안전하게 꺼내 씁니다.
//
// 비밀 키는 이 코드에 직접 적지 않습니다.
//   → Vercel 대시보드 > Settings > Environment Variables 에
//     ANTHROPIC_API_KEY = sk-ant-... 로 넣어 둡니다.
//   → 코드에서는 process.env.ANTHROPIC_API_KEY 로만 읽습니다.
//
// 즉, 키는 "코드"가 아니라 "서버 환경변수"에만 존재합니다.
// =====================================================================

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

  // 3) 브라우저가 보낸 질문 꺼내기
  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ error: "prompt(질문)가 필요합니다." });
  }

  try {
    // 4) 여기서 진짜 Claude 를 호출한다. 비밀 키는 서버 안에서만 붙는다.
    //    (브라우저는 이 헤더를 절대 보지 못한다.)
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey, // ← 비밀 키. 서버에서만 붙는다.
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 1024,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      // Claude 쪽 에러는 메시지만 전달. 비밀 키는 절대 담지 않는다.
      const msg = data?.error?.message || `Claude API 오류 (${anthropicRes.status})`;
      return res.status(anthropicRes.status).json({ error: msg });
    }

    // 5) 응답에서 텍스트만 골라 브라우저로 돌려준다.
    //    응답 content 는 블록 배열이라, type === "text" 인 블록을 모은다.
    const answer = (data.content || [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    return res.status(200).json({ answer: answer || "(빈 응답)" });
  } catch (err) {
    return res.status(502).json({ error: "서버에서 Claude 호출 실패: " + err.message });
  }
}
