// =============================================================
// 실습 105 — 검증 통과한 문의 폼을 Supabase에 저장하고
//            전송 후 피드백(로딩→성공/실패)을 보여 주기
// =============================================================
//
// 이 파일이 하는 일(흐름):
//   (1) [문의 보내기]를 누르면 먼저 입력값을 '직접' 검증한다. (실습 100·104에서 배운 것)
//   (2) 검증을 통과한 값만 supabase.from('contacts').insert([...]) 로 서버에 저장한다.
//   (3) 저장하는 '동안'에는 버튼을 잠그고 로딩 스피너를 돌린다.
//   (4) 저장이 끝나면 결과에 따라 성공(초록) 또는 실패(빨강) 메시지를 띄운다.
//
// 핵심 개념: async/await — "서버에 보내고 답이 올 때까지 기다린다(await)".
//            기다리는 동안 화면이 멈추지 않도록 함수에 async를 붙인다.

// -------------------------------------------------------------
// 1) 내 프로젝트 값 (Supabase 대시보드: Settings → API 에서 복사)
// -------------------------------------------------------------
//
// ▶ URL : 내 데이터베이스가 사는 인터넷 주소. 비밀이 아닙니다.
// ▶ anon key(공개 키) : 브라우저에 그대로 박아도 되는 '출입증'입니다.
//    - anon 키는 "로그인 안 한 손님" 자격으로만 들어갈 수 있는 열쇠라 공개돼도 됩니다.
//      단, 안전한 진짜 이유는 서버에 RLS(행 수준 보안)를 켜고 정책을 다는 것입니다.
//      (RLS는 실습 119에서 본격적으로 켭니다. 이 폼은 schema.sql에서 '쓰기만 허용'으로 켭니다.)
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
const form = document.getElementById("contact-form");
const nameInput = document.getElementById("name");
const emailInput = document.getElementById("email");
const messageInput = document.getElementById("message");
const submitBtn = document.getElementById("submit-btn");
const submitLabel = document.getElementById("submit-label");
const spinner = document.getElementById("spinner");
const resultEl = document.getElementById("result");

// =============================================================
// 3) 입력 검증: 통과하면 true, 한 군데라도 틀리면 false
//    (틀린 칸에는 빨간 테두리 + 아래 안내 문구를 단다)
// =============================================================
function validateForm() {
  let ok = true;

  // 이름: 비어 있으면 안 됨
  const name = nameInput.value.trim();
  if (name.length === 0) {
    showError(nameInput, "이름을 입력하세요.");
    ok = false;
  } else {
    clearError(nameInput);
  }

  // 이메일: 'something@something.something' 모양인지 간단히 검사
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailPattern.test(emailInput.value.trim())) {
    showError(emailInput, "올바른 이메일 형식을 입력하세요.");
    ok = false;
  } else {
    clearError(emailInput);
  }

  // 문의 내용: 10자 이상
  const message = messageInput.value.trim();
  if (message.length < 10) {
    showError(messageInput, "문의 내용을 10자 이상 적어 주세요.");
    ok = false;
  } else {
    clearError(messageInput);
  }

  return ok;
}

// 에러 메시지 보이기: 입력칸을 빨갛게 + 아래 문구 표시
function showError(inputEl, message) {
  const box = document.querySelector(`[data-error-for="${inputEl.name}"]`);
  if (box) box.textContent = message;
  inputEl.classList.add("invalid");
}

// 에러 메시지 지우기
function clearError(inputEl) {
  const box = document.querySelector(`[data-error-for="${inputEl.name}"]`);
  if (box) box.textContent = "";
  inputEl.classList.remove("invalid");
}

// =============================================================
// 4) 로딩 표시 켜기/끄기 (저장하는 '동안'의 모습)
// =============================================================
function setLoading(isLoading) {
  // 저장 중에는 버튼을 잠가 중복 제출(연타)을 막습니다.
  submitBtn.disabled = isLoading;
  // 스피너를 보였다 숨겼다 합니다.
  spinner.hidden = !isLoading;
  // 버튼 글자도 상태에 맞게 바꿉니다.
  submitLabel.textContent = isLoading ? "보내는 중…" : "문의 보내기";
}

