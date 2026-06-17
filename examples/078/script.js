// ============================================
// 스크롤 진행률 바 + 헤더 색 변하기
// 핵심 개념: scrollY(얼마나 내렸는지)와
//           scrollHeight(전체 높이)로 비율을 계산한다.
// ============================================

// 화면에서 다룰 요소들을 미리 골라 둡니다.
const progressBar = document.getElementById("progress-bar");
const header = document.getElementById("site-header");
const percentLabel = document.getElementById("percent-label");

// 스크롤할 때마다 실행할 함수
function updateProgress() {
  // 1) 지금까지 내린 거리 (위에서부터 픽셀 단위)
  const scrollTop = window.scrollY;

  // 2) 스크롤이 가능한 전체 거리 계산
  //    전체 문서 높이 - 화면(창)에 보이는 높이 = 끝까지 내릴 수 있는 거리
  const docHeight = document.documentElement.scrollHeight; // 문서 전체 높이
  const winHeight = window.innerHeight;                    // 보이는 창 높이
  const scrollable = docHeight - winHeight;                // 내릴 수 있는 최대 거리

  // 3) 읽은 비율(%) = (내린 거리 / 내릴 수 있는 거리) × 100
  //    scrollable이 0이면(스크롤이 없으면) 0으로 처리해 나눗셈 오류를 막습니다.
  let percent = scrollable > 0 ? (scrollTop / scrollable) * 100 : 0;

  // 0~100 범위를 벗어나지 않도록 안전하게 보정
  percent = Math.min(100, Math.max(0, percent));

  // 4) 막대 길이와 라벨을 갱신
  progressBar.style.width = percent + "%";
  percentLabel.textContent = Math.round(percent) + "%";

  // 5) 조금이라도 스크롤하면 헤더에 'scrolled' 클래스를 붙여 색을 바꿉니다.
  if (scrollTop > 10) {
    header.classList.add("scrolled");
  } else {
    header.classList.remove("scrolled");
  }
}

// 스크롤이 일어날 때마다 위 함수를 실행
window.addEventListener("scroll", updateProgress);

// 페이지가 처음 열렸을 때도 한 번 실행 (새로고침 후 중간 위치 대비)
updateProgress();
