// index.html 에서 <script src="script.js" defer></script> 로 불러온다.
// defer 덕분에 이 코드는 "HTML을 다 읽은 뒤"에 실행된다.
// 그래서 아래 getElementById 들은 모두 진짜 요소를 찾는다(= null 이 아니다).

const button = document.getElementById("greetBtn");
const nameInput = document.getElementById("nameInput");
const result = document.getElementById("result");

button.addEventListener("click", function () {
  // 입력칸이 비어 있으면 안내만 하고 끝낸다.
  // .trim() 으로 앞뒤 공백을 떼는 이유: 사용자가 스페이스만 쳤을 때도 "빈 값"으로 처리하기 위해서다.
  const name = nameInput.value.trim();
  if (name === "") {
    result.textContent = "이름을 먼저 입력해 주세요.";
    return;
  }
  // 화면 출력에 innerHTML 이 아니라 textContent 를 쓰는 이유(중요):
  // 사용자가 입력칸에 <script>...</script> 같은 코드를 넣어도 textContent 는 그냥 "글자"로만 보여준다.
  // 만약 innerHTML 을 쓰면 그 입력이 실제 코드로 실행될 수 있어(XSS 보안 취약점) 위험하다.
  result.textContent = name + "님, 안녕하세요!";
});
