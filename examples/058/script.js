// 이 파일은 무엇? 버튼 클릭이라는 '동작'을 담당하는 자바스크립트입니다.
// 왜 있나? HTML(뼈대)만으로는 클릭해도 아무 일이 안 일어나기 때문에,
//          "버튼을 누르면 박스 색을 바꿔라"라는 행동을 여기서 연결해 줍니다.

// 1) 색이 바뀔 박스를 화면에서 찾아옵니다 (id="colorBox")
//    id는 페이지에서 단 하나뿐이라, getElementById로 콕 집어 가져옵니다.
const box = document.getElementById("colorBox");

// 2) 버튼 3개를 한 번에 모두 찾아옵니다 (class="btn")
//    버튼마다 코드를 따로 쓰지 않고 한 줄로 다 모으는 이유:
//    나중에 버튼을 더 추가해도 이 코드를 안 고쳐도 되게 하려는 것입니다.
const buttons = document.querySelectorAll(".btn");

// 3) 각 버튼에 "클릭하면 실행할 동작"을 연결합니다
buttons.forEach(function (button) {
  button.addEventListener("click", function () {
    // 버튼에 적어둔 data-color 값을 읽습니다 (예: "#e53935")
    // 색을 JS 코드 안에 직접 박지 않고 HTML의 data-color에서 꺼내 쓰는 이유:
    // 색을 바꾸거나 버튼을 늘릴 때 HTML만 고치면 되어 관리가 쉽기 때문입니다.
    const color = button.dataset.color;

    // 박스의 style.backgroundColor를 그 색으로 바꿉니다 (핵심!)
    box.style.backgroundColor = color;
  });
});
