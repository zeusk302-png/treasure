# 실습 259 — Supabase Auth로 게시판 회원가입·로그인 붙이기

이메일·비밀번호로 **회원가입/로그인**을 붙여, **로그인한 사람만 글을 쓸 수 있는 한 줄 게시판**을 만듭니다. 글 읽기는 누구나 가능하지만 글쓰기는 로그인한 사람에게만 열립니다. 이렇게 "지금 접속한 사람이 **누구냐**"를 따지는 것이 **인증(authentication)**의 기초입니다.

> 한 줄 그림: **이메일·비밀번호로 회원가입/로그인 → Supabase가 "이 사람이 누구다"라는 로그인 세션을 발급 → 로그인 중이면 글쓰기 칸이 켜지고 INSERT 가능 → DB의 RLS 정책이 "로그인한 본인만 쓰기"를 진짜로 강제 → 글 목록은 누구나 읽기**

> 비유: 게시판을 **카페 게시판**이라고 생각하세요. 벽에 붙은 글은 **지나가는 누구나 읽을 수** 있습니다(공개 읽기). 하지만 새 글을 붙이려면 **카운터에서 회원 도장을 받아야**(로그인) 합니다. 그리고 이 "회원만 붙이기" 규칙을 **벽 자체가 강제**하는 게 핵심입니다 — 화면에서 글쓰기 버튼을 숨기는 건 '안내 표지판'일 뿐이고, 진짜 자물쇠는 DB의 RLS 정책입니다.

> 보안 메모 — 공개해도 되는 값 vs 절대 숨겨야 하는 값
> - **공개되어도 되는 값**: `script.js`의 `SUPABASE_URL`(내 DB 주소)과 `SUPABASE_ANON_KEY`(anon, 공개 키 `sb_publishable_...`). 브라우저에 그대로 박고 깃허브에 올려도 안전합니다. 이유는 표에 **RLS(행 수준 보안)**를 켜 두어, 이 출입증으로 할 수 있는 일이 "누구나 읽기 + 로그인한 본인만 쓰기/삭제"로 **DB가 제한**하기 때문입니다.
> - **절대 노출하면 안 되는 비밀값**: **service_role 키**(`sb_secret_...`). 이것은 RLS를 **통째로 우회**하는 마스터 키라서, 브라우저·`script.js`·깃허브에 올리면 누구나 모든 글을 삭제·조작할 수 있습니다. service_role은 **오직 서버**(예: n8n·백엔드)에서만 비밀로 보관해 씁니다. 이 실습의 브라우저 코드에는 절대 넣지 않습니다.
> - 잘못된 설명 주의: "anon 키 = 비밀키"는 **틀린 말**입니다. anon은 공개해도 되는 출입증이고, 보호는 키를 숨겨서가 아니라 **RLS 정책**으로 하는 것입니다.

## 목표
- **인증(누구냐)의 기초를 체험한다**: 이메일·비밀번호로 회원가입(`signUp`)·로그인(`signInWithPassword`)·로그아웃(`signOut`)을 붙이고, 로그인 세션이 무엇인지 이해한다.
- **"로그인한 사람만 글쓰기"를 만든다**: 로그인하면 글쓰기 칸이 켜지고, 로그아웃하면 잠긴다.
- **잠금은 두 겹임을 안다**: (a) 화면 잠금(글쓰기 칸 `disabled`)은 친절한 안내일 뿐이고, (b) **진짜 자물쇠는 DB의 RLS 정책**이라는 것을 구분한다.
- **세션 유지를 확인한다**: 새로고침해도 로그인이 풀리지 않는다(세션이 브라우저에 저장됨).
- **보안 경계를 익힌다**: anon 키는 공개 가능, service_role 키는 절대 비밀이라는 선을 코드로 직접 확인한다.

## 따라하는 단계

