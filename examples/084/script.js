// =========================================================
// 다크모드 + localStorage(설정 기억하기) 스크립트
//
// 052번 예제는 버튼으로 테마를 바꾸기만 했습니다.
// 이번 084번 예제는 여기에 "기억" 기능을 더합니다.
//
//   - localStorage.setItem("theme", "dark")  -> 선택을 저장
//   - localStorage.getItem("theme")          -> 저장된 값을 꺼냄
//
// localStorage 는 브라우저가 가진 작은 메모장 같은 저장소입니다.
// 한 번 적어 두면 새로고침하거나 브라우저를 껐다 켜도 값이 남아 있습니다.
// (이름표 "theme" 아래에 글자 한 줄을 저장하는 구조입니다.)
// =========================================================

// 1) 우리가 조작할 요소들을 화면에서 찾아 변수에 담는다.
const root = document.documentElement;      // <html> 태그
const button = document.getElementById("themeToggle");
const icon = button.querySelector(".icon");
const label = button.querySelector(".label");

// localStorage 에 저장할 때 쓸 이름표(키). 오타를 막으려고 상수로 따로 둔다.
const STORAGE_KEY = "theme";

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

// 3) 테마를 실제로 적용하는 함수: 화면을 바꾸고 + 저장까지 한 번에 한다.
function applyTheme(theme) {
  // (1) <html data-theme="..."> 값을 바꾼다. -> CSS 변수가 통째로 교체됨
  root.setAttribute("data-theme", theme);

  // (2) 버튼 표시도 새 테마에 맞춰 갱신한다.
  updateButton(theme);

  // (3) 선택한 테마를 브라우저에 저장한다. -> 새로고침해도 기억됨
  localStorage.setItem(STORAGE_KEY, theme);
}

// 4) 버튼을 클릭할 때마다 테마를 반대로 뒤집는다.
button.addEventListener("click", function () {
  // 현재 data-theme 값을 읽는다. (없으면 light 로 간주)
  const current = root.getAttribute("data-theme") || "light";

  // light 면 dark 로, dark 면 light 로 정한다.
  const next = current === "light" ? "dark" : "light";

  // 화면 적용 + 저장을 한 번에 처리한다.
  applyTheme(next);
});

// 5) 페이지가 처음 열렸을 때, 저장된 테마를 꺼내 와 복원한다.
//    - 저장된 값이 있으면 그 값을, 없으면(첫 방문) "light" 를 쓴다.
//    (head 의 깜빡임 방지 스크립트가 data-theme 는 이미 맞춰 두었지만,
//     버튼 아이콘/글자까지 정확히 맞추기 위해 여기서 한 번 더 정리한다.)
const savedTheme = localStorage.getItem(STORAGE_KEY) || "light";
applyTheme(savedTheme);
