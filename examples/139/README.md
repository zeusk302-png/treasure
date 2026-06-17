# 실습 139 — 비밀번호 찾기·재설정 메일 흐름 만들기

로그인(132)·세션 유지(134)·로그아웃(136)·보호 페이지(138)까지 만들었습니다. 그런데 현실에서 가장 자주 일어나는 일이 하나 빠졌습니다. **"비밀번호를 까먹었어요!"** 이때 관리자가 비밀번호를 대신 봐주거나 바꿔주면 안 됩니다. (애초에 Supabase는 비밀번호 원문을 저장하지도 않습니다.) 대신 **본인 이메일로 재설정 링크를 보내서, 본인만 새 비밀번호를 정하게** 하는 게 정석입니다.

이 흐름은 딱 두 걸음입니다.

1. **비밀번호 찾기(`forgot.html`)** — 이메일을 받아 `resetPasswordForEmail`로 재설정 링크 메일을 보냅니다.
2. **새 비밀번호 정하기(`reset.html`)** — 메일 링크를 누르면 잠깐 유효한 **임시 세션**이 생기고, 그 동안 `updateUser`로 새 비밀번호를 저장합니다.

이번 실습의 결과물은 **비밀번호 찾기 폼(`forgot.html`)** 과 **새 비밀번호 입력 페이지(`reset.html`)** 입니다.

## 목표
- `resetPasswordForEmail(email, { redirectTo })`로 **재설정 메일을 보내는** 법을 익힌다.
- 메일 링크를 누르면 생기는 **임시 세션(복구 세션)** 의 역할을 이해한다.
- 임시 세션이 있는 동안 `updateUser({ password })`로 **새 비밀번호를 저장**한다.
- "그 이메일은 없어요" 같은 안내가 왜 **보안상 위험한지**(계정 존재 노출), 어떻게 피하는지 안다.
- `redirectTo` 주소를 **Supabase 대시보드에 등록**해야 링크가 막히지 않는다는 점을 이해한다.

## 따라하는 단계
1. 앞 실습(131·132)에서 만든 **Supabase 프로젝트**와 **테스트 계정**(이메일이 진짜 받아볼 수 있는 주소면 더 좋다)을 그대로 쓴다.
2. 대시보드 → **Settings → API**에서 `Project URL`과 `anon`(publishable) 키를 복사한다.
3. `supabase.js` 위쪽의 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 두 값을 내 값으로 바꾼다. (코드의 `https://여기에-...`, `sb_publishable_...`는 자리표시자다. 두 페이지가 이 파일 하나를 공유하므로 한 번만 바꾸면 된다.)
4. 대시보드 → **Authentication → URL Configuration → Redirect URLs**에 `reset.html`이 열릴 주소를 등록한다. 로컬 테스트라면 예를 들어 `http://127.0.0.1:5500/examples/139/reset.html`, 배포(Vercel) 후라면 `https://내앱.vercel.app/examples/139/reset.html`을 넣는다. (이 등록이 없으면 메일 링크가 차단된다.)
5. 이 폴더 파일들을 같은 폴더에 둔 채, 로컬 서버(예: VS Code Live Server)로 **`forgot.html`을 연다.** `file://`로 직접 열면 `location.origin`이 비어 링크가 깨질 수 있으니 꼭 `http://`로 연다.
6. 테스트 계정 이메일을 입력하고 **"재설정 메일 보내기"** 를 누른다 → "메일을 보냈습니다" 안내가 뜬다.
7. 받은 메일의 **재설정 링크**를 누른다 → `reset.html`이 열린다. (이때 주소 끝에 `#access_token=...` 같은 값이 잠깐 붙는데, 이게 임시 세션을 만드는 재료다.)
8. 새 비밀번호를 **두 번 같게** 입력하고 **"새 비밀번호 저장"** 을 누른다 → "비밀번호를 바꿨습니다" 안내 후 자동으로 `login.html`로 이동한다.
9. `login.html`에서 **새 비밀번호**로 로그인해 본다 → "로그인 성공"이 뜨면 전체 흐름 완성!

