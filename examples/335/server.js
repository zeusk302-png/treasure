/*
  이 파일은 무엇인가:
  "서버가 지금 살아있는지"를 알려 주는 헬스체크(health check) 엔드포인트가 들어 있는
  아주 작은 Express 서버(server.js)입니다.

  왜 있는가:
  실습 335의 목표는 "장애를 사용자보다 내가 먼저 아는 것"입니다.
  - 무료 업타임 모니터(UptimeRobot 등)가 1~5분마다 이 서버의 /health 주소를 두드립니다.
  - 우리 서버가 200(정상)을 주면 "살아있음", 응답이 없거나 503(고장)을 주면 모니터가
    이메일/슬랙으로 "다운됐다"고 알려 줍니다.
  그래서 이 파일은 "내가 살아있다"고 외부 감시자에게 증명하는 작은 창구입니다.

  핵심 개념 2가지(이 코드가 둘을 나눠 보여 줍니다):
  1) 얕은(liveness) 헬스체크  → /healthz : "프로세스가 떠 있나?"만 빠르게 답함(외부 의존성 안 봄).
  2) 깊은(readiness) 헬스체크 → /health : "DB 같은 의존성까지 멀쩡해서 손님을 받을 수 있나?"까지 확인.
  업타임 모니터에는 보통 /health(깊은 쪽)를 등록해 "실제로 일할 수 있는 상태"인지를 감시합니다.
*/

// Express: 가장 흔히 쓰는 Node.js 웹서버 라이브러리. (npm install express 로 받음)
// 비전공자 메모: '주방(서버)'에 '주문 받는 창구(라우트)'를 다는 도구라고 보면 됩니다.
const express = require("express");

const app = express();

// 포트는 환경변수에서 읽고, 없으면 3000을 씁니다.
// 왜 환경변수로 두나: 배포 플랫폼(Render·Railway 등)은 자기들이 정한 포트를 PORT로 넘겨주기 때문입니다.
// 코드에 숫자를 박아 두면 그 플랫폼에서 안 떠서, '플랫폼이 정해 주면 그걸 따른다'로 만든 것.
const PORT = process.env.PORT || 3000;

// 서버가 켜진 시각. "얼마나 오래 떠 있었나(uptime)"를 계산해 헬스 응답에 같이 보여 주려고 기록합니다.
// 디렉터 관점: uptime이 자꾸 0초로 리셋되면 "서버가 몰래 계속 재시작 중"이라는 위험 신호라, 보여 주면 진단에 도움이 됩니다.
const startedAt = Date.now();

/*
  의존성 점검 함수(checkDatabase):
  진짜 서비스라면 여기서 DB에 가벼운 쿼리(SELECT 1)를 날려 "DB가 응답하나"를 봅니다.
  이 실습은 DB가 없어도 돌아가게, 환경변수 FORCE_DB_DOWN 으로 '고장난 척'을 흉내 낼 수 있게 했습니다.
  왜 가짜 점검을 두나: 모니터가 503(고장)을 받았을 때 정말로 알림이 오는지 '일부러 고장 내서' 시험해 보기 위함입니다.
*/
async function checkDatabase() {
  // FORCE_DB_DOWN=1 로 켜 두면, 의존성이 죽은 상황을 흉내 냅니다(고장 알림 테스트용).
  if (process.env.FORCE_DB_DOWN === "1") {
    return { ok: false, detail: "강제 다운 모드(FORCE_DB_DOWN=1)로 DB가 죽은 척 합니다" };
  }
  // 실제 프로젝트에서는 아래 한 줄 자리에 진짜 점검을 넣습니다. 예:
  //   await db.query("SELECT 1");
  //   const { error } = await supabase.from("health").select("id").limit(1);
  // 점검 쿼리는 반드시 '아주 가벼운 것'으로. 무거운 쿼리를 넣으면 모니터가 부를 때마다 DB에 부하를 주기 때문입니다.
  return { ok: true, detail: "ok(데모: 실제 DB 점검 자리)" };
}

/*
  /healthz — 얕은(liveness) 헬스체크
  "이 Node 프로세스가 살아서 응답이라도 하나?"만 즉시 답합니다. 외부 의존성은 보지 않습니다.
  왜 분리하나: 일부 오케스트레이터(쿠버네티스 등)는 '프로세스 생존'만 보고 재시작을 결정하는데,
  여기서 DB까지 보면 DB가 잠깐 느릴 때 멀쩡한 서버를 죽여 버리는 사고가 나기 때문입니다.
*/
app.get("/healthz", (req, res) => {
  // 200 = "정상". 본문은 가볍게.
  res.status(200).json({ status: "ok" });
});

/*
  /health — 깊은(readiness) 헬스체크
  의존성(DB 등)까지 확인해 "지금 손님을 받아도 되나"를 답합니다. 업타임 모니터는 보통 이 주소를 감시합니다.
*/
app.get("/health", async (req, res) => {
  const db = await checkDatabase();

  // 종합 판정: 의존성이 다 ok 여야 전체 ok.
  const healthy = db.ok;

  // 응답 본문: 사람이 봐도 진단되게 항목별 상태와 uptime을 담습니다.
  const body = {
    status: healthy ? "ok" : "error",      // 모니터가 본문 키워드로도 판정할 수 있게 status를 명시
    uptimeSeconds: Math.floor((Date.now() - startedAt) / 1000), // 떠 있던 시간(초)
    timestamp: new Date().toISOString(),   // 응답을 만든 시각(UTC). 로그와 대조하기 쉬움
    checks: {
      database: db,                        // 의존성별 상세(왜 죽었는지 detail 포함)
    },
  };

  // 상태코드로도 판정 가능하게: 정상 200, 고장 503.
  // 왜 503(Service Unavailable)인가: "서버 자체는 떴지만 지금은 일을 받을 수 없다"는 뜻으로,
  // 모니터·로드밸런서가 "이 인스턴스로는 트래픽 보내지 마"라고 알아듣는 표준 신호이기 때문입니다.
  // (여기서 500을 쓰면 '코드가 터졌다'는 다른 뉘앙스라, 의존성 미준비에는 503이 더 정확합니다.)
  res.status(healthy ? 200 : 503).json(body);
});

// 데모용 홈: 브라우저로 그냥 열었을 때 안내가 보이게.
// 사용자 입력을 그대로 화면에 그리지 않으므로 XSS 위험이 없는 정적 문자열만 보냅니다.
app.get("/", (req, res) => {
  res
    .type("text/plain")
    .send("실습 335 헬스체크 서버입니다. /health 또는 /healthz 로 상태를 확인하세요.");
});

// 서버 시작.
app.listen(PORT, () => {
  // 콘솔 로그도 '무엇을/어디서' 보게: 배포 로그에서 정상 기동을 한눈에 확인하려고 주소를 찍어 줍니다.
  console.log(`[health-demo] 서버 시작: http://localhost:${PORT}  (점검: /health, /healthz)`);
});
