# 실습 129 — Vercel 배포 + 환경변수로 Supabase 키 관리하기

지금까지(116~128) 만든 방명록 CRUD 앱은 **내 컴퓨터에서만** 열어 봤습니다.
이번 129번에서는 그 앱을 **인터넷에 공개**합니다. GitHub에 코드를 올리고 → **Vercel**로 배포해, 누구나 접속할 수 있는 **공개 URL**을 만드는 게 목표입니다.

핵심은 **키(설정 값)를 코드에 직접 박지 않고 분리하는 습관**입니다.

> **왜 키를 코드에서 분리하나요?**
> 주소(`SUPABASE_URL`)와 anon(공개) 키 같은 '설정 값'을 코드 한복판에 적어 두면, 코드와 설정이 뒤섞여 관리가 어렵습니다.
> 그래서 설정 값만 **`config.js` 라는 별도 파일**에 모으고, 이 파일은 **`.gitignore`로 막아 GitHub에 올리지 않습니다.**
> 대신 GitHub에는 **빈 견본인 `config.example.js`** 만 올리고, 진짜 값은 **Vercel '환경변수'** 에 넣습니다.
> 그러면 "내 컴퓨터에서 테스트할 때"와 "인터넷에 배포할 때"가 깔끔하게 나뉩니다.

> **anon(공개) 키는 노출돼도 되는데 왜 굳이 숨기나요?**
> anon 키는 RLS(행 수준 보안)로 보호되는 '출입증'이라 브라우저에 노출돼도 안전합니다(아래 보안 안내 참고).
> 그래서 이 실습에서 환경변수로 분리하는 진짜 목적은 *"키를 숨기는 것"* 이 아니라,
> **"코드와 설정 값을 깔끔히 분리해 실제 서비스처럼 운영하는 습관"** 을 들이는 데 있습니다.
> 나중에 `service_role` 같은 **진짜 비밀 값**이 생겼을 때, 이 습관이 그대로 안전장치가 됩니다.

이 폴더에 있는 파일:

- `README.md` — 이 안내문
- `schema.sql` — **먼저 실행.** 방명록 `guestbook` 표 + RLS·정책(누구나 읽기/쓰기/삭제) + 예시 글 3개. (116~125에서 만든 표와 같은 표라, 이미 있으면 다시 실행 안 해도 됩니다)
- `config.example.js` — 설정 값 **견본**. 자리표시자만 들어 있어 GitHub에 올라가도 안전합니다.
- `config.js` — **실제 설정 값**이 들어가는 파일. `.gitignore`로 막아 GitHub에 올리지 않습니다(내 컴퓨터 전용).

## 목표

- 내 컴퓨터에서만 돌던 CRUD 앱을 **GitHub → Vercel**을 거쳐 **공개 URL**로 배포해 본다.
- 키(주소·anon 키) 같은 **설정 값을 코드에서 분리**해, `config.js`(내 컴퓨터용)와 **Vercel 환경변수**(배포용)로 나눠 관리하는 흐름을 익힌다.
- `.gitignore`로 **진짜 값이 든 파일은 GitHub에 안 올리고**, 빈 **견본(`config.example.js`)만** 올리는 패턴을 이해한다.
- **anon(공개) 키만** 쓰고, **service_role(비밀) 키는 절대 어디에도 넣지 않는** 보안 원칙을 지킨다.

## 따라하는 단계

1. **`schema.sql`로 서버에 표·정책을 만든다.**
   Supabase 대시보드 → **SQL Editor → New query** 에 이 폴더의 `schema.sql` **전체**를 붙여넣고 **[Run]** 합니다.
   → `guestbook` 표가 생기고, RLS가 켜지며, '누구나 읽기/쓰기/삭제' 정책과 예시 글 3개가 만들어집니다.
   (이미 116~125에서 이 표를 만들었다면 건너뛰어도 됩니다. `if not exists`라 다시 실행해도 안전합니다.)

