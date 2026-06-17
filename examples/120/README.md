# 실습 120 — 할 일 앱을 localStorage에서 Supabase `todos` 표로 이전하기

110~112번에서 만든 할 일 앱은 데이터를 **내 브라우저(localStorage)** 에만 저장했습니다.
편하긴 하지만, **다른 기기·다른 브라우저에서 열면 내 할 일이 안 보이는** 한계가 있습니다(113번에서 직접 확인했죠).

이번 120번에서는 **같은 앱을 그대로 두고 저장 장소만 'Supabase 서버의 `todos` 표'로 옮깁니다.**
이렇게 데이터를 한 보관 장소에서 다른 보관 장소로 옮기는 것을 **마이그레이션(migration)** 이라고 합니다.

> 비유: 앱은 똑같은 '주방'인데, 재료(데이터)를 두던 곳을 **내 집 냉장고(localStorage)** 에서
> **모두가 함께 쓰는 공용 창고(서버 DB)** 로 바꾸는 일입니다. 요리법(앱 동작)은 그대로입니다.

**핵심은 함수 두 개의 교체입니다:**

| 하는 일 | 110번 (localStorage) | 120번 (Supabase) |
| --- | --- | --- |
| 할 일 추가 | `todos.push(text)` + `localStorage.setItem` | `await db.from("todos").insert({ text })` |
| 목록 보기 | `localStorage.getItem` + `JSON.parse` | `await db.from("todos").select("*")` |
| id 만들기 | `Date.now()`로 직접 생성 | 서버가 자동으로 매겨 줌 |

이 폴더에 있는 파일:

- `README.md` — 이 안내문
- `schema.sql` — **먼저 실행.** `todos` 표 만들기 + RLS 켜기 + 읽기/쓰기 정책 추가
- `index.html` — 할 일 입력칸 + 목록 화면 (110번과 거의 같은 모습)
- `script.js` — `insert`(추가) / `select`(목록)로 바뀐 코드. 110번과 무엇이 달라졌는지 주석으로 비교

## 목표

- localStorage에 쓰던 할 일 객체 구조(`{ text, done }`)를 **서버의 `todos` 표 컬럼**으로 옮긴다.
- 추가는 **`insert`**, 목록은 **`select`** 로 바꿔 **'로컬 앱 → 서버 앱' 마이그레이션의 전 과정**을 경험한다.
- 서버 통신은 시간이 걸리는 일이므로 **`async/await`로 기다렸다 결과를 받는** 흐름(118번 복습)을 익힌다.
- **anon(공개) 키만** 코드에 넣고, **service_role(비밀) 키는 절대 넣지 않는** 보안 원칙을 지킨다.

## 따라하는 단계

1. **`schema.sql`로 서버에 표와 정책을 만든다.**
   Supabase 대시보드 → **SQL Editor → New query** 에 이 폴더의 `schema.sql` **전체**를 붙여넣고 **[Run]** 합니다.
   → `todos` 표(컬럼: `id`, `text`, `done`, `created_at`)가 생기고, RLS가 켜지며 읽기·쓰기 정책이 추가됩니다.
2. `script.js`의 맨 위 두 줄 **자리표시자**를 내 **anon(공개) 키** 값으로 바꾼다.
   Supabase 대시보드 → **Settings(톱니바퀴) → API** 에서 복사합니다.
   ```js
   const SUPABASE_URL = "https://여기에-내-프로젝트-ID.supabase.co";        // ← Project URL
   const SUPABASE_ANON_KEY = "sb_publishable_여기에-내-anon-공개키-붙여넣기"; // ← anon public 키
   ```
   ⚠️ **`service_role` / `sb_secret_...` 키는 절대 넣지 마세요.** RLS를 통째로 무시하는 마스터 키라, 브라우저에 노출하면 누구나 데이터를 마음대로 다룰 수 있게 됩니다.
3. `index.html`을 **브라우저로 열기** 전, 개발자 도구(`F12`) → **Console** 탭을 켜 둔다. (성공/실패 로그가 여기 찍힙니다.)
4. `index.html`을 **더블클릭해서 열고**, 처음엔 목록이 비어 있는지(`할 일이 없어요`) 확인한다.
5. 입력칸에 할 일을 적고 **[추가]** (또는 Enter)를 누른다.
   → `저장 중…` → `저장 완료!` 가 뜨고, 입력한 할 일이 목록 맨 아래에 시간과 함께 나타나면 성공입니다.
6. **마이그레이션의 진짜 효과 확인:** 같은 페이지를 **다른 브라우저(또는 휴대폰)** 에서 열어 본다.
   → localStorage 때와 달리, **같은 할 일이 그대로 보입니다.** (서버에 저장됐기 때문!)
7. Supabase 대시보드 → **Table Editor → todos** 표를 열어, 방금 추가한 줄이 실제로 들어가 있는지 눈으로 확인한다.

## 검증법

- **추가:** [추가] 후 `✅ 저장 완료!`가 뜨고 목록에 새 항목이 나타나는가? Console에 `✅ 저장 성공: ...` 로그가 찍히는가?
- **목록:** 페이지를 새로고침(F5)해도 추가한 할 일이 그대로 보이는가? (localStorage가 아니라 서버에서 다시 불러오기 때문)
- **다른 기기 동기화(이번 실습의 핵심):** 다른 브라우저·기기에서 열어도 같은 목록이 보이는가?
- **서버 확인:** Supabase **Table Editor → todos** 에 입력한 줄이 보이고, `id`가 자동으로 매겨졌는가?
- **anon 키만 썼는지(중요):** `script.js`의 키가 **`sb_publishable_`(anon)** 로 시작하는가? **`sb_secret_`(service_role)** 가 **아닌가?**
- **자주 나는 에러 (Console에서 확인):**
  - `relation "public.todos" does not exist` → 표가 없음. **1단계** `schema.sql`을 실행. (코드가 친절한 안내로 바꿔 표시합니다.)
  - `new row violates row-level security policy` → RLS는 켜졌는데 정책이 없음. `schema.sql`의 **3단계(정책)** 까지 실행.
  - `Invalid API key` → anon 키 오타. / `Failed to fetch` → `SUPABASE_URL` 철자·`https://` 확인.
  - `아직 내 프로젝트 값이 입력되지 않았어요` → **2단계**에서 자리표시자를 안 바꿈.

## 다음 단계

- 직전 단계(로컬 할 일 앱): → [실습 110](../110/) · 삭제/완료 토글(로컬) → [실습 111](../111/)
- 직전 단계(RLS 정책 켜기): → [실습 119](../119/)
- 완료 상태를 **update**로 서버에 반영 → [실습 121](../121/) · 삭제를 **delete**로 → [실습 122](../122/)

## 관련 가이드

- [공개해도 되는 키 vs 절대 숨길 키 — anon/publishable vs service_role/secret](../../docs/04-security/01.md) — `script.js`에 어떤 키를 넣어야 안전한지
- [RLS(행 수준 보안) — 출입증을 공개해도 안전한 진짜 이유](../../docs/04-security/02.md) — `todos` 표에 RLS를 켜고 정책을 다는 이유
- [환경변수(.env) 제대로 — 무엇을 어디에, 무엇을 절대 커밋 안 하나](../../docs/04-security/03.md) — 비밀 키(service_role)는 어디에 둬야 하는가
- [실습 — 직접 따라 만들기](../../docs/practice/index.md)
