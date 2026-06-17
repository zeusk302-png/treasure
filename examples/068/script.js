// ===========================================================
// FAQ 아코디언 — 한 번에 하나만 열리기
// 핵심 개념: querySelectorAll 로 여러 개를 한꺼번에 고르고,
//           forEach 로 하나씩 반복 처리하고,
//           is-open 클래스(활성 클래스)로 열림/닫힘 상태를 표시한다.
// ===========================================================

// 1) 페이지 안의 "질문 버튼"을 전부 골라온다 (NodeList = 여러 개 묶음)
const questions = document.querySelectorAll(".faq-question");

// 2) 골라온 질문들을 forEach 로 하나씩 돌면서 클릭 동작을 붙인다
questions.forEach(function (questionBtn) {
  questionBtn.addEventListener("click", function () {
    // 지금 누른 질문이 속한 칸(.faq-item)을 찾는다
    const clickedItem = questionBtn.closest(".faq-item");

    // 누른 칸이 이미 열려 있었는지 미리 기억해 둔다
    const wasOpen = clickedItem.classList.contains("is-open");

    // 3) "한 번에 하나만" → 먼저 모든 칸을 닫는다
    closeAll();

    // 4) 원래 닫혀 있던 칸을 눌렀다면 이제 그 칸만 연다.
    //    (원래 열려 있던 칸을 다시 누른 경우엔 3번에서 닫혔으니 그대로 둔다 = 토글)
    if (!wasOpen) {
      clickedItem.classList.add("is-open");
      questionBtn.setAttribute("aria-expanded", "true");
    }
  });
});

// 모든 아코디언 칸을 닫는 함수
function closeAll() {
  const items = document.querySelectorAll(".faq-item");
  items.forEach(function (item) {
    item.classList.remove("is-open");
    // 화면 읽기 프로그램(스크린리더)에게 "닫힘"을 알려주는 표시도 되돌린다
    const btn = item.querySelector(".faq-question");
    if (btn) {
      btn.setAttribute("aria-expanded", "false");
    }
  });
}
