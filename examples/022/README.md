# 인라인 스타일로 상품 소개 카드 디자인하기

이미지, 제목, 설명, 가격을 한 박스에 모아 "상품 카드" UI를 만듭니다.
이번엔 별도의 CSS 파일 없이, 태그 안에 `style="..."`로 직접 꾸미는 **인라인 스타일**만 사용합니다.

## 목표

- 여러 요소(이미지, 제목, 설명, 가격, 버튼)를 하나의 박스(`div`)로 묶는다.
- `border-radius`(둥근 모서리), `box-shadow`(그림자), `text-align`(글자 정렬)을 직접 적용해본다.
- 쇼핑몰에서 흔히 보는 카드 UI가 어떤 속성들의 조합인지 눈으로 익힌다.

## 따라하는 단계

1. `index.html` 파일을 메모장이나 VS Code로 엽니다.
2. `<body>` 안에 있는 카드 바깥 박스 `div`를 봅니다. 여기에 카드의 핵심 속성 3가지가 들어 있어요.
   - `border-radius: 16px;` → 모서리를 둥글게 깎습니다. 숫자를 키우면 더 둥글어집니다.
   - `box-shadow: 0 8px 24px rgba(0,0,0,0.12);` → 카드 아래에 그림자를 넣어 "떠 있는" 느낌을 줍니다.
     (순서: 가로위치 / 세로위치 / 번짐 / 색·투명도)
   - `text-align: center;` → 박스 안의 글자와 버튼을 가운데로 정렬합니다.
3. 그 안에 순서대로 `img`(상품 사진), `h2`(제목), `p`(설명), `p`(가격), `a`(담기 버튼)가 들어 있습니다.
4. 사진 아래 글자 영역 `div`의 `padding: 20px;`는 **안쪽 여백**입니다. 사진과 글자가 너무 붙지 않게 띄워줍니다.
5. 파일을 저장한 뒤, 파일을 더블클릭해 브라우저로 엽니다.
6. 직접 바꿔보며 익히기:
   - 가격 색 `color: #2563eb;`를 `#e11d48`(빨강)으로 바꿔보세요.
   - `border-radius` 값을 `0px`으로 바꿔 모서리가 각지는 것을 확인하세요.
   - `box-shadow`를 지웠다 넣었다 하며 그림자 유무 차이를 봅니다.

## 검증법

- 브라우저로 열었을 때 흰색 카드가 회색 배경 **가운데**에 놓여 있다.
- 카드의 **네 모서리가 둥글고**, 카드 아래에 **연한 그림자**가 보인다.
- 위에서부터 사진 → 제목 → 설명 → 가격 → 파란 "담기" 버튼이 차례로, **가운데 정렬**되어 보인다.
- 이미지는 인터넷에서 불러오므로(picsum.photos) 잠깐 로딩될 수 있습니다. 안 보이면 `alt` 설명 텍스트가 대신 뜹니다.

## 관련 가이드 링크

- [MDN - border-radius](https://developer.mozilla.org/ko/docs/Web/CSS/border-radius)
- [MDN - box-shadow](https://developer.mozilla.org/ko/docs/Web/CSS/box-shadow)
- [MDN - text-align](https://developer.mozilla.org/ko/docs/Web/CSS/text-align)
- [MDN - 인라인 스타일(style 속성)](https://developer.mozilla.org/ko/docs/Web/HTML/Global_attributes/style)

> 참고: 카드 하나만 만들 땐 인라인 스타일도 괜찮지만, 카드가 여러 개가 되면 같은 스타일을 복사·붙여넣기 해야 해서 번거로워집니다.
> 그래서 다음 단계부터는 `style.css` 파일로 스타일을 분리하는 법을 배웁니다.
