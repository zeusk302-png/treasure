/*
  이 파일은 무엇인가:
  문의 폼 제출을 받아 "확인 메일"을 자동으로 보내 주는 작은 백엔드 서버(server.js)입니다.
  왜 있는가:
  - 이메일 API의 비밀 키(RESEND_API_KEY)는 브라우저에 절대 노출되면 안 됩니다.
    그래서 메일 발송은 반드시 "서버"에서 해야 하고, 이 파일이 그 서버 역할을 합니다.
  - 브라우저(index.html)는 이 서버의 /api/contact 만 호출하고, 진짜 메일 발송과 비밀 키 사용은
    전부 여기(서버)에서 일어납니다. (= 키는 손님 눈에 안 띄는 사무실 금고에만 둔다)
  실행법:
    1) npm install express resend
    2) .env.example 을 복사해 .env 를 만들고 RESEND_API_KEY, MAIL_FROM 을 채운다
    3) node server.js  → http://localhost:3000
*/

// .env 파일의 값을 process.env 로 불러옵니다.
// 왜: 비밀 키를 코드에 박지 않고 .env(깃에 안 올라가는 파일)에서만 읽기 위해서입니다.
// (Node 20.6+ 는 --env-file 플래그도 되지만, 호환을 위해 dotenv 없이도 동작하도록 아래에서 안전하게 처리합니다.)
try {
  // dotenv 가 설치돼 있으면 .env 를 읽습니다. 없어도 서버는 뜨도록 try 로 감쌉니다.
  require("dotenv").config();
} catch (_) {
  // dotenv 미설치 시: 운영 환경(예: 배포 서비스)에서는 보통 환경변수가 이미 주입되므로 그냥 진행합니다.
}

const express = require("express");
const { Resend } = require("resend"); // 이메일 발송 API 공식 SDK

const app = express();

// 들어오는 요청 본문(JSON)을 자동으로 파싱합니다.
// 왜: 프런트가 fetch 로 보내는 {name, email, message} 를 req.body 로 읽기 위해서입니다.
app.use(express.json());

// 이 폴더의 정적 파일(index.html 등)을 그대로 제공합니다.
// 왜: 같은 서버가 화면(index.html)도 주고 API(/api/contact)도 처리하면,
//     브라우저가 "같은 출처(same-origin)"로 호출해 CORS 설정 없이 간단히 동작하기 때문입니다.
app.use(express.static(__dirname));

// === 비밀값은 환경변수에서만 읽습니다 (코드에 절대 박지 않음) ===
// RESEND_API_KEY: 're_' 로 시작하는 비밀 키. 노출되면 남이 내 계정으로 메일을 보낼 수 있어 비밀입니다.
const RESEND_API_KEY = process.env.RESEND_API_KEY;
// MAIL_FROM: 발신 주소. 처음엔 onboarding@resend.dev, 도메인 인증 후엔 hello@내도메인 으로 바꿉니다.
const MAIL_FROM = process.env.MAIL_FROM || "onboarding@resend.dev";
// (선택) OWNER_EMAIL: 운영자(나)에게도 "새 문의 도착" 사본을 보내고 싶을 때 받는 주소. 없으면 사본은 건너뜁니다.
const OWNER_EMAIL = process.env.OWNER_EMAIL || "";

// 서버 시작 시, 키가 로드됐는지만 확인합니다.
// 왜: 키가 비어 있으면 메일이 안 가는데 원인을 찾기 어렵기 때문입니다.
//     단, 키 "값" 자체는 절대 출력하지 않습니다(로그에 비밀이 새면 안 되니까). 있다/없다만 찍습니다.
if (!RESEND_API_KEY) {
  console.warn("[경고] RESEND_API_KEY 가 비어 있습니다. .env 를 확인하세요. (메일 발송이 실패합니다)");
}

// Resend 클라이언트. 비밀 키를 넣어 초기화합니다(이 객체로 메일을 보냅니다).
const resend = new Resend(RESEND_API_KEY);

// 사용자가 넣은 텍스트를 HTML 메일 본문에 안전하게 넣기 위한 이스케이프 함수.
// 왜: 이름/메시지에 <, >, & 같은 글자가 들어오면 메일/화면에서 의도치 않은 태그로 해석될 수 있습니다.
//     특수문자를 안전한 표현으로 바꿔 주입(XSS류) 위험을 막습니다.
function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

