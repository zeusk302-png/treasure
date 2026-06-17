// =============================================================
// 실습 116 — 방명록 글 1건을 Supabase에 insert(저장) 하기
// =============================================================
//
// 이 파일이 하는 일:
//   (1) 내 프로젝트 정보(URL + anon 키)로 Supabase에 '연결'을 만든다. (실습 115에서 배운 것)
//   (2) 폼에 적은 이름·메시지를 읽어서
//       supabase.from('guestbook').insert([...]) 로 서버 표에 '한 줄' 저장한다.

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
const form = document.getElementById("guestbook-form");
const nameInput = document.getElementById("name");
const messageInput = document.getElementById("message");
const submitBtn = document.getElementById("submit-btn");
const resultEl = document.getElementById("result");

// -------------------------------------------------------------
// 3) [남기기] 버튼(또는 Enter)으로 폼이 제출될 때 실행
// -------------------------------------------------------------
form.addEventListener("submit", async (event) => {
  // form은 기본적으로 제출 시 페이지를 새로고침합니다.
  // 우리는 JS로 직접 저장할 거라, 그 기본 동작을 막습니다.
  event.preventDefault();

  // 값을 안 바꾸고 그대로 두면 분명히 실패하므로, 친절하게 먼저 알려줍니다.
  if (SUPABASE_URL.includes("여기에-내") || SUPABASE_ANON_KEY.includes("여기에-내")) {
    console.warn(
      "⚠️ 아직 자리표시자 그대로입니다. script.js의 SUPABASE_URL / SUPABASE_ANON_KEY를 내 값으로 바꾸세요."
    );
    showFail("아직 내 프로젝트 값이 입력되지 않았어요 (script.js 수정 필요)");
    return;
  }

  // 입력값 읽고, 앞뒤 공백 정리
  const name = nameInput.value.trim();
  const message = messageInput.value.trim();

  // 아주 기본적인 검사 (빈 칸 막기)
  if (!name || !message) {
    showFail("이름과 메시지를 모두 채워 주세요.");
    return;
  }

  // 저장하는 동안 버튼을 잠가 두어 중복 제출을 막습니다.
  submitBtn.disabled = true;
  submitBtn.textContent = "저장 중…";
  console.log("⏳ 서버에 저장을 시도합니다…", { name, message });

  // ----- 핵심 한 줄: 서버 표(guestbook)에 한 줄 넣기 -----
  // .insert()에는 '객체들의 배열'을 넘깁니다. (한 번에 여러 줄도 가능)
  // 컬럼 이름(name, message)은 schema.sql에서 만든 표의 칸 이름과 똑같아야 합니다.
  // id, created_at은 표가 자동으로 채워 주므로 우리가 보내지 않습니다.
  const { data, error } = await db
    .from("guestbook")
    .insert([{ name: name, message: message }])
    .select(); // .select()를 붙이면 방금 저장된 줄(자동 채워진 id 포함)을 돌려받습니다.

  // 버튼 원상복구
  submitBtn.disabled = false;
  submitBtn.textContent = "남기기";

  if (error) {
    // 서버에서 에러가 돌아온 경우 (대표 원인은 README 검증법 참고)
    console.error("❌ 저장 실패:", error.message);
    showFail("저장 실패: " + error.message);
    return;
  }

  // 성공! 방금 저장된 줄이 data 배열에 담겨 돌아옵니다.
  console.log("✅ 저장 성공! 서버가 돌려준 데이터:", data);
  showOk("저장됐어요! (글 번호 id: " + data[0].id + ")");

  // 다음 글을 바로 쓸 수 있게 입력칸 비우기
  form.reset();
});

// 결과 박스를 성공(초록)으로
function showOk(text) {
  resultEl.textContent = "✅ " + text;
  resultEl.classList.remove("fail");
  resultEl.classList.add("ok");
}

// 결과 박스를 실패(빨강)로
function showFail(text) {
  resultEl.textContent = "❌ " + text;
  resultEl.classList.remove("ok");
  resultEl.classList.add("fail");
}
