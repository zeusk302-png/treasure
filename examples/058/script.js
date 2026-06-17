// 1) 색이 바뀔 박스를 화면에서 찾아옵니다 (id="colorBox")
const box = document.getElementById("colorBox");

// 2) 버튼 3개를 한 번에 모두 찾아옵니다 (class="btn")
const buttons = document.querySelectorAll(".btn");

// 3) 각 버튼에 "클릭하면 실행할 동작"을 연결합니다
buttons.forEach(function (button) {
  button.addEventListener("click", function () {
    // 버튼에 적어둔 data-color 값을 읽습니다 (예: "#e53935")
    const color = button.dataset.color;

    // 박스의 style.backgroundColor를 그 색으로 바꿉니다 (핵심!)
    box.style.backgroundColor = color;
  });
});
