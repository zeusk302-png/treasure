// =============================================================
// 실습 255 — 예약을 Supabase에 저장 + 이미 찬 시간대는 비활성화
// =============================================================
//
// 이 실습의 한 가지 목표:
//   1) 손님이 고른 '날짜 + 시간대'를 Supabase에 저장(INSERT)한다.
//   2) 같은 날짜에 이미 찬 시간대는 화면(드롭다운)에서 '예약 마감'으로 막는다.
//   즉 "DB를 조회한 결과로 UI(선택지)를 켜고 끄는" 조건부 UI 패턴입니다.
//
// 중복은 두 겹으로 막습니다:
//   (a) 화면: 찬 시간대를 disabled 로 회색 처리 → 고를 수 없게 함 (친절한 안내)
//   (b) DB:  (slot_date, slot_time) UNIQUE 제약 → 동시에 눌러도 한 명만 성공 (진짜 방어)
//   ※ 화면 검사만으로는 동시 클릭을 못 막습니다. 그래서 DB 제약이 '진짜 자물쇠'입니다.

// -------------------------------------------------------------
// 1) 내 프로젝트 값 (Supabase 대시보드: Settings → API 에서 복사)
// -------------------------------------------------------------
//
// ▶ URL : 내 데이터베이스가 사는 인터넷 주소. 비밀이 아닙니다.
// ▶ anon key(공개 키, sb_publishable_...) : 브라우저에 그대로 박아도 되는 '출입증'.
//    - 공개돼도 안전한 이유는 표에 RLS(행 수준 보안)를 켜고
//      "읽기(SELECT) + 저장(INSERT)만 허용" 정책을 달았기 때문입니다. (schema.sql 참고)
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

// 이 가게에서 받는 '예약 가능한 시간대 후보' 목록 (운영 시간이라고 생각하세요)
const ALL_SLOTS = ["10:00", "11:00", "13:00", "14:00", "15:00", "16:00", "17:00"];

// 화면 요소들 미리 잡아 두기
const formEl = document.getElementById("form");
const nameEl = document.getElementById("name");
const dateEl = document.getElementById("date");
const timeEl = document.getElementById("time");
const submitEl = document.getElementById("submit");
const statusEl = document.getElementById("status");

// 자리표시자를 안 바꾼 채 실행하면 무조건 실패하므로, 미리 알려 주는 도우미
function isPlaceholder() {
  return SUPABASE_URL.includes("여기에-내") || SUPABASE_ANON_KEY.includes("여기에-내");
}

// -------------------------------------------------------------
// 3) 안내/결과 메시지 표시 도우미
// -------------------------------------------------------------
function showStatus(kind, text) {
  statusEl.hidden = false;
  statusEl.className = "status " + kind; // info | ok | fail
  statusEl.textContent = text;
}

// -------------------------------------------------------------
// 4) [핵심 ①] 선택한 날짜에 '이미 찬 시간대'를 Supabase에서 읽어 오기
// -------------------------------------------------------------
// .eq("slot_date", date) → 그 날짜의 예약 줄만 골라서
// .select("slot_time")   → 시간대 칸만 가져옵니다.
// 결과 예: [{slot_time:"10:00"}, {slot_time:"14:00"}]  → ["10:00","14:00"]
async function fetchTakenTimes(date) {
  const { data, error } = await db
    .from("reservations")
    .select("slot_time")
    .eq("slot_date", date);

  if (error) throw error;
  return data.map((row) => row.slot_time); // 찬 시간대 문자열 배열
}

// -------------------------------------------------------------
// 5) [핵심 ②] 시간대 드롭다운 다시 그리기 — 찬 시간대는 disabled
// -------------------------------------------------------------
// 조회 결과(taken)에 들어 있는 시간대는 option 을 비활성화(disabled)하고
// 글자에 '(예약 마감)'을 붙여, 손님이 고를 수 없게 만듭니다. (= 조건부 UI)
function renderTimeOptions(takenTimes) {
  timeEl.innerHTML = ""; // 기존 선택지 비우기

  // 맨 위 안내용 빈 옵션
  const head = document.createElement("option");
  head.value = "";
  head.textContent = "시간대를 고르세요";
  timeEl.appendChild(head);

  let openCount = 0;
  ALL_SLOTS.forEach((slot) => {
    const opt = document.createElement("option");
    opt.value = slot;

    const isTaken = takenTimes.includes(slot);
    if (isTaken) {
      opt.textContent = slot + "  (예약 마감)";
      opt.disabled = true; // ★ 이미 찬 시간대는 선택 불가 ★
    } else {
      opt.textContent = slot;
      openCount++;
    }
    timeEl.appendChild(opt);
  });

  timeEl.disabled = false; // 날짜를 골랐으니 시간대 선택을 켭니다.

  if (openCount === 0) {
    showStatus("info", "이 날짜는 모든 시간대가 마감되었어요. 다른 날짜를 골라 보세요.");
  } else {
    statusEl.hidden = true;
  }
}

