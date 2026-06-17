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
