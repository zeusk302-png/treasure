// 이 파일은 "버튼을 키보드로 눌렀을 때 진짜로 동작하는지" 확인하기 위한
// 아주 간단한 동작만 담고 있습니다. 접근성의 핵심은 style.css 의 :focus-visible 이고,
// 여기서는 Enter/Space로 버튼이 눌리는지 체감하는 용도입니다.

// 1) '인사하기' 버튼: 누르면 안내 문구를 띄웁니다.
const helloBtn = document.getElementById("hello-btn");
const statusEl = document.getElementById("status");

helloBtn.addEventListener("click", () => {
  // textContent 로 글자를 넣는 이유: 사용자가 보거나 입력한 값을 화면에 쓸 때
  // innerHTML 을 쓰면 그 안의 <script> 같은 태그가 진짜로 실행될 수 있어(XSS) 위험합니다.
  // textContent 는 글자 그대로만 넣어 주므로 안전합니다.
  statusEl.textContent = "안녕하세요! 키보드(Enter/Space)로도 잘 눌렸어요. ✅";
});

// 2) '클릭 수' 버튼: 누를 때마다 숫자가 1씩 올라갑니다.
const countBtn = document.getElementById("count-btn");
const countEl = document.getElementById("count");
let count = 0;

countBtn.addEventListener("click", () => {
  count += 1;
  countEl.textContent = count;
});

// 3) 문의 폼: 보내기를 눌러도 새로고침되지 않게 막고, 결과만 표시합니다.
const form = document.getElementById("contact-form");
const formResult = document.getElementById("form-result");

form.addEventListener("submit", (event) => {
  // event.preventDefault() 를 부르는 이유: 폼은 기본적으로 제출되면
  // 페이지를 새로고침(서버로 이동)해 버립니다. 여기선 보낼 서버가 없고
  // 화면 안내만 보여 줄 거라, 그 기본 동작을 막아 새로고침을 멈춥니다.
  event.preventDefault(); // 실제 전송 대신 화면 안내만
  const name = document.getElementById("name").value.trim();
  formResult.textContent = name
    ? `${name}님, 키보드만으로 폼 제출까지 성공했어요! 🎉`
    : "이름을 입력한 뒤 다시 보내 보세요.";
});
