// 이 파일이 무엇인가: 인사말 페이지의 "동작"을 담당하는 자바스크립트입니다.
// 왜 있는가: 입력칸에 적힌 이름을 읽어와(문자열 결합으로) 한 문장을 만들고,
//            그 문장을 화면의 빈 자리에 글자로 넣어 보여주는 흐름을 보여주기 위함입니다.
//            (입력값 읽기 input.value → 문장 만들기 + → 화면 표시 textContent)

// 1) 화면에서 필요한 요소 3개를 찾아옵니다
//    왜 미리 찾아두나: 버튼을 누를 때마다 다시 찾지 않고 한 번 찾아 변수에 보관해 두면
//    코드가 짧고 빨라집니다(같은 요소를 반복해서 검색할 필요가 없음).
const nameInput = document.getElementById("nameInput"); // 이름을 적는 입력칸
const greetBtn = document.getElementById("greetBtn"); // 인사하기 버튼
const result = document.getElementById("result"); // 인사말이 표시될 자리

// 2) 인사말을 만들어 화면에 보여주는 함수
function showGreeting() {
  // input.value : 입력칸에 적힌 글자를 읽어옵니다 (이게 핵심!)
  // .trim() : 실수로 앞뒤에 넣은 빈 칸(스페이스)을 지웁니다
  const name = nameInput.value.trim();

  // 아무것도 안 적었으면 안내 문구를 보여주고 멈춥니다
  if (name === "") {
    result.textContent = "이름을 먼저 입력해 주세요.";
    nameInput.focus(); // 다시 입력칸에 커서를 둡니다
    return;
  }

  // 문자열 결합 : 글자 + 변수 + 글자 를 이어 붙여 한 문장을 만듭니다
  // textContent로 출력하는 이유: 사용자가 적은 값을 '순수 글자'로만 넣어줍니다.
  // 만약 innerHTML로 넣으면 사용자가 적은 <script> 같은 태그가 진짜 코드로 실행될 수 있어(XSS 위험)
  // 보안을 위해 항상 textContent를 씁니다.
  result.textContent = name + "님, 안녕하세요!";
}

// 3) 버튼을 클릭하면 인사말을 만듭니다
greetBtn.addEventListener("click", showGreeting);

// 4) (편의) 입력칸에서 엔터키를 눌러도 버튼을 누른 것과 똑같이 동작하게 합니다
nameInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") {
    showGreeting();
  }
});
