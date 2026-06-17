# 실습 144 — 역할(role)에 따라 화면 나누기: 일반회원 vs 관리자

회원마다 **역할(role)** 을 두고, 같은 사이트인데도 **관리자(admin)** 에게는 '관리 메뉴'를 보여주고 **일반회원(user)** 에게는 숨깁니다. 이걸 **역할 기반 UI 분기**라고 합니다. 카페로 비유하면, 모두에게 똑같은 메뉴판을 주되 사장님(admin) 손님에게만 '카운터 들어가는 문'을 보여주는 것과 같습니다.

핵심 아이디어 한 줄: 화면은 `profiles` 테이블의 **`role` 값을 읽어** "admin이면 보여주고, 아니면 숨긴다"만 합니다. 그 값을 **'내 줄'만 안전하게 읽어오는 일**은 데이터베이스의 RLS(행 수준 보안, `auth.uid() = id`)가 해줍니다.

> ⚠️ 솔직하게 짚고 갈 점: **화면에서 버튼을 숨기는 건 '진짜 보안'이 아닙니다.** 일반회원이 주소창에 `admin.html`을 직접 쳐서 들어올 수 있으니까요. 이 실습의 `admin.html`은 들어올 때 역할을 한 번 더 검사해 막지만, 이것도 '화면 검사(클라이언트 가드)'일 뿐 완벽하지 않습니다. **진짜 방어 = 데이터 자체를 서버(RLS)에서 막는 것** 은 다음 [실습 145](../145/)에서 완성합니다. 이번 실습의 목표는 "**역할 값을 읽어 화면을 가르는 기본기**"입니다.

이번 실습의 결과물은 **역할에 따라 메뉴가 달라지는 헤더(`index.html`)** 와 **관리자만 통과하는 `admin.html`**, 그리고 **`role` 컬럼과 RLS·권한 상승 방지 트리거가 담긴 `schema.sql`** 입니다.

## 목표
- `profiles` 테이블에 `role` 컬럼(`'user'` / `'admin'`)을 두고, 새 회원은 자동으로 일반회원으로 시작하게 만든다.
- 화면(`index.html`)에서 내 `role` 값을 읽어 **관리자에게만 '관리 메뉴'를 보여주는** 분기를 구현한다.
- 관리자 전용 `admin.html`이 열릴 때 역할을 다시 검사해, 일반회원이 직접 들어와도 콘텐츠를 막는다.
- **anon(공개) 키만으로도** 역할 값을 안전하게 읽는 이유가 "키를 숨겨서"가 아니라 **"RLS가 내 줄만 돌려줘서"** 임을 안다.
- 일반회원이 스스로를 관리자로 올리지 못하도록(**권한 상승 방지**) DB 트리거로 `role` 직접 수정을 막는다.
- '화면에서 숨기기(UI 분기)'와 '서버에서 데이터 막기(RLS)'는 **다른 일**이며, 진짜 방어는 후자임을 이해한다.

