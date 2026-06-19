/*
  ===========================================================================
  실습 318 — 재사용 컴포넌트(버튼·카드)  [script.js]
  무엇: UI 조각(버튼·카드)을 "한 번만 정의해 여러 곳에서 재사용"하는 두 가지 방법.
        방법 1) 웹 컴포넌트 — 브라우저 표준 customElements로 나만의 태그(<ui-button> 등)를 만든다.
        방법 2) 템플릿 함수 — 자바스크립트 함수가 카드 HTML을 만들어 채워 넣는다(더 쉬운 대안).
  왜:  같은 버튼을 여러 곳에 복붙하면, 색 하나 바꿀 때 전부 다 고쳐야 한다.
        정의를 한 곳(여기)에 모으면 "한 줄만 고치면 전부 같이 바뀐다".
  보안: 데이터/사용자에게서 온 글자는 innerHTML이 아니라 textContent로 넣는다.
        innerHTML로 넣으면 <img onerror=...> 같은 글자가 "코드"로 실행되어 XSS가 날 수 있다.
  ===========================================================================
*/

/* =========================================================================
   디자인 토큰(공통 값) — "한 곳만 고치면 전부 바뀐다"의 핵심.
   버튼/카드가 쓰는 색·테두리·간격을 변수로 모아 둔다.
   예: --ui-primary 한 줄만 바꾸면 모든 primary 버튼 색이 한꺼번에 바뀐다.
   ========================================================================= */
const TOKENS = `
  :host { box-sizing: border-box; }
  .ui-btn {
    /* 버튼 공통 모양 — 모든 variant가 이 위에 색만 덧입힌다 */
    display: inline-flex; align-items: center; justify-content: center;
    padding: 10px 18px; border: none; border-radius: 8px;
    font-size: 0.95rem; font-weight: 600; cursor: pointer;
    font-family: inherit; transition: filter 0.15s ease;
  }
  .ui-btn:hover { filter: brightness(0.93); }
  /* ↓↓↓ 이 색 값 한 줄만 바꿔 새로고침하면, 화면의 모든 primary 버튼이 같이 바뀐다 ↓↓↓ */
  .ui-btn--primary   { background: #4f46e5; color: #fff; }   /* --ui-primary */
  .ui-btn--secondary { background: #e5e7eb; color: #1f2937; }
  .ui-btn--danger    { background: #dc2626; color: #fff; }   /* 삭제 등 위험 동작용 */
`;

const CARD_STYLE = `
  /* 카드 공통 모양 — 웹 컴포넌트와 템플릿 함수가 똑같이 이 모양을 쓰도록 정의 */
  display: block; background: #fff; border: 1px solid #e5e7eb;
  border-radius: 12px; padding: 16px; box-shadow: 0 1px 3px rgba(0,0,0,0.06);
`;

/* =========================================================================
   방법 1: 웹 컴포넌트
   - customElements.define('이름', 클래스) 로 "나만의 HTML 태그"를 등록한다.
   - 태그 이름에는 반드시 하이픈(-)이 있어야 한다(예: ui-button). 표준 규칙이다 —
     그래야 브라우저가 "기본 태그(button 등)"와 "내가 만든 태그"를 헷갈리지 않는다.
   ========================================================================= */

// <ui-button variant="primary">저장</ui-button> 형태로 쓰는 버튼 컴포넌트
class UiButton extends HTMLElement {              // HTMLElement를 상속해야 "태그"가 될 수 있다
  // 어떤 속성이 바뀌면 다시 그릴지 미리 알려 준다(여기선 variant). 성능을 위해 필요한 것만 적는다.
  static get observedAttributes() { return ['variant']; }

  connectedCallback() { this.render(); }          // 태그가 화면에 붙는 순간 1번 그린다
  attributeChangedCallback() { this.render(); }   // variant가 바뀌면 다시 그린다(색 즉시 반영)

  render() {
    // variant 속성을 읽되, 없으면 'primary'를 기본값으로(초보가 속성을 빠뜨려도 동작하게)
    const variant = this.getAttribute('variant') || 'primary';
    // 태그 사이에 적은 글자(예: "저장")를 가져온다. textContent로 읽어 안전하게 다룬다.
    const label = this.textContent.trim();

    // Shadow DOM: 이 컴포넌트만의 "격리된 작은 화면". 바깥 CSS와 서로 안 섞여(캡슐화) 충돌이 없다.
    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    // 스타일(토큰) + 버튼 틀만 shadow 안에 둔다. 글자는 아래에서 textContent로 따로 넣는다.
    this.shadowRoot.innerHTML = `
      <style>${TOKENS}</style>
      <button class="ui-btn ui-btn--${cssSafeVariant(variant)}"></button>
    `;
    // ★ 보안: 버튼 글자는 innerHTML이 아니라 textContent로 넣는다.
    //   라벨에 <script>나 <img onerror=...> 같은 글자가 와도 "그냥 글자"로만 보이고 실행되지 않는다.
    this.shadowRoot.querySelector('button').textContent = label;
  }
}
customElements.define('ui-button', UiButton);     // 이 한 줄로 <ui-button>이 진짜 태그가 된다

