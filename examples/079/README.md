# 스크롤하면 요소가 스르륵 등장하기 (페이드인)

페이지를 아래로 스크롤할 때, 화면 안으로 들어온 카드만 서서히(페이드인) 나타나게 만듭니다. 랜딩 페이지나 소개 페이지에서 흔히 보는 "스크롤하면 콘텐츠가 부드럽게 등장하는" 효과입니다. 핵심 도구는 `IntersectionObserver`로, "이 요소가 지금 화면에 보이는지"를 브라우저가 대신 감지해 줍니다.

## 목표

- 화면(뷰포트)에 들어온 카드만 골라서 애니메이션으로 나타나게 한다.
- `IntersectionObserver`로 "요소가 보이기 시작했는지"를 감지하는 법을 익힌다.
- 움직임(부드러운 전환)은 CSS의 `transition`이 맡고, 자바스크립트는 클래스를 붙이기만 하는 역할 분담을 이해한다.
  - 처음 상태: `.reveal` (투명 + 살짝 아래)
  - 보이는 상태: `.reveal.visible` (또렷 + 제자리)

## 따라하는 단계

1. 한 폴더(`079`) 안에 `index.html`, `style.css`, `script.js` 세 파일을 둡니다. 이미 이 폴더에 만들어져 있습니다.
2. `index.html`을 더블클릭하거나 브라우저로 엽니다. (또는 VS Code의 Live Server 확장으로 열어도 됩니다.)
3. 첫 화면(파란 히어로 영역)에서는 아직 카드가 보이지 않습니다. 마우스 휠이나 트랙패드로 천천히 아래로 스크롤합니다.
4. 화면 안으로 들어온 카드부터 하나씩 아래에서 위로 스르륵, 투명에서 또렷하게 나타나는지 확인합니다.
5. `script.js`를 열어 핵심 흐름을 읽어 봅니다.
   - `document.querySelectorAll(".reveal")`: 나타나게 할 카드들을 전부 고릅니다.
   - `new IntersectionObserver(...)`: 화면에 보이는지 감시할 "감시자"를 만듭니다.
   - `entry.isIntersecting`: 이 값이 `true`면 "지금 화면에 보인다"는 뜻입니다.
   - `entry.target.classList.add("visible")`: 보이는 순간 `visible` 클래스를 붙여 CSS가 나타나게 합니다.
   - `observer.unobserve(entry.target)`: 한 번 나타난 카드는 감시를 멈춰 깜빡임을 막습니다.
6. `style.css`에서 `.reveal`과 `.reveal.visible` 두 규칙을 비교해 봅니다. `opacity`(투명도)와 `transform: translateY(...)`(위치)가 어떻게 달라지는지 보세요. 그 사이를 잇는 `transition`이 부드러운 움직임의 정체입니다.
7. 직접 바꿔 봅니다.
   - `style.css`의 `.reveal`에서 `translateY(24px)`를 `translateY(60px)`로 키우면 더 멀리서 올라옵니다. `translateX(-40px)`로 바꾸면 왼쪽에서 들어옵니다.
   - `transition`의 `0.6s`를 `1.2s`로 바꾸면 더 느리게 나타납니다.
   - `script.js`의 `threshold: 0.1`을 `0.5`로 바꾸면 카드가 절반쯤 보여야 나타납니다.

## 검증법

- 처음 페이지를 열면 파란 첫 화면만 보이고, 아래 카드들은 보이지 않습니다.
- 스크롤을 내리면 화면에 들어온 카드만 아래에서 위로 부드럽게 떠오르며 또렷해집니다(한꺼번에 다 나타나지 않습니다).
- 끝까지 내린 뒤 다시 위로 올렸다가 내려도, 이미 나타난 카드는 깜빡이거나 다시 사라지지 않습니다(`unobserve` 덕분).
- 브라우저 개발자 도구(F12) → Elements 탭에서 카드 하나를 보면, 화면에 들어오는 순간 `class="card reveal"`에 `visible`이 추가되어 `class="card reveal visible"`로 바뀌는 것을 볼 수 있습니다.
- (선택) OS 설정에서 "동작 줄이기 / 애니메이션 줄이기"를 켜면, 애니메이션 없이 카드가 처음부터 보입니다. (`prefers-reduced-motion` 처리)

## 관련 가이드 링크

- MDN - IntersectionObserver: https://developer.mozilla.org/ko/docs/Web/API/IntersectionObserver
- MDN - IntersectionObserver 사용법(타이밍): https://developer.mozilla.org/ko/docs/Web/API/Intersection_Observer_API
- MDN - Element.classList: https://developer.mozilla.org/ko/docs/Web/API/Element/classList
- MDN - CSS transition: https://developer.mozilla.org/ko/docs/Web/CSS/transition
- MDN - prefers-reduced-motion: https://developer.mozilla.org/ko/docs/Web/CSS/@media/prefers-reduced-motion
