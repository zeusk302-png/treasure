// 이 파일(script.js): 화면의 '동작'을 담당합니다.
// 핵심 흐름은 "체크박스 상태(checked)를 읽어 → 버튼의 비활성화(disabled)를 바꾼다" 한 가지입니다.
// 한 요소의 상태에 따라 다른 요소를 제어하는 가장 기본적인 패턴이라, 폼(form) 만들기의 기초가 됩니다.

// 1) 화면에서 필요한 요소를 찾아옵니다
const agreeCheck = document.getElementById("agreeCheck"); // 약관 동의 체크박스
const signupBtn = document.getElementById("signupBtn"); // 가입하기 버튼
const result = document.getElementById("result"); // 가입 결과 안내 문구 자리

// 2) 체크박스에 "change" 이벤트를 연결합니다.
//    change 이벤트는 체크박스가 켜지거나(체크) 꺼질(해제) 때마다 발생합니다.
agreeCheck.addEventListener("change", function () {
  // agreeCheck.checked : 체크박스가 켜져 있으면 true, 꺼져 있으면 false 입니다.
  //
  // 버튼의 disabled(비활성화) 속성은 다음과 같이 정합니다.
  //   - 체크됨(checked = true)  -> 버튼을 눌러야 하므로 disabled = false
  //   - 체크 안 됨(checked = false) -> 버튼을 막아야 하므로 disabled = true
  //
  // 즉 "체크의 반대"가 곧 "비활성화 여부"이므로 ! (느낌표, 반대) 를 붙입니다.
  signupBtn.disabled = !agreeCheck.checked;
});

// 3) 가입 버튼을 눌렀을 때의 동작을 연결합니다.
//    버튼이 disabled(비활성화)일 때는 클릭해도 이 동작이 실행되지 않습니다.
signupBtn.addEventListener("click", function () {
  result.textContent = "가입이 완료되었습니다! (예제이므로 실제 저장은 되지 않아요)";
});
