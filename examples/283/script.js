// index.html 에서 <script src="script.js" defer></script> 로 불러온다.
// defer 덕분에 이 코드는 "HTML을 다 읽은 뒤"에 실행된다.
// 그래서 아래 getElementById 들은 모두 진짜 요소를 찾는다(= null 이 아니다).

const button = document.getElementById("greetBtn");
const nameInput = document.getElementById("nameInput");
const result = document.getElementById("result");

button.addEventListener("click", function () {
  // 입력칸이 비어 있으면 안내만 하고 끝낸다.
  const name = nameInput.value.trim();
  if (name === "") {
    result.textContent = "이름을 먼저 입력해 주세요.";
    return;
  }
  result.textContent = name + "님, 안녕하세요!";
});
