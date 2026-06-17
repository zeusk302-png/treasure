# Production과 Preview 환경변수 칸 나눠 설정하기

같은 코드를 배포해도 **진짜 사용자에게 보이는 화면(Production)** 과 **내가 테스트하려고 올린 화면(Preview)** 은 서로 다른 데이터베이스를 보게 만들 수 있습니다. Vercel은 환경변수를 등록할 때 **적용 범위(Environment)** 를 Production / Preview / Development 로 나눠서 정할 수 있는데, **이름은 똑같이 두고 값만 환경마다 다르게** 넣으면 됩니다. 이 실습에서는 Vercel의 환경변수 화면을 흉내 낸 연습판으로, `SUPABASE_URL` 과 `SUPABASE_ANON_KEY` 를 Production·Preview 칸에 따로 넣어 보고, 환경을 바꿔 가며 "어떤 값이 적용되는지" 직접 확인합니다.

> 비전공자 눈높이 한 줄 요약: **Production = 진짜 손님이 오는 매장**, **Preview = 새 메뉴를 시험해 보는 연습 주방**입니다. 같은 레시피(코드)를 쓰더라도 연습 주방에서는 **연습용 재료(연습 데이터)** 를, 진짜 매장에서는 **진짜 재료(고객 데이터)** 를 쓰도록 재료 칸을 나눠 두는 일입니다. 이렇게 나눠 두면 Preview에서 실수로 데이터를 지워도 진짜 고객 데이터는 멀쩡합니다.

## 목표

- Vercel 환경변수의 **적용 범위(Environment)** 개념을 이해한다. 같은 변수 이름을 **Production 칸**과 **Preview 칸**에 따로 등록할 수 있다는 것을 손으로 체험한다.
- **실서비스용 값**(진짜 데이터가 사는 Supabase 프로젝트)과 **미리보기용 값**(연습 데이터가 사는 별도 Supabase 프로젝트)을 분리해서, "Preview에서 한 실수가 진짜 데이터를 건드리지 않는다"는 안전 장치를 만든다.
- **두 환경 모두 넣는 것은 anon(공개) 키까지만**이라는 보안 규칙을 익힌다. `service_role`(비밀) 키는 환경을 나누든 말든 **브라우저로 내려보내는 변수에는 절대 넣지 않는다.** 진짜 값은 코드에 박지 않고 **자리표시자**만 견본(`.env.example`)에 둔다.

## 따라하는 단계

### A. 먼저 연습판으로 감 잡기 (이 폴더의 화면)

1. `examples/175/` 폴더의 `index.html` 을 브라우저로 엽니다. (별도 설치 없이 더블클릭으로 열립니다.)
2. **"1) 환경변수 등록"** 표를 봅니다. 같은 이름(`SUPABASE_URL`, `SUPABASE_ANON_KEY`)이 **Production 줄(파란 배지)** 과 **Preview 줄(주황 배지)** 로 각각 두 번씩 있습니다. 이게 Vercel에서 "이름은 같고 값만 환경마다 다르게" 등록하는 모습입니다.
3. **"예시 값 채우기"** 버튼을 눌러 자리표시자를 채웁니다. (진짜 키가 아니라 형식만 흉내 낸 가짜 값입니다.)
4. **"2) 배포 환경을 골라 적용되는 값 확인"** 에서 **Production ↔ Preview** 버튼을 번갈아 눌러 봅니다. 같은 변수 이름인데 **적용되는 값이 바뀌는 것**을 확인합니다. 이것이 이번 실습의 핵심 장면입니다.
5. 시험 삼아 입력칸 아무 곳에 `service_role` 이라는 글자를 넣어 보면 화면에 **🚨 위험** 경고가 뜹니다. 평소엔 이 경고가 **안 떠야** 정상입니다. 확인했으면 지웁니다.

### B. 진짜 Vercel에 적용하기

6. **연습용 Supabase 프로젝트를 하나 더 만듭니다.** Supabase 대시보드에서 New Project 로 "연습용(staging)" 프로젝트를 추가합니다. 이제 진짜 프로젝트와 연습 프로젝트, 두 개가 생깁니다.
7. 각 프로젝트의 값을 메모해 둡니다. Supabase → **Project Settings → API** 에서:
   - 진짜 프로젝트: `Project URL`, `anon public` 키
   - 연습 프로젝트: `Project URL`, `anon public` 키
   - ⚠️ 같은 화면에 `service_role` 키도 보이지만 **이번에는 복사하지 않습니다.**
