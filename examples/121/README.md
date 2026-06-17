# 실습 121 — 할 일 완료 상태를 `update`로 서버에 반영하기

120번에서는 할 일 앱을 Supabase로 옮겨 **추가(`insert`)** 와 **목록 보기(`select`)** 까지 했습니다.
하지만 한 가지가 빠져 있었죠. **"이거 다 했어!"라고 표시하는 기능**입니다.

이번 121번에서는 각 할 일 왼쪽에 **체크박스**를 달고, 체크하면 그 줄만 골라
**`update`(수정)** 로 서버에 완료 상태를 저장합니다. 이렇게 하면 새로고침하거나
다른 기기에서 열어도 **완료 표시가 그대로** 남습니다.

> 비유: 서버의 `todos` 표를 '큰 출석부'라고 하면, `update ... eq("id", id)`는
> **"3번 학생 줄만 펴서, 그 칸에만 도장을 찍는"** 일입니다.
> `eq("id", id)`(번호 콕 집기)가 없으면 **출석부 전체에 도장**이 찍혀 버립니다(사고!).

**이번 실습의 한 줄 핵심:**

```js
db.from("todos").update({ done: true }).eq("id", id)
//                 ┗ 무엇을 바꿀지            ┗ 어느 줄을 바꿀지(이게 빠지면 전부 바뀜)
```

| 하는 일 | 어떻게 | 언제 배웠나 |
| --- | --- | --- |
| 할 일 추가 | `db.from("todos").insert({ text })` | 116·120 |
| 목록 보기 | `db.from("todos").select("*")` | 117·120 |
| **완료 토글** | **`db.from("todos").update({ done }).eq("id", id)`** | **이번 121** |

이 폴더에 있는 파일:

- `README.md` — 이 안내문
- `schema.sql` — **먼저 실행.** `todos` 표·RLS·읽기/쓰기 정책(120번 것) + **`update` 정책(이번 추가분)**
- `index.html` — 각 할 일에 **체크박스**가 붙은 화면 (완료 시 회색 줄긋기)
- `script.js` — 체크박스를 누르면 `update`로 서버에 반영하는 `toggleDone` 함수가 핵심

## 목표

- 체크박스를 누르면 **`update({ done }).eq("id", id)`** 로 **특정 행 한 건만** 수정하는 패턴을 익힌다.
- `update`에는 **`eq`로 대상 한 건 콕 집기**가 짝꿍처럼 따라온다는 것(안 그러면 전부 수정됨)을 이해한다.
- RLS에서 **동작별로 정책이 따로 필요**하다는 것을 체감한다 — 120번엔 `select`/`insert`만 열었기에 `update`는 막혀 있고, 이번에 **`update` 정책**을 추가해야 통과한다.
- **anon(공개) 키만** 코드에 넣고, **service_role(비밀) 키는 절대 넣지 않는** 보안 원칙을 지킨다.

## 따라하는 단계

1. **`schema.sql`을 실행해 서버에 `update` 정책을 추가한다.**
   Supabase 대시보드 → **SQL Editor → New query** 에 이 폴더의 `schema.sql` **전체**를 붙여넣고 **[Run]** 합니다.
   → 120번을 이미 했다면 1~3단계는 건너뛰고, **4단계 `update` 정책**이 새로 추가됩니다. (여러 번 실행해도 안전합니다.)
2. `script.js`의 맨 위 두 줄 **자리표시자**를 내 **anon(공개) 키** 값으로 바꾼다.
   Supabase 대시보드 → **Settings(톱니바퀴) → API** 에서 복사합니다.
   ```js
   const SUPABASE_URL = "https://여기에-내-프로젝트-ID.supabase.co";        // ← Project URL
   const SUPABASE_ANON_KEY = "sb_publishable_여기에-내-anon-공개키-붙여넣기"; // ← anon public 키
   ```
   ⚠️ **`service_role` / `sb_secret_...` 키는 절대 넣지 마세요.** RLS를 통째로 무시하는 마스터 키라, 브라우저에 노출하면 누구나 데이터를 마음대로 다룰 수 있게 됩니다.
