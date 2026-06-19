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

## 🤖 바이브코딩 프롬프트
이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다. `[내 프로젝트 URL]` 같은 대괄호 부분만 내 값으로 바꾸세요.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 비전공자 학생을 돕는 웹개발 멘토야.
  서버 코드 없이 브라우저에서 바로 열리는 정적 HTML 파일 하나(signup.html)를 만들어줘.
  요구사항:
  - 이메일 입력칸, 비밀번호 입력칸(6자 이상), '가입하기' 버튼이 있는 회원가입 폼
  - Supabase 자바스크립트 라이브러리(@supabase/supabase-js v2)를 CDN <script>로 불러오기
  - 파일 위쪽에 SUPABASE_URL, SUPABASE_ANON_KEY 두 상수를 두고, supabase.createClient로 클라이언트 생성
  - 폼을 제출하면 db.auth.signUp({ email, password }) 한 줄로 사용자를 만들기
  - 결과(성공/실패) 메시지를 화면 아래 div에 색으로 보여주기
  제약:
  - 추가 라이브러리(React, jQuery 등) 쓰지 말고 순수 HTML/CSS/JS만
  - 키는 anon(publishable) 키만 쓴다고 가정하고, service_role 키는 절대 코드에 넣지 마
  - 코드만 주지 말고 줄마다 '무엇을/왜' 한국어 주석으로 설명해줘
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  방금 만든 signup.html에 다음을 더해줘. 기존 동작은 그대로 두고 추가만 해줘.
  - 가입 버튼을 누르면 버튼을 잠시 비활성화하고 '가입 중…'으로 바꿔 중복 클릭 막기
  - 가입에 성공하면 입력칸 비우기(form.reset)
  - 이메일 형식이 아니거나 비밀번호가 6자 미만이면 가입 시도 전에 친절한 한국어 안내 보여주기
  - 사용자가 입력한 값을 화면에 보여줄 때는 innerHTML 대신 textContent를 써서 XSS를 막아줘
  바꾼 부분마다 왜 그렇게 했는지 주석으로 한 줄씩 설명해줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  signup.html에서 가입하기를 눌렀더니 콘솔에 이런 에러가 떠. 원인과 해결을 단계별로 알려줘.
  [여기에 브라우저 콘솔(F12)에 뜬 에러 메시지를 그대로 붙여넣기]
  내가 확인한 것: SUPABASE_URL / SUPABASE_ANON_KEY 값은 [넣었다/아직 자리표시자다].
  Supabase 대시보드에서 Authentication → Email은 [켰다/모르겠다], Confirm email은 [껐다/켰다].
  비전공자가 이해하게 한 줄씩 풀어서, 무엇을 어디서 고쳐야 하는지 알려줘.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다.

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
