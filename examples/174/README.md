# Vercel 환경변수(Environment Variables)에 Supabase 키 등록하기

Supabase 키를 코드에 직접 박는 대신, **Vercel 대시보드에 키를 등록**해 두고 **배포할 때 자동으로 코드에 주입(inject)** 되게 만드는 실습입니다. 같은 코드라도 "내 컴퓨터(로컬)"와 "진짜 배포 서버(Vercel)"가 서로 다른 값을 쓸 수 있고, GitHub 저장소에는 진짜 키가 한 글자도 남지 않습니다.

> 비전공자 눈높이 한 줄 요약: 키를 코드에 적어 두면 GitHub에 올라가 버립니다. 대신 키를 **Vercel이라는 금고**에 맡겨 두고, 배포할 때 "그 금고에서 꺼내서 쓰라"고 시키는 방식입니다. 그리고 금고에 넣는 키도 **방문객 출입증(anon·공개)** 과 **마스터 키(service_role·비밀)** 를 구분해서, 비밀 키는 절대 브라우저로 내려보내지 않습니다.

## 목표

- **"코드에 키를 박지 않는다"** 가 무슨 뜻인지 손으로 체험한다. 키는 Vercel 환경변수에 두고, 배포 시 `build.js`가 읽어 `env-config.js`로 주입한다.
- **anon(공개) 키와 service_role(비밀) 키의 노출 범위 차이**를 정확히 구분한다.
  - `anon`(공개) 키 = 방문객 출입증. 브라우저로 주입돼도 되지만, **Supabase에서 RLS(행 수준 보안)가 켜져 있을 때만** 안전하다.
  - `service_role`(비밀) 키 = 마스터 키. RLS를 전부 무시한다. Vercel에 등록은 할 수 있어도 **브라우저로 내려보내는 변수에는 절대 금지.** 서버 측 함수에서만 쓴다.
- 진짜 값은 저장소에 올리지 않고, **자리표시자만 든 견본 파일**(`.env.example`, `env-config.example.js`)만 올린다. `.gitignore`로 진짜 값 파일(`.env`, `env-config.js`) 업로드를 원천 차단한다.

## 따라하는 단계

1. `examples/174/` 폴더를 엽니다. 안에 다음 파일들이 있습니다.
   - `index.html` / `style.css` / `script.js` — 화면. 키가 한 글자도 없고, 주입된 `window.__ENV__`를 **읽기만** 합니다.
   - `build.js` — 배포 시 환경변수를 읽어 `env-config.js`를 만들어 내는 작은 빌드 스크립트.
   - `vercel.json` — Vercel에게 "배포할 때 `node build.js`를 실행하라"고 알려주는 설정.
   - `env-config.example.js` / `.env.example` — 자리표시자만 든 **견본**(저장소에 올라감).
   - `.gitignore` — `.env`, `env-config.js`(진짜 값) 업로드 차단 목록.
2. **먼저 로컬에서 미리보기**를 해봅니다. 진짜 키가 없어도 화면 동작을 볼 수 있습니다.
   - 견본을 복사합니다: `cp env-config.example.js env-config.js` (윈도우 cmd는 `copy env-config.example.js env-config.js`)
   - `index.html`을 브라우저로 엽니다 → "현재 설정 상태"에 **✅ 안전 … (자리표시자 상태)** 가 보입니다.
3. **진짜 anon 키를 넣어 로컬 연결**을 확인합니다(선택).
   - Supabase 대시보드 → Project Settings → API → `Project URL` 과 `anon public` 키를 복사합니다.
   - `env-config.js`의 자리표시자 두 줄을 그 값으로 바꿉니다. (⚠️ `service_role` 키는 **절대** 넣지 않습니다.)
   - 다시 `index.html`을 열고 **"Supabase에 연결해 보기"** 버튼을 누르면 키 인증 성공 메시지가 뜹니다.
4. **GitHub에 올립니다.** 이때 진짜 키가 안 올라가는지 확인하는 게 핵심입니다.
   ```bash
   git init
   git add .
   git status        # ← 여기에 env-config.js / .env 가 보이면 안 됩니다!
   ```
   `.env.example`과 `env-config.example.js`(견본)만 올라가고, 진짜 값 파일은 무시되어야 정상입니다.
