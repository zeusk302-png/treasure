// ============================================================
//  script.js  —  Vercel 환경변수로 주입된 설정을 "읽기만" 합니다.
//
//  이 파일에는 키가 한 글자도 없습니다. (안전!)
//  설정값은 env-config.js 의 window.__ENV__ 에서 가져옵니다.
//  env-config.js 는 배포 시 build.js 가 환경변수를 읽어 만들어 내고,
//  .gitignore 로 GitHub 업로드가 차단됩니다.
// ============================================================

const statusBox = document.getElementById("status");
const resultBox = document.getElementById("result");
const testBtn = document.getElementById("testBtn");

// 1) env-config.js 가 로드돼 window.__ENV__ 가 있는지 확인
const env = window.__ENV__;

if (!env) {
  statusBox.innerHTML =
    "❌ env-config.js 를 찾지 못했습니다.\n" +
    "→ 로컬에서 보려면: env-config.example.js 를 복사해 env-config.js 를 만드세요.\n" +
    "   (cp env-config.example.js env-config.js)\n" +
    "→ 배포(Vercel)에서는 build.js 가 환경변수를 읽어 자동으로 만들어 줍니다.";
} else {
  const url = env.SUPABASE_URL || "";
  const anon = env.SUPABASE_ANON_KEY || "";

  // 2) 자리표시자 그대로인지(=아직 진짜 값 미주입) 점검
  const stillPlaceholder = url.includes("여기에") || anon.includes("여기에") || !url || !anon;

  // 3) 안전 점검: 브라우저로 내려온 설정에 service_role 비밀 키가 섞이지 않았는지
  const hasSecretLeak = JSON.stringify(env).toLowerCase().includes("service_role");

  if (hasSecretLeak) {
    statusBox.textContent =
      "🚨 위험! 브라우저 환경변수(env-config.js)에 service_role(비밀) 키가 들어 있습니다.\n" +
      "→ Vercel 환경변수에서 그 값을 즉시 빼고, 키를 폐기 후 재발급(rotation)하세요.\n" +
      "→ 브라우저로 내려보내는 변수에는 anon(공개) 키만 둡니다.";
    testBtn.disabled = true;
  } else if (stillPlaceholder) {
    statusBox.textContent =
      "✅ 안전: 키가 코드에 직접 박혀 있지 않습니다 (아직 자리표시자/미주입 상태).\n" +
      "→ 로컬: env-config.js 의 자리표시자를 진짜 anon 공개키로 바꾸세요.\n" +
      "→ 배포: Vercel Settings → Environment Variables 에 값을 등록 후 재배포(Redeploy)하세요.\n" +
      "   현재 URL: " + (url || "(비어 있음)");
    testBtn.disabled = true;
  } else {
    statusBox.textContent =
      "✅ 안전: anon(공개) 키만 주입되어 있습니다.\n" +
      "   URL: " + url + "\n" +
      "   ANON KEY(앞 8자만 표시): " + anon.slice(0, 8) + "…";
  }
}

// 4) 실제 Supabase 연결 테스트 (anon 키로 가볍게 핑)
testBtn.addEventListener("click", async function () {
  resultBox.textContent = "연결 시도 중…";
  try {
    const client = supabase.createClient(env.SUPABASE_URL, env.SUPABASE_ANON_KEY);
    // 존재하지 않을 수도 있는 테이블을 조회해 본다. 핵심은 "키로 인증이 통하는가".
    const { error } = await client.from("guestbook").select("*").limit(1);
    if (error && /Invalid API key|JWT|apikey/i.test(error.message)) {
      resultBox.textContent =
        "❌ 키 문제로 보입니다: " + error.message + "\n" +
        "→ Vercel 환경변수의 anon 키 값을 다시 확인하세요.";
    } else if (error) {
      // 테이블이 없거나 RLS로 막힌 경우 — 그래도 '키 인증'은 통과한 것
      resultBox.textContent =
        "✅ 키 인증은 성공했습니다! (응답: " + error.message + ")\n" +
        "→ guestbook 테이블이 없거나 RLS로 막혀 있어도 정상입니다. 환경변수 주입은 잘 된 거예요.";
    } else {
      resultBox.textContent = "✅ 연결 성공! anon 키로 Supabase에서 데이터를 읽었습니다.";
    }
  } catch (e) {
    resultBox.textContent = "❌ 연결 중 오류: " + e.message;
  }
});
