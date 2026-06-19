# 실습 252 — 쇼핑몰 주문 폼으로 주문 내역을 Supabase orders 테이블에 저장하기

방명록에서는 **한 줄에 한 개의 정보(이름·메시지)** 를 저장했습니다.
이번 미니프로젝트에서는 한 걸음 더 나아가, **장바구니에 담긴 여러 상품을
하나로 묶어 '주문 한 건'으로 저장**합니다. 그리고 서버가 매겨 준 **주문번호**를 돌려받습니다.

> 비유: 카페에서 음료 3잔을 따로따로 주문하는 게 아니라,
> 메모지 한 장에 "아메리카노 2, 라떼 1, 케이크 1 / 합계 20,500원 / 홍길동 / 010-..."
> 이렇게 **한 장으로 묶어** 카운터(서버)에 내고, **주문표 번호표**를 받는 것과 같습니다.

이 폴더에 있는 파일:

- `README.md` — 이 안내문
- `schema.sql` — 주문을 저장할 **`orders` 표를 만드는 SQL** (가장 먼저 1번만 실행)
- `index.html` — 장바구니 + 주문자 정보 입력 화면
- `script.js` — **핵심 코드.** 장바구니를 묶어 `insert()`로 주문 한 줄을 저장합니다.

## 목표

- 장바구니에 담긴 **여러 상품을 한 칸(`items`)에 통째로 묶어** 저장하는 법을 익힌다.
- `supabase.from('orders').insert([{ customer_name, phone, items, total_price }])` 로
  **여러 정보를 한 줄(한 주문)로 묶어 저장**한다.
- 저장 후 서버가 자동으로 매겨 준 **`id`(주문번호)** 를 받아 화면에 보여 준다.
- `id`, `created_at` 처럼 **표가 자동으로 채워 주는 칸**은 우리가 안 보내도 된다는 걸 안다.

## 따라하는 단계

1. **먼저 표를 만든다.** Supabase 대시보드 → 왼쪽 **SQL Editor → New query** 에
   이 폴더의 `schema.sql` 내용을 통째로 붙여넣고 오른쪽 위 **[Run]** 을 누른다.
   → 왼쪽 **Table Editor** 에 `orders` 표가 생기면 성공.
2. Supabase 대시보드 **Settings(톱니바퀴) → API** 에서 두 값을 복사한다.
   - **Project URL** : `https://xxxxxxxx.supabase.co` 형태의 주소 (비밀 아님)
   - **anon public** 키 (신형은 `sb_publishable_...` 로 시작) : 브라우저에 둬도 되는 **공개 출입증**
   - ⚠️ 같은 화면의 **`service_role` / `sb_secret_...` 키는 절대 쓰지 마세요.** 모든 보안을 무시하는 마스터 키입니다.
3. 이 폴더의 `script.js`를 열고, 맨 위 두 줄의 **자리표시자**를 내 값으로 바꾼다.
   ```js
   const SUPABASE_URL = "https://여기에-내-프로젝트-ID.supabase.co";        // ← 내 Project URL
   const SUPABASE_ANON_KEY = "sb_publishable_여기에-내-anon-공개키-붙여넣기"; // ← 내 anon public 키
   ```
4. `index.html`을 **브라우저로 연다.** (파일을 더블클릭)
5. 장바구니에서 **`+` / `−` 버튼으로 수량을 조절**해 보고, **합계가 즉시 바뀌는지** 확인한다.
6. **이름**과 **연락처**를 적고 **[주문하기]** 버튼을 누른다.
   → 폼 아래 박스가 **초록색 "주문이 접수됐어요! 주문번호: 1 ..."** 로 바뀌면 성공.
7. Supabase 대시보드 → **Table Editor → orders** 표를 연다.
   방금 넣은 주문이 한 줄로 들어와 있고, `items` 칸에 **상품 목록(JSON)** 이,
   `total_price` 에 **합계**가, `id`/`created_at` 이 **자동으로** 채워졌는지 확인한다.

## 🤖 바이브코딩 프롬프트