5. **Vercel에 배포**합니다. [vercel.com](https://vercel.com)에서 GitHub 저장소를 Import 합니다. (부트캠프에서 한 방식 그대로)
6. **Vercel 환경변수를 등록**합니다. 이것이 이번 실습의 핵심 단계입니다.
   - Vercel 프로젝트 → **Settings → Environment Variables** 로 갑니다.
   - 다음 두 개를 추가합니다(Name / Value).
     - `SUPABASE_URL` = `https://내-프로젝트.supabase.co`
     - `SUPABASE_ANON_KEY` = (Supabase의 `anon public` 키)
   - 적용 범위(Environments)는 보통 Production / Preview / Development 모두 체크합니다.
   - ⚠️ `service_role` 비밀 키가 **꼭** 필요하다면 `SUPABASE_SERVICE_ROLE_KEY`라는 이름으로 따로 등록할 수는 있지만, 이 실습의 `build.js`는 그 값을 **읽지 않습니다**(브라우저로 안 내려보냄). 비밀 키는 서버 측 함수에서만 씁니다.
7. **재배포(Redeploy)** 합니다. 환경변수는 "다음 배포부터" 적용되므로, 값을 추가한 뒤에는 Deployments → 점 세 개 → **Redeploy** 를 눌러야 반영됩니다.
8. 배포된 주소(`https://....vercel.app`)를 열어 화면의 "현재 설정 상태"에 **✅ 안전: anon(공개) 키만 주입되어 있습니다** 가 뜨는지 확인합니다. 이게 보이면 "코드에 키를 안 박고, Vercel이 배포 때 주입"하는 흐름이 완성된 것입니다.

## 어떻게 주입되나? (한눈에 흐름)

```
Vercel 환경변수(금고)        배포(빌드)할 때                브라우저(이 페이지)
SUPABASE_URL        ──┐
SUPABASE_ANON_KEY   ──┴─▶  node build.js  ──▶  env-config.js  ──▶  window.__ENV__  ──▶  Supabase 연결
                          (process.env 읽음)   (.gitignore로 업로드 차단)
SUPABASE_SERVICE_ROLE_KEY ─✗ (build.js가 읽지 않음 → 브라우저로 절대 안 내려감)
```

## 🤖 바이브코딩 프롬프트

이 실습("키를 코드에 박지 않고 Vercel 환경변수로 주입")을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다. 역할·목표·제약을 분명히 적을수록 결과가 안전해집니다.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 보안에 깐깐한 웹 강사야. 비전공자용 실습 페이지를 만들어줘.
  목표: Supabase 키를 "코드에 박지 않고" Vercel 환경변수에 두고, 배포할 때 자동으로 주입하는 흐름을 보여주는 정적 사이트.
  만들 파일:
    - index.html / style.css / script.js : 화면. 키를 한 글자도 적지 말고, window.__ENV__(주입된 설정)를 "읽기만" 해.
    - build.js : 배포 시 process.env 의 SUPABASE_URL, SUPABASE_ANON_KEY 를 읽어 env-config.js 파일을 생성하는 Node 스크립트.
    - vercel.json : buildCommand 를 "node build.js" 로 설정.
    - .env.example / env-config.example.js : 진짜 값 대신 "자리표시자"만 든 견본.
    - .gitignore : .env 와 env-config.js(진짜 값) 업로드를 차단하되, *.example 견본은 올라가게.
  제약: anon(공개) 키만 브라우저로 내려보내고, service_role(비밀) 키는 build.js 가 절대 읽지 않게 해.
  코드만 주지 말고 왜 그렇게 했는지 한국어 주석으로 한 줄씩 설명해줘.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  여기에 "안전 점검" 기능을 추가해줘.
  1) 페이지 로드 시 window.__ENV__ 가 있는지, 자리표시자 그대로인지(=미주입), 진짜 anon 키가 주입됐는지를 구분해 "현재 설정 상태"에 표시.
  2) 만약 주입된 값 어딘가에 "service_role" 이라는 글자가 섞여 있으면 🚨 위험 경고를 띄우고 연결 버튼을 비활성화.
  3) build.js 에도 안전장치: ANON 키 자리에 service_role 키가 들어오면 빌드를 중단(process.exit(1))하게.
  4) "Supabase에 연결해 보기" 버튼: anon 키로 가볍게 핑을 보내, 테이블이 없거나 RLS로 막혀도 "키 인증은 성공"으로 안내.
  보안 판단(왜 anon은 공개해도 되고 service_role은 안 되는지)을 주석으로 설명해줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  Vercel에 배포했는데 화면에 "env-config.js 를 찾지 못했습니다" 또는 계속 "자리표시자 상태"라고 떠.
  내 vercel.json, build.js, .gitignore 내용을 붙여넣을게. 아래를 단계별로 점검해줘:
  - buildCommand 가 실제로 실행됐는지(Vercel 배포 로그 확인 방법)
  - 환경변수 이름 철자(SUPABASE_URL / SUPABASE_ANON_KEY)가 정확한지
  - 환경변수를 추가한 뒤 Redeploy 를 눌렀는지(환경변수는 다음 배포부터 적용)
  원인 후보를 가능성 높은 순서로 정리하고, 각각 어떻게 확인/수정하는지 비전공자가 이해하게 풀어줘.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다. 특히 이 실습처럼 보안이 걸린 주제는 "공개해도 되는 값과 숨겨야 하는 값을 주석으로 구분해줘"를 꼭 붙이세요.

