// ===== 숫자 맞히기 미니게임 =====
// 핵심 재료 3가지:
//  1) 상태(state): 정답, 시도 횟수, 게임 진행 중인지 여부
//  2) 게임 루프: [입력 -> 비교 -> 결과 표시]를 정답 맞힐 때까지 반복
//  3) 타이머: setInterval로 경과 시간을 0.1초마다 갱신

// --- 화면 요소(DOM) 미리 찾아두기 ---
const guessInput = document.getElementById("guessInput");
const guessBtn = document.getElementById("guessBtn");
const resetBtn = document.getElementById("resetBtn");
const messageEl = document.getElementById("message");
const triesEl = document.getElementById("tries");
const timerEl = document.getElementById("timer");
const historyEl = document.getElementById("history");

// --- 게임 상태(state) ---
let answer = 0;          // 이번 판의 정답(숨겨진 숫자)
let tries = 0;           // 지금까지 시도한 횟수
let isPlaying = false;   // 게임이 진행 중인지(정답을 맞히면 false)
let startTime = 0;       // 게임을 시작한 시각(밀리초)
let timerId = null;      // setInterval이 돌려준 번호(나중에 멈출 때 사용)

// 1~100 사이의 무작위 정수 하나를 뽑는다.
function makeAnswer() {
  return Math.floor(Math.random() * 100) + 1;
}

// 타이머 화면을 갱신한다(0.1초마다 호출됨).
function updateTimer() {
  const elapsed = (Date.now() - startTime) / 1000; // 초 단위
  timerEl.textContent = elapsed.toFixed(1) + "초";
}

// 새 게임을 시작(또는 초기화)한다.
function startGame() {
  answer = makeAnswer();
  tries = 0;
  isPlaying = true;

  // 화면 초기화
  triesEl.textContent = "0";
  timerEl.textContent = "0.0초";
  historyEl.innerHTML = "";
  messageEl.textContent = "숫자를 입력하고 [확인]을 누르세요!";
  messageEl.className = "";

  guessInput.value = "";
  guessInput.disabled = false;
  guessBtn.disabled = false;
  guessInput.focus();

  // 이전 타이머가 돌고 있으면 멈추고, 새로 시작한다.
  if (timerId !== null) clearInterval(timerId);
  startTime = Date.now();
  timerId = setInterval(updateTimer, 100); // 0.1초마다 시간 갱신
}

// 게임을 멈춘다(정답을 맞혔을 때).
function stopGame() {
  isPlaying = false;
  clearInterval(timerId);
  timerId = null;
  guessInput.disabled = true;
  guessBtn.disabled = true;
}

// 한 번의 추측을 처리한다 — 이게 "게임 루프"의 한 바퀴.
function handleGuess() {
  if (!isPlaying) return;

  const value = Number(guessInput.value);

  // 잘못된 입력 막기(빈 칸, 범위 밖)
  if (!guessInput.value || value < 1 || value > 100) {
    messageEl.textContent = "1부터 100 사이의 숫자를 입력하세요.";
    messageEl.className = "";
    guessInput.focus();
    return;
  }

  // 시도 횟수 +1 (상태 변화)
  tries++;
  triesEl.textContent = tries;

  // 정답과 비교 — 게임의 핵심 판정
  if (value === answer) {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(1);
    messageEl.textContent =
      "정답! " + answer + " (" + tries + "번 만에, " + elapsed + "초)";
    messageEl.className = "ok";
    addHistory(value, "정답");
    stopGame();
  } else if (value < answer) {
    messageEl.textContent = "더 큰 숫자예요! ↑";
    messageEl.className = "up";
    addHistory(value, "UP");
  } else {
    messageEl.textContent = "더 작은 숫자예요! ↓";
    messageEl.className = "down";
    addHistory(value, "DOWN");
  }

  // 다음 추측을 위해 입력칸 비우고 커서 두기 → 루프 반복
  guessInput.value = "";
  guessInput.focus();
}

// 시도 기록을 화면 목록에 한 줄 추가한다.
function addHistory(value, label) {
  const li = document.createElement("li");
  li.textContent = value + " (" + label + ")";
  historyEl.appendChild(li);
}

// --- 이벤트 연결 ---
guessBtn.addEventListener("click", handleGuess);
resetBtn.addEventListener("click", startGame);

// 엔터 키로도 추측할 수 있게(마우스 없이 빠르게 진행)
guessInput.addEventListener("keydown", function (event) {
  if (event.key === "Enter") handleGuess();
});

// 페이지가 열리면 첫 게임을 자동으로 시작한다.
startGame();