### A. Supabase 프로젝트 준비
1. [supabase.com](https://supabase.com)에서 무료 프로젝트를 하나 만듭니다.
2. 왼쪽 메뉴 **Settings → API**에서 두 값을 복사합니다.
   - **Project URL** → 나중에 `SUPABASE_URL`에 넣을 값.
   - **anon public** 키(`sb_publishable_...`) → `SUPABASE_ANON_KEY`에 넣을 값. (옆에 있는 service_role 키는 **절대 복사해서 쓰지 마세요**.)

### B. 표와 보안 정책 만들기 (DB쪽 진짜 자물쇠)
3. 왼쪽 메뉴 **SQL Editor → New query**로 들어갑니다.
4. 이 폴더의 `schema.sql` 내용을 통째로 붙여넣고 오른쪽 위 **Run**을 누릅니다. 이 한 번으로 아래가 만들어집니다.
   - `posts` 표(글 한 줄: `id`, `user_id`, `author`, `content`, `created_at`).
   - **RLS 켜기**(`enable row level security`) — 켜는 순간 기본은 '전부 거절'.
   - **읽기 정책**: 누구나(`anon`·`authenticated`) 글 읽기 허용.
   - **쓰기 정책**: `authenticated`(로그인)만 INSERT, 그리고 `with check (auth.uid() = user_id)`로 **글쓴이 위조 방지**.
   - **삭제 정책**: `auth.uid() = user_id`, 즉 **내가 쓴 글만** 삭제 가능.
   - (수정 정책은 일부러 안 만들었습니다 — 정책 없는 동작은 자동으로 막힙니다.)

### C. 화면 코드에 내 프로젝트 값 넣기
5. `script.js`를 열어 맨 위 두 줄을 내 값으로 바꿉니다. (지금은 `여기에-내...`라는 자리표시자라서 그대로 실행하면 안내 메시지가 뜹니다.)
   - `SUPABASE_URL` → A단계에서 복사한 Project URL.
   - `SUPABASE_ANON_KEY` → A단계에서 복사한 **anon(공개) 키**. (service_role 아님!)

### D. 띄워서 회원가입·로그인·글쓰기 해보기
6. `index.html`을 브라우저로 엽니다. (배포해서 열어도 됩니다.) 처음에는 **글쓰기 칸이 잠겨**(`🔒 글을 쓰려면 먼저 로그인하세요.`) 있습니다.
7. 이메일·비밀번호(6자 이상)를 입력하고 **회원가입**을 누릅니다.
   - 프로젝트 설정에 따라 두 갈래입니다: **이메일 확인 OFF**면 바로 로그인됨, **이메일 확인 ON**이면 메일의 링크를 눌러 확인한 뒤 **로그인**을 누릅니다.
8. 로그인되면 환영 줄(`👋 ... 님, 로그인 중`)이 뜨고 **글쓰기 칸이 켜집니다**. 글을 써서 **글 올리기**를 누르면 목록에 바로 나타납니다.
9. **로그아웃**을 누르면 글쓰기 칸이 다시 잠깁니다. **새로고침**해도 로그인 상태가 유지되는지(세션) 확인하세요.

## 🤖 바이브코딩 프롬프트
이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다. 한 단계씩 시키고, 결과가 옳은지(특히 anon/service_role 구분과 RLS) 직접 확인하세요.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 비전공자를 돕는 웹/DB 멘토야. Supabase로 "로그인한 사람만 글 쓰는 한 줄 게시판"을 만들어 줘.
  파일 3개로 나눠 줘: index.html(화면), script.js(동작+Supabase 연결), schema.sql(표+보안).
  요구사항:
  (1) schema.sql: posts 표(id, user_id uuid default auth.uid() references auth.users, author text,
      content text, created_at)와 RLS 정책 — "누구나 SELECT 허용 / authenticated 만 INSERT(with check
      auth.uid()=user_id) / 본인만 DELETE(using auth.uid()=user_id)". RLS는 반드시 enable 해 줘.
  (2) script.js: @supabase/supabase-js v2 CDN을 쓰고, 이메일/비밀번호 signUp·signInWithPassword·signOut,
      onAuthStateChange 로 로그인 상태에 따라 글쓰기 칸을 켜고 끄기, posts INSERT/SELECT.
  (3) index.html: 로그인/회원가입 폼, (로그인해야 켜지는) 글쓰기 칸, 글 목록.
  보안 제약(중요): 브라우저 코드에는 anon(공개) 키만 넣고 service_role 키는 절대 넣지 마.
  SUPABASE_URL/SUPABASE_ANON_KEY 는 '자리표시자'로 두고 내가 직접 바꾸게 해 줘.
  코드만 주지 말고 "왜 anon은 공개해도 되고 service_role은 안 되는지", "화면 잠금과 RLS의 차이"를
  비전공자가 이해하게 주석으로 한 줄씩 풀어서 설명해 줘.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  위 게시판을 이렇게 개선해 줘.
  - 글 목록에서 사용자가 쓴 글 '내용'은 반드시 textContent 로 넣어 줘(innerHTML 금지 — XSS 방지).
    글쓴이 이메일도 안전하게 escape 해서 표시해 줘.
  - 회원가입 시 이메일 확인 ON/OFF 두 경우(바로 로그인 vs 메일 확인 필요)를 모두 안내 메시지로 구분해 줘.
  - 로그인 실패 메시지를 사람이 알아듣게 바꿔 줘(예: Invalid login credentials → "이메일/비밀번호가 틀렸어요").
  - 새로고침해도 로그인 세션이 유지되는지(persistSession) 확인하고, 페이지 로드 시 getSession 으로 현재 상태를 그려 줘.
  바뀐 부분마다 왜 그렇게 했는지 주석으로 설명해 줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  Supabase 게시판이 동작을 안 해. 아래 정보로 단계별로 원인을 찾아 줘.
  - 브라우저 콘솔(F12)에 찍힌 에러 메시지 전문: (여기에 붙여넣기)
  - 어떤 동작에서 막혔는지: (회원가입 / 로그인 / 글 올리기 / 목록 안 보임 중 택1)
  가장 흔한 원인부터 순서대로 점검해 줘:
  (1) SUPABASE_URL / SUPABASE_ANON_KEY 가 아직 자리표시자(여기에-내...)인지,
  (2) "violates row-level security" → 로그인 안 했거나 RLS INSERT 정책이 없는지,
  (3) "...does not exist" → schema.sql 을 SQL Editor 에서 실행 안 했는지,
  (4) "Invalid API key" → service_role 을 잘못 넣었거나 anon 키 오타인지,
  (5) "Failed to fetch" → URL 철자/https:// 문제인지.
  고친 부분은 왜 그게 원인이었는지 한 줄씩 풀어서 설명해 줘.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다.

