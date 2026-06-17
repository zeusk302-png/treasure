// ============================================================
// 실습 140 — callback.js  (★ OAuth 콜백 처리: 돌아온 뒤 세션 읽기 ★)
//
// 하는 일: 구글에서 동의하고 이 페이지(callback.html)로 돌아왔을 때,
//   - 로그인이 됐으면  → 누구로 로그인됐는지(이름/이메일/방식) 보여준다
//   - 세션이 없으면    → "직접 들어왔거나 취소됨" 안내를 보여준다
//
// 우리가 토큰을 직접 파싱할 필요는 없습니다.
// supabase-js가 주소(해시)에 담겨 온 토큰을 읽어 세션으로 자동 저장해 줍니다.
// 우리는 getUser()로 "지금 로그인된 사람"만 확인하면 됩니다.
// ============================================================

const checking = document.getElementById("checking");
const welcome = document.getElementById("welcome");
const noSession = document.getElementById("noSession");
const msgEl = document.getElementById("msg");

// 확인된 사용자 정보를 화면에 그립니다.
function showUser(user) {
  checking.hidden = true;
  noSession.hidden = true;
  welcome.hidden = false;

  // 구글이 보내준 부가 정보는 user.user_metadata 안에 들어 있습니다. (이름/사진 등)
  const meta = user.user_metadata || {};
  document.getElementById("name").textContent =
    meta.full_name || meta.name || "(이름 정보 없음)";
  document.getElementById("email").textContent = user.email || "(이메일 없음)";

  // user.app_metadata.provider 는 어떤 방식으로 로그인했는지 알려줍니다. (예: "google")
  document.getElementById("provider").textContent =
    (user.app_metadata && user.app_metadata.provider) || "알 수 없음";

  // 프로필 사진이 있으면 보여줍니다.
  const avatarUrl = meta.avatar_url || meta.picture;
  if (avatarUrl) {
    const img = document.getElementById("avatar");
    img.src = avatarUrl;
    img.hidden = false;
  }
}

// 세션이 없을 때(직접 들어왔거나 취소된 경우) 안내 화면을 보여줍니다.
function showNoSession() {
  checking.hidden = true;
  welcome.hidden = true;
  noSession.hidden = false;
}

// ── 핵심 로직 ──────────────────────────────────────────────
// getUser()는 브라우저에 저장된 세션을 Supabase 서버에 물어봐서
// "이 사람 진짜 유효한 사용자 맞아?"까지 확인하고 사용자 정보를 돌려줍니다.
// 구글에서 막 돌아온 직후라면, supabase-js가 토큰을 세션으로 저장해 둔 상태라
// 여기서 곧바로 사용자가 잡힙니다.
async function checkSession() {
  const { data, error } = await db.auth.getUser();

  if (error || !data.user) {
    showNoSession();
    return;
  }
  showUser(data.user);
}

// onAuthStateChange: 로그인 토큰 처리가 '조금 늦게' 끝나는 경우를 대비한 안전장치입니다.
// 로그인이 막 완료되는 순간(SIGNED_IN)을 잡아 화면을 다시 그려줍니다.
db.auth.onAuthStateChange((event, session) => {
  if (event === "SIGNED_IN" && session) {
    showUser(session.user);
  }
});

// 로그아웃 버튼: 세션을 지우고 로그인 페이지로 돌아갑니다.
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await db.auth.signOut();
  location.replace("login.html");
});

// 페이지가 열리면 곧바로 한 번 확인합니다.
checkSession();
