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
