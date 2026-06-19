# 실습 299 — 내 키 어디서 쓰나 표 만들기 (anon은 프론트, service_role은 절대 금지)

Supabase를 쓰면 키가 두 종류 나옵니다.
**anon(publishable) 키**는 "공개돼도 되는 출입증"이고,
**service_role(secret) 키**는 "RLS(행 수준 보안)를 통째로 우회하는 마스터키"입니다.

문제는 **service_role 키가 실수로 브라우저(화면)로 가는 코드에 들어가면**,
그 사이트를 연 누구나 모든 데이터를 읽고 지울 수 있다는 점입니다.
그래서 이번 실습에서는 **AI에게 "키가 어디에 쓰이는지 파일·줄 단위로 보고"를 시키고**,
그 보고를 검증해서 **service_role 키가 프론트에 단 한 군데도 없음**을 증명하는 점검 표를 만듭니다.

> 한 줄 요약: **anon 키는 src/(프론트)에서 OK. service_role 키는 api/(서버)에서만. 둘이 섞이면 🔴.**

## 목표
- anon(publishable, 공개 OK)과 service_role(secret, 절대 비밀)의 **쓰임새 차이**를 코드에서 직접 구분한다.
- AI에게 **추측이 아니라 파일·줄 근거로** 키 사용처를 보고하게 시키는 법(디렉팅)을 익힌다.
- "service_role 키가 브라우저로 가는 코드에 0건인가?"를 **표 한 장으로 검증**하는 습관을 들인다.
- 위험한 코드(🔴)가 어떻게 생겼는지 나쁜 예시로 눈에 익혀, 점검 표에서 잡아낸다.

## 따라하는 단계
1. 이 폴더의 코드 파일을 먼저 눈으로 훑습니다. 어디에 어떤 키가 쓰이는지 감을 잡습니다.
   - `src/supabaseClient.js`, `src/App.jsx` → **브라우저로 가는 프론트 코드** (anon 키만 있어야 함)
   - `api/admin-cleanup.js` → **서버에서만 도는 코드** (여기서만 service_role 허용)
2. `prompt.md`를 엽니다. 거기 있는 **1) 전수 조사 프롬프트**를 복사해 AI(Claude)에게 붙여 넣습니다.
3. AI가 돌려준 표를 받습니다. 단, 그대로 믿지 말고 **AI가 인용한 파일:줄을 직접 열어** 맞는지 확인합니다. (이게 핵심입니다 — AI는 검증 대상입니다)
4. `prompt.md`의 **2) 후속 프롬프트**로 한 번 더 못 박습니다: "service_role 키가 프론트에 등장하는 곳이 0건인가?"
5. 검증한 내용을 `audit-table.md`에 옮겨 **키 종류 · 사용 위치 · 판정(🟢/🔴)** 표를 완성합니다. (이게 이번 실습의 결과물)
6. `src/BAD-example.jsx.txt`(나쁜 예시)를 열어, 왜 그 세 줄이 🔴인지 설명할 수 있는지 스스로 점검합니다. 이런 코드가 진짜 `src/`에 있었다면 표에서 🔴로 잡혀야 합니다.

## 🤖 바이브코딩 프롬프트
이 실습(키 사용처 점검 표 만들기)을 AI에게 시켜서 만들 때 그대로 복사해 쓰는 프롬프트입니다.
(이미 `prompt.md`에 조사용 프롬프트가 있습니다. 여기 것은 "실습 자체를 처음부터 세팅·강화"하는 관점의 프롬프트입니다.)

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 비전공자에게 보안 점검을 가르치는 강사야.
  Supabase 키 두 종류(anon=공개 출입증 / service_role=RLS 우회 마스터키)의
  쓰임새 차이를 보여주는 미니 예제 폴더를 만들어줘.

  요구사항:
  - src/supabaseClient.js, src/App.jsx : 브라우저로 가는 프론트 코드. anon 키만 import.
  - api/admin-cleanup.js : 서버에서만 도는 코드. 여기서만 service_role 키를 process.env로 읽기.
  - .env.example : 값은 전부 비운 공개용 견본. VITE_ 접두 규칙을 주석으로 설명.
  - .gitignore : .env.local 은 막고, .env.example 은 일부러 올리도록.
  제약: 진짜 키 값은 한 글자도 박지 마. 모두 .env 에서 읽어.
  각 줄에 "왜 이렇게 했는지" 한국어 주석을 달아줘.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  이제 점검 도구를 추가해줘.
  1) prompt.md : AI에게 "추측 말고 파일:줄 근거로만" 키 사용처를 보고시키는 프롬프트.
     출력은 | 키 종류 | 발견 위치(파일:줄) | 실행 환경 | 판정(🟢/🔴) | 표로.
  2) audit-table.md : 위 보고를 사람이 검증해 옮겨 담는 결과물 표.
     "service_role 키가 브라우저로 새는 곳 = 0건인가?"를 핵심 판정 행으로 둬.
  3) src/BAD-example.jsx.txt : 일부러 위험하게 만든 나쁜 예시.
     확장자를 .txt 로 둬서 빌드에 안 끼게 하고, 각 줄이 왜 🔴인지 주석으로 설명해.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  점검 표가 전부 🟢인데 실제로는 키가 새는 것 같아. 아래를 단계별로 진단해줘.
  - 먼저 `grep -rn "SERVICE_ROLE" src/` 결과를 보고, src/ 에 비밀 키가 등장하면 그 줄을 🔴로 지적해.
  - 비밀 키에 실수로 VITE_ 접두가 붙은 곳이 있는지(`VITE_SUPABASE_SERVICE_ROLE`) 찾아줘.
  - 코드에 진짜 키 값이 하드코딩된 곳이 있는지 확인해줘.
  내가 붙여넣는 파일 내용만 근거로, 추측 없이 파일:줄로 알려줘.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다.

