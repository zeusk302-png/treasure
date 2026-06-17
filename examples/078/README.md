# 스크롤 진행률 바 + 헤더 색 변하기

긴 글 페이지에서 "지금 어디까지 읽었는지"를 화면 맨 위 막대로 보여 주고, 스크롤을 내리면 상단 헤더 색이 바뀌는 인터랙션을 만듭니다. 블로그, 뉴스 기사, 긴 안내 페이지에서 흔히 보는 기능입니다.

## 목표

- 페이지를 읽은 비율(%)을 상단 막대(progress bar)로 보여 준다.
- 스크롤을 조금이라도 내리면 헤더 배경색이 바뀌게 한다.
- 핵심 원리인 "스크롤 위치를 비율(수치)로 환산하기"를 이해한다.
  - `scrollY`(내린 거리) ÷ (전체 높이 − 화면 높이) × 100 = 읽은 비율(%)

## 따라하는 단계

1. 한 폴더(`078`) 안에 `index.html`, `style.css`, `script.js` 세 파일을 둡니다. 이미 이 폴더에 만들어져 있습니다.
2. `index.html`을 더블클릭하거나 브라우저로 엽니다. (또는 VS Code의 Live Server 확장으로 열어도 됩니다.)
3. 페이지를 천천히 아래로 스크롤해 봅니다. 화면 맨 위의 파란 막대가 점점 길어집니다.
4. 헤더(상단 제목 줄)를 봅니다. 스크롤을 시작하면 흰색 배경이 진한 남색으로 바뀌고 그림자가 생깁니다.
5. 헤더 오른쪽의 퍼센트 숫자(`0% → 100%`)가 스크롤에 맞춰 바뀌는지 확인합니다.
6. `script.js`를 열어 계산 부분을 읽어 봅니다.
   - `window.scrollY`: 위에서부터 얼마나 내렸는지(픽셀).
   - `document.documentElement.scrollHeight`: 문서 전체 높이.
   - `window.innerHeight`: 지금 화면에 보이는 창의 높이.
   - 비율 = `scrollY ÷ (scrollHeight − innerHeight) × 100`.
7. 직접 바꿔 봅니다. `style.css`에서 `#progress-bar`의 `background`(막대 색)와 `#site-header.scrolled`의 `background`(스크롤 후 헤더 색)를 다른 색으로 바꿔 저장한 뒤 새로고침해 보세요.

## 검증법

- 맨 위에 있을 때: 막대 길이가 0이고, 헤더 숫자가 `0%`이며, 헤더 배경이 흰색입니다.
- 중간쯤 스크롤했을 때: 막대가 절반쯤 차고, 숫자가 `50%` 부근을 가리킵니다.
- 맨 아래까지 내렸을 때: 막대가 화면 전체 너비를 가득 채우고, 숫자가 `100%`가 됩니다.
- 스크롤을 조금이라도 내리면 헤더가 남색으로 바뀌고, 다시 맨 위로 올리면 흰색으로 돌아옵니다.
- 브라우저 창 크기를 줄였다 키워도 비율 계산이 깨지지 않는지 확인합니다. (창 높이가 바뀌어도 0~100% 범위를 유지합니다.)

## 관련 가이드 링크

- MDN - Window.scrollY: https://developer.mozilla.org/ko/docs/Web/API/Window/scrollY
- MDN - Element.scrollHeight: https://developer.mozilla.org/ko/docs/Web/API/Element/scrollHeight
- MDN - scroll 이벤트: https://developer.mozilla.org/ko/docs/Web/API/Element/scroll_event
- MDN - Element.classList: https://developer.mozilla.org/ko/docs/Web/API/Element/classList
- MDN - position: sticky / fixed: https://developer.mozilla.org/ko/docs/Web/CSS/position
