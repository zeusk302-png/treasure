# 실습 298 — 공개용 견본 .env.example 만들기 (값은 비우고 이름만)

앞 실습(297)에서 비밀 값을 `.env.local`로 분리했습니다. 그런데 `.env.local`은 깃허브에 안 올리니까,
**새로 합류한 팀원은 "어떤 값을 채워야 하는지조차" 알 수 없습니다.**

그래서 만드는 게 **`.env.example`** 입니다.
값은 모두 비우고(자리표시자만 남기고) **이름만** 남긴 "공개해도 안전한 견본"입니다.
이 한 파일로 "공개해도 되는 것"과 "비밀"을 **파일 단위로 가르는 습관**을 들입니다.

> 한 줄 사용법: **`.env.example`을 `.env.local`로 복사한 뒤 빈 자리에 본인 값을 채우면 끝.**
> (맥/리눅스: `cp .env.example .env.local` · 윈도우: `copy .env.example .env.local`)

## 목표
- 진짜 값이 든 비밀 파일(`.env.local`)과, 값이 빈 공개 견본(`.env.example`)의 **차이를 파일 단위로 구분**한다.
- `.env.example`에는 키 **이름만** 남기고 값은 모두 **빈 자리표시자**로 둔다는 원칙을 손으로 익힌다.
- `.env.local`은 `.gitignore`로 막고, `.env.example`은 **일부러 깃허브에 올린다**(예외 처리)는 점을 이해한다.
- anon(publishable, 공개 OK)과 service_role(secret, 절대 비밀)의 구분을 견본 파일 안에서도 유지한다.

## 따라하는 단계
1. (앞 실습 복습) `.env.local`에는 진짜 값이 들어 있습니다. 이 파일은 비밀이라 깃허브에 안 올립니다.
2. `.env.local`을 그대로 복사해 이름을 **`.env.example`**로 바꿉니다.
   - 맥/리눅스 터미널: `cp .env.local .env.example`
   - 윈도우 명령창: `copy .env.local .env.example`
3. `.env.example`을 열어 **모든 `=` 뒤의 값을 지웁니다.** 이름(왼쪽)만 남기고 값(오른쪽)은 비웁니다.
   - 예: `VITE_SUPABASE_URL=https://abc.supabase.co` → `VITE_SUPABASE_URL=`
   - ⚠️ 절대 진짜 키를 견본에 남기지 마세요. 견본의 핵심은 "값이 하나도 없다"입니다.
4. 어떤 값인지 헷갈리지 않도록 **주석으로 설명**을 답니다. 공개돼도 되는 값(`VITE_` 접두)과 비밀(`SUPABASE_SERVICE_ROLE_KEY`)을 두 묶음으로 나눠 적습니다.
5. `.gitignore`를 확인합니다. `.env.local`은 막혀 있고, `.env.example`은 **`!.env.example` 한 줄로 예외 처리**되어 깃허브에 올라가도록 되어 있는지 봅니다.
6. 새 팀원 입장이 되어 봅니다: `.env.example`을 `.env.local`로 복사하고(2단계 명령 그대로) 빈 자리에 본인 Supabase 값을 채웁니다. (Supabase 대시보드 → Settings → API)
7. AI에게 점검을 시켜 봅니다:
   > "이 폴더의 .env.example 에 실제 키 값이나 토큰이 남아 있는지 줄 단위로 확인해줘. 자리표시자/빈 값이 아니라 진짜처럼 보이는 값이 있으면 그 줄을 알려줘. 추정 말고 실제로 발견한 것만 보고해."

