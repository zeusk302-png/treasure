# 햄버거 버튼으로 열리는 모바일 슬라이드 메뉴

휴대폰 화면처럼 좁은 공간에서는 메뉴를 한 줄로 다 보여줄 수 없습니다. 그래서 평소엔 **줄 세 개 모양의 햄버거 버튼**만 두고, 누르면 **옆에서 메뉴가 스르륵 미끄러져 나오게** 만듭니다. 이번 예제에서는 `transform: translateX`(요소를 좌우로 이동)와 `transition`(부드러운 전환), 그리고 약간의 JavaScript로 진짜 앱처럼 동작하는 모바일 메뉴를 완성합니다.

## 목표

- 햄버거 버튼을 누르면 오른쪽에서 메뉴가 미끄러져 나오고, 다시 닫을 수 있게 만든다.
- `transform: translateX(100%)`로 메뉴를 화면 밖에 숨겼다가 `translateX(0)`으로 제자리에 가져오는 원리를 이해한다.
- `transition`으로 갑자기 튀어나오지 않고 0.3초에 걸쳐 **부드럽게** 움직이게 한다.
- 메뉴가 열리면 화면을 덮는 어두운 막(오버레이)을 띄우고, 그 막이나 ESC 키로도 닫히게 한다.
- JavaScript의 `classList.add` / `classList.remove`로 "열림/닫힘 상태"를 클래스 하나로 켜고 끄는 패턴을 익힌다.

## 따라하는 단계

1. `048` 폴더 안의 `index.html`을 마우스로 더블클릭해 브라우저(크롬 등)로 엽니다. 같은 폴더의 `style.css`와 `script.js`는 자동으로 함께 불러와집니다. (세 파일은 같은 폴더에 있어야 합니다.)
2. **모바일 화면처럼 보기**: 컴퓨터로 본다면 브라우저 창을 좁게 줄이거나, F12(개발자 도구)를 누른 뒤 왼쪽 위의 휴대폰 모양 아이콘을 눌러 모바일 화면 모드로 봅니다.
3. **메뉴 열어 보기**: 오른쪽 위 **줄 세 개(햄버거) 버튼**을 누르면 오른쪽에서 메뉴가 미끄러져 들어옵니다.
4. **여러 방법으로 닫아 보기**: 메뉴 안의 **× 버튼**, **화면의 어두운 부분(오버레이)**, 키보드 **ESC 키** — 이 세 가지로 모두 닫히는지 확인합니다.
5. **숨기는 원리 보기**: `style.css`에서 `.side-menu`의 `transform: translateX(100%);`를 찾습니다. 이 한 줄이 "메뉴를 자기 너비만큼 오른쪽 바깥으로 밀어 화면 밖에 숨기는" 역할입니다. 잠깐 `translateX(0)`으로 바꿔 저장(Ctrl+S)·새로고침(F5)하면 메뉴가 처음부터 열려 있는 것을 볼 수 있습니다. (확인 후 다시 `100%`로 되돌리세요.)
6. **속도 바꿔 보기**: 같은 `.side-menu`의 `transition: transform 0.3s ease;`에서 `0.3s`를 `1s`로 바꿔 저장·새로고침하면 메뉴가 더 천천히 미끄러집니다. 숫자가 클수록 느리게 움직입니다.
7. **메뉴 항목 바꾸기**: `index.html`의 `<nav>` 안 `<li><a href="#">홈</a></li>` 같은 줄을 본인이 원하는 메뉴 이름으로 고치거나, 한 줄을 복사·붙여넣기 해서 항목을 늘려 봅니다.
8. **버튼이 메뉴를 어떻게 여는지 보기**: `script.js`를 열면 햄버거 버튼을 누를 때 `body.classList.add("menu-open")`이 실행됩니다. `<body>`에 `menu-open`이라는 이름표(클래스)가 붙으면, CSS의 `body.menu-open .side-menu { transform: translateX(0); }` 규칙이 작동해 메뉴가 열립니다. 닫을 때는 그 이름표를 떼어냅니다(`classList.remove`).

## 🤖 바이브코딩 프롬프트

이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다.

