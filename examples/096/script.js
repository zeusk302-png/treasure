// ============================================
// 이메일 실시간 검증
// 핵심 개념: input 이벤트 + 정규식 test() + 실시간 피드백
// ============================================

// 1) 화면 요소들을 미리 골라 변수에 담아둔다.
const input = document.getElementById("email");
const icon = document.getElementById("icon");
const message = document.getElementById("message");
const submitBtn = document.getElementById("submitBtn");
const form = document.getElementById("emailForm");

// 2) 이메일 형식을 검사하는 정규식(패턴).
//    뜻: (공백·@ 아닌 글자) @ (공백·@ 아닌 글자) . (글자 2개 이상)
//    예: hong@example.com 은 통과, hong@com 은 실패.
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// 3) "입력할 때마다" 실행되는 함수.
//    input 이벤트는 키를 누르거나 붙여넣기 등 값이 바뀔 때마다 발생한다.
input.addEventListener("input", function () {
  const value = input.value.trim(); // 앞뒤 공백 제거

  // (A) 아직 아무것도 안 적었을 때 → 모든 표시를 비운다(중립 상태).
  if (value === "") {
    setNeutral();
    return; // 여기서 함수를 끝낸다.
  }

  // (B) 정규식.test(값) → 형식이 맞으면 true, 아니면 false 를 돌려준다.
  if (emailPattern.test(value)) {
    setValid();   // 통과 표시(초록 체크)
  } else {
    setInvalid(); // 실패 표시(빨강 안내)
  }
});

// 4) 제출(Submit) 시: 페이지 새로고침을 막고 통과한 경우에만 안내.
//    실제 서비스라면 이 자리에서 서버(예: Supabase)로 값을 보낸다.
form.addEventListener("submit", function (event) {
  event.preventDefault(); // 폼 기본 동작(새로고침) 막기

  if (emailPattern.test(input.value.trim())) {
    message.textContent = "가입 완료! (실제 전송은 다음 단계에서 연결합니다)";
    message.className = "message ok";
  }
});

// ----- 상태를 바꾸는 작은 도우미 함수 3개 -----

// 중립: 입력칸이 비어 있을 때
function setNeutral() {
  input.className = "";
  icon.className = "icon";
  icon.textContent = "";
  message.textContent = "";
  message.className = "message";
  submitBtn.disabled = true; // 빈 칸이면 버튼 잠금
}

// 통과: 형식이 맞을 때
function setValid() {
  input.className = "valid";
  icon.className = "icon ok";
  icon.textContent = "✓";
  message.textContent = "올바른 이메일 형식입니다.";
  message.className = "message ok";
  submitBtn.disabled = false; // 버튼 활성화
}

// 실패: 형식이 틀릴 때
function setInvalid() {
  input.className = "invalid";
  icon.className = "icon bad";
  icon.textContent = "✕";
  message.textContent = "이메일 형식이 올바르지 않습니다. (예: hong@example.com)";
  message.className = "message bad";
  submitBtn.disabled = true; // 버튼 잠금
}
