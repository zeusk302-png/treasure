// =============================================================
// 실습 125 — 방명록을 .range() 로 "10개씩 끊어" 페이지네이션하기
// =============================================================
//
// 이 파일이 하는 일:
//   (1) 내 프로젝트 정보(URL + anon 키)로 Supabase에 '연결'을 만든다. (실습 115)
//   (2) supabase.from('guestbook')
//         .select('*', { count: 'exact' })       ← 전체가 몇 개인지도 같이 받기
//         .order('created_at', { ascending:false}) ← 최신순으로 줄 세우고 (실습 123)
//         .range(from, to)                        ← 그 줄에서 '한 페이지 분량'만 잘라 오기  ★이번 핵심★
//   (3) 받아온 10개를 forEach로 돌면서 <li>로 그린다. (실습 117)
//   (4) 전체 개수(count)로 '총 몇 페이지'인지 계산해 [이전]/[다음] 버튼을 켜고 끈다.
//
// 핵심 비유:
//   123(order)이 "글들을 최신순으로 한 줄로 세우기"였다면,
//   125(range)는 "그 줄에서 1~10번째만 잘라서 가져오기"입니다.
//   페이지를 넘긴다 = 자르는 '구간'을 10칸씩 옮기는 것일 뿐입니다.

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

// 한 페이지에 몇 개씩 보여 줄지. (10으로 두면 10개씩 끊어 보여 줍니다.)
const PAGE_SIZE = 10;

// -------------------------------------------------------------
// 2) 연결(클라이언트) 만들기
// -------------------------------------------------------------
// CDN 라이브러리가 전역에 만들어 준 supabase 객체의 createClient를 부릅니다.
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 화면 요소들 미리 잡아 두기
const listEl = document.getElementById("list");        // 글들이 들어갈 ul
const statusEl = document.getElementById("status");    // 상태 안내 문구 박스
const prevBtn = document.getElementById("prev-btn");   // [← 이전] 버튼
const nextBtn = document.getElementById("next-btn");   // [다음 →] 버튼
const pageInfoEl = document.getElementById("page-info"); // "1 / 3" 같은 현재/전체 표시

// -------------------------------------------------------------
// '상태(state)' — 지금 몇 페이지를 보고 있는지 기억하는 변수
// -------------------------------------------------------------
// currentPage : 사람이 읽기 쉬운 1부터 시작하는 페이지 번호. (1페이지, 2페이지…)
// totalPages  : 전체가 몇 페이지인지. 첫 로딩 때 count로 계산해 채웁니다.
let currentPage = 1;
let totalPages = 1;

