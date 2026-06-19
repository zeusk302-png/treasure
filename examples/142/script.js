// ============================================================
// 실습 142 — RLS 침투 테스트 로직
//   "막혀야 정상"을 자동으로 판정해 줍니다.
//   - 결과가 비어 있거나 / 에러로 거부되면 → "안전(막힘)" (초록)
//   - 남의 데이터가 실제로 새거나 / 끼워 넣기·삭제가 성공하면 → "위험(뚫림)" (빨강)
// ============================================================

// ---- 화면 요소 모으기 ----
const testView    = document.getElementById("testView");
const userArea    = document.getElementById("userArea");
const userEmailEl  = document.getElementById("userEmail");

const authForm  = document.getElementById("authForm");
const emailEl   = document.getElementById("email");
const passwordEl = document.getElementById("password");
const signupBtn = document.getElementById("signupBtn");
const authMsg   = document.getElementById("authMsg");
const logoutBtn = document.getElementById("logoutBtn");

const logEl = document.getElementById("log");

// 현재 로그인한 사람의 user_id (콘솔에서 복사해 ②③에 붙여 쓰기 편하라고 보관)
let myUserId = null;

// ============================================================
// 로그인 상태에 따라 화면 전환
// ============================================================
async function refreshView() {
  const { data } = await db.auth.getUser();
  const user = data.user;

  if (user) {
    myUserId = user.id;
    userEmailEl.textContent = user.email;
    userArea.hidden = false;
    testView.hidden = false;
    addLog("info",
      "로그인됨: " + user.email +
      " · 내 user_id = " + user.id +
      " (이 값을 다른 계정에서 ②③ 칸에 붙여 넣어 '남의 id'로 공격해 보세요)");
  } else {
    myUserId = null;
    userArea.hidden = true;
    testView.hidden = true;
  }
}

// ============================================================
// 회원가입 / 로그인 / 로그아웃
// ============================================================
authForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  showAuthMsg("로그인 중…", "info");
  const { error } = await db.auth.signInWithPassword({
    email: emailEl.value.trim(),
    password: passwordEl.value,
  });
  if (error) { showAuthMsg("로그인 실패: " + error.message, "error"); return; }
  clearAuthMsg();
  refreshView();
});

signupBtn.addEventListener("click", async () => {
  if (!emailEl.value || passwordEl.value.length < 6) {
    showAuthMsg("이메일과 6자 이상 비밀번호를 입력하세요.", "error");
    return;
  }
  showAuthMsg("가입 중…", "info");
  const { data, error } = await db.auth.signUp({
    email: emailEl.value.trim(),
    password: passwordEl.value,
  });
  if (error) { showAuthMsg("가입 실패: " + error.message, "error"); return; }
  if (!data.session) {
    showAuthMsg("가입 완료! 메일함의 인증 링크를 누른 뒤 로그인하세요.", "info");
    return;
  }
  clearAuthMsg();
  refreshView();
});

logoutBtn.addEventListener("click", async () => {
  await db.auth.signOut();
  refreshView();
  addLog("info", "로그아웃됨. 다른 계정으로 로그인해 교차 검증을 이어가세요.");
});

// ============================================================
// 2단계 · 정상 동작 (대조군)
// ============================================================
document.getElementById("addMemoBtn").addEventListener("click", async () => {
  const content = "테스트 메모 " + new Date().toLocaleTimeString("ko-KR");
  // user_id를 안 적는다 → 테이블 default auth.uid() 가 '나'로 채움
  const { error } = await db.from("memos").insert({ content });
  if (error) {
    addLog("danger", "내 메모 추가가 실패했습니다(이건 의도와 다름): " + error.message);
  } else {
    addLog("safe", "정상: 내 이름으로 메모가 추가됨 (\"" + content + "\")");
  }
});

document.getElementById("listMineBtn").addEventListener("click", async () => {
  const { data, error } = await db.from("memos").select("*").order("created_at");
  if (error) { addLog("danger", "조회 에러: " + error.message); return; }
  addLog("safe",
    "정상: 내 메모 " + data.length + "개가 보임. " +
    "(여기 보이는 건 전부 내 것이어야 합니다)");
});

// ============================================================
// 3단계 · 공격 시도 — 전부 "막힘"이 나와야 정상
// ============================================================

// ① 필터 없이 전부 훔쳐보기
document.getElementById("stealAllBtn").addEventListener("click", async () => {
  const { data, error } = await db.from("memos").select("user_id, content");
  if (error) { addLog("safe", "① 막힘: 요청이 거부됨 (" + error.message + ")"); return; }

  // '남의 줄'이 섞여 있는지 확인 — 내 user_id가 아닌 행이 하나라도 있으면 유출!
  const leaked = data.filter((r) => r.user_id !== myUserId);
  if (leaked.length === 0) {
    addLog("safe",
      "① 안전: '전부 달라'고 했지만 RLS가 걸러서 내 메모 " + data.length +
      "개만 돌아옴. 남의 메모 0개 유출.");
  } else {
    addLog("danger",
      "① 위험! 남의 메모 " + leaked.length + "개가 새어 나옴!! " +
      "RLS가 안 켜졌거나 SELECT 정책이 잘못된 것입니다. schema.sql을 다시 실행하세요.");
  }
});

