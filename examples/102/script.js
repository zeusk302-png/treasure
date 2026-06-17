// ============================================
// 디바운스(debounce) 검색
// 핵심 개념: setTimeout / clearTimeout 으로
//   "키를 칠 때마다"가 아니라 "멈춘 0.3초 뒤에 한 번만" 검색하기
// ============================================

// 1) 화면 요소들을 미리 골라 변수에 담아둔다.
const searchInput = document.getElementById("searchInput");
const list = document.getElementById("list");
const countText = document.getElementById("count");
const emptyMsg = document.getElementById("empty");

// 디바운스 효과를 눈으로 보기 위한 계기판 요소들
const keyCountText = document.getElementById("keyCount"); // 키 누른 횟수
const runCountText = document.getElementById("runCount"); // 실제 검색 실행 횟수
const statusText = document.getElementById("status");     // 상태 안내문

// 2) 목록의 모든 항목(li)을 한 번에 모아 진짜 배열로 만들어 둔다.
const items = Array.from(list.querySelectorAll("li"));

// 3) 디바운스를 위한 "예약표" 변수.
//    setTimeout 은 "몇 밀리초 뒤에 이 함수를 실행해줘"라고 예약하고,
//    그 예약을 식별하는 번호(타이머 ID)를 돌려준다. 그 번호를 여기에 보관한다.
let timerId = null;

// 검사용 카운터(눈으로 확인하려고 둔 것일 뿐, 디바운스의 핵심은 아니다)
let keyCount = 0; // input 이벤트가 몇 번 일어났는지
let runCount = 0; // 실제 검색이 몇 번 실행됐는지

// 4) "진짜 검색"을 하는 함수. (101번 실시간 검색과 내용이 같다)
//    이 함수는 키를 칠 때마다가 아니라, 멈춘 뒤 딱 한 번만 불린다.
function runSearch() {
  // 실제 검색 실행 횟수 +1 (디바운스가 잘 되면 이 숫자가 천천히 오른다)
  runCount += 1;
  runCountText.textContent = runCount;
  statusText.textContent = "검색 완료!";
  statusText.classList.remove("waiting");

  // (A) 입력값 다듬기: 앞뒤 공백 제거 + 소문자 통일.
  const keyword = searchInput.value.trim().toLowerCase();

  // (B) filter: 검색어가 포함된 항목만 골라 새 배열로 만든다.
  const matched = items.filter(function (item) {
    const text = item.dataset.keywords.toLowerCase();
    return text.includes(keyword);
  });

  // (C) 화면 갱신: 일단 전부 숨겼다가, 통과한 것만 다시 보여준다.
  items.forEach(function (item) {
    item.hidden = true;
  });
  matched.forEach(function (item) {
    item.hidden = false;
  });

  // (D) 개수 안내문 갱신.
  countText.textContent = matched.length + "곳";

  // (E) 결과가 0개면 "검색 결과가 없습니다" 안내를 보여준다.
  emptyMsg.hidden = matched.length !== 0;
}

// 5) ★ 디바운스의 핵심 ★
//    input 이벤트는 키를 칠 때마다 발생한다.
//    하지만 여기서는 곧장 검색하지 않고, "0.3초 뒤에 검색" 예약만 한다.
//    그 사이 또 키를 치면, 이전 예약을 취소(clearTimeout)하고 새로 예약한다.
//    → 결과적으로 "마지막으로 키를 친 뒤 0.3초 동안 조용할 때"만 검색이 실행된다.
searchInput.addEventListener("input", function () {
  // (1) 키 누른 횟수는 매번 올라간다 (이건 진짜로 매 입력마다 실행됨)
  keyCount += 1;
  keyCountText.textContent = keyCount;
  statusText.textContent = "입력 중... 멈추면 0.3초 뒤 검색합니다";
  statusText.classList.add("waiting");

  // (2) 직전에 걸어둔 예약이 있으면 취소한다.
  //     아직 0.3초가 지나기 전에 또 입력했다는 뜻이므로,
  //     이전 예약은 무효로 만들고 시계를 처음부터 다시 잰다.
  clearTimeout(timerId);

  // (3) 0.3초(300밀리초) 뒤에 runSearch 를 실행하도록 새로 예약한다.
  //     이 0.3초가 지나기 전에 다시 input 이 일어나면 (2)에서 취소된다.
  timerId = setTimeout(runSearch, 300);
});

// 6) 처음 화면이 뜰 때 전체 목록을 한 번 검색해 개수를 표시해 둔다.
//    (검색어가 빈 문자열 "" 이면 includes 가 항상 true → 전부 보임)
runSearch();
