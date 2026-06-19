/*
 * server.js — "Redis 캐시로 느린 API 응답 캐싱하기" 데모 서버
 *
 * 무엇(기능):
 *   - 일부러 느린 "외부 API/무거운 쿼리"를 흉내 낸 함수(getWeatherSlow)를 만든다.
 *   - 그 결과를 Redis에 일정 시간(TTL) 동안 저장(cache-aside)해 두고,
 *     두 번째 요청부터는 Redis에서 즉시 꺼내 응답한다.
 *   - 캐시 적중(HIT)/미스(MISS), 무효화(삭제)까지 한 화면에서 체감하게 한다.
 *
 * 왜(넣은 이유):
 *   - 비전공 디렉터가 "캐시가 왜 빠른지 / 적중·만료·무효화가 뭔지"를 숫자로 보게 하려고.
 *   - 첫 요청은 느리고(예: 1.5초) 두 번째부터 0.00x초로 떨어지는 걸 직접 보면
 *     "왜 굳이 캐시를 쓰나"가 머리가 아니라 몸으로 이해된다.
 *
 * 실행: README의 "따라하는 단계" 참고 (Redis 띄우기 → npm install → npm start)
 */

// Express: 작은 웹 서버를 쉽게 만드는 도구. 라우트(주소)별로 함수를 연결해 준다.
const express = require("express");

// ioredis: Node.js에서 Redis(인메모리 저장소)와 대화하는 클라이언트 라이브러리.
const Redis = require("ioredis");

const app = express();

// 포트와 Redis 주소는 "환경마다 다를 수 있는 값"이라 환경변수로 받는다.
// 왜: 로컬/배포 환경이 달라도 코드를 안 고치고 .env만 바꾸면 되게 하려고.
// (Redis 주소는 비밀이 아니라 그냥 "어디에 붙을지"라서 공개돼도 되지만,
//  비밀번호가 붙은 주소라면 .env에만 두고 코드엔 박지 않는다 — README 참고.)
const PORT = process.env.PORT || 3000;
const REDIS_URL = process.env.REDIS_URL || "redis://127.0.0.1:6379";

// Redis 연결을 한 번 만들어 두고 계속 재사용한다.
// 왜: 요청마다 새로 연결하면 느리고 자원 낭비라, 앱이 켜질 때 하나만 연다.
const redis = new Redis(REDIS_URL);

// 연결 상태를 콘솔에 찍어, 초보가 "Redis가 안 떠 있어서 안 되는 건지"를 바로 알게 한다.
redis.on("connect", () => console.log("[redis] 연결됨:", REDIS_URL));
redis.on("error", (err) =>
  console.error("[redis] 연결 오류 — Redis가 떠 있는지 확인하세요:", err.message)
);

// 정적 파일(index.html 등)을 그대로 서빙한다. 왜: 데모용 화면을 같은 서버에서 열려고.
app.use(express.static(__dirname));

/*
 * getWeatherSlow(city)
 * 무엇: "느린 외부 API / 무거운 DB 쿼리"를 흉내 내는 함수.
 *       1.5초 기다린 뒤 가짜 날씨 데이터를 만들어 돌려준다.
 * 왜: 진짜 외부 API를 부르면 키·요금·네트워크 변수가 생겨 실습이 산만해진다.
 *     "느림"만 재현하면 캐시 효과를 깔끔하게 체감할 수 있어서 일부러 sleep을 넣었다.
 */
function getWeatherSlow(city) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        city,
        tempC: Math.round(15 + Math.random() * 15), // 매번 살짝 다른 값 → 캐시된 값이 "고정"되는 걸 눈으로 확인
        condition: ["맑음", "흐림", "비", "구름조금"][Math.floor(Math.random() * 4)],
        // 이 응답이 "언제 진짜로 계산됐는지" 표시 → 캐시 HIT면 이 시각이 안 바뀐다.
        computedAt: new Date().toISOString(),
      });
    }, 1500); // 1.5초 지연: "느린 응답"을 흉내
  });
}

// 캐시에 데이터를 얼마나 오래 둘지(초). 짧게(30초) 잡아, 실습 중 만료(EXPIRE)도 체감하게 한다.
// 왜: TTL이 지나면 다시 MISS가 나면서 새 값을 계산 → "만료"의 의미를 직접 본다.
const CACHE_TTL_SECONDS = 30;

