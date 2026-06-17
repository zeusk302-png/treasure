// ===== 1) 화면에 있는 요소들을 변수로 잡아둡니다 =====
// getElementById는 HTML의 id로 그 요소를 찾아오는 명령입니다.
const countEl = document.getElementById("count"); // 숫자가 보이는 곳
const plusBtn = document.getElementById("plus");   // + 버튼
const minusBtn = document.getElementById("minus"); // - 버튼
const resetBtn = document.getElementById("reset"); // 초기화 버튼

// ===== 2) '상태'를 저장할 변수 =====
// 지금 카운터의 값을 이 변수 하나가 기억합니다. 처음 값은 0.
let count = 0;

// ===== 3) 변수 값을 화면에 그려주는 함수 =====
// count 변수가 바뀔 때마다 이 함수를 불러 화면을 최신 값으로 맞춥니다.
function render() {
  countEl.textContent = count; // span 안의 글자를 현재 count로 교체
}

// ===== 4) 버튼을 눌렀을 때 할 일 연결하기 =====
// + 버튼을 누르면 count를 1 늘리고(증가 연산), 다시 그립니다.
plusBtn.addEventListener("click", function () {
  count = count + 1; // count += 1; 과 같은 뜻
  render();
});

// - 버튼을 누르면 count를 1 줄이고(감소 연산), 다시 그립니다.
minusBtn.addEventListener("click", function () {
  count = count - 1; // count -= 1; 과 같은 뜻
  render();
});

// 초기화 버튼을 누르면 count를 0으로 되돌립니다.
resetBtn.addEventListener("click", function () {
  count = 0;
  render();
});

// ===== 5) 페이지가 열리자마자 한 번 그려서 시작값(0)을 표시 =====
render();
