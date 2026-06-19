# 실습 116 — 방명록 글 1건 Supabase에 insert 하기

실습 115에서 내 웹페이지와 Supabase 서버를 **연결**하는 데 성공했습니다.
이번에는 그 연결을 실제로 써서, **이름과 메시지 한 줄을 서버 표에 저장(insert)** 해 봅니다.

지금까지는 글을 적어도 **내 컴퓨터(브라우저)** 안에서만 머물렀습니다.
이번 실습부터는 그 글이 **인터넷 너머 Supabase 서버의 표**에 들어가서,
다른 사람이 다른 기기로 봐도 똑같이 남아 있게 됩니다.

> 비유: 115에서 창고(서버 DB) 문을 여는 데 성공했다면,
> 이번엔 그 창고 선반(guestbook 표) 위에 **종이 한 장(글 1건)을 직접 올려놓는** 연습입니다.

이 폴더에 있는 파일:

- `README.md` — 이 안내문
- `schema.sql` — 글을 저장할 **`guestbook` 표를 만드는 SQL** (가장 먼저 1번만 실행)
- `index.html` — 이름·메시지 입력 폼 화면
- `script.js` — **핵심 코드.** 폼 값을 읽어 `insert()`로 서버에 저장합니다.

## 목표

- `supabase.from('guestbook').insert([{ ... }])` 로 서버 표에 **한 줄을 저장**한다.
- 화면 폼의 입력값을 읽어 `name`, `message` 컬럼에 정확히 담아 보내는 흐름을 이해한다.
- 저장이 성공하면 Supabase 대시보드 **Table Editor** 에서 그 줄이 실제로 들어간 것을 **두 눈으로 확인**한다.
- `id`, `created_at` 처럼 **표가 자동으로 채워 주는 칸**은 우리가 안 보내도 된다는 걸 안다.

## 따라하는 단계

1. **먼저 표를 만든다.** Supabase 대시보드 → 왼쪽 **SQL Editor → New query** 에
   이 폴더의 `schema.sql` 내용을 통째로 붙여넣고 오른쪽 위 **[Run]** 을 누른다.
   → 왼쪽 **Table Editor** 에 `guestbook` 표가 생기면 성공.
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
5. **이름**과 **메시지**를 적고 **[남기기]** 버튼을 누른다.
   → 폼 아래 박스가 **초록색 "저장됐어요! (글 번호 id: 1)"** 로 바뀌면 성공.
6. Supabase 대시보드 → **Table Editor → guestbook** 표를 연다.
   방금 적은 이름·메시지가 한 줄로 들어와 있는지, `id`와 `created_at`이 자동으로 채워졌는지 확인한다.
7. (선택) 글을 몇 개 더 남겨 보고, 표에 줄이 하나씩 늘어나는 것을 확인한다.

## 🤖 바이브코딩 프롬프트

