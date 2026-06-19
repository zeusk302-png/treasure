# 실습 326 — Stripe 웹훅으로 결제 완료 처리하기

손님이 카드로 결제를 끝냈을 때 Stripe(스트라이프)가 우리 서버로 보내는 **결제 완료 통보(웹훅)**를 받아, 그게 **진짜 Stripe가 보낸 것인지 서명으로 검증**한 뒤 우리 주문을 `결제대기`에서 `결제됨`으로 바꾸는 작은 서버를 만듭니다. 이 실습의 진짜 목표는 코드 한 줄이 아니라, **"돈이 들어왔다는 사실을 무엇으로 믿을 것인가"**라는 판단력입니다 — 손님 브라우저의 말이 아니라, Stripe가 서버로 직접 보낸 검증된 통보만 믿습니다.

> 한 줄 그림: **손님이 Checkout에서 결제 → Stripe가 우리 서버 `/webhook`으로 "결제 끝났음" 통보 → 서버가 서명 검증(진짜 Stripe냐?) → 이미 처리한 통보인지 확인(두 번 처리 금지) → 주문을 '결제됨'으로 변경**

> 비유: 택배 기사가 "돈 받았어요"라고 말로만 하면 안 믿고, **회사 직인이 찍힌 영수증**을 보고서야 장부에 '입금 완료'를 적는 것과 같습니다. 서명 검증은 그 **직인 확인**이고, 멱등 처리는 **같은 영수증을 두 번 받아도 장부엔 한 번만 적는 규칙**입니다.

> 보안 메모 — 공개해도 되는 값 vs 절대 숨겨야 하는 값
> - **절대 노출하면 안 되는 비밀값**: `STRIPE_SECRET_KEY`(결제·환불을 움직이는 권한)와 `STRIPE_WEBHOOK_SECRET`(서명 검증용 비밀). 둘 다 **서버 전용**이라 코드에 박지 않고 `.env`(환경변수)에만 둡니다. 노출되면 누구나 우리 돈을 만질 수 있습니다.
> - **검증을 반드시 해야 하는 이유**: 검증이 없으면 아무나 우리 `/webhook`에 "결제 완료됐어요" 가짜 요청을 보내 **공짜로 주문을 '결제됨'으로 바꿀 수 있습니다.** 서명 검증을 통과한 통보만 믿는 것이 핵심입니다.
> - 이 폴더의 `.env.example`에는 진짜 키가 아니라 **자리표시자**(`sk_test_REPLACE_...`, `whsec_REPLACE_...`)만 들어 있습니다. 진짜 값은 복사해 만든 `.env`에만 적고, `.env`는 `.gitignore`로 깃에서 빠집니다.

## 목표
- **웹훅을 이해한다**: 결제 성공을 "손님 화면이 그렇게 보였으니까"가 아니라, **Stripe가 서버로 직접 보낸 통보**로 확인한다는 흐름을 익힌다.
- **서명 검증을 직접 한다**: 들어온 통보가 진짜 Stripe 것인지 `stripe.webhooks.constructEvent(원문, 서명, 시크릿)`으로 검증하고, 실패하면 `400`으로 거절한다.
- **멱등 처리를 한다**: 같은 이벤트(`event.id`)가 두 번 와도 주문이 **한 번만** 처리되게 막는다(중복 배송·중복 적립 방지).
- **비밀값을 코드 밖에 둔다**: 비밀 키·웹훅 시크릿을 코드가 아니라 `.env`/환경변수에만 두고, 깃에는 자리표시자만 올린다.
- **빠른 200 응답을 한다**: 처리 후 즉시 `200`을 돌려줘 Stripe가 같은 통보를 계속 재시도하지 않게 한다.

## 따라하는 단계

### A. 준비물 깔기
1. 이 폴더에서 `npm install`을 실행합니다. (`express`, `stripe`, `dotenv`가 깔립니다.)
2. `.env.example`을 복사해 `.env`를 만듭니다.
   - macOS/Linux/Git Bash: `cp .env.example .env`
   - Windows PowerShell: `Copy-Item .env.example .env`