- **1단계(뼈대 만들기)** 프롬프트:

  ```text
  너는 프론트엔드 멘토야. 비전공 초보가 이해할 수 있게 만들어줘.
  HTML/CSS/JavaScript 순수 파일 3개(index.html, style.css, script.js)로
  "모바일 햄버거 슬라이드 메뉴"를 만들어줘.

  요구사항:
  - 상단 바: 왼쪽에 로고 텍스트, 오른쪽에 줄 세 개 모양 햄버거 버튼(button 태그).
  - 화면 오른쪽에서 미끄러져 나오는 옆 메뉴(side menu). 평소엔 화면 밖에 숨어 있다가
    햄버거 버튼을 누르면 0.3초에 걸쳐 부드럽게 나타나게.
  - 숨기고 보이는 방식은 'display none/block'이 아니라
    CSS transform: translateX(100%) ↔ translateX(0) + transition 으로 해줘
    (transition은 display에는 안 먹지만 transform에는 먹어서 부드럽게 움직이거든).
  - 열고 닫는 상태는 <body>에 'menu-open' 클래스 하나를 붙였다/뗐다 하는 방식으로 제어해줘.

  제약: 외부 라이브러리(부트스트랩, jQuery 등) 쓰지 말고 순수 코드로만.
  결과물: 세 파일 전체 코드를 각각 보여주고, 비전공자가 이해하게 한 줄씩 한국어 주석을 달아줘.
  ```

- **2단계(기능 추가/개선)** 프롬프트:

  ```text
  방금 만든 햄버거 슬라이드 메뉴에 아래 기능을 추가해줘. 기존 코드는 최대한 유지하고,
  바뀐 부분이 어디인지 주석으로 표시해줘.

  1) 메뉴가 열리면 화면 전체를 살짝 어둡게 덮는 '오버레이(어두운 막)'를 띄워줘.
     이 막도 transition으로 서서히 나타나게.
  2) 메뉴를 닫는 방법을 세 가지로: (a) 메뉴 안의 × 닫기 버튼, (b) 어두운 막 클릭,
     (c) 키보드 ESC 키.
  3) 메뉴가 열린 동안에는 뒤 본문이 스크롤되지 않게 막아줘(overflow: hidden).
  4) 접근성: 햄버거 버튼에 aria-label과 aria-expanded(열림 true/닫힘 false)를 붙여
     화면 낭독기 사용자도 상태를 알 수 있게 해줘.
  ```

- **막혔을 때(디버깅)** 프롬프트:

  ```text
  햄버거 버튼을 눌러도 메뉴가 안 나와. 아래 내 코드를 줄게.
  무엇이 문제인지 초보도 이해하게 단계별로 짚어주고, 고친 코드도 보여줘.

  특히 이런 점을 점검해줘:
  - F12 콘솔에 빨간 에러가 있는지(예: getElementById가 null이라 click을 못 거는 경우 →
    id 철자나 <script> 위치 문제).
  - CSS의 transform: translateX(100%) / translateX(0) 규칙과
    body.menu-open 셀렉터 철자가 JS에서 add 하는 클래스 이름과 정확히 일치하는지.
  - script.js가 <body> 끝에서 불러와지는지(요소보다 먼저 실행되면 못 찾음).

  [여기에 내 index.html / style.css / script.js 코드와 에러 메시지를 붙여넣기]
  ```

> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 훨씬 좋습니다.

## 검증법

- 햄버거 버튼을 눌렀을 때 메뉴가 **순간이동하지 않고 0.3초 동안 부드럽게 미끄러져** 나오면 `transition`이 제대로 적용된 것입니다.
- 메뉴가 열릴 때 **화면 전체가 살짝 어두워지면**(오버레이) 성공입니다.
- **× 버튼 / 어두운 막 클릭 / ESC 키** 세 가지 방법 모두로 메뉴가 닫히면 JavaScript 이벤트 연결이 잘 된 것입니다.
- 메뉴가 열린 동안 본문이 위아래로 스크롤되지 않으면(`overflow: hidden`) 모바일 앱처럼 자연스럽게 동작하는 것입니다.
- F12 개발자 도구의 **콘솔(Console)** 탭에 빨간 오류 메시지가 없으면 코드가 깨진 곳 없이 잘 작동하는 것입니다.
- (선택) F12에서 햄버거 버튼을 누른 직후 `<body>` 태그에 `class="menu-open"`이 붙고, 닫으면 사라지는지 Elements(요소) 탭에서 눈으로 확인할 수 있습니다.

## 관련 가이드 링크

- [MDN: `transform`의 `translateX()` (좌우 이동)](https://developer.mozilla.org/ko/docs/Web/CSS/transform-function/translateX)
- [MDN: `transition` (부드러운 전환)](https://developer.mozilla.org/ko/docs/Web/CSS/transition)
- [MDN: `position: fixed` (화면 고정)](https://developer.mozilla.org/ko/docs/Web/CSS/position)
- [MDN: `Element.classList` (클래스 켜고 끄기)](https://developer.mozilla.org/ko/docs/Web/API/Element/classList)
- [MDN: `addEventListener` (이벤트 연결)](https://developer.mozilla.org/ko/docs/Web/API/EventTarget/addEventListener)
- 이전 단계 복습: 044(position fixed/sticky), 046~047(미디어쿼리·반응형 메뉴), 049(transition·transform 호버), 059(classList.toggle 다크모드)
