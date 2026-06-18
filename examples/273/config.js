// config.js — 화면(브라우저)에 들어가도 되는 "공개용" 값만 담는 파일
//
// 왜 이렇게 하나요?
//   index.html(코드 본문)에 값을 직접 박지 않으려고, 한 곳에 모읍니다.
//   여기에는 "공개돼도 되는 값"만 적습니다.
//   - Supabase URL + anon(공개) 키 : 출입증이라 화면에 있어도 됩니다.
//   - n8n Webhook 주소 : AI에게 답을 받아오는 통로. (아래 보안 설명 참고)
//
//   ⚠️ AI API 키(Anthropic 등) 같은 "비밀값"은 절대 이 파일에 적지 않습니다.
//      비밀값은 n8n의 자격증명 금고에만 두고, 브라우저는 n8n에게 "대신 물어봐 줘"라고 부탁만 합니다.

window.APP_CONFIG = {
  // Supabase 대시보드 → Settings → API 에서 복사 (공개 OK)
  SUPABASE_URL: "https://your-project-ref.supabase.co",
  SUPABASE_ANON_KEY: "REPLACE_WITH_YOUR_ANON_PUBLIC_KEY",

  // AI 답을 만들어 돌려주는 n8n 워크플로우의 Webhook 주소.
  // n8n에서 Webhook 노드의 Production URL을 복사해 넣으세요.
  // (비워 두면 이 실습은 "메아리 모드"로 동작합니다 — 아래 README 참고)
  AI_WEBHOOK_URL: "https://YOUR-N8N-HOST/webhook/REPLACE_WITH_YOUR_WEBHOOK_PATH",
};