// -------------------------------------------------------------
// 3) 서버에서 '현재 페이지 분량'만 불러와 화면에 그리는 함수
// -------------------------------------------------------------
async function loadPage() {
  // 값을 안 바꾸고 그대로 두면 분명히 실패하므로, 친절하게 먼저 알려줍니다.
  if (SUPABASE_URL.includes("여기에-내") || SUPABASE_ANON_KEY.includes("여기에-내")) {
    console.warn(
      "⚠️ 아직 자리표시자 그대로입니다. script.js의 SUPABASE_URL / SUPABASE_ANON_KEY를 내 값으로 바꾸세요."
    );
    showStatus("fail", "아직 내 프로젝트 값이 입력되지 않았어요 (script.js 수정 필요)");
    return;
  }

  // ===== 이번 실습의 핵심: '몇 번째부터 몇 번째까지' 잘라 올지 계산 =====
  // range 는 0번부터 셉니다(0-based). 사람처럼 1번부터가 아닙니다!
  //   1페이지 → from=0,  to=9   (0~9   = 10개)
  //   2페이지 → from=10, to=19  (10~19 = 10개)
  //   3페이지 → from=20, to=29  (남은 만큼만 옵니다. 부족하면 알아서 적게 줍니다)
  const from = (currentPage - 1) * PAGE_SIZE; // 시작 인덱스
  const to = from + PAGE_SIZE - 1;            // 끝 인덱스(이 번호까지 '포함')

  // 불러오는 동안 버튼을 잠그고, '불러오는 중' 안내를 띄웁니다.
  prevBtn.disabled = true;
  nextBtn.disabled = true;
  showStatus("info", "불러오는 중…");
  console.log(`⏳ ${currentPage}페이지 요청: .range(${from}, ${to})`);

  // =========================================================
  // ★ 이번 실습의 핵심 한 묶음 ★
  // .select("*", { count: "exact" })  : 10개를 받아오면서 '전체가 총 몇 개인지'도 함께 받기
  // .order("created_at", {ascending:false}) : 최신순으로 줄 세우기 (이게 있어야 페이지 순서가 일정함!)
  // .range(from, to)                  : 그 줄에서 from~to 구간만 잘라서 받기
  //   - 정렬 없이 range만 쓰면, 같은 페이지를 다시 눌렀을 때 순서가 들쭉날쭉할 수 있어요.
  //     그래서 페이지네이션에는 .order() 가 사실상 짝꿍입니다.
  // =========================================================
  const { data, count, error } = await db
    .from("guestbook")
    .select("*", { count: "exact" })
    .order("created_at", { ascending: false })
    .range(from, to);

  if (error) {
    // 서버에서 에러가 돌아온 경우 (대표 원인은 README 검증법 참고)
    console.error("❌ 불러오기 실패:", error.message);
    showStatus("fail", "불러오기 실패: " + error.message);
    updatePager(); // 버튼 상태라도 정리
    return;
  }

  // count = 표 전체 글 개수. 이걸로 '총 페이지 수'를 계산합니다.
  //   총페이지수 = 올림(전체개수 / 한페이지개수).  예: 25개 / 10 = 2.5 → 올림 → 3페이지
  //   Math.max(1, ...) : 글이 0개라도 최소 1페이지로 둬서 "1 / 1"이 되게 합니다.
  totalPages = Math.max(1, Math.ceil((count || 0) / PAGE_SIZE));
  console.log(`✅ 성공! 전체 ${count}개 중 이 페이지 ${data.length}개를 받았습니다. (총 ${totalPages}페이지)`);

  // 다시 그리기 전에, 이전 페이지에 그려 둔 목록을 깨끗이 비웁니다.
  // (이걸 안 하면 페이지를 넘길 때마다 글이 계속 아래로 쌓입니다.)
  listEl.innerHTML = "";

  // 글이 한 개도 없으면 안내만 보여 주고 끝냅니다.
  if (!data || data.length === 0) {
    showStatus("info", "아직 글이 없어요. schema.sql로 연습용 글을 넣어 보세요!");
    updatePager();
    return;
  }

  // 글이 있으면 안내 문구는 숨깁니다.
  hideStatus();

  // ----- 받아온 '이 페이지 분량'을 한 줄씩 돌면서 <li>로 만들기 -----
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

  // 페이지 표시("2 / 3")와 버튼 잠금 상태를 갱신합니다.
  updatePager();
}

// -------------------------------------------------------------
// 4) 페이지 표시 + [이전]/[다음] 버튼 잠금 상태 갱신
// -------------------------------------------------------------
function updatePager() {
  pageInfoEl.textContent = `${currentPage} / ${totalPages}`;
  // 첫 페이지에서는 [이전]을, 마지막 페이지에서는 [다음]을 누를 수 없게 잠급니다.
  prevBtn.disabled = currentPage <= 1;
  nextBtn.disabled = currentPage >= totalPages;
}

// -------------------------------------------------------------
// 5) 보조 함수들
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
// 6) 버튼 동작 연결 + 첫 실행
// -------------------------------------------------------------
// [← 이전] : 현재 페이지 번호를 1 줄이고 다시 불러옵니다. (1페이지보다 작아지지 않게 보호)
prevBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage = currentPage - 1;
    loadPage();
  }
});

// [다음 →] : 현재 페이지 번호를 1 늘리고 다시 불러옵니다. (마지막 페이지를 넘지 않게 보호)
nextBtn.addEventListener("click", () => {
  if (currentPage < totalPages) {
    currentPage = currentPage + 1;
    loadPage();
  }
});

// 페이지가 처음 열리면 1페이지를 자동으로 불러옵니다.
loadPage();
