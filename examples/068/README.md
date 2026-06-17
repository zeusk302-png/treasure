# FAQ 아코디언 만들기 (한 번에 하나만 열림)

질문을 누르면 답이 펼쳐지고, 다른 질문을 열면 이전에 열려 있던 답이 자동으로 닫히는 FAQ 아코디언입니다. 자바스크립트로 "여러 개의 요소를 한꺼번에 골라서 하나씩 반복 처리"하는 기본기를 익히는 실습입니다.

## 목표

- `querySelectorAll`로 여러 개의 질문 버튼을 한 번에 골라온다.
- `forEach`로 골라온 요소들을 하나씩 반복하며 클릭 동작을 붙인다.
- "활성 클래스"(`is-open`)를 붙였다 뗐다 하며 열림/닫힘 상태를 표현한다.
- "한 번에 하나만 열림" 규칙을 코드로 구현한다 (다른 질문을 열면 나머지는 모두 닫힘).

## 따라하는 단계

1. 폴더 안의 `index.html`, `style.css`, `script.js` 세 파일을 같은 폴더에 둡니다.
2. `index.html`을 더블 클릭해 브라우저로 엽니다. 처음에는 질문 4개가 닫힌 채로 보입니다.
3. `index.html`을 살펴봅니다. 한 칸(`.faq-item`)은 "누르는 질문 버튼(`.faq-question`)"과 "펼쳐지는 답(`.faq-answer`)"으로 이루어져 있습니다. 질문을 `<button>`으로 만든 이유는 마우스뿐 아니라 키보드(Tab + Enter)로도 누를 수 있게 하기 위해서입니다.
4. `script.js`를 봅니다. `document.querySelectorAll(".faq-question")`로 질문 버튼을 전부 가져온 뒤, `forEach`로 하나씩 돌면서 각 버튼에 클릭 동작을 연결합니다.
5. 클릭하면 동작 순서는 이렇습니다: (1) 누른 질문이 원래 열려 있었는지 기억 → (2) `closeAll()`로 모든 칸을 닫음 → (3) 원래 닫혀 있던 질문이면 그 칸만 다시 엶. 이 순서 덕분에 "한 번에 하나만" + "같은 걸 다시 누르면 닫힘(토글)"이 동시에 됩니다.
6. `style.css`에서는 답 영역에 `max-height: 0`(닫힘)과 `.is-open` 상태의 `max-height`(열림)를 주어 부드럽게 펼쳐지게 만듭니다. `+` 아이콘은 열릴 때 45도 회전해 `×`처럼 보입니다.
7. 직접 질문 한 칸을 더 추가해 봅니다. `index.html`에서 `.faq-item` 블록을 복사해 붙여넣기만 하면 됩니다. 자바스크립트는 고치지 않아도 새 칸이 자동으로 작동합니다 (querySelectorAll이 새 버튼까지 골라주기 때문).

## 검증법

- 질문 1을 누르면 답이 펼쳐지고, 아이콘이 `+`에서 회전합니다.
- 질문 1이 열린 상태에서 질문 2를 누르면, 질문 1은 자동으로 닫히고 질문 2만 열립니다. (한 번에 하나만 열림 확인)
- 이미 열려 있는 질문을 다시 누르면 닫힙니다. (토글 동작 확인)
- 마우스 대신 키보드 Tab으로 질문에 이동한 뒤 Enter를 눌러도 똑같이 펼쳐집니다.
- 개발자 도구(F12)의 Elements 탭에서, 열린 칸의 `.faq-item`에 `class="faq-item is-open"`이 붙는지 확인합니다.

## 관련 가이드 링크

- [MDN: Document.querySelectorAll()](https://developer.mozilla.org/ko/docs/Web/API/Document/querySelectorAll)
- [MDN: NodeList.forEach()](https://developer.mozilla.org/ko/docs/Web/API/NodeList/forEach)
- [MDN: Element.classList (add / remove / toggle / contains)](https://developer.mozilla.org/ko/docs/Web/API/Element/classList)
- [MDN: Element.closest()](https://developer.mozilla.org/ko/docs/Web/API/Element/closest)
- [MDN: CSS transition으로 부드럽게 펼치기](https://developer.mozilla.org/ko/docs/Web/CSS/transition)

> 같은 시리즈의 다음 실습: 069 탭 메뉴 만들기 (탭 클릭 시 내용 전환) — `data-*` 속성으로 짝을 맞추는 패턴으로 이어집니다.
