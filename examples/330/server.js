/*
  이 파일은 무엇인가:
  컨테이너 안에 담아 띄울 "아주 작은 웹 서버"입니다. (Node.js + Express)
  브라우저로 접속하면 인사 페이지를, /health 로 접속하면 "살아있음" 신호를 돌려줍니다.

  왜 있는가:
  실습 330의 목표는 "이 앱을 Dockerfile로 이미지화해서 어디서든 똑같이 실행"하는 것입니다.
  그러려면 먼저 "담을 앱"이 필요한데, 그 앱이 바로 이 파일입니다.
  내용이 단순할수록 Docker(이미지·컨테이너) 자체에 집중할 수 있어 일부러 작게 만들었습니다.
*/

// Express: 웹 서버를 몇 줄로 만들게 해 주는 가장 흔한 라이브러리입니다.
// (직접 http 모듈로도 되지만, 초보가 읽기 쉬운 코드를 위해 Express를 씁니다.)
const express = require("express");
const app = express();

// 포트 번호: "이 서버가 몇 번 문으로 손님을 받을지" 정하는 값입니다.
// process.env.PORT 를 먼저 읽는 이유 — 컨테이너/배포 환경마다 쓰라는 포트가 다를 수 있어,
// 코드에 숫자를 박지 않고 "환경변수로 바꿀 수 있게" 열어 두는 것입니다. 없으면 3000을 씁니다.
const PORT = process.env.PORT || 3000;

// 컨테이너가 어느 컴퓨터(호스트명)에서 도는지 보여 주기 위한 값입니다.
// "내 노트북에서 띄우든, 친구 컴퓨터에서 띄우든 똑같이 동작한다"를 눈으로 확인하는 용도입니다.
const os = require("os");

// 메인 페이지: 누가 접속하면 간단한 HTML 한 장을 돌려줍니다.
app.get("/", (req, res) => {
  // 사용자 입력을 그대로 화면에 박아 넣지 않으므로 여기서는 고정 문자열만 보냅니다.
  // (사용자가 보낸 값을 출력해야 한다면 절대 그대로 HTML에 끼우지 말고 이스케이프해야 XSS가 안 납니다.)
  res.send(`
    <!DOCTYPE html>
    <html lang="ko">
      <head><meta charset="UTF-8" /><title>Docker 컨테이너 데모</title></head>
      <body style="font-family: system-ui, sans-serif; max-width: 640px; margin: 48px auto; line-height: 1.6;">
        <h1>🐳 컨테이너 안에서 인사드립니다</h1>
        <p>이 페이지는 <strong>Docker 컨테이너 안</strong>에서 돌고 있는 작은 Node.js 서버가 보내 준 화면입니다.</p>
        <p>실행 중인 컨테이너 이름(호스트명): <code>${os.hostname()}</code></p>
        <p>서버 상태 확인: <a href="/health">/health</a></p>
      </body>
    </html>
  `);
});

// 헬스체크 엔드포인트: "서버가 살아있나?"를 기계가 물어볼 때 쓰는 주소입니다.
// Docker 의 HEALTHCHECK 나 배포 플랫폼이 주기적으로 여기를 찔러 보고, 응답이 없으면 "죽었다"고 판단합니다.
// JSON 으로 단순하게 ok 여부만 돌려줍니다.
app.get("/health", (req, res) => {
  res.json({ status: "ok", uptimeSeconds: Math.round(process.uptime()) });
});

// 서버 켜기: 0.0.0.0 으로 바인딩하는 이유 —
// 컨테이너 안에서 127.0.0.1(자기 자신)에만 열면 컨테이너 "밖"에서는 접속이 안 됩니다.
// 0.0.0.0 은 "모든 네트워크 인터페이스에서 받겠다"는 뜻이라, 호스트가 컨테이너로 들어올 수 있게 해 줍니다.
app.listen(PORT, "0.0.0.0", () => {
  console.log(`서버 시작됨: 포트 ${PORT} 에서 접속 대기 중`);
});
