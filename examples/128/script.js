// =============================================================
// 실습 128 — 방명록을 Realtime으로 "다른 사람 글이 실시간으로 뜨게" 하기
// =============================================================
//
// 이 파일이 하는 일:
//   (1) 내 프로젝트 정보(URL + anon 키)로 Supabase에 '연결'을 만든다. (실습 115)
//   (2) 처음 한 번은 select로 기존 글 목록을 받아 화면을 채운다. (실습 117)
//   (3) ★이번 핵심★ supabase.channel(...).on('postgres_changes', { event:'INSERT' ... })
//       로 'guestbook 표에 새 글이 들어오는 사건'을 구독(subscribe)한다.
//       → 다른 브라우저/다른 사람이 글을 INSERT하면, 그 글 한 줄이 자동으로 내 화면에 도착한다.
//   (4) 도착한 글을 목록 맨 위에 끼워 넣어, 새로고침 없이 실시간으로 갱신되게 한다.
//
// 핵심 비유:
//   지금까지는 "글 썼어? 그럼 네가 직접 새로고침해서 확인해" 방식이었습니다.
//   Realtime 구독은 "표에 새 글이 들어오면 서버가 나한테 '띵동!' 하고 알려 줘"를
//   미리 신청해 두는 것입니다. 그래서 내가 가만히 있어도 새 글이 저절로 떠요.

// -------------------------------------------------------------
// 1) 내 프로젝트 값 (Supabase 대시보드: Settings → API 에서 복사)
// -------------------------------------------------------------
//
// ▶ URL : 내 데이터베이스가 사는 인터넷 주소. 비밀이 아닙니다.
// ▶ anon key(공개 키) : 브라우저에 그대로 박아도 되는 '출입증'입니다.
//    - anon 키는 "로그인 안 한 손님" 자격으로만 들어갈 수 있는 열쇠라 공개돼도 됩니다.
//      단, 안전한 진짜 이유는 서버에 RLS(행 수준 보안)를 켜고 정책을 다는 것입니다.
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
const listEl = document.getElementById("list");        // 글들이 들어갈 ul
const statusEl = document.getElementById("status");    // 상태 안내 문구 박스
const formEl = document.getElementById("form");        // 글쓰기 폼
const nameEl = document.getElementById("name");        // 이름 입력칸
const messageEl = document.getElementById("message");  // 메시지 입력칸
const submitBtn = document.getElementById("submit-btn");// 보내기 버튼
const liveEl = document.getElementById("live");        // 연결 표시등(원)
const liveTextEl = document.getElementById("live-text");// 연결 표시등 글자

// 자리표시자를 그대로 둔 채 실행하면 분명히 실패하므로, 친절하게 막아 둡니다.
function isPlaceholder() {
  return SUPABASE_URL.includes("여기에-내") || SUPABASE_ANON_KEY.includes("여기에-내");
}

// -------------------------------------------------------------
// 3) 처음 한 번: 기존 글을 select로 받아 화면 채우기 (실습 117·123)
// -------------------------------------------------------------
async function loadInitial() {
  if (isPlaceholder()) {
    console.warn(
      "⚠️ 아직 자리표시자 그대로입니다. script.js의 SUPABASE_URL / SUPABASE_ANON_KEY를 내 값으로 바꾸세요."
    );
    showStatus("fail", "아직 내 프로젝트 값이 입력되지 않았어요 (script.js 수정 필요)");
    setLive("off", "연결 안 됨");
    submitBtn.disabled = true;
    return;
  }

  showStatus("info", "불러오는 중…");

  // 최신순으로 줄 세워서 받아 옵니다. (맨 위가 가장 최근 글)
  const { data, error } = await db
    .from("guestbook")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error("❌ 불러오기 실패:", error.message);
    showStatus("fail", "불러오기 실패: " + error.message);
    return;
  }

  listEl.innerHTML = ""; // 혹시 남아 있던 내용을 비우고 새로 그립니다.

  if (!data || data.length === 0) {
    showStatus("info", "아직 글이 없어요. 아래 폼으로 첫 글을 남겨 보세요!");
  } else {
    hideStatus();
    // 받아온 글을 한 줄씩 그립니다. (위에서부터 최신순)
    data.forEach((post) => listEl.appendChild(makeRow(post)));
  }

  console.log(`✅ 처음 불러오기 성공: 기존 글 ${data ? data.length : 0}개`);
}

