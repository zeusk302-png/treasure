// 이 파일: 실시간 글자 수 카운터의 "동작"을 담당하는 자바스크립트입니다.
// 무엇: 입력칸에 타이핑할 때마다 글자 수를 세어 화면의 "0/100"을 갱신하고,
//       90자가 넘으면 경고색을 켭니다.
// 왜 있나: HTML은 모양만 그릴 뿐 스스로 숫자를 못 셉니다. "타이핑 -> 글자 세기 -> 화면 갱신"
//         이라는 살아있는 반응을 붙여주는 곳이 바로 이 파일입니다.

// 1) 화면에서 다룰 요소들을 미리 골라 둡니다.
//    (함수가 실행될 때마다 다시 찾으면 낭비라, 맨 위에서 한 번만 찾아 변수에 담아 둡니다.)
const textarea = document.getElementById("intro"); // 입력칸
const countEl = document.getElementById("count");  // 현재 글자 수가 들어갈 자리
const counterBox = document.querySelector(".counter"); // 카운터 전체 영역
const MAX = 100; // 최대 글자 수 (HTML의 maxlength와 같은 값)

// 2) 글자 수를 화면에 다시 그려주는 함수
function updateCount() {
  // 입력칸에 적힌 글자의 개수 = value.length
  const length = textarea.value.length;

  // textContent로 숫자만 바꿔 끼웁니다. ("23" 처럼)
  // innerHTML이 아니라 textContent를 쓰는 이유: textContent는 글자를 "글자 그대로"만 넣어
  // 사용자가 입력한 <script> 같은 태그가 실행되지 않습니다(XSS 방지). 화면에 숫자만 보일 땐
  // textContent가 안전하고 더 빠릅니다.
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
