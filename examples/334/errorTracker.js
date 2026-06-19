/*
  이 파일은 무엇인가:
  "에러 추적(error tracking)" 도구(Sentry 같은)에 에러를 보내는 부분을, 외부 서비스 없이도
  돌려볼 수 있게 흉내 낸 작은 모듈입니다. 진짜 Sentry를 붙이는 방법은 captureException 아래
  주석에 적어 두었습니다.

  왜 있는가:
  - 로그(logger.js)는 "흘러가는 기록"이라 운영 중 터진 에러가 수천 줄 사이에 묻히기 쉽습니다.
  - 에러 추적 도구는 같은 에러를 한곳에 "모아서"(같은 에러는 그룹으로 묶고 횟수를 셈)
    "이 에러가 오늘 47번 났고, 처음 난 시각은 ..." 처럼 보여 줍니다. 그래서 무엇부터
    고칠지 우선순위를 정할 수 있습니다. 이게 관측성에서 로깅과 짝을 이루는 두 번째 축입니다.

  보안 메모:
  - 진짜 Sentry를 쓰면 'DSN'이라는 주소가 필요합니다. 서버 측 DSN/토큰은 비밀값이므로
    코드에 박지 말고 환경변수(.env)에만 둡니다. 이 데모는 DSN이 없으면 콘솔로만 보고합니다.
*/

const logger = require('./logger');

// SENTRY_DSN이 환경변수에 있으면 "실제 전송 흉내", 없으면 "콘솔 보고"만 합니다.
// 왜 이렇게: 키 없이도 실습이 돌아가게 하고, 진짜 키를 넣으면 같은 코드로 실제 전송되도록.
const DSN = process.env.SENTRY_DSN || '';

/**
 * 에러 하나를 추적 도구로 "보고"합니다.
 * @param {Error} err - 잡은 에러 객체
 * @param {object} context - 어떤 상황에서 났는지(userId, path, requestId 등)
 */
function captureException(err, context = {}) {
  // 에러 추적 도구에 보낼 표준 모양으로 정리.
  // stack(호출 경로)을 같이 보내야 "어느 함수 몇 번째 줄에서 터졌나"를 알 수 있어서 포함.
  const event = {
    type: 'error',
    name: err.name,
    message: err.message,
    stack: err.stack,
    context,
    capturedAt: new Date().toISOString(),
  };

  if (!DSN) {
    // 키가 없을 때: 실제 전송 대신, 눈에 띄게 콘솔로만 "보고됨"을 표시(실습용).
    logger.warn('에러 추적 도구로 보고(데모: DSN 없음, 콘솔만)', {
      errorName: event.name,
      errorMessage: event.message,
      ...context,
    });
    return;
  }

  // ── 진짜 Sentry를 붙일 때(참고) ─────────────────────────────
  // 1) npm i @sentry/node
  // 2) 서버 시작 시 한 번:
  //      const Sentry = require('@sentry/node');
  //      Sentry.init({ dsn: process.env.SENTRY_DSN });
  // 3) 에러가 나면:
  //      Sentry.captureException(err, { extra: context });
  //  → DSN은 비밀값이므로 .env에만 두고, 위처럼 process.env로 읽습니다.
  // 이 데모에선 외부 패키지 없이, DSN이 있으면 "전송했다"고 로그만 남깁니다.
  logger.info('에러 추적 도구로 전송함', {
    dsnConfigured: true,
    errorName: event.name,
    errorMessage: event.message,
    ...context,
  });
}

module.exports = { captureException };
