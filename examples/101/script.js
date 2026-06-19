// ============================================
// 실시간 검색 필터
// 핵심 개념: input 이벤트 + filter / includes() 로 목록 즉시 걸러내기
// ============================================

// 1) 화면 요소들을 미리 골라 변수에 담아둔다.
const searchInput = document.getElementById("searchInput");
const list = document.getElementById("list");
const countText = document.getElementById("count");
const emptyMsg = document.getElementById("empty");

// 2) 목록의 모든 항목(li)을 한 번에 모아둔다.
//    querySelectorAll 은 조건에 맞는 요소를 "여러 개" 모아 배열처럼 돌려준다.
//    Array.from(...) 으로 진짜 배열로 바꿔 filter 같은 도구를 쓸 수 있게 한다.
const items = Array.from(list.querySelectorAll("li"));

// 3) "입력할 때마다" 실행되는 함수.
//    input 이벤트는 키 입력·붙여넣기·삭제 등 값이 바뀔 때마다 발생한다.
searchInput.addEventListener("input", function () {
  // (A) 입력값을 다듬는다: 앞뒤 공백 제거 + 소문자로 통일.
  //     소문자로 맞춰두면 'Cafe' 와 'cafe' 를 똑같이 취급할 수 있다.
  const keyword = searchInput.value.trim().toLowerCase();

  // (B) filter: 조건이 true 인 항목만 골라 새 배열로 만든다.
  //     includes(keyword): 그 항목의 단어 묶음 안에 검색어가 "포함"되면 true.
  const matched = items.filter(function (item) {
    // data-keywords 에 미리 적어둔 검색용 단어들을 가져온다.
    const text = item.dataset.keywords.toLowerCase();
    return text.includes(keyword); // 포함되면 보이고, 아니면 숨긴다.
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
  //     matched.length !== 0 → 결과가 있으면 true(=숨김), 0개면 false(=보임).
  //     hidden 에 직접 참/거짓을 넣어, if 문 없이 한 줄로 보였다/숨겼다 처리한다.
  emptyMsg.hidden = matched.length !== 0;
});

// 4) 처음 화면이 뜰 때 전체 개수를 한 번 표시해 둔다.
//    (검색어가 빈 문자열 "" 이면 includes 가 항상 true → 전부 보임)
countText.textContent = items.length + "곳";
