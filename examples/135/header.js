// ============================================================
// 실습 135 — 로그인 상태에 따라 헤더 바뀌게 하기 (실시간 감지)
// 이 파일이 이번 실습의 '결과물'인 공통 헤더 스크립트입니다.
// 어느 페이지에든 <header id="appHeader"></header> 하나만 두고
// 이 스크립트를 불러오면, 로그인 여부에 맞춰 메뉴가 자동으로 바뀝니다.
// ============================================================

// 아래 두 값을 내 Supabase 프로젝트 값으로 바꾸세요. (Settings → API)
// anon(publishable) 키는 '공개돼도 되는 출입증'이라 브라우저에 둬도 됩니다.
// service_role(secret) 키는 절대 여기에 넣지 마세요 — RLS를 통째로 우회합니다.
const SUPABASE_URL = "https://여기에-내-프로젝트.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_여기에-내-anon-키";

// Supabase 클라이언트 생성 (persistSession 기본값 true → 새로고침해도 로그인 유지)
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 헤더가 들어갈 자리
const headerEl = document.getElementById("appHeader");

// 세션(=로그인 정보)에 맞춰 헤더 내용을 다시 그리는 함수
// session 이 있으면 로그인 상태, null 이면 로그아웃 상태입니다.
function renderHeader(session) {
  if (session) {
    // ── 로그인 상태: '내 계정' 메뉴 + 로그아웃 버튼 ──
    // email은 Supabase가 인증한 session에서 온 값(사용자가 화면에서 자유롭게 친 날것 입력이 아님)이라
    // 여기 innerHTML에 넣어도 비교적 안전합니다. 만약 사용자가 직접 입력한 닉네임 등을 넣는다면
    // <script> 같은 게 섞여 실행되는 XSS 위험이 있으니, 그땐 textContent로 넣어 막아야 합니다.
    const email = session.user.email;
    headerEl.innerHTML = `
      <a class="logo" href="index.html">☕ 동네카페</a>
      <nav>
        <span class="user">${email}</span>
        <a href="index.html">내 계정</a>
        <button id="logoutBtn">로그아웃</button>
      </nav>
    `;
    // 로그아웃 버튼은 다시 그릴 때마다 새로 생기므로, 매번 이벤트를 붙여줍니다.
    document.getElementById("logoutBtn").addEventListener("click", async () => {
      await db.auth.signOut();
      // signOut을 부르면 onAuthStateChange가 'SIGNED_OUT'으로 다시 호출되어
      // 헤더가 자동으로 '로그인' 버튼 버전으로 바뀝니다. (여기서 직접 안 바꿔도 됨)
    });
  } else {
    // ── 로그아웃 상태: '로그인' 버튼만 ──
    headerEl.innerHTML = `
      <a class="logo" href="index.html">☕ 동네카페</a>
      <nav>
        <a class="login-btn" href="login.html">로그인</a>
      </nav>
    `;
  }
}

// ★ 핵심: onAuthStateChange는 로그인/로그아웃이 '일어나는 순간'을 실시간으로 감지합니다.
//   - 페이지가 처음 열릴 때도 (현재 세션을 들고) 한 번 호출됩니다 → 초기 헤더가 그려짐
//   - 로그인하면 'SIGNED_IN', 로그아웃하면 'SIGNED_OUT' 이벤트로 다시 호출됩니다.
//   그래서 getSession을 따로 부르지 않아도, 이 한 군데서 헤더가 항상 최신 상태로 유지됩니다.
db.auth.onAuthStateChange((event, session) => {
  console.log("인증 상태 변화:", event); // SIGNED_IN / SIGNED_OUT 등이 콘솔에 찍힘
  renderHeader(session);
});
