// =============================================================
// 할 일 목록 완성판 - localStorage로 영구 저장 + 전체/진행/완료 필터
//
// 이 실습은 지금까지 배운 것을 한 화면에 모두 합친 "졸업 작품"이다.
//  1) 할 일들을 객체 배열(todos)에 담는다.        -> 083에서 배움
//  2) 배열이 바뀌면 화면을 처음부터 다시 그린다.   -> 082에서 배움
//  3) 배열을 JSON 글자로 바꿔 localStorage에 저장. -> 084의 확장
//  4) 새로고침하면 저장해 둔 글자를 다시 객체로 되살린다.
//  5) "전체 / 진행 중 / 완료" 필터로 보고 싶은 것만 보여준다.  <- 이번에 추가
// =============================================================

// 1. 화면에서 필요한 요소들을 미리 찾아둔다.
const form = document.getElementById("todo-form");
const input = document.getElementById("todo-input");
const list = document.getElementById("todo-list");
const emptyMsg = document.getElementById("empty-msg");
const countEl = document.getElementById("count");
const filtersBox = document.getElementById("filters");
const clearDoneBtn = document.getElementById("clear-done");

// 2. localStorage에서 데이터를 꺼낼 때 쓸 "이름표(키)".
//    이 이름표로 저장하고, 같은 이름표로 다시 꺼낸다.
const STORAGE_KEY = "my-todos";

// 3. 두 가지 상태(state)를 변수로 들고 있는다.
//    - todos: 할 일 객체들의 배열. 각 항목은 { id, text, done } 모양.
//    - currentFilter: 지금 보고 있는 필터. "all" | "active" | "done"
let todos = loadTodos();      // 저장된 게 있으면 불러오고, 없으면 빈 배열
let currentFilter = "all";    // 처음엔 "전체"를 보여준다.

// 4. localStorage에서 할 일 배열을 불러오는 함수
function loadTodos() {
  // getItem은 저장된 "글자"를 돌려준다. 저장된 게 없으면 null.
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    return []; // 처음 방문이면 빈 배열로 시작
  }
  // JSON.parse: 저장돼 있던 글자를 다시 진짜 배열/객체로 되살린다.
  // 혹시 저장값이 깨져 있어도 앱이 멈추지 않도록 try/catch로 감싼다.
  try {
    return JSON.parse(saved);
  } catch (e) {
    return [];
  }
}

// 5. 현재 todos 배열을 localStorage에 저장하는 함수
function saveTodos() {
  // JSON.stringify: 배열/객체를 저장 가능한 "한 줄 글자"로 바꾼다.
  localStorage.setItem(STORAGE_KEY, JSON.stringify(todos));
}

// 6. 현재 필터에 맞는 항목만 골라내는 함수
function getVisibleTodos() {
  if (currentFilter === "active") {
    // 진행 중 = 아직 완료(done)가 아닌 것
    return todos.filter(function (todo) {
      return !todo.done;
    });
  }
  if (currentFilter === "done") {
    // 완료 = done이 true인 것
    return todos.filter(function (todo) {
      return todo.done;
    });
  }
  // "all"이면 전부 그대로 보여준다.
  return todos;
}

// 7. 배열(todos)을 보고 화면을 처음부터 다시 그리는 함수
function render() {
  // (1) 기존에 그려져 있던 목록을 싹 비운다.
  list.innerHTML = "";

  // (2) 지금 필터에 맞는 항목만 골라온다.
  const visible = getVisibleTodos();

  // (3) 보여줄 항목이 하나도 없으면 안내 문구를 띄운다.
  if (visible.length === 0) {
    emptyMsg.style.display = "block";
    // 필터에 따라 안내 문구를 살짝 다르게 보여주면 더 친절하다.
    if (todos.length === 0) {
      emptyMsg.textContent = "아직 할 일이 없어요. 위에 입력해 보세요!";
    } else if (currentFilter === "active") {
      emptyMsg.textContent = "진행 중인 할 일이 없어요. 다 끝냈네요!";
    } else if (currentFilter === "done") {
      emptyMsg.textContent = "완료한 할 일이 아직 없어요.";
    } else {
      emptyMsg.textContent = "보여줄 할 일이 없어요.";
    }
  } else {
    emptyMsg.style.display = "none";
  }

  // (4) 걸러낸 항목 하나하나를 <li>로 만들어 목록에 붙인다.
  visible.forEach(function (todo) {
    const li = document.createElement("li");
    // 완료된 항목이면 li에 done 클래스를 붙여 줄긋기 스타일을 적용한다.
    if (todo.done) {
      li.className = "done";
    }

    // 완료 여부를 켜고 끄는 체크박스
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;
    checkbox.addEventListener("change", function () {
      toggleTodo(todo.id);
    });

    // 할 일 글자를 담을 span
    const span = document.createElement("span");
    span.textContent = todo.text;

    // 삭제 버튼
    const delBtn = document.createElement("button");
    delBtn.textContent = "삭제";
    delBtn.className = "delete-btn";
    delBtn.addEventListener("click", function () {
      removeTodo(todo.id);
    });

    // li 안에 체크박스, 글자, 삭제 버튼을 넣고 목록에 붙인다.
    li.appendChild(checkbox);
    li.appendChild(span);
    li.appendChild(delBtn);
    list.appendChild(li);
  });

  // (5) "남은 할 일" = 아직 완료되지 않은 항목 수 (필터와 상관없이 전체 기준)
  const remaining = todos.filter(function (todo) {
    return !todo.done;
  }).length;
  countEl.textContent = remaining;
}

