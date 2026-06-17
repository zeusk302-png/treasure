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
