/*
  ============================================================
  실습 320 — 접근성 폼 동작 (script.js)
  ============================================================
  이 파일은 무엇인가:
    - 제출할 때 입력값을 검사하고, 문제가 있으면 "스크린리더가 읽어주는" 친절한 에러 안내를 띄웁니다.
    - 문제가 없으면 성공 메시지를 보여줍니다.
  왜 이렇게 만드는가 (접근성 관점에서 중요한 결정들):
    1) 에러가 나면 "첫 번째 잘못된 칸으로 포커스를 옮긴다" → 키보드 사용자가 바로 고칠 수 있게.
    2) 에러 메시지는 role="alert" 영역(HTML에 미리 둠)에 글자만 채운다 → 스크린리더가 즉시 읽음.
    3) 잘못된 칸엔 aria-invalid="true"를 켠다 → 보조기기가 "오류 있는 입력"이라고 알림.
    4) 사용자가 친 글자는 textContent로만 출력 → innerHTML로 넣으면 <script>가 실행될 수 있어 XSS 위험.
*/

// 폼과 결과 영역을 한 번만 찾아둡니다(매번 찾지 않게 — 약간의 효율 + 코드가 읽기 쉬움).
const form = document.getElementById("signup-form");
const result = document.getElementById("result");

/*
  한 입력칸의 에러를 "표시"하는 도우미 함수.
  - field: 입력 요소(input)
  - errorEl: 그 칸의 에러 메시지를 담을 <p role="alert"> 요소
  - message: 사람에게 보여줄 한국어 안내
  왜 함수로 묶나 - 칸마다 같은 처리를 반복하니 한곳에 모아 실수를 줄입니다.
*/
function showError(field, errorEl, message) {
  errorEl.textContent = message;          // role="alert" 영역에 글자 채움 → 스크린리더가 즉시 읽음
  if (field) {
    field.classList.add("invalid");       // 빨강 테두리(눈으로 보는 사람용 신호)
    field.setAttribute("aria-invalid", "true"); // 보조기기에 "이 칸 오류" 알림
  }
}

/*
  한 입력칸의 에러를 "지우는" 도우미.
  검사 통과 시 호출해, 이전에 떴던 빨강/메시지를 깨끗이 되돌립니다.
*/
function clearError(field, errorEl) {
  errorEl.textContent = "";
  if (field) {
    field.classList.remove("invalid");
    field.removeAttribute("aria-invalid");
  }
}

// 제출 순간을 가로채 우리가 만든 검증을 돌립니다.
form.addEventListener("submit", function (event) {
  // 기본 동작(페이지 새로고침/이동)을 막습니다. 이유 - 우리가 검사하고 안내까지 직접 처리하려고.
  event.preventDefault();

  // 검사할 칸들을 가져옵니다.
  const name = document.getElementById("name");
  const email = document.getElementById("email");
  const agree = document.getElementById("agree");
  const modeChecked = form.querySelector('input[name="mode"]:checked'); // 라디오는 '선택된 것'을 찾음

  // 검사 시작 전, 지난 결과 메시지와 에러를 모두 비웁니다(깨끗한 상태에서 다시 검사).
  result.textContent = "";
  clearError(name, document.getElementById("name-error"));
  clearError(email, document.getElementById("email-error"));
  clearError(null, document.getElementById("mode-error"));
  clearError(agree, document.getElementById("agree-error"));

  // 잘못된 칸 목록을 모읍니다. 첫 번째 칸으로 포커스를 옮기기 위해 순서대로 담습니다.
  const invalidFields = [];

  // 1) 이름: 비어 있으면 안 됨
  if (name.value.trim() === "") {
    showError(name, document.getElementById("name-error"), "이름을 입력해 주세요.");
    invalidFields.push(name);
  }

  // 2) 이메일: 비었거나 형식이 아니면 안 됨
  //    아주 단순한 형식 검사(@ 와 . 포함). 실제 서비스는 서버에서도 한 번 더 검증합니다.
  const emailValue = email.value.trim();
  const emailLooksValid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue);
  if (emailValue === "") {
    showError(email, document.getElementById("email-error"), "이메일을 입력해 주세요.");
    invalidFields.push(email);
  } else if (!emailLooksValid) {
    showError(email, document.getElementById("email-error"), "이메일 형식이 올바르지 않습니다. 예: hong@example.com");
    invalidFields.push(email);
  }

  // 3) 참여 방식: 라디오 중 하나는 골라야 함
  if (!modeChecked) {
    showError(null, document.getElementById("mode-error"), "참여 방식을 선택해 주세요.");
    // 라디오 그룹은 첫 번째 라디오로 포커스를 보냅니다.
    invalidFields.push(form.querySelector('input[name="mode"]'));
  }

  // 4) 동의 체크박스: 체크해야 함
  if (!agree.checked) {
    showError(agree, document.getElementById("agree-error"), "개인정보 수집·이용에 동의해 주세요.");
    invalidFields.push(agree);
  }

  // 잘못된 칸이 하나라도 있으면: 첫 번째 칸으로 포커스 이동 후 멈춤
  if (invalidFields.length > 0) {
    // 이유 - 키보드 사용자가 마우스 없이도 곧장 고칠 위치로 갈 수 있게 합니다.
    invalidFields[0].focus();
    return;
  }

  // 모두 통과: 성공 메시지.
  // ★ 사용자가 친 이름을 보여줄 때 textContent로만 넣습니다 ★
  // 이유 - innerHTML로 넣으면 이름칸에 <img onerror=...> 같은 걸 넣었을 때 코드가 실행될 수 있습니다(XSS).
  //        textContent는 그냥 '글자'로만 취급해 안전합니다.
  result.textContent = name.value.trim() + " 님, 신청이 접수되었습니다. 감사합니다!";

  // 성공 후 폼을 비워, 다음 사람이 깨끗한 상태에서 쓰게 합니다.
  form.reset();
});

/*
  보너스: 사용자가 잘못된 칸을 고치려고 다시 입력하면, 그 칸의 에러 표시를 바로 지웁니다.
  이유 - "방금 고쳤는데 빨간 줄이 그대로네?"라는 답답함을 줄이고, 실시간으로 진행 상황을 알려줍니다.
*/
["name", "email"].forEach(function (id) {
  const el = document.getElementById(id);
  el.addEventListener("input", function () {
    clearError(el, document.getElementById(id + "-error"));
  });
});
