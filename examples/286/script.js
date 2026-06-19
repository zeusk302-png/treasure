// 이 파일은 무엇인가?
//   비동기(async) 순서 꼬임 버그를 "고친 정답 버전"의 자바스크립트다.
//   index.html 에서 <script src="script.js" defer></script> 로 불러온다.
// 왜 있는가?
//   같은 폴더의 broken.html 은 await 없이 데이터를 받아 목록이 늘 비어 보인다.
//   이 파일은 async/await 로 "데이터가 도착할 때까지 기다렸다가 그리도록" 순서를 바로잡아,
//   before(broken) ↔ after(이 파일)를 비교 학습할 수 있게 한다.

// 진짜 서버 대신, 0.5초 뒤에 응답이 도착하는 가짜 API를 흉내 낸다.
// 실제 fetch("...주소...") 도 "응답이 나중에 온다"는 점이 똑같다.
function fetchTodos() {
  return new Promise(function (resolve) {
    setTimeout(function () {
      resolve(["우유 사기", "운동 30분", "이메일 답장하기"]);
    }, 500);
  });
}

// ✅ 고친 핵심 1: 함수 앞에 async 를 붙인다.
//    async 함수 안에서만 await 를 쓸 수 있다.
async function loadTodos() {
  const statusEl = document.getElementById("status");
  const listEl = document.getElementById("todoList");

  try {
    // ✅ 고친 핵심 2: await 로 "응답이 도착할 때까지 기다린" 다음 결과를 받는다.
    //    이제 todos 에는 Promise 가 아니라 진짜 배열 ["우유 사기", ...] 이 들어 있다.
    const todos = await fetchTodos();
    console.log("받은 데이터:", todos); // → (3) ["우유 사기", "운동 30분", "이메일 답장하기"]

    // 데이터가 "도착한 뒤"에 화면을 그린다.
    for (let i = 0; i < todos.length; i++) {
      const li = document.createElement("li");
      // textContent 로 글자만 넣는다(왜?): innerHTML 로 넣으면 데이터에 섞인
      // <script> 같은 태그가 실제로 실행될 수 있어(XSS 위험) 그걸 막으려는 것.
      li.textContent = todos[i];
      listEl.appendChild(li);
    }

    statusEl.textContent = "할 일 " + todos.length + "개를 불러왔습니다.";
  } catch (error) {
    // 실제 fetch 에서는 네트워크가 끊기는 등 실패할 수 있으니 대비해 둔다.
    statusEl.textContent = "불러오기에 실패했습니다. 잠시 후 다시 시도해 주세요.";
    console.error("할 일 불러오기 실패:", error);
  }
}

loadTodos();
