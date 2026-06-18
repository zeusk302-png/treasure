// =============================================================
// 실습 258 — 커뮤니티 게시판: 글 작성(C) + 목록 표시(R)
// =============================================================
//
// CRUD 라는 말이 있습니다. 데이터로 할 수 있는 4가지 동작의 머리글자예요.
//   C = Create (만들기/저장)   ← 이번 실습에서 만듭니다 (글 올리기)
//   R = Read   (읽기/조회)     ← 이번 실습에서 만듭니다 (글 목록 보기)
//   U = Update (수정)          ← 다음 실습들에서 다룹니다
//   D = Delete (삭제)          ← 다음 실습들에서 다룹니다
//
// 즉 이번엔 "글을 저장하고(INSERT), 저장된 글을 불러와 화면에 그리는(SELECT)"
// 게시판의 절반을 만듭니다.

// -------------------------------------------------------------
// 1) 내 프로젝트 값 (Supabase 대시보드: Settings → API 에서 복사)
// -------------------------------------------------------------
//
// ▶ URL : 내 데이터베이스가 사는 인터넷 주소. 비밀이 아닙니다.
// ▶ anon key(공개 키, sb_publishable_...) : 브라우저에 그대로 박아도 되는 '출입증'.
//    - 공개돼도 안전한 이유는 표에 RLS(행 수준 보안)를 켜고
//      "읽기(SELECT) + 저장(INSERT)만 허용" 정책을 달았기 때문입니다. (schema.sql 참고)
//    - 반대로 service_role 키(= sb_secret_...)는 RLS를 통째로 '우회'하는 마스터 키라서
//      절대! 브라우저나 깃허브에 올리면 안 됩니다. (서버에서만 비밀로 사용)
//
// 아래 두 값은 '자리표시자(placeholder)'입니다. 내 진짜 anon 값으로 바꿔 주세요.
const SUPABASE_URL = "https://여기에-내-프로젝트-ID.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_여기에-내-anon-공개키-붙여넣기";

// -------------------------------------------------------------
// 2) 연결(클라이언트) 만들기
// -------------------------------------------------------------
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 화면 요소들 미리 잡아 두기
const formEl = document.getElementById("form");
const authorEl = document.getElementById("author");
const contentEl = document.getElementById("content");
const submitEl = document.getElementById("submit");
const statusEl = document.getElementById("status");
const listEl = document.getElementById("list");
const countEl = document.getElementById("count");

// 자리표시자를 안 바꾼 채 실행하면 무조건 실패하므로, 미리 알려 주는 도우미
function isPlaceholder() {
  return SUPABASE_URL.includes("여기에-내") || SUPABASE_ANON_KEY.includes("여기에-내");
}

// -------------------------------------------------------------
// 3) 안내/결과 메시지 표시 도우미
// -------------------------------------------------------------
function showStatus(kind, text) {
  statusEl.hidden = false;
  statusEl.className = "status " + kind; // info | ok | fail
  statusEl.textContent = text;
}

// -------------------------------------------------------------
// 4) 안전하게 글자 보여 주기 (중요 — XSS 방지)
// -------------------------------------------------------------
// 다른 사람이 쓴 글에 <script> 같은 코드가 들어 있을 수 있습니다.
// 그것을 그대로 innerHTML 로 넣으면 '남이 쓴 코드'가 내 화면에서 실행됩니다(위험).
// 그래서 화면에 글을 넣을 땐 innerHTML 이 아니라 textContent 를 씁니다.
// textContent 는 무엇이 들어와도 '그냥 글자'로만 취급하므로 안전합니다.

// 시간을 '몇 분 전 / 몇 시간 전' 같이 보기 좋게 바꿔 주는 도우미
function timeAgo(isoString) {
  const diffSec = Math.floor((Date.now() - new Date(isoString).getTime()) / 1000);
  if (diffSec < 60) return "방금 전";
  if (diffSec < 3600) return Math.floor(diffSec / 60) + "분 전";
  if (diffSec < 86400) return Math.floor(diffSec / 3600) + "시간 전";
  return Math.floor(diffSec / 86400) + "일 전";
}

// -------------------------------------------------------------
// 5) [핵심 ①] 글 목록 불러오기 — SELECT (Read)
// -------------------------------------------------------------
// .select("*")                : 모든 칸을 가져온다.
// .order("created_at", desc)  : 최신 글이 맨 위로 오게 정렬한다.
// .limit(50)                  : 너무 많이 받지 않도록 최근 50개만.
async function loadPosts() {
  const { data, error } = await db
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);

  if (error) throw error;
  return data; // 글 객체들의 배열
}

