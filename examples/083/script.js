// ============================================================
// 할 일 목록 업그레이드 — 완료 체크와 개수 표시
// 핵심 개념: "객체 배열"로 항목별 상태(완료 여부)를 저장하고,
//            필터링으로 남은 개수를 집계한다.
// ============================================================

// 1) 화면 요소들을 미리 찾아 변수에 담아둔다.
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const listEl = document.getElementById("todo-list");
const remainingEl = document.getElementById("remaining-count");
const emptyMessage = document.getElementById("empty-message");

// 2) 모든 할 일을 담는 "객체 배열".
//    각 할 일은 { id, text, done } 형태의 객체다.
//    - id   : 항목을 구분하는 고유 번호
//    - text : 할 일 내용
//    - done : 완료했는지 여부(true/false)
let todos = [];

// 3) 화면을 처음부터 다시 그리는 함수.
//    배열(todos)을 보고 화면(목록)을 만든다 = "데이터가 진실, 화면은 그림".
function render() {
  // 3-1) 기존에 그려둔 목록을 모두 지운다.
  listEl.innerHTML = "";

  // 3-2) 배열을 하나씩 돌면서 <li>를 만든다.
  todos.forEach(function (todo) {
    const li = document.createElement("li");
    li.className = "todo-item";
    // 완료된 항목이면 'done' 클래스를 추가해 줄을 긋는다(CSS가 담당).
    if (todo.done) {
      li.classList.add("done");
    }

    // 체크박스: 완료 여부를 켜고 끈다.
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.addEventListener("change", function () {
      toggleDone(todo.id);
    });

    // 할 일 텍스트.
    const span = document.createElement("span");
    span.className = "text";
    span.textContent = todo.text;

    // 삭제 버튼.
    const deleteBtn = document.createElement("button");
    deleteBtn.className = "delete-btn";
    deleteBtn.textContent = "×";
    deleteBtn.setAttribute("aria-label", "삭제");
    deleteBtn.addEventListener("click", function () {
      removeTodo(todo.id);
    });

    // 조립해서 화면에 붙인다.
    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(deleteBtn);
    listEl.appendChild(li);
  });

  // 3-3) 남은 개수 집계 + 빈 목록 안내 처리.
  updateCounter();
}

// 4) 남은(완료되지 않은) 할 일 개수를 세어 화면에 표시한다.
//    filter로 done이 false인 것만 골라 길이를 센다 = "필터링 집계".
function updateCounter() {
  const remaining = todos.filter(function (todo) {
    return todo.done === false;
  }).length;

  remainingEl.textContent = remaining;

  // 할 일이 하나도 없으면 안내 문구를 보여주고, 있으면 숨긴다.
  emptyMessage.style.display = todos.length === 0 ? "block" : "none";
}

// 5) 새 할 일을 배열에 추가한다.
function addTodo(text) {
  const newTodo = {
    id: Date.now(), // 현재 시각(밀리초)을 고유 번호로 사용
    text: text,
    done: false, // 처음엔 미완료 상태
  };
  todos.push(newTodo);
  render();
}

// 6) 특정 할 일의 완료 상태를 뒤집는다(체크 ↔ 해제).
function toggleDone(id) {
  todos = todos.map(function (todo) {
    if (todo.id === id) {
      // 같은 객체를 새 done 값으로 바꿔 돌려준다.
      return { id: todo.id, text: todo.text, done: !todo.done };
    }
    return todo;
  });
  render();
}

// 7) 특정 할 일을 배열에서 제거한다.
//    filter로 "그 id가 아닌 것만" 남긴다.
function removeTodo(id) {
  todos = todos.filter(function (todo) {
    return todo.id !== id;
  });
  render();
}

// 8) 폼 제출(추가 버튼 클릭 또는 Enter) 이벤트.
form.addEventListener("submit", function (event) {
  event.preventDefault(); // 폼 기본 동작(새로고침)을 막는다.

  const text = input.value.trim(); // 앞뒤 공백 제거
  if (text === "") {
    return; // 빈 칸이면 아무것도 하지 않는다.
  }

  addTodo(text);
  input.value = ""; // 입력칸 비우기
  input.focus(); // 다음 입력을 위해 커서 유지
});

// 9) 처음 화면을 한 번 그린다(빈 목록 안내가 보이도록).
render();
