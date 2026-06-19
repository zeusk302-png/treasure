/**
 * 파일 요약: WebSocket 실시간 채팅 서버 (실습 310)
 *
 * 이 파일은 무엇인가:
 *  - 브라우저(채팅 클라이언트)와 "양방향 연결"을 열어 두는 작은 서버입니다.
 *  - 누군가 메시지를 보내면, 그 순간 "접속해 있는 모두에게" 그 메시지를 그대로 퍼뜨립니다(브로드캐스트).
 *
 * 왜 WebSocket인가 (HTTP와의 차이):
 *  - 일반 HTTP는 "손님이 물어볼 때만 점원이 답하는" 요청-응답 1회성입니다.
 *    → 새 메시지가 와도 브라우저가 새로고침(다시 물어보기) 하지 않으면 모릅니다.
 *  - WebSocket은 한 번 연결을 "전화선처럼" 계속 열어 둡니다.
 *    → 서버가 먼저 말을 걸 수 있어, 새로고침 없이 메시지가 즉시 모두에게 도착합니다.
 *
 * 실행: node server.js  (먼저 npm install 로 ws 라이브러리 설치)
 */

// 'ws'는 Node.js에서 WebSocket 서버를 손쉽게 만드는 표준격 라이브러리입니다.
// (브라우저에는 WebSocket이 내장돼 있지만, 서버 쪽에는 이렇게 라이브러리를 씁니다.)
const { WebSocketServer } = require("ws");

// 포트는 환경변수(PORT)가 있으면 그걸, 없으면 3000을 씁니다.
// 왜 환경변수로? 배포 환경(예: Render/Railway)은 포트를 자기가 정해 주는 경우가 많아,
// 코드에 숫자를 박지 않고 환경변수로 받아야 어디서든 그대로 돌아갑니다.
const PORT = process.env.PORT || 3000;

// 채팅방 이름이 보일 때 쓸 수 있는 값. 비밀이 아니라 그냥 표시용이라 코드에 둬도 됩니다.
// (진짜 비밀값은 절대 여기 두지 않습니다 — 이 실습엔 비밀값 자체가 없습니다.)
const ROOM_NAME = process.env.ROOM_NAME || "공개 라운지";

// WebSocket 서버를 지정한 포트에서 엽니다.
const wss = new WebSocketServer({ port: PORT });

console.log(`[chat] WebSocket 서버가 ws://localhost:${PORT} 에서 대기 중 (방: ${ROOM_NAME})`);

/**
 * 접속한 모든 클라이언트에게 같은 메시지를 보내는 함수 = "브로드캐스트".
 * 왜 필요한가: 채팅은 "한 명이 말하면 방 안 전체가 듣는" 구조라,
 * 한 사람이 보낸 글을 연결돼 있는 모두에게 다시 뿌려 줘야 합니다.
 *
 * @param {object} payload  - 보낼 데이터(객체). 아래에서 JSON 문자열로 바꿔 보냅니다.
 * @param {WebSocket|null} except - 이 연결에는 보내지 않음(주로 보낸 본인 제외용, 여기선 사용 안 함)
 */
function broadcast(payload, except = null) {
  // WebSocket은 문자열/바이너리만 보낼 수 있어, 객체를 JSON 문자열로 변환해 보냅니다.
  const text = JSON.stringify(payload);

  // wss.clients 는 "지금 연결돼 있는 모든 클라이언트" 목록입니다.
  for (const client of wss.clients) {
    // readyState === OPEN 인 연결에만 보냅니다.
    // 왜? 끊기는 중이거나 닫힌 연결에 보내면 에러가 나기 때문에, 살아 있는 연결만 골라 보냅니다.
    if (client !== except && client.readyState === client.OPEN) {
      client.send(text);
    }
  }
}

// 접속자 수를 세는 변수. 입·퇴장 안내에 쓰려고 둡니다.
let onlineCount = 0;

// 'connection' 이벤트: 새 브라우저가 연결될 때마다 한 번 실행됩니다.
// socket = 방금 들어온 그 한 명과의 전화선(개별 연결)이라고 생각하면 됩니다.
wss.on("connection", (socket) => {
  onlineCount += 1;

  // 방금 들어온 사람 본인에게만 "환영" + 현재 인원수를 보냅니다.
  // 왜 본인에게만? 입장 직후 화면에 방 이름과 인원을 바로 보여 주려는 것이라, 전체에 뿌릴 필요가 없습니다.
  socket.send(
    JSON.stringify({
      type: "system",
      text: `${ROOM_NAME}에 입장했습니다. 현재 접속 ${onlineCount}명`,
    })
  );

  // 나머지 모두에게 "누군가 들어왔다 + 현재 인원"을 알립니다.
  broadcast({ type: "system", text: `새 사용자가 입장했습니다. 현재 접속 ${onlineCount}명` }, socket);

  // 'message' 이벤트: 이 사람이 메시지를 보낼 때마다 실행됩니다.
  socket.on("message", (raw) => {
    // 들어온 데이터는 Buffer/문자열이라 우선 문자열로 만든 뒤 JSON으로 해석합니다.
    let data;
    try {
      data = JSON.parse(raw.toString());
    } catch {
      // 형식이 깨진(=JSON이 아닌) 입력은 무시합니다.
      // 왜? 이상한 데이터로 서버가 죽지 않게 막는 최소한의 방어입니다.
      return;
    }

    // 닉네임/내용에서 앞뒤 공백을 제거하고, 너무 긴 값은 잘라 둡니다.
    // 왜 자르나: 누군가 수십만 글자를 보내 서버/화면을 마비시키는 걸 막는 간단한 안전장치입니다.
    const name = String(data.name || "익명").trim().slice(0, 20) || "익명";
    const message = String(data.message || "").trim().slice(0, 500);

    // 빈 메시지는 굳이 퍼뜨리지 않습니다.
    if (!message) return;

    // 핵심: 받은 메시지를 "접속한 모두"에게 그대로 퍼뜨립니다(보낸 본인 포함).
    // 본인도 포함하는 이유: 클라이언트는 "서버가 돌려준 것"만 화면에 그려서,
    // 모두의 화면에 똑같은 순서로 메시지가 보이게 통일하려는 것입니다.
    broadcast({
      type: "chat",
      name,
      message,
      // 서버 시각을 기준으로 시간을 찍습니다. (각자 컴퓨터 시계가 달라도 순서가 일관되게)
      time: new Date().toISOString(),
    });
  });

  // 'close' 이벤트: 이 사람이 탭을 닫거나 연결이 끊길 때 실행됩니다.
  socket.on("close", () => {
    onlineCount = Math.max(0, onlineCount - 1);
    broadcast({ type: "system", text: `한 사용자가 퇴장했습니다. 현재 접속 ${onlineCount}명` });
  });

  // 'error' 이벤트: 그 연결에서 문제가 생겨도 서버 전체가 죽지 않게 받아만 둡니다.
  socket.on("error", () => {
    /* 개별 연결 오류는 무시 — 서버는 계속 살아 있어야 다른 사람 채팅이 유지됩니다. */
  });
});
