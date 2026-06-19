# 스크롤 내리면 아래에서 위로 나타나는 등장 애니메이션

요즘 잘 만든 웹사이트를 보면, 스크롤을 내릴 때 글과 사진이 **아래에서 위로 스르륵 떠오르며** 나타납니다. 처음부터 다 보여 주지 않고 "보이는 순간"에 맞춰 등장시키면, 페이지가 살아 있는 것처럼 느껴지고 사용자의 시선을 자연스럽게 이끌 수 있습니다. 이 효과를 보통 **스크롤 리빌(scroll reveal)**이라고 부릅니다.

예전에는 스크롤할 때마다 "지금 화면 위치가 몇 px인지"를 계산해야 해서 코드가 복잡하고 느렸습니다. 하지만 지금은 브라우저에 내장된 **IntersectionObserver(인터섹션 옵서버)**라는 감시자에게 "이 요소가 화면에 보이면 알려 줘"라고 부탁하면 됩니다. 우리는 신호를 받아 **CSS 클래스 하나만 붙였다 떼면** 끝이고, 부드러운 움직임은 `transition`이 알아서 처리합니다.

이 예제는 세 가지 기술의 협업입니다. **CSS**가 "숨김 모양"과 "등장 모양"을 정의하고, **IntersectionObserver(JS)**가 "지금이 등장할 때다"라고 알려 주며, **transition**이 그 사이를 부드럽게 이어 줍니다.

## 목표

- `IntersectionObserver`로 "요소가 화면 안에 들어왔는지"를 직접 계산 없이 감지한다.
- 평소에는 `opacity: 0` + `transform: translateY(40px)`로 살짝 아래에 투명하게 숨겨 둔다.
- 화면에 들어오면 JS가 `is-visible` 클래스를 붙이고, `transition`이 0.6초 동안 부드럽게 제자리로 올려 준다.
- `data-reveal="left" / "right"` 속성으로 등장 방향(왼쪽·오른쪽)을 바꾸는 응용을 익힌다.
- `threshold`(얼마나 보여야 등장할지)와 `rootMargin`(등장 타이밍 조정)의 역할을 이해한다.
- `prefers-reduced-motion`으로 움직임에 민감한 사용자를 배려하는 표준 방법을 안다.

## 따라하는 단계

1. `051` 폴더 안의 `index.html`을 마우스로 더블클릭해 브라우저(크롬 등)로 엽니다. 같은 폴더의 `style.css`와 `script.js`가 자동으로 함께 불러와집니다. (세 파일은 반드시 같은 폴더에 있어야 합니다.)
2. 처음에는 파란 안내 화면과 큰 아래 화살표(↓)가 보입니다. 이제 **마우스 휠로 천천히 아래로 스크롤**해 보세요. 카드들이 하나씩 화면에 들어올 때마다 아래에서 위로 떠오르며 나타나면 성공입니다.
3. **"숨김 모양" 보기**: `style.css`에서 `.reveal` 규칙을 찾습니다. `opacity: 0`(완전 투명) + `transform: translateY(40px)`(40px 아래로 내려가 있음)가 카드의 **평소 숨은 상태**입니다.
4. **"등장 모양" 보기**: 바로 아래 `.reveal.is-visible` 규칙을 봅니다. `opacity: 1`(또렷함) + `transform: translateY(0)`(제자리)로 바뀝니다. JS가 `is-visible` 클래스를 붙이는 순간 이 모양으로 변합니다.
5. **부드러움의 비밀**: `.reveal`의 `transition: opacity 0.6s ease, transform 0.6s ease;` 줄을 봅니다. "투명도와 위치가 바뀌면 0.6초에 걸쳐 천천히 변해라"는 약속입니다. 이 줄이 없으면 카드가 순간이동하듯 툭 나타납니다. 시험 삼아 `0.6s`를 `2s`로 바꿔 저장(Ctrl+S)·새로고침(F5)하면 아주 느릿하게 떠오릅니다. (확인 후 되돌리세요.)
6. **감시자 살펴보기**: `script.js`에서 `new IntersectionObserver(...)` 부분을 봅니다. `entry.isIntersecting`이 `true`면(화면 안에 들어옴) `classList.add("is-visible")`로 등장시키고, 화면 밖으로 나가면 `remove`로 다시 숨깁니다.
7. **등장 타이밍 조절**: `script.js`의 `threshold: 0.15`를 `0.6`으로 바꿔 봅니다. 이제 카드가 **60% 이상 보여야** 등장하므로, 더 화면 가운데로 와야 나타납니다.
8. **방향 바꿔 보기**: `index.html`에서 05·06번 카드에 붙은 `data-reveal="left"` / `data-reveal="right"`를 봅니다. `style.css`의 `.reveal[data-reveal="left"]`가 시작 위치를 옆으로 바꿔, 옆에서 미끄러져 들어오게 만듭니다. 다른 카드에도 `data-reveal="left"`를 붙여 보세요.
9. **반복 끄기**: `script.js` 맨 위의 `const REPEAT = true;`를 `false`로 바꿔 저장·새로고침합니다. 이제 한 번 등장한 카드는 위로 다시 올라갔다 내려와도 사라지지 않고 계속 보입니다.

## 🤖 바이브코딩 프롬프트

이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다. 한 번에 다 시키지 말고 **단계별**로 시키면, 중간에 결과를 확인하며 고칠 수 있어 훨씬 안전합니다.

