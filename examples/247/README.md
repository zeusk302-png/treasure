# 실습 247 — 랜딩페이지 뉴스레터 구독 폼으로 이메일을 Supabase에 저장하기

랜딩페이지에 흔히 있는 "이메일 남기고 구독하기" 폼을 직접 만들어 봅니다.
입력한 이메일을 **Supabase 표(`subscribers`)에 한 줄 추가(INSERT)** 해서,
**브라우저(프론트) → 데이터베이스(DB)로 데이터를 쓰는 흐름**을 한 번에 체험하는 것이 목표입니다.

> 비유: 구독 폼은 가게 앞 **'방명록 함'** 입니다.
> 손님(브라우저)은 이메일 쪽지를 **넣을 수만** 있고(INSERT),
> 함 안의 다른 쪽지를 **꺼내 읽지는 못합니다**(SELECT 막힘).
> 함을 통째로 여는 마스터 열쇠(`service_role`)는 주인(서버)만 가집니다.

이 폴더에 있는 파일:

- `README.md` — 이 안내문
- `index.html` — 한 화면짜리 미니 랜딩페이지 + 이메일 구독 폼
- `script.js` — anon(공개) 키로 `subscribers` 표에 `insert` 하는 코드
- `schema.sql` — **핵심.** 표 만들기 + RLS 켜기 + "구독(INSERT)만 허용" 정책

## 목표

- Supabase 클라이언트로 `from("subscribers").insert({ email })` 를 호출해 **프론트에서 DB로 데이터를 쓰는** 흐름을 이해한다.
- **anon(공개) 키**가 브라우저에 박혀 있어도 안전한 이유(= RLS 정책으로 INSERT만 허락)를 이해한다.
- 이메일은 개인정보이므로 **읽기(SELECT)는 일부러 막아** 목록이 새어 나가지 않게 하는 설계를 익힌다.

## 따라하는 단계

1. **Supabase 표와 보안을 만든다.**
   Supabase 대시보드 → **SQL Editor → New query** 에 이 폴더의 `schema.sql` **전체**를 붙여넣고 **[Run]** 한다.
   (표 `subscribers` 생성 + RLS 켜기 + 구독 INSERT 정책이 한 번에 만들어집니다.)
2. **내 프로젝트 값을 코드에 넣는다.**
   Supabase 대시보드 → **Settings(톱니바퀴) → API** 에서 값을 복사해 `script.js` 맨 위 두 줄의 **자리표시자**를 바꾼다.
   ```js
   const SUPABASE_URL = "https://여기에-내-프로젝트-ID.supabase.co";        // ← Project URL
   const SUPABASE_ANON_KEY = "sb_publishable_여기에-내-anon-공개키-붙여넣기"; // ← anon public 키
   ```
   ⚠️ **`service_role` / `sb_secret_...` 키는 절대 넣지 마세요.** 그 키는 RLS를 통째로 무시하는 마스터 키라, 브라우저에 두면 누구나 모든 데이터를 마음대로 다룰 수 있게 됩니다.
3. **`index.html`을 브라우저로 연다.** (더블클릭하면 됩니다.)
4. **이메일을 입력하고 [무료로 구독하기]** 를 누른다. "구독 완료!" 초록 메시지가 뜨면 성공.
5. **DB에 저장됐는지 확인한다.** Supabase 대시보드 → **Table editor → `subscribers`** 표를 열어 방금 넣은 이메일이 한 줄 들어와 있으면 끝.

## 검증법

- **저장 성공:** 폼 제출 후 "✅ 구독 완료!" 메시지가 뜨고, Supabase **Table editor → `subscribers`** 에 이메일이 새 줄로 보이는가?
- **중복 막힘:** 같은 이메일을 한 번 더 넣으면 "이미 구독된 이메일이에요" 메시지가 뜨는가? (표의 `email unique` + JS 에러 안내)
- **브라우저 개발자 도구 → Console**(윈도우 `F12`):
  - 성공: `✅ 구독 저장 성공: you@example.com`
  - 실패: `❌ 구독 저장 실패: ...` (메시지로 원인 파악)
- **anon 키만 썼는지(중요):** `script.js`의 키가 **`sb_publishable_`(anon)** 로 시작하는가? **`sb_secret_`(service_role)** 가 **아닌가?**
- **읽기 차단 확인(보안 핵심):** 콘솔에서 `await supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY).from("subscribers").select("*")` 를 해보면 **빈 배열 `[]`** 이 돌아온다(읽기 정책을 안 만들었기 때문). 즉 anon 키로는 남의 이메일을 못 봅니다.
- **자주 나는 에러:**
  - `relation "public.subscribers" does not exist` → 1단계 `schema.sql`을 안 돌림. SQL Editor에서 실행하세요.
  - `new row violates row-level security policy` → RLS만 켜고 INSERT 정책을 안 만든 상태. `schema.sql`의 3단계 정책을 실행하세요.
  - `Invalid API key` → anon 키 오타. / `Failed to fetch` → `SUPABASE_URL` 철자·`https://` 확인.

## 관련 가이드

- [API가 뭔가 — 주방에 음식을 주문하는 창구](../../docs/02-web-basics/04.md) — 구독 폼이 Supabase API를 부르는 일이라는 큰 그림
- [정적 사이트의 진실 — '프론트·백·DB' 비유 바로잡기](../../docs/02-web-basics/08.md) — 정적 페이지에 Supabase를 붙인다는 것의 의미
- [공개해도 되는 키 vs 절대 숨길 키 — anon/publishable vs service_role/secret](../../docs/04-security/01.md) — `script.js`에 어떤 키를 넣어야 안전한지
- [RLS(행 수준 보안) — 출입증을 공개해도 안전한 진짜 이유](../../docs/04-security/02.md) — INSERT만 허용하고 SELECT는 막는 정책의 원리
- [환경변수(.env) 제대로 — 무엇을 어디에, 무엇을 절대 커밋 안 하나](../../docs/04-security/03.md) — 비밀 키(service_role)는 어디에 둬야 하는가
- [실습 — 직접 따라 만들기](../../docs/practice/index.md)
