# 잘못 올린 비밀키 막기 — `.gitignore`와 `.env` 분리하기

Supabase 키를 코드에 직접 박지 않고 별도 파일로 분리한 뒤, `.gitignore`로 **GitHub 업로드 자체를 차단**하는 "안전장치"를 만드는 실습입니다. 한 번 GitHub에 올라간 비밀키는 나중에 지워도 기록(히스토리)에 남기 때문에, **애초에 올라가지 않게 막는 것**이 핵심입니다.

> 비전공자 눈높이 한 줄 요약: 키는 **방문객 출입증(anon·공개)** 과 **건물 마스터 키(service_role·비밀)** 두 종류가 있습니다. 마스터 키는 절대 코드에 넣지 말고, 진짜 값은 `.env`(또는 `config.js`)에 적은 뒤 `.gitignore`로 "GitHub에 올리지 마"라고 막아 둡니다.

## 목표

- **공개 키와 비밀 키를 구분**한다.
  - `anon`(공개) 키 = 방문객 출입증. 브라우저에 박혀도 되지만, **RLS(행 수준 보안)가 켜져 있을 때만** 안전하다.
  - `service_role`(비밀) 키 = 마스터 키. RLS를 전부 무시한다. **브라우저·GitHub에 절대 금지.**
- 진짜 값은 코드가 아니라 `.env` / `config.js` 같은 **분리된 파일**에 둔다.
- `.gitignore`에 비밀 파일을 적어 **GitHub 업로드를 원천 차단**한다.
- 진짜 값이 없는 **견본 파일**(`.env.example`, `config.example.js`)만 저장소에 올려, 다음 사람이 무엇을 채워야 할지 알게 한다.
- 비밀키가 박힌 **나쁜 예시(`broken.html`)를 직접 보고, 무엇이 위험한지 진단**할 수 있다.

## 따라하는 단계

1. `examples/173/` 폴더를 엽니다. 안에 다음 파일들이 있습니다.
   - `index.html` / `script.js` — **안전한(after)** 버전. 키가 한 글자도 없습니다.
   - `config.example.js` — 브라우저용 **공개 설정 견본**(자리표시자만).
   - `.env.example` — 서버용 **환경변수 견본**(자리표시자만).
   - `.gitignore` — "GitHub에 올리지 마" 목록.
   - `broken.html` — **나쁜(before)** 예시. 일부러 비밀키를 박아 둔 파일.
2. 먼저 `broken.html`을 브라우저로 열고, **F12 → 페이지 소스 보기**를 눌러 봅니다. `service_role` 비밀키가 소스에 그대로 보이죠? 이게 바로 막아야 할 사고입니다. (해설은 아래 "깨진 코드 해설" 참고)
3. 이제 안전한 방식을 만들어 봅니다. `config.example.js`를 복사해 `config.js`라는 이름으로 만듭니다.
   - 맥/리눅스/Git Bash: `cp config.example.js config.js`
   - 윈도우 명령프롬프트: `copy config.example.js config.js`
4. 만든 `config.js`를 열어, `여기에_프로젝트_주소`와 `여기에_anon_공개키_붙여넣기` 자리에 **anon(공개) 키만** 넣습니다. (Supabase 대시보드 → Project Settings → API → `anon public`)
   - ⚠️ `service_role` 키는 여기에 **절대** 넣지 않습니다. 그 키는 서버(`.env`)에서만 씁니다.
5. `.gitignore`를 엽니다. 맨 위에 `.env`와 `config.js`처럼 **진짜 값이 든 파일**이 무시 목록에 있는지 확인합니다. (이 실습 파일에는 `.env` 계열이 등록돼 있고, `config.js`도 같은 방식으로 추가하면 됩니다. `!.env.example` 줄은 "견본은 예외로 올려라"는 뜻입니다.)
6. `index.html`을 브라우저로 엽니다. 화면의 "현재 설정 불러오기 상태"에 **✅ 안전** 메시지가 뜨면 분리가 잘 된 것입니다.
7. (선택) 실제 GitHub에 올린다고 가정하고 확인합니다. 터미널에서 다음을 실행하면, `config.js`와 `.env`가 목록에 **나타나지 않아야** 정상입니다.
   ```bash
   git init
   git add .
   git status        # ← 여기에 config.js / .env 가 보이면 안 됩니다!
   ```
