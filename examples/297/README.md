# 실습 297 — .env.local로 키 옮기고 .gitignore 한 줄 추가하기

코드에 그대로 박아둔(하드코딩한) Supabase URL · 키를 **`.env.local` 파일로 분리**하고,
그 파일을 **`.gitignore`에 등록**해서 "키를 깃허브에 안 올린다"는 보안의 핵심을 손으로 직접 만들어 보는 실습입니다.

키 유출 사고의 진짜 원인은 "키를 잘못 만들어서"가 아니라 **키를 코드에 박은 채 공개 저장소에 올려서**입니다.
이 실습은 그 사고를 막는 가장 기본 동작을 익힙니다.

## 목표
- 코드에 하드코딩된 값과, 파일로 **분리된** 값의 차이를 눈으로 비교한다. (`before.html` ↔ `index.html`)
- 공개돼도 되는 값(`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)과 절대 비밀인 값(`SUPABASE_SERVICE_ROLE_KEY`)을 **파일 안에서 구분**한다.
- `.gitignore`에 `.env.local` **한 줄**을 추가하는 것이 "깃허브에 안 올리기"의 핵심 장치임을 체득한다.
- anon(publishable) 키는 화면·깃허브에 있어도 괜찮지만, service_role(secret) 키는 정적 사이트(브라우저)에 **절대** 두지 않는다는 원칙을 익힌다.

## 따라하는 단계
1. 먼저 `before.html`을 브라우저로 열고 F12 → **Sources(소스)**에서 코드를 본다. URL · anon 키 · service_role 키가 코드에 **그대로 노출**돼 있는 걸 확인한다. (이게 위험한 상태)
2. 이제 분리된 버전을 본다. `.env.local` 파일을 열어 본다. 값이 두 묶음으로 나뉘어 있다:
   - `VITE_`로 시작하는 줄 = **공개돼도 되는 값**(URL, anon 키)
   - 접두가 없는 `SUPABASE_SERVICE_ROLE_KEY` = **절대 비밀**(정적 사이트에는 두지 않음, 여기선 자리표시자로만 둠)
3. `.env.local`의 `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` 값을 본인 Supabase 값으로 바꾼다. (Supabase 대시보드 → Settings → API)
4. 같은 두 값을 `config.js`의 `SUPABASE_URL`, `SUPABASE_ANON_KEY`에도 똑같이 옮겨 적는다. (실무에서는 Vite 같은 빌드 도구가 이 과정을 자동으로 해줍니다. 이 실습에서는 손으로 흉내냅니다.)
   - ⚠️ `config.js`에는 **공개 값(anon)만** 적습니다. service_role(비밀) 키는 절대 넣지 않습니다 — 넣으면 그 즉시 브라우저로 새어 나갑니다.
5. `index.html`을 브라우저로 연다. 화면에 URL · anon 키가 뜨고, service_role 키는 "화면 코드에 없음"으로 표시되는지 본다.
6. `.gitignore`를 열어 맨 위에 **`.env.local`** 한 줄이 들어 있는지 확인한다. 이 한 줄이 비밀 파일을 깃허브에 안 올리는 핵심 장치다.
7. AI에게 시켜 보기:
   > "이 폴더의 코드 어디든 키/토큰이 하드코딩된 곳을 파일·줄 단위로 찾아줘. 그리고 .gitignore에 .env.local이 등록돼 있는지 확인해줘. 추정 말고 실제로 발견한 것만 보고해."

## 🤖 바이브코딩 프롬프트
이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 비전공 입문자를 가르치는 웹 보안 강사야.
  "코드에 박은 키를 분리하고 .gitignore로 막는 법"을 손으로 익히는 미니 실습 폴더를 만들어줘.
  요구사항:
  - before.html: Supabase URL, anon 키, service_role 키를 코드 본문(<script>)에 그대로 하드코딩한 "나쁜 예". 왜 위험한지 화면에 빨간 박스로 설명.
  - index.html: 키를 코드에서 분리한 "좋은 예". config.js를 불러와 URL과 anon 키만 화면에 표시.
  - config.js: 브라우저에 노출돼도 되는 공개값(URL, anon 키)만 담는 파일. service_role 키는 절대 넣지 않기.
  - .env.local: VITE_ 접두가 붙은 공개값과, 접두 없는 SUPABASE_SERVICE_ROLE_KEY(비밀)를 구분해 담기. 모두 자리표시자로.
  - .gitignore: .env.local을 깃에서 제외하는 한 줄.
  모든 값은 진짜 키가 아니라 자리표시자로 만들고, 각 파일 맨 위에 "이 파일이 무엇이고 왜 있는지" 주석을 한국어로 달아줘.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  지금 만든 실습을 더 안전하고 친절하게 개선해줘.
  - index.html 화면에 "service_role 키는 화면 코드에 없음(정상)" 같은 안내를 추가해서, 비밀값이 브라우저에 없다는 걸 눈으로 확인시켜줘.
  - .env.local에서 공개값(VITE_)과 비밀값을 시각적으로 구분되는 주석 블록으로 나눠줘.
  - config.js의 각 줄에 "이 값은 왜 공개해도 되는가"를 한 줄 주석으로 설명해줘.
  - 단, 기존 동작은 바꾸지 말고 안내·주석만 보강해줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  index.html을 열었는데 URL/anon 키 자리에 "불러오는 중…"만 뜨고 값이 안 나와.
  config.js와 index.html 코드를 붙여넣을 테니, 키가 화면에 안 나타나는 원인을
  추정하지 말고 코드를 근거로 단계별로 짚어줘. (config.js 로드 순서, window.APP_CONFIG 이름, 오타 등)
  그리고 "이 폴더에 service_role 키가 실수로 노출된 곳은 없는지"도 파일·줄 단위로 점검해줘.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다.

## 검증법
- `before.html`의 소스(F12 → Sources)에는 키가 보이지만, `index.html`의 소스에는 키 값이 **한 글자도 없는가**? (값은 `config.js`에서만 읽어옴)
- `git status`를 실행했을 때 `.env.local`이 **추적 대상에 안 보이는가**? (`.gitignore` 덕분에 "Untracked files" 목록에도 안 떠야 정상)
- `index.html`을 열었을 때 화면에 URL · anon 키만 표시되고, service_role(비밀) 키는 어디에도 나타나지 않는가?
- `.env.local` 안에서 비밀 값(`SUPABASE_SERVICE_ROLE_KEY`)에 실수로 `VITE_` 접두를 붙이지 않았는가? (붙이면 공개 의도가 되어 위험)

> 검증용 명령(터미널에서):
> ```bash
> git init           # 아직 저장소가 아니라면
> git add .
> git status         # .env.local 이 목록에 없으면 성공
> ```

## 안전(보안) 짚고 가기
- **anon(publishable) 키**는 "공개돼도 되는 출입증"이라 화면·깃허브에 있어도 괜찮습니다. 이 실습에서 `config.js`로 옮긴 값이 여기에 해당합니다.
- **service_role(secret) 키**는 RLS를 통째로 우회하는 마스터키라, 브라우저나 깃허브에 두면 안 됩니다. 그래서 `config.js`가 아니라 `.env.local`에만 두고(자리표시자), `.gitignore`로 깃허브 유출을 막습니다.
- 중요한 점: **`.env.local`로 "분리"만 하면 끝이 아닙니다.** 진짜 안전장치는 그 파일을 `.gitignore`로 막아 **공개 저장소로 새지 않게 하는 것**입니다. 한 번이라도 키를 커밋했다면 파일 삭제로는 안 되고, 키 회전(무효화 후 재발급)이 정답입니다.

## 이 폴더의 파일
- `before.html` — 키를 코드에 박은 위험한 버전(비교용, 따라하지 마세요)
- `index.html` — 키를 분리한 안전한 버전(완성형)
- `config.js` — 화면에 들어가도 되는 공개 값(URL · anon)만 담는 분리 파일
- `.env.local` — 분리된 키 모음(공개값 + 비밀 자리표시자). 깃허브에 안 올라감
- `.gitignore` — `.env.local`을 깃에서 제외하는 규칙(핵심 한 줄)

## 관련 가이드
- 개념: [환경변수(.env) 제대로 — 무엇을 어디에, 무엇을 절대 커밋 안 하나](https://zeusk302-png.github.io/treasure/04-security/03/)
- 개념: [공개해도 되는 키 vs 절대 숨길 키 (anon vs service_role)](https://zeusk302-png.github.io/treasure/04-security/01/)
- 개념: [키가 새면 어떻게 하나 — 유출 탐지와 키 회전(rotation)](https://zeusk302-png.github.io/treasure/04-security/05/)
- 실습 모음: [직접 따라 만들기](https://zeusk302-png.github.io/treasure/practice/)
