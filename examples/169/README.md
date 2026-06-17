# Vercel에 GitHub 저장소 연결해 자동배포 켜기

지금까지 만든 페이지는 "내 컴퓨터에서만" 보였습니다. 이번에는 그 페이지가 들어 있는 **GitHub 저장소**를 **Vercel**이라는 무료 서비스에 한 번만 연결해서, **`https://프로젝트이름.vercel.app`** 같은 진짜 인터넷 주소를 받아 봅니다. 한 번 연결해 두면 앞으로는 코드를 올리기만 해도 알아서 다시 배포되는데, 이번 실습의 목표는 그 "연결만 하면 배포되는" 첫 경험을 끝까지 따라가 보는 것입니다.

> 비전공자 눈높이 한 줄 요약: **GitHub = 코드를 보관하는 창고**, **Vercel = 그 창고를 보고 자동으로 웹사이트를 띄워 주는 직원**입니다. 둘을 한 번 소개(연결)해 주면, 그 다음부터는 알아서 일합니다.

## 목표

- Vercel에 **GitHub 계정으로 로그인**하고, 두 서비스를 연결한다.
- 내 GitHub 저장소를 Vercel로 **Import(가져오기)** 한다.
- 첫 배포를 끝내고 **`프로젝트이름.vercel.app`** 형태의 **라이브 URL**을 받는다.
- 이 URL을 새 탭/휴대폰에서 열어 "내 사이트가 인터넷에 떴다"를 직접 확인한다.

## 준비물 (이번 실습 전에 끝나 있어야 함)

1. **GitHub 계정**과, `index.html`이 들어 있는 **저장소(repository)** 하나. (이전 실습 `examples/166`·`167`에서 만들었습니다.)
2. 이 폴더(`examples/169/`)의 파일들(`index.html`, `style.css`, 선택적으로 `vercel.json`)을 그 GitHub 저장소에 올려 두면 그대로 배포 대상이 됩니다.
   - 아직 저장소가 없다면, 이 세 파일을 새 저장소에 올리는 것부터 하세요. (`examples/167` 참고)

> 보안 메모: 이 실습에서 다루는 파일에는 **비밀값(비밀번호·API 키·토큰)이 하나도 없습니다.** 정적 페이지라서 누구에게 공개돼도 안전합니다. 나중에 Supabase 키 등을 다루게 되면, **공개해도 되는 anon 키**와 **절대 공개하면 안 되는 service_role 키**를 구분해야 하는데, 비밀값은 코드 파일이 아니라 **Vercel 대시보드 > Settings > Environment Variables**에 넣습니다. (이번 정적 배포에서는 거기까지 갈 일이 없습니다.)

## 따라하는 단계

1. 브라우저에서 **https://vercel.com** 에 접속하고 오른쪽 위 **Sign Up**(또는 **Log In**)을 누릅니다.
2. 로그인 방법 중 **Continue with GitHub**를 누릅니다. (이메일/비밀번호 대신 GitHub 계정으로 들어가야, 다음 단계에서 내 저장소가 보입니다.)
3. GitHub가 "Vercel이 당신의 저장소에 접근하도록 허용할까요?"라고 물으면 **Authorize / Install**을 눌러 권한을 줍니다.
   - 모든 저장소를 줄지(All repositories), 고른 저장소만 줄지(Only select repositories)를 선택할 수 있습니다. 처음엔 **방금 만든 저장소 하나만** 골라 줘도 충분합니다.
4. Vercel 대시보드 화면에서 **Add New...** → **Project**(또는 큰 **Import** 버튼)를 누릅니다.
5. **"Import Git Repository"** 목록에서 내 저장소(예: `내깃허브아이디/my-first-site`)를 찾아 옆의 **Import** 버튼을 누릅니다.
   - 저장소가 안 보이면, 목록 아래 **Adjust GitHub App Permissions**(또는 *Configure GitHub App*)를 눌러 해당 저장소에 권한을 추가해 주세요.
6. 설정 화면이 뜨면 대부분 **그대로 두면 됩니다.** 우리가 만든 건 빌드가 필요 없는 정적 HTML이라:
   - **Framework Preset**: `Other`(또는 자동 감지된 값) 그대로 둡니다.
   - **Build Command / Output Directory**: 비워 두거나 기본값 그대로 둡니다. (정적 파일은 따로 "빌드"가 필요 없습니다.)
   - **Environment Variables**: 이번엔 **비워 둡니다.** (비밀값이 없으니까요.)
7. 아래 **Deploy** 버튼을 누릅니다. 잠깐(보통 10~30초) 빌드/배포가 진행됩니다.
8. **Congratulations** 축하 화면과 함께 페이지 미리보기와 주소가 나옵니다. **Continue to Dashboard** 또는 **Visit**를 눌러 봅니다.
9. 받은 주소(예: **`https://my-first-site.vercel.app`**)를 복사해 둡니다. 이게 이번 실습의 **결과물(라이브 URL)** 입니다.

> 자주 막히는 곳: ① **GitHub로 로그인**하지 않으면(이메일로 가입하면) 5단계에서 내 저장소가 안 보입니다 → 로그아웃 후 GitHub로 다시 로그인하세요. ② 저장소에 `index.html`이 **맨 위(루트)** 에 있어야 자동으로 첫 화면이 됩니다. 폴더 안에 들어 있으면 주소 뒤에 폴더 경로를 붙여야 보입니다. ③ 무료 플랜이면 카드 등록 없이 그대로 됩니다.

## 검증법

1. 받은 **`...vercel.app`** 주소를 **새 탭**에 붙여넣고 엽니다. "🚀 내 사이트가 인터넷에 떴습니다!" 화면이 보이면 성공입니다.
2. **휴대폰**(와이파이를 끄고 LTE/5G로) 브라우저에서도 같은 주소를 열어 봅니다. 내 컴퓨터가 꺼져 있어도 보이면, 진짜로 인터넷에 배포된 것입니다.
3. Vercel 대시보드에서 방금 만든 프로젝트를 클릭 → **Deployments** 탭을 봅니다. 맨 위 배포 상태가 **Ready**(초록색)면 정상입니다. (빨간 **Error**면 빌드 로그를 눌러 원인을 봅니다.)
4. 프로젝트의 **Settings → Git** 화면에서 내 GitHub 저장소가 **Connected**(연결됨)로 표시되는지 확인합니다. 이게 "자동배포가 켜졌다"는 증거입니다.
5. (선택, 다음 실습 미리보기) GitHub에서 `index.html`의 `배포 버전: v1` 문구를 `v2`로 한 글자 바꿔 커밋해 보세요. 잠시 뒤 같은 `.vercel.app` 주소를 새로고침하면 글자가 **자동으로** 바뀌어 있습니다. → 이 자동 재배포 과정을 자세히 다루는 게 `examples/170`입니다.

## 관련 가이드 링크

- 이전 실습: `examples/168/` — GitHub Pages로 정적 사이트를 무료 주소에 띄우기 (Vercel과 비교해 보세요)
- 다음 실습: `examples/170/` — 글자 한 줄 고치고 `git push`로 자동 재배포 확인하기
- 같은 카테고리(배포·운영·도구): `examples/_catalog.json`의 `code: "H"` 항목들
- Vercel로 GitHub 저장소 배포하기(공식 문서): https://vercel.com/docs/deployments/git
- Vercel 시작하기(공식 문서): https://vercel.com/docs/getting-started-with-vercel
