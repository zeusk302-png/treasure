# 실습 249 — 상품 목록 쇼핑몰 페이지를 Supabase `products` 표에서 불러오기

쇼핑몰에서 가장 흔한 화면, **상품 목록(카드 그리드)** 을 직접 만들어 봅니다.
상품 데이터를 **Supabase 표(`products`)에서 읽어(SELECT)** 와서 카드로 죽 늘어놓아,
**데이터베이스(DB) → 브라우저(프론트)로 데이터를 읽어 그리는 흐름**을 한 번에 체험하는 것이 목표입니다.

> 비유: 이번 화면은 가게의 **'진열대'** 입니다.
> 손님(브라우저)은 진열된 상품을 **구경(SELECT)할 수만** 있고,
> 가격표를 바꾸거나 물건을 빼낼 수는 **없습니다**(INSERT/UPDATE/DELETE 막힘).
> 창고를 여는 마스터 열쇠(`service_role`)는 주인(서버)만 가집니다.

이 폴더에 있는 파일:

- `README.md` — 이 안내문
- `index.html` — 상품 카드들이 들어갈 그리드 화면
- `style.css` — 반응형 카드 그리드 디자인 (화면 너비에 따라 열 개수 자동 조절)
- `script.js` — anon(공개) 키로 `products` 표를 `select` 해서 카드로 그리는 코드
- `schema.sql` — **핵심.** 표 만들기 + RLS 켜기 + "읽기(SELECT)만 허용" 정책 + 예시 상품 6개

## 목표

- Supabase 클라이언트로 `from("products").select("*")` 를 호출해 **DB에서 프론트로 데이터를 읽어 오는** 흐름을 이해한다.
- 받아온 배열을 `forEach` 로 돌며 카드를 만들어 그리드에 그리는 **목록 렌더링** 패턴을 익힌다.
- **anon(공개) 키**가 브라우저에 박혀 있어도 안전한 이유(= RLS 정책으로 SELECT만 허락, 쓰기는 막음)를 이해한다.

## 따라하는 단계

1. **Supabase 표·보안·예시 데이터를 만든다.**
   Supabase 대시보드 → **SQL Editor → New query** 에 이 폴더의 `schema.sql` **전체**를 붙여넣고 **[Run]** 한다.
   (표 `products` 생성 + RLS 켜기 + 읽기(SELECT) 정책 + 예시 상품 6개가 한 번에 만들어집니다.)
2. **내 프로젝트 값을 코드에 넣는다.**
   Supabase 대시보드 → **Settings(톱니바퀴) → API** 에서 값을 복사해 `script.js` 맨 위 두 줄의 **자리표시자**를 바꾼다.
   ```js
   const SUPABASE_URL = "https://여기에-내-프로젝트-ID.supabase.co";        // ← Project URL
   const SUPABASE_ANON_KEY = "sb_publishable_여기에-내-anon-공개키-붙여넣기"; // ← anon public 키
   ```
   ⚠️ **`service_role` / `sb_secret_...` 키는 절대 넣지 마세요.** 그 키는 RLS를 통째로 무시하는 마스터 키라, 브라우저에 두면 누구나 모든 데이터를 마음대로 다룰 수 있게 됩니다.
3. **`index.html`을 브라우저로 연다.** (더블클릭하면 됩니다.)
4. **상품 카드 6개가 그리드로 뜨면 성공.** "불러오는 중…" 안내가 잠깐 보였다가 상품 카드들로 바뀝니다.
5. **데이터를 바꿔 본다.** Supabase 대시보드 → **Table editor → `products`** 에서 상품을 추가하거나 가격을 고친 뒤, 페이지를 **새로고침** 하면 화면에 그대로 반영됩니다.

## 🤖 바이브코딩 프롬프트

