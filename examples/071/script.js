// ===== 1) 필요한 요소들을 미리 찾아둡니다 =====
// openBtn  : 모달을 여는 '이벤트 자세히 보기' 버튼
// overlay  : 모달 전체(반투명 배경 + 흰 박스). 평소엔 hidden으로 숨겨져 있습니다.
const openBtn = document.getElementById("openBtn");
const overlay = document.getElementById("overlay");

// ===== 2) 모달을 '여는' 함수 =====
// hidden 속성을 제거하면 CSS가 다시 화면에 보여줍니다.
function openModal() {
  overlay.hidden = false;
}

// ===== 3) 모달을 '닫는' 함수 =====
// hidden을 다시 붙이면 화면에서 사라집니다.
function closeModal() {
  overlay.hidden = true;
}

// ===== 4) 여는 버튼에 클릭을 연결합니다 =====
openBtn.addEventListener("click", openModal);

// ===== 5) 오버레이 영역의 클릭을 한 곳에서 처리합니다 =====
// 닫는 방법이 여러 개(X 버튼 / 어두운 배경 / 확인 버튼)지만,
// 그 요소들에 모두 data-close 라는 같은 이름표를 붙여 두었습니다.
// 그래서 '클릭된 곳이 data-close 표시를 가졌으면 닫는다' 한 줄로 처리할 수 있습니다.
overlay.addEventListener("click", function (event) {
  // event.target = 실제로 마우스가 닿은 요소.
  // hasAttribute("data-close") = 그 요소에 data-close 표시가 있는지 확인.
  // → 어두운 배경(overlay 자신)이나 X 버튼, 확인 버튼을 누르면 true 가 됩니다.
  // → 모달 박스의 글자나 제목을 눌렀을 때는 data-close가 없으므로 닫히지 않습니다.
  if (event.target.hasAttribute("data-close")) {
    closeModal();
  }
});

// ===== 6) 키보드 ESC 키로도 닫기 =====
// 키보드를 누르면 document 전체에서 keydown 이벤트가 발생합니다.
// 누른 키 이름은 event.key 로 알 수 있고, ESC 키의 이름은 "Escape" 입니다.
document.addEventListener("keydown", function (event) {
  // 모달이 열려 있을 때(overlay.hidden === false)에만 ESC를 처리합니다.
  if (event.key === "Escape" && !overlay.hidden) {
    closeModal();
  }
});
