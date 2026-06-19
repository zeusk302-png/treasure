# Pull Request로 미리보기 검토 후 라이브에 합치기

웹사이트를 고칠 때 가장 안전한 방법은 **"바로 라이브에 올리지 않고, 합치기 전에 한 번 검토받는 것"** 입니다. 그 검토 절차의 이름이 **Pull Request(줄여서 PR)** 입니다. PR은 *"제 브랜치의 변경을 `main`(라이브)에 합쳐 주세요"* 라는 **공식 요청서**입니다. PR을 열면 Vercel이 그 변경 전용 **Preview URL**을 자동으로 붙여 주고, 우리는 그 임시 주소에서 **바뀔 화면을 미리** 본 뒤, 마음에 들 때만 **Merge(합치기)** 버튼을 눌러 라이브에 반영합니다.

요즘은 AI(Claude 등)에게 코드를 시키는 일이 많은데, **AI가 만든 코드를 검토 없이 바로 라이브에 올리면** 사고가 납니다. PR은 바로 그 **AI 작업물 안전 검수** 단계입니다. 이 실습의 **결과물(Deliverable)** 은 두 가지입니다: **검토 후 병합(Merge)된 PR 1건**, 그리고 그 결과로 **갱신된 라이브 사이트**.

이 폴더의 `index.html` 은 실제 GitHub/Vercel 화면을 흉내 낸 **연습판(시뮬레이터)** 입니다. 설치 없이 더블클릭으로 열려서, "PR 보기 → diff 확인 → 체크리스트 검토 → Merge → 라이브 갱신" 흐름을 손으로 한 번 따라가 볼 수 있습니다. 그다음 진짜 GitHub + Vercel에서 똑같이 해 봅니다.

> 비전공자 눈높이 한 줄 요약: PR은 **"이거 라이브에 올려도 될까요?"라고 묻는 결재 서류**입니다. 서류에는 *무엇이 바뀌는지(diff)* 와 *미리보기 링크(Preview)* 가 붙습니다. 결재(검토)가 끝나야 **합치기(Merge)** 도장을 찍고, 그때서야 진짜 라이브가 바뀝니다.

## 목표

- **Pull Request가 무엇인지** 이해한다: 브랜치의 변경을 `main`에 합치기 전, 무엇이 바뀌는지 함께 검토하는 **요청서 + 검토 공간**.
- PR에 자동으로 붙는 **Preview URL로 "바뀔 화면"을 먼저 확인**하고, **Files changed(diff)** 로 *의도한 변경만* 들어갔는지 읽는 법을 익힌다.
- 검토(리뷰)를 통과한 뒤 **Merge하면 `main`이 갱신 → Vercel이 자동으로 Production(라이브) 배포** 한다는 흐름을 끝까지 따라간다.
- (보안 원칙) PR diff에 **비밀값(`service_role` 키 등)이 섞여 있지 않은지** 검토 항목으로 확인한다. 공개 가능한 값(anon 키·도메인)과 비밀값을 구분하고, 비밀값은 코드 대신 `.env`/Vercel 환경변수에 두며 `.gitignore`로 막는다(자리표시자는 `.env.example`).

## 따라하는 단계

### A. 연습판으로 흐름 감 잡기 (이 폴더의 화면)

1. `examples/177/` 폴더의 `index.html` 을 브라우저로 엽니다. (더블클릭으로 열립니다.)
2. 맨 위 **"0) 지금 상태"** 보드를 봅니다. **Production(파랑 버튼, 옛날 그대로)** 과, 앞 실습에서 만든 **Preview(초록 버튼, 바뀔 화면)** 두 주소가 함께 살아 있습니다.
3. **"1) Pull Request 열기"** 카드를 봅니다. PR 제목·브랜치 방향(`feature/new-hero → main`)·설명, 그리고 Vercel이 자동으로 붙인 **Preview 링크**가 보입니다.
4. 그 아래 **Files changed(diff)** 를 읽습니다. 빨강 한 줄(`- 파랑`)이 지워지고 초록 한 줄(`+ 초록`)이 들어오는, **딱 한 줄짜리 변경**임을 눈으로 확인합니다.
5. **"2) 검토(Review)"** 의 **체크리스트 4개를 모두 체크**합니다. (Preview 확인 / diff 확인 / 비밀키 없음 / 빌드 Ready) → 4개를 다 체크해야 **Merge 버튼이 초록색으로 열립니다.**
6. **Merge pull request** 버튼을 누릅니다. 터미널 로그가 흐르고, PR 상태가 `Open → Merged`(보라)로 바뀌며, **Production 보드의 버튼이 초록으로 갱신**됩니다.
7. 맨 아래 **"3) 결과물"** 칸에서 *병합된 PR + 갱신된 라이브* 두 가지가 나타나는지 봅니다. **"처음부터 다시"** 로 흐름을 한 번 더 반복해 순서를 몸에 익힙니다.

