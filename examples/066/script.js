// ============================================================
//  이 파일(script.js): 좋아요 하트의 '동작(누르면 일어나는 일)'을 담당합니다.
//  - 무엇: 하트를 누르면 빈 하트↔빨간 하트로 토글하고, 좋아요 숫자를 +1/-1 합니다.
//  - 왜 이렇게 짰나: 'liked·likeCount 같은 상태(데이터)는 변수에 모아두고,
//    화면 그리기는 render() 한 곳에만 모은다'는 패턴을 씁니다. 이렇게 하면
//    "상태를 바꾼다 → render()를 부른다" 한 가지 흐름만 기억하면 되어
//    화면과 데이터가 어긋날 일이 줄어듭니다. (앞으로 배울 리액트 등의 기본 사고방식)
// ============================================================

// ===== 1) 화면에 있는 요소들을 변수로 잡아둡니다 =====
// getElementById는 HTML의 id로 그 요소를 찾아오는 명령입니다.
const likeBtn = document.getElementById("likeBtn"); // 하트 버튼 전체
const heartEl = document.getElementById("heart");   // 하트 글자(♡ / ♥)
const countEl = document.getElementById("count");   // 좋아요 숫자가 보이는 곳

// ===== 2) 두 가지 '상태'를 변수로 저장합니다 =====
// liked: 지금 좋아요를 누른 상태인지(true) 아닌지(false) — 토글 상태
let liked = false;
// likeCount: 좋아요가 몇 개인지 — 숫자 상태 (처음엔 12개가 있다고 가정)
let likeCount = 12;

// ===== 3) 두 상태를 한꺼번에 화면에 그려주는 함수 =====
// liked, likeCount 둘 중 하나라도 바뀌면 이 함수를 불러 화면을 최신으로 맞춥니다.
function render() {
  // (1) 숫자 표시 갱신
  countEl.textContent = likeCount;

  // (2) 하트 모양과 색 갱신
  if (liked) {
    heartEl.textContent = "♥";          // 꽉 찬 하트
    likeBtn.classList.add("liked");      // CSS에서 빨간색이 되는 클래스 붙이기
    likeBtn.setAttribute("aria-pressed", "true"); // 보조기기에 '눌림' 알림
  } else {
    heartEl.textContent = "♡";          // 빈 하트
    likeBtn.classList.remove("liked");   // 빨간색 클래스 떼기 → 다시 회색
    likeBtn.setAttribute("aria-pressed", "false");
  }
}

// ===== 4) 하트 버튼을 눌렀을 때 할 일 =====
likeBtn.addEventListener("click", function () {
  // 토글: true면 false로, false면 true로 뒤집습니다.
  liked = !liked;

  // 토글 결과에 따라 숫자도 함께 바꿉니다.
  if (liked) {
    likeCount = likeCount + 1; // 좋아요를 눌렀으니 +1
  } else {
    likeCount = likeCount - 1; // 좋아요를 취소했으니 -1
  }

  // 바뀐 두 상태를 화면에 반영합니다.
  render();
});

// ===== 5) 페이지가 열리자마자 한 번 그려서 시작 상태를 표시 =====
render();
