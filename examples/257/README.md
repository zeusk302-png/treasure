# 실습 257 — 예약 취소 링크로 고객이 스스로 예약을 DELETE 하게 하기

예약 확정 메일 속 **취소 링크**(예: `cancel.html?token=아주-긴-무작위-문자열`)를 누르면,
로그인 없이도 **본인 예약 한 줄만** 화면(JS)에서 지우게 만드는 미니 결과물입니다.
"누구나 가진 공개 키로도, **추측 불가능한 비밀 토큰**을 아는 사람만 본인 것을 지운다"는
**토큰 기반 식별 + 삭제(DELETE)** 패턴을 한 번에 체험하는 것이 목표입니다.

> 비유: 옷가게 보관함 같습니다. 보관함 번호가 `1, 2, 3…`이면 남이 차례로 열어볼 수 있죠.
> 그래서 번호 대신 **아무도 못 알아맞히는 비밀 번호표(토큰)**를 손님에게만 줍니다.
> 그 번호표를 가진 사람만 **자기 칸 딱 하나**를 비울 수 있습니다.

이 폴더에 있는 파일:

- `README.md` — 이 안내문
- `schema.sql` — **핵심.** 예약 표에 `cancel_token`(취소 토큰) 칸 추가 + RLS 켜기 + 삭제·읽기 정책 + **토큰 칸만 못 읽게 막기(목록 캐기 차단)** + 테스트용 샘플 예약 1건

> 참고: 손님이 실제로 누르는 **취소 페이지(`cancel.html` + 취소용 `script.js`)**는
> 실습 255의 `index.html`/`script.js`를 본떠 직접 만듭니다(아래 '따라하는 단계' 3번).

## 목표

- 예약마다 `gen_random_uuid()`로 **추측 불가능한 토큰(UUID)**을 자동 부여하는 이유를 이해한다 — `id`(1, 2, 3…)는 순번 추측 공격에 뚫리기 때문.
- `from("reservations").delete().eq("cancel_token", 토큰)`으로 **토큰과 딱 맞는 한 줄만** 삭제하는 법을 익힌다.
- RLS(행 수준 보안)에서 **삭제는 허용하되**, `cancel_token` **칸의 읽기 권한을 회수**해 "남의 토큰을 긁어가지 못하게" 막는 칼럼 단위 보안을 이해한다.
- **anon(공개) 키**가 브라우저에 박혀 있어도 안전한 경계와, "추측 공격까지 100% 막으려면 서버(`service_role`)가 필요하다"는 한계를 함께 이해한다.

## 따라하는 단계

1. **Supabase 표·보안·토큰을 만든다.**
   Supabase 대시보드 → **SQL Editor → New query** 에 이 폴더의 `schema.sql` **전체**를 붙여넣고 **[Run]** 한다.
   (`cancel_token` 칸 추가 + RLS 켜기 + 삭제/읽기 정책 + **토큰 칸 읽기 차단** + 테스트용 샘플 예약 1건이 한 번에 만들어집니다.)
2. **테스트용 토큰을 확인한다.**
   `schema.sql` 5단계가 넣어 준 샘플 예약의 고정 토큰은 **`00000000-0000-4000-8000-000000000257`** 입니다.
   이 토큰을 취소 링크에 붙여 동작을 시험합니다.
3. **취소 페이지를 만든다.** (실습 255의 `script.js`를 본떠 만들면 쉽습니다.)
   - 주소창의 토큰을 읽는다: `const token = new URLSearchParams(location.search).get("token");`
   - 지우기 전에 확인 화면을 보여 준다: `from("reservations").select("name, slot_date, slot_time").eq("cancel_token", token)`
   - [예약 취소] 버튼을 누르면 삭제한다: `from("reservations").delete().eq("cancel_token", token)`
   - `script.js` 맨 위 두 줄의 자리표시자에 내 **Project URL**과 **anon(`sb_publishable_…`) 키**를 넣는다.
     ⚠️ **`service_role` / `sb_secret_…` 키는 절대 넣지 마세요.** RLS를 통째로 무시하는 마스터 키라 누구나 모든 예약을 지울 수 있게 됩니다.
4. **취소 링크를 연다.** 브라우저 주소창에 `cancel.html?token=00000000-0000-4000-8000-000000000257` 형태로 토큰을 붙여 연다.
5. **확인 화면을 본다.** "샘플 예약자 / 2026-06-20 / 10:00 예약을 취소할까요?" 같은 내용이 떠야 한다.
6. **[예약 취소]를 누른다.** "취소 완료" 메시지가 뜨고, 그 예약이 표에서 사라진다.

## 🤖 바이브코딩 프롬프트

이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다. (Project URL·키는 본인 것으로 바꿔 넣으세요.)

- **1단계(뼈대 만들기)** — 취소용 SQL부터:

  ```text
  너는 Supabase + 정적 HTML로 '예약 취소 링크' 미니 결과물을 만드는 조력자야.
  비전공자가 읽을 수 있게 한국어 주석을 충분히 달아 줘.

  먼저 SQL을 만들어 줘. 목표:
  - public.reservations 표에 추측 불가능한 취소 토큰 칸(cancel_token uuid,
    기본값 gen_random_uuid())을 추가한다. (이미 표가 있을 수 있으니
    add column if not exists 로 안전하게.)
  - RLS(행 수준 보안)를 켠다.
  - anon 역할에게 DELETE 와 SELECT 는 허용한다.
  - 단, cancel_token 칸의 SELECT 권한만 revoke 해서 '토큰 목록 캐기'를 막는다.
  - 테스트용 샘플 예약 1줄을 외우기 쉬운 고정 토큰으로 넣어 준다.

  제약: id(1,2,3…)는 추측당하니 식별은 반드시 토큰으로. 왜 토큰을 쓰는지,
  왜 토큰 칸만 못 읽게 막는지 SQL 주석으로 설명해 줘.
  ```

