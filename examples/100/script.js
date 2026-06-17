// ============================================
// 제출 막고 직접 검사 후 에러 모아 보여주기 (preventDefault)
// 핵심 개념: submit 이벤트 가로채기 + 일괄 검증 + 에러 모아 보여주기
// ============================================

// 1) 화면 요소들을 미리 골라 변수에 담아둔다.
const form = document.getElementById("signupForm");            // 폼 전체
const name = document.getElementById("name");                  // 이름 입력칸
const email = document.getElementById("email");                // 이메일 입력칸
const password = document.getElementById("password");          // 비밀번호 입력칸
const passwordConfirm = document.getElementById("passwordConfirm"); // 비밀번호 확인
const agree = document.getElementById("agree");                // 약관 동의 체크박스

const errorBox = document.getElementById("errorBox");          // 에러를 모아 보여줄 박스
const errorList = document.getElementById("errorList");        // 에러 문장들이 들어갈 목록(ul)
const successText = document.getElementById("successText");     // 성공 메시지

// 이메일 형식을 검사할 정규식 (간단 버전): "글자@글자.글자"
const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// 2) 폼이 제출(submit)될 때 실행할 함수.
//    버튼을 누르거나 입력칸에서 Enter 를 쳐도 submit 이벤트가 발생한다.
function handleSubmit(event) {
  // (1) 핵심! 브라우저의 기본 동작(페이지 새로고침/이동)을 막는다.
  //     이걸 안 하면 화면이 깜빡 새로고침되며 우리가 만든 검사가 보일 새도 없이 사라진다.
  event.preventDefault();

  // (2) 검사를 시작하기 전, 이전에 표시했던 에러 흔적을 모두 지운다(초기화).
  const errors = [];                 // 이번에 모을 에러 문장들을 담을 빈 배열
  errorList.innerHTML = "";          // 지난번 에러 목록 비우기
  clearInvalid();                    // 모든 칸의 빨간 테두리 제거
  successText.hidden = true;         // 성공 메시지 숨기기

  // (3) 칸을 하나씩 직접 검사한다.
  //     실패하면 errors 배열에 문장을 push 하고, 그 칸에 빨간 테두리(markInvalid)를 표시한다.
  //     return 하지 않고 끝까지 검사해야 "모든" 문제를 한 번에 모을 수 있다.

  // 이름: 비어 있으면 안 된다. (trim 으로 앞뒤 공백 제거 후 검사)
  if (name.value.trim() === "") {
    errors.push("이름을 입력해 주세요.");
    markInvalid(name);
  }

  // 이메일: 비어 있거나 형식(@ 와 . 포함)이 맞지 않으면 안 된다.
  if (email.value.trim() === "") {
    errors.push("이메일을 입력해 주세요.");
    markInvalid(email);
  } else if (!emailPattern.test(email.value.trim())) {
    errors.push("이메일 형식이 올바르지 않습니다. (예: you@example.com)");
    markInvalid(email);
  }

  // 비밀번호: 8자 이상이어야 한다.
  if (password.value.length < 8) {
    errors.push("비밀번호는 8자 이상이어야 합니다.");
    markInvalid(password);
  }

  // 비밀번호 확인: 위에서 적은 비밀번호와 똑같아야 한다.
  if (passwordConfirm.value !== password.value || passwordConfirm.value === "") {
    errors.push("비밀번호 확인이 일치하지 않습니다.");
    markInvalid(passwordConfirm);
  }

  // 약관 동의: 체크되어 있어야 한다. (checked 가 false 면 동의 안 한 것)
  if (!agree.checked) {
    errors.push("이용약관에 동의해 주세요.");
  }

  // (4) 검사 결과로 화면을 정한다.
  if (errors.length > 0) {
    // 문제가 하나라도 있으면: 에러 문장들을 목록(li)으로 만들어 박스에 넣고 보여준다.
    errors.forEach(function (message) {
      const li = document.createElement("li"); // 새 <li> 만들기
      li.textContent = message;                // 그 안에 에러 문장 넣기
      errorList.appendChild(li);               // 목록(ul)에 붙이기
    });
    errorBox.hidden = false;                   // 에러 박스 보이기

    // 첫 번째로 잘못된 칸으로 화면을 이동시켜 사용자가 바로 고치게 돕는다.
    const firstInvalid = document.querySelector("input.invalid");
    if (firstInvalid) firstInvalid.focus();
  } else {
    // 모두 통과! 에러 박스는 숨기고 성공 메시지를 보여준다.
    errorBox.hidden = true;
    successText.hidden = false;

    // (실제 서비스라면) 이 시점에 입력값을 서버(예: Supabase)로 안전하게 보낸다.
    // 비밀번호 같은 비밀값은 화면 코드(JS)에 절대 적어 두지 않는다.
    // form.submit(); // ← 진짜 제출이 필요할 때 주석을 푼다. (이 연습에서는 사용 안 함)
  }
}

// 3) 특정 입력칸에 빨간 테두리 클래스를 붙이는 도우미 함수.
function markInvalid(input) {
  input.classList.add("invalid");
}

// 4) 모든 입력칸의 빨간 테두리 클래스를 한꺼번에 떼는 도우미 함수.
function clearInvalid() {
  const inputs = document.querySelectorAll("input.invalid");
  inputs.forEach(function (input) {
    input.classList.remove("invalid");
  });
}

// 5) 폼의 submit 이벤트에 위 함수를 연결한다.
//    click 이 아니라 submit 에 거는 이유: 버튼 클릭뿐 아니라
//    입력칸에서 Enter 를 눌러 제출하는 경우까지 모두 잡을 수 있기 때문이다.
form.addEventListener("submit", handleSubmit);
