# 숫자 카운트업 애니메이션 만들기

회사 소개 페이지나 랜딩페이지에서 "누적 가입자 1,280명", "만족도 98%" 같은 숫자가 화면에 나타나는 순간 0부터 빠르게 올라가는 효과를 본 적 있죠? 이번 실습에서는 통계 구역이 화면에 들어오는 그 순간, 숫자들이 0부터 목표 숫자까지 또르르 올라가는 효과를 직접 만듭니다. 별도 설치나 서버 없이 `index.html`을 더블클릭하면 바로 동작합니다.

## 목표

- `IntersectionObserver`로 **통계 구역이 화면에 보이는 순간**을 감지하는 법을 익힌다. (스크롤 위치를 직접 계산하지 않아도 됨)
- `requestAnimationFrame`으로 **매 프레임마다 값을 조금씩 올리는** 애니메이션을 만든다.
- **보간(interpolation)** 개념을 이해한다: "전체 시간 중 지금까지 흐른 비율"로 0과 목표 숫자 사이의 중간값을 구하는 것.
- 숫자를 화면에 보여줄 때 `toLocaleString()`으로 **1280 → "1,280"** 처럼 읽기 쉽게 표시한다.
- 같은 효과가 스크롤할 때마다 반복되지 않게 **딱 한 번만 실행**되도록 제어한다.

> 핵심 개념: `IntersectionObserver`(보이면 시작) + `requestAnimationFrame`(시간에 따라 값 올리기) + 보간

## 따라하는 단계

1. **세 개의 파일을 한 폴더에 둔다.** `index.html`, `style.css`, `script.js`를 같은 폴더(`080`)에 둡니다. HTML이 나머지 둘을 불러옵니다.
2. **목표 숫자를 HTML에 적어 둔다.** `index.html`의 각 숫자 칸은 `<span class="stat-num" data-target="1280" data-suffix="+">0`처럼 되어 있습니다. `data-target`이 "올라갈 목표 숫자", `data-suffix`가 "숫자 뒤에 붙일 글자(+, %, 개국 등)"입니다. 처음 화면에는 그냥 `0`이 보입니다.
3. **스크롤이 생기게 위/아래에 여백 구역을 둔다.** 통계 구역이 처음엔 화면 밖에 있어야, 스크롤로 "밖 → 안"으로 들어오는 순간을 만들 수 있습니다. 그래서 `.spacer` 구역을 위아래에 두었습니다.
4. **숫자 1개를 올리는 함수를 만든다.** `script.js`의 `animateCount(el, target, suffix)`가 한 칸을 0부터 목표까지 올립니다.
5. **시간 비율(progress)로 중간값을 구한다(보간).** `requestAnimationFrame`이 부르는 `step(now)` 안에서 `progress = 흐른시간 / 전체시간`(0~1)을 계산하고, `target * progress`로 그 순간 보여줄 숫자를 만듭니다. progress가 0.5면 목표의 절반, 1이면 목표값 자체입니다.
6. **끝나면 정확한 목표값으로 고정한다.** progress가 1에 도달하면 반올림 오차 없이 `target` 값을 그대로 넣어 마무리합니다.
7. **통계 구역이 보이는지 감시한다.** `IntersectionObserver`를 만들어 `observer.observe(statsSection)`로 통계 구역을 감시합니다. 구역의 40%(`threshold: 0.4`)가 화면에 들어오면 콜백이 실행됩니다.
8. **보이는 순간 딱 한 번 실행한다.** `entry.isIntersecting`이 `true`가 되면 `startAllCounts()`로 모든 숫자를 동시에 올리고, `hasAnimated` 플래그와 `observer.unobserve()`로 다시는 실행되지 않게 잠급니다.

## 🤖 바이브코딩 프롬프트

이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다. 한 단계씩 시키고, 나온 결과를 위 **검증법**으로 확인하세요.

- **1단계(뼈대 만들기)** 프롬프트:

  ```text
  너는 프런트엔드 멘토야. 설치나 서버 없이 index.html 더블클릭만으로 도는
  "숫자 카운트업 통계 섹션"을 만들어 줘. 파일은 index.html / style.css / script.js
  세 개로 분리해.

  요구사항:
  - 통계 4칸(예: 누적 가입자 1280+, 만족도 98%, 처리 작업 45000, 서비스 지역 12개국)을
    가로로 균등 배치한 파란색 카드 섹션.
  - 각 숫자 칸은 <span class="stat-num" data-target="목표숫자" data-suffix="뒤에붙일글자">0</span>
    구조로 만들어서, 목표 숫자와 접미사를 HTML 속성으로 바꿀 수 있게 해 줘.
  - 통계 섹션 위/아래에 스크롤을 만들기 위한 여백 구역(.spacer)을 둬.
  - 지금은 숫자가 모두 0으로 멈춰 있어도 돼. (애니메이션은 다음 단계)

  비전공자가 읽을 거니까 코드만 주지 말고, 왜 그렇게 했는지 한국어 주석으로 한 줄씩 설명해 줘.
  ```

