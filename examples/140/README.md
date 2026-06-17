# 실습 140 — 구글(소셜) 로그인 버튼 붙이기

지금까지는 이메일·비밀번호로 직접 로그인했습니다(132). 그런데 사용자 입장에선 비밀번호를 또 하나 만들고 외우는 게 귀찮습니다. 그래서 많은 앱이 **"구글로 계속하기"** 버튼을 답니다. 이미 가진 구글 계정으로 한 번에 로그인하는 방식이죠. 이걸 **소셜 로그인(OAuth)** 이라고 합니다.

핵심 아이디어는 "우리가 비밀번호를 직접 받지 않는다"입니다. 버튼을 누르면 잠깐 **구글 화면으로 갔다가**, 사용자가 "이 앱에 내 정보를 줘도 돼요"라고 동의하면, 우리 앱의 **돌아올 주소(`callback.html`)** 로 로그인 정보를 달고 **되돌아옵니다.** 비밀번호 확인은 전부 구글과 Supabase가 처리합니다.

흐름은 딱 이렇게 흘러갑니다.

1. **로그인(`login.html`)** — "구글로 계속하기"를 누르면 `signInWithOAuth`가 구글 화면으로 보냅니다.
2. **구글 화면** — 사용자가 계정을 고르고 동의합니다. (우리 코드가 아니라 구글 사이트)
3. **콜백(`callback.html`)** — 동의가 끝나면 이 도착지로 돌아오고, `getUser()`로 "누가 로그인했는지" 확인합니다.

이번 실습의 결과물은 **구글 로그인 버튼이 있는 페이지(`login.html`)** 와 **로그인 후 돌아오는 콜백 처리 페이지(`callback.html`)** 입니다.

## 목표
- `signInWithOAuth({ provider: 'google', options: { redirectTo } })`로 **소셜 로그인을 시작하는** 법을 익힌다.
- 버튼 → 구글 → 우리 앱으로 이어지는 **리다이렉트(이동) 흐름**을 머릿속에 그린다.
- 돌아온 뒤 `getUser()`로 **로그인된 사용자 정보**(이름·이메일·로그인 방식)를 읽는 법을 배운다.
- `redirectTo` 주소를 **Supabase 대시보드에 등록**해야 로그인 후 돌아오는 길이 막히지 않는다는 점을 이해한다.
- 구글의 **클라이언트 ID/시크릿** 같은 비밀값은 브라우저 코드가 아니라 **Supabase 대시보드에만** 넣는다는 원칙을 안다.