### B. 진짜 GitHub + Vercel에서 하기

> 전제: 앞 실습(176)대로 **새 브랜치를 push해 Preview URL이 이미 떠 있는** 상태여야 합니다. (GitHub 저장소가 Vercel에 연결돼 자동 배포 중)

8. **GitHub 저장소 페이지**로 갑니다. 브랜치를 막 push했다면 상단에 **"Compare & pull request"** 노란 버튼이 보입니다. 없으면 **Pull requests 탭 → New pull request** 를 누릅니다.
9. **합치는 방향**이 `base: main ← compare: feature/new-hero` 인지 확인합니다. (기준은 `main`, 가져올 쪽은 내 브랜치)
10. **제목과 설명**을 적습니다. 이 폴더의 **`pull_request.md`** 내용을 그대로 복사해 붙여 넣으면 됩니다. (제목 한 줄 + 본문 + 리뷰 체크리스트) → **Create pull request** 클릭.
11. PR이 열리면 잠시 뒤 **Vercel 봇이 코멘트로 Preview URL**을 답니다. 형식은 보통 이렇습니다.
    ```text
    https://<프로젝트>-git-<브랜치명>-<계정스코프>.vercel.app
    예) https://my-site-git-feature-new-hero-myname.vercel.app
    ```
    그 링크를 **실제로 열어** 바뀐 화면(초록 버튼)을 눈으로 확인합니다.
12. PR의 **Files changed 탭**을 열어 **diff**를 읽습니다. *의도한 한 줄만* 바뀌었는지, **비밀키나 `.env` 값이 끼어 있지 않은지** 확인합니다. (있다면 Merge하지 말고 그 줄을 빼세요.)
13. 검토가 끝나면 PR 화면 아래의 **Merge pull request → Confirm merge** 를 누릅니다. (원하면 옆 화살표에서 *Squash and merge* 를 골라 커밋을 하나로 합칠 수 있습니다.) PR 상태가 **Merged(보라)** 로 바뀝니다.
14. **Vercel 대시보드 → Deployments** 로 가면, `main`이 갱신되며 **Production 배포가 자동으로 새로 시작**되어 Building → Ready 가 되는 것이 보입니다.
15. **Production 주소**(`<프로젝트>.vercel.app`)를 새로고침해 **바뀐 내용(초록 버튼)이 라이브에 반영**됐는지 확인합니다. 이게 두 번째 결과물입니다.
16. (정리, 선택) PR 화면에서 **Delete branch** 를 눌러 다 쓴 브랜치를 정리합니다. → 해당 Preview도 함께 사라집니다.

## 🤖 바이브코딩 프롬프트

이 실습(PR로 검토 후 Merge하는 흐름 연습판)을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다. 순서대로 시키면 됩니다.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 비전공자에게 "Pull Request(PR)로 검토 후 라이브에 합치는 흐름"을 가르치는 강사야.
  설치 없이 더블클릭으로 열리는 정적 웹페이지(HTML/CSS/JS, 외부 라이브러리 없음)로
  GitHub/Vercel 화면을 흉내 낸 "연습판 시뮬레이터"를 만들어 줘.

  화면 구성(위에서 아래로):
  0) 지금 상태 보드 — Production(파랑, 옛날 그대로)과 Preview(주황, 바뀔 화면) 두 카드.
  1) Pull Request 카드 — 상태배지(Open), 제목, 브랜치 방향(feature/new-hero → main),
     설명, Vercel 봇이 붙인 Preview 링크.
  2) Files changed(diff) — 빨강 한 줄(- 파랑)이 지워지고 초록 한 줄(+ 초록)이 들어오는
     딱 한 줄짜리 변경을 보여 줘.

  제약: 한국어 UI, 비전공자가 읽기 쉬운 친절한 문구. 코드만 주지 말고
  "왜 이렇게 했는지"를 한국어 주석으로 한 줄씩 풀어서 달아 줘.
  ```

- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  앞에서 만든 연습판에 "검토 → Merge → 결과물" 상호작용을 추가해 줘.
  - 검토 체크리스트 4개(Preview 확인 / diff 확인 / 비밀키 없음 / 빌드 Ready)를 만들고,
    4개를 모두 체크해야 Merge 버튼이 초록색으로 활성화되게 해 줘(미체크면 disabled).
  - Merge 버튼을 누르면: 터미널 로그가 한 줄씩 흐르고, PR 배지가 Open(초록)→Merged(보라)로,
    Production 보드 설명이 "초록 버튼 반영"으로 갱신되고, 맨 아래 결과물 패널이 나타나게 해 줘.
  - "처음부터 다시" 버튼으로 모든 상태를 초기값으로 되돌리게 해 줘.
  추가로, 진짜 GitHub PR에 붙여 넣을 제목·설명·리뷰 체크리스트가 담긴
  pull_request.md 템플릿과, 비밀값을 막는 .gitignore / .env.example(자리표시자만)도 만들어 줘.
  ```

