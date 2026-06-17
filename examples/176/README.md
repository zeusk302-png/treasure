# 브랜치 만들어 미리보기(Preview) 배포 URL 받기

웹사이트를 고칠 때 가장 무서운 순간은 **"지금 손님이 보고 있는 진짜 화면(라이브)을 내가 망가뜨리면 어쩌지?"** 입니다. 그래서 프로의 방식은 이렇습니다. 라이브가 보고 있는 `main` 가지(브랜치)는 그대로 두고, **새 가지(브랜치)를 하나 만들어 거기서만 고친 다음**, Vercel이 그 브랜치 전용으로 발급해 주는 **임시 주소(Preview URL)** 에서 먼저 눈으로 확인합니다. 마음에 들면 그때 합치고, 마음에 안 들면 그냥 버리면 됩니다. 라이브는 끝까지 안전합니다.

이 실습은 실제 Git 명령과 Vercel의 자동 Preview 배포 흐름을 흉내 낸 **연습판(`index.html`)** 으로 그 흐름을 손으로 한 번 따라가 본 뒤, 진짜 GitHub + Vercel에서 똑같이 해 봅니다. 이번 실습의 **결과물(Deliverable)** 은 딱 하나, **`main`과 분리된 Preview URL** 한 개입니다.

> 비전공자 눈높이 한 줄 요약: `main`은 **손님에게 내놓은 진열대**, 새 브랜치는 **뒤편 작업대 위 복제본**입니다. 작업대에서 고치는 동안 진열대는 멀쩡하고, Vercel은 작업대 복제본을 볼 수 있는 **임시 구경 링크(Preview URL)** 를 자동으로 만들어 줍니다. 그 링크로 먼저 확인하고, 좋으면 진열대로 옮기면 됩니다.

## 목표

- `main`이 아닌 **새 브랜치**에 변경을 올리면, 라이브(Production)는 건드리지 않은 채 **그 브랜치 전용 임시 주소(Preview URL)** 가 자동으로 생긴다는 것을 이해한다.
- "브랜치 push → Vercel이 자동 감지 → Preview 배포 → 임시 URL 발급" 이라는 **흐름의 순서**를 손으로 따라가며 익힌다.
- **Production 주소(고정 1개)와 Preview 주소(브랜치마다 생김)** 의 차이를 구분하고, 두 주소의 내용이 서로 다를 수 있다는 것을 눈으로 확인한다.
- (스택 일관) 모든 작업은 **GitHub(브랜치) + Vercel(배포)** 위에서 일어나며, 비밀값은 코드에 넣지 않고 자리표시자(`.env.example`)와 `.gitignore`로 관리한다는 원칙을 다시 확인한다.

## 따라하는 단계

### A. 연습판으로 흐름 감 잡기 (이 폴더의 화면)

1. `examples/176/` 폴더의 `index.html` 을 브라우저로 엽니다. (설치 없이 더블클릭으로 열립니다.)
2. **"1) 지금 어떤 주소들이 살아 있나요?"** 보드를 봅니다. 처음에는 **Production(`main`) 주소**만 있고, Preview 칸은 "Preview 없음(점선)" 상태입니다.
3. **"2) 따라하기"** 의 버튼을 **위에서부터 순서대로** 누릅니다. 앞 단계를 끝내야 다음 버튼이 열립니다.
   - `git checkout -b feature/new-hero` → main에서 갈라진 **새 브랜치**를 만듭니다.
   - `git commit -am "..."` → 변경을 그 브랜치에만 기록합니다. (main은 영향 없음)
   - `git push -u origin feature/new-hero` → 브랜치를 GitHub에 올립니다. Vercel이 이 push를 **자동 감지**합니다.
   - **배포 진행** → Vercel이 빌드 후 **Preview URL**을 발급합니다.
4. 마지막 단계가 끝나면 아래 **"3) 결과물 — main과 분리된 Preview URL"** 칸에 임시 주소가 나타납니다. 이게 이번 실습의 결과물 모양입니다.
5. **"처음부터 다시"** 를 눌러 흐름을 한 번 더 반복하며 순서를 몸에 익힙니다.

### B. 진짜 GitHub + Vercel에서 하기

> 전제: 이미 GitHub 저장소가 Vercel 프로젝트에 연결되어 자동 배포가 되고 있는 상태(앞 실습들에서 만든 상태)여야 합니다.

6. 내 프로젝트 폴더의 터미널에서 새 브랜치를 만들고 이동합니다.
   ```bash
   git checkout -b feature/new-hero
   ```
7. 아무 파일이나 눈에 보이게 한 군데 고칩니다. (예: `index.html`의 큰 제목 문구를 "테스트 변경!"으로 바꾸기) 그리고 기록합니다.
   ```bash
   git add .
   git commit -m "히어로 문구 변경 (Preview 테스트)"
   ```
