// ============================================================
// 실습 140 — login.js  (★ 이번 실습의 핵심: signInWithOAuth ★)
//
// 하는 일: '구글로 계속하기' 버튼을 누르면 구글 로그인 화면으로 보냅니다.
//   1) signInWithOAuth({ provider: 'google', ... }) 를 호출하면
//   2) 브라우저가 구글 화면으로 '이동(리다이렉트)'합니다.
//   3) 사용자가 구글에서 동의하면, 우리가 지정한 redirectTo 주소(callback.html)로
//      세션 토큰을 달고 '돌아옵니다(리다이렉트)'.
// 즉, 비밀번호를 우리가 직접 받지 않습니다. 인증은 구글과 Supabase가 처리합니다.
// ============================================================

const msgEl = document.getElementById("msg");

// 로그인을 마치고 '돌아올 주소'를 정합니다.
// location.origin = 지금 페이지의 'http://호스트:포트' 부분 (예: http://127.0.0.1:5500)
// 거기에 callback.html 경로를 붙여 절대주소를 만듭니다.
// ⚠️ 이 주소는 Supabase 대시보드의 Redirect URLs에도 똑같이 등록해야 막히지 않습니다.
const redirectTo = new URL("callback.html", location.href).href;

// 이미 로그인된 사람이 login.html에 들어오면, 굳이 다시 로그인하지 않고 내 정보 페이지로 보냅니다.
(async () => {
  const { data } = await db.auth.getUser();
  if (data.user) {
    location.replace("callback.html");
  }
})();

document.getElementById("googleBtn").addEventListener("click", async () => {
  msgEl.classList.remove("show");

  // signInWithOAuth는 곧바로 구글 화면으로 '이동'시키는 함수입니다.
  // 성공하면 이 페이지는 떠나가므로, 아래 코드는 보통 끝까지 실행되지 않습니다.
  // (error가 나는 건 키 설정이 틀렸거나 Provider가 꺼져 있는 등 '출발 전' 문제일 때입니다.)
  const { error } = await db.auth.signInWithOAuth({
    provider: "google",       // 구글로 로그인
    options: {
      redirectTo,             // 동의 후 돌아올 우리 앱의 주소
      // queryParams: { prompt: "select_account" }, // 계정 선택 화면을 매번 띄우고 싶으면 주석 해제
    },
  });

  if (error) {
    msgEl.textContent =
      "구글 로그인을 시작하지 못했습니다: " + error.message +
      " (대시보드에서 Google Provider가 켜져 있는지, 키가 맞는지 확인하세요.)";
    msgEl.classList.add("show");
  }
});
