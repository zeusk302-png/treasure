// =============================================================
// 실습 126 — 글마다 좋아요 버튼 + RPC로 안전하게 +1
// =============================================================
//
// 123 방명록까지는 글 '추가(insert)'와 '목록(select)'만 했습니다.
// 이번에는 각 글에 좋아요 버튼을 달고, 누르면 그 글의 likes 를 1 올립니다.
//
// ★ 좋아요 +1 을 'RPC(서버 함수 호출)'로 하는 이유 ★
//   "현재 좋아요 수를 읽어 와서(예: 3) → JS에서 +1 → 4로 update" 방식은
//   두 사람이 동시에 누르면 둘 다 3을 읽어 둘 다 4로 덮어씁니다(5가 돼야 하는데 4).
//   이걸 '경쟁 상태(race condition)'라 합니다.
//   → 해결책: 더하기를 '서버 안에서 한 번에' 하는 함수(increment_likes)를 만들고,
//     JS는 그 함수를 supabase.rpc()로 '호출'만 합니다. 동시에 눌러도 안전하게 +1씩 쌓입니다.
//
//   [위험한 방식]                          [이번 실습의 안전한 방식]
//   const { data } = select(likes)   →     supabase.rpc("increment_likes", { post_id })
//   update({ likes: data.likes + 1 })→     (읽기·더하기·쓰기를 서버가 한 번에 처리)

// -------------------------------------------------------------
// 1) 내 프로젝트 값 (Supabase 대시보드: Settings → API 에서 복사)
// -------------------------------------------------------------
//
// ▶ URL : 내 데이터베이스가 사는 인터넷 주소. 비밀이 아닙니다.
// ▶ anon key(공개 키, sb_publishable_...) : 브라우저에 그대로 박아도 되는 '출입증'.
//    RLS 정책과 함수 권한(grant)이 켜져 있어서 공개해도 안전합니다(schema.sql에서 설정함).
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

// 화면 요소 미리 잡아 두기
const postList = document.getElementById("postList"); // 글이 들어갈 ul
const statusEl = document.getElementById("status");   // 상태 안내 박스

// 자리표시자를 안 바꾼 채 실행하면 무조건 실패하므로, 미리 알려 주는 도우미
function isPlaceholder() {
  return SUPABASE_URL.includes("여기에-내") || SUPABASE_ANON_KEY.includes("여기에-내");
}

// -------------------------------------------------------------
// 3) [목록] 서버에서 글을 불러와 화면에 그리는 함수 (select)
// -------------------------------------------------------------
async function loadPosts() {
  showStatus("info", "불러오는 중…");

  try {
    const { data, error } = await db
      .from("posts")
      .select("*")
      .order("created_at", { ascending: true }); // 오래된 글이 위

    if (error) throw error;

    console.log("✅ 불러오기 성공! 글 " + data.length + "개:", data);
    render(data);
    hideStatus();
  } catch (err) {
    console.error("❌ 불러오기 실패:", err.message);
    showStatus("fail", friendlyError("목록 불러오기 실패", err));
  }
}

// -------------------------------------------------------------
// 4) [좋아요] 서버 함수(RPC)를 호출해 likes 를 +1 하는 함수  ★ 핵심 ★
// -------------------------------------------------------------
//   supabase.rpc("함수이름", { 인자: 값 }) 형태로 서버 함수를 호출합니다.
//   함수는 +1 한 뒤의 '새 likes 값'을 돌려주므로, 그 숫자로 화면만 살짝 갱신합니다.
//   (전체 목록을 다시 불러올 필요 없이, 누른 글의 숫자 하나만 바꿔 줍니다.)
async function likePost(postId, btnEl, countEl) {
  btnEl.disabled = true; // 연타 방지: 처리 중에는 잠깐 잠금

  try {
    const { data, error } = await db.rpc("increment_likes", {
      post_id: postId, // ← schema.sql 함수의 매개변수 이름과 똑같아야 함
    });

    if (error) throw error;

    // data = 함수가 returning 으로 돌려준 '+1 된 새 likes 숫자'
    console.log("❤️ 좋아요 성공! 글 " + postId + " → " + data);
    countEl.textContent = data; // 화면 숫자만 새 값으로 교체
  } catch (err) {
    console.error("❌ 좋아요 실패:", err.message);
    showStatus("fail", friendlyError("좋아요 실패", err));
  } finally {
    btnEl.disabled = false; // 성공/실패 무관 항상 잠금 해제
  }
}

// -------------------------------------------------------------
// 5) 받아온 글 배열을 화면 목록(ul)에 그리는 함수
// -------------------------------------------------------------
function render(posts) {
  postList.innerHTML = ""; // 중복 방지: 다시 그리기 전에 비우기

  if (posts.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "아직 글이 없어요. schema.sql 5단계(예시 글)를 실행해 보세요.";
    postList.appendChild(li);
    return;
  }

  posts.forEach((post) => {
    const li = document.createElement("li");

    // 왼쪽: 글 내용 + 작성 시각
    const contentBox = document.createElement("div");
    contentBox.className = "post-content";

    const text = document.createElement("span");
    text.textContent = post.content;
    // 보안 팁: textContent 사용 → 사용자가 적은 <script> 등이 '글자 그대로' 표시되어
    // XSS(악성코드 삽입)를 막습니다. innerHTML로 사용자 입력을 넣으면 위험합니다.

    const when = document.createElement("span");
    when.className = "when";
    when.textContent = formatTime(post.created_at);

    contentBox.appendChild(text);
    contentBox.appendChild(when);

    // 오른쪽: 좋아요 버튼 (하트 + 숫자)
    const likeBtn = document.createElement("button");
    likeBtn.className = "like-btn";
    likeBtn.type = "button";

    const heart = document.createElement("span");
    heart.textContent = "❤️ ";

    const count = document.createElement("span");
    count.className = "like-count";
    count.textContent = post.likes; // 서버에 저장된 현재 좋아요 수

    likeBtn.appendChild(heart);
    likeBtn.appendChild(count);

    // 버튼을 누르면 이 글의 id 로 RPC 호출 (숫자 표시 요소도 함께 넘김)
    likeBtn.addEventListener("click", () => {
      likePost(post.id, likeBtn, count);
    });

    li.appendChild(contentBox);
    li.appendChild(likeBtn);
    postList.appendChild(li);
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
  if (msg.includes("Could not find the function") || msg.includes("increment_likes")) {
    return prefix + ": increment_likes 함수가 아직 없어요. schema.sql 4단계(함수 만들기)를 실행하세요.";
  }
  if (msg.includes("row-level security")) {
    return prefix + ": RLS는 켜졌는데 정책이 없어서 막혔어요. schema.sql 3단계(정책)를 실행하세요.";
  }
  if (msg.includes("does not exist") || msg.includes("relation")) {
    return prefix + ": posts 표가 아직 없어요. schema.sql 1단계(표 만들기)를 실행하세요.";
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
  loadPosts(); // 페이지가 열리면 자동으로 한 번 서버 목록을 불러오기
}
