# 실습 126 — 각 글에 좋아요 버튼 달고 RPC로 카운트 안전하게 +1 하기

123번 방명록까지는 글을 **추가(insert)** 하고 **목록(select)** 으로 보는 것까지 했습니다.
이번 126번에서는 각 글에 **좋아요 버튼**을 달고, 누르면 그 글의 `likes`(좋아요 수)를 1 올립니다.

핵심은 **좋아요 +1 을 어떻게 안전하게 하느냐** 입니다.

> **왜 그냥 update 로 +1 하면 안 되나요?**
> "지금 좋아요 수를 읽어 와서(예: 3) → 자바스크립트에서 +1 → 4로 update" 방식은,
> 두 사람이 **동시에** 누르면 둘 다 3을 읽어 둘 다 4로 덮어씁니다. **5가 돼야 하는데 4** 가 되죠.
> 이런 문제를 **경쟁 상태(race condition)** 라고 합니다. 좋아요 한 번이 슬쩍 사라지는 겁니다.
>
> **해결책:** 더하기 계산을 **서버 안에서 한 번에** 시키는 함수(`increment_likes`)를 만들고,
> 자바스크립트는 그 함수를 **`supabase.rpc()` 로 호출만** 합니다.
> 그러면 동시에 눌러도 좋아요가 정확히 +1씩 쌓입니다.

| 하는 일 | 위험한 방식 (직접 update) | 이번 실습 (RPC) |
| --- | --- | --- |
| 좋아요 +1 | `select` 로 현재값 읽기 → JS에서 +1 → `update` | `db.rpc("increment_likes", { post_id })` |
| 동시에 두 명이 누르면 | 한 번이 사라질 수 있음(경쟁 상태) | 서버가 한 번에 처리 → 안전 |

이 폴더에 있는 파일:

- `README.md` — 이 안내문
- `schema.sql` — **먼저 실행.** `posts` 표(+`likes` 컬럼) 만들기 + RLS·정책 + `increment_likes` 함수 + 예시 글
- `index.html` — 글 목록 + 각 글 옆 좋아요 버튼 화면
- `script.js` — `select`(목록) / `rpc`(좋아요 +1) 코드. RPC가 무엇이고 왜 쓰는지 주석으로 설명

## 목표

- 표에 `likes` 컬럼을 두고, 화면에서 각 글의 현재 좋아요 수를 보여 준다.
- 좋아요 +1 을 **`update` 가 아니라 `supabase.rpc()` (서버 함수 호출)** 로 처리해, **동시성에 안전한 카운트 증가**를 경험한다.
- 서버 함수 안에서 `set likes = likes + 1` 한 줄이 **경쟁 상태를 어떻게 막는지** 이해한다.
- **anon(공개) 키만** 코드에 넣고, **service_role(비밀) 키는 절대 넣지 않는** 보안 원칙을 지킨다.

## 따라하는 단계

1. **`schema.sql`로 서버에 표·정책·함수를 만든다.**
   Supabase 대시보드 → **SQL Editor → New query** 에 이 폴더의 `schema.sql` **전체**를 붙여넣고 **[Run]** 합니다.
   → `posts` 표(컬럼: `id`, `content`, `likes`, `created_at`)가 생기고, RLS·읽기/쓰기 정책이 추가되며,
   `increment_likes` 함수와 예시 글 3개가 만들어집니다.
2. `script.js` 맨 위 두 줄 **자리표시자**를 내 **anon(공개) 키** 값으로 바꾼다.
   Supabase 대시보드 → **Settings(톱니바퀴) → API** 에서 복사합니다.
   ```js
   const SUPABASE_URL = "https://여기에-내-프로젝트-ID.supabase.co";        // ← Project URL
   const SUPABASE_ANON_KEY = "sb_publishable_여기에-내-anon-공개키-붙여넣기"; // ← anon public 키
   ```
   ⚠️ **`service_role` / `sb_secret_...` 키는 절대 넣지 마세요.** RLS를 통째로 무시하는 마스터 키라, 브라우저에 노출하면 누구나 데이터를 마음대로 다룰 수 있게 됩니다.