8. Vercel 프로젝트 → **Settings → Environment Variables** 로 갑니다.
9. **Production 칸용**으로 변수 두 개를 추가합니다. 각 변수를 추가할 때 적용 범위(Environments)에서 **Production만 체크**합니다.
   - `SUPABASE_URL` = `https://실서비스-프로젝트ID.supabase.co`
   - `SUPABASE_ANON_KEY` = (진짜 프로젝트의 `anon public` 키)
10. **Preview 칸용**으로 **같은 이름** 두 개를 다시 추가합니다. 이번엔 적용 범위에서 **Preview만 체크**합니다.
    - `SUPABASE_URL` = `https://연습용-프로젝트ID.supabase.co`
    - `SUPABASE_ANON_KEY` = (연습 프로젝트의 `anon public` 키)
    - (Vercel UI에 따라 한 변수에 환경별로 값을 따로 넣는 방식도 있고, 환경마다 줄을 따로 만드는 방식도 있습니다. 어느 쪽이든 "Production 값"과 "Preview 값"이 다르게만 들어가면 됩니다.)
11. **재배포(Redeploy)** 합니다. 환경변수는 "다음 배포부터" 적용되므로, Deployments → 점 세 개 → **Redeploy** 를 눌러야 반영됩니다.
12. 확인합니다.
    - 기본 브랜치(`main`)를 배포한 **Production 주소**(`프로젝트.vercel.app`)는 → 진짜 데이터를 봅니다.
    - 다른 브랜치나 Pull Request로 만들어진 **Preview 주소**(`프로젝트-git-브랜치-...vercel.app`)는 → 연습 데이터를 봅니다.

## 검증법

1. **연습판 화면 검증**: `index.html`에서 "예시 값 채우기" 후 Production / Preview 버튼을 번갈아 누를 때, **"적용되는 값"의 URL과 키가 환경마다 다르게 바뀌면** 성공입니다.
2. **빈 칸 검증**: 한쪽 환경 줄만 채우고 다른 쪽은 비운 뒤 환경을 전환해 보면, 비운 환경에서 "이 환경에 등록된 값이 없습니다" 안내가 떠야 합니다. → "환경마다 값이 따로 산다"는 증거입니다.
3. **보안 검증**: 입력칸에 `service_role` 글자를 넣으면 **🚨 위험** 경고가 뜨고, 지우면 사라져야 합니다. anon(공개) 키만 넣었을 때는 경고가 뜨지 않아야 정상입니다.
4. **진짜 Vercel 검증 (환경 분리 확인)**: Production 주소와 Preview 주소를 각각 열었을 때 **서로 다른 Supabase 프로젝트의 데이터**가 보이면 성공입니다. (예: 연습 프로젝트에만 넣어 둔 테스트 글이 Preview 주소에서만 보임.)
5. **노출 점검**: GitHub 저장소를 웹에서 열어 키 일부를 검색했을 때 **진짜 키 값이 나오지 않아야** 합니다. 올라간 것은 자리표시자만 든 `.env.example` 뿐이어야 합니다(`git status`에 `.env`가 보이면 안 됩니다 — `.gitignore` 확인).
6. **흔한 실수 점검**: 두 환경에 **같은 Supabase 프로젝트 URL**을 넣었다면 환경을 나눈 의미가 없습니다. Production과 Preview의 `SUPABASE_URL`이 **서로 다른 프로젝트**를 가리키는지 다시 확인하세요.

## 관련 가이드 링크

- 배포·운영 개념(환경변수·환경 분리·재배포): [5. 배포·운영·SEO](https://zeusk302-png.github.io/treasure/05-deploy-ops-seo/) — `docs/05-deploy-ops-seo/`
- 공개 키 vs 비밀 키 정확히 구분: [4. 안전(보안)](https://zeusk302-png.github.io/treasure/04-security/) — `docs/04-security/01.md` (anon/publishable vs service_role/secret)
- RLS가 왜 공개 키를 안전하게 만드는지: `docs/04-security/02.md`
- 환경변수(.env) 제대로 — 무엇을 어디에 두고 무엇을 절대 커밋 안 하나: `docs/04-security/03.md`
- 짝꿍 실습(Vercel 환경변수에 키 등록·주입): `examples/174/`
- 비밀키 분리·`.gitignore` 실습: `examples/173/`
- 자동배포(브랜치 push → Preview 배포) 흐름: `examples/170/`
- Vercel 환경변수 공식 문서(환경별 값): https://vercel.com/docs/projects/environment-variables
- Vercel 배포 환경(Production/Preview/Development) 공식 문서: https://vercel.com/docs/deployments/environments
- 같은 카테고리(배포·운영·도구): `examples/_catalog.json` 의 `code: "H"` 항목들