8. 이 브랜치를 GitHub로 올립니다. (`-u`는 "이 브랜치의 짝을 origin에 만들어 둔다"는 뜻)
   ```bash
   git push -u origin feature/new-hero
   ```
9. **Vercel 대시보드 → 내 프로젝트 → Deployments** 로 갑니다. 방금 push한 브랜치에 대해 **Preview** 배포가 자동으로 새로 생겨 빌드되는 것이 보입니다. (상태가 Building → Ready 로 바뀝니다.)
10. 그 배포를 클릭하면 **Preview URL**이 보입니다. 형식은 보통 이렇습니다.
    ```text
    https://<프로젝트>-git-<브랜치명>-<계정스코프>.vercel.app
    예) https://my-site-git-feature-new-hero-myname.vercel.app
    ```
    (브랜치명의 슬래시 `/` 는 주소에서 하이픈 `-` 으로 바뀝니다.)
11. 그 Preview URL을 열어 **7번에서 바꾼 내용이 보이는지** 확인합니다. 이게 결과물입니다.
12. 마지막으로 **Production 주소**(`<프로젝트>.vercel.app`)도 열어 봅니다. → 여전히 **옛날 그대로**여야 합니다. main을 안 건드렸기 때문입니다.

> 참고: 다음 실습(177)에서는 이 브랜치로 **Pull Request**를 열어 Preview로 검토한 뒤 `main`에 **Merge**해 라이브에 반영하는 흐름을 이어서 다룹니다. 이번 실습은 "라이브를 안 건드리고 임시 URL 받기"까지입니다.

## 검증법

1. **연습판 검증**: `index.html`에서 네 단계를 모두 실행하면, 상단 보드의 Preview 칸이 "없음" → 주황색 **Preview 카드**로 바뀌고, 맨 아래 결과 칸에 Preview URL이 나타나야 성공입니다.
2. **분리 검증(핵심)**: 진짜 환경에서 **Preview URL을 열면 바꾼 내용이 보이고**, **Production 주소를 열면 옛날 그대로**여야 합니다. 두 주소의 화면이 다르면 "브랜치가 main과 분리됐다"는 확실한 증거입니다.
3. **자동 생성 검증**: Vercel Deployments 목록에서 방금 push한 브랜치 이름이 붙은 **Preview** 항목이 자동으로 생겼는지 확인합니다. (내가 수동으로 만든 게 아니라 push만으로 생겼다는 점이 포인트)
4. **흔한 실수 점검**:
   - Production 주소가 바뀌어 버렸다면 → 실수로 `main`에서 커밋했을 가능성이 큽니다. `git branch` 로 지금 어느 브랜치에 있는지 확인하세요(별표 `*`가 현재 브랜치). `main`이면 8번 push 전에 6번부터 다시.
   - Preview가 안 생겼다면 → 브랜치를 GitHub에 push했는지(`git push` 했는지), Vercel이 그 저장소에 연결돼 있는지 확인하세요.
5. **보안/노출 점검**: `git status`에 `.env`가 보이면 안 됩니다(`.gitignore`가 막아 줍니다). 올라가는 환경 견본은 **자리표시자만 든 `.env.example`** 뿐이어야 합니다. 진짜 비밀값(`service_role` 등)은 어떤 브랜치에도 커밋하지 않습니다.

## 관련 가이드 링크

- 배포·운영 개념(브랜치·Preview·자동배포): [5. 배포·운영·SEO](https://zeusk302-png.github.io/treasure/05-deploy-ops-seo/) — `docs/05-deploy-ops-seo/`
- 자동배포(브랜치 push → 배포) 기초: `examples/170/`
- 환경 분리(Production/Preview 환경변수) — 짝꿍 실습: `examples/175/`
- 다음 단계(PR로 Preview 검토 후 Merge 배포): `examples/177/`
- 공개 키 vs 비밀 키 구분과 `.env` 원칙: `docs/04-security/01.md`, `docs/04-security/03.md`
- Vercel 배포 환경(Production/Preview/Development) 공식 문서: https://vercel.com/docs/deployments/environments
- Vercel Git 연동(브랜치 push 시 Preview 자동 배포) 공식 문서: https://vercel.com/docs/git
- Git 브랜치 기본 개념 공식 문서: https://git-scm.com/book/ko/v2/Git-%EB%B8%8C%EB%9E%9C%EC%B9%98-%EB%B8%8C%EB%9E%9C%EC%B9%98%EB%9E%80-%EB%AC%B4%EC%97%87%EC%9D%B8%EA%B0%80
- 같은 카테고리(배포·운영·도구): `examples/_catalog.json` 의 `code: "H"` 항목들