// -------------------------------------------------------------
// 6) 날짜를 고를 때마다 → 찬 시간대 조회 → 드롭다운 갱신
// -------------------------------------------------------------
dateEl.addEventListener("change", async () => {
  const date = dateEl.value;
  submitEl.disabled = true;  // 시간대 다시 고르기 전까지 제출 잠금
  timeEl.value = "";

  if (!date) {
    timeEl.disabled = true;
    return;
  }

  try {
    showStatus("info", "이 날짜의 예약 현황을 확인하는 중…");
    const taken = await fetchTakenTimes(date);
    renderTimeOptions(taken);
  } catch (err) {
    console.error("❌ 예약 현황 조회 실패:", err.message);
    let friendly = "예약 현황을 불러오지 못했어요: " + err.message;
    if (err.message && err.message.includes("does not exist")) {
      friendly = "reservations 표가 없어요. schema.sql을 Supabase SQL Editor에서 먼저 실행하세요.";
    } else if (err.message && err.message.includes("Invalid API key")) {
      friendly = "anon 키가 틀린 것 같아요. script.js의 SUPABASE_ANON_KEY를 다시 확인하세요.";
    } else if (err.message && err.message.includes("Failed to fetch")) {
      friendly = "연결에 실패했어요. SUPABASE_URL 철자와 https:// 를 확인하세요.";
    }
    showStatus("fail", friendly);
  }
});

// 시간대를 실제로 골랐을 때만 '예약하기' 버튼을 켭니다.
timeEl.addEventListener("change", () => {
  submitEl.disabled = !timeEl.value;
});

// -------------------------------------------------------------
// 7) [핵심 ③] 예약 저장하기 — INSERT, 그리고 중복(UNIQUE 위반) 처리
// -------------------------------------------------------------
formEl.addEventListener("submit", async (e) => {
  e.preventDefault(); // 폼 기본 새로고침 막기

  const name = nameEl.value.trim();
  const date = dateEl.value;
  const time = timeEl.value;

  if (!name || !date || !time) {
    showStatus("fail", "이름·날짜·시간대를 모두 입력하세요.");
    return;
  }

  submitEl.disabled = true; // 중복 클릭 방지(연타 막기)
  showStatus("info", "예약을 저장하는 중…");

  try {
    const { error } = await db
      .from("reservations")
      .insert({ name: name, slot_date: date, slot_time: time });

    if (error) throw error;

    // 성공!
    showStatus("ok", `예약 완료: ${date} ${time} (${name}님)`);
    console.log("✅ 예약 저장 성공:", { name, date, time });

    // 방금 잡은 시간대를 곧바로 '마감'으로 반영 (조건부 UI 즉시 갱신)
    const taken = await fetchTakenTimes(date);
    renderTimeOptions(taken);
    timeEl.value = "";
    // 성공 메시지를 덮어쓰지 않도록 다시 보여 줍니다.
    showStatus("ok", `예약 완료: ${date} ${time} (${name}님)`);
  } catch (err) {
    console.error("❌ 예약 저장 실패:", err.message);

    let friendly = "예약을 저장하지 못했어요: " + err.message;

    // ★ 중복 방지 핵심 ★
    // (slot_date, slot_time) UNIQUE 제약을 어기면 코드 23505(중복) 에러가 납니다.
    // = 내가 누르는 사이에 다른 사람이 그 시간대를 먼저 예약한 경우.
    if (err.code === "23505" || (err.message && err.message.includes("duplicate key"))) {
      friendly = "방금 다른 분이 그 시간대를 먼저 예약했어요. 다른 시간대를 골라 주세요.";
      // 화면을 최신 상태로 다시 그려서 그 시간대를 마감 처리합니다.
      try {
        const taken = await fetchTakenTimes(date);
        renderTimeOptions(taken);
      } catch (_) {
        /* 갱신 실패는 무시 */
      }
    } else if (err.message && err.message.includes("does not exist")) {
      friendly = "reservations 표가 없어요. schema.sql을 Supabase SQL Editor에서 먼저 실행하세요.";
    } else if (
      err.message &&
      (err.message.includes("row-level security") || err.message.includes("violates row-level"))
    ) {
      friendly = "저장이 정책에 막혔어요. schema.sql의 INSERT 정책(4단계)이 실행됐는지 확인하세요.";
    } else if (err.message && err.message.includes("Invalid API key")) {
      friendly = "anon 키가 틀린 것 같아요. script.js의 SUPABASE_ANON_KEY를 다시 확인하세요.";
    } else if (err.message && err.message.includes("Failed to fetch")) {
      friendly = "연결에 실패했어요. SUPABASE_URL 철자와 https:// 를 확인하세요.";
    }

    showStatus("fail", friendly);
  }
});

// -------------------------------------------------------------
// 8) 실행 트리거 — 페이지가 열리면 곧바로 시작
// -------------------------------------------------------------
if (isPlaceholder()) {
  console.warn(
    "⚠️ 아직 자리표시자 그대로입니다. script.js의 SUPABASE_URL / SUPABASE_ANON_KEY를 내 anon 값으로 바꾸세요."
  );
  showStatus("fail", "아직 내 프로젝트 값이 입력되지 않았어요 (script.js 수정 필요)");
  dateEl.disabled = true;
} else {
  // 날짜 입력칸의 최소 날짜를 오늘로 막아, 지난 날짜 예약을 줄입니다(선택 사항).
  const today = new Date().toISOString().slice(0, 10); // YYYY-MM-DD
  dateEl.min = today;
  showStatus("info", "먼저 날짜를 고르면, 그 날짜의 빈 시간대만 보여 드릴게요.");
}
