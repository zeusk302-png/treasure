# null 참조 에러 잡기 — getElementById가 못 찾는 요소

버튼을 눌러도 아무 반응이 없고, 개발자 도구 콘솔에는 빨간 글씨로
`Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')`
가 떠 있습니다. 이 흔한 버그의 **진짜 원인**을 찾아 고치는 디버깅 실습입니다.

## 목표

- 자바스크립트가 **위에서 아래로, 순서대로** 실행된다는 사실을 체감한다.
- 스크립트가 화면(DOM)보다 **먼저** 실행되면 `getElementById`가 요소를 못 찾고 `null`을 돌려준다는 것을 이해한다.
- `null`에 점(`.`)을 찍어 무언가를 하려고 할 때 나는 `Cannot read properties of null` 에러를 읽고 해석할 수 있다.
- 해결책 1순위인 **`defer`** 사용법을 익힌다 (그리고 대안인 "스크립트를 `</body>` 앞으로 내리기"도 안다).

## 따라하는 단계

1. **고장 난 화면부터 본다.** `broken.html`을 더블클릭해 브라우저로 엽니다. 이름을 적고 "인사하기"를 눌러도 아무 일도 일어나지 않습니다.
2. **에러 메시지를 직접 본다.** 키보드 `F12`(또는 마우스 우클릭 → 검사)를 눌러 개발자 도구를 열고 **Console(콘솔)** 탭으로 갑니다. 빨간 줄
   `Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')`
   를 확인합니다. → **이 화면이 "before(고치기 전)" 캡처입니다.**
3. **원인을 짚는다.** `broken.html`을 코드 편집기로 엽니다. `<script>`가 `<head>` 안에 있고, 그 안에서 `document.getElementById("greetBtn")`을 부릅니다. 그런데 이 코드가 실행되는 순간에는 아래 `<body>`의 버튼이 **아직 만들어지지 않았습니다.** 그래서 `button`에는 요소가 아니라 `null`이 들어가고, `null.addEventListener(...)`에서 폭발합니다.
4. **고치는 방법을 적용한다.** 가장 깔끔한 방법은 스크립트를 별도 파일로 빼고 **`defer`**를 붙이는 것입니다. 이 폴더의 `index.html`이 그 정답 버전입니다.
   - `index.html`의 `<head>`에는 `<script src="script.js" defer></script>` 한 줄만 있습니다.
   - `defer`는 "HTML을 다 읽은 다음에 이 스크립트를 실행하라"는 뜻이라, `script.js`가 돌 때는 버튼이 이미 존재합니다.
5. **고친 화면을 확인한다.** `index.html`을 브라우저로 열고 콘솔을 다시 봅니다. 빨간 에러가 사라졌습니다. 이름을 적고 "인사하기"를 누르면 `홍길동님, 안녕하세요!`가 출력됩니다. → **이 화면이 "after(고친 후)" 캡처입니다.**

## 무엇을 어떻게 고쳤나 (before → after)

| | 고치기 전 (`broken.html`) | 고친 후 (`index.html` + `script.js`) |
| --- | --- | --- |
| 스크립트 위치 | `<head>` 안, 본문보다 먼저 실행 | 별도 파일로 분리 |
| 실행 시점 제어 | 없음 (즉시 실행) | `defer`로 **DOM 완성 후** 실행 |
| `getElementById` 결과 | `null` (요소가 아직 없음) | 진짜 버튼 요소 |
| 결과 | `Cannot read properties of null` 에러 | 정상 동작 |

핵심은 코드를 어렵게 바꾼 게 아니라, **실행되는 "시점"만 뒤로 미룬 것**입니다.

### 다른 해결책도 알아두기

- **대안 A — `defer` (이 실습의 정답):** `<head>`에 두되 `defer`를 붙인다. HTML 파싱을 막지 않고, 끝난 뒤 실행돼 가장 권장됩니다.
- **대안 B — 스크립트를 맨 아래로:** `<script>`를 `</body>` 바로 앞으로 내린다. 그러면 본문을 다 읽은 뒤에 실행되므로 요소를 찾을 수 있습니다.
- **대안 C — `DOMContentLoaded` 기다리기:** `document.addEventListener("DOMContentLoaded", () => { ... })` 안에 코드를 넣어, 화면 준비가 끝난 신호를 받고 실행합니다.

