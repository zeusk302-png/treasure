// === 타임아웃 · 재시도 데모: 응답이 늦거나 끊길 때 버티는 법 ===
//
// 이번 실습의 한 줄 핵심:
//   "네트워크는 항상 성공하지 않는다. 느릴 수도, 가끔 끊길 수도 있다.
//    그래서 ① 타임아웃(언제까지 기다릴지 정하기)과 ② 재시도(실패하면 한 번 더)를 직접 넣어 둔다."
//
// 왜 중요한가? (디렉터 시각)
//   - AI에게 "데이터 받아와서 보여줘"라고 하면, 보통 '서버가 빠르게, 항상 성공한다'고 가정한 코드를 줍니다.
//   - 하지만 현실에서는 서버가 느려질 수도(사용자는 멈춘 줄 알고 떠남), 일시적으로 끊길 수도 있습니다.
//   - 타임아웃이 없으면 화면은 영원히 '로딩 중…'에 머뭅니다. (가장 흔한 사용자 이탈 원인)
//   - 그래서 우리가 직접 '기다림의 한계'와 '한 번 더 시도'를 챙겨야 합니다.
//
// 이 데모는 진짜 느린 서버를 구하기 어려우므로, '느린/불안정한 서버'를 fakeServer()로 흉내 냅니다.
//   (받아오는 쪽 코드 — 타임아웃·재시도 — 는 진짜 fetch를 쓸 때와 똑같은 구조입니다.)

// 화면 요소 미리 찾아두기
const scenarioSelect = document.getElementById("scenario"); // 서버가 어떻게 행동할지
const timeoutInput = document.getElementById("timeoutSec");  // 타임아웃(초)
const retriesInput = document.getElementById("retries");     // 재시도 횟수
const loadBtn = document.getElementById("loadBtn");          // [데이터 받기]

const loadingBox = document.getElementById("loadingBox");    // ① 로딩 화면
const loadingText = document.getElementById("loadingText");  // 로딩 안내(몇 번째 시도)
const resultBox = document.getElementById("resultBox");      // ② 성공 화면
const resultText = document.getElementById("resultText");
const errorBox = document.getElementById("errorBox");        // ③ 실패 화면
const errorText = document.getElementById("errorText");
const retryBtn = document.getElementById("retryBtn");        // [다시 시도]
const hint = document.getElementById("hint");                // 시작 안내
const logList = document.getElementById("logList");          // 진행 기록

// ★상태 전환 도우미★ 한 번에 '하나의 상태'만 화면에 보이게 한다.
//   which = "loading" | "result" | "error" | "idle"
function showState(which) {
  loadingBox.hidden = which !== "loading";
  resultBox.hidden = which !== "result";
  errorBox.hidden = which !== "error";
  hint.hidden = which !== "idle";
}

// 진행 기록 한 줄 추가(디렉터가 흐름을 눈으로 보게)
function log(message) {
  const li = document.createElement("li");
  const time = new Date().toLocaleTimeString("ko-KR");
  li.textContent = "[" + time + "] " + message;
  logList.prepend(li); // 최신 줄이 맨 위에 오도록
}

// 잠깐 기다리는 도우미 (재시도 사이에 살짝 쉬는 용도)
function sleep(ms) {
  return new Promise(function (resolve) {
    setTimeout(resolve, ms);
  });
}

// ──────────────────────────────────────────────────────────────
// ★ 가짜 서버 ★ : 진짜 fetch처럼 '약속(Promise)'을 돌려주되,
//   고른 상황(fast/slow/flaky/down)에 따라 느리게/실패하게 흉내 낸다.
//   실제로는 이 자리에 진짜 fetch(url) 가 들어간다. (구조는 동일)
//   signal: AbortController가 주는 '중단 신호'. 타임아웃이 이걸로 요청을 끊는다.
// ──────────────────────────────────────────────────────────────
let flakyTried = false; // 'flaky'(불안정) 상황에서 첫 시도 실패를 기억하는 변수

function fakeServer(scenario, signal) {
  return new Promise(function (resolve, reject) {
    // 상황별로 '서버가 응답하기까지 걸리는 시간'과 '성공/실패'를 정한다.
    let delay = 400;     // 기본 0.4초
    let willFail = false;

    if (scenario === "slow") {
      delay = 6000;      // 6초 — 보통 타임아웃(3초)에 먼저 걸린다.
    } else if (scenario === "flaky") {
      if (!flakyTried) {
        flakyTried = true;
        willFail = true; // 첫 시도는 실패
        delay = 500;
      } else {
        willFail = false; // 재시도는 성공
        delay = 500;
      }
    } else if (scenario === "down") {
      willFail = true;   // 매번 실패
      delay = 500;
    }

    // 정해진 시간 뒤에 성공 또는 실패로 끝낸다.
    const timer = setTimeout(function () {
      if (willFail) {
        reject(new Error("서버가 응답을 거부했어요 (가짜 서버 down/flaky)"));
      } else {
        resolve({ ok: true, message: "데이터를 정상적으로 받았어요 🎉" });
      }
    }, delay);

    // ★중요★ 타임아웃이 요청을 끊으면(abort) 이 신호가 와서, 진행 중이던 응답을 취소한다.
    //   진짜 fetch는 이 처리를 내부에서 알아서 해 주지만, 여기서는 직접 흉내 낸다.
    if (signal) {
      signal.addEventListener("abort", function () {
        clearTimeout(timer);
        // AbortController가 끊었음을 알리는 표준 에러 이름은 "AbortError" 다.
        const abortErr = new Error("요청이 타임아웃으로 중단됨");
        abortErr.name = "AbortError";
        reject(abortErr);
      });
    }
  });
}

