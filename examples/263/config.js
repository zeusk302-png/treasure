// =============================================================
// 실습 263 — SaaS 대시보드: 로그인 게이트(보호 라우트)
// 공통 설정 파일 (login.html · dashboard.html 둘 다 이 파일을 불러옵니다)
// =============================================================
//
// ▶ URL  : 내 데이터베이스가 사는 인터넷 주소. 비밀이 아닙니다.
// ▶ anon key(공개 키, sb_publishable_...) : 브라우저에 그대로 박아도 되는 '출입증'.
//    - 공개돼도 안전합니다. 진짜 잠금장치는 키가 아니라 '세션 확인 + (DB라면)RLS' 입니다.
//    - 반대로 service_role 키(= sb_secret_...)는 모든 보안을 '우회'하는 마스터 키라서
//      절대! 브라우저나 깃허브에 올리면 안 됩니다. (서버/n8n 안에서만 비밀로 사용)
//
// 아래 두 값은 '자리표시자(placeholder)'입니다. 내 진짜 anon 값으로 바꿔 주세요.
const SUPABASE_URL = "https://여기에-내-프로젝트-ID.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_여기에-내-anon-공개키-붙여넣기";

// 연결(클라이언트) 만들기.
// persistSession 기본값 true → 새로고침해도, 다른 페이지로 이동해도 로그인 상태(세션)가 유지됩니다.
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 자리표시자를 안 바꾼 채 실행하면 무조건 실패하므로, 미리 알려 주는 도우미
function isPlaceholder() {
  return SUPABASE_URL.includes("여기에-내") || SUPABASE_ANON_KEY.includes("여기에-내");
}
