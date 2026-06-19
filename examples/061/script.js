// 이 파일(script.js): 눈 버튼을 누르면 비밀번호를 보였다/가렸다 하는 '동작'을 담당합니다.
// - 무엇: 입력칸의 type을 password(가림) ↔ text(보임)로 뒤집고, 아이콘과 접근성 안내도 같이 바꿉니다.
// - 왜 있나: HTML은 모양만 그릴 뿐 '클릭하면 무슨 일이 일어날지'는 자바스크립트가 정해야 하기 때문입니다.
// - 핵심: 비밀번호 자체를 지우거나 다시 만드는 게 아니라, '표시 방식(type)'만 바꾸는 것이라 안전합니다.

// 1) 화면에서 필요한 요소 3개를 찾아옵니다
const passwordInput = document.getElementById("password"); // 비밀번호 입력칸
const toggleBtn = document.getElementById("toggleBtn"); // 눈 버튼
const toggleIcon = document.getElementById("toggleIcon"); // 버튼 안의 아이콘

// 2) 눈 버튼을 클릭하면 실행할 동작을 연결합니다
toggleBtn.addEventListener("click", function () {
  // 지금 입력칸이 가려진 상태(password)인지 확인합니다
  const isHidden = passwordInput.type === "password";

  if (isHidden) {
    // 가려져 있었다면 -> 글자로 보이게 바꿉니다 (핵심!)
    passwordInput.type = "text";
    toggleIcon.textContent = "🙉"; // 보이는 상태 아이콘
    toggleBtn.setAttribute("aria-label", "비밀번호 가리기");
    toggleBtn.setAttribute("aria-pressed", "true");
  } else {
    // 보이고 있었다면 -> 다시 점(●●●)으로 가립니다
    passwordInput.type = "password";
    toggleIcon.textContent = "🙈"; // 가린 상태 아이콘
    toggleBtn.setAttribute("aria-label", "비밀번호 보기");
    toggleBtn.setAttribute("aria-pressed", "false");
  }

  // 버튼을 눌러도 비밀번호 칸에 커서를 그대로 둬서 이어서 입력할 수 있게 합니다
  passwordInput.focus();
});