- **2단계(기능 추가/개선)** 프롬프트:

  ```text
  이제 통계 섹션이 화면에 들어오는 순간 숫자가 0부터 목표값까지 올라가게 해 줘.

  - IntersectionObserver로 통계 섹션이 화면의 40%(threshold 0.4) 이상 보일 때 시작.
  - requestAnimationFrame으로 약 2초 동안 부드럽게 올라가게. (시간 비율로 보간)
  - 숫자는 toLocaleString()으로 1280 → "1,280"처럼 세 자리마다 쉼표.
  - data-suffix 값(+, %, 개국 등)을 숫자 뒤에 붙여서 표시.
  - 스크롤을 위로 올렸다 다시 내려도 애니메이션은 딱 한 번만 실행되게
    (플래그 + observer.unobserve 사용).

  왜 setInterval이 아니라 requestAnimationFrame을 쓰는지도 주석으로 설명해 줘.
  ```

- **막혔을 때(디버깅)** 프롬프트:

  ```text
  숫자 카운트업이 동작하지 않아. 아래 증상 중 내 상황을 진단해 줘.
  - 증상: (예) 스크롤해도 숫자가 0 그대로다 / 한 번이 아니라 매번 다시 올라간다 /
    최종값이 어중간하게 멈춘다 / 콘솔에 빨간 에러가 뜬다.
  - 콘솔(F12 → Console) 에러 메시지: (여기에 그대로 붙여넣기)

  내 script.js와 index.html을 함께 줄게. 의심되는 원인을 가능성 높은 순서로 알려주고,
  한 번에 하나씩 고쳐서 확인하는 방법을 단계별로 알려줘. (예: data-target 오타,
  observe 대상 id 불일치, threshold가 너무 높음 등)
  ```

> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 훨씬 좋습니다.

## 검증법

1. `index.html`을 더블클릭해 브라우저로 엽니다. (별도 서버 필요 없음)
2. **처음 상태**: 페이지 맨 위에서는 통계 숫자가 보이지 않거나, 보이더라도 모두 `0`이어야 합니다.
3. **시작 트리거**: 아래로 천천히 스크롤해 파란색 통계 구역이 화면에 들어오면, 네 개의 숫자가 **동시에 0부터 올라가기 시작**하는지 확인합니다.
4. **도착값 확인**: 올라간 뒤 최종 값이 `1,280+`, `98%`, `45,000`, `12개국`으로 정확히 멈추는지 봅니다. (쉼표가 세 자리마다 찍혀야 합니다.)
5. **한 번만 실행**: 통계 구역을 지나친 뒤 다시 위로 올렸다가 내려도, 숫자가 **다시 올라가지 않고** 최종값 그대로 있어야 합니다.
6. (선택) 개발자도구(F12) Console 탭에 빨간 오류가 없는지 봅니다.

## 직접 바꿔보기

- `script.js`의 `const DURATION = 2000;`을 `500`으로 줄이면 빠르게, `4000`으로 키우면 천천히 올라갑니다.
- `index.html`에서 `data-target`이나 `data-suffix` 값을 바꿔 보세요. (예: `data-target="50000" data-suffix="명"`)
- `script.js`의 `threshold: 0.4`를 `0.1`로 낮추면 통계 구역이 살짝만 걸쳐도 시작하고, `0.8`로 높이면 거의 다 보여야 시작합니다.
- 통계 칸을 늘리고 싶으면 `index.html`의 `.stat` 블록을 복사해 새 숫자를 추가하면 됩니다. 자바스크립트는 자동으로 모든 `.stat-num`을 찾아 올려 줍니다.

## 관련 가이드 링크

- 이전 실습: `../079/` 스크롤하면 요소가 스르륵 등장하기 — 같은 `IntersectionObserver`로 "보이는지"를 감지하는 짝꿍 실습입니다.
- 같은 카테고리(C · 자바스크립트 인터랙션) 다른 실습:
  - `../067/` 디지털 시계 — `setInterval`로 시간에 따라 값을 갱신하는 기초
  - `../077/` 맨 위로 가기 버튼 — `scroll` 이벤트로 스크롤 위치 다루기
  - `../081/` 스톱워치 — 경과 시간 계산과 타이머 시작/정지
- 커리큘럼: `../../docs/practice/curriculum.md` — 전체 실습 순서와 단계
- MDN 참고 문서:
  - [IntersectionObserver](https://developer.mozilla.org/ko/docs/Web/API/Intersection_Observer_API) — 요소가 화면에 보이는지 감지
  - [Window.requestAnimationFrame()](https://developer.mozilla.org/ko/docs/Web/API/Window/requestAnimationFrame) — 매 프레임마다 부드럽게 실행
  - [Number.prototype.toLocaleString()](https://developer.mozilla.org/ko/docs/Web/JavaScript/Reference/Global_Objects/Number/toLocaleString) — 1280 → "1,280" 쉼표 표시
  - [HTMLElement.dataset](https://developer.mozilla.org/ko/docs/Web/API/HTMLElement/dataset) — `data-*` 속성 값 읽기
