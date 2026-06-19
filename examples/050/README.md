# @keyframes로 빙글 도는 로딩 스피너 만들기

웹사이트가 데이터를 불러오는 동안 화면이 멈춘 것처럼 보이면 사용자는 "고장 났나?" 하고 불안해합니다. 그래서 거의 모든 앱과 사이트는 **빙글빙글 도는 작은 고리**(로딩 스피너)를 보여 주며 "지금 처리 중이에요, 잠깐만요"라고 알려 줍니다.

이번 예제에서는 그림 파일이나 JavaScript 없이 **CSS만으로** 무한히 회전하는 로딩 스피너를 만듭니다. 핵심은 두 가지입니다. `@keyframes`로 **"어떻게 움직일지"**를 정하고, `animation`으로 그 움직임을 요소에 **"입히는"** 것입니다.

## 목표

- `@keyframes`로 0도에서 360도까지 한 바퀴 도는 회전 동작을 직접 정의한다.
- `animation` 한 줄의 네 가지 값(이름 / 시간 / 속도곡선 / 반복)이 각각 무슨 뜻인지 이해한다.
- `infinite`를 써서 멈추지 않고 계속 도는 무한 반복을 만든다.
- `border` + `border-radius: 50%` + 윗부분만 다른 색을 줘서, 이미지 없이 도형만으로 스피너 모양을 만드는 원리를 익힌다.
- (응용) `animation-delay`로 점 세 개가 차례로 튀는 또 다른 스피너를 만들어 본다.

## 따라하는 단계

1. `050` 폴더 안의 `index.html`을 마우스로 더블클릭해 브라우저(크롬 등)로 엽니다. 같은 폴더의 `style.css`는 자동으로 함께 불러와집니다. (두 파일은 반드시 같은 폴더에 있어야 합니다.)
2. 화면에 **파란 고리가 빙글빙글 도는** 기본 스피너와, 그 아래 **점 세 개가 통통 튀는** 스피너가 보이는지 확인합니다.
3. **스피너 모양의 정체 보기**: `style.css`에서 `.spinner` 규칙을 찾습니다. 동그란 고리는 사실 `border`(테두리) 전체를 옅은 회색으로 칠하고, `border-top-color`로 **윗부분 한 곳만 파란색**으로 바꾼 것입니다. 여기에 `border-radius: 50%`가 네모를 동그랗게 만들어 줍니다. 시험 삼아 `border-radius: 50%;`를 잠깐 지우고 저장(Ctrl+S)·새로고침(F5)하면, 회전하는 것이 사실은 네모였다는 게 보입니다. (확인 후 다시 되돌리세요.)
4. **움직임의 설계도 보기**: `@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }` 부분을 봅니다. `from`(시작)은 0도, `to`(끝)는 360도 → 한 바퀴 도는 움직임이라는 "설계도"입니다.
5. **설계도를 요소에 입히기**: `.spinner`의 `animation: spin 1s linear infinite;` 줄을 봅니다. 왼쪽부터 차례로 `spin`(위에서 만든 설계도 이름) / `1s`(한 바퀴에 1초) / `linear`(일정한 속도) / `infinite`(무한 반복)를 뜻합니다.
6. **속도 바꿔 보기**: `1s`를 `0.4s`로 바꿔 저장·새로고침하면 더 **빨리** 돕니다. `3s`로 바꾸면 **천천히** 돕니다. 숫자가 작을수록 빠릅니다.
7. **방향 바꿔 보기**: `@keyframes spin`의 `to`에 적힌 `rotate(360deg)`를 `rotate(-360deg)`로 바꾸면 **반대 방향**으로 돕니다.
8. **색 바꿔 보기**: `.spinner`의 `border-top-color: #4f7cff;`에서 색 코드를 본인이 원하는 색(예: `#ff5a5f`)으로 바꿔 봅니다.
9. **(응용) 점 스피너 살펴보기**: `.dot`은 `bounce`라는 다른 `@keyframes`로 위아래로 튀고, `.dot:nth-child(2)`와 `:nth-child(3)`에 `animation-delay`(시작 늦추기)를 줘서 점들이 **차례로** 튀게 만들었습니다. `0.15s`·`0.3s` 숫자를 바꿔 보면 튀는 박자가 달라집니다.

## 🤖 바이브코딩 프롬프트

