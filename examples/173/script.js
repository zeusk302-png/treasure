// ============================================================
//  script.js  —  설정값을 "코드에 박지 않고" 불러오는 방법
//
//  이 파일에는 키가 하나도 없습니다. (안전!)
//  설정값은 config.js 의 window.APP_CONFIG 에서 가져옵니다.
//  config.js 는 .gitignore 로 업로드가 차단되므로
//  진짜 공개키가 GitHub에 노출되지 않습니다.
// ============================================================

const statusBox = document.getElementById("status");

// 1) config.js 가 로드됐는지 확인
const cfg = window.APP_CONFIG;

if (!cfg) {
  // 참고(왜 여기만 innerHTML?): 이 메시지는 개발자가 직접 적은 고정 문자열이라
  // 사용자 입력이 섞이지 않아 안전합니다. 사용자가 넣은 값을 출력할 때는 아래처럼
  // 반드시 textContent 를 써야 합니다(innerHTML 은 <script> 가 실행될 수 있어 XSS 위험).
  statusBox.innerHTML =
    "❌ config.js 를 찾지 못했습니다.\n" +
    "→ config.example.js 를 복사해 config.js 를 만들고 공개키를 넣으세요.\n" +
    "   (cp config.example.js config.js)";
} else {
  // 2) 자리표시자 그대로인지(=아직 진짜 값을 안 넣었는지) 점검
  const stillPlaceholder =
    cfg.SUPABASE_URL.includes("여기에") ||
    cfg.SUPABASE_ANON_KEY.includes("여기에");

  // 3) 안전 점검: 코드 어디에도 service_role 키가 없어야 함
  //    왜: service_role 은 RLS(행 보안)를 전부 무시하는 마스터 키라, 브라우저로 새면
  //    DB 전체가 털립니다. 설정 전체를 문자열로 펼쳐(JSON.stringify) 그 글자가 있는지
  //    검사해, 실수로 비밀 키를 넣었을 때 즉시 화면에 경고를 띄우려는 안전장치입니다.
  const hasSecretLeak = JSON.stringify(cfg)
    .toLowerCase()
    .includes("service_role");

  let msg = "";
  if (hasSecretLeak) {
    msg =
      "🚨 위험! config 안에 service_role(비밀) 키가 들어 있습니다.\n" +
      "→ 브라우저에서는 anon(공개) 키만 사용하세요. 비밀 키는 즉시 제거하고 회전(rotation)하세요.";
  } else if (stillPlaceholder) {
    msg =
      "✅ 안전: 키가 코드에 직접 박혀 있지 않습니다 (자리표시자 상태).\n" +
      "→ config.js 의 자리표시자를 진짜 anon 공개키로 바꾸면 Supabase에 연결됩니다.\n" +
      "   URL: " + cfg.SUPABASE_URL;
  } else {
    msg =
      "✅ 안전: anon(공개) 키만 사용 중입니다.\n" +
      "   URL: " + cfg.SUPABASE_URL + "\n" +
      "   ANON KEY(앞 8자만 표시): " + cfg.SUPABASE_ANON_KEY.slice(0, 8) + "…";
    // 참고: 실제 Supabase 연결 예시 (라이브러리 로드 시)
    // const client = supabase.createClient(cfg.SUPABASE_URL, cfg.SUPABASE_ANON_KEY);
  }
  statusBox.textContent = msg;
}
