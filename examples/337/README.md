# 실습 337 — 캐시·CDN 헤더로 정적자원 빠르게 하기

내 사이트의 이미지·CSS·JS가 **재방문할 때 즉시 뜨게** 만드는 실습입니다. 비결은 화면 코드가 아니라, 파일을 내려줄 때 함께 붙는 **`Cache-Control` 헤더**입니다. 이 헤더 한 줄이 브라우저와 CDN에게 "이 파일은 1년 동안 다시 받지 마 / 매번 새로 확인해 / 아예 저장하지 마"를 지시합니다. 동시에, 파일을 고쳤는데 옛날 게 계속 보이는 골치 아픈 문제를 **버전 쿼리(캐시 버스팅)**로 푸는 법을 익힙니다.

> 한 줄 그림: **방문자 → CDN/브라우저가 "이 파일 캐시본 있나?" 확인 → 있으면 네트워크 없이 즉시 표시(빠름) → 파일을 고치면 `?v=` 값을 올려 새 URL로 만들어 → 그제서야 새로 받음**

> 비유: 캐시는 **자주 쓰는 물건을 책상 위에 둬서 매번 창고까지 안 가는 것**입니다. `Cache-Control`은 그 물건에 붙인 **포스트잇**이에요. "이건 1년간 안 바뀌니 그냥 써"(immutable), "쓰기 전에 창고에 안 바뀌었는지 물어봐"(no-cache), "이건 저장하지 말고 매번 새로 가져와"(no-store). 그리고 물건 내용이 바뀌면 **이름표(URL)를 새로 붙여** 헷갈리지 않게 하는 게 캐시 버스팅입니다.

> 보안 메모 — 무엇이 공개여도 되고 무엇을 숨기나
> - **공개되어도 되는 값**: `Cache-Control` 헤더와 `vercel.json`의 캐시 규칙. 이건 "이 파일을 어떻게 캐시할지"를 정하는 **공개 설정**이라 코드/설정 파일에 그대로 둬도 안전합니다.
> - **이 실습엔 비밀값이 없습니다**: 그래도 다른 실습과 같은 안전 습관을 유지하려고 `.env.example`(자리표시자)과 `.gitignore`(`.env` 제외)를 함께 둡니다. API 키·토큰을 쓰는 실습으로 확장할 땐 그 값들은 절대 코드에 박지 말고 `.env`/플랫폼 환경변수에만 넣으세요.

## 목표
- **재방문이 빨라지는 원리를 본다**: 같은 파일이라도 `Cache-Control` 헤더에 따라 `200 (from disk cache)`(즉시) / `304 (Not Modified)`(재검증) / 매번 새로 받기로 갈린다는 걸 F12 Network 탭에서 직접 확인한다.
- **자원 종류별 캐시 정책을 구분한다**: HTML(=항상 최신, `no-store`) · 버전 박힌 정적자원(=`max-age=31536000, immutable`) · 고정 이름 자원(=`no-cache, must-revalidate`)을 나눠 쓰는 이유를 안다.
- **캐시 버스팅(버전 쿼리)을 손으로 해본다**: 파일을 고친 뒤 `?v=1` → `?v=2`로 올려 새 버전이 즉시 반영되게 만든다.
- **CDN 배포로 옮긴다**: 로컬 서버(`server.js`)에서 본 정책을 `vercel.json`(또는 Netlify `_headers`)으로 그대로 선언해, 실제 CDN에서 같은 헤더가 나가게 한다.

## 따라하는 단계

### A. 로컬에서 캐시 데모 서버 띄우기
1. 이 폴더에서 터미널을 열고 의존성을 설치합니다: `npm install`
2. 서버를 켭니다: `npm start` → 콘솔에 `http://localhost:3000` 안내가 뜹니다.
3. 브라우저로 접속한 뒤 **F12 → Network 탭**을 엽니다. (없으면 새로고침)

### B. 자원별 캐시 상태 관찰하기 (핵심)
4. 페이지를 **두 번 새로고침**하며 Network 탭에서 각 파일의 **Status**와 **Cache-Control** 열을 봅니다.
   - `style.css?v=1`, `script.js?v=1` (`/static/`) → 두 번째부터 **`200 (from disk cache)`** = 네트워크 없이 즉시. (`Cache-Control: public, max-age=31536000, immutable`)
   - `logo.svg` (`/assets/`) → 새로고침마다 **`304 (Not Modified)`** = 서버에 "안 바뀌었지?"만 묻고 캐시본 사용. (`Cache-Control: no-cache, must-revalidate`)
   - `localhost` 문서(HTML) → 매번 새로 받음. (`Cache-Control: no-store`)
