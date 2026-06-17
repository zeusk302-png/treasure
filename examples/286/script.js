// index.html 에서 <script src="script.js" defer></script> 로 불러온다.

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
