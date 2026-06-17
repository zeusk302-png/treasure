# 실습 118 — 등록하면 목록이 즉시 갱신되는 방명록 (async/await 정리판)

실습 116은 글 **저장(insert)** 만, 실습 117은 글 **목록 보기(select)** 만 했습니다.
하지만 진짜 방명록이라면 **글을 남기는 순간 그 글이 목록에 바로 나타나야** 자연스럽죠.

이번 118에서는 두 가지를 합니다.

1. **등록 후 목록 자동 갱신** — 글을 저장하면 화면 새로고침 없이 **다시 select 해서** 목록을 새로 그립니다. (방금 쓴 글이 맨 위에 바로 등장)
2. **비동기 코드 정리** — 116/117의 콜백 대신 **`async` / `await`** 로 코드를 '위에서 아래로' 읽히게 하고, **`try` / `catch` / `finally`** 로 에러를 한곳에서 잡아 빨간 안내로 보여 줍니다.

> 비유: 116이 "선반에 종이 한 장 올리기", 117이 "선반 종이들 꺼내 붙이기"였다면,
> 118은 **"종이를 올리자마자 게시판을 곧바로 새로 정리해 붙이는"** 한 동작입니다.
> 그리고 그 일을 시키는 "지시서(코드)"를 군더더기 없이 깔끔하게 다시 적는 연습입니다.

이 폴더에 있는 파일:

- `README.md` — 이 안내문
- `schema.sql` — `guestbook` 표 SQL (116/117과 **같은 표**. 이미 만들었으면 다시 실행 안 해도 됨)
- `index.html` — 글 입력 폼 + 목록이 함께 있는 화면
- `script.js` — **핵심 코드.** `insert` → 성공하면 `await loadGuestbook()` 로 목록 재조회. `async/await`+`try/catch` 사용.

## 목표

- 글을 **저장(insert)** 한 뒤, 성공하면 곧바로 **다시 select** 해서 목록을 갱신하는 흐름을 만든다.
- `.then()` 콜백 대신 **`async` 함수 + `await`** 로 "서버 응답을 기다렸다 다음 줄"을 읽히게 쓴다.
- **`try / catch`** 로 insert·select 도중의 에러를 한곳에서 잡아 사용자에게 빨간 안내로 보여 준다.
- **`finally`** 로 성공이든 실패든 항상 버튼 잠금을 풀어, 멈춰 버린 화면이 없게 한다.
- Supabase가 에러를 `throw` 하지 않고 **`{ data, error }`** 로 돌려주므로, `if (error) throw error;` 로 직접 던져 `catch`가 잡게 하는 패턴을 이해한다.

## 따라하는 단계

1. **표를 준비한다.** 116/117에서 `guestbook` 표를 이미 만들었다면 건너뛰세요.
   아직 없다면 Supabase 대시보드 → **SQL Editor → New query** 에 이 폴더의 `schema.sql`을
   통째로 붙여넣고 **[Run]** 을 누른다. (이 파일은 `if not exists` 라 다시 실행해도 안전합니다.)
2. Supabase 대시보드 **Settings(톱니바퀴) → API** 에서 두 값을 복사한다.
   - **Project URL** : `https://xxxxxxxx.supabase.co` 형태의 주소 (비밀 아님)
   - **anon public** 키 (신형은 `sb_publishable_...` 로 시작) : 브라우저에 둬도 되는 **공개 출입증**
   - ⚠️ 같은 화면의 **`service_role` / `sb_secret_...` 키는 절대 쓰지 마세요.** 모든 보안을 무시하는 마스터 키입니다.
3. 이 폴더의 `script.js`를 열고, 맨 위 두 줄의 **자리표시자**를 내 값으로 바꾼다.
   ```js
   const SUPABASE_URL = "https://여기에-내-프로젝트-ID.supabase.co";   // ← 내 Project URL
   const SUPABASE_ANON_KEY = "sb_publishable_여기에-내-anon-공개키-붙여넣기"; // ← 내 anon public 키
   ```
4. `index.html`을 **브라우저로 연다.** (파일을 더블클릭)
   → 페이지가 열리자마자 자동으로 기존 글 목록을 한 번 불러옵니다.
