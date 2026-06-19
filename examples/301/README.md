# 실습 301 — "본인 데이터만" RLS 정책 작성하고, 남의 행 못 읽는지 검증하기

실습 300에서 "RLS를 켜면 같은 키로도 0줄이 된다"를 봤다면, 이번엔 한 단계 더 나아갑니다. **로그인한 사람마다 "자기 줄만" 보이도록** `auth.uid()` 기준 정책을 직접 쓰고, **다른 계정으로 로그인해 남의 메모가 0건으로 막히는지** 실제로 시도해 정책이 작동함을 증명합니다.

> 핵심 한 줄: `auth.uid()` 는 "지금 로그인한 사람의 고유 ID"입니다. 정책에 `using (auth.uid() = user_id)` 를 쓰면 **"그 줄의 주인 == 지금 로그인한 사람"** 일 때만 통과시켜, A는 A 것만 / B는 B 것만 보게 됩니다.

## 목표
- `user_id uuid default auth.uid()` 로 "줄의 주인"을 자동 기록하는 테이블을 만든다.
- SELECT/INSERT(추가로 UPDATE/DELETE)에 `auth.uid() = user_id` 정책을 작성해 **본인 데이터만** 다루게 한다.
- 서로 다른 두 계정(A·B)으로 번갈아 로그인해, **B로 로그인하면 A의 메모가 0건**으로 막히는 것을 눈으로 확인한다(= 인가 검증).
- `using`(읽기/수정/삭제 판단)과 `with check`(넣기/바꾼 결과 판단)의 차이를 익힌다.