## 따라하는 단계
1. 앞 실습(131·132)에서 만든 **Supabase 프로젝트**를 그대로 쓴다. 없으면 [supabase.com](https://supabase.com)에서 새 프로젝트를 하나 만든다.
2. **구글 클라이언트 만들기:** [Google Cloud Console](https://console.cloud.google.com)에서 프로젝트를 만들고 **OAuth 동의 화면**을 설정한 뒤, **사용자 인증 정보 → OAuth 클라이언트 ID(웹 애플리케이션)** 를 만든다. 그러면 `클라이언트 ID`와 `클라이언트 시크릿` 두 값이 나온다. (이 두 값은 비밀값이다. 코드에 적지 않는다.)
3. Supabase 대시보드 → **Authentication → Providers → Google**을 켜고, 방금 받은 `클라이언트 ID`·`클라이언트 시크릿`을 **여기에만** 붙여 넣는다. 이 화면에 적힌 **Callback URL(`https://<프로젝트>.supabase.co/auth/v1/callback`)** 을 복사해, 2단계의 구글 클라이언트 설정 **"승인된 리디렉션 URI"** 에 등록한다.
4. Supabase 대시보드 → **Settings → API**에서 `Project URL`과 `anon`(publishable) 키를 복사한다.
5. `supabase.js` 위쪽의 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 두 값을 내 값으로 바꾼다. (코드의 `https://여기에-...`, `sb_publishable_...`는 자리표시자다. 두 페이지가 이 파일 하나를 공유하므로 한 번만 바꾸면 된다.)
6. Supabase 대시보드 → **Authentication → URL Configuration → Redirect URLs**에 `callback.html`이 열릴 주소를 등록한다. 로컬 테스트라면 예를 들어 `http://127.0.0.1:5500/examples/140/callback.html`, 배포(Vercel) 후라면 `https://내앱.vercel.app/examples/140/callback.html`을 넣는다. (이 등록이 없으면 구글에서 돌아오는 길이 차단된다.)
7. 이 폴더 파일들을 같은 폴더에 둔 채, 로컬 서버(예: VS Code Live Server)로 **`login.html`을 연다.** `file://`로 직접 열면 `location.origin`이 비어 돌아올 주소가 깨지니 꼭 `http://`로 연다.
8. **"구글로 계속하기"** 를 누른다 → 구글 화면으로 이동한다 → 계정을 고르고 동의한다.
9. 자동으로 **`callback.html`로 돌아온다** → "로그인 성공!"과 함께 내 **이름·이메일·로그인 방식(google)** 이 보이면 끝!

## 검증법
- "구글로 계속하기"를 누르면 **구글 로그인 화면으로 이동**하는가? (이동 안 하고 에러가 뜨면 대시보드의 Google Provider가 꺼져 있거나 키가 틀린 것)
- 동의 후 **`callback.html`로 자동 복귀**하고, "로그인 성공!"과 내 이메일이 보이는가?
- 콜백 화면에 표시된 **로그인 방식이 `google`** 인가? (구글로 들어왔다는 증거)
- `callback.html`에 **주소를 직접 입력해** 들어가면(로그인 안 한 상태), "로그인 정보가 없어요" 안내가 뜨는가?
- 콜백 화면의 **로그아웃** 버튼을 누르면 `login.html`로 돌아가고, 다시 `callback.html`로 들어가면 또 "정보가 없어요"가 뜨는가?
- 개발자도구 → **Console**에서 `await db.auth.getUser()`를 실행하면, 로그인 직후엔 `data.user`에 이메일이 채워지고 로그아웃 후엔 `null`인가?

## 핵심 두 줄
보내기(login)와 확인하기(callback), 딱 이 두 함수가 전부입니다.
```js
// 1) login.html — 버튼을 누르면 구글 화면으로 보낸다
await db.auth.signInWithOAuth({
  provider: "google",
  options: { redirectTo: "https://내앱/callback.html" },
});

// 2) callback.html — 돌아온 뒤 "누가 로그인했나" 확인한다
const { data } = await db.auth.getUser(); // data.user.email, data.user.app_metadata.provider
```

## ⚠️ 보안 메모 — 구글 '클라이언트 시크릿'은 코드에 절대 넣지 마세요
구글 클라이언트를 만들면 `클라이언트 ID`와 `클라이언트 시크릿`이 나옵니다. 이 둘은 **Supabase 대시보드(Providers → Google)에만** 입력하고, 우리 브라우저 코드(`supabase.js` 등)에는 **절대 적지 않습니다.** 시크릿이 깃허브나 브라우저에 노출되면, 남이 우리 앱인 척 구글에 로그인을 요청할 수 있습니다. 실제 OAuth의 비밀 교환은 **Supabase 서버가 대신** 해주므로, 우리 코드는 그 시크릿을 볼 일이 전혀 없습니다.

## 보안 메모 — anon vs service_role, 그리고 RLS
- 우리 브라우저 코드에 넣는 건 **anon(publishable) 키** 하나뿐입니다. anon 키는 "공개돼도 되는 **출입증**"이라 브라우저·GitHub에 있어도 괜찮습니다. (코드의 `sb_publishable_...`는 자리표시자이니 내 값으로 바꿔 쓰세요.)
- `service_role`(secret) 키는 모든 **RLS(행 수준 보안)를 통째로 우회**하는 마스터키라, 브라우저나 깃허브에 두면 절대 안 됩니다. 오직 서버(n8n·엣지 함수)에서 **환경변수**로만 사용하세요. (브라우저에 들어가는 비밀값은 언제나 자리표시자로 둡니다.)
- 소셜 로그인은 **anon 키만으로** 안전하게 동작합니다. 인증은 구글·Supabase가 처리하고, 세션도 Supabase가 발급·검증하기 때문입니다. 우리가 비밀번호나 service_role을 다룰 일은 전혀 없습니다.
- 로그인한 사용자의 **데이터를 지키는 건 여전히 RLS**입니다. 소셜 로그인으로 들어왔어도, 테이블에 `auth.uid() = user_id` 같은 정책이 걸려 있어야 "남의 데이터"를 못 읽습니다. (로그인 = 누구인지 확인 / RLS = 그 사람이 뭘 봐도 되는지 결정)

## getUser() vs onAuthStateChange() — 콜백에선 둘 다 씁니다
- `onAuthStateChange`는 구글에서 돌아와 로그인이 **막 완료되는 순간**(`SIGNED_IN` 이벤트)을 잡아냅니다.
- `getUser()`는 **지금 로그인된 사용자가 있는지**를 서버에 물어봐 확인합니다.
- 토큰 처리가 조금 늦게 끝나는 경우를 대비해 `callback.js`는 **둘 다** 확인합니다. 어느 쪽이든 먼저 사용자가 잡히면 화면을 그려줍니다.

## 더 배우기
- 개념: [4. 안전(보안) — 키와 RLS](https://zeusk302-png.github.io/treasure/04-security/)
- 개념: [공개해도 되는 키 vs 절대 숨길 키 (anon vs service_role)](https://zeusk302-png.github.io/treasure/04-security/01/)
- 개념: [인증 vs 인가 — '누구냐'와 '뭘 해도 되냐'는 다른 질문](https://zeusk302-png.github.io/treasure/04-security/04/)
- 함께 보기: 실습 131 — 회원가입 폼(`examples/131/`), 실습 132 — 로그인 폼(`examples/132/`), 실습 134 — 세션 읽기로 로그인 유지(`examples/134/`), 실습 136 — 로그아웃 버튼(`examples/136/`), 실습 138 — 보호된 페이지(`examples/138/`), 실습 139 — 비밀번호 재설정 흐름(`examples/139/`)
