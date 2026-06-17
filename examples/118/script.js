// =============================================================
// 실습 118 — 등록 즉시 목록 갱신 + async/await로 깔끔하게 정리
// =============================================================
//
// 이 파일이 하는 일:
//   (1) 내 프로젝트 정보(URL + anon 키)로 Supabase에 '연결'을 만든다.
//   (2) [남기기] 버튼을 누르면 insert로 글 한 줄을 서버에 저장한다.
//   (3) ★핵심★ 저장에 성공하면 곧바로 다시 select 해서 목록을 새로 그린다.
//       → 화면을 새로고침하지 않아도 방금 쓴 글이 목록 맨 위에 바로 나타난다.
//
// 그리고 116/117처럼 콜백(.then)을 쓰지 않고,
//   async / await  : 비동기(서버 응답을 기다리는) 코드를 '위에서 아래로' 읽히게
//   try / catch     : 중간에 에러가 나면 한곳에서 잡아 빨간 안내로 보여 주기
// 로 흐름을 깔끔하게 정리합니다.

// -------------------------------------------------------------
// 1) 내 프로젝트 값 (Supabase 대시보드: Settings → API 에서 복사)
// -------------------------------------------------------------
//
// ▶ URL : 내 데이터베이스가 사는 인터넷 주소. 비밀이 아닙니다.
// ▶ anon key(공개 키) : 브라우저에 그대로 박아도 되는 '출입증'입니다.
//    - anon 키는 "로그인 안 한 손님" 자격의 열쇠라 공개돼도 됩니다.
//      (단, 공개해도 안전한 진짜 이유는 서버에 RLS를 켜고 정책을 다는 것 — 실습 119)
//    - 반대로 service_role 키(= 신형 sb_secret_... )는 모든 보안을 우회하는
//      '마스터 키'라서 절대! 브라우저나 깃허브에 올리면 안 됩니다.
//
// 아래 두 값은 '자리표시자(placeholder)'입니다. 내 진짜 값으로 바꿔 주세요.
const SUPABASE_URL = "https://여기에-내-프로젝트-ID.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_여기에-내-anon-공개키-붙여넣기";

// -------------------------------------------------------------
// 2) 연결(클라이언트) 만들기
// -------------------------------------------------------------
// CDN 라이브러리가 전역에 만들어 준 supabase 객체의 createClient를 부릅니다.
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 화면 요소들 미리 잡아 두기
const formEl = document.getElementById("guestbook-form");  // 글 입력 폼
const nameEl = document.getElementById("name");            // 이름 입력칸
const messageEl = document.getElementById("message");      // 메시지 입력칸
const submitBtn = document.getElementById("submit-btn");   // 남기기 버튼
const statusEl = document.getElementById("status");        // 상태 안내 박스
const listEl = document.getElementById("list");            // 글이 들어갈 ul

// 자리표시자를 안 바꾼 채 실행하면 무조건 실패하므로, 미리 알려 주는 도우미
function isPlaceholder() {
  return SUPABASE_URL.includes("여기에-내") || SUPABASE_ANON_KEY.includes("여기에-내");
}

// -------------------------------------------------------------
// 3) [읽기] 서버에서 글 목록을 불러와 화면에 그리는 함수 (async)
// -------------------------------------------------------------
// async 함수 안에서는 await 로 "서버 응답이 올 때까지 기다렸다가 다음 줄"로 갑니다.
// try 안에서 에러(throw)가 나면 즉시 catch 로 점프합니다.
async function loadGuestbook() {
  showStatus("info", "불러오는 중…");

  try {
    // ----- 핵심 한 줄: 서버 표(guestbook)에서 글들을 받아오기 -----
    // .order(...)는 최신 글이 맨 위에 오도록 created_at 내림차순 정렬.
    const { data, error } = await db
      .from("guestbook")
      .select("*")
      .order("created_at", { ascending: false });

    // Supabase는 실패해도 throw 하지 않고 error 객체에 담아 줍니다.
    // 그래서 우리가 직접 검사해서 "에러면 throw" 해 줘야 catch가 잡습니다.
    if (error) throw error;

    console.log("✅ 불러오기 성공! 글 " + data.length + "개:", data);
    renderList(data);  // 받아온 배열을 화면에 그리기

    // 글이 있으면 안내 문구는 숨깁니다. (0개면 안내를 띄움)
    if (data.length === 0) {
      showStatus("info", "아직 글이 없어요. 위에서 첫 글을 남겨 보세요!");
    } else {
      hideStatus();
    }
  } catch (err) {
    // 네트워크 오류, 표 없음, RLS 등 무슨 에러든 여기 한곳에서 처리됩니다.
    console.error("❌ 불러오기 실패:", err.message);
    showStatus("fail", "목록 불러오기 실패: " + err.message);
  }
}

