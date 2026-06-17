# 블로그 글에 태그 필터 버튼으로 글 걸러내기

블로그 글 목록 위에 `전체 / 여행 / 요리 / 개발` 같은 태그 버튼을 두고, 버튼을 누르면 그 태그가 달린 글만 화면에 남기는 미니 프로젝트입니다. 자바스크립트로 "여러 개의 글을 한꺼번에 다루면서, 조건에 맞는 것만 골라(filter) 화면을 다시 그리는" 기본기를 익힙니다.

## 목표

- 태그 버튼을 누르면 해당 태그의 글만 보이고 나머지는 숨겨지게 만든다.
- 글마다 `data-tag` 값을 붙여, 선택한 태그와 비교(필터)하는 패턴을 익힌다.
- "지금 선택된 버튼"을 활성 클래스(`is-active`)로 강조해, 무엇을 누른 상태인지 한눈에 보이게 한다.
- 글을 숨기고 보이는 과정을 통해 "화면 다시 그리기(DOM 갱신)"의 흐름을 이해한다.

## 따라하는 단계

1. 폴더 안의 `index.html`, `style.css`, `script.js` 세 파일을 같은 폴더에 둡니다.
2. `index.html`을 더블 클릭해 브라우저로 엽니다. 처음에는 `전체` 버튼이 눌린 상태로, 글 6개가 모두 보입니다.
3. `index.html`을 살펴봅니다. 위쪽 버튼들에는 `data-tag="여행"`처럼 "걸러낼 기준 태그"가 적혀 있고(`all`은 전체 보기), 아래 글 카드들에는 그 글이 가진 태그가 `data-tag`로 똑같이 적혀 있습니다. 이 값을 서로 비교하는 게 핵심입니다.
4. `script.js`를 봅니다. 버튼마다 일일이 동작을 붙이지 않고, 버튼들을 감싼 상자(`#filter`) 하나에만 클릭 동작을 붙였습니다(이벤트 위임). 그래서 나중에 버튼을 더 추가해도 코드를 안 고쳐도 됩니다.
5. 버튼을 누르면 순서는 이렇습니다: (1) 누른 버튼의 `data-tag`를 읽음 → (2) 모든 버튼의 강조(`is-active`)를 끄고 누른 버튼만 켬 → (3) `applyFilter()`로 글을 다시 걸러냄.
6. `applyFilter()`는 글을 하나씩 돌면서, 선택한 태그가 `all`이거나 글의 태그와 같으면 보이고, 아니면 `is-hidden` 클래스를 붙여 숨깁니다. `style.css`의 `.post.is-hidden { display: none; }`이 실제로 화면에서 감춰주는 부분입니다.
7. 직접 글 한 칸을 추가해 봅니다. `index.html`에서 `.post` 블록을 복사해 붙여넣고 `data-tag`만 바꾸면 됩니다. 자바스크립트는 고치지 않아도 새 글이 필터에 자동으로 반영됩니다.

## 검증법

- `여행` 버튼을 누르면 여행 글 2개만 남고, 나머지(요리·개발)는 사라집니다.
- `요리`, `개발` 버튼도 각각 눌러 그 태그의 글만 보이는지 확인합니다.
- `전체` 버튼을 누르면 글 6개가 다시 모두 나타납니다.
- 버튼을 누를 때마다 누른 버튼만 파란색(활성 상태)으로 강조되는지 확인합니다.
- 시험 삼아 `index.html`의 태그 버튼에 `data-tag="없는태그"`를 가진 버튼을 하나 추가하고 눌러보면, "해당 태그의 글이 아직 없어요." 안내문이 뜹니다.
- 개발자 도구(F12)의 Elements 탭에서, 숨겨진 글 카드에 `class="post is-hidden"`이 붙는지 확인합니다.

## 관련 가이드 링크

- [02. 웹의 기본기 — 자바스크립트로 화면 다루기](../../docs/02-web-basics/index.md)
- [실습 커리큘럼 전체 보기](../../docs/practice/curriculum.md)
- [MDN: HTMLElement.dataset (data-* 속성 읽기)](https://developer.mozilla.org/ko/docs/Web/API/HTMLElement/dataset)
- [MDN: Element.classList (add / remove / contains)](https://developer.mozilla.org/ko/docs/Web/API/Element/classList)
- [MDN: NodeList.forEach() (여러 요소 반복 처리)](https://developer.mozilla.org/ko/docs/Web/API/NodeList/forEach)
- [MDN: 이벤트 위임(Event delegation) 이해하기](https://developer.mozilla.org/ko/docs/Learn/JavaScript/Building_blocks/Events#%EC%9D%B4%EB%B2%A4%ED%8A%B8_%EC%9C%84%EC%9E%84)

> 한 단계 더: 지금은 태그가 한 번에 하나만 선택되지만, 버튼을 여러 개 눌러 "여행 + 요리"를 동시에 보이게 하거나(다중 선택), 각 태그별 글 개수를 버튼에 표시하는 식으로 확장해 볼 수 있습니다.
