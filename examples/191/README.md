# 키보드만으로 사이트 전체 돌아다니기 + focus 표시 살리기

마우스가 없거나 쓸 수 없는 사람도 많습니다. 손이 불편한 분, 시각장애로 화면을 못 보는 분,
혹은 그냥 키보드가 빠른 분까지요. 이런 사람들은 **`Tab` 키**로 링크·버튼·입력칸을 하나씩 옮겨 다닙니다.

이번 실습에서는 마우스를 손에서 놓고 **키보드만으로** 페이지 구석구석에 닿아 보고,
"지금 내가 어디에 있는지" 알려 주는 **파란(여기선 주황) 초점 외곽선**을 `:focus-visible`로 되살립니다.

## 목표

마우스 없이 `Tab`·`Enter`로 모든 링크·버튼·폼에 닿는지 점검하고, 흔히 지워져 있는
포커스 외곽선을 `:focus-visible`로 되살려 키보드 접근성을 확보합니다.

알아 둘 키보드 조작은 딱 이만큼입니다.

| 키 | 하는 일 |
| --- | --- |
| `Tab` | 다음 요소(링크·버튼·입력칸)로 포커스 이동 |
| `Shift` + `Tab` | 이전 요소로 되돌아가기 |
| `Enter` | 링크 이동 / 버튼 누르기 |
| `Space` | 버튼 누르기 / 체크박스 켜고 끄기 |

> 핵심 개념: 브라우저는 원래 포커스된 요소에 외곽선을 자동으로 그려 줍니다.
> 그런데 `*:focus { outline: none; }` 같은 코드로 이걸 지워 버린 사이트가 아주 많습니다.
> 그러면 키보드 사용자는 "지금 어디 있는지" 알 수 없어 길을 잃습니다. 우리는 반대로 되살립니다.

## 따라하는 단계

1. `191` 폴더 안에 `index.html`, `style.css`, `script.js` 세 파일을 둡니다.
2. `index.html`에 메뉴(`nav`)·본문(`main`)·푸터(`footer`)와 그 안의 **링크, 버튼, 입력 폼**을 만듭니다. 이것들이 키보드로 닿아야 할 대상입니다.
3. `index.html` 맨 위에 **건너뛰기 링크** `<a href="#main" class="skip-link">본문 바로가기</a>`를 둡니다. (평소엔 숨었다가 Tab으로 닿으면 나타납니다.)
4. `style.css`에서 **절대 하지 말 것**을 먼저 확인합니다: `outline: none`으로 포커스 표시를 지우지 않기.
5. 대신 `a:focus-visible`, `button:focus-visible`, `input:focus-visible`, `textarea:focus-visible`에 `outline: 3px solid ...`과 `outline-offset`을 주어 **또렷한 외곽선**을 입힙니다.
6. 건너뛰기 링크(`.skip-link`)는 `position: absolute; top: -48px;`로 화면 위에 숨기고, `.skip-link:focus { top: 12px; }`로 포커스될 때만 내려오게 합니다. (`display:none`으로 숨기면 키보드로도 못 닿으니 금지!)
7. `script.js`로 버튼과 폼이 실제로 동작하게 연결합니다. (Enter/Space로 눌리는지 체감하는 용도)
8. `index.html`을 더블클릭해 브라우저로 엽니다.
9. **마우스를 손에서 떼고**, 페이지 빈 곳을 한 번 클릭한 뒤 `Tab`을 반복해서 눌러 봅니다. 아래 점검표를 따라가세요.

### 키보드 순회 점검표

브라우저에서 `Tab`을 누르며 하나씩 체크해 보세요.

- [ ] 페이지를 열고 **처음 `Tab`**을 누르면 "본문 바로가기" 링크가 **화면에 나타난다.**
- [ ] 그 상태에서 `Enter`를 누르면 메뉴를 건너뛰고 본문(`#main`)으로 점프한다.
- [ ] 계속 `Tab`을 누르면 **메뉴 → 본문 링크 → 버튼 → 입력칸 → 보내기 버튼 → 푸터 링크** 순서로 빠짐없이 이동한다.
- [ ] 포커스가 옮겨갈 때마다 **주황색 외곽선**이 또렷하게 보여서, 지금 어디 있는지 항상 알 수 있다.
- [ ] 마우스를 안 쓰고도 버튼을 `Enter`/`Space`로 눌러 화면 안내 문구가 바뀐다.
- [ ] 입력칸에 글자를 적고 `Tab`으로 보내기 버튼까지 가서 `Enter`로 제출(안내 문구 출력)이 된다.
- [ ] `Shift` + `Tab`으로 거꾸로도 잘 돌아간다.
- [ ] **어느 요소에서도 포커스가 사라져 보이지 않는 구간이 없다.** (있다면 그게 바로 접근성 문제!)

## 🤖 바이브코딩 프롬프트