5. **이름과 메시지를 입력하고 [남기기]** 를 누른다.
   → '저장 중…' → '저장 완료! 목록을 갱신합니다…' 안내가 차례로 뜨고,
   → **새로고침 없이** 방금 쓴 글이 목록 **맨 위**에 나타나면 성공입니다.
6. (흐름 이해) `script.js`의 `addGuestbookEntry` 함수를 보며 순서를 따라 읽어 본다.
   `await insert(...)` → 성공하면 → `await loadGuestbook()` 로 목록을 다시 그림 → `finally`에서 버튼 잠금 해제.
   `await` 덕분에 콜백 중첩 없이 **위에서 아래로** 읽힌다는 점을 확인하세요.

## 검증법

- 글을 남기면 **새로고침 없이** 목록 맨 위에 그 글이 즉시 나타나는가?
- 저장하는 동안 [남기기] 버튼이 **잠겼다가**(중복 저장 방지), 끝나면 **다시 풀리는가?**
- 빈 칸으로 제출하면 서버에 보내지 않고 **"이름과 메시지를 모두 입력해 주세요"** 안내가 뜨는가?
- 브라우저 **개발자 도구 → Console**(윈도우 `F12`, 맥 `Cmd + Option + I`)에
  `✅ 저장 성공` 과 `✅ 불러오기 성공! 글 N개` 로그가 **순서대로** 찍히는가?
- **`await`/`try`/`catch` 동작 확인:** `script.js`의 `addGuestbookEntry`에서
  `if (error) throw error;` 줄을 잠깐 `throw new Error("일부러 낸 에러");` 로 바꿔 본다.
  → 저장이 실제로 됐든 안 됐든 **빨간 '저장 실패' 안내**가 뜨고 버튼은 다시 풀려야 합니다. (확인 후 원래대로 되돌리기)
- **실패할 때 원인 찾기** (콘솔의 빨간 에러 메시지로 구분):
  - `relation "public.guestbook" does not exist` → 표가 없음. 1단계 `schema.sql`을 실행.
  - `Invalid API key` → anon 키를 잘못 붙여넣음. (혹시 service_role을 넣지 않았는지도 확인)
  - 주소 오류 / `Failed to fetch` → `SUPABASE_URL`의 철자나 `https://` 확인.
  - **insert가 막히거나(에러) 목록만 계속 비어 있다?** → 표에 **RLS가 켜져 있는데 정책이 없는** 경우가 가장 흔합니다.
    읽기 정책이 없으면 select가 **빈 배열 `[]`** 을, 쓰기 정책이 없으면 insert가 **에러**를 돌려줍니다.
    이 실습 단계처럼 RLS가 꺼져 있으면 정상 동작합니다. (보안을 켜는 법과 읽기/쓰기 정책은 실습 119)
- **(안전 점검)** `script.js`에 넣은 키가 **`anon` / `sb_publishable_`** 로 시작하는가? `service_role` / `sb_secret_` 가 **아닌가?**

## 다음 단계

- **RLS(행 수준 보안)** 를 켜고 읽기/쓰기 정책 추가 → [실습 119](../119/)
- 직전 단계: 글 목록 select로 그리기 → [실습 117](../117/) / 글 1건 insert → [실습 116](../116/)
- 완성형 예제가 궁금하면 → [실습 03 — Supabase 방명록](../03-supabase-guestbook/)

## 관련 가이드

- [공개해도 되는 키 vs 절대 숨길 키 — anon/publishable vs service_role/secret](../../docs/04-security/01.md) — script.js에 어떤 키를 넣어야 안전한지
- [RLS(행 수준 보안) — 출입증을 공개해도 안전한 진짜 이유](../../docs/04-security/02.md) — anon 키로 읽고 써도 안전한 근거, 정책 없으면 빈 목록/막힌 쓰기가 되는 이유
- [환경변수(.env) 제대로 — 무엇을 어디에, 무엇을 절대 커밋 안 하나](../../docs/04-security/03.md) — 비밀 키(service_role)는 어디에 둬야 하는가
- [API가 뭔가 — 주방에 음식을 주문하는 창구](../../docs/02-web-basics/04.md) — 웹페이지가 서버에 요청을 보내고 응답을 기다리는(비동기) 원리
- [실습 — 직접 따라 만들기](../../docs/practice/index.md)