5. 페이지의 **"캐시 정책 불러오기"** 버튼을 눌러, 서버의 `/headers` 응답으로 지금 적용된 정책을 글로 확인합니다.

### C. 캐시 버스팅 직접 해보기
6. `public/static/style.css`를 열어 `--main` 색을 다른 색(예: `#dc2626`)으로 바꿔 저장합니다.
7. 그냥 새로고침하면 **옛날 색이 그대로** 보일 수 있습니다(1년 immutable 캐시 때문). 이게 바로 "고쳤는데 안 바뀌는" 문제입니다.
8. `public/index.html`에서 `style.css?v=1`을 **`style.css?v=2`**로 바꿔 저장하고 새로고침하세요. **새 URL이라 새 색이 즉시** 반영됩니다 → 이것이 캐시 버스팅(버전 쿼리)입니다.

### D. CDN(Vercel)으로 옮겨 같은 헤더 내보내기
9. 이 폴더를 Vercel에 배포하면(또는 GitHub 연결 후 import), `vercel.json`의 규칙대로 **CDN이 같은 `Cache-Control` 헤더**를 자원별로 붙여 줍니다. (서버 코드 없이 설정 파일만으로 동작)
10. 배포된 주소에서도 F12 Network로 `/static/*`이 `immutable`로, `/assets/*`이 `no-cache`로 나가는지 확인합니다. (Netlify면 `vercel.json` 대신 `_headers` 파일, Cloudflare면 규칙으로 같은 헤더를 겁니다.)

> CDN이 왜 더 빠른가: CDN은 전 세계 곳곳에 사본을 둔 **창고 체인**입니다. 캐시 헤더로 "오래 캐시해도 된다"고 알려 주면, 방문자와 가까운 창고에서 즉시 꺼내 줘서 서버까지 가는 거리가 줄어듭니다.

## 🤖 바이브코딩 프롬프트
이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 친절한 웹개발 멘토야. 비전공자가 'Cache-Control 헤더'를 눈으로 이해할 수 있는
  아주 작은 Node.js + Express 데모 서버(server.js)와 public/ 정적 폴더를 만들어 줘.
  요구사항:
  - 자원을 3종류로 나눠 서로 다른 캐시 정책을 적용할 것:
    (1) HTML 문서('/') → Cache-Control: no-store  (항상 최신)
    (2) 버전 박힌 정적자원('/static/*') → public, max-age=31536000, immutable  (1년 캐시)
    (3) 고정 이름 자원('/assets/*', 예: 로고 이미지) → no-cache, must-revalidate (매번 304 재검증)
  - public/index.html은 /static/style.css?v=1 과 /static/script.js?v=1 을 불러오고(=버전 쿼리),
    /assets/logo.svg(고정 이름)도 표시할 것.
  - 비밀값은 하나도 쓰지 말 것(캐시 헤더는 공개 설정).
  제약: 코드만 주지 말고 '무엇을 하는 줄'인지 + '왜 그 정책인지'를 한국어 주석으로 한 줄씩 풀어서 달아 줘.
  변수·함수명은 영어로. 파일 맨 위엔 '이 파일이 무엇이고 왜 있는지' 요약 주석 한 블록을 넣어 줘.
  ```

- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  방금 만든 캐시 데모에 다음을 추가해 줘:
  1) 학습용 진단 엔드포인트 GET /headers — 자원 종류별로 어떤 Cache-Control을 쓰는지 JSON으로 설명.
     이 응답 자체는 no-store로 캐시 안 되게.
  2) index.html에 '캐시 정책 불러오기' 버튼 — 누르면 fetch('/headers', { cache: 'no-store' })로 받아
     화면에 보여 주되, 반드시 textContent로 출력해(innerHTML 금지, XSS 방지) 이유 주석도 달아 줘.
  3) Vercel 배포용 vercel.json도 만들어, /static/* 은 immutable, /assets/* 은 no-cache, '/' 는 no-store가
     CDN에서 나가게 선언해 줘. (Netlify의 _headers, Cloudflare 규칙과의 차이도 한 줄로 설명)
  4) 캐시 버스팅을 손으로 체험하는 절차를 README에 적어 줘: style.css를 고친 뒤 ?v=1 → ?v=2 로 올리기.
  각 줄에 '왜 이렇게 했는지' 한국어 주석을 유지해 줘.
  ```

