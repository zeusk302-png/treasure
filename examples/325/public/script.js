/*
  이 파일은 무엇인가:
  "구매하기" 버튼의 동작입니다. 버튼을 누르면 우리 서버에 결제 세션 생성을 요청하고,
  서버가 돌려준 Stripe 결제 페이지 주소로 브라우저를 이동시킵니다.

  왜 이렇게 나눠 두는가:
  결제를 '만드는 일'은 시크릿 키가 필요하므로 서버가 합니다(server.js).
  이 프론트 코드는 시크릿 키를 전혀 모르고, 그저 서버에 요청하고 받은 URL로 이동만 합니다.
  그래서 이 파일에는 sk_test_... 같은 비밀값이 한 글자도 없어야 정상입니다.
*/

const buyBtn = document.getElementById("buyBtn");
const errorEl = document.getElementById("error");

buyBtn.addEventListener("click", async () => {
  // 중복 클릭으로 결제 세션이 여러 개 만들어지는 걸 막습니다(흔한 실수).
  buyBtn.disabled = true;
  buyBtn.textContent = "결제 페이지로 이동 중...";
  errorEl.textContent = ""; // 이전 에러 메시지 지우기

  try {
    // 서버에게 "결제 세션 하나 만들어 줘"라고 요청합니다.
    // 금액·상품은 서버가 정하므로, 여기서 가격을 보내지 않습니다(보내도 서버가 안 믿습니다).
    const res = await fetch("/create-checkout-session", { method: "POST" });

    if (!res.ok) throw new Error("서버가 결제 세션을 만들지 못했어요.");

    const data = await res.json();

    // 서버가 준 Stripe 결제 페이지 주소로 이동합니다.
    // 이 화면(우리 사이트)이 아니라 Stripe가 직접 호스팅하는 안전한 결제창으로 갑니다.
    // 왜 좋은가: 카드번호를 우리 서버가 절대 만지지 않아, 보안 책임을 Stripe에 맡길 수 있습니다.
    window.location.href = data.url;
  } catch (err) {
    // 에러 메시지는 반드시 textContent로 넣습니다.
    // 왜: innerHTML로 넣으면 메시지에 섞인 <script> 등이 실행될 수 있어 XSS 위험이라 막는 것입니다.
    errorEl.textContent = err.message + " 잠시 후 다시 시도해 주세요.";
    buyBtn.disabled = false;
    buyBtn.textContent = "구매하기 (테스트)";
  }
});
