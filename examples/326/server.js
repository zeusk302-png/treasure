/*
  이 파일은 무엇인가:
  Stripe(스트라이프) 결제가 끝났을 때 Stripe가 우리 서버로 보내는 "결제 완료 통보(웹훅)"를
  받아서 처리하는 작은 Node.js 서버(Express)입니다.
  핵심 한 줄: "돈이 진짜 들어왔는지는 손님 브라우저 말이 아니라, Stripe가 서버로 직접 보낸 웹훅으로만 믿는다."

  왜 있는가 (디렉터가 알아야 할 핵심):
  1) 서명 검증 — 이 통보가 정말 Stripe가 보낸 게 맞는지 '서명(signature)'으로 확인합니다.
     검증을 안 하면 아무나 "결제 완료됐어요" 가짜 요청을 보내 공짜로 주문을 '결제됨'으로 바꿀 수 있습니다.
  2) 멱등 처리 — Stripe는 같은 통보를 여러 번 보낼 수 있습니다(네트워크 재시도 등).
     같은 이벤트를 두 번 처리하면 주문이 두 번 배송되거나 적립이 두 번 될 수 있어, '한 번만' 처리되게 막습니다.
  3) 비밀값 분리 — 비밀 키(STRIPE_SECRET_KEY)와 웹훅 시크릿(STRIPE_WEBHOOK_SECRET)은
     코드에 박지 않고 .env(환경변수)에서만 읽습니다. 코드/깃에 노출되면 누구나 우리 돈을 만질 수 있습니다.
*/

// ── 1. 필요한 도구 불러오기 ────────────────────────────────────────────────
// dotenv: .env 파일에 적어 둔 비밀값을 process.env 로 읽어 오게 해 줍니다.
// 왜: 비밀 키를 코드에 직접 쓰지 않고 .env 에만 두기 위해서입니다(노출 방지).
require("dotenv").config();

const express = require("express");
// stripe 라이브러리에 '비밀 키'를 넣어 초기화합니다.
// 왜 비밀 키인가: 이 키는 환불·결제 등 돈을 움직이는 권한이라 '서버 전용'입니다. 절대 브라우저로 내보내면 안 됩니다.
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const app = express();

// 웹훅 시크릿: Stripe 대시보드에서 웹훅을 만들면 주는 'whsec_...' 값입니다.
// 왜: 들어온 통보가 진짜 Stripe 것인지 '서명'을 대조할 때 이 비밀로 검증합니다. 이것도 서버 전용 비밀값입니다.
const WEBHOOK_SECRET = process.env.STRIPE_WEBHOOK_SECRET;

// ── 2. (예시용) 주문 저장소 ────────────────────────────────────────────────
// 실제 서비스라면 여기 대신 데이터베이스(Supabase 등)에 주문을 저장합니다.
// 여기서는 개념을 보이려고 메모리(Map)에 주문 상태를 흉내 냅니다(서버를 끄면 사라집니다).
const orders = new Map(); // 예: orders.set("order_123", { status: "결제대기" })
orders.set("order_123", { status: "결제대기" }); // 데모용으로 미리 주문 하나를 만들어 둡니다.

// 이미 처리한 이벤트 id 를 기억하는 곳 — '멱등 처리(같은 일 두 번 방지)'의 핵심입니다.
// 왜: Stripe 는 같은 이벤트를 재시도로 또 보낼 수 있는데, 그때 이미 처리했으면 다시 안 하려고 id 를 적어 둡니다.
// 실제 서비스라면 이 기록도 DB 테이블(예: processed_events)에 둡니다(서버가 꺼져도 남게).
const processedEvents = new Set();