## 검증법
- `forgot.html`에서 메일을 보낸 뒤, 실제 메일함(스팸함 포함)에 **재설정 메일이 도착**하는가?
- 메일 링크를 누르면 **`reset.html`로 이동**하고, 새 비밀번호 폼이 보이는가?
- 두 비밀번호를 **다르게** 입력하면 "두 비밀번호가 서로 다릅니다" 경고가 뜨는가?
- 새 비밀번호 저장 후, **옛 비밀번호로는 로그인 실패**하고 **새 비밀번호로는 로그인 성공**하는가? (실제로 바뀌었다는 증거)
- 메일 링크 없이 `reset.html`에 **직접 들어가면**, 임시 세션이 없으므로 "유효한 재설정 링크로 들어와야 합니다" 안내가 뜨는가?
- 개발자도구 → **Console**에서 `await db.auth.getSession()`을 실행했을 때, 메일 링크로 들어온 경우엔 `data.session`이 채워지고 직접 들어온 경우엔 `null`인가?

## 핵심 두 줄
보내기(forgot)와 바꾸기(reset), 딱 이 두 함수가 전부입니다.
```js
// 1) forgot.html — 재설정 메일 보내기
await db.auth.resetPasswordForEmail(email, { redirectTo: "https://내앱/reset.html" });

// 2) reset.html — 링크로 돌아온 사용자가 새 비밀번호 저장
await db.auth.updateUser({ password: "새-비밀번호" });
```

## ⚠️ 보안 메모 — "그 이메일은 없어요"라고 말하지 마세요 (계정 존재 노출)
`forgot.js`는 일부러 **성공이든 실패든 똑같은 안내**("메일을 보냈습니다")를 보여줍니다. 만약 "그 이메일은 가입 안 됐어요"라고 알려주면, 공격자가 이메일을 하나씩 넣어보며 **누가 우리 서비스에 가입돼 있는지** 알아낼 수 있습니다(account enumeration). 그래서 가입 여부와 무관하게 같은 메시지를 보여주는 게 정석입니다.

## 보안 메모 — anon vs service_role, 그리고 RLS
- 여기 넣는 건 **anon(publishable) 키** 하나뿐입니다. anon 키는 "공개돼도 되는 **출입증**"이라 브라우저·GitHub에 있어도 괜찮습니다. (코드의 `sb_publishable_...`는 자리표시자이니 내 값으로 바꿔 쓰세요.)
- `service_role`(secret) 키는 모든 **RLS(행 수준 보안)를 통째로 우회**하는 마스터키라, 브라우저나 깃허브에 두면 절대 안 됩니다. 오직 서버(n8n·엣지 함수)에서 **환경변수**로만 사용하세요. (브라우저에 들어가는 비밀값은 언제나 자리표시자로 둡니다.)
- 비밀번호 재설정 흐름은 **anon 키만으로** 안전하게 동작합니다. 실제 인증은 Supabase 서버가 처리하고, 임시 세션도 Supabase가 발급·검증하기 때문입니다. 우리가 비밀번호 원문을 다루거나 service_role을 쓸 일은 전혀 없습니다.

## getSession() vs onAuthStateChange() — reset.html에선 둘 다 씁니다
- `onAuthStateChange`는 메일 링크로 들어온 **순간**(`PASSWORD_RECOVERY` 이벤트)을 잡아냅니다.
- `getSession()`은 **지금 임시 세션이 있는지**를 직접 확인합니다.
- 둘 중 하나가 늦거나 놓칠 때를 대비해 `reset.js`는 **둘 다** 확인하고, 임시 세션이 확인됐을 때만 `updateUser`를 허용합니다.

## 더 배우기
- 개념: [4. 안전(보안) — 키와 RLS](https://zeusk302-png.github.io/treasure/04-security/)
- 개념: [공개해도 되는 키 vs 절대 숨길 키 (anon vs service_role)](https://zeusk302-png.github.io/treasure/04-security/01/)
- 개념: [인증 vs 인가 — '누구냐'와 '뭘 해도 되냐'는 다른 질문](https://zeusk302-png.github.io/treasure/04-security/04/)
- 함께 보기: 실습 131 — 회원가입 폼(`examples/131/`), 실습 132 — 로그인 폼(`examples/132/`), 실습 133 — 이메일 인증 안내(`examples/133/`), 실습 134 — 세션 읽기로 로그인 유지(`examples/134/`), 실습 136 — 로그아웃 버튼(`examples/136/`), 실습 138 — 보호된 페이지(`examples/138/`), 실습 140 — 구글 소셜 로그인(`examples/140/`)