이 실습(Supabase `products` 표를 읽어 상품 카드 그리드 그리기)을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 비전공자에게 친절한 웹 강사야. 정적 HTML/CSS/JS 한 세트(index.html, style.css, script.js)로
  "상품 목록 쇼핑몰" 화면을 만들어 줘.
  - 데이터는 Supabase 표(products: id, name, price, image_url, description, created_at)에서
    @supabase/supabase-js CDN으로 select 해서 가져온다.
  - SUPABASE_URL / SUPABASE_ANON_KEY 는 script.js 맨 위에 '자리표시자'로 두고, anon(공개) 키만 쓴다.
    service_role(sb_secret_...) 키는 절대 쓰지 말고, 왜 anon만 써야 하는지 주석으로 설명해 줘.
  - 받아온 상품 배열을 카드(사진·이름·설명·가격)로 만들어 그리드에 그린다.
  - 비전공자가 따라할 수 있게, 코드마다 "무엇을 하고 왜 그렇게 했는지" 한국어 주석을 달아 줘.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  방금 만든 상품 목록을 다음처럼 개선해 줘. 기존 코드는 최대한 유지하고 바뀐 부분만 알려 줘.
  1) 그리드를 반응형으로: 화면 너비에 따라 카드 열 개수가 자동으로 늘고 주게
     (grid-template-columns: repeat(auto-fill, minmax(...))).
  2) 데이터가 아직 안 왔을 때 "불러오는 중…", 0개일 때 "등록된 상품이 없어요" 안내를 보여 줘.
  3) 가격을 1,000원처럼 천 단위 콤마로 표시(toLocaleString).
  4) 최신 등록순으로 정렬(order created_at desc).
  각 변경마다 왜 그렇게 했는지 주석으로 한 줄씩 설명해 줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  상품 카드가 안 뜨고 콘솔(F12)에 이런 에러가 나와: (여기에 에러 메시지 그대로 붙여넣기)
  내 상황: schema.sql은 Supabase SQL Editor에서 실행했고, script.js에 anon 키를 넣었어.
  원인 후보를 가능성 높은 순서로 정리하고, 각 후보를 내가 직접 확인하는 방법을
  비전공자도 따라할 수 있게 단계별로 알려 줘. 코드를 고쳐야 하면 바뀐 부분만 보여 줘.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다.

## 검증법

- **목록 표시 성공:** `index.html` 을 열면 상품 카드 6개(이름·사진·설명·가격)가 그리드로 보이는가?
- **반응형 확인:** 브라우저 창 너비를 좁혔다 넓히면 카드 **열 개수가 자동으로** 줄고 느는가? (`auto-fill` + `minmax`)
- **DB 연동 확인:** Table editor 에서 상품 하나를 추가/수정한 뒤 페이지를 새로고침하면 화면이 바뀌는가? (= 화면이 DB에서 실시간으로 읽어 온다는 증거)
- **브라우저 개발자 도구 → Console**(윈도우 `F12`):
  - 성공: `✅ 상품 불러오기 성공: (배열)`
  - 실패: `❌ 상품 불러오기 실패: ...` (메시지로 원인 파악)
- **anon 키만 썼는지(중요):** `script.js`의 키가 **`sb_publishable_`(anon)** 로 시작하는가? **`sb_secret_`(service_role)** 가 **아닌가?**
- **쓰기 차단 확인(보안 핵심):** 콘솔에서
  `await supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY).from("products").insert({ name:"해킹", price:0 })`
  를 해보면 **`new row violates row-level security policy`** 에러가 난다. 즉 anon 키로는 **구경만 되고 가격 조작·상품 추가는 막힙니다.**
- **자주 나는 에러:**
  - `relation "public.products" does not exist` → 1단계 `schema.sql`을 안 돌림. SQL Editor에서 실행하세요.
  - 카드가 안 뜨고 "아직 등록된 상품이 없어요" → `schema.sql`의 **4단계(예시 데이터 INSERT)** 를 실행하세요.
  - `Invalid API key` → anon 키 오타. / `Failed to fetch` → `SUPABASE_URL` 철자·`https://` 확인.

## 관련 가이드

- [API가 뭔가 — 주방에 음식을 주문하는 창구](../../docs/02-web-basics/04.md) — 상품 목록 화면이 Supabase API에서 데이터를 받아 오는 일이라는 큰 그림
- [정적 사이트의 진실 — '프론트·백·DB' 비유 바로잡기](../../docs/02-web-basics/08.md) — 정적 페이지에 Supabase를 붙여 DB를 읽는다는 것의 의미
- [공개해도 되는 키 vs 절대 숨길 키 — anon/publishable vs service_role/secret](../../docs/04-security/01.md) — `script.js`에 어떤 키를 넣어야 안전한지
- [RLS(행 수준 보안) — 출입증을 공개해도 안전한 진짜 이유](../../docs/04-security/02.md) — SELECT만 허용하고 쓰기는 막는 정책의 원리
- [환경변수(.env) 제대로 — 무엇을 어디에, 무엇을 절대 커밋 안 하나](../../docs/04-security/03.md) — 비밀 키(service_role)는 어디에 둬야 하는가
- [실습 — 직접 따라 만들기](../../docs/practice/index.md)