// ── 3. 웹훅 받는 길(엔드포인트) ────────────────────────────────────────────
// 중요: 웹훅 경로만큼은 express.json() 같은 자동 파서를 쓰지 않고 'raw(원문 그대로)'로 받습니다.
// 왜: 서명 검증은 '바이트 한 글자도 안 바뀐 원문'으로 계산해야 맞습니다.
//     JSON 으로 한 번 파싱하면 글자가 미묘하게 바뀌어 서명 검증이 무조건 실패합니다. (초보가 가장 많이 막히는 지점!)
app.post(
  "/webhook",
  express.raw({ type: "application/json" }), // 원문(raw body)으로 받기 — 서명 검증을 위해 꼭 필요
  (req, res) => {
    // Stripe 가 헤더에 같이 보내 준 서명 값입니다.
    const signature = req.headers["stripe-signature"];

    let event;
    try {
      // 서명 검증: (원문 + 헤더 서명 + 웹훅 시크릿)이 서로 들어맞아야 통과합니다.
      // 통과해야만 "이 통보는 진짜 Stripe 가 보낸 것"이라고 믿을 수 있습니다.
      // 왜 try 로 감싸나: 검증이 실패하면 예외가 나는데, 그때 400(잘못된 요청)으로 돌려보내야 합니다.
      event = stripe.webhooks.constructEvent(req.body, signature, WEBHOOK_SECRET);
    } catch (err) {
      // 서명이 안 맞으면(=가짜이거나 변조됨) 여기로 옵니다. 절대 주문을 바꾸지 않고 거절합니다.
      console.error("서명 검증 실패 — 가짜/변조 요청일 수 있어 거절합니다:", err.message);
      return res.status(400).send(`Webhook Error: ${err.message}`);
    }

    // ── 4. 멱등 처리: 이미 본 이벤트면 그냥 200 으로 끝낸다 ──────────────────
    // 왜: 같은 결제 통보를 두 번 처리하면 주문이 두 번 완료되거나 두 번 배송될 수 있습니다.
    //     event.id 는 이벤트마다 고유하므로, 이미 처리했으면 다시 처리하지 않습니다.
    if (processedEvents.has(event.id)) {
      console.log(`이미 처리한 이벤트라 건너뜁니다: ${event.id}`);
      return res.status(200).json({ received: true, duplicated: true });
    }

    // ── 5. 이벤트 종류별 처리 ──────────────────────────────────────────────
    // Stripe 는 결제 외에도 여러 이벤트를 보냅니다. 우리가 관심 있는 것만 골라 처리합니다.
    switch (event.type) {
      case "checkout.session.completed": {
        // Checkout(결제 페이지)에서 결제가 끝났을 때 오는 이벤트입니다.
        const session = event.data.object;

        // 결제를 만들 때 우리가 넣어 둔 주문 번호를 다시 꺼냅니다.
        // 왜 client_reference_id 인가: "이 결제가 '우리 쪽 어떤 주문'인지"를 잇는 끈입니다.
        //   (Checkout 세션을 만들 때 client_reference_id 에 주문 id 를 넣어 두면 여기서 받을 수 있습니다.)
        const orderId = session.client_reference_id;
        const order = orders.get(orderId);

        if (order) {
          order.status = "결제됨"; // 핵심: 여기서만 주문을 '결제됨'으로 바꿉니다(검증을 통과한 진짜 통보일 때만).
          console.log(`주문 ${orderId} 을(를) '결제됨'으로 변경했습니다.`);
        } else {
          // 주문을 못 찾는 경우(데이터 불일치 등)도 로그만 남기고 200 을 돌려줍니다.
          // 왜: 여기서 에러(500)를 내면 Stripe 가 계속 재시도해 같은 통보가 폭주합니다.
          console.warn(`주문을 찾지 못했습니다(orderId=${orderId}). 데이터 확인 필요.`);
        }
        break;
      }

      case "payment_intent.succeeded":
        // 결제 의도(PaymentIntent) 방식으로 받았을 때의 성공 이벤트(참고용).
        console.log("결제 성공 이벤트 수신:", event.data.object.id);
        break;

      default:
        // 관심 없는 이벤트는 처리하지 않고 그냥 받았다고만 알립니다.
        // 왜: 모르는 이벤트에 에러를 내면 안 됩니다(Stripe 가 재시도로 계속 보내게 됨).
        console.log(`처리 대상이 아닌 이벤트라 무시: ${event.type}`);
    }

    // 처리한 이벤트 id 를 기록해, 다음에 같은 통보가 또 와도 다시 처리하지 않게 합니다.
    processedEvents.add(event.id);

    // ── 6. 마지막에 반드시 200 으로 빠르게 응답 ───────────────────────────
    // 왜: Stripe 는 우리 서버가 200 을 줘야 "잘 받았구나" 하고 재시도를 멈춥니다.
    //     200 을 늦게 주거나 안 주면 같은 통보를 계속 다시 보냅니다(그래서 멱등 처리가 더 중요해집니다).
    //     무거운 작업(메일 발송 등)은 여기서 기다리지 말고 큐로 넘기고 먼저 200 을 주는 게 정석입니다.
    res.status(200).json({ received: true });
  }
);

// ── 7. (확인용) 주문 상태를 눈으로 보는 길 ─────────────────────────────────
// 웹훅이 잘 동작했는지 브라우저로 확인하려고 만든 간단한 조회 엔드포인트입니다(실습 편의용).
// 실제 서비스에서는 이런 조회도 로그인/권한 검사를 거쳐야 합니다.
app.get("/orders/:id", (req, res) => {
  const order = orders.get(req.params.id);
  if (!order) return res.status(404).json({ error: "주문 없음" });
  // res.json 은 객체를 안전하게 JSON 으로 내보냅니다(HTML 로 그리는 게 아니라 XSS 위험이 없습니다).
  res.json({ orderId: req.params.id, ...order });
});

// ── 8. 서버 켜기 ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4242;
app.listen(PORT, () => {
  console.log(`웹훅 서버 실행 중: http://localhost:${PORT}`);
  console.log(`웹훅 받는 길: POST http://localhost:${PORT}/webhook`);
});
