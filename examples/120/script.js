// =============================================================
// 실습 120 — 할 일 앱: localStorage → Supabase 마이그레이션
// =============================================================
//
// 110번 할 일 앱은 데이터를 '내 브라우저(localStorage)'에만 저장했습니다.
// 이번에는 똑같은 앱을 'Supabase 서버의 todos 표'에 저장하도록 바꿉니다.
//
// ★ 마이그레이션이란? ★
//   "데이터를 한 보관 장소에서 다른 보관 장소로 옮기는 것"입니다.
//   여기서는 '브라우저 저장소' → '서버 데이터베이스'로 옮깁니다.
//   앱이 하는 일(추가/목록 보기)은 그대로지만, 저장 코드만 바뀝니다.
//
//   [110번 localStorage 방식]          →   [120번 Supabase 방식]
//   localStorage.setItem(...)          →   await db.from("todos").insert(...)   (추가)
//   localStorage.getItem(...)          →   await db.from("todos").select(...)   (목록)
//   JSON.stringify / JSON.parse 필요   →   필요 없음 (서버가 알아서 표로 저장)
//   id = Date.now()로 직접 생성        →   서버가 id를 자동으로 매겨 줌
//
//   가장 큰 차이: 서버와 통신은 '시간이 걸리는 일(비동기)'이라
//   async/await 로 "기다렸다가" 결과를 받습니다(118에서 배운 방식).

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
//   110번에서는 localStorage.getItem + JSON.parse 였던 부분이
//   여기서는 db.from("todos").select(...) 로 바뀝니다.
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
//   110번에서는 todos.push(text) + saveTodos() 였던 부분이
//   여기서는 db.from("todos").insert(...) 로 바뀝니다.
//   (id 는 직접 안 만듭니다. 서버가 자동으로 매겨 줍니다.)
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
// 5) 받아온 할 일 배열을 화면 목록(ul)에 그리는 함수
// -------------------------------------------------------------
//   이 부분은 110번과 거의 똑같습니다(데이터를 화면에 뿌리는 일).
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

    const text = document.createElement("span");
    text.textContent = todo.text;
    // 보안 팁: textContent 사용 → 사용자가 적은 <script> 등이 '글자 그대로' 표시되어
    // XSS(악성코드 삽입)를 막습니다. innerHTML로 사용자 입력을 넣으면 위험합니다.

    const when = document.createElement("span");
    when.className = "when";
    when.textContent = formatTime(todo.created_at);

    li.appendChild(text);
    li.appendChild(when);
    todoList.appendChild(li);
  });
}

// -------------------------------------------------------------
// 6) 보조 함수들
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
    return prefix + ": RLS는 켜졌는데 정책이 없어서 막혔어요. schema.sql의 3단계(정책)를 실행하세요.";
  }
  if (msg.includes("does not exist") || msg.includes("relation")) {
    return prefix + ": todos 표가 아직 없어요. schema.sql 1단계(표 만들기)를 실행하세요.";
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
// 7) 실행 트리거
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
