# 실습 332 — GitHub Actions CI로 자동 검사 붙이기

코드를 GitHub에 올릴(push) 때마다 **로봇 점검원**이 자동으로 깨끗한 컴퓨터를 한 대 빌려서 우리 코드를 **설치 → 린트 → 테스트 → 빌드** 순서로 검사하게 만드는 실습입니다. 검사를 통과하지 못하면 빨간 X가 떠서, **깨진 코드가 main 브랜치로 합쳐지는 사고**를 막아 줍니다. 이렇게 "합치기 전에 기계가 자동으로 검사하는 습관"을 **CI(Continuous Integration, 지속적 통합)**라고 합니다.

> 한 줄 그림: **코드 push → GitHub Actions가 새 컴퓨터 빌림 → `npm ci`(설치) → `npm run lint`(스타일/실수 검사) → `npm test`(동작 검사) → `npm run build`(빌드 확인) → 다 통과하면 초록 체크, 하나라도 실패하면 빨간 X**

> 비유: CI는 음식점 주방에 둔 **자동 위생 점검원**입니다. 새 요리(코드)가 손님상(main 브랜치)에 나가기 전에, 점검원이 매번 "재료 다 있나(설치) · 조리법 지켰나(린트) · 맛 정상인가(테스트) · 접시에 잘 담기나(빌드)"를 자동으로 확인합니다. 한 항목이라도 틀어지면 "이건 손님상에 못 나간다"고 막아 줍니다.

> 보안 메모 — 공개해도 되는 값 vs 절대 숨겨야 하는 값
> - **공개되어도 되는 것**: `ci.yml` 워크플로우 파일 자체, `package.json`, 소스/테스트 코드. 이건 "어떤 검사를 어떻게 돌릴지"의 설명일 뿐이라 깃에 올려도 안전합니다.
> - **절대 노출하면 안 되는 비밀값**: 배포 토큰, 외부 API 키, 알림 웹훅 주소 등. 이런 값은 `ci.yml`에 직접 박지 말고 **GitHub 저장소 Settings > Secrets and variables > Actions**에만 넣고, 워크플로우에서는 `${{ secrets.이름 }}`으로 **참조만** 합니다. (이렇게 하면 Actions 로그에도 `***`로 가려져 안전합니다.)
> - 이 실습 CI는 비밀값 없이도 돌아갑니다. `.env.example`은 "나중에 비밀값을 쓸 때 어떻게 다루는지"를 보여 주는 견본일 뿐, 진짜 값은 거기에 적지 않습니다.

## 목표
- **CI가 무엇이고 왜 쓰는지** 안다: "합치기 전에 기계가 자동으로 검사 → 깨진 코드 차단"의 가치를 체감한다.
- **GitHub Actions 워크플로우 파일**(`.github/workflows/ci.yml`)을 만들고, `on`(언제) / `jobs`(무엇을) / `steps`(순서)의 뼈대를 읽을 줄 안다.
- **검사 4종(설치·린트·테스트·빌드)**이 push 한 번에 자동으로 도는 걸 직접 본다.
- **일부러 코드를 깨뜨려** 빨간 X(실패)를 띄워 보고, 고쳐서 초록 체크(통과)로 되돌리는 사이클을 경험한다.
- **비밀값은 코드가 아니라 GitHub Secrets에** 둔다는 원칙을 익힌다.

## 따라하는 단계

### A. 내 PC에서 먼저 검사가 도는지 확인하기
1. 이 폴더(`examples/332`)를 내 작업 폴더로 복사하거나, 그대로 새 GitHub 저장소의 루트로 삼습니다.
2. 터미널에서 폴더로 들어가 `npm install`을 한 번 실행합니다. (CI는 `npm ci`를 쓰지만, 로컬에선 처음 한 번 `npm install`로 `package-lock.json`을 만들어 둡니다.)
3. `npm run lint` → `npm test` → `npm run build`를 차례로 실행해, 셋 다 통과(초록)하는지 봅니다. 여기서 통과하면 CI에서도 통과할 가능성이 큽니다.

### B. GitHub에 올려 CI가 자동으로 돌게 하기
4. GitHub에서 **새 저장소(repository)**를 만듭니다.
5. 이 폴더의 파일들을 그 저장소 **루트**에 올립니다. 이때 `.github/workflows/ci.yml` 경로가 **그대로 유지**되어야 합니다. (경로/철자가 틀리면 GitHub가 워크플로우를 인식하지 못합니다.)
   ```bash
   git init
   git add .
   git commit -m "chore: add CI workflow"
   git branch -M main
   git remote add origin https://github.com/<내아이디>/<내저장소>.git
   git push -u origin main
   ```
