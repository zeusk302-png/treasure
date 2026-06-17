# 표에 머리·본문·바닥 구역과 캡션 붙이기

표 안에도 "이 줄은 제목", "이 줄은 내용", "이 줄은 합계"처럼 역할이 있습니다.
이번 실습에서는 `caption`, `thead`, `tbody`, `tfoot`로 구역을 나눈 **가계부 표**를 만들어 봅니다.

## 목표

`caption`, `thead`, `tbody`, `tfoot`로 합계 행이 분리된 정돈된 가계부 표를 만들며, 표의 의미적(역할별) 구역 나누기를 익힙니다.

표의 4가지 구역을 한눈에 정리하면 이렇습니다.

| 태그 | 역할 | 쉽게 말하면 |
| --- | --- | --- |
| `<caption>` | 표의 제목 | 이 표가 "무엇에 대한 표"인지 알려주는 이름표 |
| `<thead>` | 머리 구역 | 날짜·내용·금액 같은 **열 이름** 줄 |
| `<tbody>` | 본문 구역 | 실제 **내역**(데이터)이 한 줄씩 들어가는 곳 |
| `<tfoot>` | 바닥 구역 | **합계**처럼 요약하는 줄 |

> 머리/본문/바닥으로 나눠 두면 사람이 봐도 구조가 명확하고, 나중에 CSS로 합계 줄만 따로 꾸미기도 쉽습니다.

## 따라하는 단계

1. `019` 폴더를 만들고 그 안에 `index.html`과 `style.css` 두 파일을 준비합니다.
2. `index.html`에 기본 골격(`<!DOCTYPE html>` ~ `<body>`)을 적고 `<h1>`으로 페이지 제목을 씁니다.
3. `<table>` 태그를 열고, **맨 위에** `<caption>2026년 6월 가계부</caption>`로 표 제목을 넣습니다.
4. `<thead>` 안에 `<tr>` 한 줄을 만들고, 열 이름은 `<td>`가 아니라 **`<th>`**(table header)로 적습니다: 날짜 / 내용 / 분류 / 금액.
5. `<tbody>` 안에 지출 내역을 `<tr>`로 한 줄씩 추가합니다. 칸 하나하나는 `<td>`로 적습니다.
6. `<tfoot>` 안에 합계 줄을 만듭니다. "합계" 글자는 `<th colspan="3">합계</th>`로 칸 3개를 가로로 합치고, 마지막 칸에 합계 금액을 넣습니다.
7. `style.css`에서 `border-collapse: collapse`로 선을 정리하고, `thead`·`tfoot`에 배경색을 줘서 구역을 눈으로 구분되게 꾸밉니다.
8. `index.html`을 더블클릭해 브라우저로 엽니다.

## 검증법

- 브라우저에 표가 보이고, 표 위에 **"2026년 6월 가계부"** 라는 제목(caption)이 떠 있나요?
- **머리 줄**(날짜·내용·분류·금액)이 파란 배경 등으로 본문과 구분되어 보이나요?
- **본문**에 지출 내역 4줄이 한 줄씩 잘 나오나요?
- **맨 아래 합계 줄**에서 "합계" 글자가 칸 3개에 걸쳐 한 칸으로 합쳐져 있고, 금액(17,500)이 오른쪽 끝 칸에 있나요?
- (선택) 브라우저에서 표를 우클릭 → "검사"를 눌러 `<thead>`, `<tbody>`, `<tfoot>` 태그가 실제로 나뉘어 있는지 확인해 보세요.

자주 하는 실수

- `caption`은 반드시 `<table>` 바로 안, **맨 위**에 와야 합니다. (`thead` 위)
- 머리 줄의 칸은 `<td>`가 아니라 `<th>`를 씁니다. 본문 데이터 칸은 `<td>`입니다.
- `colspan="3"`은 가로로 칸 3개를 합치는 것입니다. 숫자를 표의 실제 열 개수에 맞춰야 표가 비뚤어지지 않습니다(이 표는 열이 4개라 3+1=4).

## 관련 가이드 링크

- [MDN: `<table>` 표 만들기](https://developer.mozilla.org/ko/docs/Web/HTML/Element/table)
- [MDN: `<caption>` 표 제목](https://developer.mozilla.org/ko/docs/Web/HTML/Element/caption)
- [MDN: `<thead>` 머리 구역](https://developer.mozilla.org/ko/docs/Web/HTML/Element/thead)
- [MDN: `<tbody>` 본문 구역](https://developer.mozilla.org/ko/docs/Web/HTML/Element/tbody)
- [MDN: `<tfoot>` 바닥 구역](https://developer.mozilla.org/ko/docs/Web/HTML/Element/tfoot)
- [MDN: colspan으로 셀 병합하기](https://developer.mozilla.org/ko/docs/Web/HTML/Element/td#attr-colspan)

> 이전 실습: 018 셀 병합으로 가격표 만들기(colspan/rowspan) · 다음 실습: 020 style 속성으로 글자 색·크기 바꾸기
