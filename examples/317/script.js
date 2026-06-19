/*
  ============================================================
  script.js — 데이터(data.js)를 받아 카드 HTML을 만들어 그리드에 채우기
  ------------------------------------------------------------
  이 파일은 무엇인가:
    data.js의 CARDS 목록을 하나씩 돌면서 카드 한 장씩 만들어
    index.html의 #cardGrid(반응형 그리드 컨테이너)에 넣습니다.

  왜 JS로 카드를 만드나:
    - 카드가 6장이든 60장이든, HTML을 손으로 복사·붙여넣기 하지 않고
      데이터만 늘리면 화면이 자동으로 늘어나게 하려는 것.
    - 그리드는 "들어온 카드 개수"에 맞춰 알아서 줄을 채우므로,
      여기서는 카드를 "만들어 넣기만" 하면 됩니다.
  ============================================================
*/

// 1) 카드를 넣을 그리드 컨테이너를 찾습니다.
//    (index.html의 <section id="cardGrid">가 이 자리입니다.)
const grid = document.getElementById("cardGrid");

// 2) 견본으로 박아 둔 첫 카드를 비웁니다.
//    왜: JS가 동작하면 실제 데이터 카드로 채울 것이므로, 견본 한 장은 지워서 중복을 막습니다.
grid.innerHTML = "";

// 3) 카드 한 장을 만드는 함수.
//    매개변수 card는 data.js의 CARDS 안 객체 하나({ tag, title, desc })입니다.
function createCard(card) {
  // <article>을 만들고 Tailwind 유틸리티 클래스로 카드 모양을 입힙니다.
  // index.html의 견본 카드와 똑같은 클래스를 써서 디자인을 일치시킵니다.
  const article = document.createElement("article");
  article.className =
    "bg-white rounded-xl shadow-sm ring-1 ring-slate-200 overflow-hidden " +
    "transition hover:shadow-md hover:-translate-y-0.5";

  // 카드 상단의 이미지 자리(여기서는 회색 박스로 대체).
  // aspect-video는 16:9 비율을 유지해 카드 높이를 가지런하게 맞춰 줍니다.
  const thumb = document.createElement("div");
  thumb.className = "aspect-video bg-slate-100";

  // 카드 본문 영역(여백 p-4).
  const bodyBox = document.createElement("div");
  bodyBox.className = "p-4";

  // 태그(작은 배지).
  const badge = document.createElement("span");
  badge.className =
    "inline-block text-xs font-semibold text-brand-600 bg-brand-500/10 rounded px-2 py-0.5";
  // ★ 보안: 사용자/데이터에서 온 글자는 innerHTML이 아니라 textContent로 넣습니다.
  //   왜: innerHTML로 넣으면 데이터에 <script> 같은 태그가 섞였을 때 그게 실행될 수 있어(XSS) 위험합니다.
  //   textContent는 무조건 "글자 그대로" 출력하므로 안전합니다.
  badge.textContent = card.tag;

  // 제목.
  const title = document.createElement("h2");
  title.className = "mt-2 font-bold text-lg";
  title.textContent = card.title; // 동일한 이유로 textContent 사용

  // 설명.
  const desc = document.createElement("p");
  desc.className = "mt-1 text-sm text-slate-500";
  desc.textContent = card.desc; // 동일한 이유로 textContent 사용

  // 조각들을 조립합니다(본문 안에 배지·제목·설명을 차례로 넣기).
  bodyBox.appendChild(badge);
  bodyBox.appendChild(title);
  bodyBox.appendChild(desc);

  // 카드(article) 안에 썸네일과 본문을 넣습니다.
  article.appendChild(thumb);
  article.appendChild(bodyBox);

  return article;
}

// 4) CARDS 목록을 하나씩 돌며 카드를 만들어 그리드에 추가합니다.
//    forEach: 배열의 각 항목에 대해 같은 작업(카드 만들기)을 반복합니다.
CARDS.forEach(function (card) {
  grid.appendChild(createCard(card));
});
