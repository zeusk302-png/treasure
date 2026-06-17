// ============================================================
// 자동 재생 캐러셀 (점 인디케이터 포함)
//
// 핵심 아이디어 2가지
//   1) "인덱스 상태": 지금 몇 번째 슬라이드를 보고 있는지 숫자 하나로 기억한다.
//   2) "타이머": setInterval 로 일정 시간마다 인덱스를 1씩 늘려 자동으로 넘긴다.
// 이 둘을 합치면 자동 재생 캐러셀이 됩니다.
// ============================================================

// 1) 화면 요소 가져오기 ----------------------------------------
const track = document.getElementById("track");      // 슬라이드 띠
const slides = track.querySelectorAll(".slide");      // 슬라이드 4장 (목록)
const dotsBox = document.getElementById("dots");      // 점들이 들어갈 자리
const prevBtn = document.getElementById("prevBtn");   // 이전 버튼
const nextBtn = document.getElementById("nextBtn");   // 다음 버튼
const carousel = document.getElementById("carousel"); // 마우스 올림 감지용 박스

const total = slides.length; // 슬라이드 총 개수 (= 4)

// 2) 상태 변수 -------------------------------------------------
let index = 0;   // 지금 보고 있는 슬라이드 번호 (0부터 시작)
let timer = null; // setInterval 이 돌려주는 '타이머 표' (멈출 때 필요)
const DELAY = 3000; // 자동 전환 간격 (밀리초) — 3000 = 3초

// 3) 점(dot) 인디케이터를 슬라이드 개수만큼 자동으로 만들기 -------
for (let i = 0; i < total; i++) {
  const dot = document.createElement("button");
  dot.className = "dot";
  dot.setAttribute("aria-label", (i + 1) + "번 슬라이드로 이동");
  // 점을 누르면 그 번호 슬라이드로 이동
  dot.addEventListener("click", () => goTo(i));
  dotsBox.appendChild(dot);
}
const dots = dotsBox.querySelectorAll(".dot"); // 방금 만든 점들 모으기

// 4) 화면을 현재 index 에 맞게 다시 그리는 함수 ------------------
//    슬라이드 띠를 (index × 100%) 만큼 왼쪽으로 밀고,
//    현재 점에만 active 클래스를 붙입니다.
function update() {
  // 예: index 가 2면 -200% 만큼 밀어서 3번째 슬라이드를 보여줌
  track.style.transform = "translateX(" + index * -100 + "%)";

  // 모든 점에서 active 를 떼고, 현재 점에만 다시 붙임
  dots.forEach((dot, i) => {
    dot.classList.toggle("active", i === index);
  });
}

// 5) 특정 번호로 이동하기 --------------------------------------
function goTo(i) {
  // (i + total) % total 은 인덱스가 끝을 넘거나 0보다 작아져도
  // 0 ~ total-1 범위 안으로 '순환'시켜 주는 안전장치입니다.
  index = (i + total) % total;
  update();
}

// 다음 / 이전 슬라이드로 이동 (위 goTo 를 재사용)
function next() { goTo(index + 1); }
function prev() { goTo(index - 1); }

// 6) 자동 재생 시작 / 정지 -------------------------------------
function startAuto() {
  stopAuto();                       // 혹시 이미 돌고 있던 타이머가 있으면 먼저 정리
  timer = setInterval(next, DELAY); // DELAY 마다 next() 를 반복 실행
}
function stopAuto() {
  clearInterval(timer); // 타이머 멈추기
}

// 7) 버튼·마우스 이벤트 연결 -----------------------------------
// 버튼을 직접 누르면: 이동한 뒤 자동 재생 타이머를 다시 시작합니다.
// (그래야 방금 누른 슬라이드부터 3초를 새로 셉니다.)
nextBtn.addEventListener("click", () => { next(); startAuto(); });
prevBtn.addEventListener("click", () => { prev(); startAuto(); });

// 점을 눌렀을 때도 타이머를 새로 시작하도록 dotsBox 전체에 연결
dotsBox.addEventListener("click", startAuto);

// 마우스를 올리면 멈추고, 떼면 다시 자동 재생 (읽다가 넘어가는 답답함 방지)
carousel.addEventListener("mouseenter", stopAuto);
carousel.addEventListener("mouseleave", startAuto);

// 8) 첫 실행 ---------------------------------------------------
update();    // 처음 화면을 0번 슬라이드로 맞춤
startAuto(); // 자동 재생 시작
