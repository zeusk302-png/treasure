/*
 * server.js — Redis 조회수 카운터 (실습 306)
 *
 * 이 파일이 무엇이고 왜 있나:
 * - 페이지 "조회수"를 DB(디스크)에 매번 쓰지 않고, Redis(메모리)에서 INCR 명령으로 1씩 빠르게 올리는 작은 서버입니다.
 * - "인메모리 저장소가 왜 빠른지"를 /benchmark 화면에서 숫자로 직접 비교해 볼 수 있게 했습니다.
 * - 비밀값(Redis 접속 주소)은 코드에 박지 않고 환경변수(REDIS_URL)에서만 읽습니다. (새면 카운터가 조작·삭제될 수 있어서)
 */

// dotenv: .env 파일에 적어 둔 비밀값(REDIS_URL 등)을 process.env로 불러옵니다.
// 왜: 접속 주소 같은 비밀값을 코드에 직접 쓰면 깃에 올라가 노출되므로, 파일로 분리해서 읽는 것.
require("dotenv").config();

const express = require("express");        // 가벼운 웹 서버 프레임워크
const { createClient } = require("redis"); // Redis와 대화하는 공식 클라이언트
const fs = require("fs");                   // 디스크 파일 입출력 (속도 비교용으로만 사용)
const path = require("path");

const app = express();
const PORT = process.env.PORT || 3000;

// ── Redis 접속 ────────────────────────────────────────────────
// 접속 주소는 반드시 환경변수에서 읽습니다.
// 왜: redis://사용자:비밀번호@호스트 형태에는 비밀번호가 들어 있어 코드에 박으면 안 됩니다.
const REDIS_URL = process.env.REDIS_URL;
if (!REDIS_URL) {
  // 비밀값이 없으면 바로 멈춰서 알려줍니다(원인 모를 에러로 헤매지 않게).
  console.error("[설정 오류] REDIS_URL이 없습니다. .env.example을 복사해 .env를 만들고 진짜 주소를 넣어 주세요.");
  process.exit(1);
}

const redis = createClient({ url: REDIS_URL });
// 접속이 끊기거나 주소가 틀렸을 때 조용히 죽지 않고 원인을 보여 줍니다.
redis.on("error", (err) => console.error("[Redis 오류]", err.message));

/**
 * 사용자가 넣은 문자열에서 위험·이상한 글자를 걸러 Redis 키로 안전하게 씁니다.
 * 무엇: page 값에서 영문/숫자/-/_ 만 남기고 길이를 제한.
 * 왜: 사용자가 키 이름을 마음대로 조작(예: 콜론으로 다른 키 침범)하지 못하게 하고,
 *     아래에서 화면에 출력할 때도 안전한 값만 쓰기 위해서.
 */
function safePageName(raw) {
  const cleaned = String(raw || "home").replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40);
  return cleaned || "home"; // 다 걸러져 비면 기본값
}

/**
 * HTML에 값을 끼워 넣을 때 특수문자를 무력화합니다(서버 사이드 이스케이프).
 * 무엇: < > & " ' 를 엔티티로 바꿔 출력.
 * 왜: 사용자가 넣은 값을 HTML에 날것으로 넣으면 <script>가 실행되는 XSS가 생길 수 있어 막는 것.
 *     (브라우저였다면 textContent를 쓰지만, 서버에서 HTML 문자열을 만들 땐 이렇게 직접 이스케이프한다.)
 */
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// ── 메인: 조회수 올리고 보여 주기 ──────────────────────────────
app.get("/", async (req, res) => {
  const page = safePageName(req.query.page); // 예: ?page=hello → "hello"
  const key = `page:${page}:views`;          // Redis에 저장될 키 이름

  // INCR: "키의 숫자를 1 올리고, 올린 값을 돌려준다"를 한 번에 처리하는 명령.
  // 왜 INCR인가: '읽기→+1→쓰기'를 따로 하면 두 사람이 동시에 방문할 때 숫자가 빠질 수 있는데(경쟁 상태),
  //             INCR는 '원자적(atomic)'이라 동시에 와도 절대 빠지지 않습니다. 그리고 메모리라서 즉시 끝납니다.
  const views = await redis.incr(key);

  // page는 위 safePageName으로 걸렀고, 출력 직전 한 번 더 이스케이프(이중 안전장치).
  const safePage = escapeHtml(page);

  res.send(`<!DOCTYPE html>
<html lang="ko">
<head><meta charset="UTF-8" /><title>조회수 카운터 · 실습 306</title>
<style>
  body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;display:grid;place-items:center;height:100vh;margin:0}
  .card{background:#1e293b;padding:32px 40px;border-radius:16px;text-align:center;box-shadow:0 8px 30px rgba(0,0,0,.4)}
  .num{font-size:3rem;font-weight:800;color:#38bdf8;margin:8px 0}
  a{color:#38bdf8}
</style></head>
<body>
  <div class="card">
    <div>페이지 <strong>${safePage}</strong> 조회수</div>
    <div class="num">${views}</div>
    <p>새로고침(F5)할 때마다 1씩 오릅니다 · Redis INCR</p>
    <p><a href="/benchmark">메모리 vs 디스크 속도 비교 보기 →</a></p>
  </div>
</body></html>`);
});

