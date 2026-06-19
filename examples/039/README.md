# 039. grid로 사진 4장 2x2 갤러리 만들기

CSS의 `display: grid`와 `grid-template-columns`를 사용해 사진 4장을 2열 x 2행(2x2) 격자로 배치하는 실습입니다. 이미지 갤러리를 만들며 그리드의 가장 기본인 "행과 열" 개념을 손으로 익힙니다.

## 목표

- `display: grid`가 무엇인지(박스를 "격자판"으로 바꾸는 것) 이해한다.
- `grid-template-columns`로 열의 개수와 너비를 정하는 법을 익힌다.
- 자식 요소들이 위에서부터 차례대로 칸을 채워 자동으로 2x2 격자가 만들어지는 원리를 눈으로 확인한다.
- `gap`으로 칸 사이 간격을 주는 법을 익힌다.

## 따라하는 단계

1. `index.html`과 `style.css`가 **같은 폴더(039)** 안에 있는지 확인합니다. HTML 위쪽의 `<link rel="stylesheet" href="style.css" />` 한 줄이 두 파일을 연결해 줍니다.
2. `index.html`을 더블클릭해 브라우저(크롬 등)로 엽니다. 색이 다른 사진 4장이 2줄 x 2칸 격자로 보이면 성공입니다.
3. `style.css`를 열어 `.gallery` 부분을 봅니다. 핵심은 딱 세 줄입니다.
   - `display: grid;` -> 이 박스를 격자판으로 만든다.
   - `grid-template-columns: 1fr 1fr;` -> 열을 2개로 나눈다. (`1fr 1fr`은 "똑같은 너비 2칸"이라는 뜻)
   - `gap: 16px;` -> 칸과 칸 사이 간격을 16px 준다.
4. 직접 바꿔보며 원리를 확인합니다.
   - `grid-template-columns: 1fr 1fr;`을 `1fr 1fr 1fr;`로 바꾸면 3열이 되어 격자 모양이 바뀝니다. (다시 `1fr 1fr`로 되돌리세요.)
   - `gap: 16px;`의 숫자를 `4px`나 `40px`로 바꿔 간격이 어떻게 변하는지 봅니다.
5. (선택) `index.html`에서 `<figure class="gallery-item">...</figure>` 블록 하나를 통째로 복사해 5번째, 6번째 사진을 추가해 봅니다. 열 개수는 그대로 2열이므로 줄(행)만 자동으로 늘어나는 것을 확인할 수 있습니다.

> 참고: 예제의 사진은 인터넷 연결 없이도 보이도록 SVG로 그린 색 블록을 사용했습니다. 실제 사진을 쓰려면 `img`의 `src`를 본인 이미지 파일 경로(예: `images/beach.jpg`)나 이미지 주소로 바꾸면 됩니다.

## 🤖 바이브코딩 프롬프트

이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다. 한 단계씩 시켜 보세요.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 CSS를 처음 배우는 비전공자에게 친절하게 알려주는 프론트엔드 강사야.
  index.html 한 파일에 "사진 4장을 2열 x 2행(2x2)로 보여주는 갤러리"의 뼈대를 만들어줘.
  조건:
  - <section class="gallery"> 안에 <figure class="gallery-item"> 4개를 넣고, 각 figure 안에는 <img>와 <figcaption>(사진 설명)을 둘 것.
  - 사진은 인터넷 없이도 보이도록 색이 다른 placeholder(예: SVG data URL 또는 색 배경 div)로 채울 것.
  - 아직 CSS Grid는 적용하지 말고 HTML 구조만 먼저 만들 것.
  - img에는 의미 있는 alt 텍스트를 꼭 넣을 것.
  각 줄이 무슨 역할인지 한국어 주석으로 한 줄씩 설명해줘.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  방금 만든 갤러리에 style.css를 추가해서 사진 4장이 진짜 2x2 격자로 보이게 해줘.
  조건:
  - .gallery에 display: grid 와 grid-template-columns: 1fr 1fr 를 적용해서 2열로 만들 것.
  - gap으로 사진 사이 간격을 16px 줄 것.
  - 사진은 칸을 꽉 채우되 찌그러지지 않게 object-fit: cover 를 쓸 것.
  - .gallery에 max-width와 margin: 0 auto 로 가운데 정렬할 것.
  왜 figure 4개만으로 2행이 자동으로 만들어지는지, 1fr이 무슨 뜻인지 주석으로 설명해줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  사진이 2x2 격자로 안 보이고 위에서 아래로 한 줄(1열)로만 쌓여서 나와.
  내 style.css의 .gallery 부분이야: (여기에 코드 붙여넣기)
  무엇이 문제인지 한 가지씩 점검 순서대로 알려주고(예: display:grid가 빠졌는지, grid-template-columns가 1fr 한 개만 있는지),
  고친 코드와 "왜 그게 원인이었는지" 이유를 비전공자가 이해하게 한국어로 설명해줘.
  ```
> 프롬프트 팁: 프롬프트 끝에 "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘"를 덧붙이면, 결과를 그냥 붙여 넣는 데 그치지 않고 원리를 익힐 수 있어 학습에 훨씬 좋습니다.

## 검증법

- 브라우저로 `index.html`을 열었을 때 사진 4장이 **2칸 x 2줄(2x2)** 격자로 나란히 보인다.
- 브라우저 창의 너비를 줄였다 늘렸다 해도 두 칸이 항상 화면을 절반씩 나눠 가진다. (`1fr 1fr`이 비율로 나누기 때문)
- 개발자도구(F12) > Elements에서 `.gallery` 요소를 선택하면 `display: grid`가 적용된 것을 확인할 수 있고, 칸 경계에 그리드 점선이 표시됩니다.
- `grid-template-columns`를 `1fr 1fr 1fr`로 바꾸면 격자가 3열로 변하고, 되돌리면 다시 2열이 된다.

## 관련 가이드 링크

- 이전 실습: [038. 본문은 자동, 사이드바는 고정인 2단 레이아웃 만들기](../038/README.md) — flexbox로 가변/고정 너비 나누기
- 다음 실습: [040. fr 단위로 비율 나눈 대시보드 격자 만들기](../040/README.md) — `fr` 단위와 `gap`을 더 깊이 다루기
- 더 나아가기: [041. auto-fit·minmax로 카드 수가 자동 조절되는 그리드](../041/README.md) — 반응형 그리드
- 참고 문서: [MDN - CSS Grid Layout 기초](https://developer.mozilla.org/ko/docs/Web/CSS/CSS_grid_layout/Basic_concepts_of_grid_layout)
