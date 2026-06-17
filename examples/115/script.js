// =============================================================
// 실습 115 — Supabase 클라이언트 연결하고 연결 성공을 콘솔로 확인하기
// =============================================================
//
// 이 파일이 하는 일은 딱 두 가지입니다.
//   (1) 내 프로젝트 정보(URL + anon 키)로 Supabase에 '연결'을 만든다.
//   (2) 진짜로 연결됐는지 가벼운 요청을 한 번 보내 보고, 결과를 콘솔과 화면에 알려준다.

// -------------------------------------------------------------
// 1) 내 프로젝트 값 (Supabase 대시보드: Settings → API 에서 복사)
// -------------------------------------------------------------
//
// ▶ URL : 내 데이터베이스가 사는 인터넷 주소. 비밀이 아닙니다.
// ▶ anon key(공개 키) : 브라우저에 그대로 박아도 되는 '출입증'입니다.
//    - anon 키는 "로그인 안 한 손님" 자격으로만 들어갈 수 있는 열쇠라,
//      공개돼도 됩니다. 단, 이게 안전한 진짜 이유는 서버에 RLS(행 수준 보안)를
//      켜 두기 때문입니다. (RLS는 실습 119에서 켭니다.)
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
// createClient는 "이 주소로, 이 출입증을 들고 다닐게" 라고 약속만 하는 단계라
// 이 줄 자체는 아직 서버에 접속하지 않습니다. (실제 통신은 .from()을 쓸 때)
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const statusEl = document.getElementById("status");

// -------------------------------------------------------------
// 3) 정말 연결되는지 가볍게 확인하기
// -------------------------------------------------------------
async function checkConnection() {
  // 값을 안 바꾸고 그대로 두면 분명히 실패하므로, 친절하게 먼저 알려줍니다.
  if (SUPABASE_URL.includes("여기에-내") || SUPABASE_ANON_KEY.includes("여기에-내")) {
    console.warn(
      "⚠️ 아직 자리표시자 그대로입니다. script.js의 SUPABASE_URL / SUPABASE_ANON_KEY를 내 값으로 바꾸세요."
    );
    showFail("아직 내 프로젝트 값이 입력되지 않았어요 (script.js 수정 필요)");
    return;
  }

  console.log("⏳ Supabase에 연결을 시도합니다… URL:", SUPABASE_URL);

  // 실습 114에서 만든 memos 테이블에 '가장 가벼운 질문'을 던져 봅니다.
  // head: true  → 실제 데이터는 안 받고 '응답 가능한지'만 확인 (빠르고 가벼움)
  // count       → 줄이 몇 개인지 개수만 받기
  const { error, count } = await db
    .from("memos")
    .select("*", { count: "exact", head: true });

  if (error) {
    // 서버에서 에러가 돌아온 경우 (대표적인 원인은 아래 README 검증법 참고)
    console.error("❌ 연결 확인 실패:", error.message);
    showFail("연결 실패: " + error.message);
    return;
  }

  // 여기까지 왔다는 건 = 주소가 맞고, 출입증이 통했고, 서버가 정상 응답했다는 뜻!
  console.log("✅ Supabase 연결 성공! memos 테이블이 응답했습니다.");
  console.log("   현재 memos 테이블의 행(줄) 개수:", count);
  console.log("   (참고) 만들어진 클라이언트 객체:", db);

  showOk("연결 성공! (memos 행 개수: " + count + ")");
}

// 화면 박스 색·글자를 성공 상태로 바꾸기
function showOk(message) {
  statusEl.textContent = "✅ " + message;
  statusEl.classList.remove("fail");
  statusEl.classList.add("ok");
}

// 화면 박스 색·글자를 실패 상태로 바꾸기
function showFail(message) {
  statusEl.textContent = "❌ " + message;
  statusEl.classList.remove("ok");
  statusEl.classList.add("fail");
}

// 페이지가 열리면 바로 확인을 실행합니다.
checkConnection();