// -------------------------------------------------------------
// 4) [쓰기→읽기] 글을 저장하고, 성공하면 목록을 다시 불러오는 함수 (async)
// -------------------------------------------------------------
async function addGuestbookEntry(name, message) {
  // 저장하는 동안 버튼을 잠가 '두 번 클릭으로 두 번 저장'되는 사고를 막습니다.
  submitBtn.disabled = true;
  showStatus("info", "저장 중…");

  try {
    // ----- 핵심 한 줄: 글 한 줄을 서버 표에 저장(insert) -----
    const { error } = await db
      .from("guestbook")
      .insert({ name: name, message: message });

    if (error) throw error;  // 저장 에러면 catch로 점프

    console.log("✅ 저장 성공:", { name, message });
    showStatus("ok", "저장 완료! 목록을 갱신합니다…");

    // 입력칸 비우기 (다음 글을 바로 쓰기 편하게)
    formEl.reset();

    // ★ 이 실습의 핵심 ★
    // 저장이 끝났으니, 화면을 새로고침하지 않고 '다시 select' 해서
    // 방금 쓴 글이 포함된 최신 목록으로 화면을 갱신합니다.
    // await 로 목록 갱신이 끝날 때까지 기다린 뒤 finally로 넘어갑니다.
    await loadGuestbook();
  } catch (err) {
    console.error("❌ 저장 실패:", err.message);
    showStatus("fail", "저장 실패: " + err.message);
  } finally {
    // 성공이든 실패든 항상 버튼을 다시 풀어 줍니다. (finally = 무조건 실행)
    submitBtn.disabled = false;
  }
}

// -------------------------------------------------------------
// 5) 받아온 글 배열을 화면 목록(ul)에 그리는 함수
// -------------------------------------------------------------
function renderList(posts) {
  // 다시 그리기 전에 이전 목록을 깨끗이 비웁니다.
  // (안 비우면 갱신할 때마다 글이 두 배, 세 배로 중복돼 쌓입니다.)
  listEl.innerHTML = "";

  posts.forEach((post) => {
    const li = document.createElement("li");

    // 이름 (글쓴이)
    const who = document.createElement("span");
    who.className = "who";
    who.textContent = post.name;

    // 작성 시각 (보기 좋게 한국식으로 변환)
    const when = document.createElement("span");
    when.className = "when";
    when.textContent = formatTime(post.created_at);

    // 메시지 본문
    const msg = document.createElement("div");
    msg.className = "msg";
    msg.textContent = post.message;

    // ⚠️ 보안 팁: textContent로 글자를 넣으면 사용자가 적은 <script> 같은 코드가
    //    '글자 그대로' 표시되어 안전합니다. innerHTML로 사용자 입력을 넣으면
    //    XSS(악성코드 삽입) 위험이 있습니다.

    const head = document.createElement("div");
    head.appendChild(who);
    head.appendChild(when);

    li.appendChild(head);
    li.appendChild(msg);
    listEl.appendChild(li);
  });
}

// -------------------------------------------------------------
// 6) 보조 함수들
// -------------------------------------------------------------

// 서버가 준 시각 문자열(2026-06-18T01:23:45...)을 보기 좋은 한국식으로 바꿉니다.
function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 상태 박스를 보여 주기 (kind: "info"=파랑, "ok"=초록, "fail"=빨강)
function showStatus(kind, text) {
  const icon = kind === "fail" ? "❌ " : kind === "ok" ? "✅ " : "ℹ️ ";
  statusEl.textContent = icon + text;
  statusEl.classList.remove("info", "ok", "fail");
  statusEl.classList.add(kind);
}

// 상태 박스 숨기기
function hideStatus() {
  statusEl.classList.remove("info", "ok", "fail");
}

// -------------------------------------------------------------
// 7) 실행 트리거
// -------------------------------------------------------------

// 자리표시자를 안 바꿨으면 친절히 안내하고 멈춥니다.
if (isPlaceholder()) {
  console.warn(
    "⚠️ 아직 자리표시자 그대로입니다. script.js의 SUPABASE_URL / SUPABASE_ANON_KEY를 내 값으로 바꾸세요."
  );
  showStatus("fail", "아직 내 프로젝트 값이 입력되지 않았어요 (script.js 수정 필요)");
} else {
  // (1) 페이지가 열리면 자동으로 한 번 목록을 불러옵니다.
  loadGuestbook();

  // (2) 폼이 제출되면(=버튼 클릭 또는 Enter) 글을 저장 → 목록 갱신.
  formEl.addEventListener("submit", (event) => {
    // form의 기본 동작(페이지 새로고침)을 막습니다. 안 막으면 화면이 깜빡이고 끊깁니다.
    event.preventDefault();

    // 입력값을 읽고, 앞뒤 공백을 제거합니다.
    const name = nameEl.value.trim();
    const message = messageEl.value.trim();

    // 빈 칸이면 서버에 보내지 않고 즉시 안내합니다. (서버 왕복 한 번 아끼기)
    if (name === "" || message === "") {
      showStatus("fail", "이름과 메시지를 모두 입력해 주세요.");
      return;
    }

    addGuestbookEntry(name, message);
  });
}
