// =============================================================
// 실습 259 — Supabase Auth 로 게시판에 회원가입·로그인 붙이기
// =============================================================
//
// 이 실습의 한 가지 목표:
//   "로그인한 사람만 글을 쓰게" 만들어 인증(=누구냐)의 기초를 익힙니다.
//
//   - 글 읽기 : 누구나 (로그인 안 해도 목록이 보임)
//   - 글 쓰기 : 로그인한 사람만 (글쓰기 칸이 켜짐)
//
// 잠금은 '두 겹'입니다:
//   (a) 화면 : 로그아웃 상태면 글쓰기 칸을 disabled 로 잠금 (친절한 안내)
//   (b) DB   : RLS 정책으로 'authenticated(로그인) 만 INSERT' 강제 (진짜 자물쇠)
//   ※ 화면 잠금만으로는 막을 수 없습니다. 코드로 직접 insert 해도
//      로그인 안 했으면 DB가 거절합니다. 그래서 (b)가 '진짜 보안'입니다.

// -------------------------------------------------------------
// 1) 내 프로젝트 값 (Supabase 대시보드: Settings → API 에서 복사)
// -------------------------------------------------------------
//
// ▶ URL : 내 데이터베이스가 사는 인터넷 주소. 비밀이 아닙니다.
// ▶ anon key(공개 키, sb_publishable_...) : 브라우저에 그대로 박아도 되는 '출입증'.
//    - 공개돼도 안전한 이유는 표에 RLS(행 수준 보안)를 켜고
//      "누구나 읽기 + 로그인한 본인만 쓰기/삭제" 정책을 달았기 때문입니다. (schema.sql 참고)
//    - 반대로 service_role 키(= sb_secret_...)는 RLS를 통째로 '우회'하는 마스터 키라서
//      절대! 브라우저나 깃허브에 올리면 안 됩니다. (서버에서만 비밀로 사용)
//
// 아래 두 값은 '자리표시자(placeholder)'입니다. 내 진짜 anon 값으로 바꿔 주세요.
const SUPABASE_URL = "https://여기에-내-프로젝트-ID.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_여기에-내-anon-공개키-붙여넣기";

// -------------------------------------------------------------
// 2) 연결(클라이언트) 만들기
//    persistSession 기본값 true → 새로고침해도 로그인 상태가 유지됩니다(세션).
// -------------------------------------------------------------
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 화면 요소들 미리 잡아 두기
const emailEl = document.getElementById("email");
const passwordEl = document.getElementById("password");
const authForm = document.getElementById("authForm");
const signupBtn = document.getElementById("signupBtn");
const logoutBtn = document.getElementById("logoutBtn");
const loggedOutEl = document.getElementById("loggedOut");
const loggedInEl = document.getElementById("loggedIn");
const whoamiEl = document.getElementById("whoami");
const authStatusEl = document.getElementById("authStatus");

const postForm = document.getElementById("postForm");
const contentEl = document.getElementById("content");
const postBtn = document.getElementById("postBtn");
const postStatusEl = document.getElementById("postStatus");
const lockNoteEl = document.getElementById("lockNote");
const postListEl = document.getElementById("postList");

// 자리표시자를 안 바꾼 채 실행하면 무조건 실패하므로, 미리 알려 주는 도우미
function isPlaceholder() {
  return SUPABASE_URL.includes("여기에-내") || SUPABASE_ANON_KEY.includes("여기에-내");
}

// -------------------------------------------------------------
// 3) 안내/결과 메시지 표시 도우미
// -------------------------------------------------------------
function showStatus(el, kind, text) {
  el.hidden = false;
  el.className = "status " + kind; // info | ok | fail
  el.textContent = text;
}

// 날짜를 사람이 읽기 좋은 한국어로 (예: "6월 18일 14:30")
function formatDate(iso) {
  if (!iso) return "";
  return new Date(iso).toLocaleString("ko-KR", {
    month: "long", day: "numeric", hour: "2-digit", minute: "2-digit",
  });
}

