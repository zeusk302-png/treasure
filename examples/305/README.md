# 실습 305 — Vercel에 보안 헤더 깔기: CSP/HSTS 적용하고 점수 확인하기

내 코드가 아무리 깔끔해도, **브라우저에게 "이 사이트는 이렇게만 동작해"라고 규칙을 알려주지 않으면** 공격자가 끼워 넣은 스크립트가 실행되거나, 다른 사이트가 내 페이지를 몰래 액자(iframe)에 넣어 클릭을 훔칠 수 있습니다. 이 "규칙 알림표"가 바로 **보안 헤더(Security Headers)** 입니다.

보안 헤더는 사이트 화면(HTML)에 적는 게 아니라, **서버가 페이지를 보낼 때 같이 딸려 보내는 메모지**입니다. Vercel에서는 코드 한 줄 고칠 필요 없이 **`vercel.json` 파일 하나**로 이 메모지를 붙일 수 있습니다. 이번 실습에서 그 파일을 만들고, 외부 점검 도구로 **등급이 F에서 A로 올라가는 것**을 직접 캡처합니다.

> 핵심 한 줄: **"내가 못 막은 공격을 브라우저에게 대신 막아 달라고 부탁하는 마지막 방어선."** 코드 수정이 아니라 `vercel.json`에 헤더만 추가하면 됩니다.

## 목표
- 보안 헤더가 **HTML 안이 아니라 HTTP 응답에 붙는 메모지**라는 걸 이해하고, F12 → Network 탭에서 직접 눈으로 확인한다.
- `vercel.json`에 **CSP(콘텐츠 보안 정책)**, **HSTS(항상 https 강제)**, **X-Content-Type-Options**, **X-Frame-Options** 등 핵심 보안 헤더를 정확히 설정한다.
- **CSP가 인라인 `<script>`/`<style>`을 왜 막는지**, 그래서 코드를 외부 파일로 분리해야 하는 이유를 데모로 체감한다.
- securityheaders.com 같은 외부 점검 도구로 **적용 전(예: D/F) → 적용 후(예: A)** 등급 변화를 캡처해 "방어선이 실제로 세워졌음"을 증명한다.

## 따라하는 단계
1. 이 폴더의 4개 파일(`index.html`, `style.css`, `app.js`, `vercel.json`)을 GitHub 저장소에 올린다. (실습 298~303에서 쓰던 저장소에 `examples/305` 그대로 올려도 되고, 새 저장소를 만들어도 됩니다.)
2. **헤더 없는 "적용 전" 상태를 먼저 봅니다.** `vercel.json`을 잠깐 다른 이름(예: `vercel.json.off`)으로 바꿔 두고 Vercel에 배포한 뒤, 배포된 `https://...vercel.app` 주소를 **https://securityheaders.com** 에 넣어 점검합니다. 보통 **D~F 등급**이 나옵니다 — 이 결과 화면을 캡처해 둡니다. (이것이 "적용 전 캡처"입니다.)
3. `vercel.json` 안의 **`YOUR-PROJECT.supabase.co`** 자리표시자를, 내 Supabase 프로젝트 주소가 있으면 그 주소로 바꿉니다. (Supabase를 안 쓰면 `connect-src 'self'` 부분에서 `https://YOUR-PROJECT.supabase.co`를 통째로 지워도 됩니다.)
4. 파일 이름을 다시 `vercel.json`으로 되돌리고 커밋·푸시합니다. Vercel이 자동으로 재배포합니다. (배포 자동화 흐름은 실습 296/가이드 5-01 참고.)
5. 배포가 끝나면 다시 그 https 주소를 **https://securityheaders.com** 에 넣어 점검합니다. 이번엔 **A 등급**이 나오는지 확인하고, 이 화면도 캡처합니다. (이것이 "적용 후 캡처"입니다.)
6. 배포된 페이지를 직접 열어 **[내 페이지 헤더 확인하기]** 버튼을 누릅니다. 검은 박스에 7개 헤더가 모두 `[OK ]`로 찍히는지 봅니다.
7. F12(개발자도구) → **Console** 탭을 봅니다. `index.html`에 일부러 넣어 둔 인라인 `style="color: blue"`를 **CSP가 차단했다는 빨간 경고**가 떠 있고, 그 문장이 파란색이 아니라 **빨간색**으로 보이면 CSP가 제대로 작동하는 것입니다.