## 🤖 바이브코딩 프롬프트
이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 신중한 보안 멘토야. 비전공자가 이해하도록 도와줘.
  목표: Vite + Supabase 프로젝트용 공개 견본 환경변수 파일 .env.example 을 만들어줘.
  제약:
   - 진짜 값/토큰은 절대 넣지 말고, = 뒤는 전부 빈 자리표시자로 남겨라.
   - 키 이름만 남긴다: VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY, SUPABASE_SERVICE_ROLE_KEY
   - "공개해도 되는 값(VITE_ 접두)"과 "절대 비밀(service_role)"을 두 묶음으로 주석 구분해라.
  산출물: .env.example 파일 전체 내용. 각 줄에 왜 그 값이 공개 OK인지/비밀인지 한국어 주석으로 설명해줘.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  이어서, 방금 만든 .env.example 이 깃허브에 안전하게 올라가도록 .gitignore 를 만들어줘.
   - .env.local 같은 진짜 값 파일은 막되,
   - .env.example 은 일부러 추적되도록 !.env.example 한 줄로 예외 처리해라.
  그리고 새 팀원이 보면 바로 따라할 수 있게, .env.example 을 .env.local 로 복사하는
  맥/리눅스(cp)와 윈도우(copy) 명령을 README 한 줄 사용법으로 정리해줘.
  왜 .env.example 만 예외로 올리는지 주석으로 이유를 적어줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  git status 를 했더니 .env.local 이 추적 대상으로 보이거나, .env.example 이 안 보여서 막혔어.
  내 .gitignore 와 .env.example 내용을 아래 붙여넣을게. 무엇이 잘못됐는지 단계별로 진단해줘.
  특히 .env.example 안에 실수로 진짜 키 값이 남아 있는 줄이 있으면 줄 단위로 찾아서 알려줘.
  추정하지 말고, 실제로 발견한 것만 보고하고, 고치는 방법을 비전공자가 따라하게 한 줄씩 풀어줘.

  [여기에 .gitignore 와 .env.example 내용, git status 결과를 붙여넣기]
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다.

## 검증법
- `.env.example`의 **모든 `=` 뒤가 비어 있는가?** (진짜 값이 한 글자도 없어야 합격)
- `.env.example`에 필요한 **키 이름은 다 들어 있는가?** (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`)
- `git status`에서 **`.env.local`은 안 보이고**, **`.env.example`은 추적 대상으로 보이는가?**
- 비밀 값(`SUPABASE_SERVICE_ROLE_KEY`)에 실수로 `VITE_` 접두를 붙이지 않았는가? (붙이면 공개 의도가 되어 위험)

> 검증용 명령(터미널에서):
> ```bash
> git init            # 아직 저장소가 아니라면
> git add .
> git status          # .env.local 은 안 보이고, .env.example 은 보이면 성공
> ```

## 안전(보안) 짚고 가기
- **`.env.example`이 안전한 이유는 "값이 없어서"입니다.** 키 이름은 비밀이 아닙니다 — 진짜 위험은 키 *값*이 새는 것이고, 견본에는 값이 없으니 공개해도 됩니다.
- **anon(publishable) 키**는 원래 "공개돼도 되는 출입증"이라 진짜 값이 화면·깃허브에 있어도 괜찮습니다. 그래도 견본 파일에는 값을 비워 둡니다(각자 자기 프로젝트 값을 넣게 하려고).
- **service_role(secret) 키**는 RLS를 통째로 우회하는 마스터키라, 어디에도 값이 노출되면 안 됩니다. 견본에는 **이름만** 남기고 값은 절대 적지 않습니다. (실제로도 정적 사이트(브라우저)에는 두지 않고 서버에서만 씁니다.)
- 흔한 실수: 만들 때는 비웠는데, 디버깅하다 잠깐 진짜 값을 넣고 그대로 커밋하는 경우. **`.env.example`에는 진짜 값을 절대 넣지 않는다**를 규칙으로 고정하세요. 한 번이라도 진짜 키를 커밋했다면 파일 삭제로는 안 되고 키 회전(무효화 후 재발급)이 정답입니다.

## 이 폴더의 파일
- `.env.example` — 값이 모두 비워진 **공개용 견본**(이번 실습의 결과물). 깃허브에 올라가도 안전합니다.
- `.gitignore` — `.env.local`은 막고 `.env.example`은 `!`로 예외 처리(올림)하는 규칙

## 관련 가이드
- 개념: [환경변수(.env) 제대로 — 무엇을 어디에, 무엇을 절대 커밋 안 하나](https://zeusk302-png.github.io/treasure/04-security/03/)
- 개념: [공개해도 되는 키 vs 절대 숨길 키 (anon vs service_role)](https://zeusk302-png.github.io/treasure/04-security/01/)
- 개념: [키가 새면 어떻게 하나 — 유출 탐지와 키 회전(rotation)](https://zeusk302-png.github.io/treasure/04-security/05/)
- 직전 실습: [297 — .env.local로 키 옮기고 .gitignore 한 줄 추가하기](https://zeusk302-png.github.io/treasure/practice/)
- 실습 모음: [직접 따라 만들기](https://zeusk302-png.github.io/treasure/practice/)
