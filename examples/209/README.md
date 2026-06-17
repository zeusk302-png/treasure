# 209 · Supabase 신규 가입자에게 환영 메일 자동 발송 (n8n)

새 회원이 가입하면, n8n이 알아서 Supabase에서 그 사람을 찾아내 "환영합니다!" 메일을 자동으로 보내주는 자동화를 만듭니다. 이 가이드의 핵심 스택인 **Supabase**(데이터)와 **n8n**(자동화)을 처음으로 연결해 보는 실습입니다.

## 목표

- 정해진 시간마다 자동으로 도는 워크플로우(n8n)를 만든다.
- **Supabase REST API**를 HTTP Request 노드로 호출해 "아직 환영 메일을 안 받은 신규 가입자"만 골라온다.
- 가입자 한 명 한 명에게 환영 메일을 보낸다(Loop로 반복).
- 메일을 보낸 사람은 `welcome_sent = true`로 표시해서, **같은 사람에게 두 번 보내지 않게** 만든다.
- 그 과정에서 **anon 키(공개) vs service_role 키(비밀)**의 차이와 안전하게 다루는 법을 익힌다.

## 따라하는 단계

1. **Supabase 테이블 준비하기**
   - Supabase 대시보드 → `SQL Editor`를 엽니다.
   - 같은 폴더의 `schema.sql` 내용을 통째로 붙여넣고 `Run`을 누릅니다.
   - 이렇게 하면 `profiles` 테이블, 가입 시 자동 등록 트리거, 그리고 RLS(보안 규칙)까지 한 번에 만들어집니다.

2. **두 종류의 API 키 확인하기 (가장 중요한 보안 포인트)**
   - Supabase 대시보드 → `Project Settings` → `API` 메뉴로 갑니다.
   - `Project URL`(예: `https://abcd1234.supabase.co`)을 복사해 둡니다.
   - 거기 보이는 두 키의 차이를 기억하세요.
     - **anon (public)**: 공개해도 되는 키. 브라우저(프론트엔드)에서 사용. RLS 규칙의 보호를 받습니다.
     - **service_role (secret)**: **절대 공개 금지**인 비밀 키. RLS를 무시하고 모든 데이터를 읽고 쓸 수 있습니다.
   - 이번 자동화는 서버(n8n)에서만 돌고, 모든 신규 가입자를 봐야 하므로 **service_role 키**를 씁니다. 이 키는 브라우저나 깃허브에 절대 올리지 않습니다.

3. **n8n에 비밀값을 환경변수로 넣기**
   - n8n을 띄울 때(또는 `.env` 파일에) 아래 값을 넣습니다. 실제 키 값으로 바꾸세요(여기서는 자리표시자입니다).
     ```
     SUPABASE_SERVICE_ROLE_KEY=여기에_service_role_키_붙여넣기
     ```
   - 워크플로우 안에서는 `{{ $env.SUPABASE_SERVICE_ROLE_KEY }}`로 불러오기 때문에, 키 값이 워크플로우 파일에 직접 노출되지 않습니다.

4. **워크플로우 가져오기(Import)**
   - n8n 화면 우측 상단 `...` 메뉴 → `Import from File`을 누르고 이 폴더의 `workflow.json`을 선택합니다.
   - 5개 노드가 연결된 워크플로우가 나타납니다.

5. **내 프로젝트 주소로 바꾸기**
   - `신규 가입자 조회 (Supabase REST)` 노드와 `발송 완료 표시` 노드의 URL에 있는 `YOUR_PROJECT_REF` 부분을, 2단계에서 복사한 내 프로젝트 주소로 바꿉니다.
   - 예: `https://abcd1234.supabase.co/rest/v1/profiles?...`

6. **메일 보내는 계정 연결하기 (SMTP)**
   - `환영 메일 발송 (SMTP)` 노드를 클릭 → `Credential`에서 `Create New`를 눌러 본인 메일 계정(Gmail 등)의 SMTP 정보를 입력합니다.
   - `fromEmail` 값을 실제 보내는 주소로 바꿉니다(`no-reply@your-domain.com`은 예시입니다).

7. **테스트 실행하기**
   - Supabase에 테스트 계정을 하나 가입시키거나, `profiles` 테이블에 `welcome_sent = false`인 행을 한 줄 직접 추가합니다(`email`에 본인 주소 입력).
   - n8n에서 `신규 가입자 조회` 노드의 `Execute step`을 눌러 데이터가 잘 나오는지 먼저 확인합니다.
   - 그다음 `Test workflow`로 전체를 실행합니다.

8. **자동 실행 켜기(Activate)**
   - 잘 동작하면 우측 상단 토글을 켜서 워크플로우를 **Active** 상태로 둡니다.
   - 이제 10분마다 자동으로 새 가입자를 확인하고 환영 메일을 보냅니다(주기는 Schedule 노드에서 변경 가능).

## 동작 흐름 (노드 5개)

```
10분마다 실행(Schedule)
   → 신규 가입자 조회 (welcome_sent=false 인 사람만, Supabase REST GET)
      → 한 명씩 반복 (Loop)
         → 환영 메일 발송 (SMTP)
            → 발송 완료 표시 (welcome_sent=true 로 PATCH)
            ↺ 다음 사람으로 돌아가 반복
```

- "보낼 사람"을 `welcome_sent=is.false`로 거르고, 보낸 직후 `true`로 바꾸는 구조라서 **중복 발송이 일어나지 않습니다.**
- `limit=50`을 둬서 한 번에 너무 많은 메일이 나가지 않게 안전장치를 뒀습니다.

## 검증법

- **데이터 조회 확인**: `신규 가입자 조회` 노드 실행 결과에 `welcome_sent=false`인 사람들만 나오면 성공입니다. (401/403 에러가 나면 키가 잘못된 것 → service_role 키와 URL을 다시 확인)
- **메일 도착 확인**: 테스트로 넣은 본인 메일 주소로 환영 메일이 실제로 오는지 확인합니다(스팸함도 확인).
- **중복 방지 확인**: 워크플로우를 한 번 더 실행했을 때, 같은 사람에게 메일이 또 가지 않으면 성공입니다(`welcome_sent`가 `true`로 바뀌어 조회에서 빠짐).
- **보안 확인**: `workflow.json`을 텍스트로 열어 봐도 실제 키 값이 보이지 않고 `$env.SUPABASE_SERVICE_ROLE_KEY`만 보이면 잘 한 것입니다.

## 흔한 실수 (주의)

- **service_role 키를 프론트엔드(브라우저 JS)에 넣지 않기**: 이 키가 새어 나가면 누구나 DB 전체를 읽고 지울 수 있습니다. 오직 n8n 서버 환경변수로만 보관하세요.
- **RLS를 끄지 않기**: 보안이 귀찮다고 RLS를 꺼버리면 anon 키만으로도 모든 사용자 데이터가 노출됩니다. RLS는 켜 두고, 자동화는 RLS를 통과하는 service_role 키로 처리하는 것이 정석입니다.

## 관련 가이드 링크

- 이전 단계: [208 · IF 노드로 조건 분기 처리하기](../208/)
- 다음 단계: [210 · 여러 건을 반복 처리하기 (Loop / Split In Batches)](../210/)
- 보조 파일: [`schema.sql`](./schema.sql) · [`workflow.json`](./workflow.json)
- 공식 문서: [Supabase REST API (PostgREST)](https://supabase.com/docs/guides/api) · [n8n HTTP Request 노드](https://docs.n8n.io/integrations/builtin/core-nodes/n8n-nodes-base.httprequest/) · [Supabase API 키와 RLS](https://supabase.com/docs/guides/api/api-keys)
