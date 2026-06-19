// 외부 JS 파일 — CSP의 script-src 'self' 가 허용하는 출처입니다.
// (HTML 안에 <script>로 직접 쓴 인라인 코드였다면 CSP가 차단했을 것입니다.)

const checkBtn = document.getElementById("checkBtn");
const output = document.getElementById("output");

// 확인하고 싶은 보안 헤더 목록
const SECURITY_HEADERS = [
  "content-security-policy",
  "strict-transport-security",
  "x-content-type-options",
  "x-frame-options",
  "referrer-policy",
  "permissions-policy",
  "cross-origin-opener-policy",
];

checkBtn.addEventListener("click", async () => {
  // textContent로 출력 — innerHTML이 아니라서, 혹시 값에 <script>가 섞여도 실행되지 않아 안전합니다(XSS 방지).
  output.textContent = "확인 중...";
  try {
    // 지금 이 페이지 자신을 다시 한 번 요청해서, 응답 헤더를 읽습니다.
    // 왜 자기 자신을 또 요청하나? — 브라우저는 처음 페이지를 받을 때의 "응답 헤더"를 JS에 직접 보여주지 않습니다.
    //   그래서 fetch로 다시 요청해 그 응답(res)의 headers를 읽어, 서버가 진짜로 보안 헤더를 붙였는지 확인하는 것입니다.
    // cache: "no-store" — 캐시된 옛 응답이 아니라, 지금 서버가 주는 최신 헤더를 보기 위해 캐시를 끕니다.
    const res = await fetch(location.href, { method: "GET", cache: "no-store" });

    const lines = SECURITY_HEADERS.map((name) => {
      const value = res.headers.get(name);
      const mark = value ? "OK " : "없음";
      return `[${mark}] ${name}: ${value ?? "(설정 안 됨)"}`;
    });

    const okCount = SECURITY_HEADERS.filter((n) => res.headers.get(n)).length;
    lines.push("");
    lines.push(`적용된 보안 헤더: ${okCount} / ${SECURITY_HEADERS.length}`);

    output.textContent = lines.join("\n");
  } catch (e) {
    // 에러가 나는 가장 흔한 원인 — 파일을 그냥 더블클릭(file://)으로 열면 fetch가 막힙니다.
    // 그래서 "안내 문구 + 실제 에러 메시지"를 화면에 보여줘, 비전공자가 원인을 알고 https 주소에서 다시 시도하게 합니다.
    output.textContent =
      "헤더를 직접 읽지 못했습니다(로컬 file:// 로 열면 fetch가 막힙니다).\n" +
      "Vercel에 배포한 https 주소에서 눌러보거나, F12 개발자도구 → Network 탭에서 직접 확인하세요.\n\n" +
      "에러: " +
      e.message;
  }
});
