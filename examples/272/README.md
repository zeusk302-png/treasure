# API 키를 숨기려 Supabase Edge Function으로 챗봇 요청 중계하기

앞 실습(271)에서는 브라우저가 AI를 직접 불렀습니다. 그런데 진짜 AI 서비스는 **비밀 API 키**가 있어야 부를 수 있어요.
이 키를 `index.html`에 적어 두면 어떻게 될까요? **누구나 페이지 소스를 열어 내 키를 훔쳐 쓸 수 있습니다.** (요금 폭탄!)

그래서 이번에는 중간에 **Edge Function(서버 함수)** 이라는 작은 심부름꾼을 둡니다.
브라우저는 서버 함수에 **"질문"만** 보내고, 진짜 AI 호출과 **비밀 키 사용은 서버가 대신**합니다. 키는 브라우저로 절대 내려오지 않습니다.

> 비유: 비밀 키는 **금고 열쇠**입니다. 손님(브라우저)에게 열쇠를 쥐여 주지 말고,
> 열쇠는 **직원(서버 함수)** 만 가집니다. 손님은 "이거 주세요"라고 **말만** 하고, 직원이 금고에서 꺼내다 줍니다.
> 손님 손에는 열쇠가 한 번도 닿지 않으므로, 손님이 악당이어도 금고는 안전합니다.

## 목표

- **공개해도 되는 값 vs 절대 숨길 값**을 구분한다.
  - 브라우저(`index.html`)에 둬도 되는 것: **anon(공개) 키** — 함수를 부르는 '출입증'
  - 절대 브라우저에 두면 안 되는 것: **AI 비밀 키**(`ANTHROPIC_API_KEY`) — 서버 Secret에만
- **서버 함수(Edge Function)의 역할**을 체감한다: 브라우저 대신 비밀 키를 들고 외부 API를 호출하는 '중계자'.
- 비밀 키는 코드에 적지 않고 **`supabase secrets set`** 으로 서버에만 주입하는 습관을 들인다.

## 따라하는 단계

1. **Supabase CLI를 준비한다.** 이미 부트캠프에서 깔았다면 건너뛰세요.
   ```bash
   npm install -g supabase
   supabase login
   ```

2. **이 폴더를 내 Supabase 프로젝트와 연결한다.** `내-프로젝트-아이디` 자리에 내 프로젝트 ref(Settings → General에 있음)를 넣으세요.
   ```bash
   supabase link --project-ref REPLACE_WITH_YOUR_PROJECT_REF
   ```

3. **비밀 키를 '서버에만' 등록한다(가장 중요).** 키를 파일이나 깃허브에 적지 말고, 아래 명령으로 서버 Secret에 넣습니다.
   ```bash
   supabase secrets set ANTHROPIC_API_KEY=REPLACE_WITH_YOUR_REAL_ANTHROPIC_KEY
   ```
   이렇게 하면 키는 Supabase 서버 안에서만 살아 있고, `index.ts` 코드에도, 브라우저에도 절대 나타나지 않습니다.

4. **서버 함수를 배포한다.** 이 폴더의 `supabase/functions/chat/index.ts`를 클라우드로 올립니다.
   ```bash
   supabase functions deploy chat
   ```
   배포가 끝나면 함수 주소가 생깁니다: `https://<내-프로젝트-아이디>.supabase.co/functions/v1/chat`

5. **프론트(`index.html`)에 공개 값만 넣는다.** `index.html` 위쪽의 두 값을 바꿉니다.
   - `PROJECT_REF` → 내 프로젝트 ref (예: `내-프로젝트-아이디`)
   - `ANON_KEY` → **anon(공개) 키** (Settings → API). 공개돼도 되는 출입증입니다.
   - ⚠️ 여기에는 **절대** AI 비밀 키나 `service_role` 키를 넣지 마세요.

6. **`index.html`을 브라우저로 열고** 질문을 보내 본다. 답이 말풍선으로 돌아오면, 그 답은 **서버 함수를 거쳐서** 온 것입니다.

## 검증법 (키가 정말 숨겨졌는지 확인)

- **답변이 오는가?** 질문을 보내면 봇 말풍선에 AI 답변이 표시됩니다.
- **소스 보기로 키가 없는지 확인(핵심):** 브라우저에서 **F12 → 페이지 소스/Network 탭**을 엽니다.
  - `index.html` 어디에도 AI 비밀 키 문자열이 없습니다.
  - Network 탭에서 `chat` 요청을 눌러 **요청 본문(Request Payload)** 을 보면 `{ "message": "..." }` 처럼 **질문만** 들어 있습니다. 비밀 키는 어디에도 보이지 않습니다.
- **서버에서만 키를 쓰는지 확인:** 일부러 3단계(`secrets set`)를 건너뛰고 함수를 부르면, 답 대신 `"서버에 ANTHROPIC_API_KEY가 설정되지 않았습니다."` 안내가 옵니다. → 키는 코드가 아니라 **서버 Secret**에서 온다는 증거입니다.
- **로그 확인(선택):** `supabase functions logs chat` 로 서버가 요청을 받아 처리했는지 볼 수 있습니다.

!!! danger "절대 하지 말 것"
    - AI 비밀 키(`ANTHROPIC_API_KEY`)나 `service_role`(secret) 키를 **`index.html`·자바스크립트·깃허브에 적지 마세요.** 한 번이라도 올리면 그 키는 유출된 것으로 보고 **새로 발급**해야 합니다.
    - 브라우저에 두는 값은 **anon(공개) 키**까지입니다. anon 키는 공개돼도 안전하도록 설계된 '출입증'입니다. (진짜 데이터 보호는 RLS와 서버 함수가 합니다.)
    - 비밀 값은 코드가 아니라 **`supabase secrets set`** 으로만 주입하세요.

## 관련 가이드 링크

- 같은 폴더: `index.html`(프론트), `supabase/functions/chat/index.ts`(중계 서버 함수), `.env.example`(비밀 키 자리표시자 예시)
- 이전 단계: `../271` 공개 API로 받은 답을 말풍선 UI로 보여주기 (직접 호출 방식 — 키가 없을 때)
- 다음 단계: `../273` 챗봇 대화 기록을 Supabase에 저장하고 다시 불러오기
- 개념: [4. 안전(보안) — 키와 RLS](https://zeusk302-png.github.io/treasure/04-security/)
- 개념: [공개해도 되는 키 vs 절대 숨길 키 (anon vs service_role)](https://zeusk302-png.github.io/treasure/04-security/01/)
- 공식 문서: [Supabase Edge Functions](https://supabase.com/docs/guides/functions)
- 공식 문서: [Edge Function에 비밀값(Secrets) 넣기](https://supabase.com/docs/guides/functions/secrets)
