# 069 · 탭 메뉴 만들기 (탭 클릭 시 내용 전환)

쇼핑몰 상품 상세 페이지나 카페 소개 페이지에서 자주 보는 "상품정보 / 리뷰 / 배송"처럼 위쪽 버튼을 누르면 그 아래 내용만 바뀌는 **탭 메뉴**를 직접 만들어 봅니다. 이번 실습의 핵심은 **`data` 속성으로 버튼과 내용 칸의 짝을 맞추는 패턴**입니다. "메뉴" 버튼에는 `data-tab="menu"`, 그 짝이 되는 내용 칸에는 `data-panel="menu"`라고 똑같은 이름표를 붙여 두면, 버튼을 눌렀을 때 같은 이름표를 가진 칸만 골라서 보여줄 수 있습니다.

## 목표

- 탭 버튼 3개(메뉴 · 영업시간 · 오시는 길)를 만들고, 누른 버튼에 해당하는 패널 **하나만** 보이고 나머지는 숨겨지게 만든다.
- 버튼의 `data-tab` 값과 패널의 `data-panel` 값을 똑같이 맞춰, "이 버튼은 이 칸과 한 짝"이라는 연결을 코드 없이 HTML로 표현한다.
- 핵심 개념: 여러 요소를 한 번에 찾는 `querySelectorAll`, 하나씩 처리하는 `forEach`, `data-*` 값 읽기(`dataset`), 그리고 "전부 끄고 → 누른 것 하나만 켜기"라는 활성 전환 패턴.

## 따라하는 단계

1. 폴더 `069` 안에 `index.html`, `style.css`, `script.js` 세 파일이 있는지 확인합니다. (이미 준비되어 있습니다.)
2. `index.html`을 더블클릭해 브라우저로 엽니다. 위에 탭 버튼 3개가 있고, 처음엔 "메뉴" 탭에 파란 밑줄이 있으며 그 아래 메뉴 목록이 보입니다.
3. "영업시간", "오시는 길" 버튼을 차례로 눌러 봅니다. 누른 버튼에만 파란 밑줄이 생기고, 그 버튼에 맞는 내용으로 아래 칸이 바뀝니다.
4. `index.html`을 열어 **짝꿍 관계**를 눈으로 확인합니다.
   - 버튼 쪽: `<button class="tab" data-tab="hours">영업시간</button>`
   - 패널 쪽: `<section class="panel" data-panel="hours"> ... </section>`
   - 두 곳의 값이 똑같이 `hours`입니다. 이 "같은 이름표"가 둘을 한 짝으로 묶어 줍니다.
5. `style.css`에서 보이고 숨기는 규칙을 봅니다.
   - `.panel { display: none; }` — 모든 패널은 기본적으로 숨겨 둡니다.
   - `.panel.is-active { display: block; }` — `is-active` 클래스가 붙은 패널 **하나만** 나타납니다.
6. `script.js`를 위에서부터 읽어 봅니다.
   - `querySelectorAll(".tab")` — 탭 버튼 전부를, `querySelectorAll(".panel")` — 패널 전부를 한 번에 모아옵니다.
   - `tab.dataset.tab` — HTML에 적은 `data-tab` 값을 JS에서 읽는 방법입니다. 누른 버튼이 어떤 짝인지 알아내는 부분입니다.
   - 버튼을 누르면 (1) 모든 버튼·패널에서 `is-active`를 **떼고**, (2) 누른 버튼과 (3) `data-panel` 값이 같은 패널에만 다시 `is-active`를 **붙입니다.** "전부 끄고 → 하나만 켜기"가 탭 전환의 핵심 흐름입니다.
7. 직접 바꿔 보기: `index.html`에서 네 번째 탭을 추가해 봅니다. 탭 버튼에 `<button class="tab" data-tab="event">이벤트</button>`를 추가하고, 패널에 `<section class="panel" data-panel="event"><h2>이벤트</h2><p>가입 시 음료 1잔 무료!</p></section>`를 추가한 뒤 저장하고 새로고침합니다. JS는 한 줄도 고치지 않아도 새 탭이 그대로 작동합니다. (이름표만 맞추면 끝!)

## 검증법

- 아무 탭이나 눌렀을 때, 화면에 보이는 내용 칸이 **항상 정확히 하나**여야 합니다. 두 개가 동시에 보이거나, 하나도 안 보이면 짝 맞추기가 어긋난 것입니다.
- 누른 버튼에만 파란 밑줄(선택 표시)이 생기고, 나머지 두 버튼의 밑줄은 사라지는지 확인합니다.
- 같은 탭을 두 번 연속 눌러도 그 내용이 그대로 잘 보이는지 확인합니다. (오류 없이 안정적으로 동작)
- 7단계 실험: 새 탭 "이벤트"를 추가했을 때, `script.js`를 전혀 고치지 않았는데도 버튼·내용이 잘 전환되면 성공입니다. 이는 코드가 정해진 개수가 아니라 "`.tab`/`.panel`이면 모두" 처리하도록 짜여 있기 때문입니다.
- (보조기기 확인) 개발자 도구로 버튼을 살펴보면, 선택된 탭만 `aria-selected="true"`이고 나머지는 `false`인지 확인할 수 있습니다.

## 관련 가이드 링크

- 이전: [068 · FAQ 아코디언 만들기](../068/) — 여러 요소를 `querySelectorAll`/`forEach`로 반복 처리하고 한 번에 하나만 펼치기
- 다음: [070 · 드롭다운 메뉴 만들기](../070/) — 바깥을 클릭하면 닫히는 메뉴와 이벤트 버블링
- 묶음(C · 자바스크립트 인터랙션): [059 다크모드 토글](../059/) · [060 더보기/접기 토글](../060/) — 클래스로 상태를 켜고 끄는 패턴 모음
- 참고 문서(MDN): [querySelectorAll](https://developer.mozilla.org/ko/docs/Web/API/Document/querySelectorAll) · [dataset (data-* 속성 읽기)](https://developer.mozilla.org/ko/docs/Web/API/HTMLElement/dataset) · [classList](https://developer.mozilla.org/ko/docs/Web/API/Element/classList) · [ARIA: tab 역할](https://developer.mozilla.org/ko/docs/Web/Accessibility/ARIA/Roles/tab_role)