// ② 특정 user_id로 콕 집어 훔쳐보기
document.getElementById("stealByIdBtn").addEventListener("click", async () => {
  const target = document.getElementById("targetUserId").value.trim();
  if (!target) { addLog("info", "② 훔쳐볼 상대 user_id를 칸에 붙여넣으세요."); return; }

  const { data, error } = await db.from("memos").select("*").eq("user_id", target);
  if (error) { addLog("safe", "② 막힘: 요청 거부됨 (" + error.message + ")"); return; }

  if (target === myUserId) {
    addLog("info", "② 그건 '내' id입니다. 남의 id를 넣어야 진짜 공격 테스트가 됩니다.");
  } else if (data.length === 0) {
    addLog("safe",
      "② 안전: 남의 user_id로 콕 집어 요청해도 빈 배열 []. " +
      "RLS가 '주인이 아닌 행'을 결과에서 제거했습니다.");
  } else {
    addLog("danger",
      "② 위험! 남의 메모 " + data.length + "개가 보임!! SELECT 정책을 점검하세요.");
  }
});

// ③ 남 이름(user_id)으로 글 끼워 넣기
document.getElementById("spoofInsertBtn").addEventListener("click", async () => {
  const fakeId = document.getElementById("spoofUserId").value.trim();
  if (!fakeId) { addLog("info", "③ 가짜로 적을 user_id를 칸에 붙여넣으세요."); return; }

  // user_id를 일부러 '남의 것'으로 적어 insert 시도
  const { error } = await db
    .from("memos")
    .insert({ content: "몰래 심은 글", user_id: fakeId });

  if (error) {
    addLog("safe",
      "③ 안전: with check 정책에 막혀 작성 실패 (" + error.message + "). " +
      "남의 이름으로 글을 심을 수 없습니다.");
  } else if (fakeId === myUserId) {
    addLog("info", "③ 그건 '내' id라 정상 작성입니다. 남의 id로 시도해야 공격 테스트가 됩니다.");
  } else {
    addLog("danger",
      "③ 위험! 남의 이름으로 글이 심어졌습니다!! INSERT 정책의 with check를 점검하세요.");
  }
});

// ④ 남의 메모 행 삭제
document.getElementById("deleteOtherBtn").addEventListener("click", async () => {
  const id = document.getElementById("deleteId").value.trim();
  if (!id) { addLog("info", "④ 지울 메모 id(숫자)를 넣으세요."); return; }

  // 삭제된 행을 돌려받도록 select() 를 붙임 → 0줄이면 아무것도 못 지운 것
  const { data, error } = await db.from("memos").delete().eq("id", id).select();
  if (error) { addLog("safe", "④ 막힘: 삭제 거부됨 (" + error.message + ")"); return; }

  if (data.length === 0) {
    addLog("safe",
      "④ 안전: 0줄 삭제됨. 내 것이 아닌 메모는 '보이지도 않아' 지울 대상이 없습니다.");
  } else {
    // 내 것을 지운 경우는 정상 / 남의 것을 지웠다면 위험
    addLog("info",
      "④ " + data.length + "줄 삭제됨. 만약 방금 '내' 메모 id를 넣었다면 정상입니다. " +
      "'남의' 메모 id였는데 지워졌다면 DELETE 정책을 점검하세요!");
  }
});

// ============================================================
// 작은 도우미들
// ============================================================
function addLog(type, text) {
  const li = document.createElement("li");
  li.className = "log-item " + type; // safe / danger / info (색깔 구분용 클래스)
  const time = new Date().toLocaleTimeString("ko-KR");
  // innerHTML로 시간 span을 끼워 넣되, text는 반드시 escapeHtml로 통과시킨다.
  // 왜? 로그에 들어가는 text 안에 에러 메시지나 메모 내용 등 '사용자/서버가 만든 값'이 섞일 수 있는데,
  // 그대로 innerHTML에 넣으면 그 안의 <script> 등이 실행되는 XSS가 될 수 있어 미리 무해화하는 것.
  li.innerHTML = '<span class="t">' + time + '</span> ' + escapeHtml(text);
  logEl.prepend(li); // 최신 로그가 맨 위에 보이도록 append 대신 prepend
}

document.getElementById("clearLogBtn").addEventListener("click", () => {
  logEl.innerHTML = "";
});

function showAuthMsg(text, type) {
  authMsg.textContent = text;
  authMsg.className = "show " + (type || "info");
}
function clearAuthMsg() { authMsg.textContent = ""; authMsg.className = ""; }

// escapeHtml: 위험한 문자(& < > " ')를 화면에 '글자 그대로' 보이도록 바꿔 주는 함수.
// 왜 필요? innerHTML로 글을 넣을 때 이 변환을 거치면 <script> 같은 게 코드로 실행되지 않고
// 그냥 "<script>"라는 텍스트로만 보여서 XSS(악성 스크립트 주입)를 막을 수 있기 때문.
function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])
  );
}

// 페이지가 열리면 현재 로그인 상태부터 확인
refreshView();
