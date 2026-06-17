// =============================================================
//  도서 검색 + 페이지네이션(쪽 넘기기)
//  - 검색 API: Open Library (무료 공개 API, 키 필요 없음)
//    https://openlibrary.org/search.json?q=검색어&page=1&limit=10
//
//  이번 실습의 한 줄 핵심:
//   "검색 결과가 수천 건이어도 한 번에 다 받지 않는다.
//    'page'(몇 쪽)와 'limit'(한 쪽에 몇 개)만 바꿔 가며 쪽 단위로 조금씩 받아온다."
//
//  왜 중요한가? (디렉터 시각)
//   - '어린왕자'를 검색하면 수백~수천 권이 나옵니다. 이걸 다 받으면 느리고 화면도 끝없이 길어집니다.
//   - 그래서 서버에 "1쪽만 줘 / 다음은 2쪽 줘"라고 나눠 달라고 부탁합니다. 이게 페이지네이션입니다.
//   - 책장에서 책을 한꺼번에 다 꺼내지 않고, 펼친 '한 쪽'만 보는 것과 같습니다.
// =============================================================

// ---- 화면 요소들을 미리 붙잡아 둔다 ----
const queryInput = document.getElementById("queryInput");
const searchBtn = document.getElementById("searchBtn");
const statusEl = document.getElementById("status");
const resultList = document.getElementById("resultList");

const pager = document.getElementById("pager");       // 쪽 넘기기 막대(이전/정보/다음)
const prevBtn = document.getElementById("prevBtn");    // [← 이전]
const nextBtn = document.getElementById("nextBtn");    // [다음 →]
const pageInfo = document.getElementById("pageInfo");  // "2 / 17" 같은 현재 위치

// =============================================================
//  ★상태(state)★ — '지금 무엇을, 몇 쪽 보고 있는지'를 기억하는 메모지
//  이 세 가지만 기억하면 [이전]/[다음]을 눌렀을 때 무엇을 다시 받아올지 알 수 있습니다.
// =============================================================
const PER_PAGE = 10;     // 한 쪽에 몇 권씩 보여줄지 (= API의 limit)
let currentQuery = "";   // 지금 검색 중인 단어
let currentPage = 1;     // 지금 보고 있는 쪽 번호 (1부터 시작)
let totalPages = 1;      // 전체가 몇 쪽인지 (검색 결과 수 ÷ PER_PAGE 로 계산)

// =============================================================
//  ★핵심★ 특정 '쪽'을 받아와 화면에 그리는 함수
//  - page 번호 하나만 넘기면, 그 쪽의 책 10권을 받아 그립니다.
//  - [검색] / [이전] / [다음] 모두 결국 이 함수를 page 만 바꿔 부릅니다.
// =============================================================
async function loadPage(page) {
  // 검색 중에는 버튼들을 잠가 더블 클릭으로 두 번 요청되는 일을 막습니다.
  setControlsDisabled(true);
  setStatus(`"${currentQuery}" ${page}쪽을 불러오는 중이에요…`);

  try {
    // ★여기가 페이지네이션의 전부★
    //   page  = 몇 번째 쪽을 줄지 (Open Library는 1쪽부터 셈)
    //   limit = 한 쪽에 몇 개를 줄지 (= PER_PAGE)
    //   fields = 필요한 항목만 받아 응답을 가볍게 (제목·저자·연도·표지)
    const params = new URLSearchParams();
    params.set("q", currentQuery);
    params.set("page", page);            // ← 쪽 번호
    params.set("limit", PER_PAGE);       // ← 한 쪽 크기
    params.set("fields", "title,author_name,first_publish_year,cover_i");
    const url = "https://openlibrary.org/search.json?" + params.toString();

    const res = await fetch(url);

    if (!res.ok) {
      // 서버가 200이 아닌 응답(예: 503 점검 중)을 주면 여기로
      throw new Error("검색 서버 응답 오류 (상태코드 " + res.status + ")");
    }

    const data = await res.json();

    // numFound = 검색 결과 '전체' 개수. 이 숫자로 '전체 몇 쪽인지'를 계산합니다.
    const total = data.numFound || 0;
    const docs = Array.isArray(data.docs) ? data.docs : [];

    // 결과가 하나도 없으면 빈 화면 + 안내만 보여 줍니다.
    if (total === 0) {
      resultList.innerHTML = "";
      pager.hidden = true;
      setStatus(`"${currentQuery}"에 대한 검색 결과가 없어요. 다른 단어로 검색해 보세요.`, "error");
      return;
    }

    // ★전체 쪽 수 계산★ : 전체 개수 ÷ 한 쪽 크기 를 '올림'.
    //   예) 결과 23개, 한 쪽 10개 → 23/10 = 2.3 → 올림하면 3쪽.
    //   Math.ceil(올림) 을 안 쓰면 마지막 자투리 3개가 들어갈 3쪽이 사라집니다.
    totalPages = Math.ceil(total / PER_PAGE);
    currentPage = page;

    renderBooks(docs);   // 받아온 10권을 화면에 그린다
    updatePager();       // 이전/다음 버튼과 "2 / 3" 표시를 현재 상태에 맞춘다

    setStatus(`"${currentQuery}" 검색 결과 총 ${total.toLocaleString()}권 중 ${page}쪽을 보고 있어요.`, "success");
  } catch (err) {
    // 인터넷이 끊겼거나 서버 오류 등 모든 실패가 여기로 모입니다.
    // 자세한 원인은 콘솔에만, 사용자에게는 친절한 한 줄만 보여 줍니다.
    console.error("도서 검색 실패:", err);
    setStatus("검색 중 문제가 생겼어요. 인터넷 연결을 확인하고 다시 시도해 주세요.", "error");
  } finally {
    // 성공하든 실패하든 버튼은 다시 눌릴 수 있게 풀어 줍니다.
    setControlsDisabled(false);
  }
}

