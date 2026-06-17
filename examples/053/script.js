// =========================================================
// 새로고침해도 유지되고 OS 설정을 따르는 다크모드
//
// 이번 실습의 두 가지 새 개념:
//   (1) localStorage  : 브라우저에 작은 메모를 저장하는 공간.
//                       새로고침하거나 브라우저를 껐다 켜도 남아 있습니다.
//                       여기에 사용자가 고른 테마("light"/"dark")를 적어 둡니다.
//   (2) prefers-color-scheme : 운영체제(OS)가 다크모드인지 알려주는 신호.
//                       사용자가 한 번도 고른 적이 없을 때, OS 설정을 따릅니다.
//
// 테마를 정하는 우선순위:
//   1순위) 내가 저장해 둔 선택값 (localStorage)
//   2순위) OS 설정 (prefers-color-scheme)
//   3순위) 그래도 없으면 light
//
// 참고: 첫 화면을 깜빡임 없이 그리기 위해, "처음 테마 적용"은 이미
//       index.html 의 <head> 안 작은 스크립트가 먼저 해 두었습니다.
//       이 파일은 "버튼 클릭으로 바꾸고 저장하는" 나머지 일을 맡습니다.
// =========================================================

// 1) 우리가 조작할 요소들을 화면에서 찾아 변수에 담는다.
const root = document.documentElement;          // <html> 태그
const button = document.getElementById("themeToggle");
const icon = button.querySelector(".icon");
const label = button.querySelector(".label");

// localStorage 안에서 사용할 "메모지 이름". 오타를 막으려고 상수로 둡니다.
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

// 3) 테마를 실제로 적용하는 함수.
//    - <html data-theme="..."> 값을 바꾸고
//    - localStorage 에 저장해 새로고침해도 유지되게 하고
//    - 버튼 표시도 갱신한다.
function applyTheme(theme) {
  root.setAttribute("data-theme", theme);   // CSS 변수가 통째로 교체됨
  localStorage.setItem(STORAGE_KEY, theme); // 다음 방문에도 기억하도록 저장
  updateButton(theme);                      // 버튼 아이콘/글자 갱신
}

// 4) 버튼을 클릭할 때마다 테마를 반대로 뒤집는다.
button.addEventListener("click", function () {
  // 현재 data-theme 값을 읽는다. (없으면 light 로 간주)
  const current = root.getAttribute("data-theme") || "light";
  // light 면 dark 로, dark 면 light 로 정한다.
  const next = current === "light" ? "dark" : "light";
  // 새 테마를 적용하고 저장한다.
  applyTheme(next);
});

// 5) 페이지가 열렸을 때, 지금 적용된 테마에 맞게 버튼 표시를 한 번 맞춘다.
//    (테마 자체는 head 스크립트가 이미 적용했고, 여기서는 버튼만 동기화)
updateButton(root.getAttribute("data-theme") || "light");

// 6) (보너스) 사용자가 "직접 고른 적이 없을 때"만 OS 설정 변화를 실시간 반영.
//    예: 노트북이 밤이 되어 OS가 자동으로 다크로 바뀌면 페이지도 함께 바뀜.
//    이미 버튼으로 고른 사람은 그 선택을 존중해 건드리지 않는다.
const osThemeQuery = window.matchMedia("(prefers-color-scheme: dark)");
osThemeQuery.addEventListener("change", function (event) {
  const hasUserChoice = localStorage.getItem(STORAGE_KEY) !== null;
  if (hasUserChoice) {
    return; // 사용자가 이미 골랐으면 OS 변화를 무시한다.
  }
  // 저장된 선택이 없을 때만 OS 신호를 따라 화면을 바꾼다.
  const osTheme = event.matches ? "dark" : "light";
  root.setAttribute("data-theme", osTheme);
  updateButton(osTheme);
  // 주의: 여기서는 localStorage 에 저장하지 않는다.
  //       저장해 버리면 "OS를 따른다"는 상태가 사라지기 때문이다.
});
