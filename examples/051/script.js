// ===== 스크롤 등장 애니메이션 =====
//
// 핵심 도구는 IntersectionObserver입니다.
// "이 요소가 화면(뷰포트) 안에 들어왔는지"를 브라우저가 대신 감시해 주고,
// 들어오거나 나갈 때마다 우리에게 알려 줍니다.
// 우리는 그 신호를 받아 등장 상태를 뜻하는 is-visible 클래스를 붙였다 떼면 됩니다.

// 반복 여부 설정: true면 다시 화면 밖으로 나갔다 들어올 때마다 또 등장합니다.
//                false면 한 번 등장한 뒤로는 계속 보이게 둡니다.
const REPEAT = true;

// reveal 클래스가 붙은 모든 요소를 한꺼번에 골라 옵니다. (NodeList)
const targets = document.querySelectorAll(".reveal");

// 감시자(Observer)를 만듭니다.
// 첫 번째 인자: 변화가 생겼을 때 실행할 함수 (entries = 변화가 생긴 요소들의 정보)
// 두 번째 인자: 감시 옵션
const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        // 화면 안에 들어왔다 → 등장!
        entry.target.classList.add("is-visible");

        // 반복하지 않을 거라면, 한 번 보여 준 뒤 더 감시할 필요가 없으므로 끊습니다.
        if (!REPEAT) {
          observer.unobserve(entry.target);
        }
      } else if (REPEAT) {
        // 화면 밖으로 나갔다 → 다시 숨겨서, 다음에 또 등장하게 합니다.
        entry.target.classList.remove("is-visible");
      }
    });
  },
  {
    // threshold: 요소가 "얼마나" 보이면 들어온 것으로 칠지 (0~1).
    //            0.15 = 요소의 15%가 보이면 등장 시작.
    threshold: 0.15,
    // rootMargin: 화면 경계를 가상으로 넓히거나 좁힙니다.
    //             아래쪽을 -80px 줄여서, 화면 맨 아래 닿기 직전이 아니라
    //             살짝 위로 올라왔을 때 등장하도록 자연스럽게 조정합니다.
    rootMargin: "0px 0px -80px 0px",
  }
);

// 골라 온 모든 요소를 감시 목록에 등록합니다.
targets.forEach((el) => observer.observe(el));
