# 실습 304 — npm audit 돌리고 취약 의존성 한 개 고치기

우리가 만드는 웹 앱의 코드 중 **내가 직접 짠 건 사실 2할 정도**입니다.
나머지 8할은 `npm install`로 가져온 **남이 만든 패키지(의존성)** 입니다.
이 남의 코드에 알려진 보안 구멍이 있으면, 내 앱도 같이 위험해집니다. 이걸 **공급망(supply chain) 위험**이라고 합니다.

다행히 명령어 한 줄이면 점검이 됩니다. **`npm audit`** 가 "지금 깔린 패키지 중 알려진 취약점이 있는 게 뭐냐"를 알려줍니다.
이번 실습에서는 일부러 취약한 버전(`axios 1.6.7`)을 넣어둔 미니 프로젝트에서, 취약점을 **찾고 → 한 건 고치고 → 결과를 잠그는(`package-lock.json` 커밋)** 전 과정을 손으로 해봅니다.

> 한 줄 요약: **취약점은 버전 숫자를 올려서 고치고, 그 결과는 `package-lock.json`을 커밋해서 잠근다.**

## 목표
- `npm audit`로 **내가 안 짠 8할의 코드**에 숨은 알려진 취약점 목록을 뽑아낼 수 있다.
- 심각도(critical/high/moderate/low)를 읽고, **가장 위험한 1건**을 골라 버전 갱신으로 해결할 수 있다.
- 고치기 **전/후를 표로 비교**해 "정말 0건이 됐는지" 증명할 수 있다.
- **`package-lock.json`을 왜 커밋해야 하는지**(안전한 버전 고정 = 공급망 자물쇠)를 설명할 수 있다.

