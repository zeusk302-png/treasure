// =====================================================================
// 실습 161 — 브라우저 쪽 코드 (프론트엔드)
//
// 핵심: 이 파일 어디에도 비밀 키(sk-ant-...)가 없습니다.
// 브라우저는 Claude를 직접 부르지 않고, 우리 서버의 '중간 창구'
// /api/ask 만 부릅니다. 진짜 Claude 호출 + 비밀 키 사용은
// 서버 함수(api/ask.js) 안에서만 일어납니다.
// =====================================================================

// ❌ 이렇게 하면 절대 안 됩니다 (비밀 키가 브라우저에 노출됨!):
//
//   const ANTHROPIC_KEY = "sk-ant-진짜키";   // F12로 누구나 봄 → 키 도둑맞음
//   fetch("https://api.anthropic.com/v1/messages", {
//     headers: { "x-api-key": ANTHROPIC_KEY }, ...
//   });
//
// ✅ 올바른 방법: 우리 서버 창구(/api/ask)에만 부탁한다.

const PROXY_URL = "/api/ask"; // 같은 사이트 안의 서버 함수. 키가 필요 없다.

const promptEl = document.getElementById("prompt");
const askBtn = document.getElementById("askBtn");
const statusEl = document.getElementById("status");
const answerEl = document.getElementById("answer");

askBtn.addEventListener("click", async () => {
  const prompt = promptEl.value.trim();
  if (!prompt) {
    setStatus("질문을 먼저 입력해 주세요.", "bad");
    return;
  }

  askBtn.disabled = true;
  answerEl.hidden = true;
  setStatus("서버 창구에 부탁하는 중… (서버가 대신 Claude를 호출합니다)");

  try {
    // 브라우저 → 우리 서버 창구. 키는 보내지 않는다(서버가 가지고 있다).
    const res = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ prompt }),
    });

    const data = await res.json();

    if (!res.ok) {
      // 서버가 알려준 에러 메시지를 그대로 보여 준다(비밀 키는 절대 안 담김).
      throw new Error(data.error || `서버 오류 (${res.status})`);
    }

    answerEl.textContent = data.answer;
    answerEl.hidden = false;
    setStatus("완료! 이 답변은 서버를 거쳐 받아왔습니다.", "ok");
  } catch (err) {
    setStatus("실패: " + err.message, "bad");
  } finally {
    askBtn.disabled = false;
  }
});

function setStatus(msg, kind = "") {
  statusEl.textContent = msg;
  statusEl.className = "status" + (kind ? " " + kind : "");
}

// ---------------------------------------------------------------------
// "키가 안 보인다"를 눈으로 확인시켜 주는 간단 검사기.
// 현재 페이지가 불러온 script.js 글자 안에 sk-ant- 패턴이 있는지만 본다.
// ---------------------------------------------------------------------
const scanBtn = document.getElementById("scanBtn");
const scanResult = document.getElementById("scanResult");

scanBtn.addEventListener("click", async () => {
  scanResult.textContent = "검사 중…";
  scanResult.className = "status";
  try {
    const res = await fetch("script.js", { cache: "no-store" });
    const text = await res.text();

    // 실제 키 패턴(주석에 적힌 'sk-ant-진짜키'는 자리표시자라 한글이 섞여 매칭 안 됨)
    const realKeyPattern = /sk-ant-[A-Za-z0-9_-]{20,}/;
    const found = realKeyPattern.test(text);

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