2. **내 컴퓨터에서 먼저 테스트할 `config.js`를 만든다.**
   `config.example.js`를 같은 폴더에 **복사**해 이름을 `config.js`로 저장하고(이미 들어 있는 `config.js`를 써도 됩니다),
   아래 두 값을 내 **진짜 anon(공개) 값**으로 바꿉니다.
   값은 Supabase 대시보드 → **Settings(톱니바퀴) → API** 에서 복사합니다.
   ```js
   window.APP_CONFIG = {
     SUPABASE_URL: "https://여기에-내-프로젝트-ID.supabase.co",        // ← Project URL
     SUPABASE_ANON_KEY: "sb_publishable_여기에-내-anon-공개키-붙여넣기", // ← anon public 키
   };
   ```
   ⚠️ **`service_role` / `sb_secret_...` 키는 절대 넣지 마세요.** RLS를 통째로 무시하는 마스터 키라, 노출되면 누구나 데이터를 마음대로 다룰 수 있습니다.

3. **로컬에서 동작 확인.** 방명록 화면 파일(`index.html`)을 더블클릭해 열고, 예시 글이 보이고 글 작성·삭제가 되는지 확인합니다. (`config.js`의 값이 잘 들어갔다는 증거입니다.)

4. **GitHub에 올린다.** `.gitignore`에 `config.js`가 들어 있어, GitHub에는 **`config.example.js`(빈 견본)만** 올라가고 **진짜 값이 든 `config.js`는 올라가지 않습니다.** `git add` → `git commit` → `git push` 로 내 저장소에 올립니다.

5. **Vercel에서 GitHub 저장소를 연결해 배포한다.** [vercel.com](https://vercel.com) 에 GitHub 계정으로 로그인 → **Add New… → Project** → 방금 올린 저장소를 **Import** 합니다.

6. **Vercel에 환경변수를 넣는다.** 배포 설정의 **Settings → Environment Variables** 에서 `SUPABASE_URL` 과 `SUPABASE_ANON_KEY` 두 값을 추가합니다.
   GitHub에는 `config.js`가 없으므로, 배포 시점에 이 환경변수를 읽어 `config.js`를 만들어 주는 방식입니다.

7. **배포 완료 후 공개 URL로 접속한다.** Vercel이 준 `내프로젝트.vercel.app` 주소를 **다른 기기(예: 휴대폰)** 에서도 열어, 예시 글이 보이고 글 작성·삭제가 되는지 확인합니다.

## 🤖 바이브코딩 프롬프트

이 실습(GitHub → Vercel 배포 + 환경변수로 키 분리)을 AI에게 시켜 만들 때, 아래 프롬프트를 그대로 복사해 쓰세요.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 비전공자를 돕는 웹배포 멘토야.
  내가 만든 정적 방명록 앱(index.html + script.js + Supabase 사용)을
  GitHub에 올리고 Vercel로 공개 배포하려고 해.

  [목표] 누구나 접속 가능한 공개 URL 만들기
  [제약]
   - Supabase 주소(SUPABASE_URL)와 anon(공개) 키는 코드에 직접 박지 말 것
   - 설정 값은 config.js 라는 별도 파일에 모으고, config.js 는 .gitignore 로 막을 것
   - GitHub에는 빈 견본 config.example.js 만 올라가게 할 것
   - 비밀 키(service_role / sb_secret_...)는 어디에도 넣지 말 것
  [산출물]
   1) config.example.js (자리표시자만)
   2) .gitignore (config.js 제외)
   3) GitHub에 올리고 Vercel에서 Import 하는 단계별 안내
  각 파일에 "이게 왜 필요한지" 한국어 주석을 달아줘.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  좋아. 이제 Vercel에 배포할 때 자동으로 config.js 가 만들어지게 하고 싶어.
  config.js 는 GitHub에 없으니까, 배포 시점에 Vercel '환경변수'
  (SUPABASE_URL, SUPABASE_ANON_KEY)를 읽어서 config.js 파일을
  자동 생성하는 build 스크립트(build.js)와 빌드 설정을 만들어줘.
  - 환경변수가 비어 있으면 명확한 에러 메시지를 출력하게 해줘(원인 찾기 쉽게)
  - Vercel 대시보드에서 환경변수를 어디에 어떻게 넣는지 단계도 알려줘
  코드만 주지 말고, 각 줄이 왜 필요한지 한국어 주석으로 설명해줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  Vercel로 배포했는데 화면이 비어 있고 방명록 글이 안 보여.
  브라우저 콘솔(F12)에 이런 에러가 떠: "<여기에 에러 메시지 그대로 붙여넣기>"
  내가 의심하는 곳:
   - Vercel 환경변수(SUPABASE_URL / SUPABASE_ANON_KEY)를 빠뜨렸거나 오타
   - schema.sql 의 RLS 정책이 안 걸렸을 수 있음
  무엇부터 확인해야 하는지 '한 번에 하나씩' 단계별로 진단해줘.
  내가 비전공자라는 걸 감안해서, 각 단계가 무엇을 확인하는 건지도 풀어서 설명해줘.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면, 배포 흐름과 키 분리의 이유까지 함께 배울 수 있습니다.

