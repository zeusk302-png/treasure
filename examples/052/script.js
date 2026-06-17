// =========================================================
// 다크모드 토글 동작 스크립트
//
// 핵심 아이디어:
//   - 색은 CSS 변수(style.css)에 이미 두 벌(라이트/다크) 정의되어 있다.
//   - JS가 하는 일은 단 하나, <html> 태그의 data-theme 값을 바꾸는 것뿐이다.
//   - data-theme="dark" 가 되면 CSS가 알아서 다크 색 변수를 적용한다.
// =========================================================

// 1) 우리가 조작할 요소들을 화면에서 찾아 변수에 담는다.
const root = document.documentElement;      // <html> 태그
const button = document.getElementById("themeToggle");
const icon = button.querySelector(".icon");
const label = button.querySelector(".label");

// 2) 현재 테마에 맞춰 버튼의 아이콘/글자/상태를 정리하는 함수.
function updateButton(theme) {
  if (theme === "dark") {
    icon.textContent = "☀️";        // 다크일 때는 "밝게 돌아가기" 의미의 해
    label.textContent = "라이트모드";
    button.setAttribute("aria-pressed", "true");
  } else {
    icon.textContent = "🌙";        // 라이트일 때는 "어둡게" 의미의 달
    label.textContent = "다크모드";
    button.setAttribute("aria-pressed", "false");
  }
}

// 3) 버튼을 클릭할 때마다 테마를 반대로 뒤집는다.
button.addEventListener("click", function () {
  // 현재 data-theme 값을 읽는다. (없으면 light 로 간주)
  const current = root.getAttribute("data-theme") || "light";

  // light 면 dark 로, dark 면 light 로 정한다.
  const next = current === "light" ? "dark" : "light";

  // <html data-theme="..."> 값을 바꾼다. -> CSS 변수가 통째로 교체됨
  root.setAttribute("data-theme", next);

  // 버튼 표시도 새 테마에 맞춰 갱신한다.
  updateButton(next);
});

// 4) 페이지가 처음 열렸을 때 버튼 표시를 한 번 맞춰 둔다.
updateButton(root.getAttribute("data-theme") || "light");
