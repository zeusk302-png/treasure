// ===== 별점(★) 평점 입력 위젯 =====
// 핵심 아이디어:
//  - 별 위에 마우스를 "올리면"(mouseover) → 그 별까지 미리보기로 채운다.
//  - 마우스를 "치우면"(mouseout) → 미리보기를 지우고, 클릭으로 고정한 점수로 되돌린다.
//  - 별을 "클릭하면"(click) → 그 점수를 고정 저장한다.
//  - "몇 개를 채울지"는 별마다 적어 둔 data-value(1~5) 숫자로 정한다. (인덱스 기반 채움)

// 1) 화면 요소 가져오기
const ratingBox = document.getElementById("rating");          // 별들을 담은 상자
const stars = ratingBox.querySelectorAll(".star");            // 별 5개(목록)
const result = document.getElementById("result");            // 점수를 글자로 보여 줄 곳

// 2) "지금 클릭으로 고정된 점수"를 기억하는 변수. 아직 안 골랐으면 0.
let selectedValue = 0;

// 3) 핵심 함수: "N개의 별을 채워라"
//    value(1~5)를 받아서, value 이하인 별에만 .filled 클래스를 붙입니다.
//    star.dataset.value 는 글자("3")라서 Number(...)로 숫자(3)로 바꿔 비교합니다.
function paintStars(value) {
  stars.forEach(function (star) {
    const starValue = Number(star.dataset.value); // 이 별의 점수(1~5)
    if (starValue <= value) {
      star.classList.add("filled");   // 이 별까지 채움
    } else {
      star.classList.remove("filled"); // 그 위 별은 비움
    }
  });
}

// 4) 별마다 이벤트를 연결합니다.
stars.forEach(function (star) {
  const starValue = Number(star.dataset.value);

  // (가) 마우스를 올리면 → 그 별까지 "미리보기"로 채움
  star.addEventListener("mouseover", function () {
    paintStars(starValue);
  });

  // (나) 별을 클릭하면 → 그 점수를 고정 저장하고 화면 글자도 갱신
  star.addEventListener("click", function () {
    selectedValue = starValue;                    // 점수 고정
    paintStars(selectedValue);                    // 고정된 만큼 채움
    result.textContent = selectedValue + " / 5 점을 선택했어요"; // 글자로 표시
    // 화면 낭독기에 현재 선택을 알려 주기(접근성)
    stars.forEach(function (s) {
      s.setAttribute("aria-checked", Number(s.dataset.value) === selectedValue ? "true" : "false");
    });
  });
});

// (다) 별 상자 전체에서 마우스가 빠져나가면 → 미리보기를 지우고,
//     "클릭으로 고정한 점수"로 되돌립니다.
//     (별 하나하나에 mouseout 을 걸면 옆 별로 옮길 때도 깜빡여서, 상자에 한 번만 겁니다.)
ratingBox.addEventListener("mouseout", function () {
  paintStars(selectedValue); // 아직 안 골랐으면 selectedValue 가 0이라 전부 비워집니다.
});