## 따라하는 단계
1. 앞 실습에서 만든 **Supabase 프로젝트**를 그대로 쓴다. 없으면 [supabase.com](https://supabase.com)에서 새 프로젝트를 하나 만든다.
2. (편하게 테스트하려면) 대시보드 → **Authentication → Providers → Email**에서 **"Confirm email"(이메일 인증)을 잠깐 꺼 둔다.** 그러면 회원가입 즉시 로그인됩니다. (실제 서비스에선 켜는 게 맞습니다.)
3. 대시보드 → **SQL Editor**에 이 폴더의 `schema.sql`을 통째로 붙여넣고 **[Run]** → `profiles` 테이블 + `role` 컬럼 + RLS 정책 + 권한 상승 방지 트리거 + 빈 프로필 자동 생성 트리거가 만들어진다. (맨 아래 `update ... admin` 줄은 아직 임명할 사람이 없어 0줄이어도 정상이다.)
4. 대시보드 → **Settings → API**에서 `Project URL`과 `anon`(publishable) 키를 복사한다.
5. `supabase.js` 위쪽의 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 두 값을 내 값으로 바꾼다. (`https://여기에-...`, `sb_publishable_...`는 **자리표시자**다. 절대 `service_role` 키를 넣지 말 것!)
6. 로컬 서버(예: VS Code Live Server)로 **`index.html`을 연다.** (일관성을 위해 `http://`로 여는 습관을 들이자.)
7. **회원가입** 버튼으로 일반회원 계정(예: `user@test.com`)을 만들고 로그인한다. → 상단에 **관리 메뉴가 없고**, '일반회원 화면' 카드가 보인다.
8. 같은 방식으로 **관리자로 쓸 계정**(예: `admin@test.com`)도 **먼저 회원가입**해 둔다. (가입을 해야 `auth.users`에 줄이 생겨 임명할 수 있다.)
9. 대시보드 → **SQL Editor**로 가서 `schema.sql` 맨 아래의 임명 한 줄에서 이메일을 내 관리자 이메일로 바꿔 **다시 실행**한다:
   ```sql
   update profiles set role = 'admin'
   where id = (select id from auth.users where email = 'admin@test.com');
   ```
10. 다시 `index.html`에서 **로그아웃 후 `admin@test.com`으로 로그인** → 이번엔 상단에 **🔧 관리 메뉴**가 나타나고, '관리자 화면' 카드가 보인다.
11. **관리 메뉴**(또는 직접 `admin.html`)로 들어가 본다. → 관리자는 **관리자 대시보드**가 보이고, 일반회원으로 들어오면 **"접근 권한이 없습니다 🚫"** 로 막힌다.

## 검증법
- **일반회원** 계정으로 로그인하면 헤더에 **관리 메뉴가 안 보이는가?** 배지가 '일반회원'인가? (분기 성공)
- **관리자** 계정으로 로그인하면 헤더에 **관리 메뉴가 보이고** 배지가 '관리자'인가?
- 일반회원으로 로그인한 채 주소창에 **`admin.html`을 직접 입력**해서 들어가면 **"접근 권한이 없습니다"** 로 막히는가? (클라이언트 가드 동작)
- 로그아웃 상태에서 `admin.html`을 열면 **"로그인이 필요합니다"** 안내가 뜨는가?
- (콘솔 실험 ① 역할 읽기) 일반회원으로 로그인한 채 개발자도구 → **Console**에서 `await db.from('profiles').select('id, role')` → **내 줄(role: 'user') 하나만** 온다. 로그아웃 후 같은 명령 → **빈 배열 `[]`**. (RLS가 내 줄만 돌려준다는 증거)
- (콘솔 실험 ② ★권한 상승 막기★) 일반회원으로 로그인한 채 Console에서 스스로를 관리자로 올려본다: `await db.from('profiles').update({ role: 'admin' }).eq('id', (await db.auth.getUser()).data.user.id)` → **에러('역할(role)은 스스로 바꿀 수 없습니다.')** 가 나고 바뀌지 않는다. 즉 화면을 우회해도 **DB 트리거가 막는다.**
- (대시보드 확인) 대시보드 → **Table Editor → `profiles`** 에서 `user@test.com`은 `role=user`, `admin@test.com`은 `role=admin`으로 들어 있는가?
- **한계 확인(중요):** 이 실습의 `admin.html` 보호는 '화면 검사'일 뿐, 실제 회원 데이터를 막는 게 아니다. **진짜 데이터 보호는 [실습 145](../145/)의 역할 기반 RLS** 에서 완성된다.

## 한눈에 보는 핵심
역할 값은 RLS로 '내 줄'만 안전하게 읽고, 화면은 그 값으로 보일지 말지를 정합니다. 그리고 '내 역할은 내가 못 바꾸게' DB가 막습니다.
```sql
-- role 컬럼: 두 값만 허용, 기본은 일반회원
role text not null default 'user' check (role in ('user', 'admin'));

-- '내 역할은 내가 못 바꾼다' (권한 상승 방지 트리거)
create trigger guard_role_change before update on profiles
  for each row execute function public.prevent_role_change();
```
```js
// 화면은 '내 role 값'을 읽어 보일지 말지만 정한다. '내 줄만'은 RLS가 보장.
const { data } = await db.from("profiles").select("role").maybeSingle();
const isAdmin = (data?.role || "user") === "admin";
adminLink.hidden = !isAdmin;   // 관리자일 때만 관리 메뉴 보임
```

## ⚠️ 보안 메모 — anon(공개) vs service_role(비밀) + RLS
- 브라우저(`supabase.js`)에 넣는 건 **anon(publishable) 키 하나뿐**입니다. anon 키는 "공개돼도 되는 **출입증**"이라 GitHub·브라우저에 있어도 괜찮습니다. (코드의 `sb_publishable_...`는 자리표시자이니 내 값으로 바꿔 쓰세요.)
- anon 키가 공개돼도 안전한 **진짜 이유는 키를 숨겨서가 아니라 RLS** 때문입니다. 키를 들고 있어도 `select` 정책(`auth.uid() = id`)이 허락한 **내 줄(내 role)** 말고는 한 줄도 못 읽습니다.
- **'역할 임명'은 사람만 합니다.** 일반회원이 자기 `role`을 `admin`으로 바꾸는 일은 트리거가 막습니다. 관리자 임명은 신뢰할 수 있는 곳(대시보드 SQL Editor, 또는 서버의 `service_role`)에서만 해야 합니다.
- `service_role`(secret) 키는 모든 **RLS와 트리거를 통째로 우회**하는 마스터키입니다. 이걸 브라우저나 깃허브에 두면 누구나 자기를 관리자로 만들고 모든 데이터를 조작할 수 있습니다. **절대 프론트엔드에 두지 말고**, 서버(n8n·엣지 함수)에서 **환경변수**로만 쓰세요. (브라우저에 들어가는 비밀값은 언제나 자리표시자로 둡니다.)
- 기억할 한 쌍: **인증(로그인) = '누구인지' 확인** / **인가(역할·RLS) = '그 사람이 무엇을 봐도/해도 되는지' 결정**. 이번 실습은 인가의 첫걸음(화면 분기)이고, 데이터까지 막는 진짜 인가는 실습 145입니다.

## 더 배우기
- 개념: [4. 안전(보안) — 키와 RLS](https://zeusk302-png.github.io/treasure/04-security/)
- 개념: [인증 vs 인가 — '누구냐'와 '뭘 해도 되냐'는 다른 질문](https://zeusk302-png.github.io/treasure/04-security/04/)
- 개념: [RLS — 출입증을 공개해도 안전한 진짜 이유](https://zeusk302-png.github.io/treasure/04-security/02/)
- 개념: [공개해도 되는 키 vs 절대 숨길 키 (anon vs service_role)](https://zeusk302-png.github.io/treasure/04-security/01/)
- 함께 보기: 실습 143 — 회원정보 수정(본인만 고치기)(`examples/143/`), 실습 145 — 관리자만 보는 회원 목록(역할 기반 RLS 종합)(`examples/145/`)
