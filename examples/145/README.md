# 실습 145 — 관리자만 들어가는 회원 목록 페이지 (역할 + RLS 종합)

이 실습은 인증·권한 트랙의 **마지막 종합편**입니다. `profiles` 테이블에 **역할(role)** 칸을 두고, **RLS 정책이 그 역할을 직접 검사**해서 누가 어떤 줄을 봐도 되는지 데이터베이스가 결정하게 만듭니다.

핵심 한 줄: 우리 화면 코드는 그냥 **"회원 다 줘"** 라고만 요청합니다. `where role = ...` 같은 권한 필터를 **우리가 쓰지 않습니다.** "관리자에게는 전부, 일반회원에게는 자기 한 줄만" 걸러주는 일은 데이터베이스가 RLS로 **자동으로** 합니다.

- **관리자(admin)** 로 로그인 → 전체 회원 목록이 보인다.
- **일반회원(user)** 이 `admin.html` 주소를 알아내 직접 들어와도 → DB가 **자기 한 줄밖에** 안 내준다. URL로 뚫기 불가!

보안이 **두 겹**인 점이 이번 실습의 가장 중요한 교훈입니다.

| 겹 | 무엇 | 역할 | 뚫리면? |
|----|------|------|---------|
| (1) 화면 가드 | "관리자가 아니면 '권한 없음' 안내를 보여줌" | **편의**(친절한 안내) | 코드를 뜯으면 우회 가능 — 하지만 데이터는 안 샘 |
| (2) DB의 RLS | "관리자가 아니면 다른 줄을 아예 안 내줌" | **진짜 보안** | 우회 불가 (DB가 끝까지 지킴) |

이번 실습의 결과물은 **관리자 전용 회원 목록 `admin.html`** 과 **역할을 검사하는 RLS 정책 `schema.sql`** 입니다.

## 목표
- `profiles.role` 값을 RLS 정책 안에서 검사해 **역할 기반 접근 통제(RBAC)** 를 구현한다.
- `using (auth.uid() = id or is_admin())` 처럼 **OR 조건**으로 "내 줄은 누구나 / 전부는 관리자만"을 한 정책에 담는 법을 안다.
- RLS 정책이 자기 테이블을 다시 조회할 때 생기는 **무한 반복(recursion)** 문제를, `security definer` **함수(`is_admin()`)** 로 끊는 정석 패턴을 익힌다.
- **화면 가드(편의)** 와 **DB의 RLS(진짜 보안)** 의 차이를 체감한다 — 일반회원이 URL로 직접 들어와도 데이터가 막히는지 두 눈으로 확인한다.
- 일반회원이 자기 `role`을 `admin`으로 바꿔 **권한을 훔치는(privilege escalation)** 것까지 막는 법을 안다.
- **anon(공개) 키만으로도** 안전한 이유가 "키를 숨겨서"가 아니라 **"RLS가 역할을 검사해서"** 임을 이해한다.

