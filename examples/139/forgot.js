// ============================================================
// 실습 139 — forgot.js  (1단계: 재설정 메일 보내기)
// 사용자가 이메일을 적으면, 그 주소로 '비밀번호 재설정 링크' 메일을 보냅니다.
// 핵심 함수: db.auth.resetPasswordForEmail(이메일, { redirectTo: 돌아올주소 })
// ============================================================

const msgEl = document.getElementById("msg");
const sentBox = document.getElementById("sentBox");
const sentEmail = document.getElementById("sentEmail");

// 메일 속 링크를 눌렀을 때 사용자가 '돌아올 주소' = 새 비밀번호 입력 페이지.
//  - location.origin: 지금 페이지가 열린 곳의 도메인 (예: http://127.0.0.1:5500 또는 https://내앱.vercel.app)
//  - 뒤에 폴더 경로를 붙여 reset.html을 정확히 가리킵니다.
//  ⚠️ 이 주소(redirectTo)는 Supabase 대시보드 → Authentication → URL Configuration의
//     'Redirect URLs'에 등록돼 있어야 메일 링크가 막히지 않고 정상 작동합니다.
const REDIRECT_TO =
  location.origin + location.pathname.replace(/forgot\.html$/, "reset.html");

document.getElementById("forgotForm").addEventListener("submit", async (e) => {
  // e.preventDefault(): 폼의 기본 동작(페이지 새로고침)을 막는 이유 —
  // 새로고침되면 우리가 짠 JS가 중단되고 입력값도 날아가므로, 화면 안에서 처리하려고 막습니다.
  e.preventDefault();
  msgEl.classList.remove("show");

  // .trim(): 이메일 앞뒤에 실수로 들어간 공백을 제거 —
  // " me@x.com "처럼 공백이 붙으면 발송이 실패할 수 있어 미리 정리합니다.
  const email = document.getElementById("email").value.trim();

  // 재설정 메일 발송. redirectTo로 '메일 링크를 누르면 어디로 돌아올지'를 지정합니다.
  const { error } = await db.auth.resetPasswordForEmail(email, {
    redirectTo: REDIRECT_TO,
  });

  if (error) {
    msgEl.textContent = "메일 발송 실패: " + error.message;
    msgEl.classList.add("show");
    return;
  }

  // 보안 메모: 성공이든(가입된 메일이든) 아니든 똑같은 안내를 보여줍니다.
  // "그 이메일은 가입 안 됐어요" 같은 말을 띄우면, 어떤 이메일이 우리 서비스에
  // 가입돼 있는지 외부인이 알아낼 수 있어(계정 존재 노출) 위험합니다.
  sentEmail.textContent = email;
  sentBox.hidden = false;
});
