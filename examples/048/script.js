/*
  이 파일은 무엇? : 메뉴를 '열고 닫는 동작(행동)'을 담당하는 JavaScript 파일입니다.
  왜 있나?       : 실제 미끄러지는 애니메이션은 CSS가 하지만, 언제 미끄러질지(누름·닫음)는
                   JS가 결정합니다. 이 파일이 하는 일은 딱 하나로 요약됩니다 —
                   <body>에 'menu-open' 클래스를 붙이거나(열기) 떼는 것(닫기)입니다.
                   클래스 하나로 상태를 켜고 끄면 CSS가 알아서 나머지를 처리하므로,
                   JS 코드가 짧고 이해하기 쉬워집니다.
*/

// ===== 화면 요소 가져오기 =====
const menuBtn = document.getElementById("menuBtn"); // 햄버거 버튼
const closeBtn = document.getElementById("closeBtn"); // 메뉴 안 × 버튼
const overlay = document.getElementById("overlay"); // 어두운 막
const body = document.body; // <body> 전체

// ===== 메뉴 열기 =====
// body에 'menu-open' 클래스를 붙이면 CSS가 메뉴를 미끄러져 들어오게 합니다.
function openMenu() {
  body.classList.add("menu-open");
  // 화면 낭독기 사용자를 위해 "메뉴가 열렸다"고 알려줌
  menuBtn.setAttribute("aria-expanded", "true");
}

// ===== 메뉴 닫기 =====
function closeMenu() {
  body.classList.remove("menu-open");
  menuBtn.setAttribute("aria-expanded", "false");
}

// ===== 이벤트 연결 =====
// 햄버거 버튼을 누르면 메뉴 열기
menuBtn.addEventListener("click", openMenu);

// × 버튼을 누르면 닫기
closeBtn.addEventListener("click", closeMenu);

// 어두운 막을 누르면 닫기
overlay.addEventListener("click", closeMenu);

// 키보드 ESC 키를 누르면 닫기
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    closeMenu();
  }
});
