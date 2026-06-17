// =============================================================
// 실습 123 — 방명록 목록을 .order() 로 "정렬"해서 보여주기
// =============================================================
//
// 이 파일이 하는 일:
//   (1) 내 프로젝트 정보(URL + anon 키)로 Supabase에 '연결'을 만든다. (실습 115)
//   (2) supabase.from('guestbook').select('*').order(컬럼, {ascending})
//       로 표의 글들을 "정해진 순서대로" 받아온다.   ← 이번 실습의 핵심!
//   (3) 받아온 글 배열을 forEach로 돌면서 <li>를 만들어 화면 목록에 그린다. (실습 117)
//
// 117(select)이 "선반 위 글들을 그냥 꺼내 오기"였다면,
// 123(order)은 "꺼내 오기 전에 서버에게 '최신순으로 줄 세워서 줘'라고 부탁하기"입니다.
// 정렬을 누가 하느냐가 포인트: 우리(브라우저)가 아니라 서버(DB)가 정렬해서 보냅니다.

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
const listEl = document.getElementById("list");        // 글들이 들어갈 ul
const statusEl = document.getElementById("status");    // 상태 안내 문구 박스
const reloadBtn = document.getElementById("reload-btn"); // 다시 불러오기 버튼
const sortSelect = document.getElementById("sort-select"); // 정렬 기준 드롭다운

// -------------------------------------------------------------
// 3) 서버에서 글 목록을 "정렬해서" 불러와 화면에 그리는 함수
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

  // ----- 드롭다운에서 고른 정렬 기준을 읽어 둘로 쪼갭니다 -----
  // value 예: "created_at|desc"  →  column="created_at", direction="desc"
  const [column, direction] = sortSelect.value.split("|");
  // .order()의 두 번째 옵션 ascending 은 true/false 라는 점에 주의!
  //   - ascending: true  → 오름차순 (작은 값 → 큰 값 / 옛날 → 최신 / 가나다 ㄱ→ㅎ)
  //   - ascending: false → 내림차순 (큰 값 → 작은 값 / 최신 → 옛날)  ← '최신순'은 이것!
  const ascending = direction === "asc";

  // 불러오는 동안 버튼/드롭다운을 잠그고, '불러오는 중' 안내를 띄웁니다.
  reloadBtn.disabled = true;
  showStatus("info", "불러오는 중…");
  console.log(`⏳ '${column}' 기준 ${ascending ? "오름차순" : "내림차순"}으로 정렬해서 불러옵니다…`);

  // =========================================================
  // ★ 이번 실습의 핵심 한 줄 ★
  // .select("*")                       : 모든 컬럼을 다 가져온다
  // .order(column, { ascending })      : column 기준으로 줄 세워서 달라고 서버에 부탁
  //   - 정렬은 서버(DB)가 해 줍니다. 우리는 "어떤 기준으로"만 알려 주면 됩니다.
  //   - column 자리에 "created_at" 을 넣으면 시간순, "name" 을 넣으면 이름순.
  // =========================================================
  const { data, error } = await db
    .from("guestbook")
    .select("*")
    .order(column, { ascending });

  reloadBtn.disabled = false;

  if (error) {
    // 서버에서 에러가 돌아온 경우 (대표 원인은 README 검증법 참고)
    console.error("❌ 불러오기 실패:", error.message);
    showStatus("fail", "불러오기 실패: " + error.message);
    return;
  }

  console.log(`✅ 성공! 서버가 정렬해서 돌려준 글 ${data.length}개:`, data);

  // 다시 그리기 전에, 이전에 그려 둔 목록을 깨끗이 비웁니다.
  // (이걸 안 하면 정렬을 바꿀 때마다 글이 두 배, 세 배로 쌓입니다.)
  listEl.innerHTML = "";

  // 글이 한 개도 없으면 안내만 보여 주고 끝냅니다.
  if (data.length === 0) {
    showStatus("info", "아직 글이 없어요. 실습 116에서 첫 글을 남겨 보세요!");
    return;
  }

  // 글이 있으면 안내 문구는 숨깁니다.
  hideStatus();

  // ----- 서버가 '이미 정렬해서 보낸' 글 배열을 한 줄씩 돌면서 <li>로 만들기 -----
  // (우리는 순서를 따로 안 바꿉니다. 받은 순서 그대로 그리면 정렬이 끝나 있습니다.)
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
// (1) 페이지가 열리면 자동으로 한 번(기본=최신순) 목록을 불러옵니다.
loadGuestbook();
// (2) [다시 불러오기] 버튼을 누르면 현재 고른 기준으로 다시 불러옵니다.
reloadBtn.addEventListener("click", loadGuestbook);
// (3) 드롭다운에서 정렬 기준을 바꾸면 곧바로 다시 불러옵니다.
//     → 같은 글들이 순서만 바뀌어 나타나는 걸 보며 order의 효과를 체감하세요.
sortSelect.addEventListener("change", loadGuestbook);
