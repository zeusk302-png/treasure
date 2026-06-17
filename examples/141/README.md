# 실습 141 — 내 메모만 보이는 '비밀 메모장' (RLS로 본인 데이터만 보기)

여러 사람이 **같은 `memos` 테이블 하나**를 함께 쓰는데도, 화면에는 **로그인한 본인의 메모만** 나오게 만듭니다. 비결은 화면 코드(`memo.html`)가 아니라 **데이터베이스에 켜 둔 RLS(행 수준 보안, Row Level Security)** 에 있습니다.

핵심 아이디어 한 줄: 우리 코드는 그냥 "내 메모 다 줘"라고만 요청합니다. `where user_id = 나` 같은 필터를 **우리가 쓰지 않습니다.** "내 것만" 걸러주는 일은 데이터베이스가 `auth.uid() = user_id` 규칙으로 **자동으로** 해줍니다. 그래서 프론트엔드 코드를 아무리 뜯어봐도 "남의 메모를 가져오는 길"이 없습니다.

- **`auth.uid()`** = 지금 로그인한 사람의 고유 id (로그인 안 했으면 `null`)
- **`user_id`** = 그 메모 한 줄의 '주인' id
- 두 값이 같은 행만 통과 → **남의 메모는 애초에 결과에 안 나오고, 끼워 넣거나 지우는 것도 막힙니다.**

이번 실습의 결과물은 **로그인 후 본인 메모만 보이는 `memo.html`** 과 **그걸 가능하게 하는 RLS 정책 `schema.sql`** 입니다.

## 목표
- 같은 테이블을 공유해도 **행(row) 단위로 사람을 격리**하는 RLS의 작동을 눈으로 본다.
- `alter table ... enable row level security` 로 **기본은 전부 차단**이 되고, **정책(policy)** 으로 허락한 행만 통과한다는 흐름을 이해한다.
- `using`(읽기/삭제 대상 조건)과 `with check`(작성/수정 시 새 행 조건)의 차이를 안다.
- **anon(공개) 키만으로도** 안전한 이유가 "키를 숨겨서"가 아니라 **"RLS가 행을 지켜서"** 임을 체감한다.
- `service_role`(secret) 키는 RLS를 **통째로 우회**하므로 브라우저에 두면 안 된다는 원칙을 안다.

