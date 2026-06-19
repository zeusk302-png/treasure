// ============================================================
//  script.js — Production / Preview 환경변수 연습 화면
//
//  핵심: 같은 이름의 변수(SUPABASE_URL, SUPABASE_ANON_KEY)라도
//        "어떤 환경(Production/Preview)에 등록했느냐"에 따라
//        배포 시 적용되는 값이 달라진다.
//
//  이 파일에는 진짜 키가 한 글자도 없습니다. (안전!)
//  입력값은 이 브라우저 화면 안에서만 쓰이고 서버로 보내지 않습니다.
// ============================================================

// --- 입력칸 (Vercel 환경변수 표) ---
const prodUrl  = document.getElementById("prodUrl");
const prodAnon = document.getElementById("prodAnon");
const prevUrl  = document.getElementById("prevUrl");
const prevAnon = document.getElementById("prevAnon");

// --- 적용 결과 표시 영역 ---
const envName     = document.getElementById("envName");
const appliedUrl  = document.getElementById("appliedUrl");
const appliedAnon = document.getElementById("appliedAnon");
const statusBox   = document.getElementById("status");

// --- 버튼들 ---
const fillSample = document.getElementById("fillSample");
const clearAll   = document.getElementById("clearAll");
const segBtns    = document.querySelectorAll(".seg-btn");

// 현재 고른 배포 환경 (production | preview)
let currentEnv = "production";

// anon(공개) 키처럼 보이게 한 "자리표시자" 예시값입니다.
// 진짜 키가 아니며, 형식만 흉내 낸 가짜 문자열입니다.
const SAMPLE = {
  prodUrl:  "https://실서비스-projid.supabase.co",
  prodAnon: "eyJhbGciOi_PROD_anon_공개키_여기에_실제값_붙여넣기",
  prevUrl:  "https://연습용-projid.supabase.co",
  prevAnon: "eyJhbGciOi_PREVIEW_anon_공개키_여기에_실제값_붙여넣기",
};

// ------------------------------------------------------------
// 비밀키(service_role)가 섞였는지 검사한다.
// anon(공개) 키만 넣는 게 규칙이므로, service_role 글자가 보이면 경고.
// ------------------------------------------------------------
function looksLikeSecret(value) {
  return /service_role/i.test(value || "");
}

// 값이 비었거나 자리표시자(예시) 상태인지 검사
function isPlaceholder(value) {
  if (!value) return true;
  return value.includes("여기에") || value.includes("projid");
}

// ------------------------------------------------------------
// 현재 고른 환경에 맞는 값을 골라서 화면에 보여준다.
// 이게 이 실습의 핵심: Vercel이 환경에 따라 값을 "골라 쓰는" 동작을 흉내.
// ------------------------------------------------------------
function render() {
  const isProd = currentEnv === "production";

  // 1) 환경 배지 갱신
  envName.textContent = isProd ? "Production" : "Preview";
  envName.className = "badge " + (isProd ? "prod" : "preview");

  // 2) 그 환경에 등록된 값 골라 오기
  const url  = isProd ? prodUrl.value.trim()  : prevUrl.value.trim();
  const anon = isProd ? prodAnon.value.trim() : prevAnon.value.trim();

  // 3) 적용 결과 표시 (키는 앞 일부만 보여줘서 길이로 화면이 깨지지 않게)
  //    출력은 innerHTML이 아니라 textContent를 씁니다.
  //    왜? 사용자가 입력칸에 <script> 같은 태그를 넣어도 그대로 글자로만 보이고
  //    실행되지 않게 막기 위함입니다(innerHTML이면 XSS 공격에 취약).
  appliedUrl.textContent  = url  || "— (이 환경에 등록된 값이 없습니다)";
  appliedAnon.textContent = anon ? maskKey(anon) : "— (이 환경에 등록된 값이 없습니다)";

  // 4) 안전/상태 메시지
  const allValues = [prodUrl.value, prodAnon.value, prevUrl.value, prevAnon.value];
  const secretLeak = allValues.some(looksLikeSecret);

  if (secretLeak) {
    statusBox.textContent =
      "🚨 위험! 입력값 어딘가에 service_role(비밀) 키가 들어갔습니다.\n" +
      "→ 비밀 키는 브라우저로 내려가는 변수(여기)에 절대 넣지 않습니다.\n" +
      "→ 공개해도 되는 anon 키만 두고, 비밀 키는 서버 측 함수에서만 씁니다.";
    return;
  }

  if (!url || !anon) {
    statusBox.textContent =
      "ℹ️ 지금 고른 '" + (isProd ? "Production" : "Preview") + "' 환경에 아직 값이 비어 있습니다.\n" +
      "→ 위 표에서 해당 환경 줄(같은 색 배지)을 채우면 이 칸에 그 값이 적용됩니다.";
    return;
  }

  if (isPlaceholder(url) || isPlaceholder(anon)) {
    statusBox.textContent =
      "✅ 안전: 자리표시자(예시) 상태입니다. 진짜 키가 코드에 박혀 있지 않습니다.\n" +
      "→ 실제로는 이 칸의 자리표시자를 Supabase의 anon(공개) 키로 바꾸고\n" +
      "   Vercel Settings → Environment Variables 에 같은 이름으로 환경별로 등록합니다.";
    return;
  }

  statusBox.textContent =
    "✅ 좋아요! '" + (isProd ? "Production(실서비스)" : "Preview(미리보기)") + "' 환경의 값이 적용되고 있습니다.\n" +
    "→ 환경 버튼을 바꿔 보세요. 같은 변수 이름인데 값이 달라지는 게 핵심입니다.\n" +
    "→ Production은 진짜 데이터, Preview는 연습 데이터를 가리키도록 분리합니다.";
}

// 키 앞 8자만 보여주고 나머지는 가린다(어차피 anon 공개키라도 화면을 짧게).
function maskKey(key) {
  if (key.length <= 12) return key;
  return key.slice(0, 8) + "…(" + key.length + "자)";
}

// ------------------------------------------------------------
// 이벤트 연결
// ------------------------------------------------------------

// 환경 전환 버튼 (Production / Preview)
segBtns.forEach(function (btn) {
  btn.addEventListener("click", function () {
    segBtns.forEach(function (b) { b.classList.remove("active"); });
    btn.classList.add("active");
    currentEnv = btn.dataset.env;
    render();
  });
});

// 입력이 바뀔 때마다 적용 결과 다시 그리기
// 왜 "input" 이벤트인가? 저장 버튼 없이도 타이핑하는 즉시 결과/경고가 갱신되게 해서,
// "값을 바꾸면 어떤 환경에 어떻게 반영되는지"를 실시간으로 체감하게 하려는 것입니다.
[prodUrl, prodAnon, prevUrl, prevAnon].forEach(function (inp) {
  inp.addEventListener("input", render);
});

// 예시 값 채우기
fillSample.addEventListener("click", function () {
  prodUrl.value  = SAMPLE.prodUrl;
  prodAnon.value = SAMPLE.prodAnon;
  prevUrl.value  = SAMPLE.prevUrl;
  prevAnon.value = SAMPLE.prevAnon;
  render();
});

// 전부 비우기
clearAll.addEventListener("click", function () {
  [prodUrl, prodAnon, prevUrl, prevAnon].forEach(function (inp) { inp.value = ""; });
  render();
});

// 첫 화면 그리기
render();