## 따라하는 단계
1. [supabase.com](https://supabase.com)에서 프로젝트를 하나 만든다(부트캠프에서 한 방식 그대로).
2. **Settings → API**에서 `Project URL`과 **publishable(anon) 키**를 복사해, 이 폴더 `index.html` 위쪽의 `SUPABASE_URL` / `SUPABASE_ANON_KEY` 두 줄을 내 값으로 바꾼다. (절대 `service_role`/secret 키를 넣지 말 것 — RLS를 우회해 검증 자체가 무의미해진다)
3. (편의 설정) **Authentication → Providers → Email** 에서 실습 동안 "Confirm email"을 잠시 꺼두면, 이메일 인증 없이 바로 로그인해 검증할 수 있다.
4. **SQL Editor**를 열고 `schema.sql`의 **1단계 + 2단계 블록**을 실행한다. → `my_notes` 테이블이 생기고 RLS가 켜진 뒤, "본인 것만" 정책 4종이 붙는다.
5. `index.html`을 브라우저로 열고 **①에서 A 계정으로 가입 → 로그인**한다(예: `a@test.com`). 화면 위 "현재 로그인"이 A 이메일로 바뀌는지 확인한다.
6. **②에서 메모 추가**를 1~2번 한다(예: "A의 비밀 메모"). user_id 는 입력하지 않아도 `default auth.uid()` 가 A로 자동 채운다.
7. **③에서 내 메모 조회**를 누른다. → A 메모만 보인다. **이 화면을 캡처한다(1번: A 로그인 = A 메모만).**
8. **①에서 로그아웃** → **B 계정으로 가입 → 로그인**한다(예: `b@test.com`). "현재 로그인"이 B로 바뀌는지 확인한다.
9. **③에서 내 메모 조회**를 다시 누른다. → A의 메모는 한 건도 안 보이고 **0건(또는 B가 넣은 것만)** 이 나온다. **이 화면을 캡처한다(2번: B 로그인 = A 메모 0건, 차단 증거).**

## 🤖 바이브코딩 프롬프트
이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다. (Supabase 프로젝트를 먼저 만들고, anon 키만 준비해 두세요.)

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 Supabase 보안 실습을 도와주는 조수야. 비전공자가 이해하도록 도와줘.
  목표: "로그인한 사람마다 자기 메모만 보이게" 하는 RLS 실습용 SQL과 한 페이지짜리 HTML을 만들어줘.
  제약:
  - 테이블 my_notes(id, user_id uuid default auth.uid(), content text, created_at)을 만들고 RLS를 켜.
  - SELECT/INSERT/UPDATE/DELETE 4개 정책을 각각 만들어줘. 조건은 모두 auth.uid() = user_id.
    읽기/수정/삭제 판단은 using, 넣기/바꾼 결과 판단은 with check 로 구분해서 써줘.
  - HTML 한 파일(index.html)에 supabase-js v2를 esm.sh로 불러와서
    ① 이메일/비번 가입·로그인·로그아웃 ② 메모 추가(user_id는 보내지 말 것) ③ 내 메모 조회 UI를 넣어줘.
  - 키는 publishable(anon) 키만 쓰는 자리표시자로 두고, service_role(secret) 키는 절대 쓰지 마.
  산출물: schema.sql, index.html 두 파일. 각 줄이 무엇을 하고 왜 그렇게 했는지 한국어 주석으로 설명해줘.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  이어서 검증이 잘 보이도록 개선해줘.
  - 화면 맨 위에 "현재 로그인: (이메일)"을 항상 표시하고, 로그인/로그아웃 시 자동으로 갱신해줘.
  - 조회 버튼을 누르면 "읽힌 줄 수: N건"을 크게 보여주고, 0건일 때는
    "RLS가 남의 줄을 막았거나 이 계정엔 메모가 없음"이라는 안내를 띄워줘.
  - 추가/조회 결과 JSON을 화면에 그대로 보여줘서, user_id가 로그인한 사람마다 다른지 눈으로 확인하게 해줘.
  - A 계정/B 계정으로 번갈아 로그인해 검증하는 순서를 화면 안내문으로 적어줘.
  바꾼 부분마다 왜 그렇게 했는지 주석으로 설명해줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  메모 조회를 눌렀더니 로그인했는데도 항상 0건이 나와. 아래 정보를 보고 단계별로 원인을 찾아줘.
  - 내가 실행한 schema.sql 전체: (여기에 붙여넣기)
  - 브라우저 콘솔(F12)에 뜬 에러 메시지: (여기에 붙여넣기)
  - SQL Editor에서 select * from pg_policies where tablename='my_notes'; 결과: (여기에 붙여넣기)
  원인 후보(정책 누락, RLS는 켰는데 SELECT 정책이 없음, anon 키 오타, 로그인 안 됨, user_id가 안 채워짐)를
  하나씩 어떻게 확인하는지 알려주고, 고친 SQL/코드를 이유 주석과 함께 줘.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다.

## 검증법
- 7번과 9번 캡처를 나란히 두었을 때, **같은 페이지·같은 anon 키인데** 로그인 계정만 바꿨더니 A 메모가 **보임 → 0건**으로 막혔는가? (이게 제출물의 핵심 비교 캡처입니다.)
- B로 로그인한 상태에서 조회 줄 수가 **A가 넣은 만큼 줄지 않고 0건**인가? (정책이 `auth.uid() = user_id` 로 남의 행을 거른 증거.)
- B로 로그인해 메모를 추가하면 그 줄의 `user_id` 가 **B의 ID**로 들어가는가? (③ 조회 결과 JSON에서 user_id 확인 — A와 다른 값이어야 정상.)
- SQL Editor에서 `select * from pg_policies where tablename = 'my_notes';` 결과에 정책 **4줄(select/insert/update/delete)** 이 보이는가?
- `index.html` 코드 어디에도 `service_role` / `sb_secret_` 문자열이 없는가? (F12 → Sources에서 검색해 **0건**이어야 정상.)

!!! warning "검증은 'SQL Editor'가 아니라 '로그인한 브라우저'에서"
    SQL Editor는 관리자 권한(service_role급)으로 도는 경우가 많아 **RLS를 우회**할 수 있습니다. 그래서 SQL Editor에서 `select * from my_notes` 를 하면 남의 줄까지 다 보일 수 있어요. 정책이 진짜 막는지는 반드시 `index.html` 을 anon 키로 열어 **A 계정 / B 계정으로 번갈아 로그인**해서 확인하세요.

!!! danger "비밀값은 자리표시자 / service_role 금지"
    페이지에 넣는 건 **publishable(anon) 키**뿐입니다. `service_role`(secret) 키는 RLS를 통째로 우회하는 "마스터키"라, 브라우저나 GitHub에 두면 정책을 아무리 잘 써놔도 누구나 모든 데이터를 가져갑니다. 비밀번호도 실제로 쓰는 비번 대신 실습용 자리표시자를 쓰고, 실제 secret 키는 서버 전용 환경변수에만 보관하세요.

!!! tip "왜 user_id 를 직접 안 넣어도 되나요?"
    테이블에 `user_id uuid default auth.uid()` 를 줬기 때문입니다. INSERT 할 때 user_id 를 비워두면 DB가 "지금 로그인한 사람"으로 자동 채웁니다. 그리고 `with check (auth.uid() = user_id)` 가 있어서, 누가 남의 ID를 억지로 끼워 넣으려 해도 막힙니다.

## 관련 가이드
- 이 실습의 개념 본문 → [RLS(행 수준 보안) — 출입증을 공개해도 안전한 진짜 이유](../../docs/04-security/02.md)
- `auth.uid()`가 답하는 "누구냐 vs 뭘 해도 되냐" → [인증 vs 인가 — '누구냐'와 '뭘 해도 되냐'는 다른 질문](../../docs/04-security/04.md)
- 키 두 종류 정정 → [공개해도 되는 키 vs 절대 숨길 키 (anon/publishable vs service_role/secret)](../../docs/04-security/01.md)
- 보안 권 전체 보기 → [4. 안전(보안)](https://zeusk302-png.github.io/treasure/04-security/)
- 먼저 해보면 좋은 실습 → 실습 300 "Supabase 테이블에 RLS 켜기" (`examples/300`)