- **막혔을 때(디버깅)** 프롬프트:
  ```text
  캐시 데모에서 문제가 생겼어. 비전공자도 이해하게 원인과 해결을 단계별로 짚어 줘.
  증상: style.css의 색을 바꿔 저장하고 새로고침했는데 옛날 색이 그대로 보여. (또는 304/200 from cache가 헷갈려)
  내가 확인한 것: F12 Network 탭에서 style.css의 Status가 '200 (from disk cache)'로 보임.
  아래를 알려 줘:
  1) 왜 안 바뀌는지(immutable 1년 캐시 + 같은 URL이라 새로 안 받는다는 원리),
  2) 어떻게 강제로 새로 받게 하는지(캐시 버스팅 ?v= 올리기, 또는 개발 중엔 '캐시 사용 안 함' 체크),
  3) 자원 종류별로 어떤 Cache-Control이 적절한지 표로 정리,
  4) no-store / no-cache / immutable 의 차이를 한 문장씩 쉽게.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다.

## 검증법
- **재방문 즉시 표시 확인**: F12 → Network에서 페이지를 두 번 새로고침했을 때 `/static/style.css?v=1`, `/static/script.js?v=1`의 Status가 **`200 (from disk cache)`** 로 바뀌는지 본다(=네트워크 없이 즉시).
- **재검증(304) 확인**: `/assets/logo.svg`가 새로고침마다 **`304 (Not Modified)`** 로 오는지 본다(=본문 안 받고 신선도만 확인).
- **HTML은 항상 최신 확인**: 문서 요청의 응답 헤더에 `Cache-Control: no-store`가 있는지 본다.
- **캐시 버스팅 동작 확인**: `style.css`를 고친 뒤 `?v=1`→`?v=2`로 올리면 **새 내용이 즉시 반영**되고, 안 올리면 옛날 게 보이는 걸 비교한다.
- **헤더 직접 확인(터미널)**: 서버가 켜진 상태에서 아래로 실제 헤더를 본다.
  - `curl -I http://localhost:3000/static/style.css?v=1` → `Cache-Control: public, max-age=31536000, immutable` 이 보이면 정상.
  - `curl -I http://localhost:3000/assets/logo.svg` → `Cache-Control: no-cache, must-revalidate` 가 보이면 정상.
- **비밀값이 없는지 확인**: 이 폴더의 어떤 파일에도 API 키·토큰 같은 진짜 비밀값이 없어야 정상이다(캐시 헤더는 공개 설정).

## 파일 구성
- `server.js` — 자원 종류별로 다른 `Cache-Control` 헤더를 붙이는 학습용 Express 서버. `/headers` 진단 엔드포인트 포함.
- `public/index.html` — 측정 대상 데모 페이지. 버전 쿼리(`?v=`)로 정적자원을 불러오고 캐시 정책 버튼을 둔다.
- `public/static/style.css` · `public/static/script.js` — `/static`(1년 immutable 캐시)으로 서빙되는 정적자원. 캐시 버스팅 대상.
- `public/assets/logo.svg` — `/assets`(매번 재검증)로 서빙되는 고정 이름 자원.
- `vercel.json` — CDN(Vercel) 배포 시 같은 캐시 헤더를 코드 없이 선언하는 설정.
- `package.json` — 실행 스크립트(`npm start`)와 의존성(express).
- `.env.example` — 환경변수 견본(이 실습엔 비밀값 없음, 안전 습관용 자리표시자만).
- `.gitignore` — `.env`·`node_modules` 등이 깃에 안 올라가게 막는다.

## 관련 가이드
- [11권 07 — 캐싱 전략 (무엇을 어디에 저장해 둘까)](../../docs/11-backend-advanced/07.md)
- [13권 10 — 배포·인프라 도구 지형도 (무엇에 올릴까: CDN·배포 플랫폼)](../../docs/13-ai-tools/10.md)
- [13권 04 — Redis 연동 (캐시·세션·속도: 더 빠른 서버측 캐시로 확장)](../../docs/13-ai-tools/04.md)
- [5권 — 배포·운영·SEO 개요](../../docs/05-deploy-ops-seo/index.md) · [5권 05 — Core Web Vitals와 Lighthouse (캐시 효과를 숫자로 검증)](../../docs/05-deploy-ops-seo/05.md)
- MDN — `Cache-Control`(영문): https://developer.mozilla.org/en-US/docs/Web/HTTP/Headers/Cache-Control
- Vercel — Headers 설정 문서(영문): https://vercel.com/docs/edge-network/headers
- web.dev — HTTP caching 가이드(영문): https://web.dev/articles/http-cache
