# JSON 파싱·키 이름 오류 잡기 — 'undefined'만 뜨는 API 결과

"오늘의 날씨 카드"를 서버에서 받아 보여 주는 페이지인데, 도시 이름도 기온도 날씨 설명도 **전부 "undefined"로만 보입니다.**
신기하게도 **콘솔에 빨간 에러는 하나도 없습니다.** 데이터는 분명히 잘 도착했는데 화면에만 안 나오는, 초보자가 가장 많이 만나는 버그입니다.
원인은 단 하나, **코드가 값을 꺼낼 때 쓴 "키(key) 이름"이 API가 실제로 보낸 키 이름과 다르기 때문**입니다.
"응답을 콘솔에 한 번 찍어 진짜 구조를 확인한다"는 디버깅의 기본 습관을 익히는 실습입니다.

## 목표

- JSON 응답에서 값은 **"키 이름"으로 꺼낸다**는 것(`data.이름`)을 이해한다.
- 코드에 적은 키 이름이 **응답에 없으면** 에러가 나는 게 아니라 조용히 **`undefined`가 나온다**는 사실을 눈으로 확인한다. (그래서 더 헷갈린다)
- 값이 **객체 안의 객체**(예: `data.main.temp`)나 **배열 안**(예: `data.weather[0].description`)에 숨어 있을 수 있다는 것을 안다.
- 버그를 추측으로 고치지 않고, **`console.log(data)`로 응답을 통째로 찍어 진짜 키 이름을 확인한 뒤** 코드를 맞추는 습관을 들인다.

## 따라하는 단계

1. **고장 난 화면부터 본다.** `broken.html`을 더블클릭해 브라우저로 엽니다. 카드 안에 도시는 `undefined`, 기온은 `undefined°C`, 설명도 `undefined`로 나옵니다. (에러는 안 납니다.)
2. **응답을 콘솔에 찍어 본다.** 키보드 `F12`(또는 우클릭 → 검사) → **Console(콘솔)** 탭을 엽니다. `broken.html`의 `<script>` 거의 맨 아래에 주석 처리된 줄이 있습니다. 그 앞의 `//`를 지워서 살려 주세요. → **이 화면이 "before(고치기 전)" 캡처입니다.**
   - `// console.log("실제 응답:", data);`  →  `console.log("실제 응답:", data);`
   - 저장하고 새로고침하면 콘솔에 응답 객체가 펼쳐집니다. 삼각형(▶)을 눌러 안을 열어 봅니다.
3. **진짜 키 이름을 읽는다.** 펼쳐 보면 응답은 이렇게 생겼습니다. 코드가 적은 이름과 하나씩 비교해 봅니다.
   - 도시 이름 → 코드는 `data.city`라고 적었지만, 응답의 진짜 이름은 **`name`** 입니다. (`city`라는 키는 없음 → `undefined`)
   - 기온 → 코드는 `data.temp`라고 적었지만, 기온은 **`main` 객체 안의 `temp`**, 즉 `data.main.temp`에 있습니다. (한 단계 더 들어가야 함 → `undefined`)
   - 날씨 설명 → 코드는 `data.weather.description`이라고 적었지만, `weather`는 **배열**이라 첫 번째 항목 `[0]`을 거친 `data.weather[0].description`이어야 합니다. (배열에는 `description`이 직접 없음 → `undefined`)
4. **코드의 키 이름을 응답에 맞춘다.** 이 폴더의 `index.html` + `script.js`가 정답 버전입니다. 세 줄만 바뀌었습니다.
   - `data.city`  →  `data.name`
   - `data.temp`  →  `data.main.temp`
   - `data.weather.description`  →  `data.weather[0].description`
   - 그리고 정답 버전에는 **항상 응답을 먼저 찍어 보는 습관**을 본보기로 남기려고 `console.log("실제 응답 구조:", data);`를 넣어 두었습니다.
5. **고친 화면을 확인한다.** `index.html`을 브라우저로 엽니다. 약 0.3초 뒤 카드에 **부산 / 24.6°C / 맑음**이 정상으로 채워집니다. 콘솔에는 빨간 에러 없이 응답 구조가 한 번 찍힙니다. → **이 화면이 "after(고친 후)" 캡처입니다.**

