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
