// config.js — 화면(브라우저)에 들어가도 되는 "공개용" 값만 담는 파일
//
// 왜 이렇게 하나요?
//   index.html(코드 본문)에 키를 직접 박지 않으려고, 값을 이 한 곳에 모읍니다.
//   여기에는 .env.local의 VITE_(공개) 값만 옮겨 적습니다.
//   ⚠️ SUPABASE_SERVICE_ROLE_KEY(비밀)는 절대 이 파일에 적지 않습니다 — 브라우저로 새어 나갑니다.
//
// 실무에서는 Vite 같은 빌드 도구가 .env.local의 VITE_ 값을
// import.meta.env.VITE_... 로 자동으로 넣어줍니다. 이 실습에서는 그 과정을 손으로 흉내냅니다.

window.APP_CONFIG = {
  // .env.local의 VITE_SUPABASE_URL 값을 복사해 넣으세요 (공개 OK)
  SUPABASE_URL: "https://your-project-ref.supabase.co",
  // .env.local의 VITE_SUPABASE_ANON_KEY 값을 복사해 넣으세요 (공개 OK)
  SUPABASE_ANON_KEY: "YOUR_ANON_PUBLISHABLE_KEY_HERE",
};
