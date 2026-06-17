// =============================================================
// 실습 124 — 방명록을 .ilike() 로 "키워드 검색"해서 보여주기
// =============================================================
//
// 이 파일이 하는 일:
//   (1) 내 프로젝트 정보(URL + anon 키)로 Supabase에 '연결'을 만든다. (실습 115)
//   (2) 검색어가 있으면
//         supabase.from('guestbook').select('*')
//                 .ilike('message', '%검색어%')   ← 이번 실습의 핵심!
//                 .order('created_at', {ascending:false})
//       검색어가 비어 있으면 .ilike 없이 전체를 받아온다.
//   (3) 받아온 글 배열을 forEach로 돌면서 <li>를 만들어 화면 목록에 그린다. (실습 117)
//
// 123(order)이 "받아오기 전에 줄 세워서 줘"였다면,
// 124(ilike)는 "받아오기 전에 이 단어가 든 글만 골라서 줘"라고 서버에 부탁하기입니다.
// ★ 포인트: 검색(거르기)을 누가 하느냐 — 우리(브라우저)가 전부 받아 와서 거르는 게 아니라,
//    서버(DB)가 조건에 맞는 글만 골라서 보냅니다. 이걸 '서버 측 필터링'이라고 합니다.

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
const keywordEl = document.getElementById("keyword");  // 검색어 입력칸
const searchBtn = document.getElementById("search-btn"); // [검색] 버튼
const allBtn = document.getElementById("all-btn");       // [전체 보기] 버튼

// -------------------------------------------------------------
// 3) 서버에서 글 목록을 "검색해서" 불러와 화면에 그리는 함수
// -------------------------------------------------------------
// 매개변수 keyword: 찾을 단어. 빈 문자열("")이면 '검색 안 함 = 전체 보기'로 처리.
async function loadGuestbook(keyword = "") {
  // 값을 안 바꾸고 그대로 두면 분명히 실패하므로, 친절하게 먼저 알려줍니다.
  if (SUPABASE_URL.includes("여기에-내") || SUPABASE_ANON_KEY.includes("여기에-내")) {
    console.warn(
      "⚠️ 아직 자리표시자 그대로입니다. script.js의 SUPABASE_URL / SUPABASE_ANON_KEY를 내 값으로 바꾸세요."
    );
    showStatus("fail", "아직 내 프로젝트 값이 입력되지 않았어요 (script.js 수정 필요)");
    return;
  }

  // 검색어 앞뒤의 불필요한 공백은 잘라냅니다. ("  안녕 " → "안녕")
  const word = keyword.trim();

  // 불러오는 동안 버튼을 잠그고, '불러오는 중' 안내를 띄웁니다.
  searchBtn.disabled = true;
  allBtn.disabled = true;
  showStatus("info", word ? `'${word}' 검색 중…` : "전체 목록 불러오는 중…");

  // =========================================================
  // ★ 이번 실습의 핵심 ★
  //
  // 먼저 기본 쿼리(질의)를 만들어 둡니다.
  //   .select("*")  : 모든 컬럼을 다 가져온다
  let query = db.from("guestbook").select("*");

  // 검색어가 있을 때만 .ilike 필터를 '추가로' 붙입니다.
  //   .ilike(컬럼, 패턴)
  //     - i  = insensitive(대소문자 무시).  Hello / hello / HELLO 다 같게 취급
  //     - like = 부분 일치.  % 는 '아무 글자나 0개 이상'을 뜻하는 와일드카드
  //   '%word%'  →  앞뒤에 무엇이 오든 word 가 '포함'되기만 하면 일치
  //     예) 패턴 '%안녕%' 은  "안녕하세요", "반갑고 안녕", "안녕" 을 모두 찾아 줍니다.
  //   주의: % 를 안 붙이고 .ilike('message', word) 라고 하면 '정확히 word' 인 글만 찾습니다.
  if (word) {
    query = query.ilike("message", `%${word}%`);
    console.log(`🔎 서버에 부탁: message 안에 '${word}' 가 포함된 글만 보내 줘 (대소문자 무시)`);
  } else {
    console.log("📋 검색어 없음 → 전체 글을 보내 줘");
  }

  // 검색 결과도 최신순으로 보기 좋게 정렬해서 받습니다. (실습 123에서 배운 .order)
  query = query.order("created_at", { ascending: false });

  // 여기서 비로소 await 로 서버에 요청을 보내고 결과를 기다립니다.
  const { data, error } = await query;
  // =========================================================

  searchBtn.disabled = false;
  allBtn.disabled = false;

  if (error) {
    // 서버에서 에러가 돌아온 경우 (대표 원인은 README 검증법 참고)
    console.error("❌ 불러오기 실패:", error.message);
    showStatus("fail", "불러오기 실패: " + error.message);
    return;
  }

  console.log(`✅ 성공! 서버가 골라서 돌려준 글 ${data.length}개:`, data);

  // 다시 그리기 전에, 이전에 그려 둔 목록을 깨끗이 비웁니다.
  // (이걸 안 하면 검색할 때마다 글이 두 배, 세 배로 쌓입니다.)
  listEl.innerHTML = "";

  // 결과가 한 개도 없으면 안내만 보여 주고 끝냅니다.
  if (data.length === 0) {
    if (word) {
      showStatus("info", `'${word}' 가 들어간 글이 없어요. 다른 단어로 검색해 보세요.`);
    } else {
      showStatus("info", "아직 글이 없어요. 실습 116에서 첫 글을 남겨 보세요!");
    }
    return;
  }

  // 결과가 있으면 안내 문구는 숨깁니다.
  hideStatus();

  // ----- 서버가 '이미 걸러서 보낸' 글 배열을 한 줄씩 돌면서 <li>로 만들기 -----
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
// (1) 페이지가 열리면 자동으로 전체 목록을 한 번 불러옵니다. (검색어 없음)
loadGuestbook("");

// (2) [검색] 버튼을 누르면 입력칸의 단어로 검색합니다.
searchBtn.addEventListener("click", () => {
  loadGuestbook(keywordEl.value);
});

// (3) 입력칸에서 Enter 키를 눌러도 검색되게 합니다. (버튼을 누르는 번거로움 제거)
keywordEl.addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    loadGuestbook(keywordEl.value);
  }
});

// (4) [전체 보기] 버튼을 누르면 입력칸을 비우고 전체 목록으로 되돌립니다.
allBtn.addEventListener("click", () => {
  keywordEl.value = "";
  loadGuestbook("");
});
