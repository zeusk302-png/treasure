// 1) HTML에서 id가 "helloBtn"인 버튼을 찾아옵니다.
//    document.getElementById는 "이름표(id)로 요소 하나를 찾아줘"라는 뜻입니다.
const button = document.getElementById("helloBtn");

// 2) 그 버튼에 "클릭(click) 이벤트"를 연결합니다.
//    addEventListener는 "이런 일(click)이 일어나면, 이 동작을 실행해줘"라고 등록하는 것입니다.
//    => 여기서 '이벤트'란 "사용자가 버튼을 누른 순간 같은 사건"을 말합니다.
button.addEventListener("click", function () {
  // 3) 버튼을 누르면(=click 이벤트가 발생하면) 이 안의 코드가 실행됩니다.
  //    alert는 화면 위에 작은 알림창을 띄웁니다.
  alert("안녕하세요! 첫 이벤트가 동작했어요 🎉");
});
