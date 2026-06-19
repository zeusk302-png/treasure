# 실습 143 — 회원정보 수정: 닉네임·프로필을 안전하게 바꾸기 (profiles + RLS)

회원마다 **닉네임/한 줄 소개**를 저장하는 `profiles` 테이블을 만들고, 마이페이지에서 그 값을 **수정**합니다. 핵심은 "**본인만 자기 프로필을 고칠 수 있게**" 만드는 것입니다. 그 비결은 화면 코드(`mypage.html`)가 아니라 **데이터베이스에 켜 둔 RLS(행 수준 보안, Row Level Security)** 에 있습니다.

핵심 아이디어 한 줄: 우리 코드는 그냥 "내 프로필 줘 / 내 프로필 저장해"라고만 요청합니다. `where id = 나` 같은 필터를 **우리가 쓰지 않습니다.** "내 것만" 다루도록 막는 일은 데이터베이스가 `auth.uid() = id` 규칙으로 **자동으로** 해줍니다. 그래서 프론트엔드 코드를 아무리 뜯어봐도 "남의 프로필을 고치는 길"이 없습니다.

- **`auth.uid()`** = 지금 로그인한 사람의 고유 id (로그인 안 했으면 `null`)
- **`profiles.id`** = 그 프로필 한 줄의 '주인' id (로그인 사용자와 1:1로 묶임)
- 두 값이 같은 행만 통과 → **남의 프로필은 읽지도, 고치지도 못합니다.**

> 참고: 이메일·비밀번호 같은 '로그인 정보'를 바꾸려면 `db.auth.updateUser({ ... })`를 씁니다. 이건 Supabase의 인증(auth) 시스템이 보관하는 값입니다. 이번 실습의 닉네임/소개는 그것과 **별개로 우리가 직접 만든** `profiles` 테이블의 값이라, `db.from('profiles').upsert(...)`로 다룹니다.

이번 실습의 결과물은 **로그인 후 본인 프로필만 보이고 본인만 고칠 수 있는 `mypage.html`** 과 **그걸 가능하게 하는 `profiles` RLS 정책 `schema.sql`** 입니다.

## 목표
- 회원마다 한 줄씩 갖는 `profiles` 테이블을 만들고, 마이페이지에서 닉네임을 **수정**할 수 있다.
- `auth.uid() = id` 정책으로 **본인 행만** 읽고/만들고/고치도록 RLS로 잠근다.
- `using`(고칠 대상 행 조건)과 `with check`(고친 뒤에도 내 것이어야 한다는 조건)의 차이를 안다.
- **anon(공개) 키만으로도** 안전한 이유가 "키를 숨겨서"가 아니라 **"RLS가 행을 지켜서"** 임을 체감한다.
- `service_role`(secret) 키는 RLS를 **통째로 우회**하므로 브라우저에 두면 안 된다는 원칙을 안다.
- (보너스) 회원가입 시 빈 프로필을 자동으로 만들어 두는 **트리거**의 역할을 이해한다.

