// ===== 1) 화면에 있는 요소들을 한꺼번에 모아옵니다 =====
// querySelectorAll은 조건에 맞는 '여러 개'를 한 번에 찾아옵니다.
// .tab 은 탭 버튼 전부, .panel 은 내용 칸(패널) 전부입니다.
const tabs = document.querySelectorAll(".tab");
const panels = document.querySelectorAll(".panel");

// ===== 2) 탭 버튼마다 클릭했을 때 할 일을 연결합니다 =====
// forEach는 "찾아온 것들을 하나씩 꺼내서 같은 처리를 해줘"라는 반복문입니다.
tabs.forEach(function (tab) {
  tab.addEventListener("click", function () {
    // (a) 지금 누른 버튼의 data-tab 값을 읽습니다. (예: "menu", "hours", "map")
    //     HTML의 data-tab 은 JS에서 dataset.tab 으로 읽습니다.
    const targetName = tab.dataset.tab;

    // (b) 먼저 모든 탭 버튼에서 'is-active'(선택됨)를 떼고,
    //     보조기기용 aria-selected도 false로 되돌립니다. → 일단 전부 끔
    tabs.forEach(function (t) {
      t.classList.remove("is-active");
      t.setAttribute("aria-selected", "false");
    });

    // (c) 방금 누른 버튼에만 'is-active'를 붙입니다. → 하나만 켬
    tab.classList.add("is-active");
    tab.setAttribute("aria-selected", "true");

    // (d) 모든 패널을 일단 숨깁니다.
    panels.forEach(function (panel) {
      panel.classList.remove("is-active");
    });

    // (e) data-panel 값이 누른 버튼의 data-tab 값과 같은 패널만 다시 보여줍니다.
    //     이것이 바로 'data 속성으로 짝 맞추기'입니다.
    panels.forEach(function (panel) {
      if (panel.dataset.panel === targetName) {
        panel.classList.add("is-active");
      }
    });
  });
});
