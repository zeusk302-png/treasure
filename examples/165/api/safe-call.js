// ============================================================
//  서버 함수 (Vercel Serverless Function)  —  /api/safe-call
// ------------------------------------------------------------
//  이 파일은 "서버에서만" 실행됩니다. 브라우저로 내려가지 않습니다.
//  그래서 여기에만 비밀 키(AI API 키)를 둡니다.
//
//  하는 일:
//   1) 호출 전에 '오늘의 한도'(요청 수 + 누적 비용)를 먼저 검사한다.
//   2) 한도를 넘으면 AI를 부르지 않고 곧바로 차단(HTTP 429)한다.
//   3) 통과하면 Claude를 부르고, 사용한 토큰과 예상 비용을 계산해 로그에 남긴다.
// ============================================================

import Anthropic from "@anthropic-ai/sdk";

// --- 비밀 키는 환경변수에서만 읽습니다. 코드에 절대 적지 않습니다. ---
// Vercel 대시보드 > Project > Settings > Environment Variables 에 아래 이름으로 등록하세요.
//   ANTHROPIC_API_KEY = sk-ant-... (여기서는 자리표시자, 실제 값은 비밀)
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY, // ← 실제 키 값은 자리표시자. 여기엔 절대 하드코딩 금지.
});

// --- 모델과 가격(2026년 기준 Claude Opus 4.8: 입력 $5 / 출력 $25 per 1M tokens) ---
const MODEL = "claude-opus-4-8";
const PRICE_INPUT_PER_TOKEN = 5 / 1_000_000;   // 입력 토큰 1개당 USD
const PRICE_OUTPUT_PER_TOKEN = 25 / 1_000_000; // 출력 토큰 1개당 USD

// --- 한도(가드) 설정: 요금폭탄/한도 초과를 '디렉터가 먼저' 막는 기준선 ---
const REQUEST_LIMIT = 20;   // 하루 최대 호출 횟수
const COST_LIMIT_USD = 0.5; // 하루 최대 누적 비용(USD)

// --- 아주 단순한 '사용량 누적' 저장소(메모리) ---
//  ※ 학습용입니다. 서버 함수는 잠깐 살았다 사라지므로 이 값은 영구 저장이 아닙니다.
//  실제 서비스에서는 이 자리에 Supabase(DB)나 Upstash 같은 영구 저장소를 씁니다.
//  (이 폴더의 README '한 단계 더' 참고)
let usage = {
  requestsUsed: 0,
  costUsed: 0,
};

function budgetView(extra = {}) {
  return {
    requestsUsed: usage.requestsUsed,
    requestLimit: REQUEST_LIMIT,
    costUsed: usage.costUsed,
    costLimit: COST_LIMIT_USD,
    blocked: usage.requestsUsed >= REQUEST_LIMIT || usage.costUsed >= COST_LIMIT_USD,
    ...extra,
  };
}

function nowTime() {
  return new Date().toLocaleTimeString("ko-KR", { hour12: false });
}

export default async function handler(req, res) {
  // (A) 상태만 조회: GET /api/safe-call?mode=status  → 호출 없이 한도 현황만 돌려준다.
  if (req.method === "GET" && req.query.mode === "status") {
    return res.status(200).json({ budget: budgetView() });
  }

  if (req.method !== "POST") {
    return res.status(405).json({ message: "POST로 요청하세요." });
  }

  const { prompt } = req.body || {};
  if (!prompt || typeof prompt !== "string") {
    return res.status(400).json({ message: "prompt가 비어 있습니다." });
  }

  // (B) 한도 가드 — AI를 부르기 '전에' 먼저 검사한다. 이게 이 실습의 핵심.
  if (usage.requestsUsed >= REQUEST_LIMIT) {
    return res.status(429).json({
      message: `하루 요청 한도(${REQUEST_LIMIT}회)를 모두 사용했습니다.`,
      budget: budgetView(),
      lastCall: { time: nowTime(), inputTokens: 0, outputTokens: 0, cost: 0 },
    });
  }
  if (usage.costUsed >= COST_LIMIT_USD) {
    return res.status(429).json({
      message: `하루 비용 한도($${COST_LIMIT_USD})를 초과했습니다.`,
      budget: budgetView(),
      lastCall: { time: nowTime(), inputTokens: 0, outputTokens: 0, cost: 0 },
    });
  }

  // (C) 한도 통과 → 실제 AI 호출
  try {
    const message = await client.messages.create({
      model: MODEL,
      max_tokens: 300, // 출력 상한도 비용을 막는 안전장치입니다.
      messages: [{ role: "user", content: prompt }],
    });

    // 응답에서 실제 사용 토큰 수를 꺼냅니다.
    const inputTokens = message.usage.input_tokens;
    const outputTokens = message.usage.output_tokens;

    // 이 호출의 예상 비용을 계산합니다.
    const cost =
      inputTokens * PRICE_INPUT_PER_TOKEN + outputTokens * PRICE_OUTPUT_PER_TOKEN;

    // 사용량 누적(로깅) — 다음 호출의 한도 검사에 반영됩니다.
    usage.requestsUsed += 1;
    usage.costUsed += cost;

    // 답변 텍스트만 추려서 돌려줍니다.
    const answer = message.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("\n");

    return res.status(200).json({
      answer,
      budget: budgetView(),
      lastCall: { time: nowTime(), inputTokens, outputTokens, cost },
    });
  } catch (err) {
    // 인증 실패(키 누락/오타) 등은 여기로 옵니다.
    return res.status(500).json({
      message: "AI 호출에 실패했습니다. 서버 환경변수(ANTHROPIC_API_KEY)를 확인하세요.",
    });
  }
}
