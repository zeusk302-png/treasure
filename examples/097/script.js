// ============================================
// 비밀번호 보기/숨기기 토글
// 핵심 개념: input의 type 속성 변경 + click 이벤트 + 토글
// ============================================

// 1) 화면 요소들을 미리 골라 변수에 담아둔다.
const input = document.getElementById("password");      // 비밀번호 입력칸
const toggleBtn = document.getElementById("toggleBtn");  // 눈 버튼
const form = document.getElementById("loginForm");       // 폼(제출 막기용)

// 2) 지금 비밀번호가 "보이는 상태"인지 기억하는 변수.
//    false = 숨김(••••), true = 보임(글자)
let isVisible = false;

// 3) 눈 버튼을 클릭할 때마다 실행되는 함수.
toggleBtn.addEventListener("click", function () {
  // (A) 상태를 반대로 뒤집는다. true ↔ false (이것이 "토글"이다)
  isVisible = !isVisible;

  if (isVisible) {
    // (B) 보임 상태: input의 type을 "text"로 바꾸면 글자가 그대로 보인다.
    input.type = "text";
    toggleBtn.textContent = "🙈";        // 아이콘을 "가리기" 모양으로 변경
    toggleBtn.classList.add("on");        // 버튼을 강조색으로
    toggleBtn.setAttribute("aria-label", "비밀번호 숨기기");
    toggleBtn.setAttribute("aria-pressed", "true");
  } else {
    // (C) 숨김 상태: type을 "password"로 되돌리면 다시 점(••••)으로 가려진다.
    input.type = "password";
    toggleBtn.textContent = "👁";         // 아이콘을 "보기" 모양으로 변경
    toggleBtn.classList.remove("on");     // 강조색 해제
    toggleBtn.setAttribute("aria-label", "비밀번호 보기");
    toggleBtn.setAttribute("aria-pressed", "false");
  }

  // (D) 버튼을 눌러도 커서가 입력칸에 머물도록 다시 포커스를 준다(편의 기능).
  input.focus();
});

// 4) 제출(Submit) 시: 페이지 새로고침을 막는다(데모이므로 실제 전송은 하지 않음).
//    실제 서비스라면 이 자리에서 서버(예: Supabase)로 로그인 요청을 보낸다.
form.addEventListener("submit", function (event) {
  event.preventDefault(); // 폼 기본 동작(새로고침) 막기
  alert("로그인 시도! (실제 전송은 다음 단계에서 연결합니다)");
});
