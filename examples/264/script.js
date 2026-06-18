// =============================================================
// 실습 264 — 대시보드에 KPI 카드와 합계·평균 통계 표시하기
// =============================================================
//
// 이 실습의 한 가지 목표:
//   Supabase에 쌓인 '주문(orders)' 데이터를 '집계(aggregate)'해서
//   핵심 지표(KPI) 카드 4개로 보여 주는 것입니다.
//     · 주문 건수    → COUNT  (몇 줄인가)
//     · 매출 합계    → SUM    (amount를 다 더하면)
//     · 평균 주문액  → AVG    (합계 ÷ 건수)
//     · 고객 수      → DISTINCT COUNT (서로 다른 customer가 몇 명인가)
//
// 집계하는 방법은 두 가지가 있고, 이 파일에 둘 다 들어 있습니다:
//   (A) 브라우저에서 직접 더하기 : 모든 주문을 받아 와 JS로 count/sum/avg 계산 (이해하기 쉬움)
//   (B) DB가 대신 계산하기(RPC)  : DB의 order_stats() 함수가 '요약 한 줄'만 돌려줌 (빠르고 정확)
//   ※ 데이터가 적을 땐 (A)로 충분하고, 아주 많아지면 (B)가 유리합니다.

// -------------------------------------------------------------
// 1) 내 프로젝트 값 (Supabase 대시보드: Settings → API 에서 복사)
// -------------------------------------------------------------
//
// ▶ URL : 내 데이터베이스가 사는 인터넷 주소. 비밀이 아닙니다.
// ▶ anon key(공개 키, sb_publishable_...) : 브라우저에 그대로 박아도 되는 '출입증'.
//    - 공개돼도 안전한 이유는 표에 RLS(행 수준 보안)를 켜고
//      "읽기(SELECT)만 허용" 정책을 달았기 때문입니다. (schema.sql 참고)
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
const statusEl    = document.getElementById("status");
const countEl     = document.getElementById("kpi-count");
const totalEl     = document.getElementById("kpi-total");
const avgEl       = document.getElementById("kpi-avg");
const customersEl = document.getElementById("kpi-customers");
const reloadEl    = document.getElementById("reload");

// 자리표시자를 안 바꾼 채 실행하면 무조건 실패하므로, 미리 알려 주는 도우미
function isPlaceholder() {
  return SUPABASE_URL.includes("여기에-내") || SUPABASE_ANON_KEY.includes("여기에-내");
}

// -------------------------------------------------------------
// 3) 안내/결과 메시지 + 숫자 표시 도우미
// -------------------------------------------------------------
function showStatus(kind, text) {
  statusEl.hidden = false;
  statusEl.className = "status " + kind; // info | ok | fail
  statusEl.textContent = text;
}

// 숫자에 천 단위 콤마를 넣어 줍니다. 예: 112000 → "112,000"
function comma(n) {
  return Number(n).toLocaleString("ko-KR");
}

// 계산된 통계 4개를 카드에 그려 넣습니다.
function renderKpi(stats) {
  countEl.textContent     = comma(stats.orderCount) + " 건";
  totalEl.textContent     = comma(stats.totalAmount) + " 원";
  avgEl.textContent       = comma(stats.avgAmount) + " 원";
  customersEl.textContent = comma(stats.customerCount) + " 명";
}

// -------------------------------------------------------------
// 4) [방법 A] 브라우저에서 직접 집계하기
// -------------------------------------------------------------
// 모든 주문을 select 로 받아 온 뒤, JS 반복문으로 직접 세고/더하고/평균냅니다.
// "집계가 무슨 일을 하는지"가 코드에 그대로 보여서 이해하기 좋습니다.
async function fetchStatsInBrowser() {
  // 주문을 전부 읽어 옵니다. (RLS의 select 정책 덕분에 anon 키로 읽을 수 있음)
  const { data, error } = await db
    .from("orders")
    .select("customer, amount");

  if (error) throw error;

  const orderCount = data.length;                                   // COUNT: 줄 수
  const totalAmount = data.reduce((sum, row) => sum + row.amount, 0); // SUM: 금액 누적
  const avgAmount = orderCount === 0 ? 0 : Math.round(totalAmount / orderCount); // AVG
  // DISTINCT: 중복 없는 손님 이름만 모아 개수를 셉니다. (Set은 같은 값을 한 번만 담음)
  const customerCount = new Set(data.map((row) => row.customer)).size;

  return { orderCount, totalAmount, avgAmount, customerCount };
}

