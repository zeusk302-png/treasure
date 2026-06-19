// [이 파일은?] index.html 화면을 움직이는 자바스크립트입니다.
// [왜 있나?] HTML은 화면 모양만 그리고, "버튼을 누르면 글자를 바꾼다" 같은 동작은 이 파일이 담당합니다.
//            HTML과 동작을 따로 두면(분리하면) 나중에 코드가 길어져도 어디를 고칠지 찾기 쉬워서 이렇게 나눕니다.

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
