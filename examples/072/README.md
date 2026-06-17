# 072 · 토스트 알림 만들기 (3초 후 자동 사라짐)

"저장됨", "링크 복사 완료", "전송했어요"처럼 화면 모서리에 잠깐 떴다가 스스로 사라지는 작은 알림을 **토스트(toast)** 라고 합니다. 식빵이 토스터에서 톡 튀어나오는 모습 같다고 해서 붙은 이름이에요. 모달(071)과 달리 사용자가 일부러 닫지 않아도 됩니다. 이번 실습의 핵심은 **`setTimeout`** 입니다. "지금 당장"이 아니라 **"3초 뒤에 사라져라"** 라고 알람을 미리 맞춰 두는, 자바스크립트의 **시간차 동작**을 처음 경험합니다.

## 목표

- 버튼을 누르면 화면 오른쪽 아래에 알림이 **스르륵 떠오르고**, **3초 뒤에 스스로 사라지게** 만든다.
- 버튼을 빠르게 여러 번 눌러도 알림이 **여러 개 차곡차곡 쌓였다가** 각각 알아서 사라지게 한다.
- 핵심 개념: `setTimeout(할 일, 기다릴 시간)` 으로 미래의 동작을 예약하기, `createElement`로 알림 칸을 즉석에서 만들기, CSS `transition` + `.show` 클래스로 나타나고 사라지는 모션을 부드럽게 처리하기, 일이 끝난 칸을 `remove()`로 치워 화면을 깨끗이 유지하기.

## 따라하는 단계

1. 폴더 `072` 안에 `index.html`, `style.css`, `script.js` 세 파일이 있는지 확인합니다. (이미 준비되어 있습니다.)
2. `index.html`을 더블클릭해 브라우저로 엽니다. "저장하기"와 "링크 복사" 버튼이 있는 흰 카드가 보입니다.
3. **저장하기** 버튼을 눌러 봅니다. 화면 오른쪽 아래에 "저장됨" 알림이 떠오르고, 가만히 두면 **3초 뒤 스스로 사라집니다.**
4. 이번에는 두 버튼을 **빠르게 여러 번** 눌러 봅니다. 알림이 여러 칸으로 위아래로 쌓이고, 각각 자기가 뜬 시점부터 3초 뒤에 하나씩 사라지는 것을 확인합니다.
5. `script.js`를 위에서부터 읽어 봅니다. 가장 중요한 부분은 `showToast` 함수입니다.
   - `document.createElement("div")` — 알림 한 칸(`<div class="toast">`)을 그 자리에서 새로 만듭니다.
   - `toastBox.appendChild(toast)` — 만든 칸을 화면의 컨테이너 안에 집어넣습니다.
   - `requestAnimationFrame(...)` 안에서 `classList.add("show")` — 잠깐 뒤에 `show`를 붙여 CSS 모션이 작동하게 합니다. (바로 붙이면 모션이 안 보입니다.)
6. **이 실습의 심장**인 `setTimeout` 두 개를 봅니다.
   - 바깥쪽 `setTimeout(..., 3000)` — 만든 지 **3초(3000밀리초) 뒤에** `show`를 떼서 사라지는 모션을 시작시킵니다. 이 줄을 만나는 순간 사라지는 게 아니라, "3초 뒤에 해라"라고 **알람만 맞춰 두고** 코드는 곧장 다음으로 넘어갑니다.
   - 안쪽 `setTimeout(..., 250)` — 사라지는 모션(0.25초)이 끝난 뒤 `toast.remove()`로 빈 칸을 화면에서 완전히 치웁니다. (안 치우면 보이지 않는 빈 칸이 계속 쌓입니다.)
7. `style.css`에서 나타나고 사라지는 비밀을 봅니다.
   - `.toast { opacity: 0; transform: translateY(12px); }` — 처음엔 투명하고 살짝 아래에 있습니다.
   - `.toast.show { opacity: 1; transform: translateY(0); }` — `show`가 붙으면 또렷해지며 제자리로 올라옵니다.
   - `transition: opacity 0.25s ease, transform 0.25s ease;` — 이 한 줄이 위 두 상태 사이를 **스르륵** 이어 줍니다.
8. 직접 바꿔 보기: `script.js`에서 바깥쪽 `setTimeout`의 `3000`을 `1500`으로 바꿔 저장하고 새로고침하면 알림이 **1.5초** 만에 사라집니다. 또 `showToast("저장됨")`의 글자를 원하는 문구로 바꿔 나만의 알림을 만들어 보세요. CSS는 한 줄도 안 고쳐도 됩니다.

## 검증법

- "저장하기" 버튼을 누르면 오른쪽 아래에 알림이 **부드럽게 떠오르는지**, 그리고 **약 3초 뒤 스스로 사라지는지** 확인합니다. (손으로 닫을 필요가 없어야 합니다.)
- 버튼을 **연속으로 여러 번** 눌렀을 때 알림이 위아래로 **여러 칸 쌓이고**, 각각 뜬 시각으로부터 3초 뒤에 하나씩 차례로 사라지는지 확인합니다.
- 알림이 모두 사라진 뒤, 개발자 도구(F12)의 요소(Elements) 탭에서 `<div id="toastBox">` 안이 **다시 비어 있는지** 확인합니다. 빈 `<div class="toast">`가 남아 있다면 `remove()`가 동작하지 않은 것입니다.
- (시간차 확인) `setTimeout`의 `3000`을 큰 값(예: `8000`)으로 바꾸면 알림이 8초 동안 머무는지 확인해, 사라지는 시점이 이 숫자로 정해진다는 것을 눈으로 확인합니다.
- (보조기기 확인) 토스트 컨테이너에 `role="status"`와 `aria-live="polite"`가 있어, 화면을 못 보는 사용자에게도 새 알림 내용이 읽혀 전달됩니다.

## 관련 가이드 링크

- 이전: [071 · 모달 팝업 창 만들기](../071/) — 화면 위에 띄우고 X·배경·ESC로 닫는 팝업
- 다음: [073 · 이미지 갤러리 라이트박스 만들기](../073/) — 썸네일을 누르면 큰 이미지가 모달로 뜨고 좌우로 넘기기
- 묶음(C · 자바스크립트 인터랙션): [067 디지털 시계](../067/) — 같은 시간 도구 `setInterval`로 1초마다 갱신 · [082 할 일 목록 추가/삭제](../082/) — `createElement`로 항목을 만들고 `remove()`로 지우는 같은 패턴
- 참고 문서(MDN): [setTimeout()](https://developer.mozilla.org/ko/docs/Web/API/Window/setTimeout) · [Document.createElement()](https://developer.mozilla.org/ko/docs/Web/API/Document/createElement) · [Element.remove()](https://developer.mozilla.org/ko/docs/Web/API/Element/remove) · [classList](https://developer.mozilla.org/ko/docs/Web/API/Element/classList) · [CSS transition](https://developer.mozilla.org/ko/docs/Web/CSS/transition) · [ARIA: status 역할](https://developer.mozilla.org/ko/docs/Web/Accessibility/ARIA/Roles/status_role)