이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  나는 비전공 바이브코딩 수강생이야. Supabase에 방명록 글 1건을 저장(insert)하는
  아주 단순한 예제를 만들어줘. 조건:
  - 파일은 index.html(이름·메시지 입력 폼 + [남기기] 버튼) 1개, script.js 1개로 분리.
  - Supabase JS 라이브러리는 CDN(@supabase/supabase-js@2)으로 불러오고,
    SUPABASE_URL / SUPABASE_ANON_KEY는 자리표시자로 둬서 내가 나중에 내 값으로 바꾸게 해줘.
  - 저장 테이블은 guestbook이고 컬럼은 name(text), message(text)이며
    id와 created_at은 DB가 자동으로 채운다고 가정해줘.
  - 이 guestbook 표를 만드는 schema.sql도 함께 만들어줘.
  - 프레임워크 없이 순수 HTML/CSS/JS로만. 한국어 주석을 풍부하게 달아줘.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  방금 만든 방명록에 다음을 추가해줘:
  - 빈 칸(이름/메시지)이면 서버에 보내지 말고 화면에 안내 메시지를 보여주기.
  - 저장하는 동안 [남기기] 버튼을 비활성화('저장 중…')해서 중복 클릭/중복 저장을 막기.
  - 저장 성공이면 초록색, 실패면 빨간색 결과 박스를 보여주고,
    성공 시 서버가 돌려준 글 번호(id)를 함께 표시하기(insert 뒤에 .select() 붙이기).
  - 성공하면 입력칸을 비워서 다음 글을 바로 쓸 수 있게 하기.
  각 부분이 왜 필요한지 한국어 주석으로 한 줄씩 설명해줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  방명록 저장 버튼을 눌렀더니 콘솔(F12)에 이런 빨간 에러가 떴어. 이 에러를 그대로 붙여넣을게:
  <여기에 에러 메시지 전체 붙여넣기>
  비전공자도 알아듣게, (1) 이 에러가 무슨 뜻인지, (2) 가장 흔한 원인이 무엇인지,
  (3) 무엇을 어디서 어떻게 고치면 되는지 단계별로 알려줘.
  특히 'relation guestbook does not exist'(표 안 만듦), 'Invalid API key'(키 오타),
  'violates not-null'(빈 값) 중 어느 경우인지 짚어줘.
  ```
> 프롬프트 팁: 끝에 "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 훨씬 좋습니다.

## 검증법

- 폼 아래 박스가 **초록색**으로 바뀌고 **글 번호(id)** 가 보이는가?
- 브라우저 **개발자 도구 → Console**(윈도우 `F12`, 맥 `Cmd + Option + I`)에
  `✅ 저장 성공!` 로그와 서버가 돌려준 데이터(`id`, `name`, `message`, `created_at` 포함)가 찍혔는가?
- **가장 중요한 확인:** Supabase 대시보드 **Table Editor → guestbook** 에 그 줄이 진짜 들어가 있는가?
  (여기서 보여야 "내 컴퓨터가 아니라 서버에 저장됐다"가 증명됩니다.)
- **실패할 때 원인 찾기** (콘솔의 빨간 에러 메시지로 구분):
  - `relation "public.guestbook" does not exist` → 1단계 `schema.sql`을 실행 안 했음. SQL Editor에서 다시 실행.
  - `Could not find the 'xxx' column` → 컬럼 이름 오타. `insert`의 키(`name`, `message`)가 표의 칸 이름과 똑같아야 함.
  - `null value in column "name" violates not-null` → 빈 칸 그대로 보냄. 이름·메시지를 채웠는지 확인.
  - `Invalid API key` → anon 키를 잘못 붙여넣음. (혹시 service_role을 넣지 않았는지도 확인)
  - 주소 오류 / `Failed to fetch` → `SUPABASE_URL`의 철자나 `https://` 확인.
  - `new row violates row-level security policy` → 표에 RLS가 켜져 있는데 **insert 정책**이 없는 경우.
    이 실습 단계에선 `schema.sql`처럼 RLS를 끈 상태면 정상 통과합니다. (보안을 켜는 법은 실습 119)
- **(안전 점검)** `script.js`에 넣은 키가 **`anon` / `sb_publishable_`** 로 시작하는가? `service_role` / `sb_secret_` 가 **아닌가?**

## 다음 단계

- 저장한 글들을 **목록으로 불러와 화면에 그리기(select)** → [실습 117](../117/)
- 저장 후 목록을 **자동 새로고침 + async/await로 정리** → [실습 118](../118/)
- 직전 단계(연결 확인) → [실습 115](../115/)
- 완성형 예제가 궁금하면 → [실습 03 — Supabase 방명록](../03-supabase-guestbook/)

## 관련 가이드

- [공개해도 되는 키 vs 절대 숨길 키 — anon/publishable vs service_role/secret](../../docs/04-security/01.md) — script.js에 어떤 키를 넣어야 안전한지
- [RLS(행 수준 보안) — 출입증을 공개해도 안전한 진짜 이유](../../docs/04-security/02.md) — anon 키로 insert가 통해도 안전한 근거
- [환경변수(.env) 제대로 — 무엇을 어디에, 무엇을 절대 커밋 안 하나](../../docs/04-security/03.md) — 비밀 키(service_role)는 어디에 둬야 하는가
- [API가 뭔가 — 주방에 음식을 주문하는 창구](../../docs/02-web-basics/04.md) — 웹페이지가 서버에 데이터를 보내는 원리
- [실습 — 직접 따라 만들기](../../docs/practice/index.md)