## 검증법
- 완성한 표에서 **service_role 행의 실행 환경이 전부 "서버 전용"인가?** (하나라도 "브라우저"면 🔴)
- **`src/` 안의 어떤 파일에도 `SUPABASE_SERVICE_ROLE_KEY`가 등장하지 않는가?** (아래 검색으로 확인)
- 비밀 키에 실수로 **`VITE_` 접두**가 붙은 곳이 없는가? (붙으면 브라우저로 새어 🔴)
- 코드 어디에도 **진짜 키 값을 직접 박지 않았는가?** (모두 `.env`에서 읽어야 함)

> 검증용 명령(터미널에서):
> ```bash
> # 프론트(src/)에 비밀 키가 새어 들어갔는지 — 아무것도 안 나와야 합격
> grep -rn "SERVICE_ROLE" src/
>
> # 비밀 키에 VITE_ 접두가 붙은 곳이 있는지 — 안 나와야 합격
> grep -rn "VITE_SUPABASE_SERVICE_ROLE" .
> ```
> (윈도우 PowerShell이면 `Select-String -Path src\*.* -Pattern "SERVICE_ROLE"`)
> 나쁜 예시 파일(`BAD-example.jsx.txt`)은 일부러 위험하게 만든 견본이라 여기서 잡혀도 정상입니다. 빌드에는 포함되지 않습니다.

## 안전(보안) 짚고 가기
- **anon(publishable) 키**: 일부러 공개하는 "출입증". `VITE_` 접두를 붙여 브라우저로 내보냅니다. 화면·깃허브에 진짜 값이 있어도 괜찮습니다. **데이터를 지키는 건 이 키가 아니라 RLS**입니다.
- **service_role(secret) 키**: RLS를 통째로 무시하는 마스터키. **브라우저·깃허브에 절대 금지**, 오직 서버(`api/`)에서 `process.env`로만 읽습니다. `VITE_` 접두를 절대 붙이지 않습니다.
- **자리표시자 원칙**: 이 폴더의 `.env.example`처럼 견본에는 진짜 값을 한 글자도 넣지 않습니다. 진짜 값은 `.env.local`(깃허브 제외)에만 둡니다.
- **이미 새어버렸다면?** 파일을 지우는 것으로는 부족합니다. 깃 기록·캐시에 남으므로 **키 회전(무효화 후 재발급)** 이 정답입니다.

## 이 폴더의 파일
- `audit-table.md` — **키 종류·사용 위치·판정(🟢/🔴) 점검 표** (이번 실습의 결과물)
- `prompt.md` — AI에게 키 사용처를 파일·줄 단위로 보고시키는 디렉팅 프롬프트
- `src/supabaseClient.js`, `src/App.jsx` — anon 키만 쓰는 **프론트 코드**(점검 대상, 🟢)
- `api/admin-cleanup.js` — service_role 키를 서버에서만 쓰는 **서버 코드**(점검 대상, 🟢)
- `src/BAD-example.jsx.txt` — 일부러 위험하게 만든 **나쁜 예시**(🔴 연습용, 빌드 제외)
- `.env.example` — 값이 모두 빈 공개용 견본 / `.gitignore` — `.env.local`은 막고 견본은 올림

## 관련 가이드
- 개념: [공개해도 되는 키 vs 절대 숨길 키 (anon vs service_role)](https://zeusk302-png.github.io/treasure/04-security/01/)
- 개념: [환경변수(.env) 제대로 — 무엇을 어디에, 무엇을 절대 커밋 안 하나](https://zeusk302-png.github.io/treasure/04-security/03/)
- 개념: [키가 새면 어떻게 하나 — 유출 탐지와 키 회전(rotation)](https://zeusk302-png.github.io/treasure/04-security/05/)
- 직전 실습: [298 — 공개용 견본 .env.example 만들기](https://zeusk302-png.github.io/treasure/practice/)
- 다음 실습: [300 — Supabase 테이블에 RLS 켜기](https://zeusk302-png.github.io/treasure/practice/)
- 실습 모음: [직접 따라 만들기](https://zeusk302-png.github.io/treasure/practice/)