3. `index.html`을 **브라우저로 열기** 전, 개발자 도구(`F12`) → **Console** 탭을 켜 둔다. (성공/실패 로그가 여기 찍힙니다.)
4. `index.html`을 **더블클릭해서 열고**, 할 일을 1~2개 추가한다. (없으면 입력칸에 적고 [추가])
5. 할 일 왼쪽 **체크박스를 클릭**한다.
   → `완료 상태 저장 중…` → `완료로 표시했어요!` 가 뜨고, 글자가 **회색 + 가운데 줄긋기**로 바뀌면 성공입니다.
   → Console에 `✅ 완료 상태 저장: {id: ..., done: true}` 로그가 찍힙니다.
6. **다시 체크 해제**해 본다. → `done`이 `false`로 돌아가고 줄긋기가 풀립니다(토글).
7. **서버에 진짜 저장됐는지 확인:** 페이지를 **새로고침(F5)** 한다.
   → 완료 표시가 그대로 유지되면, localStorage가 아니라 **서버에 반영된 것**입니다.
8. Supabase 대시보드 → **Table Editor → todos** 표를 열어, 체크한 줄의 **`done` 칸이 `true`** 로 바뀌었는지 눈으로 확인한다.

## 검증법

- **토글 동작:** 체크 → 줄긋기 + `✅ 완료로 표시했어요!`, 해제 → 줄긋기 풀림 + `다시 할 일로 돌렸어요!` 가 번갈아 되는가?
- **서버 반영(이번 실습의 핵심):** 체크한 뒤 **새로고침(F5)** 해도 완료 표시가 유지되는가? Console에 `✅ 완료 상태 저장: { id, done }` 로그가 찍히는가?
- **다른 기기 동기화:** 다른 브라우저·기기에서 열어도 완료 표시가 똑같이 보이는가?
- **서버 확인:** **Table Editor → todos** 에서 체크한 줄의 `done` 값이 `true`/`false`로 바뀌는가?
- **`eq`의 중요성(딱 한 줄만 수정):** 한 할 일만 체크했을 때 **다른 할 일은 그대로**인가? (모두 함께 바뀐다면 코드에서 `.eq("id", id)`가 빠진 것)
- **anon 키만 썼는지(중요):** `script.js`의 키가 **`sb_publishable_`(anon)** 로 시작하는가? **`sb_secret_`(service_role)** 가 **아닌가?**
- **자주 나는 에러 (Console에서 확인):**
  - `new row violates row-level security policy` / `... violates row-level security` → **`update` 정책이 없음.** `schema.sql`의 **4단계**를 실행. (체크는 화면에서 잠깐 됐다가 새로고침 시 원래대로 돌아오면 이 경우입니다.)
  - `relation "public.todos" does not exist` → 표가 없음. `schema.sql` **1단계**부터 실행.
  - `Invalid API key` → anon 키 오타. / `Failed to fetch` → `SUPABASE_URL` 철자·`https://` 확인.
  - `아직 내 프로젝트 값이 입력되지 않았어요` → **2단계**에서 자리표시자를 안 바꿈.

## 다음 단계

- 직전 단계(localStorage → Supabase 이전): → [실습 120](../120/)
- RLS 정책을 처음 켜고 이해하기: → [실습 119](../119/)
- 삭제를 **`delete`** 로 (+ `confirm`으로 실수 방지) → [실습 122](../122/)

## 관련 가이드

- [공개해도 되는 키 vs 절대 숨길 키 — anon/publishable vs service_role/secret](../../docs/04-security/01.md) — `script.js`에 어떤 키를 넣어야 안전한지
- [RLS(행 수준 보안) — 출입증을 공개해도 안전한 진짜 이유](../../docs/04-security/02.md) — `update` 같은 동작마다 정책이 따로 필요한 이유
- [환경변수(.env) 제대로 — 무엇을 어디에, 무엇을 절대 커밋 안 하나](../../docs/04-security/03.md) — 비밀 키(service_role)는 어디에 둬야 하는가
- [실습 — 직접 따라 만들기](../../docs/practice/index.md)
