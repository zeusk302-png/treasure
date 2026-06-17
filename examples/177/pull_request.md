<!--
이 파일은 진짜 GitHub에서 Pull Request를 열 때 "제목"과 "설명"에
그대로 복사해 넣을 수 있는 견본(템플릿)입니다.
- 위쪽 한 줄이 PR 제목, 아래 본문이 PR 설명입니다.
- [ ] 는 체크박스입니다. GitHub에 붙여 넣으면 클릭 가능한 체크박스로 보입니다.
- < > 로 감싼 부분은 자리표시자이니 본인 값으로 바꾸세요.
-->

# 버튼 색을 파랑에서 초록으로 변경

## 무엇을 바꿨나 (What)
- 신청 버튼 색을 파랑(`#2563eb`)에서 초록(`#16a34a`)으로 변경했습니다.
- 변경 파일: `style.css` 한 곳, 한 줄.

## 왜 바꿨나 (Why)
- "버튼이 눈에 잘 안 띈다"는 사용자 피드백을 반영했습니다.

## 미리보기에서 확인하기 (Preview)
- Preview URL: <https://my-site-git-feature-new-hero-myname.vercel.app>
  (실제 주소는 PR에 자동으로 붙는 Vercel 코멘트에서 확인하세요. 형식: `<프로젝트>-git-<브랜치>-<계정스코프>.vercel.app`)
- Production(라이브) URL: <https://my-site.vercel.app> (Merge 전에는 변화 없어야 정상)

## 리뷰 체크리스트 (Merge 전에 확인)
- [ ] Preview URL을 열어 바뀐 화면(초록 버튼)을 눈으로 확인했다
- [ ] Files changed의 diff를 읽어 의도한 변경만 들어있는지 확인했다
- [ ] 비밀키(`service_role` 등)나 `.env` 값이 diff에 섞여 들어가지 않았다
- [ ] Vercel Preview 빌드가 Ready(초록) 상태다 (Error 아님)

## 합치는 방법 (How to merge)
- 위 체크가 모두 끝나면 GitHub의 **Merge pull request** 버튼을 누릅니다.
- Merge되면 `main`이 갱신되고, Vercel이 자동으로 **Production 배포**를 시작합니다.

<!--
스택/보안 메모 (제출 전 확인):
- 스택: HTML/CSS/JS + GitHub + Vercel (가이드 공통 스택)
- 공개 가능한 값(anon 키, 도메인 등)은 PR/코드에 있어도 되지만,
  비밀값(service_role 키, DB 비밀번호 등)은 어떤 브랜치/PR에도 절대 올리지 않습니다.
- 비밀값은 코드 대신 .env(로컬) / Vercel 환경변수(배포)에 두고, .gitignore로 GitHub 업로드를 막습니다.
-->
