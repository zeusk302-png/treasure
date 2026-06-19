// =============================================================
// 실습 247 — 뉴스레터 구독 폼: 이메일을 Supabase에 INSERT 하기
// =============================================================
//
// 이 실습의 한 가지 목표:
//   화면(프론트)에서 입력받은 이메일을 Supabase 표(subscribers)에
//   '한 줄 추가(INSERT)' 하는 것. 즉 "브라우저 → DB로 데이터를 쓰는 흐름"입니다.
//
// 핵심 함수는 단 하나: db.from("subscribers").insert({ email })

// -------------------------------------------------------------
// 1) 내 프로젝트 값 (Supabase 대시보드: Settings → API 에서 복사)
// -------------------------------------------------------------
//
// ▶ URL : 내 데이터베이스가 사는 인터넷 주소. 비밀이 아닙니다.
// ▶ anon key(공개 키, sb_publishable_...) : 브라우저에 그대로 박아도 되는 '출입증'.
//    - anon 키가 공개돼도 안전한 이유는 표에 RLS(행 수준 보안)를 켜고
//      "구독(INSERT)만 허용" 정책을 달았기 때문입니다. (schema.sql 참고)
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
const formEl = document.getElementById("subscribe-form"); // 구독 폼
const emailEl = document.getElementById("email");         // 이메일 입력칸
const submitBtn = document.getElementById("submit-btn");  // 구독 버튼
const statusEl = document.getElementById("status");       // 상태 안내 박스

// 자리표시자를 안 바꾼 채 실행하면 무조건 실패하므로, 미리 알려 주는 도우미
function isPlaceholder() {
  return SUPABASE_URL.includes("여기에-내") || SUPABASE_ANON_KEY.includes("여기에-내");
}

// -------------------------------------------------------------
// 3) [쓰기] 이메일 한 줄을 subscribers 표에 INSERT 하는 함수
// -------------------------------------------------------------
async function subscribe(email) {
  submitBtn.disabled = true;
  showStatus("info", "구독 처리 중…");

  try {
    // ★ 이 한 줄이 실습의 핵심 ★
    // from(표 이름).insert({ 컬럼: 값 }) → 표에 새 줄 한 개를 추가합니다.
    const { error } = await db
      .from("subscribers")
      .insert({ email: email });

    if (error) throw error;

    console.log("✅ 구독 저장 성공:", email);
    showStatus("ok", "구독 완료! 곧 첫 레터로 찾아뵐게요 😊");
    formEl.reset();
  } catch (err) {
    console.error("❌ 구독 저장 실패:", err.message);

    // 비전공자도 알아볼 수 있게 자주 나는 에러를 친절히 풀어 줍니다.
    let friendly = "구독 실패: " + err.message;

    // (1) 이미 가입한 이메일 — schema.sql에서 email을 unique로 막아 둠
    if (err.code === "23505" || (err.message && err.message.includes("duplicate"))) {
      friendly = "이미 구독된 이메일이에요. (한 번이면 충분합니다!)";
    }
    // (2) RLS 정책이 없어서 막힌 경우
    else if (err.message && err.message.includes("row-level security")) {
      friendly =
        "저장이 막혔어요. RLS는 켜졌는데 '쓰기 정책'이 없는 상태입니다. " +
        "schema.sql의 정책(INSERT 허용)을 실행하세요.";
    }

    showStatus("fail", friendly);
  } finally {
    submitBtn.disabled = false; // 성공/실패 무관 항상 버튼 잠금 해제
  }
}

// -------------------------------------------------------------
// 4) 보조 함수 — 상태 안내 박스 표시
// -------------------------------------------------------------
function showStatus(kind, text) {
  const icon = kind === "fail" ? "❌ " : kind === "ok" ? "✅ " : "ℹ️ ";
  // textContent로 글자만 넣습니다(innerHTML 아님). 이유: 사용자가 입력한 이메일이
  // 화면에 다시 표시될 때, innerHTML이면 그 안의 <script> 같은 코드가 실행될 수 있어
  // XSS(악성 스크립트 주입) 위험이 됩니다. textContent는 항상 '순수 글자'로만 처리해 안전합니다.
  statusEl.textContent = icon + text;
  statusEl.classList.remove("info", "ok", "fail");
  statusEl.classList.add(kind);
}

// -------------------------------------------------------------
// 5) 실행 트리거
// -------------------------------------------------------------
if (isPlaceholder()) {
  console.warn(
    "⚠️ 아직 자리표시자 그대로입니다. script.js의 SUPABASE_URL / SUPABASE_ANON_KEY를 내 anon 값으로 바꾸세요."
  );
  showStatus("fail", "아직 내 프로젝트 값이 입력되지 않았어요 (script.js 수정 필요)");
} else {
  // 폼 제출 시: 이메일 INSERT
  formEl.addEventListener("submit", (event) => {
    event.preventDefault(); // form 기본 새로고침 막기

    const email = emailEl.value.trim();
    if (email === "") {
      showStatus("fail", "이메일을 입력해 주세요.");
      return;
    }

    subscribe(email);
  });
}
