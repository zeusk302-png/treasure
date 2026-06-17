// =============================================================
//  실시간 도서 검색 — 디바운스 + 중복요청(이전 요청) 취소
//  - 검색 API: Open Library (무료 공개 API, 키 필요 없음)
//    https://openlibrary.org/search.json?q=검색어&limit=10
//
//  이번 실습의 한 줄 핵심:
//   "타이핑할 때마다 검색하지 않는다.
//    입력이 '멈춘 뒤에만' 한 번 검색하고(디바운스),
//    그래도 겹친 옛 요청은 '취소'해 마지막 결과만 화면에 그린다."
//
//  왜 중요한가? (디렉터 시각)
//   - '어린왕자'를 친다고 ㅇ→어→어ㄹ→어린… 글자마다 검색을 보내면,
//     단어 하나에 수십 번 API를 두들깁니다. 무료 API는 '호출 한도(rate limit)'를 넘겨 차단되고,
//     유료 API라면 그만큼 요금이 새어 나갑니다. (= 함정)
//   - 그래서 ① 입력이 멈출 때까지 잠깐 기다렸다가 한 번만 보내고(디바운스),
//     ② 그 사이 새 검색이 출발하면 먼저 떠난 옛 요청은 취소(AbortController)합니다.
//   - 비유: 엘리베이터는 누군가 탈 때마다 즉시 출발하지 않고,
//     문이 '잠시 조용해질 때까지' 기다렸다 한 번에 출발합니다. 그게 디바운스입니다.
// =============================================================

// ---- 화면 요소들을 미리 붙잡아 둔다 ----
const queryInput = document.getElementById("queryInput");
const statusEl = document.getElementById("status");
const resultList = document.getElementById("resultList");
const spinner = document.getElementById("spinner");

// 학습용 계기판(키 입력 / 실제 요청 / 취소 횟수)
const keyCountEl = document.getElementById("keyCount");
const reqCountEl = document.getElementById("reqCount");
const abortCountEl = document.getElementById("abortCount");

// =============================================================
//  ★설정값(튜닝 손잡이)★
// =============================================================
const DEBOUNCE_MS = 400; // 입력이 멈춘 뒤 이만큼(밀리초) 기다렸다 검색한다. (0.4초)
const MIN_CHARS = 2;     // 너무 짧은 검색어(1글자)는 결과가 너무 넓어 검색하지 않는다.
const LIMIT = 10;        // 한 번에 받아올 책 수

// =============================================================
//  ★상태(state)★ — 디바운스와 취소를 위해 기억해 두는 두 개의 메모지
// =============================================================
let debounceTimer = null;       // ① setTimeout이 돌려준 '예약표'. 새 입력이 오면 이 예약을 취소한다.
let currentController = null;    // ② 지금 떠 있는 fetch 요청의 '취소 리모컨'(AbortController).

// 계기판 숫자(학습용)
let keyCount = 0;
let reqCount = 0;
let abortCount = 0;

// =============================================================
//  ★핵심 1 — 디바운스★
//  입력 이벤트가 들어올 때마다 '예약'만 새로 잡고, 실제 검색은 0.4초 뒤로 미룬다.
//  계속 타이핑하면 이전 예약이 계속 취소되어, '멈춘 순간'에 딱 한 번만 검색이 실행된다.
// =============================================================
queryInput.addEventListener("input", () => {
  keyCount += 1;
  keyCountEl.textContent = keyCount;

  // 직전에 잡아 둔 예약이 있으면 취소한다.
  //   → 글자를 계속 치는 동안에는 검색이 계속 '미뤄진다'.
  clearTimeout(debounceTimer);

  const q = queryInput.value.trim();

  // 너무 짧으면(0~1글자) 검색하지 않고, 떠 있던 요청도 정리한다.
  if (q.length < MIN_CHARS) {
    cancelInFlightRequest();           // 입력이 비워졌는데 옛 요청이 남아 있으면 취소
    resultList.innerHTML = "";
    setStatus(
      q.length === 0
        ? "검색어를 입력하면 자동으로 찾아 줍니다."
        : `${MIN_CHARS}글자 이상 입력해 주세요.`
    );
    return;
  }

  // 0.4초 뒤에 검색을 '예약'한다. 이 시간 안에 또 입력이 오면 위에서 이 예약이 취소된다.
  setStatus(`입력이 멈추길 기다리는 중… ("${q}")`);
  debounceTimer = setTimeout(() => {
    runSearch(q);
  }, DEBOUNCE_MS);
});

// =============================================================
//  ★핵심 2 — 이전 요청 취소(중복요청 막기)★
//  디바운스로 횟수를 줄여도, 느린 네트워크에서는 요청이 겹칠 수 있다.
//  새 검색을 시작하기 직전에 '먼저 떠난' 요청을 취소해, 옛 결과가 늦게 도착해
//  새 결과를 덮어쓰는 '경쟁 상태(race condition)'를 막는다.
// =============================================================
function cancelInFlightRequest() {
  if (currentController) {
    currentController.abort();   // 떠 있던 fetch에게 "그만둬"라고 신호를 보낸다.
    currentController = null;
    abortCount += 1;
    abortCountEl.textContent = abortCount;
  }
}

