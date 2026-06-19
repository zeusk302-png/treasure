/*
  이 파일은 무엇인가:
  챗봇 화면의 "동작"을 담당합니다.
  - 사용자가 보낸 메시지를 화면에 말풍선으로 띄우고,
  - 서버(/api/chat)로 대화 전체 + 시스템 프롬프트를 보내고,
  - 서버가 글자 조각을 흘려보내면(스트리밍) 그걸 받아 한 글자씩 화면에 채워 "타이핑 효과"를 냅니다.

  왜 여기서 대화 기록(history)을 직접 들고 있나:
  - Claude API는 "기억"이 없습니다. 이전 대화를 기억시키려면 매 요청마다 전체 기록을 같이 보내야 합니다.
  - 그래서 이 배열에 user/assistant 메시지를 차곡차곡 쌓아 둡니다. 이게 바로 "대화 맥락"입니다.
*/

// 화면 요소들을 미리 잡아 둡니다 (매번 찾지 않으려고).
const chatEl = document.getElementById("chat");
const formEl = document.getElementById("form");
const inputEl = document.getElementById("input");
const sendBtn = document.getElementById("send");
const systemEl = document.getElementById("system");

// 대화 맥락(history). [{role:"user"|"assistant", content:"..."}] 형태로 쌓입니다.
const history = [];

/*
  말풍선 하나를 화면에 만들어 추가하고, 그 안의 텍스트 요소를 돌려줍니다.
  왜 textContent 로 글자를 넣나 (★보안 핵심★):
  - 사용자가 입력한 글에 <script> 같은 HTML이 들어올 수 있습니다.
  - innerHTML 로 넣으면 그 코드가 실제로 실행되어 XSS(악성 스크립트) 위험이 생깁니다.
  - textContent 는 무엇이 들어와도 "그냥 글자"로만 그려서 안전합니다. 그래서 항상 textContent 를 씁니다.
*/
function addBubble(role, text) {
  const bubble = document.createElement("div");
  bubble.className = `bubble bubble--${role}`; // user/assistant 에 따라 색을 다르게

  const textNode = document.createElement("span");
  textNode.className = "bubble__text";
  textNode.textContent = text; // ← innerHTML 금지. 사용자 입력을 안전하게 글자로만 출력.

  bubble.appendChild(textNode);
  chatEl.appendChild(bubble);

  // 새 메시지가 보이도록 항상 맨 아래로 스크롤.
  chatEl.scrollTop = chatEl.scrollHeight;
  return textNode; // 스트리밍 중 이 요소에 글자를 계속 이어 붙일 것이라 돌려줌
}

/*
  실제 전송 + 스트리밍 수신 로직.
  async/await + fetch 의 ReadableStream 으로 서버가 흘려보내는 SSE를 한 조각씩 읽습니다.
*/
async function sendMessage(userText) {
  // 1) 사용자 말풍선을 먼저 화면에 띄우고, 기록에도 추가.
  addBubble("user", userText);
  history.push({ role: "user", content: userText });

  // 2) 답이 채워질 빈 assistant 말풍선을 미리 만들어 둡니다 (여기에 글자를 흘려 넣음).
  const answerNode = addBubble("assistant", "");
  let answerText = ""; // 누적된 답 전체 (마지막에 history에 저장하려고)

  // 3) 입력창/버튼 잠그기 — 답이 끝나기 전 중복 전송 방지.
  inputEl.disabled = true;
  sendBtn.disabled = true;

  try {
    // 서버로 시스템 프롬프트 + 대화 전체를 보냅니다.
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system: systemEl.value,
        messages: history,
      }),
    });

    if (!res.ok) {
      throw new Error("서버 응답 오류: " + res.status);
    }

    // 서버가 흘려보내는 바이트 스트림을 글자로 바꿔 읽기 위한 도구들.
    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = ""; // SSE 한 줄이 두 조각에 걸쳐 올 수 있어 임시로 모아 둠

    // 스트림이 끝날 때까지 계속 읽습니다.
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE는 "data: {...}\n\n" 묶음이 하나의 이벤트입니다. \n\n 기준으로 잘라 처리.
      const parts = buffer.split("\n\n");
      buffer = parts.pop(); // 마지막 조각은 아직 안 끝났을 수 있으니 다음 루프로 넘김

      for (const part of parts) {
        const line = part.trim();
        if (!line.startsWith("data:")) continue;

        // "data:" 뒤의 JSON 문자열을 객체로 변환.
        const payload = JSON.parse(line.slice(5).trim());

        if (payload.text) {
          // 글자 조각이 오면 누적하고, 말풍선에 textContent 로 다시 그립니다(안전).
          answerText += payload.text;
          answerNode.textContent = answerText;
          chatEl.scrollTop = chatEl.scrollHeight;
        }
        if (payload.error) {
          answerNode.textContent = "[오류] " + payload.error;
        }
        // payload.done 이 오면 자연스럽게 루프가 곧 끝납니다(서버가 연결을 닫음).
      }
    }

    // 4) 다 받은 답을 기록에 저장 — 다음 질문 때 맥락으로 다시 보내기 위해.
    if (answerText) {
      history.push({ role: "assistant", content: answerText });
    }
  } catch (err) {
    // 네트워크/서버 문제 등. 사용자에게도 보이게 표시.
    answerNode.textContent = "[연결 오류] 서버가 켜져 있는지, .env에 키가 있는지 확인하세요.";
    console.error(err);
  } finally {
    // 5) 입력창/버튼 다시 풀고 포커스 — 바로 다음 질문을 칠 수 있게.
    inputEl.disabled = false;
    sendBtn.disabled = false;
    inputEl.focus();
  }
}

// 폼 제출(보내기 버튼 또는 Enter)을 가로채 전송합니다.
formEl.addEventListener("submit", (e) => {
  e.preventDefault(); // 페이지 새로고침 막기 — 새로고침되면 대화가 날아갑니다.
  const text = inputEl.value.trim();
  if (!text) return; // 빈 메시지는 보내지 않음
  inputEl.value = "";
  sendMessage(text);
});
