// ============================================================
// 실습 138 — app.js
// 보호 페이지(mypage.html)에서 '가드를 통과한 사람'에게 보여줄 내용을 그립니다.
// 주의: 이 파일은 화면 그리기만 담당합니다. '들여보낼지 말지'는 auth-guard.js가 결정합니다.
// ============================================================

// auth-guard.js가 검사를 끝내고 통과시켜 주면 'guard:passed' 신호를 보냅니다.
// 우리는 그 신호를 받은 뒤에 화면을 그립니다. (통과 전에 그리면 안 되니까요.)
document.addEventListener("guard:passed", (e) => {
  const user = e.detail; // 가드가 확인해 넘겨준, 지금 로그인한 사용자 정보
  render(user);
});

// 로그인한 사람에게 보여줄 화면을 그리는 함수
function render(user) {
  const headerEl = document.getElementById("appHeader");
  const secretText = document.getElementById("secretText");

  // 헤더: 왼쪽 로고 / 오른쪽에 내 이메일
  headerEl.innerHTML = `
    <a class="logo" href="mypage.html">🔒 마이페이지</a>
    <nav><span class="user">${user.email}</span></nav>
  `;

  // '나만 볼 수 있는 내용'.
  // 실제 서비스라면 여기서 db.from('memos').select() 로 DB에서 내 데이터를 가져오고,
  // 그 데이터는 RLS 정책이 'auth.uid() = 행의 주인'일 때만 내려보내 줍니다.
  // (이번 실습은 '페이지 접근 차단'이 주제라, 예시 문장으로 대신합니다.)
  secretText.textContent =
    `${user.email} 님, 환영합니다! 여기는 로그인한 사람만 볼 수 있는 공간입니다.`;
}

// 로그아웃 버튼: 세션을 지운 뒤 로그인 페이지로 보냅니다.
// 로그아웃하면 세션이 사라지므로, 이 페이지를 다시 열면 가드가 막아 줍니다.
document.getElementById("logoutBtn").addEventListener("click", async () => {
  await db.auth.signOut();
  location.replace("login.html");
});