// =============================================================
//  실제 검색 — 디바운스 타이머가 끝났을 때 딱 한 번 실행된다.
// =============================================================
async function runSearch(q) {
  // 1) 새 검색을 시작하기 전에, 아직 안 끝난 옛 요청이 있으면 취소한다.
  cancelInFlightRequest();

  // 2) 이번 요청 전용 '취소 리모컨'을 새로 만든다.
  const controller = new AbortController();
  currentController = controller;

  reqCount += 1;                  // ★여기까지 와야 '실제 요청'이다★ (계기판이 증명)
  reqCountEl.textContent = reqCount;

  showSpinner(true);
  setStatus(`"${q}" 검색 중…`);

  try {
    // 필요한 항목만 받아 응답을 가볍게 한다 (제목·저자·연도·표지).
    const params = new URLSearchParams();
    params.set("q", q);
    params.set("limit", LIMIT);
    params.set("fields", "title,author_name,first_publish_year,cover_i");
    const url = "https://openlibrary.org/search.json?" + params.toString();

    // ★signal★ — 위에서 만든 controller를 fetch에 연결한다.
    //   controller.abort()가 불리면 이 fetch는 즉시 중단되고 catch로 떨어진다.
    const res = await fetch(url, { signal: controller.signal });

    if (!res.ok) {
      throw new Error("검색 서버 응답 오류 (상태코드 " + res.status + ")");
    }

    const data = await res.json();

    // 응답이 도착한 사이에 더 새로운 검색이 시작됐다면, 이 결과는 '낡은' 결과다.
    //   currentController가 바뀌었는지 확인해, 낡은 결과로 화면을 덮어쓰지 않는다.
    if (currentController !== controller) {
      return; // 더 최신 요청이 화면을 책임지므로 조용히 버린다.
    }

    const total = data.numFound || 0;
    const docs = Array.isArray(data.docs) ? data.docs : [];

    if (total === 0) {
      resultList.innerHTML = "";
      setStatus(`"${q}"에 대한 검색 결과가 없어요. 다른 단어로 검색해 보세요.`, "error");
      return;
    }

    renderBooks(docs);
    setStatus(`"${q}" 검색 결과 총 ${total.toLocaleString()}권 중 ${docs.length}권을 보여 줘요.`, "success");
  } catch (err) {
    // ★취소는 '오류'가 아니다★
    //   abort()로 일부러 멈춘 경우 err.name === "AbortError" 다. 이건 정상 흐름이니
    //   사용자에게 빨간 오류를 띄우지 않고 조용히 넘어간다.
    if (err.name === "AbortError") {
      console.log("이전 요청을 취소했습니다(정상):", q);
      return;
    }
    // 진짜 실패(인터넷 끊김, 서버 오류 등): 자세한 원인은 콘솔에만, 화면엔 친절한 한 줄만.
    console.error("도서 검색 실패:", err);
    setStatus("검색 중 문제가 생겼어요. 인터넷 연결을 확인하고 다시 시도해 주세요.", "error");
  } finally {
    // 이 요청이 '아직 최신'일 때만 스피너를 끈다.
    //   (낡은 요청이 늦게 끝나며 최신 요청의 스피너를 꺼 버리는 일을 막는다.)
    if (currentController === controller) {
      showSpinner(false);
      currentController = null;
    }
  }
}

// =============================================================
//  받아온 책 목록(docs)을 화면 <ul>에 그리는 함수 (159와 동일한 방식)
// =============================================================
function renderBooks(docs) {
  resultList.innerHTML = ""; // 이전 검색 결과를 깨끗이 비운다

  docs.forEach((book) => {
    const li = document.createElement("li");
    li.className = "bookItem";

    const coverUrl = book.cover_i
      ? `https://covers.openlibrary.org/b/id/${book.cover_i}-S.jpg`
      : "";

    const author = (book.author_name && book.author_name[0]) || "저자 미상";
    const year = book.first_publish_year || "연도 미상";

    // ★주의★ 외부 데이터(제목·저자)는 innerHTML로 직접 끼우지 않고 textContent로 안전하게 넣는다.
    const img = document.createElement("img");
    img.className = "bookCover";
    img.alt = "";
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
}

// =============================================================
//  도우미들
// =============================================================
function showSpinner(on) {
  spinner.hidden = !on;
}

function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.classList.remove("success", "error");
  if (type) statusEl.classList.add(type); // type = "success" | "error" | undefined
}

// =============================================================
//  예시 칩: 누르면 입력칸을 채우고 곧장 검색한다(디바운스를 기다리지 않고 바로).
// =============================================================
document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    queryInput.value = chip.dataset.q;
    clearTimeout(debounceTimer); // 예약된 디바운스가 있으면 취소하고
    runSearch(chip.dataset.q);    // 즉시 검색
  });
});
