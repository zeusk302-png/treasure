/*
 * ============================================================================
 * 실습 307 — Redis에 로그인 세션 저장하기 (server.js)
 * ----------------------------------------------------------------------------
 * 이 파일이 무엇이고, 왜 있는가?
 *  - "로그인한 사람이 누구인지"를 기억하는 세션 정보를, 서버 메모리가 아니라
 *    바깥 저장소인 Redis에 키-값으로 보관하는 학습용 데모 서버입니다.
 *  - 핵심 흐름: 로그인 성공 → 무작위 세션 ID 발급 → Redis에 session:<ID> 저장(TTL 포함)
 *              → 브라우저 쿠키엔 ID만 → 요청마다 쿠키의 ID로 Redis를 조회해 누구인지 판별.
 *  - 왜 Redis(외부)에 두나? 세션을 서버 변수(메모리)에 두면 서버를 끄는 순간 모두
 *    로그아웃되고, 서버를 2대로 늘리면 서로의 로그인을 모릅니다(상태가 갈라짐).
 *    Redis라는 공용 창고에 두면 서버를 재시작해도·여러 대로 늘려도 같은 세션을 공유합니다.
 *    이것을 '상태 외부화(state externalization)'라고 부릅니다.
 *
 * 보안 메모:
 *  - REDIS_URL / SESSION_SECRET 같은 비밀값은 코드에 박지 않고 .env(깃 제외)에서 읽습니다.
 *  - 쿠키에는 세션 ID만 담고, 유저 정보 본체는 Redis에만 둡니다(쿠키는 '번호표'일 뿐).
 * ============================================================================
 */

// .env 파일의 값을 process.env로 불러오기 — 비밀값을 코드에 박지 않으려고 가장 먼저 호출합니다.
require("dotenv").config();

const express = require("express");
const cookieParser = require("cookie-parser"); // 요청에 온 쿠키를 req.cookies로 쉽게 읽으려고 사용
const crypto = require("crypto"); // 추측 불가능한(무작위) 세션 ID를 만들기 위한 표준 모듈
const { createClient } = require("redis");

// --- 설정값 읽기 ------------------------------------------------------------
// 비밀값은 전부 환경변수에서 읽습니다. 코드에 직접 적으면 깃/브라우저로 새어 나갈 수 있어 금지.
const PORT = process.env.PORT || 3000;
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
// 쿠키 위조를 막기 위한 서명용 비밀키. 없으면 서버를 띄우지 않습니다(보안 사고 예방).
const SESSION_SECRET = process.env.SESSION_SECRET;
// 세션 유효 시간(초). 데모라 짧게 두어 만료를 눈으로 보기 쉽게 했습니다(기본 5분).
const SESSION_TTL_SECONDS = Number(process.env.SESSION_TTL_SECONDS || 300);

if (!SESSION_SECRET) {
  // 비밀키가 없으면 안전하지 않으므로 차라리 시작을 막습니다 — '조용히 취약하게 도는' 것보다 낫습니다.
  console.error("[중단] SESSION_SECRET 이 .env 에 없습니다. .env.example 을 참고해 채워 주세요.");
  process.exit(1);
}

// --- Redis 연결 -------------------------------------------------------------
// node-redis 클라이언트. 접속 정보(REDIS_URL)는 비밀값이라 환경변수에서만 가져옵니다.
const redis = createClient({ url: REDIS_URL });
redis.on("error", (err) => console.error("[Redis 오류]", err.message));

const app = express();
app.use(express.urlencoded({ extended: false })); // 로그인 폼(form) 데이터를 req.body로 파싱
app.use(cookieParser(SESSION_SECRET)); // 비밀키로 쿠키에 서명 — 누가 쿠키를 위조하면 들통나게 함

// 쿠키 이름을 상수로 둬서 오타로 인한 버그를 막습니다.
const COOKIE_NAME = "sid";

/**
 * 세션 미들웨어
 * - 모든 요청에서 쿠키의 세션 ID(sid)를 꺼내 Redis에서 해당 세션을 조회합니다.
 * - 있으면 req.session 에 사용자 정보를 실어 주고, '활동했으니' TTL을 다시 채웁니다(슬라이딩 세션).
 *   → 계속 쓰는 사용자는 끊기지 않고, 자리를 비운 사용자는 만료되어 자동 로그아웃됩니다.
 */