// -------------------------------------------------------------
// 4) [핵심 ①] 로그인 상태에 따라 화면을 다시 그리기
//    로그인 → 글쓰기 칸 켜짐 / 로그아웃 → 글쓰기 칸 잠김
// -------------------------------------------------------------
function renderAuth(user) {
  if (user) {
    // 로그인 상태
    loggedOutEl.hidden = true;
    loggedInEl.hidden = false;
    whoamiEl.textContent = user.email;

    contentEl.disabled = false;          // ★ 글쓰기 칸 켜기
    postBtn.disabled = false;
    lockNoteEl.hidden = true;
  } else {
    // 로그아웃 상태
    loggedOutEl.hidden = false;
    loggedInEl.hidden = true;

    contentEl.disabled = true;           // ★ 글쓰기 칸 잠그기 (화면 잠금)
    postBtn.disabled = true;
    lockNoteEl.hidden = false;
  }
}

// -------------------------------------------------------------
// 5) [핵심 ②] 회원가입 — signUp
// -------------------------------------------------------------
signupBtn.addEventListener("click", async () => {
  const email = emailEl.value.trim();
  const password = passwordEl.value;
  if (!email || password.length < 6) {
    showStatus(authStatusEl, "fail", "이메일과 6자 이상 비밀번호를 입력하세요.");
    return;
  }

  showStatus(authStatusEl, "info", "회원가입 중…");
  const { data, error } = await db.auth.signUp({ email, password });

  if (error) {
    console.error("❌ 회원가입 실패:", error.message);
    showStatus(authStatusEl, "fail", "회원가입 실패: " + error.message);
    return;
  }

  // 프로젝트 설정에 따라 둘 중 하나입니다:
  //  - 이메일 확인 OFF → 바로 로그인됨(session 있음)
  //  - 이메일 확인 ON  → 확인 메일을 보내고 로그인은 보류(session 없음)
  if (data.session) {
    console.log("✅ 회원가입 + 바로 로그인 성공:", data.user.email);
    showStatus(authStatusEl, "ok", "가입 완료! 바로 로그인되었어요. 이제 글을 쓸 수 있어요.");
  } else {
    console.log("✅ 회원가입 성공(이메일 확인 필요):", email);
    showStatus(authStatusEl, "ok", "가입 메일을 보냈어요. 메일의 링크를 눌러 확인한 뒤 로그인하세요.");
  }
});

// -------------------------------------------------------------
// 6) [핵심 ③] 로그인 — signInWithPassword
// -------------------------------------------------------------
authForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // 폼 기본 새로고침 막기
  const email = emailEl.value.trim();
  const password = passwordEl.value;

  showStatus(authStatusEl, "info", "로그인 중…");
  const { error } = await db.auth.signInWithPassword({ email, password });

  if (error) {
    console.error("❌ 로그인 실패:", error.message);
    let friendly = "로그인 실패: " + error.message;
    if (error.message.includes("Invalid login credentials")) {
      friendly = "이메일 또는 비밀번호가 맞지 않아요. (처음이면 먼저 회원가입)";
    } else if (error.message.includes("Email not confirmed")) {
      friendly = "가입 확인 메일의 링크를 먼저 눌러 주세요.";
    }
    showStatus(authStatusEl, "fail", friendly);
    return;
  }

  console.log("✅ 로그인 성공:", email);
  // 성공하면 아래 onAuthStateChange 가 자동으로 호출되어 화면을 다시 그립니다.
});

// -------------------------------------------------------------
// 7) [핵심 ④] 로그아웃 — signOut
// -------------------------------------------------------------
logoutBtn.addEventListener("click", async () => {
  await db.auth.signOut();
  console.log("👋 로그아웃 완료");
  // onAuthStateChange 가 SIGNED_OUT 으로 호출되어 글쓰기 칸이 다시 잠깁니다.
});

// -------------------------------------------------------------
// 8) 글 목록 읽어 와서 그리기 (누구나 가능)
// -------------------------------------------------------------
async function loadPosts() {
  const { data, error } = await db
    .from("posts")
    .select("id, author, content, created_at")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ 글 목록 불러오기 실패:", error.message);
    postListEl.innerHTML = `<li class="empty">목록을 불러오지 못했어요: ${error.message}</li>`;
    return;
  }

  if (!data || data.length === 0) {
    postListEl.innerHTML = `<li class="empty">아직 글이 없어요. 로그인하고 첫 글을 써보세요!</li>`;
    return;
  }

  postListEl.innerHTML = data
    .map(
      (p) => `
      <li class="post">
        <p class="post-content"></p>
        <p class="post-meta">${escapeHtml(p.author || "익명")} · ${formatDate(p.created_at)}</p>
      </li>`
    )
    .join("");

  // 내용은 textContent 로 안전하게 넣습니다(아래 escapeHtml 참고).
  postListEl.querySelectorAll(".post-content").forEach((el, i) => {
    el.textContent = data[i].content;
  });
}

