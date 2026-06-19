# 248. n8n으로 새 구독자 발생 시 환영 이메일 자동 발송하기

누군가 우리 사이트에서 "구독하기"를 눌러 **Supabase 테이블에 새 행이 한 줄 생기는 순간**,
n8n이 그 사실을 받아서 그 사람에게 **환영 메일을 자동으로** 보내 줍니다.
사람이 매번 메일을 쓰지 않아도 되는 — 노코드 자동화의 가장 기본 패턴(트리거 → 액션)입니다.

이 폴더의 [`workflow.json`](workflow.json) 은 n8n에 그대로 **Import** 하면 바로 도는 완성본입니다.

> 흐름 한눈에 보기
> Supabase에 새 구독자 행 추가 → (Supabase Database Webhook이 알림 발송)
> → n8n **Webhook 노드**가 받음 → **Set**으로 이메일·이름 꺼냄 → **IF**로 이메일 유무 확인
> → **Send Email**로 환영 메일 발송

## 목표

- Supabase의 신규 행(새 구독자)을 **트리거(시작 신호)** 로 삼아 n8n 워크플로우가 저절로 깨어나게 만든다.
- 받은 데이터에서 **이메일·이름**을 꺼내 메일 내용에 끼워 넣는 법(`{{ ... }}` 표현식)을 익힌다.
- "트리거(언제 시작) → 액션(무엇을 할지)" 라는 자동화의 뼈대를 직접 만들어 본다.
- 메일 계정 비밀번호 같은 **비밀값은 워크플로우 JSON이 아니라 n8n Credentials**에만 둔다는 원칙을 지킨다.

## 따라하는 단계

### A. Supabase에 구독자 테이블 준비하기

1. Supabase 프로젝트에서 **Table Editor → New table** 로 `subscribers` 테이블을 만든다.
   컬럼은 `id`(기본), `email`(text), `name`(text), `created_at`(timestamp, 기본값 `now()`) 정도면 충분하다.

### B. n8n 워크플로우 가져오기

2. n8n 클라우드에 로그인한다. 우측 위 **"..." 메뉴 → Import from File** 로 이 폴더의 [`workflow.json`](workflow.json) 을 불러온다.
   노드 5개(Webhook → Set → IF → 환영 메일 / 메일 건너뜀)가 선으로 이어져 보이면 성공이다.
3. **"새 구독자 발생 (Webhook)"** 노드를 더블클릭한 뒤, **Test URL**(또는 Production URL)을 복사해 둔다.
   주소는 보통 `https://<내-n8n-주소>/webhook/new-subscriber` 형태다. (이 주소를 다음 단계 Supabase에 붙여 넣는다.)
4. **"환영 메일 보내기 (Send Email)"** 노드를 열어 `fromEmail` 의 `YOUR_SENDER_EMAIL@example.com` 을 **내 보내는 주소**로 바꾼다.
   (받는 주소 `toEmail` 은 `{{ $json.이메일 }}` 그대로 둔다 — 구독자 본인에게 가야 하므로 자동으로 채워진다.)
5. 같은 메일 노드의 **Credential(SMTP)** 칸에서 내 메일 계정을 연결한다.
   JSON 안의 `REPLACE_WITH_YOUR_SMTP_CREDENTIAL_ID` 는 **자리표시자**일 뿐이다. 실제 비밀번호는 n8n **Credentials**(암호화 저장소)에만 저장하고, JSON에는 절대 적지 않는다.

### C. Supabase가 n8n을 호출하게 연결하기 (트리거)

6. Supabase 대시보드에서 **Database → Webhooks → Create a new hook** 으로 들어간다.
7. 다음과 같이 설정한다.
   - Table: `subscribers`
   - Events: **Insert** (행이 새로 생길 때만)
   - Type: **HTTP Request**, Method: **POST**
   - URL: 3번에서 복사한 **n8n Webhook 주소**
8. 저장한다. 이제 `subscribers` 에 행이 하나 생길 때마다 Supabase가 그 행 정보를 n8n으로 POST로 보내 준다.
   (보내지는 데이터는 `{ "type": "INSERT", "record": { "email": ..., "name": ... } }` 모양이다. 그래서 Set 노드가 `$json.body.record.email` 로 값을 꺼낸다.)

### D. 실제로 한 번 돌려 보기

9. n8n에서 워크플로우 우측 위 **"Test workflow"** 를 눌러 대기 상태로 둔다(웹훅이 한 번의 요청을 기다림).
10. Supabase **Table Editor → subscribers → Insert row** 로 내 이메일이 든 행을 한 줄 추가한다.
11. n8n으로 돌아와 모든 노드에 **초록 체크**가 뜨는지, 그리고 내 메일함에 **환영 메일**이 도착했는지 확인한다.
12. 잘 되면 n8n 워크플로우를 **Active(켜짐)** 로 두어, 앞으로는 새 구독자가 생길 때마다 자동으로 메일이 나가게 한다.

## 🤖 바이브코딩 프롬프트