// 결과 박스를 성공(초록)으로
function showOk(text) {
  resultEl.textContent = "✅ " + text;
  resultEl.classList.remove("fail");
  resultEl.classList.add("ok");
  resultEl.hidden = false;
}

// 결과 박스를 실패(빨강)로
function showFail(text) {
  resultEl.textContent = "❌ " + text;
  resultEl.classList.remove("ok");
  resultEl.classList.add("fail");
  resultEl.hidden = false;
}

// =============================================================
// 5) [문의 보내기] 버튼(또는 Enter)으로 폼이 제출될 때 실행
//    async: 안에서 await(서버 응답 기다리기)를 쓰기 위해 붙입니다.
// =============================================================
form.addEventListener("submit", async (event) => {
  // form은 기본적으로 제출 시 페이지를 새로고침합니다.
  // 우리는 JS로 직접 저장할 거라, 그 기본 동작을 막습니다.
  event.preventDefault();

  // 이전 결과 메시지는 일단 숨깁니다.
  resultEl.hidden = true;

  // (1) 먼저 검증 — 통과 못 하면 서버에 보내지 않고 여기서 멈춥니다.
  if (!validateForm()) {
    return;
  }

  // (2) 값을 안 바꾸고 그대로 두면 분명히 실패하므로, 친절하게 먼저 알려줍니다.
  if (SUPABASE_URL.includes("여기에-내") || SUPABASE_ANON_KEY.includes("여기에-내")) {
    console.warn(
      "⚠️ 아직 자리표시자 그대로입니다. script.js의 SUPABASE_URL / SUPABASE_ANON_KEY를 내 값으로 바꾸세요."
    );
    showFail("아직 내 프로젝트 값이 입력되지 않았어요 (script.js 수정 필요)");
    return;
  }

  // 검증을 통과한 값들 (공백 정리)
  const name = nameInput.value.trim();
  const email = emailInput.value.trim();
  const message = messageInput.value.trim();

  // (3) 로딩 시작 — 버튼 잠그고 스피너 켜기
  setLoading(true);
  console.log("⏳ 서버에 문의를 저장하는 중…", { name, email });

  // try/catch: 인터넷이 끊기는 등 '예상 못 한 사고'까지 안전하게 잡아냅니다.
  try {
    // ----- 핵심 한 줄: 서버 표(contacts)에 한 줄 넣기 -----
    // .insert()에는 '객체들의 배열'을 넘깁니다.
    // 컬럼 이름(name, email, message)은 schema.sql의 표 칸 이름과 똑같아야 합니다.
    // id, created_at은 표가 자동으로 채워 주므로 우리가 보내지 않습니다.
    const { data, error } = await db
      .from("contacts")
      .insert([{ name: name, email: email, message: message }])
      .select(); // 방금 저장된 줄(자동 채워진 id 포함)을 돌려받습니다.

    if (error) {
      // 서버가 "이건 못 해요"라고 거절한 경우 (대표 원인은 README 검증법 참고)
      console.error("❌ 저장 실패:", error.message);
      showFail("전송에 실패했어요. 잠시 후 다시 시도해 주세요. (" + error.message + ")");
      return;
    }

    // (4) 성공! 방금 저장된 줄이 data 배열에 담겨 돌아옵니다.
    console.log("✅ 저장 성공! 서버가 돌려준 데이터:", data);
    showOk("문의가 정상적으로 접수되었습니다. (접수 번호: " + data[0].id + ")");

    // 다음 문의를 바로 쓸 수 있게 입력칸 비우기
    form.reset();
  } catch (err) {
    // 인터넷 끊김, 잘못된 URL 등으로 요청 자체가 실패한 경우
    console.error("❌ 네트워크 오류:", err);
    showFail("네트워크 오류가 발생했어요. 인터넷 연결을 확인해 주세요.");
  } finally {
    // 성공이든 실패든 '항상' 마지막에 실행 — 로딩 표시를 반드시 끕니다.
    setLoading(false);
  }
});
