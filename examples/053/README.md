# 새로고침해도 유지되고 OS 설정 따르는 다크모드

앞 실습(052)에서 만든 다크모드 토글은 멋지지만, 새로고침하면 다시 밝은 화면으로
돌아가는 아쉬움이 있었습니다. 이번에는 두 가지를 더해 **실전 수준의 다크모드**를
완성합니다.

- **localStorage**: 사용자가 고른 테마를 브라우저에 저장해, 새로고침하거나
  나중에 다시 방문해도 그대로 유지합니다.
- **prefers-color-scheme**: 사용자가 한 번도 고른 적이 없으면, 컴퓨터·스마트폰의
  운영체제(OS) 다크모드 설정을 그대로 따릅니다.

## 목표

- `localStorage.setItem` / `getItem` 으로 사용자의 테마 선택을 저장하고 불러온다.
- `window.matchMedia("(prefers-color-scheme: dark)")` 로 OS의 다크모드 설정을 읽는다.
- "저장된 선택 → OS 설정 → 기본값(light)" 순서로 처음 테마를 결정하는 우선순위를 이해한다.
- 첫 화면이 흰색으로 번쩍였다가 어두워지는 **깜빡임(FOUC)** 을, `<head>` 안 스크립트로 막는 방법을 익힌다.

## 따라하는 단계

1. **폴더 열기**: `examples/053` 폴더에 `index.html`, `style.css`, `script.js` 세 파일이 있습니다.
2. **head 스크립트 보기**: `index.html`의 `<head>` 안에 작은 `<script>`가 있습니다. 이 스크립트가 화면이 그려지기 *전에* 가장 먼저 실행되어 테마를 정합니다. `<html>` 태그에 `data-theme`를 일부러 비워 둔 이유도, 이 스크립트가 직접 채워 넣기 때문입니다.
3. **우선순위 확인**: head 스크립트는 `localStorage.getItem("theme")`(저장된 선택)을 먼저 보고, 없으면 `prefers-color-scheme`(OS 설정)을, 그래도 없으면 `light`를 고릅니다.
4. **CSS 변수 보기**: `style.css`의 `:root`에 라이트 색, `[data-theme="dark"]`에 다크 색이 정의되어 있습니다(052와 동일). 색은 모두 `var(--bg)`처럼 변수로만 사용합니다.
5. **저장 로직 보기**: `script.js`의 `applyTheme()` 함수가 핵심입니다. 테마를 바꿀 때 ① `<html>`의 `data-theme` 변경 ② `localStorage`에 저장 ③ 버튼 표시 갱신을 한 번에 합니다.
6. **버튼 동작 보기**: 버튼을 클릭하면 현재 테마를 반대로 뒤집어 `applyTheme()`로 적용·저장합니다.
7. **OS 실시간 반영(보너스) 보기**: `script.js` 맨 아래에서, 사용자가 *직접 고른 적이 없을 때만* OS 설정이 바뀌면 화면도 함께 바뀌도록 처리합니다. 이미 버튼으로 고른 사람의 선택은 존중해 건드리지 않습니다.
8. **실행**: `index.html`을 더블 클릭해 브라우저로 엽니다. 오른쪽 위 버튼으로 테마를 바꾼 뒤 **F5(새로고침)** 해서 선택이 유지되는지 확인합니다.

## 검증법

- 버튼으로 다크모드를 켠 뒤 **새로고침(F5)** 해도 어두운 화면이 그대로 유지된다. (라이트도 마찬가지)
- 브라우저 개발자 도구(F12) → Application(또는 저장소) 탭 → Local Storage 에 `theme` 항목이 있고 값이 `light` 또는 `dark`로 저장되어 있다.
- **OS 설정 따르기 확인**: 개발자 도구 → Application → Local Storage 에서 `theme` 항목을 **삭제**한 뒤, 운영체제(또는 개발자 도구의 "Rendering > Emulate CSS prefers-color-scheme") 설정을 다크로 바꾸고 새로고침하면, 페이지가 처음부터 어둡게 열린다.
- 첫 화면이 흰색으로 번쩍였다가 어두워지는 깜빡임이 **없다**. (테마가 `<head>` 단계에서 미리 적용되기 때문)
- 색 전환이 뚝 끊기지 않고 약 0.3초 동안 부드럽게 바뀐다(`transition` 효과).

### 052와 무엇이 달라졌나

| 구분 | 052 (토글) | 053 (이번 실습) |
| --- | --- | --- |
| 테마 전환 | O | O |
| 새로고침 후 유지 | X (항상 light로 초기화) | O (localStorage 저장) |
| OS 설정 따르기 | X | O (prefers-color-scheme) |
| 첫 화면 깜빡임 방지 | 해당 없음 | O (head 스크립트) |

## 관련 가이드 링크

- [MDN - `localStorage`로 값 저장하기](https://developer.mozilla.org/ko/docs/Web/API/Window/localStorage)
- [MDN - `prefers-color-scheme` 미디어 기능](https://developer.mozilla.org/ko/docs/Web/CSS/@media/prefers-color-scheme)
- [MDN - `window.matchMedia()`로 미디어쿼리 결과 읽기](https://developer.mozilla.org/ko/docs/Web/API/Window/matchMedia)
- [MDN - CSS 사용자 정의 속성(변수) `var()`](https://developer.mozilla.org/ko/docs/Web/CSS/Using_CSS_custom_properties)