6. push가 끝나면 GitHub 저장소 상단의 **Actions** 탭을 엽니다. `CI`라는 이름의 실행이 자동으로 시작된 게 보입니다. 클릭하면 단계별(설치→린트→테스트→빌드) 진행이 실시간으로 보입니다.
7. 모든 단계가 초록 체크가 되면, 커밋 옆에 **초록 체크 표시**가 붙습니다. 이게 "검사 통과한 코드"라는 뜻입니다.

### C. 일부러 깨뜨려 보고 → 고치기 (CI가 진짜 막는지 체험)
8. `src/math.js`의 `add` 함수를 일부러 `return a - b;`로 바꿔서 push 해 봅니다.
9. Actions 탭을 보면 **테스트 단계에서 빨간 X**가 뜹니다. 커밋 옆에도 빨간 X가 붙습니다 → "이 코드는 깨졌다"는 신호입니다.
10. 다시 `return a + b;`로 되돌려 push 하면 초록 체크로 돌아옵니다. 이 한 사이클이 CI의 핵심입니다.

### D. (선택) 합치기 전에 강제로 막기 — 브랜치 보호
11. GitHub 저장소 **Settings > Branches > Add branch ruleset(또는 Branch protection rule)**에서 main 브랜치에 대해 **"Require status checks to pass before merging"**을 켜고, 위 `build-and-test` 검사를 필수로 지정합니다.
12. 이제부터는 CI가 통과하지 못한 PR은 **Merge 버튼이 잠겨** 합칠 수 없습니다. "기계가 규칙을 강제"하는 단계까지 완성한 것입니다.

### E. (선택) 나중에 비밀값을 쓰게 될 때
13. 배포 토큰·알림 웹훅 같은 비밀값이 필요해지면, **저장소 Settings > Secrets and variables > Actions > New repository secret**에 넣습니다.
14. `ci.yml`에서는 `env: API_TOKEN: ${{ secrets.API_TOKEN }}`처럼 **참조만** 합니다. 값을 워크플로우 파일에 직접 적지 않습니다. (`.env.example`에 그 패턴을 주석으로 적어 뒀습니다.)

## 🤖 바이브코딩 프롬프트
이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 비전공 학습자를 돕는 데브옵스 멘토야. Node.js(ESM, "type":"module") 프로젝트에
  GitHub Actions CI를 처음 붙이려고 해. 아래를 만들어 줘.

  목표: main 브랜치로의 push와 pull_request마다 자동으로
        npm ci → npm run lint → npm test → npm run build 가 도는 CI.

  산출물(파일별로 전체 코드):
  1) .github/workflows/ci.yml — on: push/pull_request(둘 다 main), 수동 실행(workflow_dispatch)도 포함,
     permissions는 contents: read 로 최소화, ubuntu-latest 러너,
     actions/checkout@v4 + actions/setup-node@v4(node 20과 22 매트릭스, npm 캐시 사용).
  2) package.json — scripts에 lint(eslint .), test(node --test), build(node scripts/build.js).
  3) src/ 에 간단한 함수(add, slugify)와 node:test 기반 테스트, scripts/build.js(빌드 흉내).
  4) eslint.config.js(ESLint 9 플랫 설정), .gitignore.

  제약:
  - 비밀값은 코드에 절대 박지 말고, 필요하면 ${{ secrets.NAME }} 참조 방식으로만.
  - 모든 코드에 '무엇(기능)+왜(넣은 이유)' 한국어 주석을 달고, 식별자는 영어로.
  - 코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해 줘. 비전공자가 이해하게 한 줄씩 풀어 줘.
  ```

- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  방금 만든 CI를 다음처럼 개선해 줘. 변경된 파일의 전체 코드와, 무엇을 왜 바꿨는지 설명을 함께 줘.

  1) 캐시로 속도 올리기: setup-node의 npm 캐시가 잘 동작하는지 점검하고, 의존성이 안 바뀌면 재사용되게.
  2) 동시 실행 정리: 같은 브랜치에 빠르게 여러 번 push하면 이전 실행을 자동 취소하도록
     concurrency 설정(group, cancel-in-progress)을 추가해 줘 — 러너 시간(요금)을 아끼려고.
  3) 테스트 커버리지 또는 빌드 산출물(dist/)을 actions/upload-artifact로 올려, 실행 후 다운로드해 볼 수 있게.
  4) PR에서만 도는 추가 검사(예: 타입체크)가 필요하면 별도 job으로 분리하고 needs로 순서를 잡아 줘.

  각 변경이 '왜 비전공 첫 프로젝트에 도움이 되는지'도 한 줄씩 덧붙여 줘.
  ```

