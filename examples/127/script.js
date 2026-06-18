// =============================================================
// 실습 127 — Supabase 가계부: 분류별 합계(reduce) + 월별 필터(gte/lte)
// =============================================================
//
// 앞선 실습에서 insert(추가)·select(목록)·order(정렬)·ilike(검색)를 배웠습니다.
// 이번에는 두 가지를 새로 합칩니다.
//
//   (1) 월별 필터 — 날짜 '범위'로 받아오기
//       .gte('spent_on', 시작일)  →  spent_on >= 시작일 (이 날짜 이후)
//       .lte('spent_on', 끝일)    →  spent_on <= 끝일   (이 날짜 이전)
//       두 개를 같이 쓰면 '그 달 1일 ~ 말일' 사이 줄만 받아옵니다.
//       gte = greater than or equal(>=), lte = less than or equal(<=)
//
//   (2) 분류별 합계 — 받은 목록을 화면에서 reduce 로 묶기
//       서버는 '그 달 지출 목록'만 줍니다. 분류별로 더해 합계를 내는 건
//       브라우저(자바스크립트)의 reduce 가 합니다.
//       reduce = 배열을 돌면서 값을 '하나로 누적'하는 도구.
//       여기서는 { 식비: 11000, 교통: 1400, ... } 같은 '분류→합계' 묶음을 만듭니다.

// -------------------------------------------------------------
// 1) 내 프로젝트 값 (Supabase 대시보드: Settings → API 에서 복사)
// -------------------------------------------------------------
//
// ▶ URL : 내 데이터베이스가 사는 인터넷 주소. 비밀이 아닙니다.
// ▶ anon key(공개 키, sb_publishable_...) : 브라우저에 그대로 박아도 되는 '출입증'.
//    RLS 정책이 켜져 있어서 공개해도 안전합니다(schema.sql에서 설정함).
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
const monthPicker = document.getElementById("monthPicker"); // 월 선택 input[type=month]
const addForm     = document.getElementById("addForm");     // 지출 추가 폼
const summaryEl   = document.getElementById("summary");     // 분류별 합계 카드 ul
const totalEl     = document.getElementById("total");       // 전체 합계
const listEl      = document.getElementById("expenseList"); // 지출 목록 ul
const statusEl    = document.getElementById("status");      // 상태 안내 박스

// 자리표시자를 안 바꾼 채 실행하면 무조건 실패하므로, 미리 알려 주는 도우미
function isPlaceholder() {
  return SUPABASE_URL.includes("여기에-내") || SUPABASE_ANON_KEY.includes("여기에-내");
}

// -------------------------------------------------------------
// 3) 선택한 달의 '시작일'과 '끝일'을 만드는 함수  ★ 핵심(1)의 준비 ★
// -------------------------------------------------------------
//   input[type=month] 값은 "2026-06" 같은 모양입니다.
//   여기서 그 달의 1일과 말일을 계산해 'YYYY-MM-DD' 문자열로 돌려줍니다.
//   - 시작일: 그 달 1일      → "2026-06-01"
//   - 끝일  : 다음 달 0일    → "2026-06-30" (Date에서 day=0은 '전달 마지막 날')
function monthRange(monthValue) {
  const [year, month] = monthValue.split("-").map(Number); // "2026-06" → [2026, 6]
  const first = `${year}-${pad(month)}-01`;
  const lastDay = new Date(year, month, 0).getDate();      // month는 1~12, day=0 → 그 달 말일
  const last = `${year}-${pad(month)}-${pad(lastDay)}`;
  return { first, last };
}

// -------------------------------------------------------------
// 4) [목록+필터] 선택한 달의 지출만 서버에서 받아오기  ★ 핵심(1) ★
// -------------------------------------------------------------
async function loadMonth() {
  const monthValue = monthPicker.value;        // 예: "2026-06"
  if (!monthValue) return;                      // 아직 달을 안 골랐으면 멈춤

  const { first, last } = monthRange(monthValue);
  showStatus("info", `${monthValue} 지출 불러오는 중…`);

  try {
    const { data, error } = await db
      .from("expenses")
      .select("*")
      .gte("spent_on", first)   // spent_on >= 그 달 1일   ← 날짜 범위 시작
      .lte("spent_on", last)    // spent_on <= 그 달 말일   ← 날짜 범위 끝
      .order("spent_on", { ascending: true });

    if (error) throw error;

    console.log(`✅ ${monthValue} 지출 ${data.length}건:`, data);
    renderList(data);     // 목록 그리기
    renderSummary(data);  // 분류별 합계 계산해서 그리기 (핵심 2)
    hideStatus();
  } catch (err) {
    console.error("❌ 불러오기 실패:", err.message);
    showStatus("fail", friendlyError("월별 지출 불러오기 실패", err));
  }
}

