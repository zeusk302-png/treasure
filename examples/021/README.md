# 배경색·여백·테두리로 알림 박스 만들기

## 목표
`div` 박스에 인라인 `style`로 배경색(`background`), 안쪽 여백(`padding`), 테두리(`border`)를 직접 적어서 색이 있는 안내(알림) 박스를 만듭니다. 이 세 가지 속성이 박스를 어떻게 꾸미는지 눈으로 확인하는 것이 핵심입니다.

세 속성의 역할을 한 줄로 정리하면 이렇습니다.

- **background**: 박스 안을 채우는 배경색입니다. (예: `background: #e6f4ea;`)
- **padding**: 글자와 테두리 사이의 "안쪽 여백"입니다. 값이 클수록 글자 주변이 넉넉해집니다. (예: `padding: 16px;`)
- **border**: 박스를 둘러싸는 테두리선입니다. `두께 종류 색` 순서로 적습니다. (예: `border: 1px solid #34a853;` = 1px 두께의 실선, 초록색)

## 따라하는 단계
1. `C:\Users\김세영\Desktop\부산코딩스쿨_강의자료\treasure\examples\021\` 폴더에 있는 `index.html` 파일을 메모장이나 VS Code로 엽니다.
2. 가장 위에 있는 초록색 박스 코드를 봅니다. `<div style="background: #e6f4ea; padding: 16px; border: 1px solid #34a853; ...">`처럼 `style` 속성 안에 세 가지가 들어 있습니다.
3. `background` 뒤의 색 코드(`#e6f4ea`)를 다른 색(예: `#ffe0e0`)으로 바꿔 저장한 뒤 브라우저에서 새로고침해 배경색이 바뀌는지 봅니다.
4. `padding: 16px;`의 숫자를 `4px`와 `40px`로 각각 바꿔보며 글자 주변 여백이 좁아지고 넓어지는 것을 확인합니다.
5. `border: 1px solid ...`의 `1px`을 `4px`로, `solid`를 `dashed`(점선)로 바꿔 테두리 모양이 달라지는 것을 확인합니다.
6. 마지막 파란 박스의 `border-left: 5px solid #1a73e8;`처럼 한쪽 테두리만 굵게 주면 강조 느낌을 줄 수 있습니다. 직접 `border-top`이나 `border-bottom`으로 바꿔봅니다.
7. (도전) 나만의 다섯 번째 알림 박스를 `</body>` 위에 하나 더 추가해, 좋아하는 색·여백·테두리 조합을 만들어 봅니다.

## 검증법
- `index.html`을 더블클릭하거나 브라우저로 열었을 때, 위에서부터 초록(성공)·노랑(경고)·빨강(오류)·파랑(정보) 순으로 색이 다른 박스 4개가 보이면 성공입니다.
- 각 박스의 글자가 테두리에 딱 붙지 않고 안쪽에 여백을 두고 떨어져 있으면 `padding`이 제대로 적용된 것입니다.
- 박스마다 색이 있는 테두리선이 보이면 `border`가 적용된 것입니다.
- 마지막 파란 박스는 왼쪽에만 굵은 선이 있으면 정상입니다.
- 색 코드나 숫자를 바꿔 저장하고 새로고침했을 때 화면이 바로 따라 바뀌면 인라인 스타일을 올바르게 이해한 것입니다.

## 관련 가이드 링크
- 이전 실습: `examples/020` — style 속성으로 글자 색·크기 바꾸기 (인라인 스타일 입문)
- 다음 실습: `examples/022` — 인라인 스타일로 상품 소개 카드 디자인하기 (border-radius / box-shadow)
- 참고: MDN 박스 모델(여백·테두리 개념) https://developer.mozilla.org/ko/docs/Learn/CSS/Building_blocks/The_box_model
- 참고: MDN border 속성 https://developer.mozilla.org/ko/docs/Web/CSS/border