// 8. 할 일을 추가하는 함수
function addTodo(text) {
  const newTodo = {
    id: Date.now(), // 항목마다 다른 고유 번호(현재 시간 밀리초)
    // 왜 고유 번호가 필요한가: 나중에 체크/삭제할 때 "어느 항목인지"를 이 id로 콕 집기 때문.
    // 글자(text)는 똑같은 할 일이 둘일 수 있어 기준으로 못 쓴다.
    text: text,
    done: false,    // 새 할 일은 아직 완료되지 않은 상태
  };
  todos.push(newTodo);
  saveTodos(); // 배열이 바뀌었으니 저장하고
  render();    // 다시 그린다.
}

// 9. 완료/미완료를 켜고 끄는 함수
function toggleTodo(id) {
  todos = todos.map(function (todo) {
    if (todo.id === id) {
      // done 값을 반대로 뒤집은 새 객체로 바꾼다.
      return { id: todo.id, text: todo.text, done: !todo.done };
    }
    return todo; // 나머지는 그대로 둔다.
  });
  saveTodos();
  render();
}

// 10. 할 일을 하나 삭제하는 함수
function removeTodo(id) {
  // filter: id가 일치하지 '않는' 항목만 남긴다. 누른 항목만 빠진다.
  todos = todos.filter(function (todo) {
    return todo.id !== id;
  });
  saveTodos();
  render();
}

// 11. 폼이 제출될 때(추가 버튼 클릭 또는 Enter) 실행
form.addEventListener("submit", function (event) {
  event.preventDefault(); // 폼 기본 동작(새로고침)을 막는다.

  const text = input.value.trim(); // 앞뒤 공백 제거
  if (text === "") {
    return; // 빈 칸이거나 공백만이면 추가하지 않는다.
  }

  addTodo(text);
  input.value = ""; // 입력칸을 비운다.
  input.focus();    // 바로 다음 할 일을 적을 수 있게 커서를 둔다.
});

// 12. 필터 버튼 영역 클릭 처리
//     버튼이 여러 개라도 부모(filtersBox) 하나에만 이벤트를 건다.
//     (이벤트 위임: 클릭된 게 어떤 버튼인지 event.target으로 알아낸다.)
filtersBox.addEventListener("click", function (event) {
  const btn = event.target.closest(".filter-btn");
  if (!btn) {
    return; // 버튼이 아닌 빈 공간을 눌렀으면 무시
  }

  // 현재 필터 값을 버튼의 data-filter에서 읽어 바꾼다.
  currentFilter = btn.dataset.filter;

  // 모든 필터 버튼에서 active를 떼고, 누른 버튼에만 다시 붙인다.
  const allBtns = filtersBox.querySelectorAll(".filter-btn");
  allBtns.forEach(function (b) {
    b.classList.remove("active");
  });
  btn.classList.add("active");

  render(); // 필터가 바뀌었으니 다시 그린다. (저장은 필요 없음)
});

// 13. "완료 항목 비우기" 버튼: 완료된 것들만 한 번에 삭제
clearDoneBtn.addEventListener("click", function () {
  // 완료되지 않은(!done) 항목만 남긴다.
  todos = todos.filter(function (todo) {
    return !todo.done;
  });
  saveTodos();
  render();
});

// 14. 처음 화면을 한 번 그려준다.
//     (저장돼 있던 할 일이 있으면 이때 화면에 그대로 나타난다.)
render();
