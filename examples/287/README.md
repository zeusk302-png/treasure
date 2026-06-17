# CORS 에러로 막힌 외부 API 호출 살리기 — 콘솔의 빨간 CORS 메시지

"부산 오늘 날씨"를 외부 API에서 받아 화면에 띄우는 위젯인데, **온도가 영영 `--℃` 그대로**입니다.
코드는 멀쩡해 보이는데 데이터가 안 들어옵니다. 콘솔(F12)을 열면 빨간 글씨로 **CORS 에러**가 떠 있습니다.
이건 "내 코드가 틀려서"가 아니라 **브라우저가 보안을 위해 일부러 막은 것**입니다.
CORS가 무엇이고 왜 나는지를 이해하고, **CORS를 허용해 주는 API(또는 프록시)로 바꿔서** 고치는 디버깅 실습입니다.

## 목표

- **CORS(교차 출처 차단)**가 무엇인지 한 문장으로 말할 수 있다 → "내 페이지가 *다른 출처(도메인)*의 데이터를 가져오려 할 때, 그 서버가 허락하지 않으면 **브라우저가 응답을 가로채 막는** 보안 규칙."
- CORS 에러는 **코드 버그가 아니라 서버의 허락(헤더) 문제**라는 것을 구분할 수 있다. `try/catch`의 에러 메시지(`Failed to fetch`)는 두루뭉술하고, **진짜 원인은 콘솔의 빨간 CORS 줄**에 적혀 있다는 것을 안다.
- 해결책 두 가지를 안다 → ① **CORS를 허용하는(=`Access-Control-Allow-Origin` 헤더를 보내 주는) 공개 API로 바꾸기**, ② 그게 안 되면 **CORS 프록시**를 한 겹 거치거나 **내 서버에서 대신 호출**하기.
- "브라우저에서 직접 부르는 것만 막히고, **서버끼리는 CORS가 없다**"는 핵심 원리를 이해한다.

## 따라하는 단계

1. **고장 난 화면부터 본다.** `broken.html`을 더블클릭해 브라우저로 엽니다. 카드 안의 온도가 `--℃` 그대로이고, 잠시 뒤 "불러오기 실패 (콘솔의 빨간 CORS 에러를 확인하세요)"로 바뀝니다.
2. **콘솔에서 빨간 메시지를 읽는다.** 키보드 `F12`(또는 우클릭 → 검사) → **Console(콘솔)** 탭을 엽니다. 다음과 비슷한 **빨간 줄**이 보입니다. → **이 화면이 "before(고치기 전)" 캡처입니다.**
   - `Access to fetch at 'https://httpbin.org/headers' from origin '...' has been blocked by CORS policy: No 'Access-Control-Allow-Origin' header is present on the requested resource.`
   - `GET https://httpbin.org/headers net::ERR_FAILED`
   - `fetch 실패: TypeError: Failed to fetch`
3. **메시지를 해석한다.** 핵심 문장은 `blocked by CORS policy: No 'Access-Control-Allow-Origin' header`입니다. 풀어 쓰면 → "그 서버가 *이 출처에서 받아 가도 된다*는 허락(`Access-Control-Allow-Origin` 헤더)을 안 보냈기 때문에, **브라우저가 응답을 너(자바스크립트)에게 안 넘기고 막았다**." 서버에는 요청이 닿았을 수도 있지만, **브라우저 단계에서 차단**되어 우리 코드는 데이터를 구경도 못 합니다.
4. **왜 `catch`로 빠지는지 본다.** `broken.html`의 `<script>`를 코드 편집기로 엽니다. `fetch(API_URL)`이 CORS에 막히면 `await` 줄에서 곧장 실패(reject)해 `catch`로 점프합니다. 그런데 `error.message`는 `Failed to fetch`라고만 나와서, 초보자는 "인터넷이 끊겼나?"로 착각하기 쉽습니다. **진짜 단서는 catch가 아니라 콘솔의 빨간 CORS 줄**입니다.
5. **고치는 방법을 적용한다.** 이 폴더의 `index.html` + `script.js`가 정답 버전입니다. **요청 주소(API)를 CORS를 허용해 주는 서버로 바꾼 것**이 전부입니다.
   - 바뀐 줄: `const API_URL = "https://api.open-meteo.com/v1/forecast?latitude=35.18&longitude=129.08&current=temperature_2m";`
   - Open-Meteo는 키 없이 쓰는 무료 날씨 API이고, 응답에 `Access-Control-Allow-Origin: *`(= "아무 출처에서나 받아 가도 돼")를 함께 보내 줍니다. 그래서 브라우저가 막지 않습니다.
6. **고친 화면을 확인한다.** `index.html`을 브라우저로 엽니다. 잠깐 뒤 카드에 **현재 부산 기온(예: `18.4℃`)**이 나타나고 안내가 "갱신 완료"로 바뀝니다. 콘솔에는 빨간 줄 없이 `받은 데이터: {…}` 같은 **진짜 JSON 객체**가 찍힙니다. → **이 화면이 "after(고친 후)" 캡처입니다.**