// ──────────────────────────────────────────────────────────────
// ★ 핵심 도우미 1 ★ : 타임아웃이 걸린 '한 번의 요청'
//   - AbortController로 '중단 리모컨'을 만든다.
//   - setTimeout으로 정해진 시간이 지나면 controller.abort() 를 눌러 요청을 끊는다.
//   - 시간 안에 응답이 오면 타이머를 꺼서, 멀쩡한 요청을 실수로 끊지 않게 한다.
// ──────────────────────────────────────────────────────────────
async function fetchWithTimeout(scenario, timeoutMs) {
  const controller = new AbortController(); // 요청을 끊을 수 있는 '리모컨'
  const timer = setTimeout(function () {
    controller.abort(); // 시간이 다 되면 '중단!' 신호를 보낸다.
  }, timeoutMs);

  try {
    // 진짜 코드라면: const res = await fetch(url, { signal: controller.signal });
    const res = await fakeServer(scenario, controller.signal);
    return res;
  } finally {
    // 성공·실패와 상관없이, 켜 둔 타이머는 반드시 꺼서 자원 낭비/오작동을 막는다.
    clearTimeout(timer);
  }
}

// ──────────────────────────────────────────────────────────────
// ★ 핵심 도우미 2 ★ : 타임아웃 + 재시도를 합친 전체 받아오기
//   - maxRetries 번까지 '한 번 더' 시도한다. (예: 1이면 처음 1번 + 재시도 1번 = 최대 2번)
//   - 매 시도는 fetchWithTimeout 으로 타임아웃이 걸려 있다.
// ──────────────────────────────────────────────────────────────
async function fetchWithRetry(scenario, timeoutMs, maxRetries) {
  let lastError = null;

  // attempt: 0(첫 시도), 1(첫 재시도), 2(둘째 재시도) ...
  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    const isRetry = attempt > 0;
    loadingText.textContent = isRetry
      ? (attempt + "번째 재시도 중이에요… (한 번 더 해 볼게요)")
      : "데이터를 받아오는 중이에요…";
    log(isRetry ? (attempt + "번째 재시도 시작") : "첫 시도 시작");

    try {
      const res = await fetchWithTimeout(scenario, timeoutMs);
      log("성공! 더 이상 재시도하지 않음");
      return res; // 성공하면 즉시 끝낸다(남은 재시도는 하지 않는다).
    } catch (err) {
      lastError = err;
      // 왜 실패했는지 사람이 읽을 수 있게 구분한다(타임아웃 vs 일반 실패).
      const reason =
        err.name === "AbortError"
          ? "시간 초과(타임아웃)로 끊김"
          : "요청 실패";
      log("이번 시도 실패 — " + reason);

      // 아직 재시도 기회가 남았으면 잠깐 쉬고 다음 시도로.
      if (attempt < maxRetries) {
        await sleep(600); // 실제 서비스에서는 점점 더 길게 쉬는 게 정석(백오프)
      }
    }
  }

  // 여기까지 왔다 = 모든 시도가 실패했다. 마지막 에러를 위로 던진다.
  throw lastError;
}

// 버튼을 눌렀을 때 실행되는 전체 흐름: 로딩 → (성공 or 실패)
async function run() {
  const scenario = scenarioSelect.value;
  const timeoutMs = Number(timeoutInput.value) * 1000; // 초 → 밀리초
  const maxRetries = Number(retriesInput.value);

  // 'flaky'(불안정) 상황은 매번 '첫 시도 실패'부터 다시 보도록 초기화한다.
  flakyTried = false;

  showState("loading");
  loadBtn.disabled = true;
  log("──── 새 받아오기 시작 (상황: " + scenarioSelect.options[scenarioSelect.selectedIndex].text + ") ────");

  try {
    const res = await fetchWithRetry(scenario, timeoutMs, maxRetries);
    resultText.textContent = res.message;
    showState("result");
  } catch (err) {
    // 사용자에게는 '친절한 한국어 한 줄'. 타임아웃이면 안내를 살짝 다르게.
    if (err.name === "AbortError") {
      errorText.textContent =
        "응답이 너무 늦어 기다림을 멈췄어요(타임아웃). 잠시 후 [다시 시도]를 눌러 주세요.";
    } else {
      errorText.textContent =
        "데이터를 받아오지 못했어요. 인터넷 연결을 확인하고 [다시 시도]를 눌러 주세요.";
    }
    showState("error");
    // 자세한 원인은 개발자만 보는 콘솔에 남긴다. (F12 → Console)
    console.error("받아오기 최종 실패:", err);
  } finally {
    // 성공이든 실패든 마지막에는 항상 버튼을 다시 풀어 준다.
    loadBtn.disabled = false;
  }
}

// 버튼 연결
loadBtn.addEventListener("click", run);
retryBtn.addEventListener("click", run); // 실패 화면의 [다시 시도]도 같은 흐름

// 처음에는 '시작 안내' 상태로 둔다.
showState("idle");
