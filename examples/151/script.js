// === 책 검색: API가 돌려준 '배열'을 하나씩 펼쳐서 목록으로 그리기 ===
//
// 이번 실습의 한 줄 핵심:
//   "API가 돌려준 응답 안에는 책이 '여러 권' 들어 있다(=배열).
//    이 배열을 반복(map/forEach)으로 펼쳐서, 책 한 권마다 화면 카드 하나씩을 만든다."
//
// 비유: 택배 상자(JSON)를 열었더니 책 한 권이 아니라 '책 묶음'이 들어 있다.
//       묶음을 풀어 책을 한 권씩 꺼내(반복) 책장(목록)에 한 칸씩 꽂는다.
//
// 이 실습이 쓰는 API (누구나 열쇠=API 키 없이 부를 수 있는 '공개' API):
//   Open Library 검색 API
//   주소 예: https://openlibrary.org/search.json?q=해리포터&limit=12
//   응답 모양(아주 단순화):
//   {
//     "numFound": 1234,
//     "docs": [                         ← 이 docs가 바로 '책 배열'
//       { "title": "...", "author_name": ["..."], "cover_i": 12345, "first_publish_year": 1997 },
//       { "title": "...", ... },
//       ...
//     ]
//   }
//   → 우리가 펼쳐야 할 배열은 data.docs 이다.
//   → 표지 그림은 cover_i 번호로 만든다:
//        https://covers.openlibrary.org/b/id/<cover_i>-M.jpg

// 화면에서 다룰 요소들을 미리 찾아 둔다.
const form = document.getElementById("searchForm");   // 검색창을 감싼 form
const keywordInput = document.getElementById("keyword"); // 검색어 입력칸
const statusEl = document.getElementById("status");    // 안내 문구 자리
const listEl = document.getElementById("bookList");    // 책 카드들이 들어갈 목록(ul)

// API 한 번에 너무 많이 받지 않도록 최대 12권만 받아온다.
const LIMIT = 12;

// 검색을 실행하는 함수.
async function searchBooks(keyword) {
  // 1) 빈 검색어면 아무것도 하지 않는다.
  if (!keyword.trim()) {
    statusEl.textContent = "검색어를 입력해 주세요.";
    listEl.innerHTML = "";
    return;
  }

  // 2) 받아오는 동안 안내 문구를 바꾸고, 이전 결과는 비운다.
  statusEl.textContent = `"${keyword}" 검색 중…`;
  listEl.innerHTML = "";

  try {
    // 3) 검색어를 주소에 안전하게 붙인다.
    //    encodeURIComponent: 공백·한글 같은 글자를 주소에 넣어도 깨지지 않게 변환한다.
    const url =
      "https://openlibrary.org/search.json?q=" +
      encodeURIComponent(keyword) +
      "&limit=" + LIMIT;

    // 4) 서버에 검색을 요청한다(=fetch).
    const res = await fetch(url);
    if (!res.ok) {
      throw new Error("서버 응답이 정상이 아닙니다: " + res.status);
    }

    // 5) 응답 포장을 풀어 JSON(자바스크립트 값)으로 바꾼다.
    const data = await res.json();

    // 6) ★이 실습의 핵심 1★ 응답에서 '책 배열'을 꺼낸다.
    const books = data.docs; // ← 책 여러 권이 들어 있는 배열

    // 7) 검색 결과가 0건이면 안내하고 끝낸다.
    if (!books || books.length === 0) {
      statusEl.textContent = `"${keyword}"에 대한 검색 결과가 없어요. 다른 말로 찾아보세요.`;
      return;
    }

    // 8) 화면에 그리고, 몇 권을 보여주는지 안내한다.
    renderBooks(books);
    statusEl.textContent = `"${keyword}" 결과 ${books.length}권을 보여줍니다.`;
  } catch (err) {
    // 9) 인터넷이 끊겼거나 서버가 실패하면 안내한다.
    statusEl.textContent = "책을 받아오지 못했어요. 인터넷 연결을 확인해 주세요.";
    console.error(err); // 개발자 콘솔(F12)에 자세한 원인 기록
  }
}

// ★이 실습의 핵심 2★ 책 배열을 받아, 책 한 권마다 카드(li) 하나씩 만들어 화면에 그린다.
function renderBooks(books) {
  // map: 책 배열(books)을 'HTML 문자열 배열'로 한 칸씩 바꿔준다.
  //      책 한 권(book) → 카드 HTML 한 조각.  → 책이 12권이면 카드도 12개가 만들어진다.
  const cardsHtml = books.map((book) => {
    // (a) 책 한 권에서 필요한 값들을 꺼낸다. 값이 없을 수도 있으니 기본값을 준비한다.
    const title = book.title || "(제목 없음)";

    // 저자는 author_name 이라는 '배열'로 올 수도, 아예 없을 수도 있다.
    // 배열이면 가운데점(·)으로 이어 붙이고, 없으면 '저자 미상'으로 둔다.
    const author = (book.author_name && book.author_name.length > 0)
      ? book.author_name.join(" · ")
      : "저자 미상";

    const year = book.first_publish_year || "연도 미상";

    // (b) 표지 그림 주소를 만든다. cover_i 번호가 있어야 표지를 만들 수 있다.
    //     없으면 글자만으로 그린 '표지 없음' 대체 이미지를 쓴다.
    const coverUrl = book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-M.jpg`
      : noCoverImage();

    // (c) 책 한 권을 표현하는 카드 HTML 한 조각을 돌려준다.
    //     escapeHtml: 제목·저자에 <, > 같은 글자가 있어도 화면이 깨지지 않게 안전 처리한다.
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

  // (d) 카드 조각들(배열)을 하나의 긴 문자열로 합쳐, 목록(ul) 안에 한 번에 넣는다.
  listEl.innerHTML = cardsHtml.join("");
}

// 표지가 없을 때 보여줄 대체 이미지(글자만으로 그린 SVG).
// 외부 통신이 막혀도 보이도록 data: 주소로 직접 만든다.
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

// 검색 버튼을 누르거나 Enter를 치면 검색을 실행한다.
form.addEventListener("submit", (event) => {
  event.preventDefault(); // 폼 기본 동작(페이지 새로고침)을 막는다.
  searchBooks(keywordInput.value);
});