async function loadSession(req, res, next) {
  req.session = null; // 기본값은 '로그인 안 됨'. 검증을 통과한 경우에만 채웁니다.
  // signedCookies: cookie-parser가 서명 검증까지 마친 쿠키만 들어옵니다(위조 쿠키는 걸러짐).
  const sid = req.signedCookies[COOKIE_NAME];
  if (!sid) return next();

  const key = `session:${sid}`; // 세션은 항상 이 키 형식으로 저장/조회합니다.
  try {
    const raw = await redis.get(key); // Redis에서 세션 본체(JSON 문자열) 가져오기
    if (raw) {
      req.session = { id: sid, ...JSON.parse(raw) };
      // 활동했으니 만료 시간을 처음 값으로 다시 채웁니다(EXPIRE) — '쓰는 동안엔 안 끊김'을 위해.
      await redis.expire(key, SESSION_TTL_SECONDS);
    }
  } catch (e) {
    // Redis 장애 시에도 서버가 죽지 않게 안전하게 통과시킵니다(로그인만 안 된 상태로 처리).
    console.error("[세션 조회 실패]", e.message);
  }
  next();
}
app.use(loadSession);

// --- 화면(HTML) -------------------------------------------------------------
// 사용자 입력(username)을 화면에 넣을 때 escapeHtml로 한 번 걸러 XSS를 막습니다.
// (innerHTML/문자열 삽입으로 그대로 출력하면 사용자가 넣은 <script>가 실행될 수 있어 위험합니다.)
function escapeHtml(s) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function pageLayout(bodyHtml) {
  // 데모용 한 페이지 레이아웃. 학습 목적이라 한 파일에 담았습니다.
  return `<!DOCTYPE html>
<html lang="ko"><head><meta charset="UTF-8" />
<meta name="viewport" content="width=device-width, initial-scale=1.0" />
<title>실습 307 — Redis 세션 데모</title>
<style>
  body{font-family:system-ui,sans-serif;max-width:520px;margin:40px auto;padding:0 16px;line-height:1.6;color:#1f2937}
  .card{border:1px solid #e5e7eb;border-radius:12px;padding:20px;margin:16px 0;box-shadow:0 1px 3px rgba(0,0,0,.06)}
  input{display:block;width:100%;padding:10px;margin:8px 0;border:1px solid #d1d5db;border-radius:8px}
  button{padding:10px 16px;border:0;border-radius:8px;background:#4f46e5;color:#fff;font-weight:600;cursor:pointer}
  .muted{color:#6b7280;font-size:.9rem}
  code{background:#f1f5f9;padding:1px 6px;border-radius:4px}
</style></head><body>${bodyHtml}</body></html>`;
}

// GET / : 로그인 안 했으면 로그인 폼, 했으면 환영 화면 + 남은 세션 시간(TTL) 표시
app.get("/", async (req, res) => {
  if (!req.session) {
    // 비로그인 화면 — 로그인 폼
    return res.send(
      pageLayout(`
      <div class="card">
        <h1>실습 307 — Redis 세션 데모</h1>
        <p class="muted">로그인하면 세션이 <code>Redis</code>에 저장됩니다. 서버를 껐다 켜도 로그인이 유지되는지 확인해 보세요.</p>
        <form method="POST" action="/login">
          <input name="username" placeholder="아이디 (예: hong)" required />
          <input name="password" type="password" placeholder="비밀번호 (데모: 아무거나)" required />
          <button type="submit">로그인</button>
        </form>
      </div>`)
    );
  }

  // 로그인 화면 — Redis에서 이 세션의 남은 TTL(초)을 읽어 화면에 표시합니다.
  const ttl = await redis.ttl(`session:${req.session.id}`);
  // username은 사용자 입력이므로 escapeHtml로 걸러 출력 — XSS 방지.
  const safeName = escapeHtml(req.session.username);
  res.send(
    pageLayout(`
    <div class="card">
      <h1>환영합니다, ${safeName} 님</h1>
      <p>이 세션은 서버 메모리가 아니라 <strong>Redis</strong>에 저장되어 있습니다.</p>
      <p>남은 세션 시간(TTL): <strong id="ttl">${ttl}</strong> 초</p>
      <p class="muted">새로고침/서버 재시작에도 로그인이 유지됩니다. 활동(요청)할 때마다 시간이 다시 채워집니다.</p>
      <form method="POST" action="/logout"><button type="submit">로그아웃</button></form>
    </div>
    <script>
      // 화면의 남은 시간을 1초마다 줄여 보여 줍니다(체감용). 0이 되면 새로고침해 만료를 확인하게 안내.
      // 주의: 실제 만료 판정은 서버/ Redis가 합니다. 이 카운트다운은 표시용일 뿐입니다.
      let t = ${ttl};
      const el = document.getElementById('ttl');
      setInterval(() => { if (t > 0) { t--; el.textContent = t; } }, 1000);
    </script>`)
  );
});

