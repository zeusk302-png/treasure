// ===== 이미지 슬라이더 (이전/다음 버튼) =====
// 핵심 아이디어:
// 1) 이미지 5장을 가로로 한 줄(track)에 늘어놓는다.
// 2) "지금 몇 번째인가"를 숫자(index)로 기억한다.
// 3) 버튼을 누르면 index를 바꾸고, track을 그만큼 좌우로 민다(transform).
// 4) index가 배열의 끝/처음을 벗어나면 반대쪽으로 순환시킨다.

// 화면 요소들을 미리 찾아둡니다.
const track = document.getElementById("track");          // 이미지들을 담은 띠
const slides = track.querySelectorAll(".slide");         // 이미지 한 장 한 장 (배열처럼 다룸)
const prevBtn = document.getElementById("prevBtn");      // 이전 버튼
const nextBtn = document.getElementById("nextBtn");      // 다음 버튼
const currentLabel = document.getElementById("current"); // 현재 번호 표시
const totalLabel = document.getElementById("total");     // 전체 개수 표시

// 숫자 5를 직접 쓰지 않고 slides.length로 세는 이유:
// HTML에 <img class="slide">를 더 넣거나 빼도 JS를 고칠 필요 없이
// 전체 개수와 순환이 자동으로 맞춰지게 하기 위함입니다.
const total = slides.length; // 슬라이드 전체 장수 (여기서는 5)
let index = 0;               // 현재 보고 있는 슬라이드 번호 (0부터 시작)

// 전체 장수를 화면에 한 번 표시
totalLabel.textContent = total;

// 현재 index에 맞춰 화면을 다시 그리는 함수
function update() {
  // track을 왼쪽으로 (index * 100%)만큼 밀어서 해당 슬라이드를 창에 맞춥니다.
  // 예) index가 2이면 -200% 만큼 밀어 3번째 이미지를 보여줍니다.
  track.style.transform = `translateX(-${index * 100}%)`;

  // 사람이 읽는 번호는 1부터이므로 index + 1을 표시합니다.
  currentLabel.textContent = index + 1;
}

// 다음 버튼: index를 1 늘립니다. 마지막(끝)을 넘으면 처음(0)으로 순환.
nextBtn.addEventListener("click", () => {
  // (index + 1) % total 은 끝에 도달하면 자동으로 0이 되게 해줍니다.
  // 예) index가 4(마지막)일 때 (4 + 1) % 5 = 0 → 처음으로 돌아감
  index = (index + 1) % total;
  update();
});

// 이전 버튼: index를 1 줄입니다. 처음보다 작아지면 마지막으로 순환.
prevBtn.addEventListener("click", () => {
  // index - 1이 -1이 되는 것을 막으려고 total을 한 번 더해준 뒤 나머지를 구합니다.
  // 예) index가 0(처음)일 때 (0 - 1 + 5) % 5 = 4 → 마지막으로 이동
  index = (index - 1 + total) % total;
  update();
});

// 키보드 좌우 화살표로도 넘길 수 있게 (선택 기능)
document.addEventListener("keydown", (e) => {
  if (e.key === "ArrowRight") nextBtn.click();
  if (e.key === "ArrowLeft") prevBtn.click();
});

// 처음 페이지가 열렸을 때 한 번 그려줍니다.
update();
