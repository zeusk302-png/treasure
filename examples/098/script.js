// ============================================
// 비밀번호 확인 일치 검사 (두 칸 비교)
// 핵심 개념: 값 비교(===) + 실시간 검증(input 이벤트) + 에러 토글
// ============================================

// 1) 화면 요소들을 미리 골라 변수에 담아둔다.
const password = document.getElementById("password");   // 비밀번호 칸
const confirm = document.getElementById("confirm");      // 비밀번호 확인 칸
const matchMsg = document.getElementById("matchMsg");    // 안내 메시지 자리
const submitBtn = document.getElementById("submitBtn");  // 가입 버튼
const form = document.getElementById("signupForm");      // 폼(제출 막기용)

// 2) 두 칸을 비교해서 화면을 갱신하는 함수.
//    이 함수 하나가 "검사 → 메시지 → 색깔 → 버튼" 을 한꺼번에 책임진다.
function checkMatch() {
  const pw = password.value;       // 비밀번호 칸에 적힌 글자
  const cf = confirm.value;        // 확인 칸에 적힌 글자

  // (A) 확인 칸이 아직 비어 있으면: 아무 표시도 하지 않고 버튼만 잠근다.
  if (cf === "") {
    matchMsg.textContent = "";
    matchMsg.className = "msg";              // 색깔 클래스 모두 제거
    password.classList.remove("error", "ok");
    confirm.classList.remove("error", "ok");
    submitBtn.disabled = true;               // 버튼 잠금
    return;                                  // 여기서 함수 끝
  }

  // (B) 두 값이 똑같은지 비교한다. (=== 는 "정확히 같은가?" 비교)
  if (pw === cf) {
    // 일치: 초록 메시지 + 초록 테두리 + 버튼 열기
    matchMsg.textContent = "✓ 비밀번호가 일치합니다.";
    matchMsg.className = "msg ok";
    password.classList.remove("error");
    confirm.classList.remove("error");
    password.classList.add("ok");
    confirm.classList.add("ok");
    submitBtn.disabled = false;              // 버튼 활성화
  } else {
    // 불일치: 빨간 메시지 + 빨간 테두리 + 버튼 잠금
    matchMsg.textContent = "✗ 비밀번호가 일치하지 않습니다.";
    matchMsg.className = "msg error";
    password.classList.remove("ok");
    confirm.classList.remove("ok");
    password.classList.add("error");
    confirm.classList.add("error");
    submitBtn.disabled = true;               // 버튼 잠금
  }
}

// 3) 두 칸 모두에 "타이핑할 때마다" 검사하도록 연결한다.
//    input 이벤트는 글자 한 자가 바뀔 때마다 즉시 발생한다(= 실시간 검증).
//    비밀번호 칸을 고쳐도 다시 비교해야 하므로 양쪽 다 연결한다.
password.addEventListener("input", checkMatch);
confirm.addEventListener("input", checkMatch);

// 4) 제출(Submit) 시: 페이지 새로고침을 막는다(데모이므로 실제 전송은 하지 않음).
//    실제 서비스라면 이 자리에서 서버(예: Supabase)로 가입 요청을 보낸다.
form.addEventListener("submit", function (event) {
  event.preventDefault(); // 폼 기본 동작(새로고침) 막기
  alert("가입 완료! (실제 전송은 다음 단계에서 연결합니다)");
});
