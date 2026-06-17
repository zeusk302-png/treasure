// ============================================================
//  env-config.example.js  —  브라우저용 환경설정 "견본"
//
//  이 파일은 GitHub에 올라가도 됩니다. (진짜 키가 없으니까요)
//
//  [로컬에서 미리보기]
//    이 파일을 복사해 "env-config.js" 로 만들고 자리표시자를
//    진짜 anon(공개) 키로 바꾸면 됩니다.
//      cp env-config.example.js env-config.js     (맥/리눅스/Git Bash)
//      copy env-config.example.js env-config.js    (윈도우 명령프롬프트)
//    → env-config.js 는 .gitignore 로 업로드가 차단됩니다.
//
//  [배포(Vercel)]
//    env-config.js 를 직접 만들 필요가 없습니다.
//    Vercel 대시보드 → Settings → Environment Variables 에 값을 등록하면
//    build.js 가 배포 때 그 값을 읽어 env-config.js 를 자동 생성합니다.
//
//  ※ 중요: 브라우저(이 파일)에는 "anon(공개) 키"만 넣습니다.
//          service_role(비밀) 키는 절대 여기 넣지 마세요!
// ============================================================

window.__ENV__ = {
  // 공개해도 되는 값 — 안전 (단, Supabase에서 RLS가 켜져 있을 때만 안전!)
  SUPABASE_URL: "https://여기에_프로젝트_주소.supabase.co",
  SUPABASE_ANON_KEY: "여기에_anon_공개키_붙여넣기",

  // service_role(비밀) 키는 여기에 절대 넣지 않습니다.
  // 브라우저에 내려오는 순간 누구나 F12 → 소스 보기로 훔쳐볼 수 있습니다.
};
