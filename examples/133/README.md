# 실습 133 — 이메일 인증 확인 메일 안내 화면 만들기

회원가입 직후 **"메일함을 확인하세요"** 안내 화면(`signup.html`)을 띄우고, 사용자가 메일 속 확인 링크를 누르면 돌아오는 **인증 완료 화면**(`confirm.html`)을 만듭니다. 이메일을 진짜로 가진 사람만 가입을 끝낼 수 있게 하는 **이메일 검증(email confirmation)** 흐름을 직접 경험합니다.

## 목표
- 회원가입이 **두 단계**임을 이해한다: ① 가입 요청 → ② 메일 링크 클릭으로 **확인 완료**.
- 가입 직후 폼을 숨기고 **"메일함을 확인하세요" 안내 화면**으로 자연스럽게 전환하는 패턴을 익힌다.
- 메일 링크를 누르면 `emailRedirectTo`로 지정한 내 페이지로 **다시 돌아오는(redirect)** 구조를 이해한다.
- 브라우저에 두는 건 **anon(공개돼도 되는 출입증) 키**뿐이며, `service_role`(절대 숨길 비밀) 키는 두지 않는다는 원칙을 다시 확인한다.

## 따라하는 단계
1. [supabase.com](https://supabase.com)에서 프로젝트를 연다(실습 131에서 만든 것 그대로 사용).
2. 대시보드 → **Authentication → Sign In / Providers → Email**에서 **"Confirm email"(이메일 확인)을 켠다.** (이번 실습의 핵심 — 이게 켜져 있어야 확인 메일이 나갑니다.)
3. 대시보드 → **Authentication → URL Configuration**에서 **Redirect URLs**에 내가 열 주소를 추가한다.
   - 로컬 테스트면 `http://localhost:3000/confirm.html` 처럼, 실제로 페이지를 여는 주소를 넣어야 메일 링크가 그곳으로 돌아옵니다. (등록 안 된 주소로는 리다이렉트가 막힙니다.)
4. 대시보드 → **Settings → API**에서 `Project URL`과 `anon`(publishable) 키를 복사한다.
5. `signup.html`과 `confirm.html` **두 파일 모두**의 위쪽 `SUPABASE_URL`, `SUPABASE_ANON_KEY`를 내 값으로 바꾼다. (두 곳 똑같이!)
6. `file://`로 더블클릭해 열면 리다이렉트 주소가 맞지 않으니, 간단한 로컬 서버로 띄운다. 예: 폴더에서 `npx serve` 또는 VS Code의 **Live Server** 사용 → `http://localhost:3000/signup.html` 접속.
7. 진짜 받을 수 있는 이메일로 **가입하기**를 누른다 → "메일함을 확인하세요" 화면이 뜬다.
8. 메일함(스팸함 포함)에서 확인 메일을 열어 **"이메일 확인" 링크**를 누른다 → `confirm.html`로 돌아와 **"이메일 인증 완료!"** 가 보인다.

## 🤖 바이브코딩 프롬프트
이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다. 내 상황(키 값, 페이지 주소)에 맞게 한두 군데만 바꿔 쓰세요.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 프런트엔드 멘토야. Supabase 이메일 검증(email confirmation) 회원가입 흐름을
  순수 HTML 한 파일(signup.html)로 만들어줘.

  요구사항:
  - @supabase/supabase-js v2 를 CDN(<script>)으로 불러온다.
  - 이메일/비밀번호 입력 폼과 '가입하기' 버튼이 있다.
  - 가입은 db.auth.signUp 으로 하고, options.emailRedirectTo 에
    window.location.origin + '/confirm.html' 을 넣어 '돌아올 주소'를 함께 보낸다.
  - 가입에 성공하면 폼을 숨기고 "메일함을 확인하세요 + 보낸 이메일 주소" 안내 화면으로 바꾼다.
  - SUPABASE_URL, SUPABASE_ANON_KEY 는 파일 맨 위에 자리표시자로 두고,
    여기에 두는 건 anon(공개돼도 되는) 키이고 service_role 키는 절대 두면 안 된다는 주석을 단다.
  - 비전공자가 읽을 거니까, 코드만 주지 말고 왜 그렇게 했는지 한국어 주석으로 한 줄씩 설명해줘.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  방금 만든 signup.html 흐름에 이어서 다음을 추가해줘.
  1) 메일 링크를 누르면 돌아오는 confirm.html 을 만들어줘.
     - 페이지가 열리면 db.auth.getSession() 으로 세션이 있는지 확인하고,
       세션이 있으면 "이메일 인증 완료!"와 사용자 이메일을, 없으면 "아직 인증되지 않았어요"를 보여준다.
     - 메일 토큰을 라이브러리가 읽는 데 시간이 걸릴 수 있으니 onAuthStateChange 로도 한 번 더 확인한다.
  2) signup.html 안내 화면에 '확인 메일 다시 보내기' 버튼(db.auth.resend, type:'signup')을 추가해줘.
  각 추가 부분마다 '무엇을 하는지 + 왜 필요한지'를 한국어 주석으로 달아줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  Supabase 이메일 인증 실습인데 다음 증상이 나와. 원인 후보를 가능성 높은 순서로 알려주고,
  내가 대시보드/코드에서 무엇을 한 줄씩 확인하면 되는지 단계별로 알려줘. (추측 말고 점검 순서로)

  증상: (예) 가입은 되는데 확인 메일이 안 온다 / 메일 링크를 눌러도 confirm.html에서 "아직 인증되지 않았어요"가 뜬다
  내 상황: Authentication에서 Confirm email은 (켰다/안 켰다), Redirect URLs에 (주소를 넣었다/모르겠다),
          파일은 (file:// 더블클릭 / localhost 로컬서버)으로 열었다.
  붙여넣는 에러/콘솔 메시지:
  (여기에 브라우저 콘솔에 뜬 빨간 메시지를 그대로 붙여넣기)
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 훨씬 좋습니다.

## 검증법
- 가입 직후 폼이 사라지고 📬 **"메일함을 확인하세요"** 안내(보낸 이메일 주소 포함)가 보이는가?
- 받은 확인 메일의 링크를 누르면 `confirm.html`로 이동해 ✅ **"이메일 인증 완료!"** 와 내 이메일이 보이는가?
- `confirm.html`을 메일 링크 없이 **직접** 열면 ⚠️ "아직 인증되지 않았어요"가 뜨는가? (정상 — 링크를 거쳐야만 인증됩니다.)
- (대시보드 확인) **Authentication → Users**에서 해당 사용자의 상태가 인증 전후로 바뀌는가? (Confirmed 시각이 채워짐.)
- (보안 체험) 두 파일에 넣은 키가 `anon`/`sb_publishable_...`인지 확인. `service_role`/`sb_secret_...`을 넣었다면 즉시 빼고 키를 회전(재발급)하세요.

## 핵심 한 줄
가입할 때 **돌아올 주소**를 같이 알려주는 게 전부입니다.
```js
await db.auth.signUp({
  email, password,
  options: { emailRedirectTo: window.location.origin + '/confirm.html' }
});
```
그리고 돌아온 페이지에서는 **세션이 생겼는지**로 인증 완료를 판단합니다.
```js
const { data } = await db.auth.getSession();
if (data.session) { /* 이메일 인증 완료! */ }
```

## 안전(보안) 짚고 가기 — anon vs service_role, 그리고 RLS
- **anon(publishable) 키**: 공개돼도 되는 **출입증**. 회원가입·로그인·이메일 인증 같은 Auth 동작에 사용하며, `signup.html`·`confirm.html`처럼 브라우저에 둬도 됩니다. (위 코드의 `sb_publishable_...` 자리표시자가 이 키입니다.)
- **service_role(secret) 키**: **절대 숨길 비밀**. 모든 **RLS(행 수준 보안)** 를 통째로 **우회**하는 마스터키입니다. 오직 서버(예: n8n, 엣지 함수)에서 **환경변수로만** 쓰고, 브라우저·GitHub·이 폴더에는 절대 두지 마세요.
- **이메일 검증은 "인증"의 일부일 뿐입니다.** 메일을 확인했다고 해서 "이 사람이 자기 데이터만 만진다"가 보장되진 않습니다. 그건 **인가**의 문제이고, 데이터 테이블에 `auth.uid()` 기반 **RLS 정책**으로 따로 강제해야 합니다.

!!! danger "절대 하지 말 것"
    `signup.html`·`confirm.html`에 넣는 건 **anon(publishable) 키**입니다. `service_role`(secret) 키는 RLS를 통째로 우회하므로 **브라우저·GitHub에 절대 두면 안 됩니다.** 두 키를 헷갈리는 게 가장 흔한 사고예요.

## 더 배우기
- 개념: [4. 안전(보안) — 키와 RLS](https://zeusk302-png.github.io/treasure/04-security/)
- 개념: [공개해도 되는 키 vs 절대 숨길 키 (anon vs service_role)](https://zeusk302-png.github.io/treasure/04-security/01/)
- 개념: [인증 vs 인가 — '누구냐'와 '뭘 해도 되냐'는 다른 질문](https://zeusk302-png.github.io/treasure/04-security/04/)
- 이어서: 실습 131(회원가입), 실습 132(로그인), 실습 134(세션 유지) — `examples/131`, `examples/132`, `examples/134`
