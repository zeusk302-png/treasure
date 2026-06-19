// =====================================================================
// 실습 274 — 브라우저 쪽 코드 (프론트엔드)
//
// 핵심: 이 파일 어디에도 비밀 키가 없습니다.
// 브라우저는 Claude를 직접 부르지 않고, 우리 서버 창구 /api/ask 만 부릅니다.
// 진짜 검색(RAG의 R)과 Claude 호출 + 비밀 키 사용은 서버(api/ask.js)에서만 일어납니다.
// =====================================================================

const PROXY_URL = "/api/ask"; // 같은 사이트 안의 서버 함수. 키가 필요 없다.

const questionEl = document.getElementById("question");
const askBtn = document.getElementById("askBtn");
const statusEl = document.getElementById("status");
const answerBox = document.getElementById("answerBox");
const answerEl = document.getElementById("answer");
const sourcesEl = document.getElementById("sources");

// 예시 칩(chip)을 누르면 입력칸에 채우고 바로 질문한다.
document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    questionEl.value = chip.dataset.q;
    ask();
  });
});

askBtn.addEventListener("click", ask);

// 엔터로도 질문할 수 있게.
questionEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") ask();
});

async function ask() {
  // .trim(): 앞뒤 공백을 떼어 '띄어쓰기만 입력'한 경우를 빈 질문으로 친다(헛 호출 방지).
  const question = questionEl.value.trim();
  if (!question) {
    setStatus("질문을 먼저 입력해 주세요.", "bad");
    return;
  }

  askBtn.disabled = true;
  answerBox.hidden = true;
  setStatus("내 문서에서 근거를 찾고, 서버가 대신 AI에게 물어보는 중…");

  try {
    // 브라우저 → 우리 서버 창구. 키는 보내지 않는다(서버가 가지고 있다).
    const res = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ question }),
    });

    const data = await res.json();

    if (!res.ok) {
      // 서버가 알려준 에러 메시지만 보여 준다(비밀 키는 절대 안 담김).
      throw new Error(data.error || `서버 오류 (${res.status})`);
    }

    // 답 표시
    // textContent 사용(innerHTML 아님): AI 답에 <script> 같은 게 섞여 와도 그대로 '글자'로만
    // 보여 주어 코드 실행을 막는다(XSS 방지). 출력은 기본으로 textContent가 안전하다.
    answerEl.textContent = data.answer;

    // 근거 문서 표시 (RAG의 핵심: 어디서 답을 가져왔는지 보여 준다)
    if (data.sources && data.sources.length > 0) {
      sourcesEl.textContent = "근거 문서: " + data.sources.join(", ");
    } else {
      sourcesEl.textContent = "근거 문서: (해당 내용을 가진 문서를 못 찾음)";
    }

    answerBox.hidden = false;
    setStatus("완료! 이 답은 위 '근거 문서'에만 기반합니다.", "ok");
  } catch (err) {
    setStatus("실패: " + err.message, "bad");
  } finally {
    // finally: 성공이든 실패든 마지막엔 반드시 버튼을 다시 켠다.
    // (성공 때만 켜면, 에러가 나는 순간 버튼이 영영 잠겨 다시 못 물어보게 됨)
    askBtn.disabled = false;
  }
}

function setStatus(msg, kind = "") {
  statusEl.textContent = msg;
  statusEl.className = "status" + (kind ? " " + kind : "");
}
