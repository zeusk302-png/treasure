/*
  이 파일은 무엇인가:
  "구조화 로깅(structured logging)"을 담당하는 작은 로거(logger)입니다.
  보통 console.log("사용자 12 로그인 실패") 처럼 사람이 읽는 한 줄 문장을 찍는데,
  이 파일은 대신 한 줄짜리 JSON({"level":"info","msg":"로그인 실패","userId":12,...})으로 찍습니다.

  왜 있는가 / 왜 JSON으로 찍나:
  - 운영 중 로그가 하루에 수천 줄 쌓이면, 사람이 눈으로 grep 하기 어렵습니다.
  - JSON 한 줄이면 도구(로그 수집기·Sentry·검색)가 "userId=12인 에러만", "level=error만"
    처럼 필드로 걸러 볼 수 있습니다. 이게 "관측성(observability)"의 출발점입니다.
  - 그래서 "사람이 읽기 쉬운 + 기계가 거르기 쉬운" 두 마리 토끼를 잡으려 구조화 로그를 씁니다.
*/

// 로그 레벨(심각도) — 낮을수록 사소, 높을수록 심각.
// 왜 레벨을 두나: 운영에선 "info 이상만 보기"처럼 시끄러운 로그를 걸러내야 하기 때문.
const LEVELS = { debug: 10, info: 20, warn: 30, error: 40 };

// 환경변수 LOG_LEVEL 보다 낮은(덜 심각한) 로그는 버립니다.
// 왜: 개발 땐 debug까지 다 보고, 운영 땐 info 이상만 봐서 로그 비용/소음을 줄이려는 것.
const MIN_LEVEL = LEVELS[process.env.LOG_LEVEL] || LEVELS.info;

/**
 * 실제로 한 줄 JSON 로그를 출력하는 내부 함수.
 * @param {string} level - 'debug' | 'info' | 'warn' | 'error'
 * @param {string} message - 사람이 읽을 한 문장
 * @param {object} fields - 같이 남길 추가 정보(userId, path, durationMs 등)
 */
function write(level, message, fields = {}) {
  // 설정된 최소 레벨보다 사소하면 아무것도 찍지 않고 끝냅니다(소음 차단).
  if (LEVELS[level] < MIN_LEVEL) return;

  // 모든 로그에 공통으로 들어갈 기본 필드.
  const entry = {
    // time: ISO 시각 — "언제 일어났나"를 도구가 정렬·필터할 수 있게 표준 형식으로.
    time: new Date().toISOString(),
    level,        // 심각도 — 도구가 error만 모아 보기 좋게.
    msg: message, // 사람이 읽는 한 문장.
    ...fields,    // 호출자가 넘긴 추가 필드(userId, requestId 등)를 펼쳐 담음.
  };

  // 한 줄 JSON으로 출력 — 한 로그 = 한 줄이어야 수집기가 줄 단위로 잘라 읽기 쉽습니다.
  // error/warn은 표준에러(stderr), 나머지는 표준출력(stdout)으로 보냄.
  // 왜 나누나: 많은 호스팅/도구가 stderr를 "문제 로그"로 따로 모아 알림을 걸기 때문.
  const line = JSON.stringify(entry);
  if (level === 'error' || level === 'warn') console.error(line);
  else console.log(line);
}

// 바깥에서 쓰기 쉬운 형태로 내보냅니다: logger.info("...", { userId: 1 })
const logger = {
  debug: (msg, fields) => write('debug', msg, fields),
  info: (msg, fields) => write('info', msg, fields),
  warn: (msg, fields) => write('warn', msg, fields),
  error: (msg, fields) => write('error', msg, fields),
};

module.exports = logger;
