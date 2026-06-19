/*
  server.js — 레이트리밋이 걸린 미니 API 서버
  ─────────────────────────────────────────────
  이 파일이 무엇인가:
    Express로 작은 웹서버를 띄우고, /api/hello 라우트에 "1분에 N회" 레이트리밋을 붙인다.
    public/ 폴더의 데모 페이지(index.html)도 함께 서빙해, 브라우저에서 직접 막혀 볼 수 있다.
  왜 있는가:
    "레이트리밋이 실제로 요청을 어떻게 막는지"를 눈으로 확인하는 실습용 서버.
  보안 메모:
    Redis 접속 주소(REDIS_URL)에는 비밀번호가 들어갈 수 있으므로 코드에 박지 않고
    환경변수(.env)에서만 읽는다. .env는 .gitignore로 깃에서 제외된다.
*/

import express from "express";
import { createClient } from "redis";   // node-redis v4 — Redis와 대화하는 클라이언트
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import { createRateLimiter } from "./rateLimiter.js";

// ── 0) 환경변수 로드 ──
// dotenv로 .env 파일의 값을 process.env 에 채운다.
// import "dotenv/config" 한 줄이면 자동으로 .env를 읽어 준다(코드에 비밀값을 안 적게 하는 핵심).
import "dotenv/config";

// ESM(모듈) 환경에서는 __dirname이 기본 제공되지 않으므로 직접 계산한다.
// (public 폴더의 절대경로를 만들기 위해 필요)
const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// trust proxy: Vercel·Render·Nginx 같은 프록시 "뒤"에서 돌면, 실제 방문자 IP가
// X-Forwarded-For 헤더에 담겨 온다. 이 설정을 켜야 req.ip가 진짜 방문자 IP가 된다.
// (주의: 신뢰할 수 없는 곳에서 들어오는 X-Forwarded-For는 조작될 수 있으니,
//  실제로 내 앞단 프록시가 있을 때만 켜는 게 안전하다. 로컬 단독 실행이면 영향 없음.)
app.set("trust proxy", 1);

// ── 1) Redis 연결 ──
// 접속 주소는 환경변수에서만 읽는다. 없으면 로컬 기본값(redis://localhost:6379)을 시도.
const redis = createClient({
  url: process.env.REDIS_URL || "redis://localhost:6379",
});
// 연결 오류가 나도 프로세스가 즉시 죽지 않도록 에러를 로깅만 한다(원인 파악용).
redis.on("error", (err) => console.error("[redis] 연결 오류:", err.message));

// ── 2) 정적 파일(데모 페이지) 서빙 ──
// public 폴더 안 파일들을 그대로 내보낸다 → http://localhost:3000/ 에서 index.html이 열린다.
app.use(express.static(join(__dirname, "public")));

// ── 3) 보호할 API에 레이트리밋 미들웨어 붙이기 ──
// createRateLimiter(redis)가 돌려준 함수를 라우트 앞에 끼우면, 이 라우트로 오는 모든 요청이
// 먼저 레이트리밋 검사를 통과해야 한다. (여러 라우트에 같은 미들웨어를 재사용할 수 있음)
const limiter = createRateLimiter(redis);

app.get("/api/hello", limiter, (req, res) => {
  // 한도 이내일 때만 여기 도달한다. 그냥 간단한 JSON을 돌려준다.
  res.json({ ok: true, message: "통과! 정상 응답입니다.", time: new Date().toISOString() });
});

// ── 4) 서버 시작 ──
// Redis는 먼저 connect()로 연결을 맺어야 명령(INCR 등)을 보낼 수 있다 → await로 기다린 뒤 서버를 켠다.
async function start() {
  await redis.connect();
  app.listen(PORT, () => {
    console.log(`http://localhost:${PORT} 에서 실행 중`);
    console.log(`레이트리밋: ${process.env.RATE_LIMIT_WINDOW_SEC || 60}초당 ${process.env.RATE_LIMIT_MAX || 10}회`);
  });
}

start().catch((err) => {
  // 여기로 오면 보통 Redis 접속 실패다(주소/비밀번호/포트 또는 Redis가 안 켜짐).
  console.error("서버 시작 실패:", err.message);
  process.exit(1); // 잘못된 상태로 계속 돌지 않게 종료
});
