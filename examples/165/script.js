// 화면(브라우저) 쪽 코드입니다. 여기에는 비밀 키가 절대 없습니다.
// 비밀 키는 서버 함수(/api/safe-call)에서만 씁니다.

const askBtn = document.getElementById("ask-btn");
const promptEl = document.getElementById("prompt");
const answerEl = document.getElementById("answer");
const errorEl = document.getElementById("error");
const logBody = document.getElementById("log-body");

// 한도 현황 표시용 요소
const reqUsed = document.getElementById("req-used");
const reqLimit = document.getElementById("req-limit");
const reqBar = document.getElementById("req-bar");
const costUsed = document.getElementById("cost-used");
const costLimit = document.getElementById("cost-limit");
const costBar = document.getElementById("cost-bar");
const guardStatus = document.getElementById("guard-status");

let hasLog = false;

// 페이지가 열리면 현재 한도 현황을 먼저 불러옵니다(호출 없이 상태만 조회).
loadStatus();

async function loadStatus() {
  try {
    const res = await fetch("/api/safe-call?mode=status");
    const data = await res.json();
    paintBudget(data.budget);
  } catch (e) {
    guardStatus.textContent = "상태를 불러오지 못했어요. (서버 함수가 떠 있는지 확인하세요)";
    guardStatus.className = "status blocked";
  }
}

askBtn.addEventListener("click", async () => {
  const prompt = promptEl.value.trim();
  errorEl.hidden = true;
  answerEl.hidden = true;

  if (!prompt) {
    showError("질문을 입력해 주세요.");
    return;
  }

  askBtn.disabled = true;
  askBtn.textContent = "한도 검사 후 호출 중…";

  try {
    const res = await fetch("/api/safe-call", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });
    const data = await res.json();

    // 한도 초과로 서버가 차단한 경우: HTTP 429
    if (res.status === 429) {
      paintBudget(data.budget);
      addLogRow(data.lastCall, "차단");
      showError("한도를 초과해 호출이 차단되었습니다: " + data.message);
      return;
    }

    if (!res.ok) {
      showError(data.message || "호출에 실패했습니다.");
      return;
    }

    // 성공
    answerEl.textContent = data.answer;
    answerEl.hidden = false;
    paintBudget(data.budget);
    addLogRow(data.lastCall, "성공");
  } catch (e) {
    showError("네트워크 오류가 발생했습니다. 잠시 후 다시 시도하세요.");
  } finally {
    askBtn.disabled = false;
    askBtn.textContent = "안전하게 호출하기";
  }
});

function showError(msg) {
  errorEl.textContent = msg;
  errorEl.hidden = false;
}

// 한도 현황(요청 수 / 누적 비용) 그리기
function paintBudget(b) {
  if (!b) return;
  reqUsed.textContent = b.requestsUsed;
  reqLimit.textContent = b.requestLimit;
  costUsed.textContent = b.costUsed.toFixed(4);
  costLimit.textContent = b.costLimit.toFixed(2);

  const reqPct = Math.min(100, (b.requestsUsed / b.requestLimit) * 100);
  const costPct = Math.min(100, (b.costUsed / b.costLimit) * 100);
  reqBar.style.width = reqPct + "%";
  costBar.style.width = costPct + "%";
  reqBar.classList.toggle("over", b.requestsUsed >= b.requestLimit);
  costBar.classList.toggle("over", b.costUsed >= b.costLimit);

  if (b.blocked) {
    guardStatus.textContent = "차단됨 — 오늘의 한도를 모두 사용했습니다.";
    guardStatus.className = "status blocked";
  } else {
    guardStatus.textContent = "정상 — 아직 한도 안에 있습니다.";
    guardStatus.className = "status ok";
  }
}

// 로그 표에 한 줄 추가
function addLogRow(call, resultText) {
  if (!call) return;
  if (!hasLog) {
    logBody.innerHTML = "";
    hasLog = true;
  }
  const tr = document.createElement("tr");
  const cls = resultText === "성공" ? "result-ok" : "result-blocked";
  tr.innerHTML = `
    <td>${call.time}</td>
    <td>${call.inputTokens}</td>
    <td>${call.outputTokens}</td>
    <td>$${call.cost.toFixed(6)}</td>
    <td class="${cls}">${resultText}</td>
  `;
  logBody.prepend(tr);
}
