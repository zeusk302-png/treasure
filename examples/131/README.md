# 실습 131 — Supabase Auth 켜고 이메일 회원가입 폼 만들기

Supabase에서 이메일 인증을 켜고, 정적 페이지(`signup.html`)에 회원가입 폼을 붙여 `signUp`으로 **첫 사용자**를 만들어 봅니다. 서버 코드 없이 브라우저에서 Supabase를 직접 부릅니다.

## 목표
- "회원가입 = Supabase **Auth**에 사용자 한 명이 생긴다"를 눈으로 본다.
- 회원가입에 쓰는 키는 **anon(publishable) 키 = 공개돼도 되는 출입증**임을 이해한다.
- `service_role`(secret) 키는 **절대 숨겨야 하는 비밀**이며 브라우저·GitHub에 두면 안 됨을 안다.

## 따라하는 단계
1. [supabase.com](https://supabase.com)에서 프로젝트를 만든다(부트캠프에서 한 것).
2. 대시보드 → **Authentication → Sign In / Providers → Email**을 켠다. (기본으로 켜져 있는 경우가 많다.)
3. 처음 테스트라면 같은 화면에서 **"Confirm email"(이메일 확인)** 을 잠시 꺼두면 인증 메일 없이 바로 가입이 됩니다. (실서비스에서는 다시 켜세요.)
4. 대시보드 → **Settings → API**에서 `Project URL`과 `anon`(publishable) 키를 복사한다.
5. `signup.html` 위쪽의 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 두 값을 내 값으로 바꾼다.
6. `signup.html`을 브라우저로 열고, 이메일·비밀번호(6자 이상)를 넣어 **가입하기**를 누른다.
7. 대시보드 → **Authentication → Users**에 방금 만든 사용자 한 명이 보이는지 확인한다.

## 검증법
- 가입 후 화면에 초록색 "가입 요청 완료" 메시지가 뜨는가?
- Supabase 대시보드 **Authentication → Users** 목록에 내 이메일이 한 줄 보이는가?
- 같은 이메일로 다시 가입하면 "이미 등록됨" 류의 에러가 뜨는가? (정상 동작)
- (보안 체험) `signup.html`에 넣은 키가 `anon`/`sb_publishable_...`인지 다시 확인. `service_role`/`sb_secret_...`을 넣었다면 즉시 빼고 키를 회전(재발급)하세요.

## 핵심 한 줄
회원가입은 이 한 줄이 전부입니다.
```js
const { data, error } = await db.auth.signUp({ email, password });
```

## 보안 메모 — anon vs service_role, 그리고 RLS
- **anon(publishable) 키**: 공개돼도 되는 **출입증**. 회원가입·로그인 같은 Auth 동작과, RLS로 보호된 데이터 읽기/쓰기에 사용. `signup.html`처럼 브라우저에 둬도 됩니다.
- **service_role(secret) 키**: **절대 숨길 비밀**. 모든 RLS(행 수준 보안)를 통째로 **우회**합니다. 오직 서버(예: n8n, 엣지 함수)에서만, 환경변수로만 사용하세요. 브라우저·GitHub·이 폴더에 두면 안 됩니다.
- **RLS와의 관계**: 회원가입(Auth)은 "누구냐"를 만드는 **인증**입니다. 만든 사용자가 **자기 데이터만** 만지게 막는 것은 **인가**이고, 이는 별도로 만드는 테이블에 `auth.uid()` 기반 **RLS 정책**으로 강제합니다. "로그인 붙였으니 안전"은 착각 — 인가(RLS)는 따로 점검해야 합니다.

!!! danger "절대 하지 말 것"
    `signup.html`에 넣는 건 **anon(publishable) 키**입니다. `service_role`(secret) 키는 RLS를 통째로 우회하므로 **브라우저·GitHub에 절대 두면 안 됩니다.** 두 키를 헷갈리는 게 가장 흔한 사고예요.

## 더 배우기
- 개념: [4. 안전(보안) — 키와 RLS](https://zeusk302-png.github.io/treasure/04-security/)
- 인증 vs 인가: [인증 vs 인가 — '누구냐'와 '뭘 해도 되냐'](https://zeusk302-png.github.io/treasure/04-security/04/)
- 함께 보기: 실습 03 — Supabase 방명록(`examples/03-supabase-guestbook/`)
