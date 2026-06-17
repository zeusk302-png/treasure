# 실습 251 — 상품 상세 페이지를 URL 쿼리 파라미터(`?id=`)로 동적 표시하기

쇼핑몰에서 상품 목록의 카드를 누르면 넘어가는 화면, **상품 상세 페이지**를 만들어 봅니다.
한 페이지(`index.html`)를 그대로 두고, **주소창 끝의 `?id=값`만 바꿔** 서로 다른 상품을 보여 주는
**'동적 페이지(dynamic page)' 패턴**을 한 번에 체험하는 것이 목표입니다.

> 비유: 식당의 메뉴판은 **한 장(`index.html`)** 인데, 손님이 가리키는 **번호표(`?id=`)** 에 따라
> 주방(`Supabase`)에서 **그 번호의 음식 하나**만 꺼내 와 보여 주는 셈입니다.
> 페이지는 새로 안 만들고, **번호만 바꿔** 다른 상품을 띄웁니다.

이 폴더에 있는 파일:

- `README.md` — 이 안내문
- `index.html` — 상품 한 개를 크게 보여 줄 상세 화면 (처음엔 비어 있다가 JS가 채움)
- `style.css` — 큰 사진 + 이름·가격·설명으로 이루어진 상세 카드 디자인
- `script.js` — **핵심.** 주소창에서 `?id=`를 읽고, 그 id 한 줄만 `select`해서 화면에 채우는 코드
- `schema.sql` — 표 만들기 + RLS 켜기 + "읽기(SELECT)만 허용" 정책 + 예시 상품 6개

## 목표

- 주소창의 `?id=2` 같은 **URL 쿼리 파라미터**를 `URLSearchParams(location.search).get("id")`로 읽어 오는 법을 익힌다.
- 그 id를 이용해 `from("products").select("*").eq("id", id).single()`로 **상품 '한 개'만 콕 집어 조회**하는 패턴을 이해한다.
- 같은 `index.html` 한 장이 **`?id=` 값에 따라 다른 내용으로 바뀌는** 동적 페이지의 원리를 체감한다.
- **anon(공개) 키**가 브라우저에 박혀 있어도 안전한 이유(= RLS로 SELECT만 허락, 쓰기는 막음)를 다시 확인한다.

## 따라하는 단계

1. **Supabase 표·보안·예시 데이터를 만든다.**
   Supabase 대시보드 → **SQL Editor → New query** 에 이 폴더의 `schema.sql` **전체**를 붙여넣고 **[Run]** 한다.
   (표 `products` 생성 + RLS 켜기 + 읽기(SELECT) 정책 + 예시 상품 6개가 한 번에 만들어집니다.)
2. **상품들의 id 값을 확인한다.**
   SQL Editor에서 `select id, name from public.products order by id;` 를 실행해 어떤 `id`가 있는지 본다.
   (보통 `1, 2, 3 …` 으로 들어갑니다. 이 번호를 주소창의 `?id=`에 넣을 겁니다.)
3. **내 프로젝트 값을 코드에 넣는다.**
   Supabase 대시보드 → **Settings(톱니바퀴) → API** 에서 값을 복사해 `script.js` 맨 위 두 줄의 **자리표시자**를 바꾼다.
   ```js
   const SUPABASE_URL = "https://여기에-내-프로젝트-ID.supabase.co";        // ← Project URL
   const SUPABASE_ANON_KEY = "sb_publishable_여기에-내-anon-공개키-붙여넣기"; // ← anon public 키
   ```
   ⚠️ **`service_role` / `sb_secret_...` 키는 절대 넣지 마세요.** 그 키는 RLS를 통째로 무시하는 마스터 키라, 브라우저에 두면 누구나 모든 데이터를 마음대로 다룰 수 있게 됩니다.