3. `index.html`을 **브라우저로 열기** 전, 개발자 도구(`F12`) → **Console** 탭을 켜 둔다. (성공/실패 로그가 여기 찍힙니다.)
4. `index.html`을 **더블클릭해서 열고**, 예시 글 3개와 각 글 옆의 `❤️ 0` 버튼이 보이는지 확인한다.
5. 아무 글의 **`❤️` 버튼을 누른다.** → 숫자가 `0 → 1 → 2 …` 로 올라가고, Console에 `❤️ 좋아요 성공! …` 로그가 찍히면 성공입니다.
6. **RPC가 진짜 서버에 반영됐는지 확인:** 페이지를 **새로고침(F5)** 한다.
   → 누른 만큼의 좋아요 수가 그대로 남아 있으면, 화면이 아니라 **서버 `posts` 표**에 저장된 것입니다.
7. Supabase 대시보드 → **Table Editor → posts** 표를 열어, 해당 글의 `likes` 값이 올라가 있는지 눈으로 확인한다.

## 검증법

- **좋아요 +1:** `❤️` 버튼을 누르면 숫자가 1씩 올라가고, Console에 `❤️ 좋아요 성공! 글 N → (새 숫자)` 로그가 찍히는가?
- **서버 반영(이번 실습의 핵심):** 새로고침(F5)해도 좋아요 수가 그대로 남아 있는가? (화면이 아니라 서버에 저장됐다는 증거)
- **RPC로 처리됐는지:** 코드가 `update` 가 아니라 `db.rpc("increment_likes", { post_id })` 를 쓰고 있는가? 함수가 돌려준 **새 likes 값**으로 화면 숫자를 바꾸는가?
- **서버 확인:** Supabase **Table Editor → posts** 에서 해당 글의 `likes` 가 클릭 횟수만큼 올라가 있는가?
- **anon 키만 썼는지(중요):** `script.js`의 키가 **`sb_publishable_`(anon)** 로 시작하는가? **`sb_secret_`(service_role)** 가 **아닌가?**
- **자주 나는 에러 (Console에서 확인):**
  - `Could not find the function public.increment_likes` → 함수가 없음. **1단계** `schema.sql`의 **4단계(함수)** 까지 실행. (코드가 친절한 안내로 바꿔 표시합니다.)
  - `relation "public.posts" does not exist` → 표가 없음. `schema.sql` **1단계** 실행.
  - `Invalid API key` → anon 키 오타. / `Failed to fetch` → `SUPABASE_URL` 철자·`https://` 확인.
  - `아직 내 프로젝트 값이 입력되지 않았어요` → **2단계**에서 자리표시자를 안 바꿈.

## 다음 단계

- 직전 단계(방명록 insert/select): → [실습 123](../123/)
- 완료 상태를 **update**로 서버에 반영(직접 update 비교) → [실습 121](../121/) · 삭제를 **delete**로 → [실습 122](../122/)

## 관련 가이드

- [공개해도 되는 키 vs 절대 숨길 키 — anon/publishable vs service_role/secret](../../docs/04-security/01.md) — `script.js`에 어떤 키를 넣어야 안전한지
- [RLS(행 수준 보안) — 출입증을 공개해도 안전한 진짜 이유](../../docs/04-security/02.md) — `posts` 표에 RLS를 켜고, 좋아요는 함수(RPC)로만 올리게 하는 이유
- [환경변수(.env) 제대로 — 무엇을 어디에, 무엇을 절대 커밋 안 하나](../../docs/04-security/03.md) — 비밀 키(service_role)는 어디에 둬야 하는가
- [실습 — 직접 따라 만들기](../../docs/practice/index.md)