## 따라하는 단계
1. **준비물 확인**: 터미널에서 `node -v`, `npm -v`가 버전을 출력하는지 확인합니다. (없으면 [nodejs.org](https://nodejs.org)에서 LTS 설치)
2. 이 폴더(`304/`)로 이동한 뒤 **패키지를 설치**합니다.
   ```bash
   npm install
   ```
   - `package.json`에 일부러 취약한 `axios 1.6.7`이 적혀 있어, 취약한 버전이 깔립니다.
3. **취약점을 점검**합니다.
   ```bash
   npm audit
   ```
   - 출력 맨 아래에 `1 high severity vulnerability` 같은 요약과, 어떤 패키지가 문제인지, **권고 버전**이 함께 나옵니다.
   - 이 출력 내용을 `audit-table.md`의 **"1) audit 결과 요약표 (고치기 전)"** 에 옮겨 적습니다. (결과물의 일부)
4. **가장 심각한 1건을 고칩니다.** 여기서는 `axios`의 High 취약점입니다. 권고 버전 이상으로 올립니다.
   ```bash
   npm install axios@1.7.4
   ```
   - 또는 `npm audit fix` 로 자동 해결할 수도 있습니다. 단, **메이저 버전이 바뀌는 큰 변경**을 강제하는 `npm audit fix --force`는 앱이 깨질 수 있으니 함부로 쓰지 말고, 무엇이 바뀌는지 직접 보고 결정합니다.
5. **다시 점검**해서 0건이 됐는지 확인합니다.
   ```bash
   npm audit
   ```
   - `found 0 vulnerabilities` 가 보이면 성공입니다.
6. **전후 비교 표를 완성**합니다. `audit-table.md`의 "2) 해결 전/후 비교" 표에 버전과 건수가 어떻게 바뀌었는지 적습니다. (결과물의 일부)
7. **바뀐 파일을 함께 커밋**합니다. `package.json`과 `package-lock.json`이 둘 다 바뀌었을 겁니다.
   ```bash
   git add package.json package-lock.json
   git commit -m "fix: axios를 1.7.4로 올려 high 취약점 해결 (npm audit 0건)"
   ```
   - `node_modules/`는 커밋하지 않습니다(`.gitignore`에 등록됨). 하지만 **`package-lock.json`은 반드시 커밋**합니다. (결과물의 핵심)

## 검증법
- `npm audit`의 마지막 줄이 **`found 0 vulnerabilities`** 인가? (고치기 전엔 `1 high severity vulnerability`였다)
- `package.json`의 axios 버전이 **`1.6.7` → `1.7.4`(이상)** 로 바뀌었는가?
- `package-lock.json`의 axios 항목 `version`이 **`1.7.4`** 이고, `integrity`(해시)가 함께 적혀 있는가?
- `git status`에서 **`package-lock.json`이 커밋 대상**에 들어가는가? (`.gitignore`에 들어가 있으면 안 됨 — 자물쇠가 풀린 셈)
- (선택) 프로덕션 의존성만 보고 싶으면 `npm audit --omit=dev` 로 개발용 패키지 잡음을 빼고 확인할 수 있다.

> 빠른 자가 점검(터미널):
> ```bash
> npm audit                 # 'found 0 vulnerabilities' 가 나오면 합격
> npm ls axios              # axios@1.7.4 가 깔렸는지 확인
> git check-ignore package-lock.json   # 아무것도 안 나와야 합격(= 무시되지 않음 = 커밋됨)
> ```
> 마지막 명령에서 파일명이 출력되면 `.gitignore`가 lockfile을 막고 있다는 뜻이라 🔴 입니다. 막지 마세요.

## 안전(보안) 짚고 가기
- **심각도 읽기**: `critical > high > moderate > low` 순으로 위험합니다. 시간이 없으면 **critical/high부터** 처리하세요.
- **이번 취약점**: `axios 1.6.7`의 SSRF/자격증명 누출(GHSA-8hc4-vh64-cxmj). 요청이 의도치 않은 주소로 새며 인증정보가 노출될 수 있어 High로 분류됩니다. `>=1.7.4`에서 패치되었습니다.
- **`audit fix --force` 주의**: 메이저 버전을 강제로 올려 앱이 깨질 수 있습니다. "한 건씩, 무엇이 바뀌는지 보고" 올리는 게 안전합니다.
- **자물쇠 = `package-lock.json`**: `package.json`은 "1.7.x 쯤"이라는 **범위(희망)** 만, `package-lock.json`은 "정확히 1.7.4가 이 해시로 깔렸다"는 **확정 사실**을 적습니다. 이 파일을 커밋해야 동료·배포서버가 **전부 같은 안전한 버전**을 씁니다.
- **비밀값 자리표시자 원칙**: 이 실습엔 키가 없지만, 의존성을 다루는 프로젝트라도 진짜 토큰(npm 토큰 등)은 `.env`/`.npmrc`에만 두고 **절대 커밋하지 않습니다.**

## 이 폴더의 파일
- `audit-table.md` — **audit 결과 요약표 + 취약점 1건 해결 전후 비교** (이번 실습의 결과물)
- `package.json` — 일부러 취약한 `axios 1.6.7`이 든 **고치기 전** 매니페스트(점검 대상)
- `package.json.after` — `axios 1.7.4`로 올린 **고친 후** 매니페스트(비교용 정답)
- `package-lock.json` — **고친 후의 잠긴 버전 기록**(반드시 커밋하는 결과물)
- `package-lock.json.before` — 고치기 전 lockfile의 핵심 부분(전후 비교용 견본)
- `.gitignore` — `node_modules/`는 제외하되 **`package-lock.json`은 일부러 커밋**하도록 둠

## 관련 가이드
- 개념: [내가 안 짠 8할의 코드 — 의존성과 공급망 위험](https://zeusk302-png.github.io/treasure/04-security/06/)
- 개념: [환경변수(.env) 제대로 — 무엇을 어디에, 무엇을 절대 커밋 안 하나](https://zeusk302-png.github.io/treasure/04-security/03/)
- 직전 실습: [303 — 개인정보 최소 수집 폼](https://zeusk302-png.github.io/treasure/practice/)
- 다음 실습: [305 — Vercel에 보안 헤더 깔기 (CSP/HSTS)](https://zeusk302-png.github.io/treasure/practice/)
- 실습 모음: [직접 따라 만들기](https://zeusk302-png.github.io/treasure/practice/)