## 따라하는 단계
1. 앞 실습(143·144)에서 만든 **Supabase 프로젝트**를 그대로 쓴다. 없으면 [supabase.com](https://supabase.com)에서 새 프로젝트를 만든다.
2. (편하게 테스트하려면) 대시보드 → **Authentication → Providers → Email**에서 **"Confirm email"(이메일 인증)을 잠깐 꺼 둔다.** 회원가입 즉시 로그인됩니다. (실제 서비스에선 켜는 게 맞습니다.)
3. 대시보드 → **SQL Editor**에 이 폴더의 `schema.sql`을 통째로 붙여넣고 **[Run]** → `profiles` 테이블, `is_admin()` 함수, 역할 검사 RLS 정책, 권한 상승 방지 트리거가 만들어진다.
4. 대시보드 → **Settings → API**에서 `Project URL`과 `anon`(publishable) 키를 복사한다.
5. `supabase.js` 위쪽의 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 두 값을 내 값으로 바꾼다. (코드의 `https://여기에-...`, `sb_publishable_...`는 **자리표시자**다.)
6. 로컬 서버(예: VS Code Live Server)로 **`admin.html`을 연다.**
7. **회원가입**으로 계정 두 개를 만든다 — 예: `admin@test.com`(관리자가 될 계정)과 `user@test.com`(일반회원으로 남길 계정). 둘 다 가입하면 `profiles`에 두 줄이 생긴다. (기본 역할은 모두 `user`)
8. 나를 **관리자로 임명**한다. SQL Editor에서 `schema.sql` 8번의 주석을 풀고 이메일을 바꿔 실행:
   ```sql
   update profiles set role = 'admin' where email = 'admin@test.com';
   ```
9. `admin@test.com` 으로 **로그인** → **전체 회원 목록(2명)** 이 보인다. 헤더에 "관리자" 배지가 뜬다.
10. **로그아웃** 후 `user@test.com` 으로 **로그인** → 목록 대신 **"🚫 접근 권한이 없습니다"** 화면이 뜬다. (화면 가드가 막은 것)

## 검증법
- **관리자 vs 일반회원:** `admin@test.com`은 전체 목록(2명)이 보이고, `user@test.com`은 "권한 없음" 화면이 뜨는가?
- **★ 핵심 — URL/콘솔로 직접 뚫어 보기(진짜 보안 검증):** `user@test.com`으로 로그인한 채 개발자도구 → **Console**에서 화면 가드를 건너뛰고 직접 데이터를 요청해 본다:
  ```js
  await db.from('profiles').select('*')
  ```
  → **자기 한 줄만** 돌아온다. (관리자 줄·다른 회원 줄은 안 옴) 화면 가드를 우회해도 **DB의 RLS가 데이터를 막는다**는 증거다. 같은 명령을 관리자로 로그인해 실행하면 **모든 줄**이 온다.
- **로그아웃 상태:** 로그아웃하고 같은 `select('*')`를 실행하면 **빈 배열 `[]`** 이 온다. (로그인 안 한 익명에게는 통과할 정책이 없어서)
- **권한 훔치기 차단:** `user@test.com`으로 로그인한 채 Console에서 자기를 관리자로 올려 보려고 시도한다:
  ```js
  await db.from('profiles').update({ role: 'admin' }).eq('id', (await db.auth.getUser()).data.user.id)
  ```
  → **트리거(`prevent_role_change`)에 막혀 에러**가 난다. 일반회원은 스스로 admin이 될 수 없다.
- **무한 반복(recursion)이 안 나는지:** 만약 `is_admin()` 함수 없이 정책 안에서 `profiles`를 직접 조회했다면 "infinite recursion detected in policy" 에러가 났을 것이다. `security definer` 함수로 빼서 그 문제가 사라졌음을 기억하자.
- **RLS를 끄면 어떻게 될까(위험 확인):** SQL Editor에서 `alter table profiles disable row level security;` 실행 → `user@test.com`으로 Console에서 `select('*')`를 하면 갑자기 **전체 회원이 다 보인다.** 위험을 확인했으면 즉시 `alter table profiles enable row level security;` 로 **다시 켜라.**

## 한눈에 보는 핵심
역할 검사를 정책에 넣되, 반복을 끊는 함수를 거칩니다.
```sql
-- 1) "지금 로그인한 사람이 admin인가?"를 RLS 밖에서 판정하는 함수 (반복 방지)
create function public.is_admin() returns boolean
  language sql security definer stable
as $$ select exists (
  select 1 from public.profiles where id = auth.uid() and role = 'admin'
); $$;

-- 2) 읽기 정책: 내 줄은 누구나, 전부는 관리자만 (OR)
create policy "본인 또는 관리자 읽기"
  on profiles for select to authenticated
  using ( auth.uid() = id or public.is_admin() );
```
```js
// 프론트는 그냥 "회원 다 줘"라고만 한다. 누가 무엇을 보는지는 DB(RLS)가 정한다.
const { data } = await db.from('profiles').select('*');
// → 관리자면 전체, 일반회원이면 자기 한 줄만 온다.
```

## ⚠️ 보안 메모 — anon(공개) vs service_role(비밀) + 역할 RLS
- 브라우저(`supabase.js`)에 넣는 건 **anon(publishable) 키 하나뿐**입니다. anon 키는 "공개돼도 되는 **출입증**"이라 GitHub·브라우저에 있어도 괜찮습니다. (코드의 `sb_publishable_...`는 자리표시자이니 내 값으로 바꿔 쓰세요.)
- anon 키가 공개돼도 안전한 **진짜 이유는 키를 숨겨서가 아니라 RLS**(역할 검사) 때문입니다. 키를 들고 있어도, 정책이 허락한 줄(내 줄, 또는 내가 관리자면 전부) 말고는 못 봅니다.
- **`service_role`(secret) 키는 RLS와 트리거를 통째로 우회**하는 마스터키입니다. 이걸 브라우저나 깃허브에 두면 누구나 전체 회원 목록을 읽고 누구든 admin으로 바꿀 수 있습니다. **절대 프론트엔드에 두지 말고**, 서버(n8n·엣지 함수)에서 **환경변수**로만 쓰세요. (브라우저에 들어가는 비밀값은 언제나 자리표시자로 둡니다.)
- **화면 가드 ≠ 보안:** `admin.html`이 "권한 없음"을 보여주는 건 **편의**일 뿐입니다. 진짜 자물쇠는 **DB의 RLS**입니다. UI만 믿고 RLS를 빼면, URL·콘솔로 데이터가 새어 나갑니다. ('UI 가짜 보안' vs 'DB 진짜 보안' — 실습 142의 교훈)
- 기억할 한 쌍: **로그인 = '누구인지' 확인(인증, authentication)** / **역할 RLS = '그 사람이 어떤 줄을 봐도 되는지' 결정(인가, authorization)**.

## 더 배우기
- 개념: [4. 안전(보안) — 키와 RLS](https://zeusk302-png.github.io/treasure/04-security/)
- 개념: [RLS — 출입증을 공개해도 안전한 진짜 이유](https://zeusk302-png.github.io/treasure/04-security/02/)
- 개념: [공개해도 되는 키 vs 절대 숨길 키 (anon vs service_role)](https://zeusk302-png.github.io/treasure/04-security/01/)
- 개념: [인증 vs 인가 — '누구냐'와 '뭘 해도 되냐'는 다른 질문](https://zeusk302-png.github.io/treasure/04-security/04/)
- 함께 보기: 실습 141 — 비밀 메모장 RLS(`examples/141/`), 실습 142 — 두 계정 교차 검증(`examples/142/`), 실습 143 — 회원정보 수정(`examples/143/`), 실습 144 — 역할 기반 UI 분기(`examples/144/`)
