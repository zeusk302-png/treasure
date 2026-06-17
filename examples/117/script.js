// =============================================================
// 실습 117 — 방명록 글 목록을 select(불러오기) 해서 화면에 그리기
// =============================================================
//
// 이 파일이 하는 일:
//   (1) 내 프로젝트 정보(URL + anon 키)로 Supabase에 '연결'을 만든다. (실습 115에서 배운 것)
//   (2) supabase.from('guestbook').select() 로 표에 쌓인 글들을 '여러 줄' 받아온다.
//   (3) 받아온 글 배열을 forEach로 한 줄씩 돌면서 <li>를 만들어 화면 목록에 채운다.
//
// 116(insert)이 "내 글 한 줄을 서버 선반에 올려놓기"였다면,
// 117(select)은 "선반 위에 있는 글들을 꺼내 와 화면에 펼쳐 보기"입니다.

// -------------------------------------------------------------
// 1) 내 프로젝트 값 (Supabase 대시보드: Settings → API 에서 복사)
// -------------------------------------------------------------
//
// ▶ URL : 내 데이터베이스가 사는 인터넷 주소. 비밀이 아닙니다.
// ▶ anon key(공개 키) : 브라우저에 그대로 박아도 되는 '출입증'입니다.
//    - anon 키는 "로그인 안 한 손님" 자격으로만 들어갈 수 있는 열쇠라 공개돼도 됩니다.
//      단, 안전한 진짜 이유는 서버에 RLS(행 수준 보안)를 켜고 정책을 다는 것입니다.
//      (RLS는 실습 119에서 본격적으로 켭니다.)
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
const listEl = document.getElementById("list");       // 글들이 들어갈 ul
const statusEl = document.getElementById("status");   // 상태 안내 문구 박스
const reloadBtn = document.getElementById("reload-btn"); // 새로고침 버튼

// -------------------------------------------------------------
// 3) 서버에서 글 목록을 불러와 화면에 그리는 함수
// -------------------------------------------------------------
async function loadGuestbook() {
  // 값을 안 바꾸고 그대로 두면 분명히 실패하므로, 친절하게 먼저 알려줍니다.
  if (SUPABASE_URL.includes("여기에-내") || SUPABASE_ANON_KEY.includes("여기에-내")) {
    console.warn(
      "⚠️ 아직 자리표시자 그대로입니다. script.js의 SUPABASE_URL / SUPABASE_ANON_KEY를 내 값으로 바꾸세요."
    );
    showStatus("fail", "아직 내 프로젝트 값이 입력되지 않았어요 (script.js 수정 필요)");
    return;
  }

  // 불러오는 동안 버튼을 잠그고, '불러오는 중' 안내를 띄웁니다.
  reloadBtn.disabled = true;
  showStatus("info", "불러오는 중…");
  console.log("⏳ 서버에서 방명록 글을 불러옵니다…");

  // ----- 핵심 한 줄: 서버 표(guestbook)에서 글들을 받아오기 -----
  // .select("*")  : 모든 컬럼(id, name, message, created_at)을 다 가져옵니다.
  // .order(...)   : 최신 글이 맨 위에 오도록 created_at 기준 내림차순 정렬.
  // 결과는 항상 '객체들의 배열'(data)로 돌아옵니다. 글이 없으면 빈 배열 [] 입니다.
  const { data, error } = await db
    .from("guestbook")
    .select("*")
    .order("created_at", { ascending: false });

  reloadBtn.disabled = false;

  if (error) {
    // 서버에서 에러가 돌아온 경우 (대표 원인은 README 검증법 참고)
    console.error("❌ 불러오기 실패:", error.message);
    showStatus("fail", "불러오기 실패: " + error.message);
    return;
  }

  console.log("✅ 불러오기 성공! 서버가 돌려준 글 " + data.length + "개:", data);

  // 다시 그리기 전에, 이전에 그려 둔 목록을 깨끗이 비웁니다.
  // (이걸 안 하면 새로고침할 때마다 글이 두 배, 세 배로 쌓입니다.)
  listEl.innerHTML = "";

  // 글이 한 개도 없으면 안내만 보여 주고 끝냅니다.
  if (data.length === 0) {
    showStatus("info", "아직 글이 없어요. 실습 116에서 첫 글을 남겨 보세요!");
    return;
  }

  // 글이 있으면 안내 문구는 숨깁니다.
  hideStatus();

  // ----- 받아온 글 배열을 한 줄씩 돌면서 <li>로 만들어 넣기 -----
  data.forEach((post) => {
    const li = document.createElement("li");

    // 이름 (글쓴이)
    const who = document.createElement("span");
    who.className = "who";
    who.textContent = post.name;

    // 작성 시각 (보기 좋게 우리나라식으로 변환)
    const when = document.createElement("span");
    when.className = "when";
    when.textContent = formatTime(post.created_at);

    // 메시지 본문
    const msg = document.createElement("div");
    msg.className = "msg";
    msg.textContent = post.message;

    // ⚠️ 보안 팁: 위처럼 textContent로 글자를 넣으면, 사용자가 적은
    //    <script> 같은 코드가 '글자 그대로' 표시되어 안전합니다.
    //    innerHTML로 사용자 입력을 그대로 넣으면 XSS(악성코드 삽입) 위험이 있어요.

    // 조립: li 안에 [이름 + 시각]을 한 줄로, 그 아래 메시지를 넣습니다.
    const head = document.createElement("div");
    head.appendChild(who);
    head.appendChild(when);

    li.appendChild(head);
    li.appendChild(msg);

    // 완성된 li를 화면 목록(ul)에 추가
    listEl.appendChild(li);
  });
}

// -------------------------------------------------------------
// 4) 보조 함수들
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
// 5) 실행 트리거
// -------------------------------------------------------------
// (1) 페이지가 열리면 자동으로 한 번 목록을 불러옵니다.
loadGuestbook();
// (2) [새로고침] 버튼을 누르면 다시 불러옵니다.
reloadBtn.addEventListener("click", loadGuestbook);
