/*
  ============================================================
  실습 313 — 디바운스 자동완성 검색 UI (script.js)
  이 파일이 무엇인가:
    - 검색창의 "동작"을 담당합니다: 디바운스(멈췄을 때만 검색), 추천 드롭다운,
      키보드(↑/↓/Enter/Esc) 조작, 그리고 늦게 온 옛 응답이 화면을 덮지 않게 막는 처리.
  왜 이렇게 하는가:
    - 글자마다 서버로 요청하면 과부하 → "잠깐 멈췄을 때만" 1번 보내 요청을 아낍니다(디바운스).
    - 빠르게 칠 때 응답 순서가 뒤섞이면 옛 결과가 새 결과를 덮을 수 있어, 검색어 비교로 막습니다.
  ============================================================
*/

// ----- 설정값(여기만 바꾸면 동작이 달라집니다) -----
// DEBOUNCE_MS: "마지막 입력 후 몇 ms 동안 더 안 치면 검색할지".
//   값을 키우면(예 1000) 요청은 더 아끼지만 반응이 느려지고, 줄이면(예 50) 반응은 빠르지만 요청이 늘어납니다.
const DEBOUNCE_MS = 300;
// 최소 글자 수: 1글자만 쳐도 검색 결과가 너무 많아 의미가 없으므로, 1글자부터 허용하되
//   원하면 2로 올려 "2글자 이상일 때만 검색"으로 요청을 더 아낄 수 있습니다.
const MIN_CHARS = 1;
// 추천어를 최대 몇 개까지 보여줄지(너무 많으면 화면이 길어지므로 제한).
const MAX_RESULTS = 8;

// ----- 검색 대상 데이터(서버가 없으니 여기 박아 둔 가짜 목록) -----
// 실제 서비스에선 이 배열 대신 서버 검색 API를 호출합니다(아래 searchApi 참고).
const DATASET = [
  "부산", "부산진구", "부천", "서울", "성남", "수원", "세종",
  "대구", "대전", "광주", "인천", "울산", "제주", "창원", "청주",
  "리액트(React)", "리눅스(Linux)", "라우터(Router)", "리덕스(Redux)",
  "자바스크립트(JavaScript)", "타입스크립트(TypeScript)", "노드(Node.js)",
  "디바운스(debounce)", "스로틀(throttle)", "자동완성(autocomplete)"
];

// ----- 화면 요소 가져오기(HTML의 id와 짝) -----
const input = document.getElementById("search-input");
const listEl = document.getElementById("suggestion-list");
const requestCountEl = document.getElementById("request-count");
const resultInfoEl = document.getElementById("result-info");

// ----- 상태 변수들 -----
let debounceTimer = null;   // 디바운스 타이머 id. 새 입력이 오면 이전 타이머를 취소(clear)하기 위해 보관.
let requestCount = 0;       // 검색이 실제로 몇 번 "실행"됐는지(디바운스 효과 확인용 카운터).
let activeIndex = -1;       // 키보드로 현재 고른 항목 번호(-1 = 아무것도 안 고름).
let currentItems = [];      // 지금 화면에 떠 있는 추천어 배열(키보드 선택 시 사용).
let requestSeq = 0;         // 요청 순번. 늦게 온 옛 응답을 가려내기 위한 "표 번호" 역할.

