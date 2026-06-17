// ============================================================
//  여기에 n8n에서 복사한 "Production URL"을 붙여 넣으세요.
//  예: https://내계정.app.n8n.cloud/webhook/contact-form
//  (이 주소는 비밀이 아닙니다. 누가 폼을 제출하든 들어오는 '받는 창구'일 뿐입니다.)
// ============================================================
const WEBHOOK_URL = "REPLACE_WITH_YOUR_N8N_WEBHOOK_URL";

const form = document.getElementById("contactForm");
const statusEl = document.getElementById("status");
const submitBtn = document.getElementById("submitBtn");

form.addEventListener("submit", async (event) => {
  // 폼의 기본 동작(페이지 새로고침/이동)을 막습니다.
  event.preventDefault();

  // 브라우저 기본 검증(required, type=email 등)을 통과했는지 확인합니다.
  if (!form.checkValidity()) {
    form.reportValidity();
    return;
  }

  // 입력값 읽기
  const data = {
    name: document.getElementById("name").value.trim(),
    email: document.getElementById("email").value.trim(),
    message: document.getElementById("message").value.trim(),
  };

  // 보내는 동안 버튼을 잠그고 안내 문구를 띄웁니다.
  submitBtn.disabled = true;
  setStatus("보내는 중...", "");

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      throw new Error("서버 응답 오류: " + response.status);
    }

    // 성공: 폼을 비우고 성공 메시지 표시
    form.reset();
    setStatus("문의가 정상적으로 접수되었습니다. 감사합니다!", "success");
  } catch (error) {
    // 실패: 에러 메시지 표시 (주소가 틀렸거나 n8n이 꺼져 있을 때 등)
    setStatus(
      "전송에 실패했습니다. 잠시 후 다시 시도해 주세요.",
      "error"
    );
    console.error(error);
  } finally {
    submitBtn.disabled = false;
  }
});

// 상태 메시지를 색깔과 함께 표시하는 작은 도우미 함수
function setStatus(text, type) {
  statusEl.textContent = text;
  statusEl.className = "status" + (type ? " " + type : "");
}