## 무엇을 어떻게 고쳤나 (before → after)

| | 고치기 전 (`broken.html`) | 고친 후 (`index.html` + `script.js`) |
| --- | --- | --- |
| 요청 주소 | `https://httpbin.org/headers` (CORS 헤더 없음) | `https://api.open-meteo.com/...` (`Access-Control-Allow-Origin: *` 보냄) |
| 브라우저 반응 | 응답을 **가로채 차단** | 응답을 **그대로 통과** |
| 콘솔 | 빨간 `blocked by CORS policy` 에러 | 빨간 줄 없음, `받은 데이터: {…}` |
| `fetch` 결과 | reject → `catch`로 점프 (`Failed to fetch`) | 정상 → JSON 파싱 성공 |
| 화면 | `--℃` 고정, "불러오기 실패" | 실제 기온 표시, "갱신 완료" |

핵심은 코드를 복잡하게 늘린 게 아니라, **"브라우저가 허락하는 출처"로 데이터 요청처를 바꾼 것**뿐입니다.

### CORS가 안 되는 API를 꼭 써야 한다면 (해결책 2·3)

쓰고 싶은 API가 CORS를 허용하지 않을 때(직접 fetch 시 빨간 에러)는 두 가지 길이 있습니다.

- **방법 ㄱ — 공개 CORS 프록시 거치기:** 원래 주소 앞에 프록시 주소를 붙입니다.
  예) `https://api.allorigins.win/raw?url=<원래주소>` — 프록시 서버가 대신 받아서 CORS 헤더를 붙여 우리에게 넘겨줍니다. (단, 공개 프록시는 느리거나 멈출 수 있어 **연습용**으로만 권합니다.)
- **방법 ㄴ — 내 서버에서 대신 호출하기:** Vercel의 서버리스 함수 같은 백엔드에서 그 API를 호출하고, 결과만 내 프론트엔드에 내려줍니다. **서버끼리의 통신에는 CORS 제한이 없기** 때문입니다. 또한 API 키처럼 숨겨야 하는 비밀값(`YOUR_API_KEY` 같은 자리표시자)은 **이 서버 쪽에만** 두어야 합니다. 비밀 키를 브라우저 JS에 직접 적으면 누구나 볼 수 있으니 절대 금물입니다.

> 한 줄 요약: **CORS는 "브라우저"가 거는 빗장**입니다. 그래서 ① 허락하는 API로 바꾸거나, ② 빗장이 없는 "서버"를 한 단계 끼우면 풀립니다. CORS 에러가 떴다고 내 자바스크립트 문법을 백날 고쳐 봐야 소용없습니다.

## 검증법

1. `index.html`을 브라우저로 열고 잠깐 기다립니다. 카드에 **`--℃`가 아닌 실제 숫자 기온**(예: `18.4℃`)이 나타나고 안내가 "**갱신 완료**"로 바뀌면 성공입니다.
2. `F12` → **Console** 탭에 **빨간 CORS 에러가 없고**, `받은 데이터: {…}`처럼 **JSON 객체**가 찍히면 정상입니다.
3. `F12` → **Network(네트워크)** 탭을 열고 새로고침하면, `forecast?...` 요청이 **상태 200**(초록)으로 성공하는 것을 볼 수 있습니다. 응답 헤더(Headers)에서 `access-control-allow-origin: *`도 확인해 보세요.
4. 비교 학습: `broken.html`을 열면 온도가 `--℃` 그대로이고 콘솔에 `blocked by CORS policy` 빨간 줄이 그대로 떠야 합니다. **before/after 콘솔 화면을 각각 캡처**하면 제출물(에러 원문 + 해결 방법 메모) 완성입니다.

## 관련 가이드 링크

- 공개 API를 fetch로 받아 화면에 띄우기: 실습 146 "공개 명언 API 한 줄 받아서 화면에 띄우기"
- 개발자 도구 Network 탭으로 요청 들여다보기: 실습 147 "개발자 도구 Network 탭으로 내 API 요청 엿보기"
- 버튼 클릭마다 fetch 다시 호출하기: 실습 148 "'새 명언' 버튼으로 누를 때마다 다른 글귀 받기"
- 같은 카테고리의 API 디버깅: 실습 288 "JSON 파싱·키 이름 오류 잡기 — 'undefined'만 뜨는 API 결과"
- 비동기 흐름 디버깅: 실습 286 "비동기 순서 꼬임 잡기 — 데이터보다 먼저 그려지는 빈 목록"
- 가이드 — API가 뭔가(주방에 음식을 주문하는 창구): `docs/02-web-basics/04.md`
- 가이드 — 클라이언트 vs 서버(손님과 주방, 브라우저가 무엇을 막는지): `docs/02-web-basics/02.md`
- 가이드 — 공개해도 되는 키 vs 절대 숨길 키(API 키를 서버에 숨겨야 하는 이유): `docs/04-security/01.md`
- MDN — CORS(교차 출처 리소스 공유): https://developer.mozilla.org/ko/docs/Web/HTTP/CORS
- Open-Meteo 무료 날씨 API 문서: https://open-meteo.com/en/docs
