// script.js — 갤러리 라이트박스의 "동작(움직임)"을 담당합니다.
// 무엇: 썸네일을 클릭하면 큰 사진을 띄우고, 좌우 버튼·키보드로 사진을 넘기고, 모달을 닫습니다.
// 왜: 화면(HTML)과 꾸밈(CSS)은 가만히 있는 그림일 뿐입니다.
//     "클릭하면 사진이 바뀐다" 같은 살아 있는 반응은 자바스크립트가 만듭니다.
//     이 파일은 index.html 맨 아래에서 불러오므로, 실행될 때는 화면 요소가 이미 다 만들어져 있습니다.

// ===== 1) 화면에서 필요한 요소들을 찾아옵니다 =====
const gallery = document.getElementById("gallery");       // 썸네일들이 담긴 상자
const thumbs = document.querySelectorAll(".thumb");        // 썸네일 버튼 5개 (목록)
const lightbox = document.getElementById("lightbox");      // 큰 사진을 띄우는 모달
const lightboxImg = document.getElementById("lightboxImg");// 모달 안의 큰 사진
const counter = document.getElementById("counter");        // "2 / 5" 같은 위치 표시
const closeBtn = document.getElementById("closeBtn");      // 닫기(X) 버튼
const prevBtn = document.getElementById("prevBtn");        // 이전(‹) 버튼
const nextBtn = document.getElementById("nextBtn");        // 다음(›) 버튼

// ===== 2) "지금 몇 번째 사진을 보고 있는지"를 기억하는 변수 =====
// 컴퓨터는 0부터 셉니다. 0이면 1번 사진, 1이면 2번 사진... 이런 식입니다.
let currentIndex = 0;

// 모든 썸네일 안의 <img> 를 모아 둡니다.
// 큰 사진을 띄울 때 "썸네일의 src 와 alt 를 그대로 가져다 쓰기" 위해서입니다.
const images = document.querySelectorAll(".thumb img");
const totalImages = images.length; // 사진 개수 (여기서는 5)

// ===== 3) 지정한 번째(index) 사진을 큰 화면에 그려주는 함수 =====
function showImage(index) {
  // 클릭한 썸네일의 사진 정보를 읽어서 큰 사진의 src/alt 를 "교체"합니다.
  // => 이것이 이번 실습의 핵심: "이미지 src 교체"
  lightboxImg.src = images[index].src;
  lightboxImg.alt = images[index].alt;

  // 화면 아래에 "현재 번호 / 전체 개수" 를 보여줍니다. (사람은 1부터 세므로 +1)
  counter.textContent = (index + 1) + " / " + totalImages;

  // 지금 보고 있는 번호를 변수에 저장해 둡니다. (이전/다음 버튼이 이 값을 씁니다)
  currentIndex = index;
}

// ===== 4) 라이트박스를 열고 닫는 함수 =====
function openLightbox(index) {
  showImage(index);          // 먼저 해당 사진을 그려 넣고
  lightbox.hidden = false;   // 숨겨져 있던 모달을 보이게 합니다
}

function closeLightbox() {
  lightbox.hidden = true;    // 모달을 다시 숨깁니다
}

// ===== 5) 이전 / 다음 사진으로 넘기는 함수 (인덱스 이동) =====
function showNext() {
  // 다음 번호로 +1. 만약 마지막(=totalImages-1)을 넘어가면 다시 0(처음)으로 돌아갑니다.
  // 나머지 연산(%)을 쓰면 "끝에서 처음으로 순환"을 한 줄로 만들 수 있습니다.
  const nextIndex = (currentIndex + 1) % totalImages;
  showImage(nextIndex);
}

function showPrev() {
  // 이전 번호로 -1. 0에서 더 내려가면 마지막 사진으로 돌아가야 합니다.
  // (currentIndex - 1 + totalImages) % totalImages 로 음수가 되는 걸 막습니다.
  const prevIndex = (currentIndex - 1 + totalImages) % totalImages;
  showImage(prevIndex);
}

// ===== 6) 클릭/키보드 같은 "이벤트"를 각 버튼에 연결합니다 =====

// 썸네일 5개에 각각 클릭 이벤트를 연결합니다.
thumbs.forEach(function (thumb) {
  thumb.addEventListener("click", function () {
    // 썸네일에 적어 둔 data-index 값을 읽습니다. (HTML 의 data-* 속성 → dataset 으로 접근)
    // data 속성은 글자(문자열)라서 Number(...) 로 숫자로 바꿔 줍니다.
    const index = Number(thumb.dataset.index);
    openLightbox(index);
  });
});

// 다음 / 이전 버튼
nextBtn.addEventListener("click", showNext);
prevBtn.addEventListener("click", showPrev);

// 닫기(X) 버튼
closeBtn.addEventListener("click", closeLightbox);

// 검은 배경(오버레이)을 누르면 닫기.
// 사진(자식 요소)이 아니라 배경(lightbox 자신)을 직접 눌렀을 때만 닫습니다.
lightbox.addEventListener("click", function (event) {
  if (event.target === lightbox) {
    closeLightbox();
  }
});

// 키보드로도 조작할 수 있게 합니다. (모달이 열려 있을 때만 동작)
document.addEventListener("keydown", function (event) {
  if (lightbox.hidden) return; // 모달이 닫혀 있으면 아무것도 안 함

  if (event.key === "Escape") closeLightbox(); // ESC = 닫기
  if (event.key === "ArrowRight") showNext();  // → = 다음
  if (event.key === "ArrowLeft") showPrev();   // ← = 이전
});