/*
  searchApi(query): 실제 "검색"을 흉내 내는 함수.
  - 지금은 가짜 데이터에서 query를 포함하는 항목을 걸러 줍니다.
  - setTimeout으로 약간의 지연을 줘서 "서버에 다녀오는 느낌"을 흉내 냅니다(0~200ms).
    → 이 지연 때문에 빠르게 칠 때 응답 순서가 뒤섞일 수 있고, 그걸 막는 처리를 아래에서 합니다.
  - 실제 서버로 바꾸려면 이 함수 안을 다음처럼 교체하면 됩니다:
      const res = await fetch('/api/search?q=' + encodeURIComponent(query), { signal });
      return await res.json();
    (signal은 AbortController로 옛 요청을 취소할 때 씁니다.)
*/
function searchApi(query) {
  return new Promise((resolve) => {
    const fakeNetworkDelay = Math.random() * 200; // 0~200ms 랜덤 지연(현실의 네트워크 흉내)
    setTimeout(() => {
      const q = query.toLowerCase();
      // 입력 글자를 "포함"하는 항목만 추리고, 너무 많지 않게 잘라 줍니다.
      const matches = DATASET
        .filter((item) => item.toLowerCase().includes(q))
        .slice(0, MAX_RESULTS);
      resolve(matches);
    }, fakeNetworkDelay);
  });
}

/*
  renderSuggestions(items, query): 추천어 목록을 화면에 그립니다.
  보안 포인트(중요):
    - 사용자가 친 글자가 섞인 텍스트를 innerHTML로 넣으면 <script> 등이 실행돼 XSS 위험이 있습니다.
    - 그래서 텍스트는 반드시 textContent로 넣습니다(태그가 "글자 그대로" 보이고 실행되지 않음).
    - 일치 부분 강조도 createElement('mark')로 안전하게 만들어 붙입니다(문자열 HTML 조립 금지).
*/
function renderSuggestions(items, query) {
  listEl.textContent = ""; // 이전 목록 비우기(textContent="" 가 가장 안전한 초기화)
  currentItems = items;
  activeIndex = -1; // 새 목록이 뜨면 선택 위치 초기화

  if (items.length === 0) {
    // 결과가 없으면 드롭다운을 숨기고 안내만 갱신
    closeList();
    resultInfoEl.textContent = `"${query}"에 대한 결과가 없습니다.`;
    return;
  }

  items.forEach((text, i) => {
    const li = document.createElement("li");
    li.setAttribute("role", "option");
    li.id = `option-${i}`; // 키보드 포커스(aria-activedescendant)에서 가리킬 id

    // 일치한 글자 부분만 <mark>로 굵게 — 단, 전부 textContent로 안전하게 조립
    const lower = text.toLowerCase();
    const matchStart = lower.indexOf(query.toLowerCase());
    if (query && matchStart !== -1) {
      const before = text.slice(0, matchStart);
      const matched = text.slice(matchStart, matchStart + query.length);
      const after = text.slice(matchStart + query.length);
      // appendChild + textContent 조합: 어떤 입력이 와도 코드로 실행될 수 없음
      li.appendChild(document.createTextNode(before));
      const markEl = document.createElement("mark");
      markEl.textContent = matched;
      li.appendChild(markEl);
      li.appendChild(document.createTextNode(after));
    } else {
      li.textContent = text; // 일치 위치가 없으면 통째로(역시 textContent)
    }

    // 마우스로 클릭해 고르기
    li.addEventListener("click", () => selectItem(i));
    listEl.appendChild(li);
  });

  openList();
  resultInfoEl.textContent = `결과 ${items.length}개`;
}

// 드롭다운 열기/닫기 + 접근성 속성(aria-expanded) 동기화
function openList() {
  listEl.hidden = false;
  input.setAttribute("aria-expanded", "true");
}
function closeList() {
  listEl.hidden = true;
  input.setAttribute("aria-expanded", "false");
  activeIndex = -1;
  input.removeAttribute("aria-activedescendant");
}