// -------------------------------------------------------------
// 5) [방법 B] DB가 대신 집계하기 (권장 — 주문이 많아질 때 빠름)
// -------------------------------------------------------------
// schema.sql 4단계에서 만든 order_stats() 함수를 'rpc'로 호출합니다.
// DB가 COUNT/SUM/AVG/DISTINCT를 직접 계산해 '요약 한 줄'만 돌려줍니다.
// → 수천·수만 건이어도 브라우저가 모든 줄을 받아오지 않아 빠르고 가볍습니다.
async function fetchStatsFromDb() {
  const { data, error } = await db.rpc("order_stats");
  if (error) throw error;

  // rpc 결과는 보통 [{...}] 형태(한 줄짜리 표)로 옵니다.
  const row = Array.isArray(data) ? data[0] : data;
  return {
    orderCount: row.order_count,
    totalAmount: row.total_amount,
    avgAmount: row.avg_amount,
    customerCount: row.customer_count,
  };
}

// -------------------------------------------------------------
// 6) 통계 불러와 카드에 표시하기
// -------------------------------------------------------------
// 먼저 빠른 DB 방식(B)을 시도하고, 함수가 아직 없으면 브라우저 방식(A)으로 대체합니다.
async function loadDashboard() {
  reloadEl.disabled = true;
  showStatus("info", "통계를 계산하는 중…");

  try {
    let stats;
    try {
      stats = await fetchStatsFromDb();          // (B) DB 함수 우선
    } catch (rpcErr) {
      console.warn("order_stats() 함수를 못 찾아 브라우저 집계로 대체합니다:", rpcErr.message);
      stats = await fetchStatsInBrowser();        // (A) 대체
    }

    renderKpi(stats);
    showStatus("ok", "통계를 불러왔습니다. (방금 갱신됨)");
    console.log("✅ KPI 통계:", stats);
  } catch (err) {
    console.error("❌ 통계 불러오기 실패:", err.message);

    let friendly = "통계를 불러오지 못했어요: " + err.message;
    if (err.message && err.message.includes("does not exist")) {
      friendly = "orders 표가 없어요. schema.sql을 Supabase SQL Editor에서 먼저 실행하세요.";
    } else if (
      err.message &&
      (err.message.includes("row-level security") || err.message.includes("permission denied"))
    ) {
      friendly = "읽기가 정책에 막혔어요. schema.sql의 SELECT 정책(3단계)이 실행됐는지 확인하세요.";
    } else if (err.message && err.message.includes("Invalid API key")) {
      friendly = "anon 키가 틀린 것 같아요. script.js의 SUPABASE_ANON_KEY를 다시 확인하세요.";
    } else if (err.message && err.message.includes("Failed to fetch")) {
      friendly = "연결에 실패했어요. SUPABASE_URL 철자와 https:// 를 확인하세요.";
    }
    showStatus("fail", friendly);
  } finally {
    reloadEl.disabled = false;
  }
}

// 새로고침 버튼: 다시 집계해 카드를 갱신합니다.
reloadEl.addEventListener("click", loadDashboard);

// -------------------------------------------------------------
// 7) 실행 트리거 — 페이지가 열리면 곧바로 시작
// -------------------------------------------------------------
if (isPlaceholder()) {
  console.warn(
    "⚠️ 아직 자리표시자 그대로입니다. script.js의 SUPABASE_URL / SUPABASE_ANON_KEY를 내 anon 값으로 바꾸세요."
  );
  showStatus("fail", "아직 내 프로젝트 값이 입력되지 않았어요 (script.js 수정 필요)");
  reloadEl.disabled = true;
} else {
  loadDashboard();
}