// =============================================================
//  받아온 책 목록(docs)을 화면 <ul>에 그리는 함수
//  - 이전 결과를 지우고(innerHTML = "") 새로 그립니다.
// =============================================================
function renderBooks(docs) {
  resultList.innerHTML = ""; // 이전 쪽 결과를 깨끗이 비운다

  docs.forEach((book) => {
    const li = document.createElement("li");
    li.className = "bookItem";

    // 표지 이미지 주소 만들기 (cover_i 가 있을 때만). 없으면 회색 빈 상자가 보입니다.
    const coverUrl = book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`
      : "";

    // 저자·출판연도는 없을 수도 있으니 안전하게 기본값을 둡니다.
    const author = (book.author_name && book.author_name[0]) || "저자 미상";
    const year = book.first_publish_year || "연도 미상";

    // ★주의★ 책 제목/저자는 사용자가 입력한 값이 아니라 외부 데이터입니다.
    //   innerHTML로 직접 끼우면 위험할 수 있어, textContent로 안전하게 글자만 넣습니다.
    const img = document.createElement("img");
    img.className = "bookCover";
    img.alt = "";                 // 장식용 표지라 대체텍스트는 비움
    if (coverUrl) img.src = coverUrl;

    const textBox = document.createElement("div");
    textBox.className = "bookText";

    const titleEl = document.createElement("p");
    titleEl.className = "bookTitle";
    titleEl.textContent = book.title || "(제목 없음)";

    const metaEl = document.createElement("p");
    metaEl.className = "bookMeta";
    metaEl.textContent = `${author} · ${year}`;

    textBox.appendChild(titleEl);
    textBox.appendChild(metaEl);
    li.appendChild(img);
    li.appendChild(textBox);
    resultList.appendChild(li);
  });

  // 새 쪽을 그렸으니 화면 맨 위로 살짝 올려 주면 읽기 편합니다.
  resultList.scrollIntoView({ behavior: "smooth", block: "start" });
}

// =============================================================
//  ★페이지네이션 UI 갱신★
//  - "2 / 17" 처럼 현재 위치를 보여 주고,
//  - 첫 쪽이면 [이전]을, 마지막 쪽이면 [다음]을 '눌러도 의미 없으니' 잠급니다.
// =============================================================
function updatePager() {
  pager.hidden = false;                       // 결과가 있으니 막대를 보여 준다
  pageInfo.textContent = `${currentPage} / ${totalPages}`;

  // 첫 쪽(1)에서는 더 이전이 없으니 [이전] 잠금
  prevBtn.disabled = currentPage <= 1;
  // 마지막 쪽에서는 더 다음이 없으니 [다음] 잠금
  nextBtn.disabled = currentPage >= totalPages;
}

// 검색/페이지 버튼들을 한꺼번에 잠그고/푸는 도우미 (요청 중 중복 클릭 방지)
function setControlsDisabled(disabled) {
  searchBtn.disabled = disabled;
  prevBtn.disabled = disabled;
  nextBtn.disabled = disabled;
}

// 상태 안내 줄의 글자와 색(성공/실패)을 한 곳에서 바꾸는 도우미
function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.classList.remove("success", "error");
  if (type) statusEl.classList.add(type); // type = "success" | "error" | undefined
}

// =============================================================
//  [검색] 버튼: 새 검색을 시작한다 → 항상 1쪽부터.
// =============================================================
function startNewSearch() {
  const q = queryInput.value.trim();
  if (!q) {
    setStatus("먼저 검색어를 입력해 주세요.", "error");
    return;
  }
  currentQuery = q;
  loadPage(1); // 새 검색은 무조건 1쪽부터 보여 준다
}

// =============================================================
//  이벤트 연결: 검색 버튼 / 엔터 키 / 예시 칩 / 이전·다음
// =============================================================
searchBtn.addEventListener("click", startNewSearch);

// 입력칸에서 Enter 를 눌러도 검색되게
queryInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") startNewSearch();
});

// 예시 칩을 누르면 입력칸을 채우고 바로 검색
document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    queryInput.value = chip.dataset.q;
    startNewSearch();
  });
});

// [← 이전] : 현재 쪽보다 1 작은 쪽을 받아온다 (1쪽보다 작아질 수는 없음 — 버튼이 잠겨 있음)
prevBtn.addEventListener("click", () => {
  if (currentPage > 1) loadPage(currentPage - 1);
});

// [다음 →] : 현재 쪽보다 1 큰 쪽을 받아온다 (마지막 쪽을 넘어갈 수는 없음 — 버튼이 잠겨 있음)
nextBtn.addEventListener("click", () => {
  if (currentPage < totalPages) loadPage(currentPage + 1);
});