## 검증법
- **로그아웃 상태에서 잠겨 있는지**: 처음 페이지를 열면 글쓰기 칸이 `disabled`(회색)이고 `🔒` 안내가 보여야 합니다.
- **로그인하면 켜지는지**: 회원가입·로그인 후 환영 줄이 뜨고 글쓰기 칸이 켜지며, 글을 올리면 목록 맨 위에 바로 보여야 합니다.
- **세션 유지 확인**: 로그인한 채로 **새로고침**해도 로그인 상태가 유지되는지(글쓰기 칸이 계속 켜져 있는지) 봅니다.
- **읽기는 누구나 되는지**: 로그아웃(또는 시크릿 창)에서도 **글 목록은 보여야** 합니다(공개 읽기 정책).
- **RLS가 진짜로 막는지 (핵심)**: 로그아웃 상태에서 브라우저 콘솔(F12)에 직접 INSERT를 시도해 봅니다. **막혀야** 정상입니다.
  - 콘솔에 `await db.from("posts").insert({ content: "test" })` 를 입력 → 결과 `error`에 `row-level security` 위반이 나와야 합니다(글이 안 들어감). 화면 잠금이 아니라 **DB가 거절**한다는 증거입니다.
- **XSS 안전 확인**: 글 내용에 `<b>굵게</b>` 같은 태그를 써서 올려 봅니다. **태그가 글자 그대로 보여야** 정상입니다(굵어지면 안 됨). `textContent`로 넣었기 때문입니다.
- **비밀값이 코드에 안 들어갔는지**: `script.js`에 들어간 키가 `sb_publishable_...`(anon, 공개)인지 확인합니다. `sb_secret_...`(service_role)가 보이면 **즉시 빼고 키를 회전**하세요.

## 파일 구성
- `index.html` — 화면 뼈대. 로그인/회원가입 폼, (로그인해야 켜지는) 글쓰기 칸, 글 목록. Supabase 라이브러리를 CDN으로 불러온 뒤 `script.js`를 읽습니다.
- `script.js` — 동작 담당. anon 키로 Supabase에 연결하고, 회원가입(`signUp`)·로그인(`signInWithPassword`)·로그아웃(`signOut`), 로그인 상태에 따른 화면 다시 그리기(`onAuthStateChange`), 글 목록 읽기(`select`)와 글 올리기(`insert`). 사용자 입력은 `textContent`로만 출력해 XSS를 막습니다. 맨 위 두 값은 내 anon 값으로 바꿔야 합니다.
- `schema.sql` — DB쪽 진짜 자물쇠. `posts` 표 생성 + RLS 켜기 + 정책 3개(누구나 읽기 / 로그인만 쓰기·위조 방지 / 본인만 삭제). Supabase SQL Editor에서 한 번 실행합니다.

## 관련 가이드
- [4권 04 — 인증 vs 인가 ('누구냐'와 '뭘 해도 되냐'는 다른 질문)](../../docs/04-security/04.md) · 이번 실습의 "로그인한 사람만"이 바로 인증(누구냐)입니다.
- [12권 08 — Supabase/Postgres 심화 (RLS·정책·함수·실시간)](../../docs/12-database-advanced/08.md) · `schema.sql`의 RLS 정책 문법(`to authenticated`, `with check`, `using`)을 더 깊이 다룹니다.
- [4권 02 — RLS(행 수준 보안), 출입증을 공개해도 안전한 진짜 이유](../../docs/04-security/02.md) · anon 키를 공개해도 되는 이유가 여기 있습니다.
- [4권 01 — 공개해도 되는 키 vs 절대 숨길 키 (anon vs service_role)](../../docs/04-security/01.md) · anon/service_role 구분의 기준.
- 관련 실습: 실습 260 (RLS 정책으로 '작성자만 자기 글 수정·삭제' 막기) — 이번에 안 만든 UPDATE 정책과 인가(뭘 해도 되냐)를 이어서 다룹니다.
- Supabase Auth 문서(영문): https://supabase.com/docs/guides/auth
- Supabase RLS 문서(영문): https://supabase.com/docs/guides/database/postgres/row-level-security
