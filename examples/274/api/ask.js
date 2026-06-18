// =====================================================================
// 실습 274 — RAG 챗봇의 '두뇌' (Vercel 서버리스 함수)
//
// RAG = Retrieve(검색) + Augment(근거 붙이기) + Generate(답 생성)
//
//   1) Retrieve : 사용자의 질문과 가장 관련 있는 '내 문서 조각'을 찾는다.
//   2) Augment  : 그 조각들을 AI에게 줄 지시문(프롬프트)에 끼워 넣는다.
//   3) Generate : "아래 문서에 적힌 내용으로만 답해" 라고 못 박아 AI가 답하게 한다.
//
// 왜 서버에서 하나요?
//   - 비밀 키(ANTHROPIC_API_KEY)는 브라우저에 절대 두면 안 됩니다(F12로 털림).
//   - 이 파일은 Vercel 서버에서만 돌고, 브라우저로는 내려가지 않습니다.
//   - 그래서 키를 '코드'가 아니라 '서버 환경변수'에만 둡니다.
//       → Vercel 대시보드 > Settings > Environment Variables 에
//         ANTHROPIC_API_KEY = YOUR_ANTHROPIC_API_KEY 로 넣어 둡니다.
//       → 코드에서는 process.env.ANTHROPIC_API_KEY 로만 읽습니다.
// =====================================================================

import { DOCUMENTS } from "../knowledge.js";

// ── 1) Retrieve(검색): 아주 단순한 '키워드 점수' 검색기 ──────────────
//   질문에 문서의 keyword가 몇 개나 들어 있는지 세서 점수를 매깁니다.
//   (실전에서는 '임베딩 벡터 유사도'를 쓰지만, 원리는 똑같이 '닮은 조각 찾기'입니다.
//    지금은 비전공자가 눈으로 따라갈 수 있게 키워드 방식으로 보여 줍니다.)
function retrieve(question, topK = 2) {
  const q = question.toLowerCase();

  const scored = DOCUMENTS.map((doc) => {
    let score = 0;
    for (const kw of doc.keywords) {
      if (q.includes(kw.toLowerCase())) score += 1;
    }
    return { doc, score };
  });

  // 점수 높은 순으로 정렬 → 상위 topK개만, 그중 점수 0은 버린다.
  return scored
    .filter((s) => s.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map((s) => s.doc);
}

export default async function handler(req, res) {
  // POST 요청만 받는다 (브라우저 script.js가 POST로 부른다)
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 받습니다." });
  }

  // 비밀 키는 '환경변수'에서만 읽는다. 코드에는 키가 없다.
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error:
        "서버에 ANTHROPIC_API_KEY 환경변수가 없습니다. " +
        "Vercel > Settings > Environment Variables 에 키를 추가하고 다시 배포하세요.",
    });
  }

  // 브라우저가 보낸 질문 꺼내기
  const { question } = req.body || {};
  if (!question || typeof question !== "string" || !question.trim()) {
    return res.status(400).json({ error: "question(질문)이 필요합니다." });
  }

  // ── 1) Retrieve: 질문과 닮은 문서 조각 찾기 ──────────────────────
  const found = retrieve(question.trim());

  // 찾은 게 하나도 없으면 AI를 부르지 않고 바로 "모른다"고 답한다.
  // (불필요한 API 호출/비용을 막고, 환각도 원천 차단)
  if (found.length === 0) {
    return res.status(200).json({
      answer: "죄송해요, 제가 가진 문서에는 그 내용이 없어요. 매장에 직접 문의해 주세요.",
      sources: [],
    });
  }

  // ── 2) Augment: 찾은 조각들을 '근거 묶음' 텍스트로 만든다 ─────────
  const context = found
    .map((d, i) => `[문서 ${i + 1}] ${d.title}\n${d.text}`)
    .join("\n\n");

  // ── 3) Generate: AI에게 '이 문서로만 답해'라고 못 박는다 ──────────
  //   system: AI의 규칙(성격). 사용자가 못 바꾼다.
  //   user  : 근거 문서 + 진짜 질문.
  const systemPrompt = [
    "당신은 '코딩카페' 고객센터 도우미입니다.",
    "반드시 아래에 주어진 [문서] 내용에만 근거해서 한국어로 답하세요.",
    "문서에 없는 내용은 절대 지어내지 말고 '문서에 그 내용이 없어요'라고 답하세요.",
    "답은 2~3문장으로 짧고 친절하게 합니다.",
  ].join("\n");

  const userPrompt = `다음은 참고할 수 있는 문서입니다.\n\n${context}\n\n---\n이 문서들만 근거로, 아래 질문에 답해 주세요.\n질문: ${question.trim()}`;

  try {
    // 여기서 진짜 Claude를 호출한다. 비밀 키는 서버 안에서만 붙는다.
    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey, // ← 비밀 키. 서버에서만 붙는다. 브라우저는 못 본다.
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 512,
        system: systemPrompt,
        messages: [{ role: "user", content: userPrompt }],
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      const msg = data?.error?.message || `Claude API 오류 (${anthropicRes.status})`;
      return res.status(anthropicRes.status).json({ error: msg });
    }

    // 응답에서 텍스트 블록만 모은다.
    const answer = (data.content || [])
      .filter((block) => block.type === "text")
      .map((block) => block.text)
      .join("")
      .trim();

    // 답과 함께 '어떤 문서를 근거로 썼는지'도 돌려준다(투명성 = RAG의 장점).
    return res.status(200).json({
      answer: answer || "(빈 응답)",
      sources: found.map((d) => d.title),
    });
  } catch (err) {
    return res.status(502).json({ error: "서버에서 Claude 호출 실패: " + err.message });
  }
}