이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다. (코드를 직접 다 짜기보다, AI에게 시키고 결과가 옳은지 판별하는 연습이 핵심입니다.)

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 비전공자에게 친절히 설명하는 웹 프론트엔드 강사야.
  이미지나 JavaScript 없이 'CSS만으로' 무한히 회전하는 로딩 스피너를 만들어 줘.
  - 파일은 index.html 과 style.css 두 개로 분리해 줘.
  - 스피너는 <div class="spinner"></div> 하나로 만들고, 모양은 전부 CSS로 처리해 줘.
  - 모양 원리: border 전체를 옅은 회색으로 칠하고, border-top-color 한 곳만 진한 파란색으로,
    border-radius: 50% 로 동그랗게 만들어 줘.
  - 회전은 @keyframes 로 0deg → 360deg 를 정의하고, animation 으로 1초에 한 바퀴, 일정한 속도(linear), 무한 반복(infinite)으로 입혀 줘.
  - 화면 가운데에 흰 카드 안에 스피너가 놓이도록 간단히 꾸며 줘.
  결과 코드만 주지 말고, @keyframes 와 animation 한 줄의 각 값이 무슨 뜻인지 주석으로 한 줄씩 설명해 줘.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  방금 만든 스피너 예제에 아래를 추가해 줘. 기존 코드는 지우지 말고 이어서 더해 줘.
  1) 점 세 개가 '차례로' 통통 튀는 두 번째 스피너(.dots > .dot 세 개).
     bounce 라는 @keyframes 로 위로 살짝 점프시키고, 두 번째·세 번째 점은 animation-delay 로 시작을 늦춰서 차례로 튀게 해 줘.
  2) 접근성 배려: prefers-reduced-motion(움직임 줄이기)을 켠 사용자에게는 애니메이션을 아주 느리게 만들어 줘.
  3) 스피너에 role="status" 와 aria-label 을 넣어 화면낭독기 사용자도 '불러오는 중'임을 알 수 있게 해 줘.
  왜 그렇게 했는지(특히 animation-delay 와 접근성 부분)를 주석으로 설명해 줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  CSS 스피너를 만들었는데 회전이 안 돼. 아래 증상 중 하나야. 원인 후보를 단계별로 짚어 주고, 어디를 어떻게 고치면 되는지 알려 줘.
  - 증상 A: 고리는 보이는데 전혀 안 돈다.
  - 증상 B: 동그라미가 아니라 네모가 돈다.
  - 증상 C: 한 바퀴 돌고 멈춰 버린다.
  내 style.css 의 .spinner 규칙과 @keyframes spin 부분을 아래에 붙여넣을게:
  (여기에 코드 붙여넣기)
  비전공자가 이해하게 한 줄씩 풀어서 설명해 줘.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 훨씬 좋습니다.

## 검증법

- 파란 고리가 **새로고침해도 멈추지 않고 계속** 돌면 `infinite`(무한 반복)가 제대로 적용된 것입니다.
- 고리가 **순간이동하지 않고 매끄럽게** 한 방향으로 돌면 `@keyframes`와 `animation`이 잘 연결된 것입니다.
- `1s`를 더 작은 숫자로 바꿨을 때 회전이 빨라지면, `animation`의 시간 값을 정확히 이해한 것입니다.
- 점 세 개가 **동시에가 아니라 차례로** 튀면 `animation-delay`가 잘 작동하는 것입니다.
- F12(개발자 도구)의 **콘솔(Console)** 탭에 빨간 오류 메시지가 없으면 코드가 깨진 곳 없이 잘 작동하는 것입니다.

## 관련 가이드 링크

- [MDN: `@keyframes` (움직임 설계도 만들기)](https://developer.mozilla.org/ko/docs/Web/CSS/@keyframes)
- [MDN: `animation` (설계도를 요소에 입히기)](https://developer.mozilla.org/ko/docs/Web/CSS/animation)
- [MDN: `animation-delay` (시작 늦추기)](https://developer.mozilla.org/ko/docs/Web/CSS/animation-delay)
- [MDN: `transform`의 `rotate()` (회전)](https://developer.mozilla.org/ko/docs/Web/CSS/transform-function/rotate)
- [MDN: `border-radius` (모서리 둥글게 / 원 만들기)](https://developer.mozilla.org/ko/docs/Web/CSS/border-radius)
- 이전 단계 복습: 028(border·border-radius), 049(transition·transform 호버 효과) / 다음 단계: 051(스크롤 등장 애니메이션)