/*
 * GET /api/weather?city=Busan
 * 무엇: cache-aside(캐시 옆에 둔다) 패턴의 핵심 라우트.
 *   1) 먼저 Redis에 캐시가 있나 본다(있으면 HIT → 즉시 응답)
 *   2) 없으면(MISS) 느린 함수로 진짜 계산하고, 그 결과를 Redis에 TTL과 함께 저장한 뒤 응답
 * 왜: 이 4줄 흐름이 실무 캐싱의 80%다. 두 번째 요청부터 빨라지는 걸 보여주는 무대.
 */
app.get("/api/weather", async (req, res) => {
  // 사용자 입력(도시명)을 그대로 키에 쓰기 전에 정리한다.
  // 왜: 공백·대소문자가 다르면 같은 도시인데 다른 캐시 키가 되어 적중률이 떨어진다.
  const city = String(req.query.city || "Busan").trim().toLowerCase();

  // 캐시 키 규칙: "종류:식별자". 왜: 키를 보고 무슨 캐시인지 알 수 있고, 무효화도 쉽다.
  const cacheKey = `weather:${city}`;

  const startedAt = Date.now(); // 응답까지 걸린 시간 측정 시작 → 캐시 효과를 ms로 보여주려고

  try {
    // 1) 캐시 먼저 조회
    const cached = await redis.get(cacheKey);

    if (cached) {
      // 캐시 HIT: Redis에 저장된 JSON 문자열을 다시 객체로 바꿔서 그대로 응답.
      const data = JSON.parse(cached);
      // 남은 수명(TTL)도 알려준다. 왜: "이 캐시가 언제 만료되나"를 화면에서 보여주려고.
      const ttl = await redis.ttl(cacheKey);
      return res.json({
        source: "cache", // 어디서 왔는지 → 프론트가 HIT 배지를 보여줌
        elapsedMs: Date.now() - startedAt,
        ttlRemaining: ttl,
        data,
      });
    }

    // 2) 캐시 MISS: 진짜로 느리게 계산한다.
    const data = await getWeatherSlow(city);

    // 계산 결과를 Redis에 저장하면서 만료시간(EX)을 같이 건다.
    // 왜: 영원히 두면 옛 데이터가 계속 나가므로, TTL로 "신선도"를 강제한다.
    // 객체는 그대로 못 넣으니 JSON 문자열로 변환해서 저장(Redis 값은 문자열).
    await redis.set(cacheKey, JSON.stringify(data), "EX", CACHE_TTL_SECONDS);

    return res.json({
      source: "origin", // 원본(느린 계산)에서 왔다는 표시 → 프론트가 MISS 배지를 보여줌
      elapsedMs: Date.now() - startedAt,
      ttlRemaining: CACHE_TTL_SECONDS,
      data,
    });
  } catch (err) {
    // 에러도 사람이 읽을 수 있게 돌려준다. 왜: Redis가 죽어도 화면에서 원인을 보게 하려고.
    console.error("[/api/weather] 오류:", err.message);
    return res.status(500).json({ error: "서버 오류: " + err.message });
  }
});

/*
 * POST /api/weather/invalidate?city=Busan
 * 무엇: 특정 도시의 캐시를 강제로 지운다(무효화).
 * 왜: "원본 데이터가 바뀌었으니 캐시를 버려라"가 실무에서 꼭 필요하다.
 *     (예: 가격이 바뀌면 옛 가격 캐시를 지워야 한다.) 이걸 직접 눌러 보게 한다.
 *     무효화 후 다시 조회하면 반드시 MISS가 나는 걸 확인 → 무효화의 의미 체감.
 */
app.post("/api/weather/invalidate", async (req, res) => {
  const city = String(req.query.city || "Busan").trim().toLowerCase();
  const cacheKey = `weather:${city}`;

  // del의 반환값: 실제로 지워진 키 개수(1=있어서 지움, 0=원래 없었음).
  const removed = await redis.del(cacheKey);

  return res.json({
    invalidated: removed === 1, // true면 다음 요청은 MISS가 된다
    cacheKey,
    message:
      removed === 1
        ? "캐시를 지웠습니다. 다음 조회는 다시 느려지고 MISS가 됩니다."
        : "지울 캐시가 없었습니다(이미 비어 있음).",
  });
});

app.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT} 에서 데모를 여세요.`);
});