## 🤖 바이브코딩 프롬프트
이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다. 보안 헤더는 "값 한 글자"가 틀리면 사이트가 깨지거나 방어가 안 되므로, **AI에게 시키되 값의 의미를 같이 설명받아 직접 점검**하는 게 핵심입니다.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 웹 보안을 쉽게 설명하는 멘토야. Vercel에 정적 사이트(index.html, style.css, app.js)를 배포한다고 가정하고,
  모든 경로에 핵심 보안 헤더를 붙이는 vercel.json 파일을 만들어줘.
  포함할 헤더: Content-Security-Policy, Strict-Transport-Security, X-Content-Type-Options,
  X-Frame-Options, Referrer-Policy, Permissions-Policy, Cross-Origin-Opener-Policy.
  제약: 학습용 *.vercel.app 도메인이라 HSTS의 preload는 빼고 max-age와 includeSubDomains만 쓸 것.
  CSP는 'unsafe-inline'을 절대 쓰지 말고 script-src 'self', style-src 'self'로 엄격하게 해줘.
  각 헤더가 무엇을 막는지, 왜 그 값으로 했는지 한 줄씩 주석(또는 옆 설명)으로 풀어줘.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  방금 만든 사이트에, 지금 페이지에 실제로 적용된 보안 헤더를 눈으로 확인하는 버튼을 추가해줘.
  버튼을 누르면 fetch로 현재 페이지 자신을 다시 요청해 응답 헤더를 읽고,
  위 7개 헤더가 각각 적용됐는지 [OK]/[없음]으로 목록과 'N/7' 개수를 화면에 출력해줘.
  그리고 Supabase를 쓴다면 CSP의 connect-src에 내 프로젝트 주소만 정확히 추가하는 법도 알려줘.
  코드는 인라인 <script>가 아니라 외부 app.js로 빼서 CSP에 안 막히게 해줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  배포했더니 화면이 깨지고 콘솔에 이런 에러가 떠: (여기에 Console의 빨간 에러 메시지를 붙여넣기)
  내 vercel.json의 CSP는 이거야: (여기에 Content-Security-Policy 값을 붙여넣기)
  무엇이 어떤 헤더 규칙에 막힌 건지, 어떤 출처를 어느 지시문(script-src/style-src/connect-src 등)에
  추가해야 풀리는지 단계별로 알려줘. 단, 'unsafe-inline'으로 전부 푸는 임시방편은 빼고
  꼭 필요한 출처만 최소로 여는 방법으로 알려줘.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면, 헤더 값 하나하나가 무엇을 막는지 직접 판별할 수 있어 학습에 좋습니다.

## 검증법
- securityheaders.com 결과가 **적용 전 D~F → 적용 후 A**로 올라갔는가? (두 화면을 나란히 캡처하면 이번 실습의 결과물이 완성됩니다.)
- 페이지의 **[내 페이지 헤더 확인하기]** 버튼을 눌렀을 때 `content-security-policy`, `strict-transport-security`, `x-content-type-options`, `x-frame-options`, `referrer-policy`, `permissions-policy`, `cross-origin-opener-policy`가 **7 / 7** 로 모두 `[OK ]`인가?
- F12 → Network 탭에서 문서 요청을 클릭 → **Response Headers** 에 위 헤더들이 실제로 와 있는가? (HTML `<head>` 안에는 이 헤더들이 없습니다 — 응답에만 있어야 정상입니다.)
- 데모의 "인라인 차단 테스트" 문장이 **파란색이 아니라 빨간색**인가? (빨강이면 CSP가 인라인 style을 막은 것 = 정상.) Console에 `Refused to apply inline style ...` 같은 경고가 떴는가?
- `vercel.json`에 **실제 비밀값이 하나도 없는가?** (보안 헤더에는 비밀번호·API 키를 넣지 않습니다. Supabase 주소는 비밀이 아니라 공개되어도 되는 값이지만, 그래도 본인 것으로 정확히 채웠는지 확인합니다.)

