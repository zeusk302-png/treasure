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
  output.textContent = "확인 중...";
  try {
    // 지금 이 페이지 자신을 다시 한 번 요청해서, 응답 헤더를 읽습니다.
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
    output.textContent =
      "헤더를 직접 읽지 못했습니다(로컬 file:// 로 열면 fetch가 막힙니다).\n" +
      "Vercel에 배포한 https 주소에서 눌러보거나, F12 개발자도구 → Network 탭에서 직접 확인하세요.\n\n" +
      "에러: " +
      e.message;
  }
});
