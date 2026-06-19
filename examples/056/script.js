// 이 파일: "첫 이벤트" 실습의 동작(자바스크립트)입니다.
// 무엇을: 화면의 버튼을 찾아, 그 버튼이 "클릭되는 순간(이벤트)"에 알림창을 띄웁니다.
// 왜 있나: HTML(index.html)은 화면을 "보여주기"만 합니다. 버튼을 눌렀을 때 "무슨 일이 일어나게"
//          하려면 자바스크립트가 필요합니다. 이 파일이 화면(버튼)과 동작(알림창)을 연결합니다.

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
