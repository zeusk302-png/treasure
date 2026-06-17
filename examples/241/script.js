// =============================================================
//  다크모드 선택을 localStorage에 저장해 새로고침해도 유지하기
//  ─ 이 파일이 이번 실습의 "결과물"입니다.
// =============================================================
//
//  큰 그림 (3단계):
//   1) 페이지가 열리면 → 예전에 저장해 둔 테마를 읽어 와 화면에 적용한다.
//   2) 버튼을 누르면   → 테마를 반대로 바꾸고, 그 선택을 localStorage에 저장한다.
//   3) 그래서 새로고침/재방문해도 → 다시 1)이 실행되어 같은 화면을 보여 준다.
//
//  ※ localStorage 는 "브라우저 안의 작은 메모장"입니다.
//     - localStorage.setItem("이름", "값")  → 메모장에 적기 (저장)
//     - localStorage.getItem("이름")         → 메모장에서 읽기 (불러오기)
//     적어 둔 값은 탭을 닫거나 컴퓨터를 꺼도 그대로 남아 있습니다.
// =============================================================


// 저장할 때 쓸 "메모의 이름표"입니다.
// 이름을 한 곳에 정해 두면 오타로 다른 이름에 저장하는 실수를 막을 수 있습니다.
const STORAGE_KEY = "theme";

// 화면에서 다룰 요소들을 미리 이름표(id)로 찾아 둡니다.
const root = document.documentElement;                 // <html> 태그. 여기에 data-theme 표시를 붙입니다.
const toggleButton = document.getElementById("theme-toggle"); // 테마 전환 버튼
const savedValueText = document.getElementById("saved-value"); // 저장된 값을 보여 줄 칸(학습용)


/**
 * 받은 테마("light" 또는 "dark")를 실제 화면에 적용합니다.
 * - <html>에 data-theme 표시를 붙이면 style.css가 알아서 색을 바꿉니다.
 * - 버튼 글자도 다음에 누르면 어떻게 될지 안내하도록 바꿉니다.
 */
function applyTheme(theme) {
  // <html data-theme="dark"> 또는 <html data-theme="light"> 모양이 됩니다.
  root.setAttribute("data-theme", theme);

  if (theme === "dark") {
    // 지금 어두우니, 누르면 밝아진다는 뜻으로 해 아이콘을 보여 줍니다.
    toggleButton.textContent = "☀️ 밝게";
  } else {
    // 지금 밝으니, 누르면 어두워진다는 뜻으로 달 아이콘을 보여 줍니다.
    toggleButton.textContent = "🌙 어둡게";
  }
}


/**
 * 지금 localStorage에 저장된 값을 화면 아래 칸에 그대로 보여 줍니다. (학습 확인용)
 */
function showSavedValue() {
  const saved = localStorage.getItem(STORAGE_KEY);
  // 아직 한 번도 저장한 적이 없으면 getItem은 null(값 없음)을 돌려줍니다.
  savedValueText.textContent = saved === null ? "(아직 없음 — 기본값 light)" : saved;
}


// ── 1단계: 페이지가 열리자마자 실행되는 부분 ──────────────────
// 예전에 저장해 둔 테마를 읽어 옵니다. 저장된 적이 없으면 기본값 "light"를 씁니다.
const savedTheme = localStorage.getItem(STORAGE_KEY) || "light";
applyTheme(savedTheme);  // 읽어 온 값을 곧바로 화면에 적용 → 새로고침해도 유지되는 핵심
showSavedValue();        // 저장된 값을 화면에 표시


// ── 2단계: 버튼을 누를 때마다 실행되는 부분 ──────────────────
toggleButton.addEventListener("click", function () {
  // 지금 <html>에 붙어 있는 표시를 읽어 현재 테마를 알아냅니다.
  const currentTheme = root.getAttribute("data-theme");

  // 현재가 dark면 light로, 아니면 dark로 — 즉 반대로 뒤집습니다.
  const nextTheme = currentTheme === "dark" ? "light" : "dark";

  applyTheme(nextTheme);                       // 화면을 바로 바꾸고
  localStorage.setItem(STORAGE_KEY, nextTheme); // 선택을 메모장에 저장합니다 (← 유지의 비결)
  showSavedValue();                            // 저장된 값 표시를 갱신
});
