// =============================================================
// 실습 121 — 할 일 완료 상태를 update로 서버에 반영하기
// =============================================================
//
// 120번 앱은 '추가(insert)'와 '목록 보기(select)'만 됐습니다.
// 이번에는 체크박스로 완료/미완료를 바꾸면, 그 줄만 골라 서버에 저장합니다.
//
// ★ 이번 실습의 한 줄 핵심 ★
//   db.from("todos").update({ done: true }).eq("id", id)
//
//   - update({ done: true }) : "done 칸을 true로 바꿔라"   (무엇을 바꿀지)
//   - .eq("id", id)          : "id가 이 값인 줄만!"        (어느 줄을 바꿀지)
//
//   ※ .eq("id", id)를 빠뜨리면 todos 표의 '모든 줄'이 한꺼번에 바뀝니다(대형 사고).
//     update에는 'eq로 대상 한 건 콕 집기'가 거의 항상 짝꿍처럼 따라옵니다.
//
//   [120번까지]                          [121번 추가분]
//   insert (추가)  · select (목록)   →   update (완료 토글) 추가
//   서버 통신은 시간이 걸리는 일(비동기)이라 여기서도 async/await로 기다립니다.

// -------------------------------------------------------------
// 1) 내 프로젝트 값 (Supabase 대시보드: Settings → API 에서 복사)
// -------------------------------------------------------------
//
// ▶ URL : 내 데이터베이스가 사는 인터넷 주소. 비밀이 아닙니다.
// ▶ anon key(공개 키, sb_publishable_...) : 브라우저에 그대로 박아도 되는 '출입증'.
//    RLS(행 수준 보안)와 정책이 켜져 있어서 공개해도 안전합니다(schema.sql에서 설정함).
//    ★ service_role 키(= sb_secret_...)는 RLS를 통째로 우회하는 마스터 키라
//      절대! 브라우저·코드·깃허브에 넣으면 안 됩니다.
//
// 아래 두 값은 '자리표시자(placeholder)'입니다. 내 진짜 anon 값으로 바꿔 주세요.
const SUPABASE_URL = "https://여기에-내-프로젝트-ID.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_여기에-내-anon-공개키-붙여넣기";

// -------------------------------------------------------------
// 2) 연결(클라이언트) 만들기
// -------------------------------------------------------------
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 화면 요소들 미리 잡아 두기
const todoInput = document.getElementById("todoInput"); // 할 일 입력칸
const addBtn = document.getElementById("addBtn");        // 추가 버튼
const todoList = document.getElementById("todoList");    // 할 일이 들어갈 ul
const statusEl = document.getElementById("status");      // 상태 안내 박스

// 자리표시자를 안 바꾼 채 실행하면 무조건 실패하므로, 미리 알려 주는 도우미
function isPlaceholder() {
  return SUPABASE_URL.includes("여기에-내") || SUPABASE_ANON_KEY.includes("여기에-내");
}

// -------------------------------------------------------------
// 3) [목록] 서버에서 할 일을 불러와 화면에 그리는 함수  (select)
// -------------------------------------------------------------
async function loadTodos() {
  showStatus("info", "불러오는 중…");

  try {
    const { data, error } = await db
      .from("todos")
      .select("*")
      .order("created_at", { ascending: true }); // 만든 순서대로(오래된 것이 위)

    if (error) throw error;

    console.log("✅ 불러오기 성공! 할 일 " + data.length + "개:", data);
    render(data);
    hideStatus();
  } catch (err) {
    console.error("❌ 불러오기 실패:", err.message);
    showStatus("fail", friendlyError("목록 불러오기 실패", err));
  }
}

// -------------------------------------------------------------
// 4) [추가] 할 일을 서버에 저장하고, 성공하면 목록을 다시 그리는 함수 (insert)
// -------------------------------------------------------------
async function addTodo(text) {
  addBtn.disabled = true;
  showStatus("info", "저장 중…");

  try {
    const { error } = await db
      .from("todos")
      .insert({ text: text }); // done 은 표의 기본값 false 가 들어감

    if (error) throw error;

    console.log("✅ 저장 성공:", text);
    todoInput.value = "";       // 입력칸 비우기
    await loadTodos();          // 새로고침 없이 최신 목록으로 다시 그리기
    showStatus("ok", "저장 완료!");
    todoInput.focus();
  } catch (err) {
    console.error("❌ 저장 실패:", err.message);
    showStatus("fail", friendlyError("저장 실패", err));
  } finally {
    addBtn.disabled = false;    // 성공/실패 무관 항상 버튼 잠금 해제
  }
}

