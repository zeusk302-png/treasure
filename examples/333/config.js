/*
  이 파일은 무엇인가:
  앱이 쓰는 "비밀값(시크릿)"을 한 곳에서 process.env(환경변수)로만 읽어 오는 설정 로더입니다.
  왜 있는가:
  비밀값(API 키·DB 비밀번호 등)을 코드 곳곳에 직접 적으면, 그 코드가 깃에 올라가는 순간
  세상에 공개됩니다. 그래서 코드는 "값"을 갖지 않고 process.env.X 로 "참조"만 하게 만들고,
  진짜 값은 .env(깃 제외) 또는 배포 플랫폼 시크릿에만 둡니다. 이 파일이 그 참조 창구입니다.
*/

// .env 파일을 process.env 로 불러오는 한 줄.
// 왜: 로컬에서는 .env 파일에 적은 값을 환경변수처럼 쓰기 위함. (배포 환경엔 .env 가 없어도
//     플랫폼이 환경변수를 직접 주입하므로, .env 가 없으면 그냥 조용히 넘어가도 된다.)
// dotenv 가 설치돼 있으면 쓰고, 없으면(설치 전이라도) 에러로 죽지 않게 try 로 감쌌다.
try {
  // require 를 try 안에 둔 이유: dotenv 미설치 상태에서도 이 예제가 동작하도록(학습용 안전장치).
  require("dotenv").config();
} catch (e) {
  // dotenv 가 없으면 안내만 하고 계속 진행. 배포 플랫폼은 환경변수를 직접 주므로 문제없다.
  console.warn("(안내) dotenv 미설치 — .env 자동 로딩은 생략합니다. 'npm install dotenv' 후 다시 시도하세요.");
}

/*
  비밀값을 화면/로그에 찍을 때 쓰는 마스킹 함수.
  무엇: 'sk-ant-' 로 시작하는 긴 키 같은 값을 'sk-a****GH' 처럼 앞뒤 몇 글자만 남기고 가린다.
  왜: 디버깅하려고 값을 그대로 console.log 하면, 그 로그가 서버 로그/CI 로그에 남아 또 유출된다.
      값이 "들어왔는지"만 확인하면 되므로, 절대 전체를 찍지 않고 항상 가운데를 가린다.
*/
function mask(value, keep = 4) {
  if (!value) return "(비어 있음)"; // 값이 없으면 가릴 것도 없음
  if (value.length <= keep * 2) return "****"; // 너무 짧으면 통째로 가림(앞뒤가 겹치지 않게)
  const head = value.slice(0, keep); // 앞 keep 글자
  const tail = value.slice(-keep); // 뒤 keep 글자
  return `${head}****${tail}`; // 가운데는 항상 ****
}

/*
  실제로 읽어 오는 비밀값들.
  무엇: 앱이 필요로 하는 키들을 process.env 에서 꺼낸다.
  왜 키 이름만 적나: 진짜 값은 .env / 플랫폼 시크릿에 있고, 코드는 "이름표"만 안다.
      이렇게 하면 로컬·배포에서 코드 수정 없이 값만 갈아끼울 수 있다.
*/
const config = {
  // Claude(Anthropic) API 키 — 서버 전용 비밀값(sk-ant-...). 절대 브라우저로 내보내지 않는다.
  claudeApiKey: process.env.CLAUDE_API_KEY,

  // Stripe 시크릿 키(sk_live_... / sk_test_...) — 결제를 움직이는 키라 반드시 서버 전용 비밀.
  stripeSecretKey: process.env.STRIPE_SECRET_KEY,

  // 데이터베이스 접속 문자열(비밀번호 포함) — 새면 DB 전체가 털리므로 최고 등급 비밀.
  databaseUrl: process.env.DATABASE_URL,

  // Supabase service_role 키 — RLS 를 우회하는 만능 키라서 service_role 은 '서버 전용 비밀'이다.
  // (반대로 anon/publishable 키는 공개돼도 되는 값이며 RLS 로 보호한다 — 이건 비밀이 아니다.)
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY,

  // 공개돼도 되는 값의 예: 사이트 주소. 비밀이 아니라 기본값을 코드에 둬도 안전하다.
  // 왜 분리해 보여주나: "모든 환경변수가 비밀은 아니다"라는 걸 코드로 보여주기 위함.
  publicSiteUrl: process.env.PUBLIC_SITE_URL || "http://localhost:3000",
};

/*
  필수 비밀값이 빠졌는지 검사.
  무엇: 꼭 있어야 하는 키가 비어 있으면 친절한 메시지와 함께 앱을 멈춘다.
  왜: 값이 없는 채로 돌면 한참 뒤 엉뚱한 곳에서 알 수 없는 에러가 난다.
      "무엇이, 어디에 없는지"를 시작 시점에 바로 알려 줘야 비전공자가 고치기 쉽다.
*/
function assertRequired() {
  // 이 앱이 '반드시' 필요로 하는 비밀값 목록(공개값 publicSiteUrl 은 필수 아님).
  const required = {
    CLAUDE_API_KEY: config.claudeApiKey,
    STRIPE_SECRET_KEY: config.stripeSecretKey,
    DATABASE_URL: config.databaseUrl,
    SUPABASE_SERVICE_ROLE_KEY: config.supabaseServiceRoleKey,
  };

  // 값이 비어 있는 키 이름만 모은다.
  const missing = Object.entries(required)
    .filter(([, v]) => !v) // 값이 없는 것만 남김
    .map(([name]) => name); // 이름만 추림

  if (missing.length > 0) {
    // 어떤 키가 없는지 + 어떻게 채우는지까지 알려 준다(친절한 실패).
    throw new Error(
      `필수 환경변수가 없습니다: ${missing.join(", ")}\n` +
        `해결: .env.example 을 복사해 .env 를 만들고 값을 채우세요. (cp .env.example .env)`
    );
  }
}

// 다른 파일(app.js, scan-secrets.js 등)에서 가져다 쓸 수 있게 내보낸다.
module.exports = { config, mask, assertRequired };
