// ===== 스톱워치 =====
// 핵심 아이디어:
//  - "지금까지 흐른 시간"은 매 순간 (현재시각 - 시작시각)으로 계산합니다.
//  - 정지했다 다시 시작하면, 이전에 모아둔 시간(accumulated)에 이어서 잰다.
//  - setInterval로 10ms마다 화면 숫자만 다시 그립니다.
//    (시간 계산은 화면 갱신과 별개로 '진짜 시계'인 Date.now()로 합니다.)

// --- 화면 요소 가져오기 ---
const display = document.getElementById("display");
const startStopBtn = document.getElementById("startStopBtn");
const resetBtn = document.getElementById("resetBtn");

// --- 상태 변수 ---
let timerId = null;        // setInterval의 ID. null이면 "멈춰 있음"을 뜻합니다.
let startTime = 0;         // 이번 '시작'을 누른 순간의 시각(Date.now() 값)
let accumulated = 0;       // 이전까지 모아둔 경과 시간(밀리초). 정지할 때마다 더해집니다.

// 현재까지의 총 경과 시간(밀리초)을 구합니다.
// - 동작 중이면: 모아둔 시간 + (지금 - 이번 시작 시각)
// - 멈춰 있으면: 모아둔 시간 그대로
function getElapsed() {
  if (timerId !== null) {
    return accumulated + (Date.now() - startTime);
  }
  return accumulated;
}

// 밀리초(ms)를 "분:초.1/100초" 글자로 바꿉니다. 예: 75230ms -> "01:15.23"
function format(ms) {
  const totalCentis = Math.floor(ms / 10);   // 전체를 1/100초 단위로
  const centis = totalCentis % 100;          // 1/100초 자리 (0~99)
  const totalSeconds = Math.floor(totalCentis / 100);
  const seconds = totalSeconds % 60;         // 초 (0~59)
  const minutes = Math.floor(totalSeconds / 60); // 분
  // 두 자리로 맞추기 위해 앞에 0을 채웁니다. 예: 5 -> "05"
  const pad = (n) => String(n).padStart(2, "0");
  return `${pad(minutes)}:${pad(seconds)}.${pad(centis)}`;
}

// 현재 경과 시간을 숫자판에 그립니다.
function render() {
  display.textContent = format(getElapsed());
}

// --- 시작 ---
function start() {
  startTime = Date.now();           // 이번 구간의 시작 시각 기록
  // 10ms마다 화면을 다시 그립니다. (사람 눈에는 1/100초가 매끄럽게 보임)
  timerId = setInterval(render, 10);

  startStopBtn.textContent = "정지";
  startStopBtn.classList.add("running"); // 색을 빨강으로
  resetBtn.disabled = true;              // 동작 중에는 리셋을 막습니다.
}

// --- 정지 ---
function stop() {
  // 이번 구간에서 흐른 시간을 모아둔 시간에 더합니다. (이어서 재기 위함)
  accumulated += Date.now() - startTime;
  clearInterval(timerId);  // 화면 갱신 멈춤
  timerId = null;          // "멈춰 있음" 표시

  startStopBtn.textContent = "시작";
  startStopBtn.classList.remove("running"); // 색을 초록으로
  resetBtn.disabled = false;                 // 정지 상태에서는 리셋 가능

  render(); // 멈춘 순간의 정확한 값으로 한 번 더 그려 마무리
}

// --- 리셋 ---
function reset() {
  clearInterval(timerId);  // 혹시 돌고 있어도 멈춤(안전장치)
  timerId = null;
  accumulated = 0;         // 모아둔 시간 0으로
  startTime = 0;

  startStopBtn.textContent = "시작";
  startStopBtn.classList.remove("running");
  resetBtn.disabled = true;  // 0이 되었으니 다시 리셋할 게 없음

  render(); // 화면을 00:00.00으로
}

// --- 버튼 연결 ---
// 시작/정지 버튼은 현재 상태에 따라 시작 또는 정지를 합니다.
startStopBtn.addEventListener("click", () => {
  if (timerId === null) {
    start();   // 멈춰 있었다면 시작
  } else {
    stop();    // 돌고 있었다면 정지
  }
});

resetBtn.addEventListener("click", reset);

// 페이지가 처음 열렸을 때의 초기 상태를 맞춥니다.
reset();