- **막혔을 때(디버깅)** 프롬프트:
  ```text
  GitHub Actions가 기대대로 안 돼. 아래 정보를 보고 원인 후보를 가능성 높은 순으로 정리하고,
  각각 어디를(파일·줄) 어떻게 고치는지 단계별로 알려 줘. 추측이면 추측이라고 표시해 줘.

  - 증상: (예) Actions 탭에 아무 실행도 안 뜬다 / 'npm ci'에서 lock 파일 오류 / 테스트는 로컬은 통과인데 CI만 실패
  - 내 ci.yml 전체:
  (여기에 ci.yml 붙여넣기)
  - 실패한 단계의 로그(빨간 부분 위주로):
  (여기에 로그 붙여넣기)

  특히 다음을 점검해 줘:
  1) 파일 경로가 정확히 .github/workflows/ci.yml 인지(폴더명·확장자).
  2) package-lock.json이 커밋돼 있는지(npm ci는 lock 파일이 있어야 함).
  3) on: 트리거 브랜치 이름이 실제 기본 브랜치(main)와 같은지.
  4) Node 버전 차이로만 깨지는지(매트릭스 중 한 버전만 실패하는지).
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다.

## 검증법
- **로컬 통과 확인**: `npm run lint`, `npm test`, `npm run build`가 내 PC에서 모두 통과(초록)하는지 본다. (셋 중 하나라도 실패하면 CI에서도 실패한다.)
- **CI 자동 실행 확인**: push 후 GitHub **Actions** 탭에 `CI` 실행이 자동으로 떠서, 4단계(설치·린트·테스트·빌드)가 모두 초록 체크로 끝나는지 본다.
- **매트릭스 확인**: Node 20과 22 두 줄이 각각 도는지 본다. (한 버전만 실패하면 버전 호환 문제다.)
- **'깨뜨리기' 테스트**: `src/math.js`의 `add`를 일부러 `a - b`로 바꿔 push했을 때 **테스트 단계가 빨간 X**로 실패하는지 확인한다. → 실패가 떠야 CI가 제 역할을 하는 것이다. 되돌리면 다시 초록으로 돌아온다.
- **비밀값이 코드에 없는지 확인**: 저장소에서 아래를 실행해 진짜 토큰/웹훅이 안 보여야 정상이다.
  - `grep -nE "hooks.slack.com/services/[A-Z0-9]|Bearer [A-Za-z0-9]{10}" .github/workflows/ci.yml` → 진짜 값이 안 나와야 한다. (`${{ secrets.NAME }}` 참조나 주석만 있어야 한다.)
- **(선택) 강제 차단 확인**: 브랜치 보호를 켠 뒤, 일부러 실패하는 PR을 올렸을 때 **Merge 버튼이 잠기는지** 확인한다.

## 파일 구성
- `.github/workflows/ci.yml` — CI 워크플로우 본체. push/PR마다 설치·린트·테스트·빌드를 Node 20·22에서 자동 실행한다.
- `package.json` — 프로젝트 명세서. `lint`/`test`/`build` 스크립트가 정의돼 있어 CI가 그 이름을 호출한다.
- `src/math.js` — 검사 대상이 될 예시 함수(`add`, `slugify`).
- `src/math.test.js` — `node:test` 기반 자동 테스트. CI의 핵심 안전망.
- `scripts/build.js` — '빌드' 흉내 스크립트(실제론 vite/next build 자리). 빌드가 깨지는지 확인한다.
- `eslint.config.js` — 린트 규칙(ESLint 9 플랫 설정).
- `.env.example` — 비밀값 견본(자리표시자만). 진짜 값은 GitHub Secrets에만 넣는다.
- `.gitignore` — `node_modules/`·`dist/`·`.env`가 깃에 안 올라가게 막는다.

## 관련 가이드
- [5권 — 배포·운영·SEO (로컬→GitHub→Vercel 자동배포 파이프라인)](../../docs/05-deploy-ops-seo/index.md)
- [13권 10 — 배포·인프라 도구 지형도 (GitHub Actions·Docker·모니터링을 무엇에 쓸까)](../../docs/13-ai-tools/10.md)
- 관련 실습: 실습 180 (n8n으로 자동 모니터링/알림) — "사람이 매번 확인하지 않고 기계가 자동으로" 한다는 자동화 사고가 같습니다.
- GitHub Actions 공식 문서(영문): https://docs.github.com/actions
- 워크플로우 문법 레퍼런스(영문): https://docs.github.com/actions/using-workflows/workflow-syntax-for-github-actions
- actions/setup-node(영문): https://github.com/actions/setup-node