// -------------------------------------------------------------
// 6) [핵심 ②] 받아 온 글 목록을 화면에 그리기
// -------------------------------------------------------------
function renderPosts(posts) {
  listEl.innerHTML = ""; // 기존 목록 비우기
  countEl.textContent = "(" + posts.length + ")";

  if (posts.length === 0) {
    const empty = document.createElement("li");
    empty.className = "empty";
    empty.textContent = "아직 글이 없어요. 첫 글을 남겨 보세요!";
    listEl.appendChild(empty);
    return;
  }

  posts.forEach((post) => {
    const li = document.createElement("li");
    li.className = "post";

    // 글쓴이 + 시간 줄
    const meta = document.createElement("div");
    meta.className = "post-meta";

    const author = document.createElement("span");
    author.className = "post-author";
    author.textContent = post.author; // ★ textContent → 안전 ★

    const time = document.createElement("span");
    time.className = "post-time";
    time.textContent = timeAgo(post.created_at);

    meta.appendChild(author);
    meta.appendChild(time);

    // 글 내용
    const body = document.createElement("p");
    body.className = "post-body";
    body.textContent = post.content; // ★ textContent → 안전 ★

    li.appendChild(meta);
    li.appendChild(body);
    listEl.appendChild(li);
  });
}

// 목록을 다시 불러와 다시 그리는 한 묶음 동작 (자주 쓰므로 함수로)
async function refreshList() {
  try {
    const posts = await loadPosts();
    renderPosts(posts);
  } catch (err) {
    console.error("❌ 목록 불러오기 실패:", err.message);
    showStatus("fail", friendlyError(err, "목록을 불러오지 못했어요"));
  }
}

// -------------------------------------------------------------
// 7) [핵심 ③] 글 저장하기 — INSERT (Create)
// -------------------------------------------------------------
formEl.addEventListener("submit", async (e) => {
  e.preventDefault(); // 폼 기본 새로고침 막기

  const author = authorEl.value.trim();
  const content = contentEl.value.trim();

  if (!author || !content) {
    showStatus("fail", "이름과 내용을 모두 입력하세요.");
    return;
  }

  submitEl.disabled = true; // 중복 클릭(연타) 방지
  showStatus("info", "글을 저장하는 중…");

  try {
    const { error } = await db
      .from("posts")
      .insert({ author: author, content: content });

    if (error) throw error;

    // 성공!
    showStatus("ok", "글이 등록되었어요!");
    console.log("✅ 글 저장 성공:", { author, content });

    contentEl.value = ""; // 내용칸만 비우기(이름은 다음 글에 재사용하기 편하게 둠)
    await refreshList();   // 방금 쓴 글이 보이도록 목록 갱신
  } catch (err) {
    console.error("❌ 글 저장 실패:", err.message);
    showStatus("fail", friendlyError(err, "글을 저장하지 못했어요"));
  } finally {
    submitEl.disabled = false;
  }
});

// -------------------------------------------------------------
// 8) 에러 메시지를 비전공자가 알아듣게 바꿔 주는 도우미
// -------------------------------------------------------------
function friendlyError(err, prefix) {
  const msg = err && err.message ? err.message : "";
  if (msg.includes("does not exist")) {
    return "posts 표가 없어요. schema.sql을 Supabase SQL Editor에서 먼저 실행하세요.";
  }
  if (msg.includes("row-level security") || msg.includes("violates row-level")) {
    return "저장이 정책에 막혔어요. schema.sql의 INSERT 정책이 실행됐는지 확인하세요.";
  }
  if (msg.includes("Invalid API key")) {
    return "anon 키가 틀린 것 같아요. script.js의 SUPABASE_ANON_KEY를 다시 확인하세요.";
  }
  if (msg.includes("Failed to fetch")) {
    return "연결에 실패했어요. SUPABASE_URL 철자와 https:// 를 확인하세요.";
  }
  return prefix + ": " + msg;
}

// -------------------------------------------------------------
// 9) 실행 트리거 — 페이지가 열리면 곧바로 목록을 불러옴
// -------------------------------------------------------------
if (isPlaceholder()) {
  console.warn(
    "⚠️ 아직 자리표시자 그대로입니다. script.js의 SUPABASE_URL / SUPABASE_ANON_KEY를 내 anon 값으로 바꾸세요."
  );
  showStatus("fail", "아직 내 프로젝트 값이 입력되지 않았어요 (script.js 수정 필요)");
  submitEl.disabled = true;
} else {
  refreshList(); // 처음 들어왔을 때 이미 있는 글들을 보여 줍니다.
}