이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다.
(내 Supabase Project URL과 anon 키는 직접 넣어야 합니다. 키는 **`sb_publishable_` / `anon`** 만, `service_role`은 절대 금지.)

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 비전공자도 따라할 수 있게 코드를 만들어 주는 도우미야.
  "쇼핑몰 주문 폼" 미니프로젝트를 만들어 줘. 결과물은 index.html, script.js, schema.sql 세 파일.

  요구사항:
  - schema.sql: Supabase에 'orders' 표를 만드는 SQL. 칸은
    id(자동 증가 기본키), customer_name(필수), phone(필수),
    items(jsonb, 장바구니 상품 목록을 통째로 담는 칸), total_price(0 이상 정수), created_at(자동 시각).
  - index.html: 장바구니 영역(상품 목록 + 수량 +/- 버튼 + 합계)과
    주문자 정보 폼(이름, 연락처, [주문하기] 버튼), 결과 메시지 박스.
  - script.js: @supabase/supabase-js v2 CDN으로 연결을 만들고,
    장바구니(CART) 배열을 화면에 그린다. 키 값은 자리표시자로 둬.

  제약: 입력값 출력은 textContent를 쓰고(XSS 예방), 비밀키는 코드에 박지 마.
  왜 그렇게 했는지 한국어 주석으로 한 줄씩 설명해 줘.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  좋아. 이제 [주문하기] 버튼을 누르면 장바구니에 담긴 '여러 상품을 한 건의 주문'으로 묶어 저장하게 해 줘.

  - +/- 버튼으로 수량을 바꾸면 합계가 즉시 바뀌게 해 줘(이벤트 위임으로).
  - 제출 시 supabase.from('orders').insert([{ customer_name, phone, items, total_price }]) 로 한 줄을 저장하고,
    .select()로 서버가 자동으로 매겨 준 id(주문번호)를 돌려받아 화면에 보여 줘.
  - 저장 중에는 버튼을 잠가 중복 주문을 막고, 끝나면 다시 풀어 줘.
  - 이름/연락처 빈 칸이면 저장하지 말고 친절한 안내 메시지를 띄워 줘.
  - id와 created_at은 표가 자동으로 채우니 우리가 보내지 않게 해 줘. 왜 안 보내는지도 주석으로 적어 줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  주문 버튼을 눌렀는데 저장이 안 돼. 아래는 브라우저 콘솔(F12)에 뜬 에러야:

  (여기에 빨간 에러 메시지를 그대로 붙여넣기)

  이 에러가 무슨 뜻인지 비전공자가 이해하게 설명하고,
  가능한 원인을 가능성 높은 순서로 짚어 준 다음, 내가 직접 확인할 단계를 알려 줘.
  특히 schema.sql을 실행했는지, 컬럼 이름이 insert 키와 똑같은지,
  넣은 키가 anon(sb_publishable_)인지 service_role이 아닌지 점검 항목에 넣어 줘.
  ```
> 프롬프트 팁: "코드만 주지 말고 **왜 그렇게 했는지 주석으로 설명해줘**", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다.

## 검증법

- 장바구니에서 `+` / `−` 를 누르면 **합계 금액이 바로 바뀌는가?**
- 주문 후 폼 아래 박스가 **초록색**으로 바뀌고 **주문번호(id)** 와 **결제 금액**이 보이는가?
- 브라우저 **개발자 도구 → Console**(윈도우 `F12`, 맥 `Cmd + Option + I`)에
  `✅ 주문 성공!` 로그와 서버가 돌려준 데이터(`id`, `items`, `total_price`, `created_at` 포함)가 찍혔는가?
- **가장 중요한 확인:** Supabase 대시보드 **Table Editor → orders** 에 그 주문이 진짜 들어가 있는가?
  특히 `items` 칸을 펼쳐 **여러 상품이 하나로 묶여** 저장됐는지 본다.
- **실패할 때 원인 찾기** (콘솔의 빨간 에러 메시지로 구분):
  - `relation "public.orders" does not exist` → 1단계 `schema.sql`을 실행 안 했음. SQL Editor에서 다시 실행.
  - `Could not find the 'xxx' column` → 컬럼 이름 오타. `insert`의 키(`customer_name`, `phone`, `items`, `total_price`)가 표의 칸 이름과 똑같아야 함.
  - `null value in column "customer_name" violates not-null` → 빈 칸 그대로 보냄. 이름·연락처를 채웠는지 확인.
  - `violates check constraint` → `total_price`가 음수. 합계 계산이 0 이상인지 확인.
  - `Invalid API key` → anon 키를 잘못 붙여넣음. (혹시 service_role을 넣지 않았는지도 확인)
  - 주소 오류 / `Failed to fetch` → `SUPABASE_URL`의 철자나 `https://` 확인.
  - `new row violates row-level security policy` → 표에 RLS가 켜져 있는데 **insert 정책**이 없는 경우.
    이 단계에선 `schema.sql`처럼 RLS를 끈 상태면 정상 통과합니다. (보안을 켜는 법은 아래 가이드 참고)
- **(안전 점검)** `script.js`에 넣은 키가 **`anon` / `sb_publishable_`** 로 시작하는가? `service_role` / `sb_secret_` 가 **아닌가?**

## 관련 가이드

- [공개해도 되는 키 vs 절대 숨길 키 — anon/publishable vs service_role/secret](../../docs/04-security/01.md) — `script.js`에 어떤 키를 넣어야 안전한지
- [RLS(행 수준 보안) — 출입증을 공개해도 안전한 진짜 이유](../../docs/04-security/02.md) — 주문 표에 RLS를 켜고 "손님은 만들기만" 정책을 다는 이유
- [환경변수(.env) 제대로 — 무엇을 어디에, 무엇을 절대 커밋 안 하나](../../docs/04-security/03.md) — 비밀 키(service_role)는 어디에 둬야 하는가
- [API가 뭔가 — 주방에 음식을 주문하는 창구](../../docs/02-web-basics/04.md) — 웹페이지가 서버에 데이터를 보내는 원리
- [실습 — 직접 따라 만들기](../../docs/practice/index.md)

## 더 해보기 (선택)

- 방명록 insert 기본기부터 복습하고 싶다면 → [실습 116](../116/)
- 저장한 데이터를 **목록으로 불러오기(select)** → [실습 117](../117/)
- 주문을 진짜 안전하게: 표에 **RLS를 켜고 정책 추가** → [실습 119](../119/)
