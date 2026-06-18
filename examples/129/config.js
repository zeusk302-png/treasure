// =============================================================
// config.js — '실제 설정 값'이 들어가는 파일 (★ 깃허브에 올리지 않음)
// =============================================================
//
// 이 파일은 .gitignore 에 등록돼 있어 깃허브에 올라가지 않습니다.
// 로컬에서 index.html 을 직접 열어 테스트할 때 쓰는 '내 컴퓨터 전용' 설정입니다.
//
// 아래 두 값을 내 진짜 anon(공개) 값으로 바꾸세요.
//   (Supabase 대시보드 → Settings(톱니바퀴) → API 에서 복사)
//
// ★ service_role / sb_secret_... 키는 절대 넣지 마세요. anon(공개) 키만!

window.APP_CONFIG = {
  SUPABASE_URL: "https://여기에-내-프로젝트-ID.supabase.co",
  SUPABASE_ANON_KEY: "sb_publishable_여기에-내-anon-공개키-붙여넣기",
};
