// supabase/functions/chat/index.ts
// 챗봇 요청을 '중계'하는 Edge Function(서버 함수)입니다.
//
// 핵심 아이디어:
//   - 비밀 키(AI API 키)는 이 서버 함수 '안'에서만 읽습니다.
//   - 브라우저(프론트)는 이 함수 주소로 "질문"만 보냅니다.
//   - 브라우저는 비밀 키를 절대 보지 못합니다. (그래서 안전합니다)
//
// 비밀 키는 코드에 직접 적지 않고, 아래처럼 '환경변수(Secret)'로 주입합니다.
//   supabase secrets set ANTHROPIC_API_KEY=REPLACE_WITH_YOUR_REAL_ANTHROPIC_KEY
// 이렇게 하면 키가 깃허브(GitHub)나 브라우저에 절대 올라가지 않습니다.

// Deno 환경에서 동작합니다. (Supabase Edge Function의 기본 런타임)

// 어떤 사이트(프론트)에서 이 함수를 불러도 되는지 알려주는 헤더(CORS)
const corsHeaders = {
  "Access-Control-Allow-Origin": "*", // 실습용. 실제 서비스에선 내 도메인만 허용하세요.
  "Access-Control-Allow-Headers": "authorization, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  // 브라우저가 본 요청 전에 보내는 '예비 질문(OPTIONS)'에 먼저 OK 응답
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // 1) 비밀 키를 '서버 환경변수'에서만 읽습니다. (코드에 직접 쓰지 않음)
    const ANTHROPIC_API_KEY = Deno.env.get("ANTHROPIC_API_KEY");
    if (!ANTHROPIC_API_KEY) {
      // 키가 설정 안 됐으면, 키 값이 아니라 '안내 메시지'만 돌려줍니다.
      return json({ error: "서버에 ANTHROPIC_API_KEY가 설정되지 않았습니다." }, 500);
    }

    // 2) 프론트가 보낸 질문만 꺼냅니다.
    const { message } = await req.json().catch(() => ({ message: "" }));
    if (!message || typeof message !== "string") {
      return json({ error: "message(질문 문자열)가 필요합니다." }, 400);
    }

    // 3) 진짜 AI 호출은 '여기 서버에서' 합니다. (비밀 키를 여기서만 사용)
    const aiRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "content-type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,          // 비밀 키는 서버 안에서만
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-haiku-4-5",               // 가볍고 빠른 모델로 실습
        max_tokens: 300,
        messages: [{ role: "user", content: message }],
      }),
    });

    if (!aiRes.ok) {
      const detail = await aiRes.text();
      return json({ error: "AI 호출 실패", detail }, 502);
    }

    const data = await aiRes.json();
    // 응답에서 글자만 뽑아 깔끔하게 프론트로 전달
    const reply = data?.content?.[0]?.text ?? "(답변을 받지 못했어요)";

    // 4) 프론트에는 '답변 텍스트'만 돌려줍니다. 비밀 키는 절대 포함되지 않습니다.
    return json({ reply });
  } catch (e) {
    return json({ error: "서버 오류", detail: String(e) }, 500);
  }
});

// JSON 응답을 만들 때 CORS 헤더를 항상 같이 붙여 주는 도우미
function json(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, "content-type": "application/json" },
  });
}
