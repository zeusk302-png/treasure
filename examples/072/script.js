// ===== 1) 필요한 요소들을 미리 찾아둡니다 =====
// saveBtn  : '저장하기' 버튼
// copyBtn  : '링크 복사' 버튼
// toastBox : 토스트(알림)들이 들어갈 자리
const saveBtn = document.getElementById("saveBtn");
const copyBtn = document.getElementById("copyBtn");
const toastBox = document.getElementById("toastBox");

// ===== 2) 토스트를 띄우는 함수 =====
// message : 화면에 보여줄 글자 (예: "저장됨")
// 이 함수 하나로 어떤 버튼이든 원하는 문구의 알림을 띄울 수 있습니다.
function showToast(message) {
  // (1) 알림 한 칸을 새로 만듭니다.
  //     createElement("div") = 빈 <div>를 만든다는 뜻입니다.
  const toast = document.createElement("div");
  toast.className = "toast";

  // (2) 내용 채우기: 초록 점 + 메시지 글자
  //     왼쪽의 점은 '성공'을 뜻하는 표시입니다.
  const dot = document.createElement("span");
  dot.className = "dot";
  toast.appendChild(dot);
  toast.appendChild(document.createTextNode(message));

  // (3) 만든 알림을 화면(컨테이너) 안에 넣습니다.
  toastBox.appendChild(toast);

  // (4) 살짝 시간차를 두고 'show' 클래스를 붙입니다.
  //     이렇게 해야 CSS의 transition(스르륵 효과)이 작동해
  //     아래에서 위로 부드럽게 떠오릅니다.
  //     requestAnimationFrame = '다음 화면 그릴 때' 실행하라는 예약입니다.
  requestAnimationFrame(function () {
    toast.classList.add("show");
  });

  // (5) ★핵심★ 3초(3000밀리초) 뒤에 사라지도록 '예약'합니다.
  //     setTimeout(할 일, 기다릴 시간) → 지정한 시간이 지나면 할 일을 한 번 실행합니다.
  //     이 줄을 만나는 순간 사라지는 게 아니라, '3초 뒤에 해라'라고 알람만 맞춰 둡니다.
  setTimeout(function () {
    // show를 떼면 다시 투명+아래로 내려가며 사라지는 모션이 시작됩니다.
    toast.classList.remove("show");

    // 사라지는 모션(0.25초)이 끝난 뒤, 빈 칸을 화면에서 완전히 제거합니다.
    // (안 지우면 보이지 않는 빈 칸이 계속 쌓입니다.)
    setTimeout(function () {
      toast.remove();
    }, 250);
  }, 3000);
}

// ===== 3) 버튼에 클릭을 연결합니다 =====
// 버튼마다 다른 문구로 showToast를 부르면 됩니다.
saveBtn.addEventListener("click", function () {
  showToast("저장됨");
});

copyBtn.addEventListener("click", function () {
  showToast("링크를 복사했어요");
});