## 따라하는 단계
1. 앞 실습에서 만든 **Supabase 프로젝트**를 그대로 쓴다. 없으면 [supabase.com](https://supabase.com)에서 새 프로젝트를 하나 만든다.
2. (편하게 테스트하려면) Supabase 대시보드 → **Authentication → Providers → Email**에서 **"Confirm email"(이메일 인증)을 잠깐 꺼 둔다.** 그러면 회원가입 즉시 로그인됩니다. (실제 서비스에선 켜는 게 맞습니다.)
3. 대시보드 → **SQL Editor**에 이 폴더의 `schema.sql`을 통째로 붙여넣고 **[Run]** → `memos` 테이블과 RLS 정책 4개가 생긴다.
4. 대시보드 → **Settings → API**에서 `Project URL`과 `anon`(publishable) 키를 복사한다.
5. `supabase.js` 위쪽의 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 두 값을 내 값으로 바꾼다. (코드의 `https://여기에-...`, `sb_publishable_...`는 **자리표시자**다.)
6. 로컬 서버(예: VS Code Live Server)로 **`memo.html`을 연다.** (메모 자체는 `file://`로도 되지만, 일관성을 위해 `http://`로 여는 습관을 들이자.)
7. **회원가입** 버튼으로 첫 계정(예: `a@test.com`)을 만들고 로그인한다. 메모를 2~3개 적어 본다.
8. **로그아웃** 후, 다른 계정(예: `b@test.com`)으로 새로 회원가입·로그인한다. → **a의 메모가 하나도 안 보인다.** b로 새 메모를 적는다.
9. 다시 **a 계정으로 로그인** → b의 메모는 안 보이고 **a의 메모만** 그대로 보인다. 같은 테이블인데 서로 못 본다 = RLS가 일하는 것!

## 검증법
- 계정 a로 적은 메모가, 계정 b로 로그인했을 때 **하나도 안 보이는가?** (행 격리 성공)
- 대시보드 → **Table Editor → `memos`** 에는 a와 b의 줄이 **함께** 들어 있는가? (한 테이블을 공유한다는 증거 — 화면에서만 갈라 보인 것)
- **RLS를 끄면 어떻게 될까 테스트:** SQL Editor에서 `alter table memos disable row level security;` 실행 → `memo.html`을 새로고침하면 갑자기 **남의 메모까지 다 보인다.** 위험을 확인했으면 즉시 `alter table memos enable row level security;` 로 **다시 켜라.**
- (콘솔 실험) 개발자도구 → **Console**에서 로그인한 채 `await db.from('memos').select('*')` 를 실행하면 **내 줄만** 돌아온다. 로그아웃 후 같은 명령을 실행하면 **빈 배열 `[]`** 이 온다. (로그인 안 한 익명에게는 통과할 정책이 없어서)
- (작성 검사) Console에서 일부러 남의 id를 끼워 `await db.from('memos').insert({ content: '몰래', user_id: '00000000-0000-0000-0000-000000000000' })` 를 실행하면, **`with check` 정책에 막혀 에러**가 난다.

## 한눈에 보는 핵심
RLS는 "기본 차단 → 정책으로 통과 허용" 구조입니다.
```sql
-- 1) 켜면: 아무 정책도 없는 한 전부 막힘
alter table memos enable row level security;

-- 2) 정책으로 "내 행만" 열어줌 (auth.uid() = 지금 로그인한 사람)
create policy "본인 메모만 읽기"
  on memos for select to authenticated
  using (auth.uid() = user_id);
```
```js
// 프론트는 그냥 "다 줘"라고만 한다. '내 것만'은 DB(RLS)가 알아서 골라준다.
const { data } = await db.from('memos').select('*'); // → 내 메모만 옴
```

## ⚠️ 보안 메모 — anon(공개) vs service_role(비밀) + RLS
- 브라우저(`supabase.js`)에 넣는 건 **anon(publishable) 키 하나뿐**입니다. anon 키는 "공개돼도 되는 **출입증**"이라 GitHub·브라우저에 있어도 괜찮습니다. (코드의 `sb_publishable_...`는 자리표시자이니 내 값으로 바꿔 쓰세요.)
- anon 키가 공개돼도 안전한 **진짜 이유는 키를 숨겨서가 아니라 RLS** 때문입니다. 키를 들고 있어도, 정책이 허락한 **내 행** 말고는 한 줄도 못 봅니다.
- `service_role`(secret) 키는 모든 **RLS를 통째로 우회**하는 마스터키입니다. 이걸 브라우저나 깃허브에 두면 누구나 모든 사람의 메모를 읽고 지울 수 있습니다. **절대 프론트엔드에 두지 말고**, 서버(n8n·엣지 함수)에서 **환경변수**로만 쓰세요. (브라우저에 들어가는 비밀값은 언제나 자리표시자로 둡니다.)
- 기억할 한 쌍: **로그인 = '누구인지' 확인(인증)** / **RLS = '그 사람이 어떤 행을 봐도 되는지' 결정(인가)**.

## 더 배우기
- 개념: [4. 안전(보안) — 키와 RLS](https://zeusk302-png.github.io/treasure/04-security/)
- 개념: [RLS — 출입증을 공개해도 안전한 진짜 이유](https://zeusk302-png.github.io/treasure/04-security/02/)
- 개념: [공개해도 되는 키 vs 절대 숨길 키 (anon vs service_role)](https://zeusk302-png.github.io/treasure/04-security/01/)
- 개념: [인증 vs 인가 — '누구냐'와 '뭘 해도 되냐'는 다른 질문](https://zeusk302-png.github.io/treasure/04-security/04/)
- 함께 보기: 실습 131 — 회원가입 폼(`examples/131/`), 실습 132 — 로그인 폼(`examples/132/`), 실습 138 — 보호된 페이지(`examples/138/`)