이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다. 한 번에 다 시키지 말고 단계별로 끊어서 시키면, 결과를 눈으로 확인하며 디렉터처럼 통제할 수 있습니다.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 웹 접근성을 잘 아는 프런트엔드 개발자야.
  키보드만으로 돌아다니는지 점검하는 한 페이지짜리 연습 사이트를 만들어 줘.
  파일은 index.html, style.css, script.js 세 개로 나누고, 외부 라이브러리 없이 순수 HTML/CSS/JS로만 해.

  index.html 요구사항:
  - 의미에 맞는 시맨틱 태그를 써라: header > nav, main, footer.
  - nav 안에 메뉴 링크 4개(홈/소개/서비스/문의).
  - main 안에 (1) 본문 링크 2개 (2) 버튼 2개 (3) 입력 폼(이름 text, 이메일 email, 메시지 textarea, 동의 checkbox, 보내기 submit 버튼)을 둬라.
  - 모든 input 에는 <label for="..."> 를 정확히 연결해라.
  - 페이지 맨 위에 '본문 바로가기' 건너뛰기 링크(<a href="#main" class="skip-link">)를 둬라.
  - main 에는 id="main" 을 줘서 건너뛰기 링크가 점프할 수 있게 해라.

  중요: div 를 버튼처럼 쓰지 말고 누르는 건 <button>, 이동은 <a> 를 써라.
  왜 그렇게 했는지 한 줄씩 한국어 주석으로 설명해 줘. 비전공자가 읽을 거야.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  이제 style.css 로 키보드 포커스 표시를 살려 줘.

  - 절대 outline: none 으로 포커스 외곽선을 지우지 마라.
  - a, button, input, textarea, select 의 :focus-visible 에
    outline: 3px solid 주황색 + outline-offset 을 줘서 키보드로 이동할 때 또렷이 보이게 해라.
  - 아주 오래된 브라우저를 위해 :focus 에도 기본 외곽선을 남겨 둬라.
  - .skip-link 는 평소엔 position: absolute; top: -48px; 로 화면 밖에 숨기고,
    .skip-link:focus 일 때만 top: 12px 로 내려오게 해라. (display:none 금지 — 키보드로 못 닿음)

  그다음 script.js 로 버튼과 폼을 동작시켜 줘:
  - '인사하기' 버튼 클릭 시 안내 문구 표시 (textContent 로 출력해서 XSS 위험 없게).
  - '클릭 수' 버튼은 누를 때마다 숫자 +1.
  - 폼 submit 시 event.preventDefault() 로 새로고침을 막고 결과만 화면에 표시.
  왜 그렇게 했는지 주석으로 설명해 줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  Tab 키로 이동하는데 포커스 외곽선이 안 보여. 어디가 어디인지 알 수가 없어.
  내 style.css 를 붙여넣을게. outline: none 이 남아 있거나 :focus-visible 규칙이
  빠졌는지 한 줄씩 점검해 줘. 무엇을 고쳐야 하는지와 왜 그래야 하는지를 같이 알려 줘.

  [여기에 style.css 내용 붙여넣기]
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다.

## 검증법

- 마우스 커서를 건드리지 않고 `Tab`만으로 페이지의 **모든** 링크·버튼·입력칸에 닿을 수 있나요? 하나라도 건너뛰어지면 접근성 문제입니다.
- 포커스가 이동할 때마다 **주황색 외곽선**이 보이나요? 안 보인다면 `outline: none`이 남아 있는지 `style.css`를 확인하세요.
- 첫 `Tab`에서 "본문 바로가기"가 나타나고, `Enter`로 본문까지 점프하나요?
- 실험: `style.css`에서 `:focus-visible` 규칙을 잠깐 주석 처리하고 다시 `Tab`을 눌러 보세요. 외곽선이 흐릿하거나 사라져 "길을 잃는" 느낌을 직접 비교해 보면 왜 필요한지 확실히 와닿습니다.
- (선택) 브라우저 개발자도구의 접근성 검사(예: Lighthouse의 Accessibility 항목)를 돌려 점수를 확인해 보세요.

자주 하는 실수

- `outline: none;`만 쓰고 대체 표시를 안 만들기 → **가장 흔하고 가장 나쁜 실수**입니다. 지울 거면 반드시 `:focus-visible`로 더 나은 외곽선을 다시 그려 주세요.
- 건너뛰기 링크를 `display: none;`이나 `visibility: hidden;`으로 숨기기 → 그러면 키보드로도 닿을 수 없습니다. 위치(`top`)로만 밀어 두세요.
- `<div onclick="...">`처럼 div를 버튼처럼 쓰기 → div는 기본적으로 `Tab`으로 닿지 않습니다. 누를 수 있는 것은 `<button>`, 이동은 `<a>`를 쓰세요.
- 입력칸에 `<label for="...">`를 연결하지 않기 → 라벨과 입력칸이 연결돼야 클릭/포커스 영역이 넓어지고 보조기기가 읽어 줍니다.

## 관련 가이드 링크

- [MDN: `:focus-visible` 의사클래스](https://developer.mozilla.org/ko/docs/Web/CSS/:focus-visible)
- [MDN: `outline` 으로 포커스 표시하기](https://developer.mozilla.org/ko/docs/Web/CSS/outline)
- [MDN: 키보드 접근성(키보드만으로 사용하기)](https://developer.mozilla.org/ko/docs/Learn/Accessibility/HTML#%ED%82%A4%EB%B3%B4%EB%93%9C_%EC%82%AC%EC%9A%A9%EC%9E%90%EB%A5%BC_%EC%9C%84%ED%95%9C_%EB%B0%B0%EB%A0%A4)
- [WebAIM: 키보드 접근성 가이드(영문)](https://webaim.org/techniques/keyboard/)
- [W3C WAI: 키보드 호환성](https://www.w3.org/WAI/perspective-videos/keyboard/)

> 이전 실습: 190 · 다음 실습: 192 (접근성·SEO·성능 시리즈)
