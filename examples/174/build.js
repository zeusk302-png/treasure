// ============================================================
//  build.js  —  "배포 시 환경변수를 코드로 주입" 하는 작은 빌드 스크립트
//
//  Vercel은 배포(빌드)할 때 이 파일을 실행합니다(vercel.json 의 buildCommand).
//  여기서 process.env 에 들어온 Vercel 환경변수 값을 읽어
//  브라우저가 읽을 수 있는 env-config.js 파일로 "구워(write)" 냅니다.
//
//  ※ 핵심 원칙:
//    - 브라우저로 내려보내는 값은 "공개해도 되는 것"만! → SUPABASE_URL, SUPABASE_ANON_KEY
//    - service_role(비밀) 키는 이 파일에서 절대 읽어 쓰지 않습니다.
//      (비밀 키는 서버 측 함수에서만 process.env.SUPABASE_SERVICE_ROLE_KEY 로 사용)
// ============================================================

const fs = require("fs");
const path = require("path");

// 1) Vercel 대시보드(Settings → Environment Variables)에 등록한 값을 읽습니다.
//    로컬에서 테스트할 때는 .env 또는 셸 환경변수로 넣을 수 있습니다.
const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_ANON_KEY = process.env.SUPABASE_ANON_KEY || "";

// 2) 안전장치: 실수로 비밀 키 이름을 브라우저용에 섞지 않았는지 점검
if (process.env.SUPABASE_SERVICE_ROLE_KEY && SUPABASE_ANON_KEY.includes(process.env.SUPABASE_SERVICE_ROLE_KEY)) {
  console.error("🚨 ANON 키 자리에 service_role(비밀) 키가 들어 있습니다. 빌드를 멈춥니다.");
  process.exit(1);
}

// 3) 비어 있으면 경고만 하고, 자리표시자로 채워 배포는 계속(페이지에서 안내 표시)
if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.warn(
    "⚠️ SUPABASE_URL / SUPABASE_ANON_KEY 환경변수가 비어 있습니다.\n" +
    "   Vercel → Settings → Environment Variables 에 값을 등록한 뒤 Redeploy 하세요."
  );
}

// 4) 브라우저가 읽을 설정 파일을 만들어 냅니다 (공개해도 되는 값만!)
const contents =
  "// 이 파일은 build.js 가 배포 시 자동으로 만들어 냅니다. 직접 수정하지 마세요.\n" +
  "// (.gitignore 로 GitHub 업로드는 차단됩니다.)\n" +
  "window.__ENV__ = {\n" +
  "  SUPABASE_URL: " + JSON.stringify(SUPABASE_URL || "https://여기에_프로젝트_주소.supabase.co") + ",\n" +
  "  SUPABASE_ANON_KEY: " + JSON.stringify(SUPABASE_ANON_KEY || "여기에_anon_공개키_붙여넣기") + "\n" +
  "};\n";

const outPath = path.join(__dirname, "env-config.js");
fs.writeFileSync(outPath, contents, "utf8");

console.log("✅ env-config.js 생성 완료 (공개 키만 주입).");
console.log("   SUPABASE_URL set? ", Boolean(SUPABASE_URL));
console.log("   SUPABASE_ANON_KEY set? ", Boolean(SUPABASE_ANON_KEY));
