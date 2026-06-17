// 이 파일은 "버튼을 누르면 다크모드를 켜고 끄는" 동작을 담당합니다.
// HTML(구조) → CSS(모양) → JS(동작) 순서로 역할이 나뉘어 있습니다.
//
// 흐름 한눈에 보기:
//   1) 화면에서 토글 버튼을 찾는다.
//   2) 버튼이 '클릭되면' <body>에 'dark' 클래스를 붙였다 뗀다(toggle).
//   3) 'dark' 클래스가 붙으면 style.css의 body.dark 색이 적용돼 화면이 어두워진다.
//   4) 상태에 맞게 버튼 글자(🌙/☀️)를 바꿔 준다.

// 1) 버튼을 찾는다.
//    index.html의 <button id="theme-toggle"> 를 id로 골라 옵니다.
//    (id는 페이지에서 유일한 이름표라, getElementById로 정확히 하나만 집어옵니다.)
const toggleButton = document.getElementById("theme-toggle");

// 2) 버튼에 "클릭되면 이 함수를 실행해 달라"고 약속을 겁니다. (= 이벤트 등록)
//    'click'은 마우스로 누르거나, 키보드로 버튼을 활성화했을 때 발생하는 이벤트입니다.
toggleButton.addEventListener("click", function () {
  // classList.toggle: 클래스가 없으면 붙이고, 있으면 뗍니다.
  //   → 버튼을 누를 때마다 dark가 붙었다 떨어졌다 하며 라이트↔다크가 번갈아 바뀝니다.
  // 반환값 isDark: 이번 토글 결과로 dark가 "붙어 있으면 true", "없으면 false".
  const isDark = document.body.classList.toggle("dark");

  // 3) 화면 상태(다크/라이트)에 맞게 버튼 글자와 보조기기용 속성을 갱신합니다.
  updateButton(isDark);
});

// 버튼의 보이는 글자와 aria-pressed(보조기기용 눌림 상태)를 한곳에서 정리하는 함수.
// 같은 일을 여러 곳에서 반복하지 않도록 함수로 묶어 두었습니다.
function updateButton(isDark) {
  if (isDark) {
    // 지금 다크모드라면: "다시 누르면 라이트로 간다"는 의미로 ☀️ 라이트모드를 보여줍니다.
    toggleButton.textContent = "☀️ 라이트모드";
    toggleButton.setAttribute("aria-pressed", "true");
  } else {
    // 지금 라이트모드라면: "다시 누르면 다크로 간다"는 의미로 🌙 다크모드를 보여줍니다.
    toggleButton.textContent = "🌙 다크모드";
    toggleButton.setAttribute("aria-pressed", "false");
  }
}

// 참고:
// 지금은 새로고침하면 다시 라이트모드로 돌아갑니다(상태를 저장하지 않기 때문).
// "선택을 기억해서 새로고침해도 유지"하는 방법(localStorage)은 다음 단계 실습에서 배웁니다.
// 이번 실습의 목표는 '이벤트 + 클래스 토글 + CSS 변수'로 화면을 바꾸는 것까지입니다.
