// =============================================================
// 실습 119 — RLS(행 수준 보안)를 켠 방명록
// =============================================================
//
// 화면 동작은 실습 118과 똑같습니다(글 남기면 목록 즉시 갱신).
// 코드도 거의 같습니다. ★ 진짜 주제는 '서버 쪽 보안(RLS + 정책)' ★ 이고,
// 그건 schema.sql 에서 설정합니다.
//
// 이 파일이 중요한 이유:
//   RLS를 켰을 때 '정책이 없으면' 무슨 일이 일어나는지를
//   이 코드가 그대로 보여 주기 때문입니다.
//     - 읽기(select)  : 에러가 아니라 '빈 배열 []'이 돌아옵니다 → 글이 안 보임.
//     - 쓰기(insert)  : 'row-level security policy' 에러로 막힙니다 → 빨간 안내.
//   schema.sql 의 2~3단계(정책 추가)를 실행하면 둘 다 다시 정상 동작합니다.

// -------------------------------------------------------------
// 1) 내 프로젝트 값 (Supabase 대시보드: Settings → API 에서 복사)
// -------------------------------------------------------------
//
// ▶ URL : 내 데이터베이스가 사는 인터넷 주소. 비밀이 아닙니다.
// ▶ anon key(공개 키, sb_publishable_...) : 브라우저에 그대로 박아도 되는 '출입증'.
//    - ★ 이번 실습의 핵심 ★ anon 키가 '공개돼도 안전한 진짜 이유'가 바로 RLS입니다.
//      RLS를 켜고 정책을 달면, anon 손님은 우리가 허락한 동작(읽기/쓰기)만 할 수 있습니다.
//    - 반대로 service_role 키(= sb_secret_... )는 RLS를 통째로 '우회'하는 마스터 키라서
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
// 3) [읽기] 서버에서 글 목록을 불러와 화면에 그리는 함수
// -------------------------------------------------------------
async function loadGuestbook() {
  showStatus("info", "불러오는 중…");

  try {
    const { data, error } = await db
      .from("guestbook")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    console.log("✅ 불러오기 성공! 글 " + data.length + "개:", data);
    renderList(data);

    // ★ RLS 학습 포인트 ★
    // RLS를 켰는데 '읽기 정책'이 없으면, select는 에러가 아니라 '빈 배열 []'을 줍니다.
    // → 글이 실제로는 있는데도 data.length === 0 이 되어 목록이 텅 비어 보입니다.
    if (data.length === 0) {
      showStatus(
        "info",
        "글이 0개입니다. (DB에 글이 있는데도 비었다면 → RLS '읽기 정책'이 없는 상태! schema.sql 2단계를 실행하세요.)"
      );
    } else {
      hideStatus();
    }
  } catch (err) {
    console.error("❌ 불러오기 실패:", err.message);
    showStatus("fail", "목록 불러오기 실패: " + err.message);
  }
}

// -------------------------------------------------------------
// 4) [쓰기→읽기] 글을 저장하고, 성공하면 목록을 다시 불러오는 함수
// -------------------------------------------------------------
async function addGuestbookEntry(name, message) {
  submitBtn.disabled = true;
  showStatus("info", "저장 중…");

  try {
    const { error } = await db
      .from("guestbook")
      .insert({ name: name, message: message });

    // ★ RLS 학습 포인트 ★
    // RLS를 켰는데 '쓰기 정책'이 없으면, insert는 여기서 error 를 돌려줍니다.
    // 메시지 예: 'new row violates row-level security policy for table "guestbook"'
    // → schema.sql 3단계(쓰기 정책)를 실행하면 사라집니다.
    if (error) throw error;

    console.log("✅ 저장 성공:", { name, message });
    showStatus("ok", "저장 완료! 목록을 갱신합니다…");

    formEl.reset();
    await loadGuestbook();   // 새로고침 없이 최신 목록으로 갱신
  } catch (err) {
    console.error("❌ 저장 실패:", err.message);

    // RLS 쓰기 막힘을 비전공자도 알아볼 수 있게 친절히 풀어 줍니다.
    let friendly = "저장 실패: " + err.message;
    if (err.message && err.message.includes("row-level security")) {
      friendly =
        "저장 실패: RLS가 켜져 있는데 '쓰기 정책'이 없어서 막혔어요. " +
        "schema.sql 3단계(쓰기 정책)를 실행하세요.";
    }
    showStatus("fail", friendly);
  } finally {
    submitBtn.disabled = false;  // 성공/실패 무관 항상 버튼 잠금 해제
  }
}

// -------------------------------------------------------------
// 5) 받아온 글 배열을 화면 목록(ul)에 그리는 함수
// -------------------------------------------------------------
function renderList(posts) {
  listEl.innerHTML = "";   // 중복 방지: 다시 그리기 전에 비우기

  posts.forEach((post) => {
    const li = document.createElement("li");

    const who = document.createElement("span");
    who.className = "who";
    who.textContent = post.name;

    const when = document.createElement("span");
    when.className = "when";
    when.textContent = formatTime(post.created_at);

    const msg = document.createElement("div");
    msg.className = "msg";
    msg.textContent = post.message;
    // 보안 팁: textContent 사용 → 사용자가 적은 <script> 등이 '글자 그대로' 표시되어
    // XSS(악성코드 삽입)를 막습니다. innerHTML로 사용자 입력을 넣으면 위험합니다.

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
function formatTime(isoString) {
  const d = new Date(isoString);
  return d.toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
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
  loadGuestbook();  // (1) 페이지가 열리면 자동으로 한 번 목록 불러오기

  // (2) 폼 제출 시: 글 저장 → 목록 갱신
  formEl.addEventListener("submit", (event) => {
    event.preventDefault();  // form 기본 새로고침 막기

    const name = nameEl.value.trim();
    const message = messageEl.value.trim();

    if (name === "" || message === "") {
      showStatus("fail", "이름과 메시지를 모두 입력해 주세요.");
      return;
    }

    addGuestbookEntry(name, message);
  });
}