### B. Stripe 키 받아 .env에 넣기 (비밀값은 코드에 절대 안 박습니다)
3. [Stripe 대시보드](https://dashboard.stripe.com)에 가입/로그인하고, 우상단 **테스트 모드(Test mode)**를 켭니다. (실제 돈이 안 빠지는 연습용입니다.)
4. **Developers → API keys**에서 **Secret key**(`sk_test_...`)를 복사해 `.env`의 `STRIPE_SECRET_KEY=`에 붙입니다.
5. **웹훅 시크릿**(`whsec_...`)은 다음 단계(Stripe CLI)에서 받아 `.env`의 `STRIPE_WEBHOOK_SECRET=`에 넣습니다.

### C. 서버 켜고, Stripe CLI로 내 컴퓨터까지 통보 받기
6. 새 터미널에서 `npm start`로 서버를 켭니다. `웹훅 받는 길: POST http://localhost:4242/webhook` 가 보이면 됩니다.
7. [Stripe CLI](https://stripe.com/docs/stripe-cli)를 설치하고 로그인합니다(`stripe login`).
8. **또 다른 터미널**에서 아래를 실행하면, Stripe가 내 로컬 서버까지 통보를 전달해 줍니다.
   ```
   stripe listen --forward-to localhost:4242/webhook
   ```
   - 실행하면 화면에 `whsec_...`가 출력됩니다. **이 값을 `.env`의 `STRIPE_WEBHOOK_SECRET`에 넣고 서버를 다시 켭니다.** (이게 서명 검증의 열쇠입니다.)

### D. 가짜 결제 이벤트 한 번 쏘아 보기
9. 세 번째 터미널에서 결제 완료 이벤트를 흉내 내 보냅니다.
   ```
   stripe trigger checkout.session.completed
   ```
10. 서버 로그에 `서명 검증 성공`(에러 없음)과 처리 로그가 보이는지 확인합니다.
    - 데모 주문(`order_123`)이 바뀌는 걸 보려면, 실제로는 Checkout 세션을 만들 때 `client_reference_id`에 `order_123`을 넣어야 합니다. CLI의 `trigger`는 기본 샘플이라 주문 id가 비어 있을 수 있어, 로그의 `주문을 찾지 못했습니다` 경고는 정상입니다(검증·멱등 흐름 자체는 확인됩니다).

### E. 가짜 통보가 거절되는지 확인 (보안의 핵심)
11. 서명 없이 일부러 가짜 요청을 보내 봅니다.
    ```
    curl -X POST http://localhost:4242/webhook -H "Content-Type: application/json" -d "{\"hi\":\"fake\"}"
    ```
    `Webhook Error: ...`와 함께 **400**이 떠야 정상입니다 — 서명이 없으니 거절된 것입니다. (이게 거절돼야 우리 서비스가 안전합니다.)

## 🤖 바이브코딩 프롬프트
이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 결제 연동에 익숙한 백엔드 멘토야. 비전공자도 이해하게 한국어 주석을 많이 달아 줘(코드 식별자는 영어).
  목표: Node.js + Express 로 Stripe 결제 완료 웹훅을 받는 서버 server.js 를 만들어 줘.
  요구사항:
  - POST /webhook 엔드포인트 하나. 단, 이 경로는 express.json() 으로 파싱하지 말고
    express.raw({ type: "application/json" }) 로 '원문(raw body)'으로 받아야 해(서명 검증 때문).
  - 헤더 stripe-signature 와 .env 의 STRIPE_WEBHOOK_SECRET 으로 stripe.webhooks.constructEvent 로 서명 검증.
    검증 실패하면 400 으로 거절.
  - event.type === "checkout.session.completed" 일 때 session.client_reference_id 로 주문을 찾아 status 를 "결제됨" 으로 변경.
  - 비밀값(STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET)은 코드에 박지 말고 dotenv 로 .env 에서만 읽어.
  - 함께 만들 것: package.json, .env.example(자리표시자만), .gitignore(.env, node_modules).
  코드만 주지 말고 "왜 raw body 로 받아야 하는지", "왜 서명 검증을 하는지"를 주석으로 한 줄씩 풀어서 설명해 줘.
  ```

- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  방금 만든 server.js 에 '멱등 처리(idempotency)'를 추가해 줘.
  - Stripe 는 같은 이벤트를 네트워크 재시도로 여러 번 보낼 수 있어. 같은 event.id 가 두 번 오면
    주문 처리를 한 번만 하도록 막아 줘(이미 처리한 event.id 를 기억했다가, 또 오면 처리하지 말고 바로 200 응답).
  - 처리 끝나면 항상 200 을 빠르게 응답해서 Stripe 가 재시도를 멈추게 해 줘.
  - 메일 발송처럼 무거운 작업은 응답을 기다리게 하지 말고 나중에 처리(큐로 넘기는 흐름)하도록 주석으로 안내해 줘.
  - 지금은 메모리(Map/Set)로 흉내 냈는데, 실제 서비스에서 이걸 데이터베이스 테이블로 바꿀 때 어떻게 하는지 주석으로 설명해 줘.
  왜 멱등 처리가 없으면 위험한지(중복 배송·중복 적립)도 주석에 적어 줘.
  ```

- **막혔을 때(디버깅)** 프롬프트:
  ```text
  Stripe 웹훅 서명 검증이 자꾸 실패해. 에러는 이거야:
  "Webhook Error: No signatures found matching the expected signature for payload."
  내 server.js 일부를 붙여넣을게. [여기에 코드 붙여넣기]
  비전공자도 이해하게 한국어로, 가능한 원인을 가능성 높은 순서로 짚어 주고 각각 어떻게 확인/수정하는지 알려 줘.
  특히 이 점들을 점검해 줘:
  1) 웹훅 경로에서 express.json() 같은 파서가 먼저 동작해 body 가 바뀐 건 아닌지(raw body 로 받아야 함)
  2) .env 의 STRIPE_WEBHOOK_SECRET 이 'stripe listen' 이 출력한 whsec_ 값과 일치하는지(다른 환경의 시크릿을 쓴 건 아닌지)
  3) constructEvent 에 넣는 인자 순서(원문 body, 헤더 서명, 시크릿)가 맞는지
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다.

## 검증법
- **서명 검증 성공 확인**: `stripe listen` + `stripe trigger checkout.session.completed`로 이벤트를 보냈을 때, 서버가 **에러 없이 처리**하고 `200`을 돌려주는지 본다(터미널에 빨간 에러가 없어야 정상).
- **가짜 통보 거절 확인(가장 중요)**: 서명 없이 `curl`로 `/webhook`에 요청을 보내면 **`400`으로 거절**되는지 본다. 거절되면 보안이 작동하는 것이다.
- **멱등 처리 확인**: 같은 이벤트가 두 번 들어오면 두 번째에는 서버 로그에 `이미 처리한 이벤트라 건너뜁니다`가 찍히고 주문이 **중복 처리되지 않는지** 본다.
- **주문 상태 확인**: 처리 후 브라우저에서 `http://localhost:4242/orders/order_123`을 열어, 검증된 결제 통보를 받은 주문만 `결제됨`으로 바뀌는지 본다.
- **비밀값이 코드/깃에 없는지 확인**: 이 폴더에서 아래를 실행하면 **자리표시자만** 나와야 정상이다(진짜 키가 나오면 안 된다).
  - `grep -nE "sk_(test|live)_[A-Za-z0-9]{10}|whsec_[A-Za-z0-9]{10}" server.js .env.example` → 진짜 키가 안 나와야 한다(`REPLACE_...` 같은 자리표시자만).
  - `.env`가 `.gitignore`에 들어 있어 `git status`에 안 뜨는지도 확인한다.

## 파일 구성
- `server.js` — 결제 웹훅 핸들러. 원문(raw) 수신 → 서명 검증 → 멱등 처리 → 주문 `결제됨` 변경 → 빠른 200 응답. 모든 핵심 줄에 "무엇+왜" 주석.
- `package.json` — 의존성(`express`/`stripe`/`dotenv`)과 실행 명령(`npm start`).
- `.env.example` — 필요한 비밀값 견본(자리표시자만). 복사해 `.env`를 만들고 진짜 값은 거기에만 넣는다.
- `.gitignore` — `.env`·`node_modules`가 깃에 안 올라가게 막는다.

## 관련 가이드
- [13권 07 — 결제 연동 (Stripe로 구독·결제)](../../docs/13-ai-tools/07.md) — 이번에 받는 그 '웹훅(서버 통보)'으로 입금을 확인하는 원리가 여기서 나옵니다.
- [11권 05 — 입력 검증과 에러 처리 (신뢰할 수 없는 입력 다루기)](../../docs/11-backend-advanced/05.md) — 외부에서 들어온 요청(웹훅 포함)을 함부로 믿지 않는 사고방식의 본문입니다.
- [11권 01 — 서버란 무엇인가 (요청을 받아 응답하는 기계)](../../docs/11-backend-advanced/01.md) — 웹훅을 받는 `/webhook`이 바로 이 '요청→응답' 구조입니다.
- [4권 — 안전(보안) 개요](../../docs/04-security/index.md) — 비밀 키를 코드 밖에 두고 검증으로 위변조를 막는 보안 기본기.
- 관련 실습: 실습 180 (비밀값을 코드가 아니라 환경변수/자격증명에 두기) — 이번에 Stripe 키를 `.env`에만 두는 원리가 거기서 나옵니다.
- Stripe 웹훅 공식 문서(영문): https://stripe.com/docs/webhooks
- Stripe 서명 검증 문서(영문): https://stripe.com/docs/webhooks#verify-events
- Stripe CLI 문서(영문): https://stripe.com/docs/stripe-cli