## 검증법

1. `git status`에서 **`env-config.js`와 `.env`가 목록에 없어야** 합니다. 보이면 `.gitignore` 철자/위치를 다시 확인합니다.
2. 반대로 `env-config.example.js`와 `.env.example`(견본)은 `git status`에 **나타나야** 정상입니다(다음 사람을 위한 안내 파일).
3. GitHub 저장소를 웹에서 열어 **검색창에 `anon` 또는 키 일부를 검색**했을 때 진짜 키 값이 나오지 않아야 합니다.
4. Vercel 환경변수를 **등록하기 전에** 배포한 사이트를 열면 화면에 **✅ 안전 …(자리표시자/미주입 상태)** 가 떠야 합니다(키가 코드에 없다는 증거).
5. 환경변수를 등록하고 **Redeploy 한 뒤** 사이트를 열면 **✅ 안전: anon(공개) 키만 주입되어 있습니다** 로 바뀌고, "Supabase에 연결해 보기" 버튼이 활성화됩니다.
6. (보안 핵심 점검) `env-config.js`나 Vercel의 브라우저용 변수에 `service_role`이라는 글자가 섞이면 화면에 **🚨 위험!** 경고가 뜹니다. 평소엔 이 경고가 **안 떠야** 정상입니다.
7. 배포 사이트에서 **F12 → 소스 보기**로 `env-config.js`를 열었을 때 보이는 키가 `anon` 키 하나뿐인지 확인합니다. `service_role` 키가 보이면 즉시 폐기 후 재발급(키 회전)해야 합니다.

## 관련 가이드 링크

- 배포·운영 개념(환경변수·도메인·재배포): [5. 배포·운영·SEO](https://zeusk302-png.github.io/treasure/05-deploy-ops-seo/) — `docs/05-deploy-ops-seo/`
- 공개 키 vs 비밀 키 정확히 구분: [4. 안전(보안)](https://zeusk302-png.github.io/treasure/04-security/) — `docs/04-security/01.md` (anon/publishable vs service_role/secret)
- RLS가 왜 출입증을 공개해도 안전하게 만드는지: `docs/04-security/02.md`
- 환경변수(.env) 제대로 — 무엇을 어디에 두고 무엇을 절대 커밋 안 하나: `docs/04-security/03.md`
- 키가 이미 새어 나갔을 때 — 유출 탐지와 키 회전(rotation): `docs/04-security/05.md`
- 짝꿍 실습(비밀키 분리·`.gitignore`): `examples/173/`
- Supabase 연동 기본 실습: `examples/03-supabase-guestbook/`
- 같은 카테고리(배포·운영·도구): `examples/_catalog.json` 의 `code: "H"` 항목들