- **1단계(뼈대 만들기)** 프롬프트:

  ```text
  너는 웹 프론트엔드 강사야. HTML/CSS/JS로 "스크롤 리빌(scroll reveal)" 데모 한 페이지를 만들어 줘.
  요구사항:
  - 파일은 index.html, style.css, script.js 세 개로 분리(외부 링크/번들러 없이 그냥 더블클릭으로 열리게).
  - 맨 위에 화면을 꽉 채우는(min-height:100vh) 안내 화면 hero를 두고, 아래로 스크롤하면 카드 6~7개가 차례로 나오게.
  - 카드는 평소엔 opacity:0 + translateY(40px)로 살짝 아래에 투명하게 숨겨 두고,
    화면에 들어오면 IntersectionObserver로 is-visible 클래스를 붙여 제자리로 떠오르게.
  - 부드러운 움직임은 CSS transition(0.6s)으로 처리. setInterval이나 scroll 이벤트로 px 계산하지 말 것(IntersectionObserver만 사용).
  비전공자가 읽을 거라서, 코드만 주지 말고 왜 그렇게 했는지 한국어 주석으로 한 줄씩 설명해 줘.
  ```

- **2단계(기능 추가/개선)** 프롬프트:

  ```text
  방금 만든 스크롤 리빌에 다음을 추가해 줘. 기존 코드는 최대한 유지하고 바뀐 부분만 알려 줘.
  1) data-reveal="left" / "right" 속성을 붙인 카드는 위가 아니라 옆에서 미끄러져 들어오게(translateX 활용).
  2) script.js 맨 위에 const REPEAT 스위치를 둬서, true면 화면 밖으로 나갔다 들어올 때마다 다시 등장,
     false면 한 번 등장 후 unobserve로 감시를 끊어 계속 보이게.
  3) IntersectionObserver의 threshold와 rootMargin이 등장 타이밍에 어떤 영향을 주는지 주석으로 설명.
  4) prefers-reduced-motion: reduce 미디어쿼리로, 움직임에 민감한 사용자에겐 애니메이션 없이 바로 보여 주기.
  각 옵션 값이 무슨 뜻이고 왜 그 값을 골랐는지 한국어 주석으로 풀어 줘.
  ```

- **막혔을 때(디버깅)** 프롬프트:

  ```text
  스크롤을 내려도 카드가 등장하지 않고 계속 투명한 채로 있어(또는 처음부터 다 보여).
  내 index.html / style.css / script.js를 그대로 붙여넣을게. 아래를 순서대로 점검해서 원인을 짚어 줘.
  - script 태그가 </body> 직전에 있는지, 파일 경로(href/src)가 맞는지
  - .reveal와 .reveal.is-visible의 opacity/transform 값이 서로 반대로 설정됐는지
  - IntersectionObserver가 observe()로 실제 요소들을 감시 목록에 등록했는지
  - F12 콘솔의 빨간 오류 메시지(있으면 그대로 붙여넣을게)
  원인을 한 가지로 단정하지 말고, 가능성 높은 순서로 후보를 나열하고 각각 확인 방법을 알려 줘.
  ```

> 프롬프트 팁: 끝에 "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 결과 코드가 학습용으로 훨씬 좋아집니다.

## 검증법

- 스크롤을 내릴 때 카드가 **처음엔 안 보이다가, 화면에 들어오는 순간** 아래에서 위로 떠오르면 성공입니다.
- 카드가 **순간이동하듯 툭** 뜨지 않고 **부드럽게** 떠오르면 `transition`이 잘 작동하는 것입니다.
- 05·06번 카드가 위가 아니라 **옆에서** 들어오면 `data-reveal` 속성과 CSS 연결이 잘 된 것입니다.
- `REPEAT`를 `true`로 둔 상태에서 위로 올렸다 다시 내리면 카드가 **한 번 더 등장**하면 반복 로직이 정상입니다.
- F12(개발자 도구)의 **콘솔(Console)** 탭에 빨간 오류 메시지가 없으면 코드가 깨진 곳 없이 잘 작동하는 것입니다.
- (참고) OS의 "동작 줄이기/모션 줄이기" 설정을 켜면 애니메이션 없이 카드가 처음부터 보입니다. 이는 `prefers-reduced-motion` 배려가 작동하는 것이라 정상입니다.

## 관련 가이드 링크

- [MDN: IntersectionObserver (요소가 화면에 보이는지 감지)](https://developer.mozilla.org/ko/docs/Web/API/Intersection_Observer_API)
- [MDN: `transition` (값이 바뀔 때 부드럽게 잇기)](https://developer.mozilla.org/ko/docs/Web/CSS/transition)
- [MDN: `transform`의 `translateY()` (위아래로 이동)](https://developer.mozilla.org/ko/docs/Web/CSS/transform-function/translateY)
- [MDN: `opacity` (투명도)](https://developer.mozilla.org/ko/docs/Web/CSS/opacity)
- [MDN: `classList` (클래스 붙이고 떼기)](https://developer.mozilla.org/ko/docs/Web/API/Element/classList)
- [MDN: `prefers-reduced-motion` (움직임 줄이기 배려)](https://developer.mozilla.org/ko/docs/Web/CSS/@media/prefers-reduced-motion)
- 이전 단계 복습: 049(:hover·transition·transform), 050(@keyframes 애니메이션) / 다음 단계: 052(다크모드 토글), 079(IntersectionObserver 페이드인 응용)
