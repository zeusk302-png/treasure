/*
  이 파일은 무엇인가:
  구조화 로깅(logger.js) + 에러 추적(errorTracker.js)을 실제로 붙인 작은 Express 웹서버입니다.
  브라우저나 curl로 몇 개 주소를 두드려 보면, 터미널에 "한 줄 JSON 로그"가 쌓이고,
  일부러 에러를 내는 주소(/boom)를 치면 그 에러가 추적 도구로 "보고"되는 걸 볼 수 있습니다.

  왜 있는가 / 무엇을 배우나:
  - 운영 중인 서버에서 "무슨 일이 일어나는지(요청·응답·소요시간)"를 구조화 로그로 남기는 법.
  - 어디서 에러가 터져도 한곳에서 잡아(에러 핸들러) 추적 도구로 모으는 법.
  → 이 둘이 "관측성(observability)"의 기초입니다.

  실행: npm install 후 npm start (자세한 건 README 참고)
*/

const express = require('express');
const crypto = require('crypto');
const logger = require('./logger');
const { captureException } = require('./errorTracker');

const app = express();
const PORT = process.env.PORT || 3000;

// JSON 본문 파싱 — POST로 들어오는 JSON을 req.body로 읽기 위해 켭니다.
app.use(express.json());

/*
  [미들웨어] 모든 요청에 대해 "요청 로그"를 구조화로 남깁니다.
  왜 미들웨어로 한 번에 하나: 모든 라우트마다 일일이 로그를 적으면 빠뜨리기 쉬우므로,
  들어오는 모든 요청을 한곳에서 자동으로 기록하려는 것.
*/
app.use((req, res, next) => {
  // requestId: 요청 하나를 끝까지 추적하는 꼬리표.
  // 왜 필요: 한 요청이 여러 로그를 남길 때, 같은 requestId로 묶어 "이 사용자의 이 요청"을
  // 처음부터 끝까지 따라갈 수 있어서. 에러가 나도 같은 id로 로그와 에러를 연결합니다.
  req.requestId = crypto.randomUUID();
  const startedAt = Date.now();

  // 응답이 끝나는 순간(finish) 한 줄로 "요청 요약"을 남깁니다.
  res.on('finish', () => {
    // durationMs: 처리에 걸린 시간(ms). 느린 요청을 숫자로 잡아내려고 남깁니다.
    const durationMs = Date.now() - startedAt;
    logger.info('요청 처리됨', {
      requestId: req.requestId,
      method: req.method,
      path: req.path,
      status: res.statusCode,   // 200/404/500 등 — 어떤 결과였는지.
      durationMs,
    });
  });

  next(); // 다음 처리로 넘김.
});

// [정상 라우트] 잘 동작하는 기본 페이지.
app.get('/', (req, res) => {
  res.json({
    ok: true,
    message: '관측성 데모 서버. /hello?name=세영, /slow, /boom 을 눌러 보세요.',
  });
});

// [정상 라우트] 사용자 입력(name)을 받아 인사. info 로그를 하나 더 남깁니다.
app.get('/hello', (req, res) => {
  // 사용자 입력은 그대로 신뢰하지 않습니다. 여기선 JSON으로만 응답하므로 안전하지만,
  // HTML로 그릴 땐 textContent 같은 안전 출력을 써야 XSS를 막을 수 있습니다(브라우저 실습 참고).
  const name = String(req.query.name || '손님');
  logger.info('인사 요청', { requestId: req.requestId, name });
  res.json({ ok: true, greeting: `안녕하세요, ${name}님!` });
});

// [느린 라우트] 일부러 1.2초 지연 — durationMs 로그가 커지는 걸 보기 위한 예제.
app.get('/slow', async (req, res) => {
  await new Promise((r) => setTimeout(r, 1200)); // 1.2초 대기.
  res.json({ ok: true, message: '느린 응답이 끝났습니다(로그의 durationMs를 보세요).' });
});

// [에러 라우트] 일부러 에러를 던집니다. throw 하면 아래 에러 핸들러가 잡습니다.
app.get('/boom', (req, res) => {
  // 실제 코드에서 흔한 실수(없는 값 접근)를 흉내 냅니다.
  const broken = null;
  return res.json({ value: broken.thisFieldDoesNotExist }); // 여기서 TypeError 발생.
});

/*
  [에러 핸들러 미들웨어] 인자가 4개(err, req, res, next)면 Express가 "에러 전용"으로 인식합니다.
  왜 한곳에 모으나: 라우트마다 try/catch로 흩어 놓으면 빠뜨리기 쉽고, 추적 도구로 보내는 코드가
  중복됩니다. 모든 에러를 여기로 흘려보내 (1) 구조화 에러 로그를 남기고 (2) 추적 도구로 보고합니다.
  반드시 다른 모든 라우트 "뒤에" 둬야 합니다(맨 마지막에 등록).
*/
app.use((err, req, res, next) => {
  // 1) 구조화 에러 로그 — 같은 requestId로 위의 요청 로그와 연결됩니다.
  logger.error('요청 처리 중 에러', {
    requestId: req.requestId,
    method: req.method,
    path: req.path,
    errorName: err.name,
    errorMessage: err.message,
  });

  // 2) 에러 추적 도구로 보고 — 어떤 상황이었는지 context로 같이 넘겨, 도구에서 묶어 보게 함.
  captureException(err, {
    requestId: req.requestId,
    path: req.path,
    method: req.method,
  });

  // 3) 사용자에겐 내부 에러 메시지를 그대로 보여 주지 않습니다(정보 노출 방지).
  //    스택/내부 메시지는 로그·추적 도구에만, 사용자에겐 일반적인 안내만.
  res.status(500).json({ ok: false, error: '서버에서 문제가 발생했습니다.' });
});

// 서버가 처리 못 한 비동기 에러(프로미스 거절)도 그냥 사라지지 않게 잡아 보고합니다.
// 왜: 이런 에러는 조용히 묻혀 "왜 가끔 죽지?"의 원인이 되므로, 추적 도구로 끌어올립니다.
process.on('unhandledRejection', (reason) => {
  logger.error('처리 안 된 프로미스 거절', { reason: String(reason) });
  captureException(reason instanceof Error ? reason : new Error(String(reason)), {
    source: 'unhandledRejection',
  });
});

app.listen(PORT, () => {
  // 서버 시작도 하나의 이벤트라 구조화 로그로 남깁니다(언제 떴는지 기록).
  logger.info('서버 시작됨', { port: PORT, logLevel: process.env.LOG_LEVEL || 'info' });
});