## 무엇을 어떻게 고쳤나 (before → after)

| 보여 줄 값 | 고치기 전 (`broken.html`) | 고친 후 (`script.js`) | 왜 그랬나 |
| --- | --- | --- | --- |
| 도시 이름 | `data.city` → `undefined` | `data.name` | 응답의 키 이름은 `city`가 아니라 `name` |
| 기온 | `data.temp` → `undefined` | `data.main.temp` | 기온은 `main` 객체 **안에** 들어 있음 |
| 날씨 설명 | `data.weather.description` → `undefined` | `data.weather[0].description` | `weather`는 **배열**이라 `[0]`을 거쳐야 함 |
| 디버깅 습관 | 응답을 한 번도 안 찍어 봄 | `console.log(data)`로 먼저 구조 확인 | 추측 대신 **눈으로 확인**하고 고침 |

핵심은 코드를 늘린 게 아니라, **꺼내는 이름을 응답의 진짜 이름에 맞춘 것**뿐입니다. 그리고 그 진짜 이름은 **추측이 아니라 `console.log`로 확인**해서 알아냈다는 점이 이 실습의 진짜 교훈입니다.

### 한 가지 더 알아두기

- `JSON.parse`는 **문자열을 객체로 바꿔 주기만** 합니다. 키 이름이 맞는지까지는 검사해 주지 않습니다. 그래서 파싱은 성공해도 값은 `undefined`일 수 있습니다.
- 없는 키를 읽으면 `undefined`(조용함)지만, **`undefined` 안의 무언가를 또 읽으려 하면** `Cannot read properties of undefined`라는 빨간 에러가 납니다. (예: `data.weather.description`에서 `weather`가 객체라 통과했지만, 만약 `data.없는키.무언가`였다면 에러가 났을 것입니다.) 이때도 해결의 첫걸음은 똑같이 **응답을 콘솔에 찍어 보는 것**입니다.
- 실제 API에서는 `fetch(주소).then(res => res.json())`처럼 `res.json()`이 파싱까지 해 줍니다. 이 실습은 "키 이름 확인"에 집중하려고 일부러 문자열 → `JSON.parse` 형태로 보여 준 것입니다.

## 검증법

1. `index.html`을 브라우저로 열고 약 0.3초 기다립니다. 카드에 **부산 / 24.6°C / 맑음**이 모두 보이면 성공입니다. `undefined`가 한 군데도 없어야 합니다.
2. `F12` → **Console** 탭에 빨간 에러가 없고, `실제 응답 구조: {name: "부산", main: {…}, weather: Array(1)}`처럼 응답이 한 번 찍히면 정상입니다.
3. 비교 학습: `broken.html`을 열면 도시·기온·설명이 모두 `undefined`로 떠야 합니다. 2단계에서 살려 둔 `console.log`로 찍힌 **before 응답 구조**와, 고친 뒤 정상 표시된 **after 화면**을 각각 캡처하면 제출물(값이 정상 표시되는 JS + console.log로 확인한 응답 구조)이 완성됩니다.

## 관련 가이드 링크

- 공개 API를 fetch로 받아 화면에 띄우기: 실습 146 "공개 명언 API 한 줄 받아서 화면에 띄우기"
- 응답에서 원하는 값만 골라 카드로 보여 주기: 실습 147 "받은 JSON에서 필요한 값만 골라 카드로 보여 주기"
- 비동기 실행 순서 디버깅(짝꿍 실습): 실습 286 "비동기 순서 꼬임 잡기 — 데이터보다 먼저 그려지는 빈 목록"
- CORS로 막힌 외부 API 호출 살리기: 실습 287 "CORS 에러로 막힌 외부 API 호출 살리기"
- null 참조 에러 잡기: 실습 283 "null 참조 에러 잡기 — getElementById가 못 찾는 요소"
- 가이드 — API가 뭔가(주방에 음식을 주문하는 창구): `docs/02-web-basics/04.md`
- 가이드 — 개발자 도구 콘솔 사용법: `docs/02-web-basics/03.md`
- MDN — `JSON.parse`: https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/JSON/parse
- MDN — `console.log`로 디버깅하기: https://developer.mozilla.org/ko/docs/Web/API/console/log_static