!!! info "보안 헤더는 '비밀'이 아니라 '규칙'입니다"
    실습 300/301의 RLS나 `service_role` 키처럼 **숨겨야 하는 비밀값이 아닙니다.** 보안 헤더는 누구나 봐도 되는 **공개 규칙**입니다. 그래서 `vercel.json`은 GitHub에 그대로 커밋해도 안전합니다. 다만 `vercel.json`의 Supabase 주소(`connect-src`)는 본인 프로젝트 주소로 정확히 바꿔야, 데이터 요청이 CSP에 막히지 않습니다.

!!! warning "CSP를 켜면 '갑자기 화면이 깨질' 수 있습니다 — 정상입니다"
    `script-src 'self'`, `style-src 'self'`는 **내 사이트(self)에서 온 파일만** 실행을 허용합니다. 그래서 ① HTML 안에 직접 쓴 `<script>...</script>`/`<style>...</style>`(인라인), ② 다른 사이트에서 불러오는 폰트·분석 스크립트(예: Google Fonts, GA)가 **막힙니다.** 막히면 그건 CSP가 일을 하는 증거입니다. 필요한 출처는 CSP 값에 `style-src 'self' https://fonts.googleapis.com` 처럼 **한 줄씩 명시적으로 추가**해서 풀어 주세요. ("일단 다 풀자"고 `'unsafe-inline'`을 넣으면 CSP를 켠 의미가 사라집니다.)

!!! danger "HSTS의 preload는 신중하게 — 되돌리기 어렵습니다"
    `Strict-Transport-Security`의 `preload`는 "이 도메인은 영원히 https만 쓴다"고 브라우저 목록에 등록 신청하는 옵션입니다. 한 번 등록되면 **빼는 데 수개월**이 걸립니다. 학습·연습용 `*.vercel.app` 도메인이나 아직 https 설정이 불안한 도메인에서는 `preload`를 빼고 `max-age=63072000; includeSubDomains` 만 쓰는 게 안전합니다. 본인 소유의 안정적인 도메인을 https로 완전히 굳힌 뒤에만 `preload`를 켜세요.

!!! tip "헤더는 '내가 못 막은 것'을 대신 막는 2차 방어선"
    보안 헤더가 만능은 아닙니다. RLS(실습 300/301)로 데이터 접근을 막고, 키를 안 새게 관리하고(가이드 4-01/4-03), 그렇게 **1차로 코드에서 막은 다음**, "그래도 뚫린 한 방"을 브라우저가 막아 주는 게 보안 헤더입니다. 순서가 거꾸로 되면 안 됩니다 — 헤더만 A등급이고 RLS가 비어 있으면 데이터는 그대로 새어 나갑니다.

## 관련 가이드
- 이 실습의 점검 대상이 되는 위협들 → [비전공자용 OWASP Top 10 — AI가 만든 사이트가 자주 뚫리는 곳](../../docs/04-security/06.md)
- 공개해도 되는 값과 숨길 값의 구분 → [공개해도 되는 키 vs 절대 숨길 키 — anon vs service_role 완전 정정](../../docs/04-security/01.md)
- 헤더 전에 먼저 세우는 1차 방어선 → [RLS(행 수준 보안) — 출입증을 공개해도 안전한 진짜 이유](../../docs/04-security/02.md)
- AI가 짠 코드의 보안을 직접 점검하는 법 → [AI가 만든 코드의 보안을 디렉터가 검증하는 법](../../docs/04-security/08.md)
- `vercel.json`을 배포에 반영하는 자동배포 흐름 → [로컬 → GitHub → Vercel: 코드가 세상에 나가는 길](../../docs/05-deploy-ops-seo/01.md)
- 도메인·HTTPS와 HSTS의 관계 → [도메인 연결과 HTTPS — vercel.app 주소를 내 이름표로](../../docs/05-deploy-ops-seo/06.md)
- 보안 권 전체 보기 → [4. 안전(보안)](https://zeusk302-png.github.io/treasure/04-security/)
- 함께 보면 좋은 실습 → 실습 301 "'본인 데이터만' RLS 정책 작성하기" (`examples/301`), 실습 304 "의존성 audit" (`examples/304`)
