// ============================================================
// 숫자 카운트업 애니메이션
//
// 만들고 싶은 것
//   통계 구역이 화면에 보이는 순간, 각 숫자가 0부터 목표 숫자까지
//   빠르게 올라간다. (예: 0 → 1,280+)
//
// 핵심 아이디어 2가지
//   1) "보이면 시작": IntersectionObserver 로 통계 구역이 화면에
//      들어왔는지 감지하고, 들어온 그 순간에 딱 한 번 애니메이션을 켠다.
//   2) "시간에 따라 값 올리기(보간)": requestAnimationFrame 으로
//      매 프레임마다 '지금까지 흐른 시간 비율'을 계산해, 0과 목표 숫자
//      사이의 중간값을 만들어 화면에 보여준다.
// ============================================================

// 1) 올라가는 데 걸릴 시간(밀리초) ----------------------------
//    2000 = 2초. 값을 키우면 천천히, 줄이면 빨리 올라갑니다.
const DURATION = 2000;

// 2) 숫자 1개를 0부터 목표까지 올리는 함수 --------------------
//    el     : 숫자를 보여줄 요소 (예: <span class="stat-num">)
//    target : 도착할 목표 숫자
//    suffix : 숫자 뒤에 붙일 글자 (예: "+", "%", "개국")
function animateCount(el, target, suffix) {
  // 애니메이션이 '시작한 시각'을 아직 모르므로 비워 둡니다.
  let startTime = null;

  // requestAnimationFrame 이 매 프레임(약 1/60초)마다 부르는 함수.
  // now 에는 '지금 시각'이 자동으로 들어옵니다.
  function step(now) {
    // 첫 프레임에서 시작 시각을 기록합니다.
    if (startTime === null) startTime = now;

    // 시작한 지 얼마나 지났는지(ms) → 전체 시간 대비 진행 비율(0~1)
    const elapsed = now - startTime;
    const progress = Math.min(elapsed / DURATION, 1); // 1을 넘지 않게 막음

    // '보간(interpolation)': 0과 target 사이에서 progress 비율만큼의 값.
    //   progress 0   → 0
    //   progress 0.5 → target 의 절반
    //   progress 1   → target (정확히 목표값)
    const current = Math.floor(target * progress);

    // 화면에 숫자를 보여줍니다. toLocaleString() 은 1280 → "1,280" 처럼
    // 세 자리마다 쉼표를 찍어 읽기 쉽게 해 줍니다.
    el.textContent = current.toLocaleString() + suffix;

    // 아직 1(=100%)에 도달하지 않았으면 다음 프레임을 또 요청합니다.
    if (progress < 1) {
      requestAnimationFrame(step);
    } else {
      // 끝났을 때는 소수점/반올림 오차 없이 정확한 목표값으로 못박습니다.
      el.textContent = target.toLocaleString() + suffix;
    }
  }

  // 애니메이션의 첫 프레임을 요청 → 위 step 함수가 반복 호출됩니다.
  requestAnimationFrame(step);
}

// 3) 통계 구역 안의 모든 숫자를 한꺼번에 올리는 함수 ----------
function startAllCounts(statsSection) {
  // 통계 구역 안의 .stat-num 들을 모두 찾습니다.
  const numbers = statsSection.querySelectorAll(".stat-num");

  numbers.forEach((el) => {
    // HTML 에 적어 둔 data-target / data-suffix 값을 읽습니다.
    // dataset.target 은 글자("1280")이므로 Number() 로 숫자로 바꿉니다.
    const target = Number(el.dataset.target);
    const suffix = el.dataset.suffix || ""; // 없으면 빈 글자
    animateCount(el, target, suffix);
  });
}

// 4) 통계 구역이 '화면에 보이는지' 감지하기 -------------------
//    IntersectionObserver 는 "이 요소가 화면 안에 들어왔다/나갔다"를
//    알려주는 감시자입니다. 스크롤 위치를 직접 계산하지 않아도 됩니다.
const statsSection = document.getElementById("stats");

// 같은 애니메이션이 스크롤할 때마다 반복되지 않도록, 한 번 했는지 기억합니다.
let hasAnimated = false;

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      // entry.isIntersecting 이 true 면 '지금 화면 안에 보인다'는 뜻입니다.
      if (entry.isIntersecting && !hasAnimated) {
        hasAnimated = true;        // 다시는 실행되지 않도록 잠급니다.
        startAllCounts(statsSection);
        observer.unobserve(statsSection); // 더 이상 감시할 필요 없음
      }
    });
  },
  {
    // threshold 0.4 = 통계 구역의 40% 이상이 보일 때 콜백을 실행합니다.
    // (살짝 걸치자마자가 아니라, 어느 정도 들어왔을 때 시작하도록)
    threshold: 0.4,
  }
);

// 감시 시작! 이제 통계 구역이 화면에 들어오면 위 콜백이 호출됩니다.
observer.observe(statsSection);
