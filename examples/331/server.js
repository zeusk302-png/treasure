// =============================================================================
// 이 파일은 무엇인가:
//   server.js — 아주 단순한 Express 웹앱입니다.
//   브라우저로 "/"에 접속하면 (1) 방문 1건을 Postgres에 기록하고
//   (2) 최근 방문 목록을 HTML로 그려 보여줍니다.
// 왜 있는가:
//   docker-compose로 띄운 "앱 컨테이너(web)"가 "DB 컨테이너(db)"에
//   실제로 연결되어 데이터를 주고받는지를 눈으로 확인하기 위한 데모입니다.
// =============================================================================

const express = require("express");
const { Pool } = require("pg"); // Postgres 접속용 커넥션 풀

const app = express();

// -----------------------------------------------------------------------------
// DB 접속 설정
//  - 접속 정보는 코드에 박지 않고 환경변수(process.env)에서 읽습니다.
//    왜: 비밀번호 같은 값을 소스/깃에 노출하지 않기 위해서입니다.
//    이 값들은 docker-compose.yml이 .env를 읽어 web 컨테이너에 넣어줍니다.
//  - ★ host의 기본값이 "db" 입니다(localhost 아님).
//    compose 네트워크 안에서는 '서비스 이름 db'가 곧 Postgres의 주소이기 때문입니다.
// -----------------------------------------------------------------------------
const pool = new Pool({
  host: process.env.DB_HOST || "db",
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || "postgres",
  password: process.env.DB_PASSWORD || "postgres",
  database: process.env.DB_NAME || "appdb",
});

// -----------------------------------------------------------------------------
// DB 연결을 몇 번 재시도하는 함수
//  왜 필요한가: web이 db보다 먼저 떠서 첫 접속이 실패하는 경우가 흔합니다.
//  (compose의 healthcheck로도 막지만, 안전망으로 앱에서도 재시도합니다.)
//  실패해도 즉시 죽지 않고 잠시 기다렸다 다시 시도한 뒤, 끝내 안 되면
//  명확한 에러를 출력하고 종료해 원인을 알기 쉽게 합니다.
// -----------------------------------------------------------------------------
async function waitForDb(retries = 10, delayMs = 2000) {
  for (let i = 1; i <= retries; i++) {
    try {
      await pool.query("SELECT 1"); // 가장 단순한 "살아있니?" 쿼리
      console.log("DB 연결 성공");
      return;
    } catch (err) {
      console.log(`DB 연결 대기 중... (${i}/${retries}) - ${err.code || err.message}`);
      await new Promise((r) => setTimeout(r, delayMs));
    }
  }
  throw new Error("DB에 연결하지 못했습니다. .env의 비밀번호/호스트(db) 설정을 확인하세요.");
}

// -----------------------------------------------------------------------------
// 작은 유틸: 사용자에게 보여줄 문자열의 HTML 특수문자를 막아줍니다.
//  왜: 화면 출력에 사용자/외부 값이 섞일 때 그대로 HTML로 넣으면
//  <script> 같은 게 실행되는 XSS 위험이 있습니다. 그래서 <, >, & 등을
//  안전한 글자로 바꿔(이스케이프) 텍스트로만 보이게 합니다.
//  (여기 데이터는 서버가 만든 시각뿐이지만, 안전 습관을 기본값으로 둡니다.)
// -----------------------------------------------------------------------------
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}

// -----------------------------------------------------------------------------
// "/" 라우트: 방문을 기록하고 최근 목록을 보여줍니다.
// -----------------------------------------------------------------------------
app.get("/", async (req, res) => {
  try {
    // (1) 방문 1건 기록.
    //  값은 파라미터 바인딩($1)으로 넣습니다 — SQL 인젝션을 막는 안전한 방식입니다.
    //  (문자열을 직접 이어 붙이면 입력에 따라 쿼리가 조작될 수 있어 위험합니다.)
    const ua = req.headers["user-agent"] || "unknown";
    await pool.query("INSERT INTO visits (user_agent) VALUES ($1)", [ua]);

    // (2) 최근 방문 10건 조회.
    const result = await pool.query(
      "SELECT id, visited_at, user_agent FROM visits ORDER BY id DESC LIMIT 10"
    );
    const total = await pool.query("SELECT count(*)::int AS c FROM visits");

    // (3) 결과를 HTML로 그립니다. 동적 값은 위 escapeHtml로 감싸 안전하게 출력합니다.
    const rows = result.rows
      .map(
        (r) =>
          `<tr><td>${r.id}</td><td>${escapeHtml(r.visited_at)}</td><td>${escapeHtml(
            r.user_agent
          )}</td></tr>`
      )
      .join("");

    res.send(`<!DOCTYPE html>
<html lang="ko">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>실습 331 — compose 앱+DB 데모</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 720px; margin: 40px auto; padding: 0 16px; color: #1f2937; }
    h1 { font-size: 1.4rem; }
    .big { font-size: 2rem; font-weight: 700; color: #4f46e5; }
    table { border-collapse: collapse; width: 100%; margin-top: 16px; }
    th, td { border: 1px solid #e5e7eb; padding: 8px; text-align: left; font-size: 0.9rem; }
    th { background: #f3f4f6; }
    .note { color: #6b7280; font-size: 0.9rem; }
  </style>
</head>
<body>
  <h1>docker-compose: 앱 + DB 연결 성공!</h1>
  <p>이 페이지를 새로고침할 때마다 방문이 <strong>Postgres(db 컨테이너)</strong>에 기록됩니다.</p>
  <p>총 방문 횟수: <span class="big">${total.rows[0].c}</span></p>
  <table>
    <thead><tr><th>id</th><th>방문 시각(UTC)</th><th>user-agent</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>
  <p class="note">앱(web)은 localhost가 아니라 서비스 이름 <code>db</code>로 Postgres에 접속하고 있습니다.</p>
</body>
</html>`);
  } catch (err) {
    console.error("요청 처리 중 에러:", err);
    // 사용자에게는 자세한 내부 정보 대신 짧은 메시지만 보여줍니다.
    res.status(500).send("서버 오류가 발생했습니다. 터미널 로그를 확인하세요.");
  }
});

// -----------------------------------------------------------------------------
// 서버 시작
//  DB가 준비될 때까지 기다린 뒤에 listen을 시작합니다.
// -----------------------------------------------------------------------------
const PORT = 3000;
waitForDb()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`서버 시작: http://localhost:${PORT}`);
    });
  })
  .catch((err) => {
    console.error(err.message);
    process.exit(1); // DB에 끝내 못 붙으면 명확히 실패 종료
  });