// -------------------------------------------------------------
// 4) ★ 이번 실습의 핵심 ★ — Realtime 구독으로 '새 글 INSERT'를 실시간 수신
// -------------------------------------------------------------
//
//   supabase.channel('이름')                       : 실시간 '방송 채널'을 하나 연다
//     .on('postgres_changes', { ... }, (payload)=>) : DB 변경 사건을 듣는다
//          event:  'INSERT'  → "새 글이 추가될 때만" 알려 줘 (수정은 UPDATE, 삭제는 DELETE)
//          schema: 'public'  → public 스키마(우리가 쓰는 기본 칸)
//          table:  'guestbook' → 이 표에서 일어난 일만
//     .subscribe((status)=>)                        : 실제로 듣기 시작 + 연결 상태 통보
//
//   사건이 오면 콜백의 payload.new 안에 '방금 추가된 글 한 줄'이 통째로 들어 있습니다.
//   → 그걸 화면 맨 위에 끼워 넣으면 끝! (전체를 다시 불러올 필요가 없어 빠릅니다.)
function subscribeRealtime() {
  if (isPlaceholder()) return; // 값이 없으면 구독도 의미 없음

  const channel = db
    .channel("guestbook-realtime") // 채널 이름은 자유. 페이지 안에서 구분만 되면 됨.
    .on(
      "postgres_changes",
      {
        event: "INSERT",     // ← "새 글이 들어올 때만" 듣겠다
        schema: "public",
        table: "guestbook",
      },
      (payload) => {
        // payload.new = 방금 INSERT된 글 한 줄(객체). 이름·메시지·시각이 들어 있습니다.
        const newPost = payload.new;
        console.log("📡 실시간 새 글 도착:", newPost);

        // 글이 0개라 "아직 글이 없어요" 안내가 떠 있었다면 지웁니다.
        hideStatus();

        // 새 글 줄을 만들어 목록 '맨 위'에 끼워 넣습니다. (최신순 유지)
        const row = makeRow(newPost);
        row.classList.add("fresh"); // 잠깐 초록 테두리로 '새로 왔음'을 표시
        listEl.prepend(row);
      }
    )
    .subscribe((status) => {
      // status 값: 'SUBSCRIBED'(성공) / 'CHANNEL_ERROR' / 'TIMED_OUT' / 'CLOSED'
      console.log("🔌 구독 상태:", status);
      if (status === "SUBSCRIBED") {
        setLive("on", "실시간 연결됨");
      } else if (status === "CHANNEL_ERROR" || status === "TIMED_OUT") {
        setLive("off", "연결 오류 (Realtime 켰는지 확인)");
      } else if (status === "CLOSED") {
        setLive("off", "연결 끊김");
      }
    });

  // 페이지를 떠날 때 구독을 정리합니다(예의 바른 마무리). 안 해도 동작은 하지만 권장됩니다.
  window.addEventListener("beforeunload", () => {
    db.removeChannel(channel);
  });
}

// -------------------------------------------------------------
// 5) 글쓰기 — insert 한 줄. (실습 116)
// -------------------------------------------------------------
// ※ 중요: 여기서는 insert만 하고, 화면에 직접 그리지 '않습니다'.
//   왜냐하면 위 Realtime 구독이 'INSERT 사건'을 받아서 알아서 화면에 그려 주기 때문입니다.
//   (내가 쓴 글도 구독을 통해 똑같이 '새 글'로 돌아옵니다 → 한 번만 떠야 정상)
formEl.addEventListener("submit", async (e) => {
  e.preventDefault(); // 폼 기본 동작(페이지 새로고침) 막기

  const name = nameEl.value.trim();
  const message = messageEl.value.trim();
  if (!name || !message) return;

  submitBtn.disabled = true; // 중복 클릭 방지

  const { error } = await db.from("guestbook").insert({ name, message });

  if (error) {
    console.error("❌ 저장 실패:", error.message);
    showStatus("fail", "저장 실패: " + error.message);
  } else {
    console.log("✅ 저장 성공! (화면 표시는 Realtime 구독이 처리합니다)");
    formEl.reset();        // 입력칸 비우기
    nameEl.focus();
  }

  submitBtn.disabled = false;
});

// -------------------------------------------------------------
// 6) 보조 함수들
// -------------------------------------------------------------

// 글 한 줄(객체)을 받아 <li> 요소로 만들어 돌려줍니다. (처음 로딩·실시간 도착 둘 다 사용)
function makeRow(post) {
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

  // ⚠️ 보안 팁: 위처럼 textContent로 글자를 넣으면, 사용자가 적은
  //    <script> 같은 코드가 '글자 그대로' 표시되어 안전합니다.
  //    innerHTML로 사용자 입력을 그대로 넣으면 XSS(악성코드 삽입) 위험이 있어요.

  const head = document.createElement("div");
  head.appendChild(who);
  head.appendChild(when);

  li.appendChild(head);
  li.appendChild(msg);
  return li;
}

// 서버가 준 시각 문자열(2026-06-18T01:23:45...)을 보기 좋은 한국식으로 바꿉니다.
function formatTime(isoString) {
  if (!isoString) return "방금";
  const d = new Date(isoString);
  return d.toLocaleString("ko-KR", {
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// 연결 표시등 갱신 (state: "on"=초록, "off"=빨강)
function setLive(state, text) {
  liveEl.classList.remove("on", "off");
  liveEl.classList.add(state);
  liveTextEl.textContent = text;
}

// 상태 박스를 보여 주기 (kind: "info"=파랑 안내, "fail"=빨강 에러)
function showStatus(kind, text) {
  statusEl.textContent = (kind === "fail" ? "❌ " : "ℹ️ ") + text;
  statusEl.classList.remove("info", "fail");
  statusEl.classList.add(kind);
}

// 상태 박스 숨기기
function hideStatus() {
  statusEl.classList.remove("info", "fail");
}

// -------------------------------------------------------------
// 7) 첫 실행: 기존 글을 채운 뒤, 실시간 구독을 시작합니다.
// -------------------------------------------------------------
loadInitial();      // 1) 지금까지 쌓인 글을 한 번 받아 화면에 채우고
subscribeRealtime(); // 2) 이후로는 '새 글 도착'을 실시간으로 듣습니다 ★핵심★
