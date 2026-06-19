# 버튼 하나로 켜고 끄는 다크모드 토글 만들기

밝은 화면(라이트)과 어두운 화면(다크)을 버튼 한 번으로 번갈아 바꾸는 페이지를 만듭니다.
색을 코드 곳곳에 직접 적지 않고 **CSS 변수**에 한 번만 정의한 뒤, `<html>` 태그의
**data-theme** 값만 JavaScript로 바꿔 테마 전체를 한 번에 교체하는 구조를 익힙니다.

## 목표

- 색을 CSS 변수(`--bg`, `--text` 같은 이름)로 한 곳에 모아 정의한다.
- 라이트 테마와 다크 테마, 두 벌의 색 세트를 만든다.
- `<html data-theme="dark">` 처럼 속성 값만 바꾸면 페이지 전체 색이 한 번에 바뀌는 원리를 이해한다.
- 버튼 클릭으로 두 테마를 번갈아 전환하는 JavaScript를 작성한다.

## 따라하는 단계

1. **폴더 열기**: `examples/052` 폴더에 `index.html`, `style.css`, `script.js` 세 파일이 있습니다.
2. **HTML 확인**: `index.html`의 맨 위 `<html lang="ko" data-theme="light">`를 봅니다. 여기 `data-theme`가 테마를 결정하는 스위치입니다. 처음에는 `light`로 시작합니다.
3. **버튼 확인**: 상단 바의 `<button id="themeToggle">`가 테마를 바꾸는 버튼입니다. JS가 이 id로 버튼을 찾아냅니다.
4. **CSS 변수 보기**: `style.css`의 `:root { ... }` 안에 라이트 테마 색이, `[data-theme="dark"] { ... }` 안에 다크 테마 색이 정의되어 있습니다. 같은 이름(`--bg` 등)의 값만 다릅니다.
5. **변수 사용 확인**: `body`, `.card` 등에서 색을 `var(--bg)`처럼 변수로만 꺼내 씁니다. 그래서 변수 값만 바뀌어도 모든 요소가 따라 바뀝니다.
6. **JS 흐름 보기**: `script.js`는 버튼을 클릭하면 현재 `data-theme` 값을 읽고, `light`면 `dark`로, `dark`면 `light`로 뒤집어 `<html>`에 다시 설정합니다.
7. **실행**: `index.html`을 더블 클릭해 브라우저로 엽니다. 오른쪽 위 버튼을 눌러 화면 색이 밝게/어둡게 바뀌는지 확인합니다.

## 🤖 바이브코딩 프롬프트

이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다.

- **1단계(뼈대 만들기)** 프롬프트:

  ```text
  너는 프론트엔드 강사야. 비전공자가 따라할 다크모드 토글 페이지를 만들어줘.
  - 파일은 index.html, style.css, script.js 세 개로 분리해줘.
  - 색은 코드 곳곳에 직접 적지 말고, CSS 변수(--bg, --text, --card-bg, --border 같은 이름)로
    한 곳에 모아 정의해줘. 라이트용은 :root 에, 다크용은 [data-theme="dark"] 에 같은 이름으로 둬.
  - <html> 태그에 data-theme="light" 를 기본으로 넣고, 상단 바에 제목과 "다크모드" 토글 버튼,
    본문에 색이 바뀌는 걸 눈으로 볼 카드 2~3개를 만들어줘.
  - 아직 자바스크립트 동작은 넣지 말고, HTML 구조와 CSS 변수/스타일까지만 완성해줘.
  - 코드만 주지 말고 각 부분이 왜 필요한지 한국어 주석으로 한 줄씩 설명해줘.
  ```

- **2단계(기능 추가/개선)** 프롬프트:

  ```text
  이제 버튼 클릭으로 테마를 바꾸는 자바스크립트를 script.js 에 추가해줘.
  - 버튼을 누르면 <html> 의 data-theme 값을 light <-> dark 로 번갈아 바꿔줘.
  - 색이 뚝 끊기지 않고 0.3초쯤 부드럽게 바뀌도록 CSS transition 도 넣어줘.
  - 테마에 따라 버튼 아이콘과 글자를 "🌙 다크모드" / "☀️ 라이트모드" 로 바꿔주고,
    접근성을 위해 aria-pressed 값도 같이 갱신해줘.
  - 기존 HTML/CSS 구조는 바꾸지 말고 JS만 추가하는 방향으로 해줘.
  ```

- **막혔을 때(디버깅)** 프롬프트:

  ```text
  버튼을 눌러도 화면 색이 안 바뀌어. 아래 코드와 콘솔 에러를 붙여넣을게.
  (여기에 script.js 내용과 F12 콘솔에 빨간 글씨로 뜬 에러 메시지를 그대로 붙여넣기)
  무엇이 문제인지 한 단계씩 짚어서 알려줘.
  특히 getElementById 의 id가 HTML 버튼의 id와 정확히 같은지, CSS에서 색을 var(--bg)처럼
  변수로 꺼내 쓰고 있는지, [data-theme="dark"] 선택자 철자가 맞는지 순서대로 확인해줘.
  ```

> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다.

## 검증법

- 버튼을 누를 때마다 배경색·글자색·카드색이 밝은 테마 ↔ 어두운 테마로 번갈아 바뀐다.
- 버튼 안 아이콘과 글자가 라이트일 때 "🌙 다크모드", 다크일 때 "☀️ 라이트모드"로 바뀐다.
- 브라우저 개발자 도구(F12)의 요소 탭에서 `<html>` 태그의 `data-theme` 값이 클릭마다 `light`와 `dark`로 바뀌는지 본다.
- 색 전환이 뚝 끊기지 않고 약 0.3초 동안 부드럽게 바뀐다(`transition` 효과).

### 참고: 더 발전시키기

이 예제는 새로고침하면 다시 라이트 테마로 돌아갑니다. 선택한 테마를 기억해
새로고침해도 유지하고 OS 설정까지 따르게 하려면, 다음 실습(id 053: localStorage,
`prefers-color-scheme`)에서 이어서 배웁니다.

## 관련 가이드 링크

- [MDN - CSS 사용자 정의 속성(변수) `var()`](https://developer.mozilla.org/ko/docs/Web/CSS/Using_CSS_custom_properties)
- [MDN - 데이터 속성(`data-*`) 사용하기](https://developer.mozilla.org/ko/docs/Learn/HTML/Howto/Use_data_attributes)
- [MDN - `setAttribute()`로 속성 바꾸기](https://developer.mozilla.org/ko/docs/Web/API/Element/setAttribute)
- [MDN - `transition`으로 부드럽게 전환하기](https://developer.mozilla.org/ko/docs/Web/CSS/transition)