8. 만약 실수로 이미 키를 올렸다면, 파일만 지우는 것으로는 부족합니다. **키를 폐기하고 새로 발급(키 회전, rotation)** 해야 합니다. (가이드 `docs/04-security/05.md` 참고)

## 깨진 코드 해설 (`broken.html`이 위험한 이유)

`broken.html`에는 일부러 세 가지 잘못을 심어 두었습니다. 안전한 `index.html`/`config.js`와 비교해 보세요.

| # | 깨진 코드(`broken.html`) | 왜 위험한가 | 고친 방식(이 폴더의 안전 버전) |
|---|--------------------------|-------------|-------------------------------|
| 1 | `const SUPABASE_URL = "...";` 등 설정을 **코드에 직접 박음** | 파일을 그대로 GitHub에 올리면 값이 공개됨 | `config.js`로 분리하고 `.gitignore`로 업로드 차단 |
| 2 | `const SUPABASE_SERVICE_ROLE_KEY = "..."` 를 **브라우저에 넣음** | `service_role`은 RLS를 무시하는 마스터 키. F12 소스 보기로 누구나 복사 → **DB 전체 유출** | 브라우저에는 `anon`(공개) 키만. 비밀 키는 `.env`(서버)에서만 사용 |
| 3 | `.gitignore` / `.env` 분리가 **아예 없음** | 비밀 파일이 막힘 없이 git에 올라감 | `.gitignore`에 `.env`·`config.js` 등록, 견본만 커밋 |

핵심 교훈: **anon 키 ≠ service_role 키.** anon은 공개 설계(+RLS로 보호)라 브라우저에 둬도 되지만, service_role은 어떤 경우에도 브라우저·GitHub에 노출하면 안 됩니다.

## 검증법

1. `broken.html`을 브라우저로 연 뒤 **F12 → 소스(또는 Ctrl+U)** 에서 `service_role` 글자가 그대로 보이는지 확인합니다. 보인다면 "이래서 위험하다"를 체감한 것입니다.
2. 안전 버전 `index.html`을 열어, "현재 설정 불러오기 상태" 박스에 **✅ 안전** 메시지가 뜨는지 봅니다.
   - `config.js`를 안 만들었다면 `❌ config.js 를 찾지 못했습니다` 가 뜹니다 → 단계 3을 다시.
   - 자리표시자(`여기에…`) 그대로면 `✅ 안전 … (자리표시자 상태)` 가 뜹니다 → 정상.
3. `config.js`에 실수로 `service_role`이라는 글자가 들어가면 화면에 **🚨 위험!** 경고가 뜹니다. 이 경고가 안 뜨면 비밀 키를 안 넣은 것이므로 정상입니다.
4. 터미널에서 `git add .` 후 `git status`를 실행했을 때, **`config.js`와 `.env`가 목록에 없어야** 합니다. 만약 보인다면 `.gitignore` 철자/위치를 다시 확인합니다.
5. 반대로 `.env.example`과 `config.example.js`(견본 파일)는 `git status`에 **나타나야** 정상입니다. (다음 사람을 위한 안내 파일이므로 올라가야 함)
6. `.env.example` 안의 값이 전부 `여기에…` 같은 **자리표시자**인지 확인합니다. 진짜 키가 한 글자라도 있으면 안 됩니다.

## 관련 가이드 링크

- 핵심 가이드(공개 키 vs 비밀 키 정정): `docs/04-security/01.md` — anon/publishable vs service_role/secret
- RLS가 왜 출입증을 공개해도 안전하게 만드는지: `docs/04-security/02.md`
- 환경변수(.env) 제대로 — 무엇을 어디에 두고 무엇을 절대 커밋 안 하나: `docs/04-security/03.md`
- 키가 이미 새어 나갔을 때 — 유출 탐지와 키 회전(rotation) 절차: `docs/04-security/05.md`
- 같은 카테고리(배포·운영·도구): `examples/_catalog.json` 의 `code: "H"` 항목들
- Supabase 연동 실습 비교: `examples/03-supabase-guestbook/`
