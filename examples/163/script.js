// =====================================================================
// 실습 163 — 브라우저 쪽 코드 (프론트엔드) · 스트리밍 받기
//
// 핵심: 이 파일 어디에도 비밀 키(sk-ant-...)가 없습니다.
// 브라우저는 Claude를 직접 부르지 않고, 우리 서버의 '중간 창구'
// /api/chat 만 부릅니다. 진짜 Claude 호출 + 비밀 키 사용 +
// '챗봇 성격(프롬프트)'은 모두 서버 함수(api/chat.js) 안에 있습니다.
//
// 162(요약기)와 가장 다른 점:
//   162: const data = await res.json();  ← 답을 '한 번에' 다 받아서 표시
//   163: 응답을 'reader'로 조각조각 읽어, 받는 즉시 화면에 이어 붙임 (점진적 렌더링)
// =====================================================================

const PROXY_URL = "/api/chat"; // 같은 사이트 안의 서버 함수. 키가 필요 없다.

const msgEl = document.getElementById("message");
const counterEl = document.getElementById("counter");
const sendBtn = document.getElementById("sendBtn");
const stopBtn = document.getElementById("stopBtn");
const statusEl = document.getElementById("status");
const logEl = document.getElementById("log");

const MAX_CHARS = 4000;
let controller = null; // 진행 중인 요청을 '멈추기'로 취소할 때 쓴다

// ── 실시간 글자 수 카운터 ──────────────────────────────────────────
function updateCounter() {
  counterEl.textContent = msgEl.value.length + " / " + MAX_CHARS + "자";
}
msgEl.addEventListener("input", updateCounter);
updateCounter();

// Enter 전송 / Shift+Enter 줄바꿈
msgEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter" && !e.shiftKey) {
    e.preventDefault();
    send();
  }
});

sendBtn.addEventListener("click", send);
stopBtn.addEventListener("click", () => {
  if (controller) controller.abort(); // 진행 중인 스트림을 중간에 끊는다
});

// ── 채팅 한 줄(버블) 추가 헬퍼 ─────────────────────────────────────
function addBubble(role, text) {
  const div = document.createElement("div");
  div.className = "bubble " + role; // role: "user" | "ai"
  div.textContent = text;
  logEl.appendChild(div);
  logEl.scrollTop = logEl.scrollHeight;
  return div;
}

// ── 보내기 (스트리밍 받기) ─────────────────────────────────────────
async function send() {
  const message = msgEl.value.trim();
  if (!message) {
    setStatus("질문을 먼저 입력해 주세요.", "bad");
    return;
  }

  // 1) 내 말풍선 추가, 입력칸 비우기
  addBubble("user", message);
  msgEl.value = "";
  updateCounter();

  // 2) AI 말풍선을 '빈 채로' 먼저 만들어 두고, 글자가 도착할 때마다 여기에 이어 붙인다
  const aiBubble = addBubble("ai", "");
  aiBubble.classList.add("typing"); // 깜빡이는 커서 표시

  sendBtn.disabled = true;
  stopBtn.hidden = false;
  setStatus("AI가 답을 흘려보내는 중… (도착하는 즉시 위에 차오릅니다)");

  controller = new AbortController();

  try {
    // 브라우저 → 우리 서버 창구. '질문'만 보낸다. 키도, 프롬프트도 보내지 않는다.
    const res = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
      signal: controller.signal,
    });

    // 서버가 에러(JSON)를 주면 스트림이 아니라 에러로 처리한다
    if (!res.ok) {
      let errMsg = `서버 오류 (${res.status})`;
      try {
        const data = await res.json();
        errMsg = data.error || errMsg;
      } catch (_) {
        /* JSON 이 아니면 기본 메시지 */
      }
      throw new Error(errMsg);
    }

    // ★ 여기가 스트리밍의 핵심 ★
    // 응답 본문을 'reader'로 열어, 조각(value)이 도착할 때마다 글자로 풀어
    // AI 말풍선에 '이어 붙인다'. = 점진적 렌더링(progressive rendering)
    const reader = res.body.getReader(); // 응답 본문을 '읽기 커서'로 연다 (한 번에 안 받고 조금씩 읽음)
    // TextDecoder: 네트워크로 오는 건 바이트(숫자) 묶음이라, 사람이 읽는 글자로 풀어 줘야 한다.
    const decoder = new TextDecoder();
    let full = ""; // 지금까지 받은 글자를 누적해 둔다 (말풍선에 매번 통째로 다시 그릴 용도)

    while (true) {
      const { value, done } = await reader.read();
      if (done) break; // 더 올 조각이 없으면 끝

      // { stream: true }: 한글 한 글자가 여러 바이트라 조각 경계에서 잘릴 수 있다.
      // 이 옵션이 잘린 바이트를 다음 조각까지 기억해 줘서 글자가 깨지지 않게 한다.
      const chunk = decoder.decode(value, { stream: true });
      full += chunk;
      aiBubble.textContent = full; // 받은 만큼만 다시 그린다 → 타자 치듯 보임
      logEl.scrollTop = logEl.scrollHeight; // 새 글자가 보이도록 아래로 스크롤
    }

    if (!full.trim()) aiBubble.textContent = "(빈 응답)";
    setStatus("완료! 이 답은 서버를 거쳐 조각조각 받아왔습니다.", "ok");
  } catch (err) {
    if (err.name === "AbortError") {
      aiBubble.textContent += " …(여기서 멈췄습니다)";
      setStatus("내가 멈췄습니다.", "");
    } else {
      aiBubble.textContent = "[오류] " + err.message;
      setStatus("실패: " + err.message, "bad");
    }
  } finally {
    aiBubble.classList.remove("typing");
    sendBtn.disabled = false;
    stopBtn.hidden = true;
    controller = null;
  }
}

function setStatus(msg, kind = "") {
  statusEl.textContent = msg;
  statusEl.className = "status" + (kind ? " " + kind : "");
}

// ---------------------------------------------------------------------
// "비밀 키가 안 보인다"를 눈으로 확인시켜 주는 간단 검사기.
// 현재 페이지가 불러온 script.js 글자 안에 진짜 키 패턴이 있는지만 본다.
// ---------------------------------------------------------------------
const scanBtn = document.getElementById("scanBtn");
const scanResult = document.getElementById("scanResult");

scanBtn.addEventListener("click", async () => {
  scanResult.textContent = "검사 중…";
  scanResult.className = "status";
  try {
    const res = await fetch("script.js", { cache: "no-store" });
    const fileText = await res.text();

    // 실제 키 패턴(주석의 'sk-ant-...' 자리표시자는 길이가 짧아 매칭 안 됨)
    const realKeyPattern = /sk-ant-[A-Za-z0-9_-]{20,}/;
    const found = realKeyPattern.test(fileText);

    if (found) {
      scanResult.textContent =
        "위험! 브라우저 코드에서 진짜 키 패턴이 발견됐습니다. 즉시 제거하세요.";
      scanResult.className = "status bad";
    } else {
      scanResult.textContent =
        "안전: 이 페이지의 JS에는 진짜 비밀 키(sk-ant-...)가 없습니다.";
      scanResult.className = "status ok";
    }
  } catch (err) {
    scanResult.textContent = "검사 실패: " + err.message;
    scanResult.className = "status bad";
  }
});
