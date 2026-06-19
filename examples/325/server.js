/*
  이 파일은 무엇인가:
  Stripe(스트라이프) "테스트 결제"를 처리하는 아주 작은 서버(Node.js + Express)입니다.
  브라우저의 "구매하기" 버튼이 이 서버에 요청을 보내면, 서버가 Stripe에
  "결제 세션(Checkout Session)"을 만들어 달라고 부탁하고, Stripe가 돌려준
  '결제 페이지 주소'로 손님을 보냅니다. 손님은 Stripe가 호스팅하는 안전한
  결제창에서 테스트 카드로 결제하고, 끝나면 우리 사이트의 성공/취소 페이지로 돌아옵니다.

  왜 서버가 꼭 필요한가 (가장 중요한 보안 포인트):
  Stripe '시크릿 키(sk_test_...)'는 결제를 일으킬 수 있는 진짜 열쇠라서
  브라우저(클라이언트)에 절대 두면 안 됩니다. F12로 누구나 볼 수 있고,
  그러면 남이 내 계정으로 결제를 만들 수 있습니다. 그래서 시크릿 키는
  오직 이 서버 코드(그리고 .env)에서만 읽고, 브라우저에는 'pk_test_...'(공개키)나
  결제 페이지 주소만 내려보냅니다.
*/

// .env 파일에 적은 비밀값(STRIPE_SECRET_KEY 등)을 process.env 로 불러옵니다.
// 왜: 키를 코드에 직접 박지 않고 .env(깃에 안 올라감)에서만 읽기 위해서입니다.
require("dotenv").config();

const express = require("express");

// Stripe SDK를 '시크릿 키'로 초기화합니다.
// 왜 이 한 줄이 보안의 핵심인가: 이 키가 있어야 결제를 만들 수 있는데,
// 이 줄은 서버에서만 실행되므로 키가 브라우저로 새어 나가지 않습니다.
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

// public 폴더(index.html, success.html, cancel.html)를 정적 파일로 제공합니다.
// 왜: 프론트와 서버를 한 주소(localhost:3000)에서 같이 띄워 실습을 단순하게 하려고요.
app.use(express.static("public"));

// 우리 사이트의 기본 주소. 결제가 끝나고 손님을 어디로 돌려보낼지에 씁니다.
// 왜 환경변수로 빼나: 로컬에선 localhost, 배포하면 진짜 도메인으로 바뀌기 때문입니다.
const SITE_URL = process.env.SITE_URL || "http://localhost:3000";

// 데모용 상품 정보. 진짜 서비스라면 DB나 Stripe 상품 카탈로그에서 가져옵니다.
// 왜 가격을 서버에 두나: 가격을 브라우저가 정하게 하면 손님이 1원으로 바꿔 보낼 수 있어요.
//   금액은 '반드시 서버가 정한다'가 결제 보안의 기본 규칙입니다.
const PRODUCT = {
  name: "부산코딩스쿨 굿즈 스티커팩 (테스트)",
  // Stripe 금액 단위 주의: 원(KRW)은 '소수점 없는 통화'라 그대로 정수로 넣습니다.
  //   (달러였다면 cents 단위라 $9.99 = 999 로 넣어야 합니다.)
  amount: 3000, // 3,000원
  currency: "krw",
};

// "구매하기" 버튼이 호출하는 엔드포인트.
// 하는 일: Stripe에 'Checkout 세션'을 만들어 달라고 요청하고, 그 결제 페이지 주소를 돌려줍니다.
app.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      // mode: "payment" = 한 번 결제(구독이면 "subscription").
      mode: "payment",

      // 무엇을 얼마에 파는지. price_data로 즉석에서 가격을 정의합니다.
      line_items: [
        {
          quantity: 1,
          price_data: {
            currency: PRODUCT.currency,
            unit_amount: PRODUCT.amount, // 서버가 정한 금액(위 PRODUCT.amount). 브라우저 값 안 믿음.
            product_data: { name: PRODUCT.name },
          },
        },
      ],

      // 결제 성공/취소 후 돌아올 우리 사이트 주소.
      // {CHECKOUT_SESSION_ID}는 Stripe가 실제 세션 ID로 바꿔 넣어 줍니다(성공 페이지에서 조회에 사용).
      success_url: `${SITE_URL}/success.html?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${SITE_URL}/cancel.html`,
    });

    // 브라우저에는 '결제 페이지 주소(session.url)'만 내려보냅니다.
    // 왜: 시크릿 키나 민감한 내부 정보는 절대 보내지 않고, 손님을 보낼 URL만 주면 충분합니다.
    res.json({ url: session.url });
  } catch (err) {
    // 결제 세션 생성이 실패하면(키 오타·네트워크 등) 에러를 로그로 남기고 500을 돌려줍니다.
    // 왜 메시지를 그대로 다 노출하지 않나: 내부 오류 상세가 손님 화면에 새어 나가지 않게 하려고요.
    console.error("Checkout 세션 생성 실패:", err.message);
    res.status(500).json({ error: "결제 세션을 만들지 못했습니다. 잠시 후 다시 시도해 주세요." });
  }
});

// 성공 페이지가 "이 결제 진짜 됐어?"를 서버에 물어볼 때 쓰는 엔드포인트.
// 왜 서버가 다시 확인하나: 브라우저가 success.html에 도착했다고 해서 결제가 끝난 건 아닙니다
//   (주소만 알면 누구나 그 페이지를 열 수 있으니까요). 그래서 서버가 Stripe에 세션을 다시
//   조회해 payment_status가 'paid'인지 '확인'합니다. (진짜 신뢰는 실습 326의 '웹훅'에서 합니다.)
app.get("/check-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.retrieve(req.query.session_id);
    res.json({
      paid: session.payment_status === "paid", // 'paid'면 결제 완료
      amount: session.amount_total,
      currency: session.currency,
    });
  } catch (err) {
    console.error("세션 조회 실패:", err.message);
    res.status(400).json({ paid: false });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`서버 실행 중 → ${SITE_URL}  (포트 ${PORT})`);
  // 시크릿 키가 비어 있으면 미리 경고해 줍니다(흔한 막힘 지점이라 친절하게 안내).
  if (!process.env.STRIPE_SECRET_KEY) {
    console.warn("⚠️  STRIPE_SECRET_KEY 가 비어 있습니다. .env 를 만들고 sk_test_... 를 넣으세요.");
  }
});