// POST /login : 로그인 처리 — 세션 ID 발급 → Redis 저장(TTL) → 쿠키에 ID만 내려줌
app.post("/login", async (req, res) => {
  const { username, password } = req.body;
  // (학습용) 실제 서비스라면 여기서 DB의 해시된 비밀번호와 대조해야 합니다.
  // 데모이므로 아이디만 있으면 통과시키되, 비밀번호 검증 위치를 주석으로 남깁니다.
  if (!username || !password) {
    return res.status(400).send(pageLayout(`<div class="card">아이디/비밀번호를 입력하세요. <a href="/">돌아가기</a></div>`));
  }

  // 추측 불가능한 세션 ID 생성 — 무작위 32바이트를 16진수로. (순번/타임스탬프는 추측당해서 금지)
  const sid = crypto.randomBytes(32).toString("hex");
  const key = `session:${sid}`;

  // 세션 본체(누구인지)는 Redis에만 저장합니다. EX로 TTL(만료)을 함께 걸어
  // 일정 시간 활동이 없으면 Redis가 알아서 키를 지워 자동 로그아웃되게 합니다.
  await redis.set(key, JSON.stringify({ username, loginAt: Date.now() }), {
    EX: SESSION_TTL_SECONDS,
  });

  // 브라우저에는 세션 ID만 쿠키로 내려줍니다(유저 정보는 절대 쿠키에 안 담음).
  res.cookie(COOKIE_NAME, sid, {
    httpOnly: true, // JS(document.cookie)로 못 읽게 막아 XSS로 세션 탈취되는 걸 줄임
    sameSite: "lax", // 다른 사이트에서 자동 전송되는 걸 제한해 CSRF 위험을 줄임
    signed: true, // SESSION_SECRET으로 서명 — 쿠키 위조를 탐지
    secure: process.env.NODE_ENV === "production", // 운영(HTTPS)에서는 HTTPS로만 전송. 로컬 http에선 꺼야 쿠키가 내려감
    maxAge: SESSION_TTL_SECONDS * 1000, // 브라우저 쪽 쿠키 수명도 세션 TTL과 맞춤(밀리초 단위)
  });

  res.redirect("/");
});

// POST /logout : 로그아웃 — Redis에서 세션 키를 지우고(서버 측 무효화) 쿠키도 비움
app.post("/logout", async (req, res) => {
  if (req.session) {
    // 쿠키만 지우면 '서버는 아직 유효하다고 안다' → 진짜 로그아웃은 Redis의 세션 키를 DEL로 지워야 함.
    await redis.del(`session:${req.session.id}`);
  }
  res.clearCookie(COOKIE_NAME); // 브라우저 쪽 쿠키도 제거
  res.redirect("/");
});

// --- 서버 시작 --------------------------------------------------------------
// Redis에 먼저 연결한 뒤 서버를 띄웁니다(연결 전 요청이 들어와 실패하는 걸 막기 위해).
(async () => {
  await redis.connect();
  app.listen(PORT, () => {
    console.log(`실습 307 세션 데모 실행 중 → http://localhost:${PORT}`);
    console.log(`세션 TTL: ${SESSION_TTL_SECONDS}초 · Redis: 연결됨`);
  });
})();