## 검증법

- **공개 접속:** Vercel이 준 `...vercel.app` 주소를 **내 컴퓨터가 아닌 다른 기기(휴대폰 등)** 에서 열었을 때 방명록 화면과 예시 글이 보이는가?
- **CRUD 동작:** 배포된 사이트에서 글을 **작성하면 목록에 추가**되고, **삭제하면 사라지며**, 새로고침해도 그 결과가 유지되는가? (서버 `guestbook` 표에 저장됐다는 증거)
- **서버 확인:** Supabase **Table Editor → guestbook** 표를 열어, 배포된 사이트에서 쓴 글이 실제로 들어와 있는가?
- **키 분리(이번 실습의 핵심):** GitHub 저장소에 **`config.example.js`(빈 견본)는 있고**, **진짜 값이 든 `config.js`는 없는가?** (`.gitignore`가 잘 동작했다는 증거)
- **anon 키만 썼는지(중요):** `config.js`와 Vercel 환경변수의 키가 **`sb_publishable_`(anon)** 로 시작하는가? **`sb_secret_`(service_role)** 가 **아닌가?**
- **자주 나는 문제:**
  - 배포 화면이 비어 있고 글이 안 보임 → Vercel **환경변수**(`SUPABASE_URL`·`SUPABASE_ANON_KEY`)를 안 넣었거나 오타. 6단계 확인 후 **재배포**.
  - `Invalid API key` → anon 키 값이 잘못됨. / `Failed to fetch` → `SUPABASE_URL` 철자·`https://` 확인.
  - 아무것도 안 보이고/안 써짐 → 1단계 `schema.sql`의 **RLS 정책**이 안 걸렸을 수 있음. SQL을 다시 [Run].

## 관련 가이드

- [로컬 → GitHub → Vercel: 코드가 세상에 나가는 길(자동배포 파이프라인)](../../docs/05-deploy-ops-seo/01.md) — 이번 실습의 배포 흐름 전체
- [dev / preview / production: 환경 분리와 환경변수의 3개 칸](../../docs/05-deploy-ops-seo/02.md) — Vercel '환경변수'에 키를 넣는 이유와 방법
- [공개해도 되는 키 vs 절대 숨길 키 — anon/publishable vs service_role/secret](../../docs/04-security/01.md) — `config.js`에 어떤 키를 넣어야 안전한지
- [환경변수(.env) 제대로 — 무엇을 어디에, 무엇을 절대 커밋 안 하나](../../docs/04-security/03.md) — `config.js`를 `.gitignore`로 막고 견본만 올리는 이유
- [실습 — 직접 따라 만들기](../../docs/practice/index.md)