- **2단계(기능 추가/개선)** — 손님이 누르는 취소 페이지:

  ```text
  이제 cancel.html 과 script.js 를 만들어 줘. 동작:
  1) 주소창의 토큰을 읽는다:
     new URLSearchParams(location.search).get("token")
  2) 지우기 전에 확인 화면을 보여 준다:
     from("reservations").select("name, slot_date, slot_time")
       .eq("cancel_token", token)
     (cancel_token 칸은 못 읽으니 select 목록에 넣지 마.)
  3) [예약 취소] 버튼을 누르면:
     from("reservations").delete().eq("cancel_token", token)
  4) 토큰이 안 맞으면 '예약을 찾을 수 없음', 성공하면 '취소 완료'를 보여 준다.

  보안 제약(중요): script.js 맨 위 키는 anon(sb_publishable_…) 키만 쓰고,
  service_role(sb_secret_…) 키는 절대 넣지 마. 그 이유도 주석으로 남겨 줘.
  사용자 이름 등은 textContent 로 출력해서 XSS를 막아 줘.
  ```

- **막혔을 때(디버깅)** — 에러를 그대로 붙여넣고 진단 요청:

  ```text
  취소가 동작하지 않아. 아래 증상/에러를 보고 원인을 단계별로 짚어 줘.
  - 증상: (예: 토큰을 넣었는데 확인 화면이 비어 있음 / "취소 완료"는 뜨는데
    Table editor 에서 줄이 안 지워짐 / Console 에 빨간 에러)
  - 콘솔 에러 원문: (F12 → Console 의 빨간 줄을 그대로 붙여넣기)
  - 내 토큰: 00000000-0000-4000-8000-000000000257

  점검 순서를 제안해 줘: schema.sql 을 실제로 Run 했는지, 주소의 ?token=…
  대시(-) 철자, SUPABASE_URL/anon 키 오타, RLS 정책이 delete/select 둘 다
  걸렸는지, cancel_token revoke 가 됐는지. 고친 코드는 무엇을 왜 바꿨는지 알려 줘.
  ```

> 프롬프트 팁: "코드만 주지 말고 **왜 그렇게 했는지 주석으로 설명**해 줘", "비전공자가 이해하게 한 줄씩 풀어 줘"를 덧붙이면 학습에 훨씬 좋습니다.

## 검증법

- **취소 성공:** 올바른 토큰으로 [예약 취소]를 누르면 "취소 완료" 메시지가 뜨는가? Supabase **Table editor → reservations** 에서 그 줄이 **사라졌는가?**
- **본인 것만 삭제(핵심):** 삭제 후에도 **다른 예약 줄은 그대로** 남아 있는가? (`.eq("cancel_token", …)`가 딱 한 줄만 지정하므로 한 줄만 지워져야 한다.)
- **토큰 칸 숨김(핵심 보안):** 브라우저 개발자 도구(`F12`) → **Console** 에서
  ```js
  await supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
    .from("reservations").select("*")
  ```
  를 실행하면, 결과 줄에 다른 칸은 보여도 **`cancel_token` 값은 나오지 않아야** 한다(= 목록 캐기 차단).
- **잘못된 토큰:** 주소의 토큰을 아무 값(`?token=틀린값`)으로 바꾸면 확인 화면이 **'예약을 찾을 수 없음'**으로 떠야 하고, 삭제해도 아무 줄도 지워지지 않는다.
- **anon 키만 썼는지(중요):** `script.js`의 키가 **`sb_publishable_`(anon)** 로 시작하는가? **`sb_secret_`(service_role)** 가 **아닌가?**
- **자주 나는 에러:**
  - `relation "public.reservations" does not exist` → 1단계 `schema.sql`을 안 돌림. SQL Editor에서 실행하세요.
  - 토큰을 줬는데도 확인 화면이 비어 있음 → 주소의 `?token=…` 철자/대시(-) 확인, 5단계 샘플을 넣었는지 확인.
  - `Invalid API key` → anon 키 오타. / `Failed to fetch` → `SUPABASE_URL` 철자·`https://` 확인.

## 관련 가이드

- [실습 255 — 예약을 Supabase에 저장하고 찬 시간대 막기](../255/) — 이 실습이 이어 쓰는 `reservations` 표를 만든 이전 단계
- [API가 뭔가 — 주방에 음식을 주문하는 창구](../../docs/02-web-basics/04.md) — 취소 요청을 '주문서'처럼 보내 한 줄을 지운다는 큰 그림
- [정적 사이트의 진실 — '프론트·백·DB' 비유 바로잡기](../../docs/02-web-basics/08.md) — 정적 페이지 한 장이 DB와 대화해 동적으로 바뀌는 원리
- [공개해도 되는 키 vs 절대 숨길 키 — anon/publishable vs service_role/secret](../../docs/04-security/01.md) — `script.js`에 어떤 키를 넣어야 안전한지
- [RLS(행 수준 보안) — 출입증을 공개해도 안전한 진짜 이유](../../docs/04-security/02.md) — 삭제는 허용하되 토큰 칸 읽기를 막는 정책의 원리
- [환경변수(.env) 제대로 — 무엇을 어디에, 무엇을 절대 커밋 안 하나](../../docs/04-security/03.md) — 비밀 키(service_role)는 서버에만 둬야 하는 이유
- [실습 — 직접 따라 만들기](../../docs/practice/index.md)
