// === 실시간 도서 검색: 사용자가 친 검색어를 '주소(URL)'에 안전하게 끼워 넣기 ===
//
// 이번 실습의 한 줄 핵심:
//   "사용자가 입력창에 친 글자를, fetch로 부를 주소(URL)의
//    쿼리 파라미터(?q=...) 자리에 '안전하게' 합쳐서 요청을 만든다."
//
// 왜 '안전하게'가 중요할까?
//   주소(URL)에는 그냥 넣으면 안 되는 글자가 있다.
//   - 공백( ), 한글, & , = , ? , # , + 같은 글자는 주소에서 '특별한 뜻'을 가진다.
//   - 예: 검색어가 "c++ & java" 인데 그대로 주소에 붙이면
//       ...?q=c++ & java   ← 공백에서 주소가 끊기고, &는 "새 항목 시작"으로 잘못 읽힌다.
//   - 그래서 사용자가 친 글자는 반드시 'URL용으로 변환'해서 넣어야 한다.
//
//   변환 도구가 바로 encodeURIComponent(글자) 이다.
//     encodeURIComponent("c++ & java")  →  "c%2B%2B%20%26%20java"
//     (공백→%20, +→%2B, &→%26 처럼 안전한 코드로 바뀐다)
//
// 이 실습이 쓰는 API (열쇠=API 키 없이 누구나 부를 수 있는 '공개' API):
//   Open Library 검색 API
//   주소 예: https://openlibrary.org/search.json?q=해리포터&limit=12
//   응답에서 우리가 쓸 부분은 data.docs (책 여러 권이 든 배열)이다.

// 화면에서 다룰 요소들을 미리 찾아 둔다.
const form = document.getElementById("searchForm");      // 검색창을 감싼 form
const keywordInput = document.getElementById("keyword"); // 검색어 입력칸
const statusEl = document.getElementById("status");      // 안내 문구 자리
const listEl = document.getElementById("bookList");      // 책 카드들이 들어갈 목록(ul)
const urlViewEl = document.getElementById("urlView");    // 우리가 만든 '주소'를 보여주는 칸

const LIMIT = 12; // 한 번에 최대 12권만 받아온다.

// ★이 실습의 핵심 함수★
// 검색어를 받아, fetch로 부를 '안전한 주소'를 조립해서 돌려준다.
function buildSearchUrl(keyword) {
  // 방법 1) encodeURIComponent로 직접 합치기 (가장 기본, 원리를 또렷이 보여준다)
  //   - keyword 안의 위험한 글자를 안전한 코드로 바꿔서 ?q= 자리에 끼운다.
  const safeKeyword = encodeURIComponent(keyword);
  const urlByHand =
    "https://openlibrary.org/search.json?q=" + safeKeyword + "&limit=" + LIMIT;

  // 방법 2) URLSearchParams로 합치기 (값이 여러 개일 때 실수 없이 깔끔하다)
  //   - set(키, 값)만 하면 인코딩(안전 변환)은 자동으로 해 준다.
  const params = new URLSearchParams();
  params.set("q", keyword);   // ← keyword를 따로 인코딩하지 않아도 자동 처리된다
  params.set("limit", LIMIT);
  const urlBySearchParams = "https://openlibrary.org/search.json?" + params.toString();

  // 두 방법은 '같은 주소'를 만든다. 이번 실습에서는 방법 2를 실제로 쓴다.
  // (방법 1은 원리 학습용으로 함께 적어 두었다.)
  return urlBySearchParams;
}

