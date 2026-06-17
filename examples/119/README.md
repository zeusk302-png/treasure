# 실습 119 — RLS(행 수준 보안) 켜고 읽기/쓰기 정책 추가하기

실습 116~118까지는 표(`guestbook`)에 **RLS가 꺼져** 있어서, anon(공개) 키만으로도 읽기·쓰기가 그냥 됐습니다.
연습에는 편하지만, 그건 **"아무나 마음대로 읽고 쓰고 지울 수 있는"** 위험한 상태입니다.

이번 119에서는 표에 **RLS(행 수준 보안)** 를 켜고, **읽기 정책**과 **쓰기 정책**을 직접 추가합니다.
중간에 일부러 "정책 없는 상태"를 만들어서, **정책이 없으면 데이터가 안 보이고(빈 목록) 글쓰기가 막히는** 것을 눈으로 확인하는 것이 핵심입니다.

> 비유: RLS는 표(서버 창고)에 **자물쇠**를 거는 일입니다.
> 자물쇠만 걸고 열쇠(정책)를 안 주면 아무도 못 들어갑니다(빈 목록 / 막힌 쓰기).
> "누구나 읽기 OK", "누구나 글쓰기 OK"라는 **열쇠 두 개(정책)** 를 주면 다시 정상 동작합니다.

이 폴더에 있는 파일:

- `README.md` — 이 안내문 (아래 **## 정책 설명 메모**에 정책 한 줄 한 줄 해설 포함)
- `schema.sql` — **핵심.** RLS 켜기(1단계) + 읽기 정책(2단계) + 쓰기 정책(3단계) SQL
- `index.html` — 글 입력 폼 + 목록 화면 (동작은 118과 동일)
- `script.js` — anon 키로 select/insert. RLS가 막을 때 어떤 결과가 오는지 보여 주는 안내 포함

## 목표

- 표에 **RLS를 켜면** 기본이 '전부 거절'이라, **정책이 없으면 읽기는 빈 목록 `[]`, 쓰기는 에러**가 됨을 체험한다.
- **읽기 정책(`for select ... using (true)`)** 과 **쓰기 정책(`for insert ... with check (true)`)** 의 문법과 차이를 이해한다.
- **anon(공개) 키와 service_role(비밀) 키의 차이**, 그리고 **RLS를 켜야 비로소 anon 키 공개가 안전해지는 이유**를 이해한다.

## 따라하는 단계

1. **표가 준비됐는지 확인한다.** 116~118에서 `guestbook` 표를 이미 만들었다면 그대로 씁니다.
   (없으면 이 폴더 `schema.sql` 맨 위의 `create table ...`이 알아서 만들어 줍니다.)
2. `script.js`의 맨 위 두 줄 **자리표시자**를 내 **anon(공개) 키** 값으로 바꾼다.
   Supabase 대시보드 → **Settings(톱니바퀴) → API** 에서 복사합니다.
   ```js
   const SUPABASE_URL = "https://여기에-내-프로젝트-ID.supabase.co";        // ← Project URL
   const SUPABASE_ANON_KEY = "sb_publishable_여기에-내-anon-공개키-붙여넣기"; // ← anon public 키
   ```
   ⚠️ **`service_role` / `sb_secret_...` 키는 절대 넣지 마세요.** 그 키는 RLS를 통째로 무시하는 마스터 키라, 이 실습의 보안 효과가 전부 사라집니다.
3. `index.html`을 **브라우저로 열어** 지금(RLS 꺼짐) 글이 잘 보이는지 확인한다.
4. **(중요한 실험) 정책 없이 RLS만 켜 보기.**
   Supabase 대시보드 → **SQL Editor → New query** 에 이 폴더 `schema.sql`에서 **1단계 한 줄만** 붙여 실행한다.
   ```sql
   alter table public.guestbook enable row level security;
   ```
   → 방명록을 **새로고침**하면 글이 분명 있는데도 **목록이 텅 비고**, 글을 남기면 **빨간 에러**(row-level security policy)가 뜹니다. 이게 "정책이 없으면 막힌다"입니다.
5. **읽기/쓰기 정책을 추가한다.** 이제 `schema.sql` **전체**를 SQL Editor에 붙여넣고 **[Run]** 한다.
   (1단계는 다시 실행돼도 안전하고, 2·3단계가 정책을 추가합니다.)
6. 방명록을 **다시 새로고침**한다.
   → 목록이 **다시 보이고**, 이름·메시지를 입력해 **[남기기]** 하면 새로고침 없이 글이 **맨 위에** 나타나면 성공입니다.
7. (확인) Supabase 대시보드 → **Authentication → Policies** (또는 Table editor의 표 → RLS) 에서
   방금 만든 정책 두 개(`anyone can read guestbook`, `anyone can insert guestbook`)가 보이는지 확인한다.

## 검증법

- **정책 없이 RLS만 켰을 때(4단계):** 목록이 **비고**, 글쓰기 시 콘솔에 `new row violates row-level security policy` 에러가 뜨는가?
- **정책 추가 후(5단계):** 목록이 **다시 보이고**, 글쓰기가 **성공**하며 맨 위에 즉시 나타나는가?
- 브라우저 **개발자 도구 → Console**(윈도우 `F12`)에서:
  - 읽기 막힘 상태: `✅ 불러오기 성공! 글 0개` (에러가 아니라 **빈 배열**이 온 것)
  - 쓰기 막힘 상태: `❌ 저장 실패: ... row-level security policy ...`
- **anon 키만 썼는지(중요):** `script.js`의 키가 **`sb_publishable_`(anon)** 로 시작하는가? **`sb_secret_`(service_role)** 가 **아닌가?**
  (만약 service_role을 넣으면 RLS를 우회해서 정책과 무관하게 다 되는데, 그건 위험한 잘못된 설정입니다.)
- **자주 나는 다른 에러:**
  - `relation "public.guestbook" does not exist` → 표가 없음. `schema.sql` 위쪽 `create table`을 실행.
  - `Invalid API key` → anon 키 오타. / 주소 오류·`Failed to fetch` → `SUPABASE_URL` 철자·`https://` 확인.

## 정책 설명 메모 (deliverable: "정책 설명 메모")

`schema.sql`에 넣은 SQL을 한 줄씩 풀어 쓴 메모입니다.

**1단계 — RLS 켜기**
```sql
alter table public.guestbook enable row level security;
```
- 표의 **줄(row) 하나하나마다 출입 통제**를 켭니다. 켜는 순간 기본값은 **'전부 거절'**.
- 허락(정책)이 0개면: 읽기(select)는 **에러가 아니라 빈 배열 `[]`**, 쓰기(insert)는 **에러로 거절**.

**2단계 — 읽기 정책**
```sql
create policy "anyone can read guestbook"
  on public.guestbook
  for select          -- '읽기' 동작에만 적용
  to anon, authenticated  -- 비로그인 손님(anon) + 로그인 사용자 모두
  using (true);       -- '어떤 줄을 보여줄까'의 조건. true = 전부 공개
```
- `using` 은 **읽기/삭제에서 '어떤 기존 줄을 대상으로 할지'** 거르는 조건입니다.

**3단계 — 쓰기 정책**
```sql
create policy "anyone can insert guestbook"
  on public.guestbook
  for insert          -- '쓰기' 동작에만 적용
  to anon, authenticated
  with check (true);  -- '들어오려는 새 줄'을 검사하는 조건. true = 전부 허용
```
- `insert`/`update` 는 `using` 대신 **`with check`** 를 씁니다. **새로 들어오는 줄**이 통과 조건을 만족해야 합니다.

**수정/삭제는 일부러 안 열었습니다.**
- 정책이 없는 동작은 자동으로 막힙니다(기본 거절). 그래서 지금 방명록은 **"누구나 읽기·새 글 쓰기는 되지만, 남의 글 수정·삭제는 아무도 못 하는"** 안전한 상태입니다.

**anon(공개) vs service_role(비밀) — 핵심 한 문장**
- **anon 키(`sb_publishable_...`)**: 화면·코드·깃허브에 **공개해도 되는 출입증**. RLS 정책의 통제를 **그대로 받기 때문에** 공개해도 안전합니다.
- **service_role 키(`sb_secret_...`)**: RLS를 **통째로 우회**하는 마스터 키. **절대 공개 금지**, 서버에서만 비밀로 사용.
- 즉 **"RLS를 켜고 정책을 달았기 때문에"** 비로소 anon 키를 공개해도 안전해지는 것입니다.

## 다음 단계

- 직전 단계: 등록 즉시 목록 갱신(async/await) → [실습 118](../118/)
- 글 목록 select로 그리기 → [실습 117](../117/) / 글 1건 insert → [실습 116](../116/)
- 완성형 예제: → [실습 03 — Supabase 방명록](../03-supabase-guestbook/)

## 관련 가이드

- [RLS(행 수준 보안) — 출입증을 공개해도 안전한 진짜 이유](../../docs/04-security/02.md) — 이번 실습의 핵심 개념. 정책 없으면 빈 목록/막힌 쓰기가 되는 이유
- [공개해도 되는 키 vs 절대 숨길 키 — anon/publishable vs service_role/secret](../../docs/04-security/01.md) — script.js에 어떤 키를 넣어야 안전한지
- [환경변수(.env) 제대로 — 무엇을 어디에, 무엇을 절대 커밋 안 하나](../../docs/04-security/03.md) — 비밀 키(service_role)는 어디에 둬야 하는가
- [실습 — 직접 따라 만들기](../../docs/practice/index.md)