4. **주소 끝에 `?id=`를 붙여서 연다.**
   `index.html`을 그냥 더블클릭하면 id가 없어 안내 메시지만 보입니다.
   브라우저 주소창에서 주소 **끝에 `?id=1`** 을 붙여 보세요. 예: `.../251/index.html?id=1`
5. **id가 다른 상품으로 바뀐다.**
   주소창의 숫자만 `?id=2`, `?id=3` … 으로 바꾸고 **Enter**(또는 새로고침)를 누르면,
   같은 페이지가 **다른 상품**으로 바뀌는 것을 확인한다. (= 동적 페이지)

## 검증법

- **상세 표시 성공:** 주소 끝에 `?id=1`을 붙여 열면 사진·이름·가격·설명이 채워진 상세 카드가 보이는가?
- **동적으로 바뀌는지(핵심):** 주소창 숫자를 `?id=2`, `?id=3`으로 바꾸면 **같은 페이지인데 내용이 바뀌는가?** (탭 제목도 상품명으로 바뀝니다.)
- **id 없을 때:** `?id=` 없이 그냥 `index.html`만 열면 "주소 끝에 `?id=1` 처럼 …" 안내가 나오는가?
- **없는 id일 때:** `?id=99999`처럼 없는 번호를 넣으면 "id=99999 인 상품이 없어요 …" 안내가 나오는가? (`.single()`이 0줄이면 에러를 내는 동작 확인)
- **브라우저 개발자 도구 → Console**(윈도우 `F12`):
  - 성공: `✅ 상품 불러오기 성공: {id: 1, name: …}` (배열이 아니라 **객체 하나**가 옵니다 = `.single()` 효과)
  - 실패: `❌ 상품 불러오기 실패: …` (메시지로 원인 파악)
- **anon 키만 썼는지(중요):** `script.js`의 키가 **`sb_publishable_`(anon)** 로 시작하는가? **`sb_secret_`(service_role)** 가 **아닌가?**
- **쓰기 차단 확인(보안 핵심):** 콘솔에서
  `await supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY).from("products").update({ price: 0 }).eq("id", 1)`
  를 해보면 줄이 바뀌지 않는다(정책이 없어 막힘). 즉 anon 키로는 **구경만 되고 가격 조작은 막힙니다.**
- **자주 나는 에러:**
  - `relation "public.products" does not exist` → 1단계 `schema.sql`을 안 돌림. SQL Editor에서 실행하세요.
  - "id=… 인 상품이 없어요" → 주소창 `?id=` 번호가 표에 없는 값. 2단계에서 확인한 진짜 id를 넣으세요.
  - `Invalid API key` → anon 키 오타. / `Failed to fetch` → `SUPABASE_URL` 철자·`https://` 확인.

## 관련 가이드

- [실습 249 — 상품 목록 페이지](../249/) — 이 상세 페이지의 '앞 화면'. 목록 카드에서 `?id=`로 이 페이지로 넘어옵니다.
- [API가 뭔가 — 주방에 음식을 주문하는 창구](../../docs/02-web-basics/04.md) — `?id=`를 주문서처럼 보내 상품 하나를 받아 온다는 큰 그림
- [정적 사이트의 진실 — '프론트·백·DB' 비유 바로잡기](../../docs/02-web-basics/08.md) — 정적 페이지 한 장이 `?id=`로 동적으로 바뀌는 원리
- [공개해도 되는 키 vs 절대 숨길 키 — anon/publishable vs service_role/secret](../../docs/04-security/01.md) — `script.js`에 어떤 키를 넣어야 안전한지
- [RLS(행 수준 보안) — 출입증을 공개해도 안전한 진짜 이유](../../docs/04-security/02.md) — SELECT만 허용하고 쓰기는 막는 정책의 원리
- [환경변수(.env) 제대로 — 무엇을 어디에, 무엇을 절대 커밋 안 하나](../../docs/04-security/03.md) — 비밀 키(service_role)는 어디에 둬야 하는가
- [실습 — 직접 따라 만들기](../../docs/practice/index.md)
