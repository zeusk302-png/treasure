# 스크롤하면 맨 위로 가기 버튼 나타나기

뉴스 기사나 블로그처럼 글이 긴 페이지를 한참 내리다 보면, 다시 맨 위로 올라가기 번거롭죠? 그래서 많은 사이트가 오른쪽 아래에 동그란 "TOP" 버튼을 띄워 줍니다. 이번 실습에서는 화면을 일정 높이 이상 내리면 이 버튼이 스르륵 나타나고, 누르면 부드럽게 맨 위로 올라가는 기능을 직접 만듭니다.

## 목표

- **지금 얼마나 내려왔는지**를 `window.scrollY`(스크롤 위치 값)로 읽는 법을 익힌다.
- `scroll` 이벤트로 **스크롤할 때마다 코드를 실행**하고, 일정 높이를 넘으면 버튼을 보였다/숨겼다 한다.
- 버튼을 누르면 `scrollTo({ top: 0, behavior: "smooth" })`로 **맨 위까지 부드럽게** 이동시킨다.
- 버튼을 `position: fixed`로 화면 모서리에 **항상 떠 있게** 두고, CSS `transition`으로 자연스럽게 나타나게 한다.

> 핵심 개념: `scroll` 이벤트 + `window.scrollY` + `scrollTo` 부드러운 이동

## 따라하는 단계

1. **세 개의 파일을 한 폴더에 둔다.** `index.html`, `style.css`, `script.js`를 같은 폴더(`077`)에 둡니다. HTML이 나머지 둘을 불러옵니다.
2. **페이지를 충분히 길게 만든다.** `index.html`에는 일부러 긴 더미 구역(`.block`)을 여러 개 넣었습니다. 스크롤이 생길 만큼 페이지가 길어야 버튼이 나타나는 것을 확인할 수 있기 때문입니다.
3. **버튼을 화면 모서리에 고정한다.** `style.css`의 `.top-btn`에 `position: fixed; right: 24px; bottom: 24px;`를 주면, 스크롤을 해도 버튼이 오른쪽 아래에 항상 떠 있습니다.
4. **버튼을 처음엔 숨겨 둔다.** `.top-btn`은 기본적으로 `opacity: 0`(투명) + `pointer-events: none`(클릭 안 됨) 상태입니다. `.show` 클래스가 붙어야만 또렷하게 보이고 클릭됩니다. (CSS의 두 상태 비교)
5. **스크롤 위치를 읽는다.** `script.js`에서 `window.scrollY`는 "지금 위에서 몇 px 내려왔는가"를 나타냅니다. 맨 위는 `0`, 내려갈수록 커집니다.
6. **기준 높이를 넘으면 버튼을 켠다.** `handleScroll()` 함수는 `scrollY`가 `SHOW_AFTER(300)`보다 크면 버튼에 `.show`를 붙이고(`classList.add`), 작으면 뗍니다(`classList.remove`).
7. **스크롤 이벤트에 연결한다.** `window.addEventListener("scroll", handleScroll)` 한 줄로, 스크롤할 때마다 6번 검사가 자동 실행됩니다.
8. **누르면 부드럽게 맨 위로.** 버튼 클릭 시 `window.scrollTo({ top: 0, behavior: "smooth" })`가 화면을 0px(맨 위)로 미끄러지듯 올립니다. CSS의 `html { scroll-behavior: smooth; }`도 같은 부드러운 효과를 거듭니다.

## 🤖 바이브코딩 프롬프트

