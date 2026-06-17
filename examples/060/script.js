// 1) 화면에서 다룰 요소들을 미리 찾아 둡니다.
//    - moreText : 펼쳤다 접었다 할 글 부분 (처음엔 hidden 속성이 붙어 숨겨져 있음)
//    - toggleBtn: 누를 때마다 펼치기/접기를 바꾸는 버튼
var moreText = document.getElementById("moreText");
var toggleBtn = document.getElementById("toggleBtn");

// 2) 버튼에 "클릭하면 실행할 동작"을 연결합니다.
toggleBtn.addEventListener("click", function () {
  // moreText.hidden 은 true(숨김) 또는 false(보임) 값을 가집니다.
  // 지금이 숨김 상태인지 먼저 확인합니다.
  var isHidden = moreText.hidden;

  if (isHidden) {
    // 숨겨져 있었다면 → 보이게 펼칩니다.
    moreText.hidden = false;
    toggleBtn.textContent = "접기";
    // 접근성 표시: 지금은 펼쳐진 상태라고 알려줍니다.
    toggleBtn.setAttribute("aria-expanded", "true");
  } else {
    // 보이고 있었다면 → 다시 숨겨 접습니다.
    moreText.hidden = true;
    toggleBtn.textContent = "더보기";
    toggleBtn.setAttribute("aria-expanded", "false");
  }
});

// (참고) 위 if/else는 한 줄로도 쓸 수 있습니다.
//   moreText.hidden = !moreText.hidden;
// 이렇게 하면 true는 false로, false는 true로 "뒤집기" 됩니다.
// 처음 배울 때는 if/else가 동작 흐름을 이해하기 더 쉬워서 이렇게 썼습니다.
