// 1) 화면에서 다룰 요소들을 미리 골라 둡니다.
const textarea = document.getElementById("intro"); // 입력칸
const countEl = document.getElementById("count");  // 현재 글자 수가 들어갈 자리
const counterBox = document.querySelector(".counter"); // 카운터 전체 영역
const MAX = 100; // 최대 글자 수 (HTML의 maxlength와 같은 값)

// 2) 글자 수를 화면에 다시 그려주는 함수
function updateCount() {
  // 입력칸에 적힌 글자의 개수 = value.length
  const length = textarea.value.length;

  // textContent로 숫자만 바꿔 끼웁니다. ("23" 처럼)
  countEl.textContent = length;

  // 90자 이상이면 경고 색(warning 클래스)을 켜고, 아니면 끕니다.
  if (length >= 90) {
    counterBox.classList.add("warning");
  } else {
    counterBox.classList.remove("warning");
  }
}

// 3) 타이핑할 때마다(input 이벤트) updateCount를 실행합니다.
//    input 이벤트는 글자가 바뀌는 "순간"마다 발생합니다.
textarea.addEventListener("input", updateCount);

// 4) 페이지가 처음 열렸을 때도 한 번 실행해
//    (예: 새로고침 후 남아 있는 글자) 정확한 숫자로 시작하게 합니다.
updateCount();
