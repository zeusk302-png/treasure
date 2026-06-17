// 1) HTML에서 id가 "message"인 <p> 문단을 찾아옵니다.
//    document.getElementById는 "이름표(id)로 요소 하나를 찾아줘"라는 뜻입니다.
const message = document.getElementById("message");

// 2) 글자를 바꿀 버튼(id="changeBtn")도 찾아옵니다.
const button = document.getElementById("changeBtn");

// 3) 버튼에 "클릭(click) 이벤트"를 연결합니다.
//    "버튼이 눌리면(click) 이 동작을 해줘"라고 등록하는 것입니다.
button.addEventListener("click", function () {
  // 4) 버튼을 누르면 이 안의 코드가 실행됩니다.
  //    textContent는 "그 요소 안에 들어 있는 글자"를 가리킵니다.
  //    여기에 새 문장을 넣어주면, 화면의 글자가 즉시 바뀝니다.
  message.textContent = "버튼을 눌러서 글자가 바뀌었어요! 🎉";
});
