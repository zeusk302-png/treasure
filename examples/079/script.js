// ============================================
// 스크롤하면 요소가 스르륵 등장하기 (페이드인)
// 핵심 개념: IntersectionObserver로
//            "요소가 화면에 보이기 시작했는지"를 감지한다.
// ============================================

// 1) 나타나게 할 대상들을 모두 골라 둡니다.
//    (class에 'reveal'이 붙은 요소 전부)
const targets = document.querySelectorAll(".reveal");

// 2) "감시자(observer)"를 만듭니다.
//    이 감시자는 대상이 화면 안에 들어오거나 나갈 때마다
//    아래 함수를 자동으로 호출해 줍니다.
const observer = new IntersectionObserver(
  function (entries) {
    // entries: 상태가 바뀐 대상들의 목록
    entries.forEach(function (entry) {
      // entry.isIntersecting 이 true 면 = 지금 화면에 보인다는 뜻
      if (entry.isIntersecting) {
        // 3) 보이기 시작하면 'visible' 클래스를 추가합니다.
        //    그러면 CSS의 transition이 부드럽게 나타나게 합니다.
        entry.target.classList.add("visible");

        // 4) 이미 나타난 카드는 더 이상 감시할 필요가 없으므로
        //    관찰을 멈춥니다. (위아래로 스크롤해도 깜빡이지 않음)
        observer.unobserve(entry.target);
      }
    });
  },
  {
    // threshold: 대상이 얼마나 보여야 'isIntersecting'으로 칠지 (0~1)
    // 0.1 = 요소의 10%만 화면에 들어와도 나타나게 함
    threshold: 0.1,
    // rootMargin: 화면 아래쪽 경계를 80px 위로 당겨,
    // 카드가 화면에 완전히 닿기 조금 전에 미리 나타나게 함
    rootMargin: "0px 0px -80px 0px",
  }
);

// 5) 골라 둔 모든 대상을 감시자에게 등록합니다.
targets.forEach(function (target) {
  observer.observe(target);
});