// ── 보너스: "왜 메모리가 빠른가"를 숫자로 보여 주는 속도 비교 ──────
app.get("/benchmark", async (req, res) => {
  const N = 1000; // 같은 작업을 1000번 반복해 시간을 잰다

  // (a) Redis(메모리) 방식: INCR 1000번
  const redisKey = "benchmark:redis";
  await redis.del(redisKey); // 측정 전 0으로 초기화
  const t1 = Date.now();
  for (let i = 0; i < N; i++) {
    await redis.incr(redisKey); // 메모리에서 1씩 증가
  }
  const redisMs = Date.now() - t1;

  // (b) 디스크 파일 방식: 매번 파일을 읽어 +1 하고 다시 저장(전통적 DB 디스크 쓰기를 흉내)
  // 왜 이렇게 비교하나: DB는 결국 디스크에 안전하게 기록하느라 느립니다. 그 느림을 체감시키려는 것.
  const filePath = path.join(__dirname, ".benchmark_counter.tmp");
  fs.writeFileSync(filePath, "0");
  const t2 = Date.now();
  for (let i = 0; i < N; i++) {
    const cur = parseInt(fs.readFileSync(filePath, "utf8"), 10) || 0; // 읽고
    fs.writeFileSync(filePath, String(cur + 1));                       // +1 해서 다시 쓰기(디스크 접근)
  }
  const diskMs = Date.now() - t2;
  try { fs.unlinkSync(filePath); } catch (_) {} // 측정용 임시파일 정리

  const faster = diskMs > 0 ? (diskMs / redisMs).toFixed(1) : "?";

  res.send(`<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8" /><title>속도 비교 · 실습 306</title>
<style>
  body{font-family:system-ui,sans-serif;background:#0f172a;color:#e2e8f0;padding:40px}
  table{border-collapse:collapse;margin:16px 0}
  th,td{border:1px solid #334155;padding:10px 16px;text-align:left}
  th{background:#1e293b}
  a{color:#38bdf8}
</style></head>
<body>
  <h1>같은 작업 ${N}번 — 누가 빠른가?</h1>
  <table>
    <tr><th>방식</th><th>걸린 시간</th></tr>
    <tr><td>Redis(메모리, INCR)</td><td>${redisMs} ms</td></tr>
    <tr><td>파일(디스크, 읽고-쓰기)</td><td>${diskMs} ms</td></tr>
  </table>
  <p>메모리 방식이 약 <strong>${faster}배</strong> 빠릅니다. 디스크는 매번 물리적으로 읽고 쓰느라 느리고, 메모리는 즉시 끝나기 때문입니다.</p>
  <p>그래서 조회수처럼 자주 바뀌는 값은 평소엔 Redis로 빠르게 세고, 가끔만 DB에 백업하는 '캐시형 카운터'를 씁니다.</p>
  <p><a href="/">← 카운터로 돌아가기</a></p>
</body></html>`);
});

// ── 서버 시작 ─────────────────────────────────────────────────
// Redis는 비동기 연결이라 먼저 connect()로 붙은 뒤에 서버를 열어야 합니다(안 그러면 첫 요청이 실패).
(async () => {
  await redis.connect();
  app.listen(PORT, () => {
    console.log(`서버 실행: http://localhost:${PORT}`);
    console.log(`속도 비교:  http://localhost:${PORT}/benchmark`);
  });
})();
