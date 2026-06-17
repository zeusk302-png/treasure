// ============================================================
// 실습 138 — login.js
// 로그인 폼을 처리하고, 성공하면 '원래 가려던 페이지'로 돌려보냅니다.
// (가드가 login.html?redirect=mypage.html 처럼 복귀 주소를 붙여 보냈습니다.)
// ============================================================

const msgEl = document.getElementById("msg");

// 주소창의 ?redirect=... 값을 읽습니다. 없으면 기본값으로 mypage.html.
// 예) login.html?redirect=mypage.html → goAfterLogin = "mypage.html"
const params = new URLSearchParams(location.search);
const goAfterLogin = params.get("redirect") || "mypage.html";

// 이미 로그인된 사람이 login.html에 들어오면, 굳이 다시 로그인할 필요 없이 보호 페이지로 보냅니다.
(async () => {
  const { data } = await db.auth.getUser();
  if (data.user) {
    location.replace(goAfterLogin);
  }
})();

document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  msgEl.classList.remove("show");

  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  // 이메일/비밀번호로 로그인. 성공하면 브라우저에 세션이 저장됩니다.
  const { error } = await db.auth.signInWithPassword({ email, password });

  if (error) {
    msgEl.textContent = "로그인 실패: " + error.message;
    msgEl.classList.add("show");
    return;
  }

  // 로그인 성공 → 원래 가려던 보호 페이지로 복귀.
  // 이제 세션이 있으므로, 그 페이지의 가드는 우리를 통과시켜 줍니다.
  location.replace(goAfterLogin);
});