이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다. 상황에 맞게 숫자나 색만 바꿔 쓰면 됩니다.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 프런트엔드 튜터야. 비전공자도 따라할 수 있게 만들어 줘.
  index.html, style.css, script.js 세 파일로 "맨 위로 가기(TOP) 버튼" 실습을 만들어 줘.

  요구사항:
  - 스크롤이 생기도록 일부러 긴 더미 섹션을 7개쯤 넣어 줘(내용은 아무거나).
  - 오른쪽 아래 모서리에 동그란 TOP 버튼을 position: fixed 로 항상 떠 있게 둬.
  - 버튼은 처음엔 보이지 않게(투명) 해 줘.
  - 외부 라이브러리 없이 순수 HTML/CSS/JS만 사용.
  제약: 초보가 읽을 수 있게 변수/함수 이름은 영어, 주석은 한국어로.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  위 코드에 다음 동작을 추가해 줘.
  - window.scrollY 가 300px 를 넘으면 버튼에 .show 클래스를 붙여 스르륵 나타나게,
    300px 아래로 다시 올라오면 .show 를 떼서 사라지게 해 줘(scroll 이벤트 사용).
  - 버튼을 누르면 window.scrollTo({ top: 0, behavior: "smooth" }) 로
    맨 위까지 부드럽게 올라가게 해 줘.
  - 나타나고 사라질 때 opacity 와 transform 이 CSS transition 으로 부드럽게 바뀌게 해 줘.
  - 기준 높이(300)는 const 변수로 빼서 나중에 쉽게 바꿀 수 있게 해 줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  버튼이 스크롤해도 나타나지 않아. 아래 내 script.js 와 콘솔(F12) 에러를 붙여넣을게.
  무엇이 문제인지 한 단계씩 짚어 주고, 고친 코드와 "왜 그렇게 고쳤는지"를 알려 줘.
  특히 getElementById 의 id 철자, addEventListener 의 이벤트 이름("scroll"),
  CSS .show 클래스 이름이 서로 일치하는지 확인해 줘.
  (여기에 script.js 전체와 에러 메시지를 붙여넣기)
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 훨씬 좋습니다.

## 검증법

1. `index.html`을 더블클릭해 브라우저로 엽니다. (별도 서버 필요 없음)
2. **처음 상태**: 페이지 맨 위에서는 오른쪽 아래에 TOP 버튼이 **보이지 않아야** 합니다.
3. **나타남**: 화면을 아래로 천천히 내려 300px 정도를 넘으면 TOP 버튼이 **스르륵 나타나는지** 확인합니다.
4. **사라짐**: 다시 맨 위 근처로 올리면 버튼이 **다시 사라지는지** 확인합니다.
5. **부드러운 이동**: 페이지를 끝까지 내린 뒤 TOP 버튼을 누르면, 화면이 뚝 끊기지 않고 **부드럽게 맨 위로** 올라가는지 봅니다.
6. **호버 효과**: 버튼에 마우스를 올리면 색이 진해지는지 확인합니다.
7. (선택) 개발자도구(F12) Console 탭에 빨간 오류가 없는지 봅니다.

## 직접 바꿔보기

- `script.js`의 `const SHOW_AFTER = 300;`을 `100`으로 줄이면 조금만 내려도 버튼이 나옵니다. `800`으로 키우면 한참 내려야 나옵니다.
- `style.css`의 `.top-btn`에서 `right`/`bottom` 값을 바꾸면 버튼 위치가 옮겨집니다. (예: `left: 24px;`로 왼쪽 아래에 두기 — 단, `right`는 지워야 합니다.)
- TOP 글자 대신 `index.html`의 버튼 내용을 `↑` 같은 화살표 기호로 바꿔도 됩니다.

## 관련 가이드 링크

- 이전 실습: `../076/` 자동 재생 캐러셀 — 같은 `C · 자바스크립트 인터랙션` 카테고리입니다.
- 같은 카테고리(C) 다른 스크롤 실습:
  - `../078/` 스크롤 진행률 바 + 헤더 색 변하기 — `scrollY`를 비율로 환산해 응용
  - `../079/` 스크롤하면 요소가 스르륵 등장하기 — `IntersectionObserver`로 등장 감지
- 관련 레이아웃 실습(B 카테고리): `../045/` 플로팅 액션 버튼(FAB) — `position: fixed`로 떠 있는 버튼 만들기
- MDN 참고 문서:
  - [Window: scroll 이벤트](https://developer.mozilla.org/ko/docs/Web/API/Element/scroll_event) — 스크롤할 때 코드 실행
  - [Window.scrollY](https://developer.mozilla.org/ko/docs/Web/API/Window/scrollY) — 현재 스크롤 위치 읽기
  - [Window.scrollTo()](https://developer.mozilla.org/ko/docs/Web/API/Window/scrollTo) — 원하는 위치로 부드럽게 이동
  - [scroll-behavior](https://developer.mozilla.org/ko/docs/Web/CSS/scroll-behavior) — CSS로 부드러운 스크롤 켜기