// -------------------------------------------------------------
// 5) [집계] 분류별 합계를 reduce 로 계산해 화면에 그리기  ★ 핵심(2) ★
// -------------------------------------------------------------
function renderSummary(expenses) {
  summaryEl.innerHTML = "";

  // reduce: 배열을 돌며 '분류 → 합계' 객체에 금액을 누적합니다.
  //   예) [{식비,6500},{교통,1400},{식비,4500}]
  //       → { 식비: 11000, 교통: 1400 }
  const byCategory = expenses.reduce((acc, row) => {
    acc[row.category] = (acc[row.category] || 0) + row.amount; // 없으면 0에서 시작해 더하기
    return acc;
  }, {}); // {} = 빈 객체에서 시작

  const categories = Object.keys(byCategory);

  if (categories.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "이 달에는 지출이 없어요.";
    summaryEl.appendChild(li);
    totalEl.textContent = "";
    return;
  }

  // 합계가 큰 분류부터 보기 좋게 정렬
  categories.sort((a, b) => byCategory[b] - byCategory[a]);

  categories.forEach((cat) => {
    const li = document.createElement("li");

    const catEl = document.createElement("div");
    catEl.className = "cat";
    catEl.textContent = cat;

    const sumEl = document.createElement("div");
    sumEl.className = "sum";
    sumEl.textContent = won(byCategory[cat]);

    li.appendChild(catEl);
    li.appendChild(sumEl);
    summaryEl.appendChild(li);
  });

  // 전체 합계 = 분류별 합계들을 또 한 번 reduce 로 더하기
  const total = categories.reduce((sum, cat) => sum + byCategory[cat], 0);
  totalEl.textContent = "이 달 전체 합계: " + won(total);
}

// -------------------------------------------------------------
// 6) [목록] 받아온 지출 줄들을 화면 목록에 그리기
// -------------------------------------------------------------
function renderList(expenses) {
  listEl.innerHTML = "";

  if (expenses.length === 0) {
    const li = document.createElement("li");
    li.className = "empty";
    li.textContent = "이 달 지출 내역이 없어요. 위 폼으로 추가해 보세요.";
    listEl.appendChild(li);
    return;
  }

  expenses.forEach((row) => {
    const li = document.createElement("li");

    const left = document.createElement("div");
    const name = document.createElement("div");
    name.textContent = row.item; // textContent → 사용자가 적은 글자 그대로 표시(XSS 방지)
    const meta = document.createElement("div");
    meta.className = "meta";
    meta.textContent = `${row.spent_on} · ${row.category}`;
    left.appendChild(name);
    left.appendChild(meta);

    const amt = document.createElement("div");
    amt.className = "amount";
    amt.textContent = won(row.amount);

    li.appendChild(left);
    li.appendChild(amt);
    listEl.appendChild(li);
  });
}

// -------------------------------------------------------------
// 7) [추가] 폼 제출 시 새 지출을 서버에 insert 하기
// -------------------------------------------------------------
addForm.addEventListener("submit", async (e) => {
  e.preventDefault(); // 폼 기본 동작(페이지 새로고침) 막기

  const newRow = {
    item: document.getElementById("item").value.trim(),
    amount: Number(document.getElementById("amount").value),
    category: document.getElementById("category").value,
    spent_on: document.getElementById("spentOn").value, // "YYYY-MM-DD"
  };

  if (!newRow.item || !newRow.amount || !newRow.spent_on) {
    showStatus("fail", "내용·금액·날짜를 모두 채워 주세요.");
    return;
  }

  try {
    const { error } = await db.from("expenses").insert(newRow);
    if (error) throw error;

    console.log("✅ 지출 추가됨:", newRow);
    showStatus("ok", "지출이 추가됐어요!");
    addForm.reset();

    // 추가한 지출의 달로 화면을 맞춘 뒤 다시 불러오기
    monthPicker.value = newRow.spent_on.slice(0, 7); // "2026-06-15" → "2026-06"
    loadMonth();
  } catch (err) {
    console.error("❌ 추가 실패:", err.message);
    showStatus("fail", friendlyError("지출 추가 실패", err));
  }
});

// -------------------------------------------------------------
// 8) 보조 함수들
// -------------------------------------------------------------
function pad(n) {
  return String(n).padStart(2, "0"); // 6 → "06"
}

function won(n) {
  return n.toLocaleString("ko-KR") + "원"; // 11000 → "11,000원"
}

function todayMonth() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}`; // 이번 달 "YYYY-MM"
}

function todayDate() {
  const d = new Date();
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}

// 에러 메시지를 비전공자도 알아볼 수 있게 풀어 줍니다.
function friendlyError(prefix, err) {
  const msg = err.message || "";
  if (msg.includes("does not exist") || msg.includes("relation")) {
    return prefix + ": expenses 표가 아직 없어요. schema.sql 1단계(표 만들기)를 실행하세요.";
  }
  if (msg.includes("row-level security")) {
    return prefix + ": RLS는 켜졌는데 정책이 없어서 막혔어요. schema.sql 3단계(정책)를 실행하세요.";
  }
  if (msg.includes("Invalid API key")) {
    return prefix + ": anon 키가 잘못됐어요. script.js의 SUPABASE_ANON_KEY를 다시 확인하세요.";
  }
  if (msg.includes("violates check constraint")) {
    return prefix + ": 금액은 0보다 큰 숫자여야 해요.";
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
// 9) 실행 트리거
// -------------------------------------------------------------
// 폼의 날짜 기본값은 '오늘', 월 선택 기본값은 '이번 달'로 맞춰 둡니다.
document.getElementById("spentOn").value = todayDate();
monthPicker.value = todayMonth();

// 월 선택을 바꿀 때마다 그 달치 다시 불러오기 (핵심 1)
monthPicker.addEventListener("change", loadMonth);

if (isPlaceholder()) {
  console.warn(
    "⚠️ 아직 자리표시자 그대로입니다. script.js의 SUPABASE_URL / SUPABASE_ANON_KEY를 내 anon 값으로 바꾸세요."
  );
  showStatus("fail", "아직 내 프로젝트 값이 입력되지 않았어요 (script.js 수정 필요)");
} else {
  loadMonth(); // 페이지가 열리면 이번 달 지출을 자동으로 불러오기
}