세 방법 모두 "DOM이 다 만들어진 뒤에 요소를 찾는다"는 같은 목표를 이룹니다.

## 🤖 바이브코딩 프롬프트

이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다. "버그를 일부러 만들고 → 고친다"는 디버깅 학습 흐름이라 프롬프트도 그 순서를 따릅니다.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 자바스크립트 입문자를 가르치는 강사야. 비전공자가 "null 참조 에러"를 직접 보고 배우도록,
  일부러 고장 난 HTML 파일 broken.html 하나를 만들어 줘.
  요구사항:
  - 이름 입력칸(input)과 "인사하기" 버튼, 결과를 보여줄 빈 문단(p)이 있는 한 페이지.
  - <script>를 <head> 안에 일반 스크립트로 넣고, 그 안에서 document.getElementById 로 버튼을 잡아 클릭 이벤트를 건다.
  - 이렇게 하면 본문(body)이 만들어지기 전에 스크립트가 돌아 getElementById 가 null 을 돌려주고,
    "Cannot read properties of null (reading 'addEventListener')" 에러가 콘솔에 뜨도록 해 줘.
  - 왜 이 위치/방식이 에러를 만드는지 코드에 한국어 주석으로 한 줄씩 설명해 줘.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  방금 만든 broken.html 의 에러를 고친 정답 버전을 만들어 줘.
  - 스크립트를 script.js 라는 별도 파일로 분리하고, <head> 에서 <script src="script.js" defer></script> 로 불러와 줘.
  - defer 가 왜 이 null 에러를 없애는지(=HTML을 다 읽은 뒤에 실행되니까 요소가 이미 존재함) 주석으로 설명해 줘.
  - 입력칸이 비어 있으면 "이름을 먼저 입력해 주세요."를 보여주고, 이름이 있으면 "OOO님, 안녕하세요!"를 출력해 줘.
  - 화면 출력은 innerHTML 말고 textContent 로 해 줘(사용자 입력이 코드로 실행되는 걸 막기 위해서). 이유도 주석으로 적어 줘.
  - 추가로 defer 말고 다른 해결책 2가지(스크립트를 </body> 앞으로, DOMContentLoaded 사용)도 주석이나 README에 정리해 줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  버튼을 눌러도 반응이 없고 콘솔에 이 에러가 떠:
  "Uncaught TypeError: Cannot read properties of null (reading 'addEventListener')"
  내 HTML/JS 코드를 붙여넣을게. 다음을 단계별로 알려 줘:
  1) 이 에러가 정확히 무슨 뜻인지 비전공자도 알게 한 줄로.
  2) 왜 getElementById 결과가 null 이 됐는지(스크립트 실행 시점 vs DOM 생성 시점).
  3) defer / 스크립트 위치 옮기기 / DOMContentLoaded 중 내 상황에 가장 맞는 해결책 하나와 그 이유.
  4) 고친 코드를 주고, 바뀐 부분만 콕 집어 한국어 주석으로 설명해 줘.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 훨씬 좋습니다.

## 검증법

1. `index.html`을 브라우저로 열고 `F12` → **Console** 탭에 **빨간 에러가 하나도 없으면** 성공입니다.
2. 이름 입력칸에 `홍길동`을 적고 "인사하기"를 누르면 화면에 `홍길동님, 안녕하세요!`가 나오면 성공입니다.
3. 입력칸을 **비운 채** 누르면 `이름을 먼저 입력해 주세요.`라는 안내가 나옵니다(추가 점검).
4. 비교 학습: `broken.html`을 열면 콘솔에 `Cannot read properties of null`이 그대로 떠야 합니다. before/after 콘솔 화면을 각각 캡처하면 제출물 완성입니다.

## 관련 가이드 링크

- 같은 기능의 정상 버전 만들기: 실습 062 "이름 입력하면 인사말 출력하기"
- 첫 이벤트 다루기: 실습 056 "버튼 누르면 알림창 띄우기"
- DOM에서 요소 골라 내용 바꾸기: 실습 057 "버튼 클릭으로 화면 글자 바꾸기"
- MDN — `<script defer>` 속성: https://developer.mozilla.org/ko/docs/Web/HTML/Element/script#defer
- MDN — `DOMContentLoaded` 이벤트: https://developer.mozilla.org/ko/docs/Web/API/Document/DOMContentLoaded_event