// 화면에 글쓴이 이메일 등을 안전하게 넣기 위한 작은 도우미(XSS 방지).
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// -------------------------------------------------------------
// 9) [핵심 ⑤] 글 올리기 — INSERT (로그인해야만 통과)
// -------------------------------------------------------------
postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  const content = contentEl.value.trim();
  if (!content) {
    showStatus(postStatusEl, "fail", "글 내용을 입력하세요.");
    return;
  }

  // 지금 로그인한 사람이 누구인지 확인(이메일을 글쓴이 표시용으로 함께 저장).
  const { data: { user } } = await db.auth.getUser();
  if (!user) {
    showStatus(postStatusEl, "fail", "로그인이 풀렸어요. 다시 로그인해 주세요.");
    return;
  }

  postBtn.disabled = true; // 연타 방지
  showStatus(postStatusEl, "info", "글을 올리는 중…");

  // user_id 는 schema.sql 의 default auth.uid() 가 자동으로 채워 줍니다.
  // (author 는 화면 표시용 이메일 — 편의를 위해 함께 저장)
  const { error } = await db
    .from("posts")
    .insert({ content: content, author: user.email });

  postBtn.disabled = false;

  if (error) {
    console.error("❌ 글 저장 실패:", error.message);
    let friendly = "글을 올리지 못했어요: " + error.message;
    // ★ 로그인 안 한 상태로 코드가 직접 insert 를 시도하면 RLS 가 막습니다 ★
    if (error.message.includes("row-level security") || error.message.includes("violates row-level")) {
      friendly = "로그인한 사람만 글을 쓸 수 있어요(보안 정책). 로그인 후 다시 시도하세요.";
    } else if (error.message.includes("does not exist")) {
      friendly = "posts 표가 없어요. schema.sql을 Supabase SQL Editor에서 먼저 실행하세요.";
    } else if (error.message.includes("Invalid API key")) {
      friendly = "anon 키가 틀린 것 같아요. script.js의 SUPABASE_ANON_KEY를 다시 확인하세요.";
    } else if (error.message.includes("Failed to fetch")) {
      friendly = "연결에 실패했어요. SUPABASE_URL 철자와 https:// 를 확인하세요.";
    }
    showStatus(postStatusEl, "fail", friendly);
    return;
  }

  console.log("✅ 글 저장 성공:", content);
  showStatus(postStatusEl, "ok", "글이 올라갔어요!");
  contentEl.value = "";
  loadPosts(); // 목록 새로고침
});

// -------------------------------------------------------------
// 10) [핵심 ⑥] 로그인/로그아웃 순간마다 화면을 다시 그리기
//     - 페이지를 열 때, 로그인할 때, 로그아웃할 때 모두 여기로 들어옵니다.
//     - 새로고침해도 세션이 남아 있으면 user 가 채워져 들어옵니다.
// -------------------------------------------------------------
db.auth.onAuthStateChange((event, session) => {
  console.log("인증 상태 변화:", event);
  renderAuth(session ? session.user : null);
});

// -------------------------------------------------------------
// 11) 실행 트리거 — 페이지가 열리면 곧바로 시작
// -------------------------------------------------------------
async function init() {
  if (isPlaceholder()) {
    console.warn(
      "⚠️ 아직 자리표시자 그대로입니다. script.js의 SUPABASE_URL / SUPABASE_ANON_KEY를 내 anon 값으로 바꾸세요."
    );
    showStatus(authStatusEl, "fail", "아직 내 프로젝트 값이 입력되지 않았어요 (script.js 수정 필요)");
    return;
  }

  // 현재 세션(로그인 상태) 확인 → 화면 그리기
  const { data: { session } } = await db.auth.getSession();
  renderAuth(session ? session.user : null);

  // 글 목록은 로그인 여부와 상관없이 누구나 볼 수 있습니다.
  loadPosts();
}

init();
