# 미디어쿼리로 모바일에서 메뉴 세로로 쌓기

넓은 화면(PC)에서는 메뉴가 가로로 나란히 놓이고, 좁은 화면(스마트폰)에서는 메뉴가 세로로 차곡차곡 쌓이는 반응형 메뉴를 만듭니다. CSS의 `@media` 한 줄로 "화면 크기에 따라 디자인을 바꾸는" 마법을 직접 체험합니다.

## 목표

- `@media (max-width: 768px)` 분기를 사용해 작은 화면에서만 다른 스타일을 적용한다.
- 가로로 배치된 메뉴(`flex-direction: row`)를 세로(`flex-direction: column`)로 바꾼다.
- **분기점(breakpoint)** 이 무엇인지, 왜 768px 같은 숫자를 기준으로 삼는지 감을 잡는다.

## 따라하는 단계

1. `examples/046` 폴더 안의 `index.html`, `style.css` 두 파일을 같은 폴더에 둔다. (이미 들어 있습니다.)
2. `index.html`을 더블클릭해 브라우저(크롬·엣지 등)로 연다. 처음에는 창이 넓어서 메뉴가 **가로**로 보입니다.
3. 브라우저 창의 오른쪽 가장자리를 마우스로 잡고 **창 너비를 천천히 좁게** 줄여 본다.
4. 창 너비가 약 768px보다 작아지는 순간, 메뉴가 **세로로 쌓이고** 안내 문구도 "모바일" 버전으로 바뀝니다. 이 변하는 지점이 바로 분기점입니다.
5. `style.css`를 열어 맨 아래 `@media (max-width: 768px) { ... }` 블록을 찾는다. 그 안의 `flex-direction: column;` 이 메뉴를 세로로 바꾸는 핵심 코드입니다.
6. (응용) `max-width: 768px`의 숫자를 `480px`로 바꿔 저장한 뒤 새로고침하면, 더 좁아져야 메뉴가 세로로 바뀝니다. 분기점을 직접 옮겨 보세요.

## 검증법

- **가로 → 세로 전환**: 창을 넓게 했을 때 메뉴 4개(홈·소개·강의·문의)가 한 줄에 가로로, 좁게 했을 때 세로로 쌓이면 성공입니다.
- **안내 문구 전환**: 넓을 때는 "넓은 화면(데스크톱)", 좁을 때는 "좁은 화면(모바일)" 문구가 보입니다.
- **개발자 도구로 정확히 확인**: 브라우저에서 `F12`를 눌러 개발자 도구를 열고, 좌상단의 휴대폰/태블릿 아이콘(기기 툴바, 단축키 `Ctrl+Shift+M`)을 켜면 실제 모바일 크기에서 어떻게 보이는지 정확히 확인할 수 있습니다.
- **흔한 실수 점검**: 모바일에서 전혀 바뀌지 않는다면 `index.html`의 `<head>` 안에 `<meta name="viewport" content="width=device-width, initial-scale=1.0" />` 줄이 있는지 확인하세요. 이 줄이 없으면 실제 휴대폰에서 미디어쿼리가 동작하지 않습니다.

## 핵심 개념 한 줄 정리

- `@media (max-width: 768px) { ... }` = "화면 가로폭이 **768px 이하**일 때만 이 안의 스타일을 적용해 줘"
- **분기점(breakpoint)** = 디자인이 바뀌는 기준 너비. 보통 모바일/태블릿 경계로 768px을 많이 씁니다.

## 관련 가이드 링크

- MDN: [미디어쿼리 사용하기](https://developer.mozilla.org/ko/docs/Web/CSS/CSS_media_queries/Using_media_queries)
- MDN: [반응형 디자인 입문](https://developer.mozilla.org/ko/docs/Learn/CSS/CSS_layout/Responsive_Design)
- MDN: [flex-direction](https://developer.mozilla.org/ko/docs/Web/CSS/flex-direction)
- 같은 시리즈 다음 실습: `examples/047` (모바일 우선으로 1열→2열→3열 반응형 카드 만들기)
