/*
  rateLimiter.js — Redis 기반 레이트리밋(요청 횟수 제한) 미들웨어
  ─────────────────────────────────────────────────────────────
  이 파일이 무엇인가:
    "한 사람(IP)이 1분에 N번까지만 호출 가능"이라는 규칙을 검사하는 Express 미들웨어.
  왜 따로 파일로 빼는가:
    레이트리밋은 /api/hello 말고도 로그인·문의·결제 등 여러 라우트에 똑같이 붙이고 싶다.
    한 곳(여기)에 만들어 두고 여러 라우트에서 재사용하면, 규칙을 한 번만 고쳐도 전부 반영된다.
  핵심 아이디어(번호표 기계 비유):
    - 요청이 오면 Redis의 카운터 `rl:<IP>` 를 1 올린다(INCR).
    - 그 카운터가 "이번 창의 첫 요청"이면(=값이 1이면) 만료시간(EXPIRE)을 건다 → 창이 끝나면 카운터가 저절로 사라져 0부터 다시 센다.
    - 카운터가 한도 이하면 통과(next), 한도를 넘으면 429로 거절.
*/

// 환경변수에서 한도/창 길이를 읽는다. (코드에 숫자를 박지 않고 .env로 바꿀 수 있게 — 운영 중 조절이 쉬움)
// Number(...)로 문자열을 숫자로 바꾸고, 값이 없으면 기본값(10회 / 60초)을 쓴다.
const MAX = Number(process.env.RATE_LIMIT_MAX) || 10;          // 창당 허용 횟수
const WINDOW_SEC = Number(process.env.RATE_LIMIT_WINDOW_SEC) || 60; // 창 길이(초)

/*
  createRateLimiter(redis)
  - 이미 연결된 Redis 클라이언트를 받아서, Express 미들웨어 함수를 돌려준다.
  - 이렇게 "클라이언트를 주입(inject)"하면 이 파일이 직접 Redis에 접속하지 않아도 되고,
    테스트나 다른 서버에서 재사용하기 쉽다.
*/
export function createRateLimiter(redis) {
  // 반환되는 이 함수가 바로 Express 미들웨어. (요청마다 한 번씩 실행됨)
  return async function rateLimiter(req, res, next) {
    // 1) 누구의 요청인지 식별 — 여기서는 클라이언트 IP를 기준으로 센다.
    //    req.ip 는 Express가 계산해 주는 IP. 프록시(Vercel/Nginx) 뒤라면 server.js에서
    //    app.set('trust proxy', 1) 을 켜야 진짜 IP가 들어온다(설명은 server.js 참고).
    //    실서비스에서 "로그인한 사용자"별로 제한하고 싶으면 IP 대신 user id를 키로 써도 된다.
    const ip = req.ip || req.socket.remoteAddress || "unknown";
    const key = `rl:${ip}`; // 'rl:' 접두사 — Redis 안에서 레이트리밋 키만 모아 보기/지우기 쉽게

    try {
      // 2) INCR과 EXPIRE를 MULTI/EXEC(트랜잭션)로 한 번에 묶어 보낸다.
      //    왜 묶나: INCR로 올린 직후 다른 요청이 끼어들어 EXPIRE를 빠뜨리면,
      //    만료 없는 카운터가 영원히 남아 "한 번 막히면 영영 못 푸는" 사고가 날 수 있다.
      //    한 번에 보내면 그 틈을 줄일 수 있다.
      const results = await redis
        .multi()
        .incr(key)        // 카운터 +1 (키가 없으면 0에서 시작해 1이 됨) — 원자적 연산이라 동시 요청에도 정확
        .ttl(key)         // 이 키의 남은 만료 시간(초). -1이면 "만료가 안 걸려 있음" 상태
        .exec();

      const count = Number(results[0]); // INCR 결과 = 이번 창에서 누적 요청 수
      let ttl = Number(results[1]);     // TTL 결과 = 남은 시간(초)

      // 3) 이번 창의 "첫 요청"이거나(=count===1) 어쩌다 만료가 안 걸린 키(ttl<0)면 만료를 새로 건다.
      //    이렇게 해야 창이 WINDOW_SEC 뒤에 자동으로 리셋된다(번호표 통을 1분마다 비우는 것).
      if (count === 1 || ttl < 0) {
        await redis.expire(key, WINDOW_SEC);
        ttl = WINDOW_SEC; // 방금 건 만료 시간으로 표시값도 맞춰 둔다
      }

      // 4) 클라이언트가 "지금 얼마나 남았는지" 알 수 있게 표준 헤더를 붙인다.
      //    프론트가 이 값을 보고 "곧 막히겠네" 같은 UX를 만들 수 있다.
      res.setHeader("X-RateLimit-Limit", MAX);                       // 창당 한도
      res.setHeader("X-RateLimit-Remaining", Math.max(MAX - count, 0)); // 남은 횟수(음수 방지)

      // 5) 한도 초과 판정
      if (count > MAX) {
        // Retry-After: "몇 초 뒤에 다시 시도하라"는 표준 헤더. ttl(남은 만료시간)을 그대로 알려 준다.
        res.setHeader("Retry-After", ttl);
        // 사용자 입력을 그대로 끼워 넣지 않고 정해진 문장만 보내므로 XSS 위험 없음.
        return res.status(429).json({
          error: "Too Many Requests",
          message: `요청이 너무 많습니다. ${ttl}초 후에 다시 시도하세요.`,
          retryAfter: ttl,
        });
      }

      // 6) 한도 이내면 통과 — 다음 미들웨어/라우트 핸들러로 넘긴다.
      return next();
    } catch (err) {
      // 7) Redis 장애(연결 끊김 등) 대비 — "막을지 / 통과시킬지"는 정책 결정이다.
      //    여기서는 fail-open(에러 시 통과)을 택한다: 보호 장치 하나가 고장 났다고
      //    서비스 전체를 막아 버리면 더 큰 장애가 되기 때문. (로그인/결제처럼 민감하면
      //    반대로 fail-closed=막기로 바꾸는 게 안전하다 — 상황에 맞게 선택.)
      console.error("[rateLimiter] Redis 오류, 이번 요청은 통과시킴:", err.message);
      return next();
    }
  };
}
