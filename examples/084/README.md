# 다크모드 설정을 localStorage로 기억하기

버튼으로 라이트/다크 테마를 바꾸는 것까지는 052번 예제에서 만들었습니다.
하지만 그 페이지는 **새로고침하면 다시 라이트로 돌아가는** 아쉬움이 있었죠.

이번 예제에서는 사용자가 고른 테마를 **localStorage** 라는 브라우저 저장 공간에
적어 두고, 페이지가 다시 열릴 때 그 값을 꺼내 와 똑같은 테마로 되돌려 놓습니다.
그래서 새로고침하거나, 브라우저를 껐다 켜고 다시 방문해도 선택이 그대로 유지됩니다.

## 목표

- `localStorage.setItem("theme", "dark")` 로 사용자의 선택을 브라우저에 **저장**한다.
- `localStorage.getItem("theme")` 로 저장해 둔 값을 다시 **꺼내** 온다.
- 페이지가 처음 열릴 때 저장된 값으로 **초기 상태를 복원**하는 흐름을 이해한다.
- 저장(setItem)과 화면 적용(setAttribute)을 한 함수로 묶어 "바꿀 때마다 항상 같이 저장"되게 만든다.

## 따라하는 단계

1. **폴더 열기**: `examples/084` 폴더에 `index.html`, `style.css`, `script.js` 세 파일이 있습니다.
2. **저장소 이름 정하기**: `script.js` 위쪽의 `const STORAGE_KEY = "theme";` 를 봅니다. localStorage 는 "이름표 = 값" 형태로 저장하는데, 여기서 이름표를 `"theme"` 로 정했습니다.
3. **저장하기**: `applyTheme()` 함수 안의 `localStorage.setItem(STORAGE_KEY, theme)` 가 핵심입니다. 테마를 바꿀 때마다 선택값(`"light"` 또는 `"dark"`)을 이 한 줄로 저장합니다.
4. **클릭 동작 보기**: 버튼을 누르면 현재 테마를 읽어 반대로 뒤집은 뒤 `applyTheme(next)` 를 호출합니다. 이 한 번의 호출이 (1) 화면 색 교체, (2) 버튼 표시 갱신, (3) localStorage 저장을 모두 처리합니다.
5. **복원하기**: `script.js` 맨 아래 `const savedTheme = localStorage.getItem(STORAGE_KEY) || "light";` 를 봅니다. 저장된 값이 있으면 그 값을, 없으면(첫 방문) `"light"` 를 사용해 `applyTheme()` 로 초기 상태를 맞춥니다.
6. **깜빡임 방지 코드 보기**: `index.html` 의 `<head>` 안 작은 `<script>` 는 화면이 그려지기 직전에 저장된 테마를 미리 적용합니다. 덕분에 다크 테마인데 화면이 잠깐 하얗게 번쩍이는 현상이 사라집니다.
7. **실행**: `index.html` 을 더블 클릭해 브라우저로 엽니다. 오른쪽 위 버튼으로 테마를 바꾼 뒤 **새로고침(F5)** 해서 선택이 유지되는지 확인합니다.

## 🤖 바이브코딩 프롬프트

이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 프론트엔드 강사야. 비전공자가 이해할 수 있는 아주 단순한 다크모드 토글 페이지를
  index.html / style.css / script.js 세 파일로 만들어 줘.
  요구사항:
  - 상단 바에 제목과 "다크모드/라이트모드" 전환 버튼이 있다.
  - 색은 직접 박지 말고 CSS 변수(:root 와 [data-theme="dark"])로 라이트·다크 두 벌을 정의한다.
  - 버튼을 누르면 <html> 의 data-theme 속성을 "light" <-> "dark" 로 바꿔서 색이 한 번에 전환되게 한다.
  외부 라이브러리 없이 순수 HTML/CSS/JS만 쓰고, 각 줄이 왜 필요한지 한국어 주석으로 설명해 줘.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  지금 만든 다크모드 페이지는 새로고침하면 라이트로 돌아가. 선택한 테마를 기억하게 해 줘.
  - 테마를 바꿀 때마다 localStorage.setItem("theme", 값) 으로 저장한다.
  - 페이지가 처음 열릴 때 localStorage.getItem("theme") 으로 값을 꺼내 복원하되, 없으면 "light" 를 쓴다.
  - 다크 테마로 새로고침할 때 화면이 잠깐 하얗게 번쩍이는(FOUC) 현상을 막기 위해,
    <head> 안에 저장된 테마를 미리 적용하는 작은 인라인 스크립트도 넣어 줘.
  접근성을 위해 버튼의 aria-pressed 도 현재 상태에 맞게 갱신해 줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  새로고침하면 테마가 유지되지 않고 매번 라이트로 돌아가. (또는 콘솔 에러: <에러 메시지 붙여넣기>)
  내 script.js / index.html 코드를 줄게. 다음을 단계별로 점검해 줘:
  1) localStorage 에 "theme" 값이 실제로 저장되는지 (개발자도구 Application 탭 확인 방법 포함)
  2) 페이지 로드 시 저장된 값을 꺼내 applyTheme 로 복원하는 코드가 있는지
  3) <head> 의 깜빡임 방지 스크립트와 script.js 가 같은 키 이름("theme")을 쓰는지
  원인과 고친 코드를 알려주고, 왜 그렇게 고쳤는지 한 줄씩 풀어서 설명해 줘.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다.

## 검증법

- 다크모드를 켠 다음 **새로고침(F5)** 하면 라이트로 돌아가지 않고 다크가 그대로 유지된다.
- 브라우저 탭을 완전히 닫았다가 `index.html` 을 다시 열어도 마지막에 고른 테마로 시작한다.
- 개발자 도구(F12) → **Application(애플리케이션) 탭 → Local Storage** 에 `theme` 이름표가 보이고, 버튼을 누를 때마다 값이 `light` ↔ `dark` 로 바뀐다.
- 다크 테마 상태로 새로고침할 때 화면이 하얗게 깜빡이지 않고 바로 어둡게 뜬다(`<head>`의 깜빡임 방지 스크립트 효과).

### 참고: 더 발전시키기

이 예제는 사용자가 직접 고른 값만 기억합니다.
운영체제(OS)의 시스템 다크모드 설정을 기본으로 따르게 하려면
`prefers-color-scheme` 미디어 기능을 함께 쓰면 됩니다(id 053 예제에서 이어집니다).

## 관련 가이드 링크

- [MDN - localStorage 사용하기 (Web Storage API)](https://developer.mozilla.org/ko/docs/Web/API/Window/localStorage)
- [MDN - Storage.setItem()](https://developer.mozilla.org/ko/docs/Web/API/Storage/setItem)
- [MDN - Storage.getItem()](https://developer.mozilla.org/ko/docs/Web/API/Storage/getItem)
- [MDN - 데이터 속성(`data-*`)과 `setAttribute()`](https://developer.mozilla.org/ko/docs/Web/API/Element/setAttribute)
- [MDN - `prefers-color-scheme` (더 발전시키기용)](https://developer.mozilla.org/ko/docs/Web/CSS/@media/prefers-color-scheme)
