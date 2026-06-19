// 이 파일(script.js)은 무엇인가:
//   드롭다운 메뉴의 '동작(두뇌)'을 담당합니다. 버튼을 누르면 열고/닫고,
//   바깥을 누르면 닫고, Esc를 누르면 닫는 규칙을 여기서 정합니다.
// 왜 이 실습의 진짜 주인공이 이 파일인가:
//   "바깥을 클릭하면 닫힌다"를 알아채는 비결이 여기 있습니다. 그 비결은 클릭이
//   누른 곳에서 화면 전체(document)로 퍼져 나가는 '이벤트 버블링'과,
//   그 퍼짐을 멈추는 stopPropagation() 입니다. 아래 2~4번 블록이 그 핵심입니다.

// ===== 1) 화면에서 필요한 요소들을 찾아옵니다 =====
// dropdown: 버튼과 메뉴를 함께 감싼 바깥 박스 (열림/닫힘 표시는 여기에 붙입니다)
// button:   메뉴를 여는 버튼
const dropdown = document.getElementById("dropdown");
const button = document.getElementById("dropdownButton");

// ===== 2) 버튼을 누르면 메뉴를 열고/닫습니다 =====
button.addEventListener("click", function (event) {
  // ▼ 핵심 1: 이벤트 버블링 막기 ▼
  // 클릭은 누른 곳에서 바깥으로 '물결처럼' 퍼져 나갑니다(= 버블링).
  // 즉 버튼을 누르면 그 클릭이 결국 document(문서 전체)까지 전해집니다.
  // 아래 4번에서 "document가 클릭되면 메뉴를 닫아라"라고 해둘 텐데,
  // 막지 않으면 '버튼 클릭 → 열기' 직후 '같은 클릭이 document까지 전해져 → 닫기'가
  // 연달아 일어나 메뉴가 열리자마자 닫혀 버립니다.
  // stopPropagation()은 "이 클릭을 여기서 멈춰라(바깥으로 전하지 마)"라는 뜻입니다.
  event.stopPropagation();

  // is-open 클래스를 켜고 끄며 열림/닫힘을 전환합니다.
  // toggle은 "있으면 떼고, 없으면 붙여라"라는 편리한 명령입니다.
  const isOpen = dropdown.classList.toggle("is-open");

  // 보조기기를 위해, 지금 열렸는지(true)/닫혔는지(false)를 버튼에 표시합니다.
  button.setAttribute("aria-expanded", isOpen ? "true" : "false");
});

// ===== 3) 메뉴 '안쪽'을 클릭했을 때는 닫히지 않게 합니다 =====
// 메뉴 항목을 고르려고 누른 클릭도 결국 document까지 퍼지면 메뉴가 닫힙니다.
// 메뉴 박스 안의 클릭은 여기서 멈춰, "바깥 클릭"으로 오해받지 않게 합니다.
dropdown.addEventListener("click", function (event) {
  event.stopPropagation();
});

// ===== 4) 메뉴 '바깥' 아무 곳이나 클릭하면 닫습니다 =====
// document(문서 전체)에 클릭 감지를 답니다.
// 위 2·3번에서 막지 않은 클릭만 여기까지 도달합니다.
// 즉 여기로 도달했다는 것은 = 드롭다운 바깥을 눌렀다는 뜻이므로 닫으면 됩니다.
document.addEventListener("click", function () {
  dropdown.classList.remove("is-open");
  button.setAttribute("aria-expanded", "false");
});

// ===== 5) (보너스) 키보드 Esc 키를 눌러도 닫히게 합니다 =====
// 마우스 없이 키보드만 쓰는 사용자를 위한 배려입니다.
document.addEventListener("keydown", function (event) {
  if (event.key === "Escape") {
    dropdown.classList.remove("is-open");
    button.setAttribute("aria-expanded", "false");
  }
});
