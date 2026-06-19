/*
  파일: script.js (실습 319 — 등장 타이밍 제어)
  무엇: IntersectionObserver로 .reveal 요소들이 '화면에 들어오는 순간'을 감지해
        .is-visible 클래스를 붙인다. 그러면 style.css의 transition이 발동해 카드가 떠오른다.
  왜 IntersectionObserver를 쓰나: 옛날 방식(scroll 이벤트 + getBoundingClientRect)은 스크롤할 때마다
        수백 번 위치를 계산해 무겁고 버벅인다. IntersectionObserver는 브라우저에게
        "이 요소가 화면에 보이면 알려줘"라고 맡기는 방식이라 가볍고 정확하다.
  점진적 향상: 이 파일이 실행되면 index.html의 <html>이 이미 class="js"다(애니메이션 ON 전제).
*/

// 무엇: 등장시킬 모든 대상을 모은다. 왜: .reveal 클래스가 '애니메이션 대상' 표시이기 때문.
const targets = document.querySelectorAll(".reveal");

/*
  무엇: 사용자가 OS에서 "동작 줄이기"를 켰는지 JS에서도 확인.
  왜: CSS만으로도 모션을 끄지만(@media), JS에서도 알면 "관찰조차 안 하고 즉시 보이게" 처리해
      불필요한 작업을 아예 건너뛸 수 있다. CSS와 JS가 같은 사용자 의사를 함께 존중하는 셈.
*/
const prefersReducedMotion = window.matchMedia(
  "(prefers-reduced-motion: reduce)"
).matches;

/*
  무엇: 브라우저가 IntersectionObserver를 지원하지 않거나, 사용자가 모션을 꺼 둔 경우의 대비.
  왜: 둘 중 하나라도 해당하면 애니메이션을 시도하지 말고, 그냥 모든 카드를 즉시 보이게 한다.
      (구형 브라우저에서도 내용이 사라지지 않게 + 접근성 의사를 존중하기 위해.)
*/
if (!("IntersectionObserver" in window) || prefersReducedMotion) {
  // is-visible을 바로 붙여 '보임 상태'로 — 애니메이션 대기 없이 즉시 표시.
  targets.forEach((el) => el.classList.add("is-visible"));
} else {
  /*
    무엇: 관찰자(observer)를 하나 만든다. 콜백은 '감시 중인 요소의 화면 진입 상태가 바뀔 때' 호출된다.
    왜 options:
      - threshold: 0.15 → 요소가 '15% 정도 보였을 때' 발동. (0이면 1px만 걸쳐도 발동해 너무 이르고,
        1이면 100% 다 보여야 해 너무 늦다. 15%가 "충분히 들어왔다" 느낌의 무난한 값.)
      - rootMargin: "0px 0px -10% 0px" → 화면 아래쪽 경계를 10% 위로 끌어올려, 카드가 바닥에 닿기 직전이
        아니라 '조금 더 안쪽'에 들어왔을 때 등장하게 한다(자연스러운 타이밍).
  */
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        // 무엇: 이 요소가 지금 화면에 들어와 있는가? 왜: 들어왔을 때만 등장시키려고.
        if (entry.isIntersecting) {
          const el = entry.target;

          /*
            무엇: 같은 줄 카드가 시간차로 나타나게(stagger) 지연을 적용.
            왜: data-reveal-delay(ms)만큼 transition 시작을 미루면 카드들이 '우르르'가 아니라
                '차르륵' 순서대로 떠올라 더 세련돼 보인다. HTML의 data 속성에서 값을 읽어 쓴다.
          */
          const delay = Number(el.dataset.revealDelay) || 0;
          el.style.transitionDelay = delay + "ms";

          // 무엇: '보임 상태' 클래스 추가 → style.css의 transition이 발동해 떠오른다.
          el.classList.add("is-visible");

          /*
            무엇: 한 번 나타난 요소는 더 이상 감시하지 않는다.
            왜: 다시 위로 스크롤했다 내려도 깜빡이며 재생되지 않게(한 번만 등장) + 불필요한 감시 비용 절약.
          */
          observer.unobserve(el);
        }
      });
    },
    {
      threshold: 0.15,
      rootMargin: "0px 0px -10% 0px",
    }
  );

  // 무엇: 모든 .reveal 요소를 관찰 대상으로 등록. 왜: 각 카드가 화면에 들어올 때 위 콜백이 불리게 하려고.
  targets.forEach((el) => observer.observe(el));
}