// 아주 단순한 이메일 형식 검사. (완벽하진 않지만 "비었거나 명백히 틀린 값"을 거릅니다)
// 왜: 형식이 틀린 주소로는 메일이 안 가므로, 미리 걸러 사용자에게 바로 안내하기 위해서입니다.
function isValidEmail(email) {
  return typeof email === "string" && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// === 폼 제출을 받아 확인 메일을 보내는 핵심 라우트 ===
app.post("/api/contact", async (req, res) => {
  // 프런트가 보낸 값을 꺼냅니다.
  const { name, email, message } = req.body || {};

  // 1) 입력 검증: 잘못된 값이면 메일을 보내지 않고 400(잘못된 요청)으로 안내합니다.
  // 왜: 빈 값/틀린 이메일로 발송을 시도하면 실패하거나 엉뚱한 곳으로 가기 때문입니다.
  if (!name || !name.trim()) {
    return res.status(400).json({ ok: false, error: "이름을 입력해 주세요." });
  }
  if (!isValidEmail(email)) {
    return res.status(400).json({ ok: false, error: "올바른 이메일 주소를 입력해 주세요." });
  }
  if (!message || !message.trim()) {
    return res.status(400).json({ ok: false, error: "메시지를 입력해 주세요." });
  }

  // 키가 없으면 메일을 보낼 수 없으니 명확히 알립니다(500: 서버 설정 문제).
  if (!RESEND_API_KEY) {
    return res
      .status(500)
      .json({ ok: false, error: "서버에 이메일 키가 설정되지 않았습니다. 관리자(.env)를 확인하세요." });
  }

  // 메일 본문에 넣을 사용자 입력을 이스케이프합니다(위 함수 사용 이유 참고).
  const safeName = escapeHtml(name.trim());
  const safeMessage = escapeHtml(message.trim()).replaceAll("\n", "<br>"); // 줄바꿈은 <br>로

  try {
    // 2) 신청자에게 "확인 메일" 발송 (트랜잭션 메일)
    // 왜: 사람이 손으로 보내는 게 아니라, "폼 제출"이라는 동작 한 건마다 자동으로 한 통 나갑니다.
    const sendResult = await resend.emails.send({
      from: MAIL_FROM, // 발신 주소(환경변수). 도메인 인증 전엔 onboarding@resend.dev 권장.
      to: [email], // 받는사람 = 신청자. (테스트 발신주소는 보통 '내 계정 메일'로만 보내짐에 주의)
      subject: "[접수 완료] 문의가 잘 도착했어요",
      html: `
        <div style="font-family:system-ui,sans-serif;line-height:1.6">
          <h2>안녕하세요, ${safeName}님</h2>
          <p>아래 내용으로 문의가 접수되었습니다. 빠르게 확인 후 답변드릴게요.</p>
          <blockquote style="border-left:4px solid #4f46e5;padding-left:12px;color:#374151">
            ${safeMessage}
          </blockquote>
          <p style="color:#6b7280;font-size:13px">이 메일은 자동 발송된 확인 메일입니다.</p>
        </div>
      `,
    });

    // Resend SDK 는 실패 시 결과의 error 필드에 사유를 담아 줍니다.
    // 왜: 예외가 안 나도 "도메인 미인증" 같은 이유로 발송이 거절될 수 있어, 이 경우도 잡아야 합니다.
    if (sendResult.error) {
      console.error("[메일 발송 실패]", sendResult.error);
      return res
        .status(502)
        .json({ ok: false, error: "메일 발송에 실패했습니다. 발신 도메인/주소를 확인하세요." });
    }

    // 3) (선택) 운영자(나)에게도 "새 문의 도착" 사본 발송. OWNER_EMAIL 이 설정된 경우에만.
    // 왜: 신청자 확인 메일과 별개로, 운영자가 새 문의를 놓치지 않게 하기 위해서입니다.
    if (OWNER_EMAIL) {
      await resend.emails.send({
        from: MAIL_FROM,
        to: [OWNER_EMAIL],
        subject: `새 문의: ${safeName}`,
        // 답장 시 신청자에게 바로 회신되도록 reply_to 에 신청자 주소를 넣습니다.
        reply_to: email,
        html: `<p><b>${safeName}</b> (${escapeHtml(email)}) 님의 문의</p><blockquote>${safeMessage}</blockquote>`,
      });
    }

    // 성공 응답. 프런트는 이 ok:true 를 보고 "보냈습니다" 안내를 띄웁니다.
    return res.json({ ok: true });
  } catch (err) {
    // 네트워크 오류 등 예외 상황. 사용자에겐 일반 안내, 서버 로그엔 상세를 남깁니다.
    // 왜: 사용자에게 시스템 내부 에러 원문을 그대로 보여 주면 정보 노출/혼란이 되기 때문입니다.
    console.error("[서버 오류]", err);
    return res.status(500).json({ ok: false, error: "잠시 후 다시 시도해 주세요." });
  }
});

// 서버 시작. PORT 환경변수가 있으면 그걸, 없으면 3000번을 씁니다(배포 서비스 호환).
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버 실행 중: http://localhost:${PORT}`);
});