// 검색을 실행하는 함수.
async function searchBooks(keyword) {
  // 1) 빈 검색어면 화면을 비우고 끝낸다.
  if (!keyword.trim()) {
    statusEl.textContent = "검색어를 입력해 주세요.";
    listEl.innerHTML = "";
    urlViewEl.textContent = "(아직 검색 전)";
    return;
  }

  // 2) ★핵심★ 검색어로 '안전한 주소'를 만든다.
  const url = buildSearchUrl(keyword);

  // 3) 우리가 만든 주소를 화면에도 그대로 보여 준다.
  //    공백·한글·특수문자가 %20, %ED.. 같은 코드로 바뀐 모습을 눈으로 확인하는 부분이다.
  urlViewEl.textContent = url;

  // 4) 받아오는 동안 안내 문구를 바꾸고, 이전 결과는 비운다.
  statusEl.textContent = `"${keyword}" 검색 중…`;
  listEl.innerHTML = "";

  try {
    // 5) 서버에 검색을 요청한다(=fetch).
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("서버 응답이 정상이 아닙니다: " + res.status);
    }

    // 6) 응답 포장을 풀어 JSON으로 바꾼다.
    const data = await res.json();

    // 7) 응답에서 '책 배열'을 꺼낸다.
    const books = data.docs;

    // 8) 검색 결과가 0건이면 안내하고 끝낸다.
    if (!books || books.length === 0) {
      statusEl.textContent = `"${keyword}"에 대한 검색 결과가 없어요. 다른 말로 찾아보세요.`;
      return;
    }

    // 9) 화면에 그리고, 몇 권을 보여주는지 안내한다.
    renderBooks(books);
    statusEl.textContent = `"${keyword}" 결과 ${books.length}권을 보여줍니다.`;
  } catch (err) {
    statusEl.textContent = "책을 받아오지 못했어요. 인터넷 연결을 확인해 주세요.";
    console.error(err); // 개발자 콘솔(F12)에 자세한 원인 기록
  }
}

// 책 배열을 받아, 책 한 권마다 카드(li) 하나씩 만들어 화면에 그린다.
function renderBooks(books) {
  const cardsHtml = books.map((book) => {
    const title = book.title || "(제목 없음)";

    const author = (book.author_name && book.author_name.length > 0)
      ? book.author_name.join(" · ")
      : "저자 미상";

    const year = book.first_publish_year || "연도 미상";

    // 표지 그림 주소. cover_i 번호가 있어야 표지를 만들 수 있다.
    const coverUrl = book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
      : noCoverImage();

    return `
      <li class="bookCard">
        <img class="cover" src="${coverUrl}" alt="${escapeHtml(title)} 표지"
             onerror="this.onerror=null; this.src='${noCoverImage()}';" />
        <div class="info">
          <p class="title">${escapeHtml(title)}</p>
          <p class="author">${escapeHtml(author)}</p>
          <p class="year">${escapeHtml(String(year))}</p>
        </div>
      </li>
    `;
  });

  listEl.innerHTML = cardsHtml.join("");
}

// 표지가 없을 때 보여줄 대체 이미지(글자만으로 그린 SVG).
function noCoverImage() {
  return "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='160' height='220'>" +
    "<rect width='160' height='220' fill='#e9e4d8'/>" +
    "<text x='80' y='105' font-size='44' text-anchor='middle'>📕</text>" +
    "<text x='80' y='150' font-size='13' text-anchor='middle' fill='#8a7a55'>표지 없음</text>" +
    "</svg>"
  );
}

// 사용자가 입력한 글자를 화면에 안전하게 표시하기 위한 함수.
// (제목·저자에 < > & " 같은 글자가 있어도 태그로 잘못 해석되지 않게 바꾼다.)
function escapeHtml(text) {
  return text
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

// === '실시간' 검색을 만드는 부분 ===
//
// 입력칸에 글자를 칠 때마다 검색하면 좋지만, 한 글자 칠 때마다 매번 요청을 보내면
// 서버에 너무 자주 요청하게 된다(예: "해리포터"는 8번 요청).
// 그래서 'debounce(디바운스)'를 쓴다:
//   "타이핑이 잠깐(0.5초) 멈추면 그때 한 번만 검색한다."
let timer = null; // 예약해 둔 검색을 취소하기 위한 손잡이

keywordInput.addEventListener("input", () => {
  clearTimeout(timer); // 이전에 예약한 검색이 있으면 취소한다(아직 타이핑 중이니까).
  const keyword = keywordInput.value;
  timer = setTimeout(() => {
    searchBooks(keyword); // 0.5초 동안 추가 입력이 없으면 그때 검색 실행
  }, 500);
});

// 검색 버튼을 누르거나 Enter를 치면 기다리지 않고 즉시 검색한다.
form.addEventListener("submit", (event) => {
  event.preventDefault(); // 폼 기본 동작(페이지 새로고침)을 막는다.
  clearTimeout(timer);    // 예약된 자동 검색이 있으면 취소하고
  searchBooks(keywordInput.value); // 바로 검색
});

// 페이지를 처음 열었을 때, 미리 채워진 검색어로 한 번 검색해 둔다.
searchBooks(keywordInput.value);
