// =============================================================
// 할 일 목록(To-Do) 앱 - 추가와 삭제
//
// 핵심 아이디어:
//  1) 할 일들을 자바스크립트 "배열(todos)"에 저장한다.
//  2) 배열이 바뀔 때마다 화면을 처음부터 "다시 그린다(render)".
//     -> 화면을 직접 조금씩 고치는 것보다, 배열을 진실의 원본으로
//        삼고 매번 새로 그리는 방식이 훨씬 단순하고 실수가 적다.
// =============================================================

// 1. 화면에서 필요한 요소들을 미리 찾아둔다.
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const emptyMsg = document.getElementById("empty-msg");
const countEl = document.getElementById("count");

// 2. 할 일을 담아 둘 배열. 각 항목은 { id, text } 모양의 객체다.
//    id는 삭제할 때 "어떤 항목인지" 구분하기 위한 고유 번호.
let todos = [];

// 3. 배열(todos)을 보고 화면을 처음부터 다시 그리는 함수
function render() {
  // (1) 기존에 그려져 있던 목록을 싹 비운다.
  list.innerHTML = "";

  // (2) 할 일이 하나도 없으면 안내 문구를 보여주고 끝낸다.
  if (todos.length === 0) {
    emptyMsg.style.display = "block";
  } else {
    emptyMsg.style.display = "none";
  }

  // (3) 배열의 항목 하나하나를 <li>로 만들어 목록에 붙인다.
  todos.forEach(function (todo) {
    // li 요소 만들기
    const li = document.createElement("li");

    // 할 일 글자를 담을 span
    const span = document.createElement("span");
    span.textContent = todo.text;

    // 삭제 버튼 만들기
    const delBtn = document.createElement("button");
    delBtn.textContent = "삭제";
    delBtn.className = "delete-btn";
    // 이 버튼을 누르면 해당 id를 가진 항목을 삭제한다.
    delBtn.addEventListener("click", function () {
      removeTodo(todo.id);
    });

    // li 안에 span과 버튼을 넣고, li를 목록에 붙인다.
    li.appendChild(span);
    li.appendChild(delBtn);
    list.appendChild(li);
  });

  // (4) 남은 할 일 개수를 갱신한다.
  countEl.textContent = todos.length;
}

// 4. 할 일을 추가하는 함수
function addTodo(text) {
  // 고유 id로 현재 시간(밀리초)을 쓴다. 항목마다 다른 값이 보장된다.
  const newTodo = {
    id: Date.now(),
    text: text,
  };
  // 배열 끝에 새 항목을 넣는다(push).
  todos.push(newTodo);
  render(); // 배열이 바뀌었으니 다시 그린다.
}

// 5. 할 일을 삭제하는 함수
function removeTodo(id) {
  // filter: id가 일치하지 '않는' 항목만 남겨 새 배열을 만든다.
  //         즉, 누른 항목만 빠지고 나머지는 그대로 남는다.
  todos = todos.filter(function (todo) {
    return todo.id !== id;
  });
  render(); // 배열이 바뀌었으니 다시 그린다.
}

// 6. 폼이 제출될 때(추가 버튼 클릭 또는 Enter) 실행
form.addEventListener("submit", function (event) {
  event.preventDefault(); // 폼 기본 동작(새로고침)을 막는다.

  const text = input.value.trim(); // 앞뒤 공백 제거

  // 빈 칸이거나 공백만 입력했으면 추가하지 않는다.
  if (text === "") {
    return;
  }

  addTodo(text);
  input.value = ""; // 입력칸을 비운다.
  input.focus(); // 바로 다음 할 일을 적을 수 있게 커서를 둔다.
});

// 7. 처음 화면을 한 번 그려준다(빈 목록 + 안내 문구).
render();