- **막혔을 때(디버깅)** 프롬프트:
  ```text
  버튼을 4개 다 체크했는데도 Merge 버튼이 계속 회색(비활성)이야. 아래 코드와 함께 원인을 찾아 줘.
  (여기에 script.js 일부와 브라우저 콘솔 에러 메시지를 붙여넣기)
  점검해 줄 것:
  1) 체크박스 querySelector 선택자가 실제 HTML class와 일치하는지
  2) change 이벤트가 모든 체크박스에 연결됐는지, allChecked() 판정이 맞는지
  3) 콘솔에 "null" 관련 에러가 있으면 어떤 id를 못 찾는 건지
  원인과 고친 코드를 주고, 비전공자가 이해하게 한 줄씩 풀어서 설명해 줘.
  ```

> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 결과물이 학습에 훨씬 좋아집니다. 또한 "보안: PR diff에 service_role 같은 비밀키가 절대 들어가지 않게 해줘"를 항상 같이 시키세요.

## 검증법

1. **연습판 검증**: 체크리스트 4개를 모두 켜야만 Merge 버튼이 열리고, Merge하면 PR 배지가 `Open(초록) → Merged(보라)` 로 바뀌고 Production 보드의 버튼 설명이 "초록"으로 갱신되며 맨 아래 결과 칸이 나타나면 성공입니다.
2. **결과물 1 — 병합된 PR**: 진짜 GitHub의 PR 화면 상단 배지가 **보라색 `Merged`** 로 바뀌고, *"… merged commit … into main"* 문구가 보이면 PR 1건이 검토 후 병합된 것입니다.
3. **결과물 2 — 갱신된 라이브**: **Production 주소**를 새로고침하면 바뀐 내용이 보여야 합니다. (Merge 전에는 옛날 그대로, Merge 후에는 새 내용 — 이 "전/후 차이"가 핵심 증거입니다.)
4. **자동 배포 확인**: Vercel Deployments 목록에 **Merge 직후 새 Production 배포**가 자동으로 생겼는지 확인합니다. (내가 따로 배포 버튼을 누른 게 아니라 Merge만으로 생겼다는 점이 포인트)
5. **흔한 실수 점검**:
   - **Merge했는데 라이브가 안 바뀜** → Vercel Deployments에서 그 배포가 `Ready(초록)`인지 `Error(빨강)`인지 보세요. Error면 빌드 로그를 확인합니다. Ready인데도 그대로면 브라우저 캐시일 수 있으니 **강력 새로고침**(Ctrl+Shift+R) 하세요.
   - **Merge 버튼이 회색(비활성)** → GitHub에서는 충돌(conflict)이 있거나 필수 리뷰/체크가 안 끝난 경우입니다. 충돌 안내가 있으면 브랜치를 최신 `main`과 맞춘 뒤 다시 시도합니다.
   - **합치는 방향이 거꾸로**(`base`에 내 브랜치가 들어감) → 9번에서 `base: main ← compare: 내 브랜치` 가 맞는지 다시 확인합니다.
6. **보안/노출 점검(필수)**: PR의 **Files changed** 에 `.env`나 **`service_role` 키 같은 비밀값이 절대 보이면 안 됩니다.** anon(공개) 키나 도메인은 노출돼도 괜찮지만, secret 키는 RLS를 무시하는 마스터 키라 한 번 올라가면 키를 폐기·재발급해야 합니다. PR에 올라가는 환경 견본은 **자리표시자만 든 `.env.example`** 뿐이어야 합니다.

## 관련 가이드 링크

- 배포·운영 개념(PR·Preview·Merge 배포): [5. 배포·운영·SEO](https://zeusk302-png.github.io/treasure/05-deploy-ops-seo/) — `docs/05-deploy-ops-seo/`
- 바로 앞 단계(브랜치 push → Preview URL 받기) — 짝꿍 실습: `examples/176/`
- 자동배포(브랜치 push → 배포) 기초: `examples/170/`
- 환경 분리(Production/Preview 환경변수): `examples/175/`
- 잘못된 배포 즉시 되돌리기(Instant Rollback): `examples/179/`
- 공개(anon) 키 vs 비밀(service_role) 키 구분, RLS, `.env` 원칙: `docs/04-security/01.md`, `docs/04-security/03.md`
- GitHub Pull Request 공식 문서: https://docs.github.com/ko/pull-requests/collaborating-with-pull-requests/proposing-changes-to-your-work-with-pull-requests/about-pull-requests
- Pull Request 병합(Merge) 방식 공식 문서: https://docs.github.com/ko/pull-requests/collaborating-with-pull-requests/incorporating-changes-from-a-pull-request/about-pull-request-merges
- Vercel — Git 연동과 PR마다 자동 생기는 Preview 배포: https://vercel.com/docs/deployments/git
- 같은 카테고리(배포·운영·도구): `examples/_catalog.json` 의 `code: "H"` 항목들
