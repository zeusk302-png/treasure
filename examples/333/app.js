/*
  이 파일은 무엇인가:
  config.js 가 읽어 온 비밀값을 받아서 "잘 들어왔는지"만 안전하게 확인해 보는 예제 앱입니다.
  왜 있는가:
  "코드는 값을 갖지 않고 process.env 로 참조만 한다"를 눈으로 보여주기 위함입니다.
  비밀값을 통째로 출력하지 않고 마스킹(가운데 가림)해서 찍어, 로그 유출까지 막는 습관을 보여줍니다.
  실행: 이 폴더에서  node app.js
*/

// 설정 로더에서 필요한 것만 가져온다.
// 무엇: config(읽은 값), mask(가림 함수), assertRequired(필수값 검사).
// 왜: 비밀값을 다루는 로직을 한 파일(config.js)에 모아 두고, 앱은 그걸 쓰기만 하면 되게 분리.
const { config, mask, assertRequired } = require("./config");

function main() {
  // 시작하자마자 필수 비밀값이 다 있는지 검사한다.
  // 왜: 없으면 지금 멈춰서 "무엇이 없는지" 알려 주는 게, 한참 뒤 알 수 없는 에러보다 훨씬 친절하다.
  assertRequired();

  console.log("환경변수 로딩 성공 — 아래는 '값이 들어왔는지'만 마스킹으로 확인한 결과입니다.\n");

  // 비밀값들: 절대 전체를 찍지 않고 mask() 로 가운데를 가려서 출력한다.
  // 왜: console.log 로 원문을 찍으면 그 로그가 서버/CI 로그에 남아 또 다른 유출 경로가 된다.
  console.log("CLAUDE_API_KEY            :", mask(config.claudeApiKey));
  console.log("STRIPE_SECRET_KEY         :", mask(config.stripeSecretKey));
  console.log("DATABASE_URL              :", mask(config.databaseUrl));
  console.log("SUPABASE_SERVICE_ROLE_KEY :", mask(config.supabaseServiceRoleKey));

  // 공개돼도 되는 값(사이트 주소)은 비밀이 아니므로 그대로 보여줘도 안전하다.
  // 왜 구분해 보여주나: "모든 환경변수가 비밀은 아니다 — 공개값/비밀값을 구분하라"를 체감시키기 위함.
  console.log("PUBLIC_SITE_URL (공개값)  :", config.publicSiteUrl);

  console.log("\n확인 끝. 위 출력 어디에도 비밀값 '전체'가 평문으로 보이면 안 됩니다(가운데가 **** 여야 정상).");
}

// 앱 실행. 비밀값 누락 같은 에러는 사용자에게 친절한 한 줄 메시지로 보여주고 종료한다.
// 왜: 비전공자가 빨간 스택트레이스 대신 "무엇을 어떻게 고치면 되는지"를 읽을 수 있게 하기 위함.
try {
  main();
} catch (err) {
  console.error("\n[중단] " + err.message);
  process.exit(1); // 0 이 아닌 종료 코드로 끝내, 자동화/CI 도 실패를 알아챌 수 있게 한다.
}
