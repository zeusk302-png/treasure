// ===========================================================
// 블로그 태그 필터
// 핵심 개념: 글 목록을 "배열처럼" 다루며,
//           선택한 태그와 글의 태그를 비교해(filter 개념)
//           보일 글/숨길 글을 정하고 화면을 다시 그린다.
// ===========================================================

// 1) 다룰 요소들을 미리 골라둔다
const filterBox = document.getElementById("filter"); // 버튼들이 담긴 상자
const posts = document.querySelectorAll(".post"); // 글 카드 전부 (여러 개 묶음)
const emptyMsg = document.getElementById("empty"); // "글이 없어요" 안내문

// 2) 버튼 상자 하나에만 클릭 동작을 붙인다.
//    (버튼마다 붙이지 않고 부모에 한 번만 붙이는 방법 = 이벤트 위임)
filterBox.addEventListener("click", function (event) {
  // 진짜로 눌린 게 태그 버튼인지 확인한다. 버튼이 아니면 무시.
  const clickedBtn = event.target.closest(".tag-btn");
  if (!clickedBtn) return;

  // 눌린 버튼이 가진 기준 태그를 읽는다. 예: "여행", "all"
  const selectedTag = clickedBtn.dataset.tag;

  // 3) 버튼 강조(활성 클래스) 옮기기: 모두 끄고, 누른 것만 켠다
  const allBtns = filterBox.querySelectorAll(".tag-btn");
  allBtns.forEach(function (btn) {
    btn.classList.remove("is-active");
  });
  clickedBtn.classList.add("is-active");

  // 4) 글을 다시 걸러서 화면을 갱신한다
  applyFilter(selectedTag);
});

// 선택한 태그에 맞게 글을 보이거나 숨기는 함수
function applyFilter(tag) {
  let visibleCount = 0; // 화면에 남은 글이 몇 개인지 센다

  posts.forEach(function (post) {
    // 이 글이 가진 태그
    const postTag = post.dataset.tag;

    // "전체(all)"이거나, 글의 태그가 선택한 태그와 같으면 보여준다
    const shouldShow = tag === "all" || postTag === tag;

    if (shouldShow) {
      post.classList.remove("is-hidden"); // 보이기
      visibleCount++;
    } else {
      post.classList.add("is-hidden"); // 숨기기
    }
  });

  // 5) 보일 글이 하나도 없으면 안내문을 띄우고, 있으면 감춘다
  emptyMsg.hidden = visibleCount !== 0;
}