## 따라하는 단계
1. 앞 실습에서 만든 **Supabase 프로젝트**를 그대로 쓴다. 없으면 [supabase.com](https://supabase.com)에서 새 프로젝트를 하나 만든다.
2. (편하게 테스트하려면) Supabase 대시보드 → **Authentication → Providers → Email**에서 **"Confirm email"(이메일 인증)을 잠깐 꺼 둔다.** 그러면 회원가입 즉시 로그인됩니다. (실제 서비스에선 켜는 게 맞습니다.)
3. 대시보드 → **SQL Editor**에 이 폴더의 `schema.sql`을 통째로 붙여넣고 **[Run]** → `profiles` 테이블 + RLS 정책 4개 + 빈 프로필 자동 생성 트리거가 만들어진다.
4. 대시보드 → **Settings → API**에서 `Project URL`과 `anon`(publishable) 키를 복사한다.
5. `supabase.js` 위쪽의 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 두 값을 내 값으로 바꾼다. (코드의 `https://여기에-...`, `sb_publishable_...`는 **자리표시자**다. 절대 `service_role` 키를 넣지 말 것!)
6. 로컬 서버(예: VS Code Live Server)로 **`mypage.html`을 연다.** (일관성을 위해 `http://`로 여는 습관을 들이자.)
7. **회원가입** 버튼으로 계정(예: `a@test.com`)을 만들고 로그인한다.
8. **닉네임**과 **한 줄 소개**를 적고 **[저장]**을 누른다. → 위 미리보기 카드의 이름·소개·아바타 글자가 바뀐다.
9. **새로고침** 해도 방금 저장한 값이 그대로 보인다(데이터베이스에 저장됐다는 증거).
10. **로그아웃** 후, 다른 계정(예: `b@test.com`)으로 회원가입·로그인한다. → a의 닉네임은 **안 보이고** 빈 프로필이 보인다. b로 다른 닉네임을 저장해 본다.
11. 다시 **a 계정으로 로그인** → b가 아닌 **a의 닉네임**만 그대로 보인다. 같은 테이블인데 서로 못 본다 = RLS가 일하는 것!

## 🤖 바이브코딩 프롬프트
이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다. (Supabase 프로젝트 URL/anon 키는 내 값으로 바꿔 넣으세요.)

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 Supabase를 쓰는 웹 초보의 멘토야. 회원마다 닉네임/한 줄 소개를 저장하는
  '마이페이지'를 만들려고 해. 비전공자가 이해할 수 있게 단계별로 도와줘.

  [목표]
  - profiles 테이블(id uuid PK = auth.users.id, nickname text, bio text, updated_at timestamptz)을
    만드는 SQL을 줘. id의 default는 auth.uid()로 해줘.
  - RLS(행 수준 보안)를 켜고, '로그인한 본인 행만' select/insert/update 할 수 있는
    정책 3개를 auth.uid() = id 조건으로 만들어줘. (update는 using과 with check 둘 다)
  - 정적인 mypage.html + style.css + supabase.js로 화면을 만들어줘.
    로그인 전엔 로그인/회원가입 폼, 로그인 후엔 내 닉네임 미리보기 카드 + 수정 폼이 보이게.

  [제약]
  - 브라우저 코드에는 anon(publishable) 키만 넣고, service_role 키는 절대 넣지 마.
  - 프론트에서 where id = ... 같은 필터를 직접 쓰지 마. '내 것만' 거르는 건 RLS가 하게 해줘.
  - 사용자 입력을 화면에 표시할 땐 innerHTML 말고 textContent를 써(XSS 방지).

  [산출물] schema.sql, mypage.html, style.css, supabase.js. 각 줄에 한국어 주석을 달고
  "왜 그렇게 했는지"도 함께 적어줘.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  방금 만든 마이페이지에 기능을 더해줘. 기존 코드와 RLS 정책은 깨지 않게 해줘.

  - 저장 버튼은 upsert(있으면 update, 없으면 insert)로 동작하게 해줘. id는
    currentUser.id를 명시하고, RLS의 auth.uid() = id 덕분에 내 줄만 처리되는지 설명해줘.
  - 회원가입 시 빈 프로필을 자동으로 만들어주는 트리거(handle_new_user)를 추가해줘.
    이게 왜 security definer여야 하는지 주석으로 설명해줘.
  - 닉네임 첫 글자를 아바타에 보여주고, 닉네임 maxlength 20 / 소개 maxlength 100 제한을 넣어줘.
  - 저장/불러오기 중·성공·실패 상태를 사용자에게 메시지로 보여줘.
  바꾼 부분마다 왜 그렇게 했는지 주석으로 설명해줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  마이페이지가 예상과 다르게 동작해. 아래 증상과 콘솔 에러를 보고 원인을 추측한 뒤,
  한 번에 하나씩 확인할 수 있는 진단 순서를 알려줘. (나는 비전공자야.)

  [증상] (예: 저장은 되는데 새로고침하면 사라진다 / 다른 계정 닉네임이 보인다 /
          저장 시 "new row violates row-level security policy" 에러가 뜬다)
  [콘솔/네트워크 에러] (여기에 빨간 에러 메시지를 그대로 붙여넣기)

  특히 이것들을 체크하는 법을 알려줘:
  - RLS가 켜져 있는지, 정책 3개(select/insert/update)가 다 있는지
  - upsert에 보낸 id가 정말 로그인한 사용자의 id와 같은지
  - anon 키 자리에 실수로 service_role 키를 넣지 않았는지
  - to authenticated 정책이라 로그아웃 상태에선 빈 결과가 정상인지
  원인을 찾으면 왜 그게 원인인지도 한 줄로 설명해줘.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다.

## 검증법
- 닉네임을 저장하고 **새로고침** 했을 때 그대로 남아 있는가? (DB 저장 성공)
- 계정 a로 저장한 닉네임이, 계정 b로 로그인하면 **안 보이는가?** (행 격리 성공)
- 대시보드 → **Table Editor → `profiles`** 에 a와 b의 줄이 **함께** 들어 있는가? (한 테이블을 공유한다는 증거 — 화면에서만 갈라 보인 것)
- (콘솔 공격 실험 ① 읽기) 개발자도구 → **Console**에서 로그인한 채 `await db.from('profiles').select('*')` → **내 줄만** 온다. 로그아웃 후 같은 명령 → **빈 배열 `[]`**. (익명에게는 통과할 정책이 없어서)
- (콘솔 공격 실험 ② 남의 프로필 고치기) Console에서 일부러 남의 id를 끼워 `await db.from('profiles').update({ nickname: '해킹' }).eq('id', '00000000-0000-0000-0000-000000000000')` 를 실행해도 **0줄만 바뀐다**(남의 행은 애초에 보이지도 않으니 고를 수도 없음). 즉 화면에 없어도 **서버가 막는다.**
- (콘솔 공격 실험 ③ 주인 바꿔치기) `await db.from('profiles').update({ id: '남의-uuid' }).eq('id', '내-uuid')` 처럼 내 행의 주인을 남으로 바꾸려 하면 **`with check` 정책에 막혀 에러**가 난다.
- **RLS를 끄면 어떻게 될까 테스트:** SQL Editor에서 `alter table profiles disable row level security;` 실행 → 위 콘솔 공격이 **먹힌다(=위험).** 확인했으면 **즉시** `alter table profiles enable row level security;` 로 **다시 켜라.**

## 한눈에 보는 핵심
RLS는 "기본 차단 → 정책으로 통과 허용" 구조이고, '수정'은 `using` + `with check` 두 조건을 함께 봅니다.
```sql
-- 1) 켜면: 아무 정책도 없는 한 전부 막힘
alter table profiles enable row level security;

-- 2) '수정' 정책: 고칠 대상도 내 것(using), 고친 뒤에도 내 것(with check)
create policy "본인 프로필만 수정"
  on profiles for update to authenticated
  using (auth.uid() = id)        -- 어떤 행을 고를 수 있나
  with check (auth.uid() = id);  -- 고친 결과가 여전히 내 것인가
```
```js
// 프론트는 그냥 "내 프로필 저장해"라고만 한다. '내 것만'은 DB(RLS)가 보장한다.
await db.from('profiles').upsert({ id: user.id, nickname: '새 닉네임' });
```

## ⚠️ 보안 메모 — anon(공개) vs service_role(비밀) + RLS
- 브라우저(`supabase.js`)에 넣는 건 **anon(publishable) 키 하나뿐**입니다. anon 키는 "공개돼도 되는 **출입증**"이라 GitHub·브라우저에 있어도 괜찮습니다. (코드의 `sb_publishable_...`는 자리표시자이니 내 값으로 바꿔 쓰세요.)
- anon 키가 공개돼도 안전한 **진짜 이유는 키를 숨겨서가 아니라 RLS** 때문입니다. 키를 들고 있어도, 정책이 허락한 **내 프로필** 말고는 한 줄도 못 고칩니다. 화면에서 수정 폼을 숨기는 건 'UI 친절'일 뿐, 진짜 방어는 **서버의 RLS**입니다.
- `service_role`(secret) 키는 모든 **RLS를 통째로 우회**하는 마스터키입니다. 이걸 브라우저나 깃허브에 두면 누구나 모든 사람의 프로필을 마음대로 고칠 수 있습니다. **절대 프론트엔드에 두지 말고**, 서버(n8n·엣지 함수)에서 **환경변수**로만 쓰세요. (브라우저에 들어가는 비밀값은 언제나 자리표시자로 둡니다.)
- 기억할 한 쌍: **로그인 = '누구인지' 확인(인증)** / **RLS = '그 사람이 어떤 행을 고쳐도 되는지' 결정(인가)**.

## 더 배우기
- 개념: [4. 안전(보안) — 키와 RLS](https://zeusk302-png.github.io/treasure/04-security/)
- 개념: [RLS — 출입증을 공개해도 안전한 진짜 이유](https://zeusk302-png.github.io/treasure/04-security/02/)
- 개념: [공개해도 되는 키 vs 절대 숨길 키 (anon vs service_role)](https://zeusk302-png.github.io/treasure/04-security/01/)
- 개념: [인증 vs 인가 — '누구냐'와 '뭘 해도 되냐'는 다른 질문](https://zeusk302-png.github.io/treasure/04-security/04/)
- 함께 보기: 실습 141 — 비밀 메모장(본인 데이터만 보기)(`examples/141/`), 실습 142 — 두 계정 교차 검증(`examples/142/`), 실습 144 — 역할(role) 기반 화면 분기(`examples/144/`)
