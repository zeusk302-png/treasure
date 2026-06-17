# 줄무늬 배경과 테두리로 가독성 좋은 표 꾸미기

## 목표
표의 머리글 칸(`th`)과 내용 칸(`td`)에 인라인 `style`로 **테두리(border)·배경색(background)·안쪽 여백(padding)**을 직접 주어, **한 줄 걸러 색이 다른(줄무늬, zebra) 읽기 쉬운 표**를 만듭니다. 글자만 빽빽한 밋밋한 표가 어떻게 "한눈에 들어오는 표"로 바뀌는지 눈으로 확인하는 것이 핵심입니다.

이 실습에서 쓰는 속성을 한 줄로 정리하면 이렇습니다.

- **border**: 칸을 둘러싸는 테두리선입니다. `두께 종류 색` 순서로 적습니다. (예: `border: 1px solid #dddddd;` = 1px 두께의 회색 실선)
- **background**: 칸 안을 채우는 배경색입니다. 짝수 줄과 홀수 줄에 다른 색을 주면 줄무늬가 됩니다. (예: `background: #f2f6fc;`)
- **padding**: 글자와 칸 테두리 사이의 안쪽 여백입니다. 넉넉히 줄수록 표가 답답하지 않고 시원해 보입니다. (예: `padding: 12px;`)
- **border-collapse: collapse**: `table` 태그에 주는 속성입니다. 칸과 칸 사이에 벌어진 이중 테두리를 하나로 합쳐 깔끔하게 만들어 줍니다.

## 따라하는 단계
1. `C:\Users\김세영\Desktop\부산코딩스쿨_강의자료\treasure\examples\023\` 폴더의 `index.html` 파일을 메모장이나 VS Code로 엽니다.
2. 맨 위 `<table style="border-collapse: collapse; ...">`를 봅니다. 표 전체에 `border-collapse: collapse;`가 있어서 테두리가 하나로 합쳐집니다. 이 부분을 잠깐 지우고 저장·새로고침해 테두리가 이중선으로 벌어지는 것을 확인한 뒤 다시 되돌립니다.
3. 머리글 줄(`<th ...>`)에는 진한 파란 배경(`background: #1a73e8;`)과 흰 글자(`color: #ffffff;`)가 들어 있습니다. 파란색 코드를 다른 색(예: `#34a853` 초록)으로 바꿔 저장·새로고침해 머리글 색이 바뀌는지 봅니다.
4. 내용 줄(`<td ...>`)을 봅니다. 1·3·5번째 줄은 `background: #ffffff;`(흰색), 2·4번째 줄은 `background: #f2f6fc;`(연회색)로 **번갈아** 들어 있습니다. 이 차이가 바로 줄무늬입니다.
5. 짝수 줄의 `#f2f6fc`를 모두 좋아하는 연한 색(예: `#fff3e0` 연주황)으로 바꿔 저장·새로고침해 줄무늬 색을 내 마음대로 바꿔봅니다.
6. 모든 칸의 `padding: 12px;`를 `4px`로 바꿔 표가 답답해지는 것을, `20px`로 바꿔 시원해지는 것을 비교해 봅니다.
7. (도전) `</table>` 위에 6번째 내용 줄(`<tr>...</tr>`)을 하나 더 복사해 추가합니다. 새 줄은 홀수 번째이므로 `background`를 흰색(`#ffffff`)으로 맞춰 줄무늬 순서가 유지되게 합니다.

## 검증법
- `index.html`을 더블클릭하거나 브라우저로 열었을 때, 맨 위에 파란 머리글 줄(번호·이름·좋아하는 과목)이 보이고 그 아래 학생 5명이 표로 나오면 성공입니다.
- 내용 줄을 위에서 아래로 보면 **흰색 → 연회색 → 흰색 → 연회색 → 흰색**으로 배경이 번갈아 나오면 줄무늬가 제대로 적용된 것입니다.
- 모든 칸 둘레에 회색 테두리선이 보이고, 칸과 칸 사이가 이중선으로 벌어지지 않고 한 줄로 깔끔하면 `border`와 `border-collapse`가 잘 적용된 것입니다.
- 각 칸의 글자가 테두리에 딱 붙지 않고 안쪽에 여백을 두고 떨어져 있으면 `padding`이 적용된 것입니다.
- 색 코드나 숫자를 바꿔 저장하고 새로고침했을 때 화면이 바로 따라 바뀌면 인라인 스타일을 올바르게 이해한 것입니다.

## 관련 가이드 링크
- 이전 실습: `examples/022` — 인라인 스타일로 상품 소개 카드 디자인하기 (border-radius / box-shadow / text-align)
- 표 기초 실습: `examples/017` — 이번 주 시간표(표) 만들기 (table / tr / th / td 의 기본 구조)
- 다음 실습: `examples/024` — 한 화면 자기소개 페이지(프로필) 종합 완성하기
- 참고: MDN `<table>` 표 만들기 https://developer.mozilla.org/ko/docs/Web/HTML/Element/table
- 참고: MDN `border-collapse` 속성 https://developer.mozilla.org/ko/docs/Web/CSS/border-collapse
- 참고: MDN 표 스타일링 입문 https://developer.mozilla.org/ko/docs/Learn/CSS/Building_blocks/Styling_tables