/*
  runSearch(query): "실제로 검색을 한 번 실행"하는 함수(디바운스가 끝난 뒤 호출됨).
  요청 경쟁(race) 방지:
    - 호출할 때마다 requestSeq를 1 늘려 "내 표 번호(mySeq)"를 기억합니다.
    - 응답이 도착하면 "지금까지 나간 가장 최신 표 번호"와 내 번호가 같은지 확인하고,
      다르면(=내가 보낸 사이 더 새 요청이 나갔다면) 이 옛 응답은 버립니다.
    → 그래야 늦게 온 옛 결과가 새 결과를 덮어쓰지 않습니다.
*/
async function runSearch(query) {
  requestCount += 1;                       // 검색이 "실행"된 순간에만 카운트(디바운스 효과 확인용)
  requestCountEl.textContent = requestCount;

  const mySeq = ++requestSeq;              // 이번 요청의 표 번호
  const items = await searchApi(query);    // 서버(여기선 가짜) 다녀오기

  if (mySeq !== requestSeq) return;        // 그 사이 더 새 요청이 나갔으면 이 결과는 폐기
  if (input.value.trim() !== query) return; // 입력값이 이미 바뀌었어도 폐기(안전망)

  renderSuggestions(items, query);
}

/*
  input 이벤트: 글자가 바뀔 때마다 불립니다 — 여기가 "디바운스"의 핵심.
    - 바로 검색하지 않고, 이전 예약(타이머)을 취소(clearTimeout)한 뒤
      DEBOUNCE_MS 뒤에 검색하도록 새로 예약(setTimeout)합니다.
    - 계속 타이핑하면 예약이 계속 미뤄지다가, "멈춘 순간"에만 딱 1번 실행됩니다.
*/
input.addEventListener("input", () => {
  const query = input.value.trim();

  clearTimeout(debounceTimer); // 직전 예약 취소 — 이게 없으면 글자마다 검색이 다 나가 디바운스가 안 됨

  if (query.length < MIN_CHARS) {
    // 글자가 너무 짧으면 목록을 닫고 검색하지 않음(불필요한 요청 절약)
    closeList();
    resultInfoEl.textContent = "검색어를 입력하면 여기에 결과 개수가 표시됩니다.";
    return;
  }

  // "멈춤 후 DEBOUNCE_MS" 뒤에 검색 실행 예약
  debounceTimer = setTimeout(() => runSearch(query), DEBOUNCE_MS);
});

/*
  키보드 조작: 드롭다운이 열렸을 때 ↑/↓로 이동, Enter로 선택, Esc로 닫기.
*/
input.addEventListener("keydown", (e) => {
  if (listEl.hidden || currentItems.length === 0) return; // 목록이 없으면 무시

  if (e.key === "ArrowDown") {
    e.preventDefault(); // 커서가 글자 끝으로 튀는 기본 동작 막기
    moveActive(1);
  } else if (e.key === "ArrowUp") {
    e.preventDefault();
    moveActive(-1);
  } else if (e.key === "Enter") {
    if (activeIndex >= 0) {
      e.preventDefault();
      selectItem(activeIndex);
    }
  } else if (e.key === "Escape") {
    closeList();
  }
});

// moveActive(dir): 현재 강조 항목을 위(-1)/아래(+1)로 옮깁니다.
function moveActive(dir) {
  const items = listEl.querySelectorAll("li");
  if (activeIndex >= 0) items[activeIndex].classList.remove("active"); // 기존 강조 제거

  // 끝에서 더 가면 반대쪽으로 도는(wrap) 계산
  activeIndex = (activeIndex + dir + items.length) % items.length;

  const activeEl = items[activeIndex];
  activeEl.classList.add("active");
  activeEl.scrollIntoView({ block: "nearest" }); // 화면 밖이면 보이게 스크롤
  // 스크린리더에게 "지금 이 항목을 가리키는 중"이라고 알림(접근성)
  input.setAttribute("aria-activedescendant", activeEl.id);
}

// selectItem(i): 추천어 하나를 골라 입력창에 채우고 목록을 닫습니다.
function selectItem(i) {
  input.value = currentItems[i];
  closeList();
  resultInfoEl.textContent = `선택됨: ${currentItems[i]}`;
}

// 입력창 밖을 클릭하면 드롭다운 닫기(흔한 UX)
document.addEventListener("click", (e) => {
  if (!e.target.closest(".search-box")) closeList();
});