이 자동화를 AI(n8n AI 또는 ChatGPT/Claude)에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 n8n 노코드 자동화를 가르치는 멘토야. 나는 비전공자고, n8n 클라우드에 그대로 Import 할 수 있는 워크플로우 JSON 한 개를 만들고 싶어.
  목표: Supabase의 subscribers 테이블에 새 행(INSERT)이 생기면, 그 사람에게 환영 이메일을 자동 발송한다.
  제약:
  - 노드 구성은 [Webhook(POST, path=new-subscriber)] → [Set(이메일·이름 꺼내기)] → [IF(이메일 비었는지 검사)] → 참이면 [Send Email], 거짓이면 [Set(메일 건너뜀)] 이렇게 5개로.
  - Supabase Database Webhook이 보내는 본문은 { "type":"INSERT", "record": { "email":..., "name":... } } 모양이야. Set 노드는 $json.body.record.email / .name 으로 값을 꺼낼 것.
  - 메일 비밀번호·SMTP 비밀값은 JSON에 절대 넣지 말고, credentials.smtp.id 자리에는 REPLACE_WITH_YOUR_SMTP_CREDENTIAL_ID 같은 자리표시자만 둬.
  산출물: n8n Import 가능한 workflow.json 전체 + 각 노드가 무슨 역할인지 한 줄씩 설명.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  위 워크플로우를 개선해줘.
  1) 이름(name)이 비어 있으면 '구독자'로 대체해서 메일이 어색하지 않게 해줘. (예: $json.body.record.name || '구독자')
  2) 메일 제목·본문에 구독자 이름과 가입 시각($now.format)을 끼워 넣어줘.
  3) 이메일이 비어 있는(잘못된) 행이 들어와도 워크플로우가 깨지지 않고 '메일 건너뜀' 가지로 흐르게 IF 분기를 확인해줘.
  바꾼 부분과 그 이유를 한 줄씩 설명해줘. 비밀값은 여전히 Credentials에만 두고 JSON엔 넣지 마.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  Supabase에 행을 추가했는데 n8n에 실행이 안 생기거나, 실행은 됐는데 메일이 안 와. 단계별로 진단해줘.
  - 내 Supabase Webhook 설정: (Table/Events/Method/URL 붙여넣기)
  - n8n 실행 기록(Executions)에서 본 에러 메시지: (그대로 붙여넣기)
  체크해야 할 순서를 알려줘: ① Supabase Webhook URL이 n8n Webhook 주소(production/test)와 맞는지 ② Set 노드가 $json.body.record.email 로 값을 제대로 꺼냈는지 ③ IF가 어느 가지로 흘렀는지 ④ Send Email의 SMTP Credential이 연결됐는지. 가장 의심되는 원인부터 짚어줘.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 훨씬 좋습니다.

## 검증법

아래를 모두 만족하면 성공입니다.

- [ ] [`workflow.json`](workflow.json) 을 Import 했을 때 **노드 5개**(Webhook → Set → IF → 환영 메일 / 메일 건너뜀)가 선으로 이어져 보인다.
- [ ] Supabase `subscribers` 에 새 행을 추가하면 n8n 실행 기록(Executions)에 **새 실행이 자동으로** 한 건 생긴다.
- [ ] 실행 시 IF 노드는 **한쪽 가지로만** 흐른다. (이메일이 있으면 "환영 메일", 이메일이 비어 있으면 "메일 건너뜀")
- [ ] 추가한 행의 이메일 주소로 **환영 메일이 실제 도착**하고, 메일 제목·본문에 그 사람의 **이름이 끼워져** 있다.
- [ ] 이메일이 빈 행을 일부러 넣으면 메일이 **가지 않고** "메일 건너뜀" 가지로 흐른다. (잘못된 데이터에도 안 깨진다는 증거)
- [ ] [`workflow.json`](workflow.json) 을 메모장으로 열었을 때, 메일 **비밀번호·SMTP 비밀값이 평문으로 보이지 않는다.** 비밀값은 n8n Credentials에만 있고 JSON에는 `REPLACE_WITH_...` 자리표시자만 남아 있다.

> 빠른 자가 점검: 워크플로우 JSON에 진짜 비밀번호가 보이면 위험합니다.
> n8n에서 비밀값은 노드가 아니라 **Credentials**(암호화 저장소)에 들어가야 하고, 공유용 JSON에는 ID 자리표시자만 남깁니다.

## 관련 가이드

- [노코드 자동화란 무엇인가 — n8n으로 '반복'을 기계에 넘기기](../../docs/07-automation/01.md)
  (n8n의 노드·연결·실행 개념이 처음이면 여기부터 읽으세요.)
- [트리거 1 — 웹훅(Webhook): '무슨 일이 생긴 순간' 깨어나는 자동화](../../docs/07-automation/02.md)
  (이 실습의 핵심 — Supabase가 보내는 신호를 n8n Webhook이 받는 원리가 여기 있습니다.)
- [외부 서비스 연동 — 이메일·슬랙·시트·결제를 안전하게 잇기](../../docs/07-automation/04.md)
  (Send Email 노드의 SMTP 연결과 Credential 안전 보관법의 근거입니다.)
- [공개해도 되는 키 vs 절대 숨길 키 — anon/publishable vs service_role/secret](../../docs/04-security/01.md)
  (비밀값을 JSON에 적지 않고 Credentials에만 두는 이 실습의 보안 원칙이 왜 중요한지 알려 줍니다.)
- 이전 실습: [196. n8n 첫 워크플로우 만들기](../196/README.md) — n8n이 처음이면 먼저 보고 오세요.
- 이웃 실습: [199. Webhook URL로 외부 요청 받아보기](../199/README.md) — Webhook 노드가 외부 요청을 어떻게 받는지 단독으로 연습합니다.