// <ui-card title="..." body="..."></ui-card> 형태로 쓰는 카드 컴포넌트
class UiCard extends HTMLElement {
  static get observedAttributes() { return ['title', 'body']; }
  connectedCallback() { this.render(); }
  attributeChangedCallback() { this.render(); }

  render() {
    // 속성으로 받은 제목/본문. 없으면 빈 문자열로(에러 방지)
    const title = this.getAttribute('title') || '';
    const body = this.getAttribute('body') || '';

    if (!this.shadowRoot) this.attachShadow({ mode: 'open' });

    // 틀(빈 제목/본문 자리)만 먼저 만든다. 실제 글자는 아래에서 textContent로 채운다.
    this.shadowRoot.innerHTML = `
      <article style="${CARD_STYLE}">
        <h3 style="margin:0 0 6px; font-size:1.05rem;"></h3>
        <p style="margin:0; color:#4b5563; font-size:0.92rem;"></p>
      </article>
    `;
    // ★ 보안: 제목/본문도 textContent로 넣어 XSS를 막는다(데이터에 HTML이 섞여 와도 안전).
    this.shadowRoot.querySelector('h3').textContent = title;
    this.shadowRoot.querySelector('p').textContent = body;
  }
}
customElements.define('ui-card', UiCard);

// variant 값이 이상해도 CSS 클래스가 깨지지 않게, 허용된 값만 통과시키는 작은 안전장치
function cssSafeVariant(v) {
  const allowed = ['primary', 'secondary', 'danger'];   // 허용 목록(화이트리스트)
  return allowed.includes(v) ? v : 'primary';           // 목록에 없으면 기본값으로
}

/* =========================================================================
   방법 2: 템플릿 함수
   - 웹 컴포넌트가 어렵게 느껴질 때 쓰는, 더 쉽고 빠른 방식.
   - 함수가 카드 1장을 만들어 돌려주고, 반복문이 데이터 배열만큼 찍어낸다.
   - 단점: 캡슐화(격리)는 약하다. 장점: 배우기 쉽고 코드가 짧다.
   ========================================================================= */

// 카드에 채울 데이터. 데이터만 늘리면 화면 카드도 자동으로 늘어난다(복붙 불필요).
const cardData = [
  { title: '빠른 시작', body: '함수로 만든 카드입니다.' },
  { title: '데이터 → 화면', body: '배열을 돌며 자동으로 그립니다.' },
  // 아래 한 줄을 추가하고 새로고침하면 카드가 한 장 더 생긴다 — 복붙이 아니라 데이터 추가다.
  { title: '쉬운 대안', body: '웹 컴포넌트보다 배우기 쉽습니다.' },
];

// 카드 1장을 만들어 "요소(element)"로 돌려주는 함수.
// 일부러 문자열(innerHTML) 대신 요소를 만들어 textContent로 글자를 넣는다 — XSS 방지.
function cardElement(item) {
  const article = document.createElement('article');     // 카드 바깥 상자
  article.setAttribute('style', CARD_STYLE);             // 방법 1과 같은 모양을 재사용

  const h3 = document.createElement('h3');               // 제목
  h3.setAttribute('style', 'margin:0 0 6px; font-size:1.05rem;');
  h3.textContent = item.title;                           // ★ textContent로 안전하게

  const p = document.createElement('p');                 // 본문
  p.setAttribute('style', 'margin:0; color:#4b5563; font-size:0.92rem;');
  p.textContent = item.body;                             // ★ textContent로 안전하게

  article.appendChild(h3);                               // 상자 안에 제목·본문을 끼운다
  article.appendChild(p);
  return article;
}

// 데이터 배열을 돌며 카드를 만들어 컨테이너에 채우는 함수
function renderCards() {
  const container = document.getElementById('card-list'); // index.html의 빈 칸
  if (!container) return;                                  // 칸이 없으면 조용히 끝낸다(에러 방지)
  container.replaceChildren();                             // 혹시 모를 기존 내용 비우기
  cardData.forEach((item) => container.appendChild(cardElement(item)));
}

// 페이지가 다 뜨면 카드들을 그린다
renderCards();