// -------------------------------------------------------------
// ★ 5) [완료 토글] 체크박스를 누르면 그 줄만 골라 done 값을 바꾸는 함수 (update) ★
// -------------------------------------------------------------
//   이번 실습의 주인공입니다.
//   - id      : 어떤 줄을 바꿀지 (목록을 그릴 때 각 줄의 todo.id 를 기억해 둡니다)
//   - newDone : 새 완료 상태 (체크하면 true, 체크 해제하면 false)
async function toggleDone(id, newDone) {
  showStatus("info", "완료 상태 저장 중…");

  try {
    const { error } = await db
      .from("todos")
      .update({ done: newDone }) // 무엇을 바꿀지: done 칸을 새 값으로
      .eq("id", id);             // 어느 줄을: id가 이 값인 '한 줄만'

    if (error) throw error;

    console.log("✅ 완료 상태 저장:", { id: id, done: newDone });
    await loadTodos();           // 서버 기준으로 목록을 다시 그려 화면과 서버를 일치시킴
    showStatus("ok", newDone ? "완료로 표시했어요!" : "다시 할 일로 돌렸어요!");
  } catch (err) {
    console.error("❌ 완료 상태 저장 실패:", err.message);
    // 실패하면 서버는 안 바뀌었으니, 다시 그려서 체크박스를 원래대로 되돌립니다.
    await loadTodos();
    showStatus("fail", friendlyError("완료 상태 저장 실패", err));
  }
}

// -------------------------------------------------------------
// 6) 받아온 할 일 배열을 화면 목록(ul)에 그리는 함수
// -------------------------------------------------------------
function render(todos) {
  todoList.innerHTML = ""; // 중복 방지: 다시 그리기 전에 비우기

  if (todos.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "아직 할 일이 없어요. 위에서 추가해 보세요.";
    todoList.appendChild(li);
    return;
  }

  todos.forEach((todo) => {
    const li = document.createElement("li");
    if (todo.done) li.classList.add("done"); // 완료면 줄긋기 스타일(.done) 적용

    // (1) 완료 체크박스 — 이번 실습에서 새로 추가된 부분
    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.checked = todo.done;            // 서버의 done 값을 그대로 반영
    // 체크박스를 누르면 → 그 줄(todo.id)만 골라 update 실행
    checkbox.addEventListener("change", () => {
      toggleDone(todo.id, checkbox.checked);
    });

    // (2) 할 일 글자
    const text = document.createElement("span");
    text.className = "text";
    text.textContent = todo.text;
    // 보안 팁: textContent 사용 → 사용자가 적은 <script> 등이 '글자 그대로' 표시되어
    // XSS(악성코드 삽입)를 막습니다. innerHTML로 사용자 입력을 넣으면 위험합니다.

    // (3) 만든 시각
    const when = document.createElement("span");
    when.className = "when";
    when.textContent = formatTime(todo.created_at);

    li.appendChild(checkbox);
    li.appendChild(text);
    li.appendChild(when);
    todoList.appendChild(li);
  });
}

// -------------------------------------------------------------
// 7) 보조 함수들
// -------------------------------------------------------------
function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 에러 메시지를 비전공자도 알아볼 수 있게 풀어 줍니다.
function friendlyError(prefix, err) {
  const msg = err.message || "";
  if (msg.includes("row-level security")) {
    // 이번 실습에서 가장 흔한 에러: update 정책을 안 만든 경우
    return prefix + ": 수정(update) 정책이 없어서 막혔어요. schema.sql의 4단계(update 정책)를 실행하세요.";
  }
  if (msg.includes("does not exist") || msg.includes("relation")) {
    return prefix + ": todos 표가 아직 없어요. schema.sql 1단계(표 만들기)부터 실행하세요.";
  }
  if (msg.includes("Invalid API key")) {
    return prefix + ": anon 키가 잘못됐어요. script.js의 SUPABASE_ANON_KEY를 다시 확인하세요.";
  }
  return prefix + ": " + msg;
}

function showStatus(kind, text) {
  const icon = kind === "fail" ? "❌ " : kind === "ok" ? "✅ " : "ℹ️ ";
  statusEl.textContent = icon + text;
  statusEl.classList.remove("info", "ok", "fail");
  statusEl.classList.add(kind);
}

function hideStatus() {
  statusEl.classList.remove("info", "ok", "fail");
}

// -------------------------------------------------------------
// 8) 실행 트리거
// -------------------------------------------------------------
if (isPlaceholder()) {
  console.warn(
    "⚠️ 아직 자리표시자 그대로입니다. script.js의 SUPABASE_URL / SUPABASE_ANON_KEY를 내 anon 값으로 바꾸세요."
  );
  showStatus("fail", "아직 내 프로젝트 값이 입력되지 않았어요 (script.js 수정 필요)");
} else {
  loadTodos(); // (1) 페이지가 열리면 자동으로 한 번 서버 목록을 불러오기

  // (2) [추가] 버튼 클릭 시: 할 일을 서버에 저장 → 목록 갱신
  addBtn.addEventListener("click", () => {
    const text = todoInput.value.trim(); // 앞뒤 공백 제거
    if (text === "") {
      showStatus("fail", "할 일을 입력해 주세요.");
      return;
    }
    addTodo(text);
  });

  // (3) Enter 키로도 추가할 수 있게 연결
  todoInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      addBtn.click();
    }
  });
}
