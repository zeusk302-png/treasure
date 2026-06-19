# 262. 신고가 쌓인 글을 n8n으로 관리자에게 통보하고 자동으로 숨기기 (모더레이션)

공개 게시판을 열어 두면 언젠가 **신고할 글**이 생깁니다. 이걸 사람이 24시간 지켜볼 수는 없죠.
이 실습은 **"신고가 일정 횟수를 넘으면, 사람 손 없이 자동으로"** 두 가지를 하게 만듭니다.

1. **글을 화면에서 자동으로 숨긴다** (`is_hidden = true`)
2. **관리자에게 "이 글이 왜 숨겨졌는지" 메일로 알린다**

핵심은 **"신고를 세는 일·글을 숨기는 일은 화면이 직접 하면 안 된다"** 는 것입니다.
누구나 쓰는 화면(브라우저)에 그런 힘을 주면, 나쁜 사람이 남의 글을 마음대로 숨길 수 있으니까요.
그래서 그 힘은 **서버 쪽(n8n)** 에만 두고, 화면은 그저 **"신고 들어왔어요"** 라는 신호만 보냅니다.

> 결과물은 한 파일이 핵심입니다.
> - [`workflow.json`](workflow.json) — n8n에 Import 하면 바로 도는 **신고 처리 워크플로우**(완성본, 노드 8개)
> - [`schema.sql`](schema.sql) — 게시판 `posts` 표에 `report_count`·`is_hidden` 칸과 안전한 +1 함수를 더하는 준비물

이 실습은 게시판 실습(258~261)의 **다음 단계**입니다. `posts` 표가 이미 있다면 칸 두 개만 더 붙이면 됩니다.

## 목표

- 신고 신호를 **웹훅(Webhook)** 으로 받아, n8n이 **신고 수를 +1** 하게 만든다. (이벤트 기반 자동화)
- **IF(조건 분기)** 로 "신고 수가 임계치(예: 3회)를 넘었는가?"를 판단해, 넘었을 때만 행동하게 한다. (조건 자동화 = 모더레이션의 핵심)
- 임계치를 넘으면 글을 **자동으로 숨기고**(`is_hidden=true`), **관리자에게 메일**을 보낸다.
- 신고 +1·숨김 같은 **위험한 동작은 절대 화면(anon)으로 하지 않고**, RLS를 우회하는 `service_role` 키로 **n8n(서버) 안에서만** 하게 한다. 비밀 키는 워크플로우 JSON에 평문으로 쓰지 않는다.

## 따라하는 단계

### A. 준비 (Supabase)

1. Supabase 대시보드 왼쪽 메뉴 **SQL Editor → New query** 에 이 폴더의 [`schema.sql`](schema.sql) 전체를 붙여넣고 **[Run]** 한다.
   → `posts` 표에 `report_count`(신고 수)·`is_hidden`(숨김 여부) 칸이 생기고, 안전하게 +1 하는 `increment_report` 함수와 RLS 정책이 만들어진다.
2. 같은 화면에서 샘플 글의 `id`(예: `1`)를 적어 둔다. 나중에 신고 테스트에 쓴다.

### B. 비밀 키를 n8n 환경변수로 넣기 (service_role)

3. Supabase 대시보드 → **Project Settings → API** 에서 **`service_role`** 키를 복사한다.
   (`anon`(공개) 키가 **아니다!** 아래 '보안 한눈에' 표를 꼭 보고 둘을 구분할 것.)
4. n8n에서 환경변수 `SUPABASE_SERVICE_ROLE_KEY` 에 그 키를 넣는다. (n8n 클라우드: Variables / 셀프호스트: `.env` 파일)
   워크플로우 속 `{{ $env.SUPABASE_SERVICE_ROLE_KEY }}` 가 이 값을 자동으로 가져온다. **JSON에는 키 자체를 절대 적지 않는다.**

### C. n8n에 워크플로우 올리기

5. n8n에 로그인하고 우측 위 **"..." 메뉴 → Import from File** 로 이 폴더의 [`workflow.json`](workflow.json)을 불러온다. **노드 8개**가 선으로 이어져 보이면 성공이다.
6. **"신고 +1 (Supabase RPC)"** 와 **"글 자동 숨김"** 노드의 URL에서 `YOUR_PROJECT_REF` 를 내 Supabase 프로젝트 주소로 바꾼다. (예: `https://abcdwxyz.supabase.co`)
7. **"관리자에게 통보 (SMTP)"** 노드에서 **Credential(SMTP)** 칸에 내 메일 계정을 연결한다.
   JSON 속 `REPLACE_WITH_YOUR_SMTP_CREDENTIAL_ID` 는 자리표시자다. 실제 메일 비밀번호는 **n8n > Credentials** 에만 저장하고 JSON에는 적지 않는다.
8. 같은 메일 노드의 `fromEmail`(`no-reply@your-domain.com`)·`toEmail`(`admin@your-domain.com`)을 내 발신 주소·관리자 주소로 바꾼다.
9. (선택) 임계치를 바꾸고 싶으면 **"임계치 판단 (Set)"** 노드의 `임계치` 값(기본 3)과, **"임계치 넘었나? (IF)"** 가 보는 조건만 맞춰 바꾼다.

### D. 화면(게시판)에 '신고' 버튼 연결하기

10. 맨 왼쪽 **"신고 신호 받기 (Webhook)"** 노드를 더블클릭해 **Production URL** 을 복사한다.
11. 게시판 `script.js` 의 각 글 옆 **'신고' 버튼**에, 그 글의 번호(`post_id`)만 담아 이 URL로 POST 하는 코드를 붙인다.

    ```js
    // 신고 버튼을 눌렀을 때: 글 번호만 n8n으로 보냄 (비밀 키는 절대 보내지 않음!)
    async function reportPost(postId) {
      const res = await fetch("REPLACE_WITH_YOUR_N8N_WEBHOOK_URL", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ post_id: postId }),
      });
      const data = await res.json();
      if (data.hidden) {
        alert("신고가 접수되어 글이 숨김 처리되었습니다.");
      } else {
        alert("신고가 접수되었습니다.");
      }
    }
    ```

### E. 켜기

12. n8n 화면 우측 위 **"Test workflow"** 로 한 번 수동 실행 준비를 한 뒤, 게시판에서 같은 글의 '신고' 버튼을 **임계치만큼(기본 3번)** 누른다.
    3번째에 글이 화면에서 사라지고 관리자 메일이 오면 성공이다. 잘 되면 우측 위 토글을 **Active(켜짐)** 로 둔다.

## 🤖 바이브코딩 프롬프트

이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다. (n8n 워크플로우와 Supabase SQL은 직접 짜기보다 AI에게 설계를 시키고, 내가 '디렉터'로서 옳은지 판별하는 게 핵심입니다.)

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 n8n + Supabase 자동화 멘토야. 비전공자도 이해하게 설명해줘.
  공개 게시판(Supabase의 posts 표)에 '신고가 일정 횟수를 넘으면 글을 자동으로 숨기는' 모더레이션을 만들고 싶어.

  [먼저 Supabase SQL]
  - posts 표에 report_count(정수, 기본 0)와 is_hidden(불리언, 기본 false) 칸을 'add column if not exists'로 추가.
  - 신고 수를 동시 신고에도 누락 없이 +1 하는 함수 increment_report(target_id)를 만들고, 올린 뒤의 id/title/report_count/is_hidden을 돌려주게 해줘. (왜 함수로 하는지도 주석으로 설명)
  - RLS를 켜고, '읽기는 is_hidden=false 인 글만, 쓰기(insert)는 누구나' 정책만 허용. update/delete 정책은 일부러 만들지 마. (그래야 화면(anon)이 글을 못 숨김)

  [그 다음 n8n 워크플로우 뼈대]
  - Webhook(POST, post_id 하나만 받음) → increment_report 호출(HTTP) → 끝나는 최소 흐름부터.
  - 신고 +1 하는 HTTP 노드는 service_role 키로 호출하되, 키는 JSON에 직접 쓰지 말고 환경변수 {{ $env.SUPABASE_SERVICE_ROLE_KEY }} 로 넣어줘.

  결과는 schema.sql과 n8n workflow.json으로 줘. 비전공자가 따라할 수 있게 각 부분이 무엇이고 왜 그렇게 했는지 주석/노트로 설명해줘.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  좋아. 이제 위 워크플로우에 '임계치를 넘으면 자동 숨김 + 관리자 메일' 기능을 더해줘.
  - increment_report 결과를 받아 임계치(기본 3)와 비교하는 Set 노드를 추가. '신고 수 >= 3 이고 아직 is_hidden=false 면 숨겨야함=true' 로 계산.
  - IF 노드로 두 갈래: true 면 (1) posts의 is_hidden 을 true 로 PATCH(service_role 키) → (2) 관리자에게 어떤 글이 왜 숨겨졌는지 SMTP 메일 → (3) 화면에 '숨김됨' 응답. false 면 그냥 '접수됨' 응답.
  - 메일 비밀번호는 노드에 평문으로 쓰지 말고 n8n Credentials에 두고 연결만 해줘(자리표시자 ID).
  - 임계치를 5로 바꾸고 싶을 때 어디 한 군데만 고치면 되는지도 알려줘.
  바꾼 이유를 노드 note로 한국어로 적어줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  n8n 워크플로우를 실행했는데 기대대로 안 돼. 단계별로 원인을 좁혀줘.
  증상: (예) 신고를 3번 눌렀는데 글이 안 숨겨진다 / 메일이 안 온다 / 401 Unauthorized 가 뜬다.
  내가 확인할 것을 순서대로 알려줘:
  1) Webhook이 받은 post_id 값이 맞는지 (실행 로그의 첫 노드 출력 보는 법)
  2) increment_report 호출이 200인지, 401/404면 무엇이 틀린 건지 (service_role 키·URL의 YOUR_PROJECT_REF 확인)
  3) Set 노드의 '숨겨야함' 이 왜 false 로 계산됐는지 (report_count 값과 임계치 비교)
  4) IF가 어느 가지로 갔는지, SMTP 자격증명이 연결돼 있는지
  각 단계에서 '비전공자가 화면 어디를 봐야 하는지'까지 짚어줘.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다. 특히 보안 부분(anon vs service_role)은 "왜 화면에서 직접 숨기면 안 되는지"를 꼭 함께 물어보세요.

## 검증법

아래를 모두 만족하면 성공입니다.

- [ ] [`workflow.json`](workflow.json)을 Import 했을 때 **노드 8개**가 보이고, IF에서 **두 갈래**로 갈라진다: 위쪽 `숨김 → 관리자 메일 → 응답(숨김됨)`, 아래쪽 `응답(접수됨)`.
- [ ] 글을 **1~2번** 신고하면 IF가 **아래쪽(false) 가지**로 흘러, 글은 그대로 보이고 **관리자 메일이 오지 않는다.** (응답 메시지: "신고가 접수되었습니다.")
- [ ] 같은 글을 **임계치(3번)** 째 신고하면 IF가 **위쪽(true) 가지**로 흘러, 글이 **화면에서 사라지고** **관리자 메일**이 온다.
- [ ] 숨김 후 Supabase **Table editor** 에서 그 글의 `is_hidden` 이 **true**, `report_count` 가 **3 이상**으로 바뀌어 있다.
- [ ] 화면(anon)에서 그 글을 다시 불러와도 **읽히지 않는다.** (RLS 읽기 정책이 `is_hidden=false` 인 글만 허용하기 때문)
- [ ] 관리자가 글을 확인하고 문제없다고 판단해 `is_hidden` 을 **false 로 되돌리면**, 글이 화면에 **다시 나타난다.** (사람이 최종 결정권을 갖는다 = 모더레이션의 기본)
- [ ] [`workflow.json`](workflow.json)을 메모장으로 열었을 때 **실제 `service_role` 키·메일 비밀번호가 평문으로 보이지 않는다.** 키는 `{{ $env.SUPABASE_SERVICE_ROLE_KEY }}`, 메일 비밀번호는 자격증명 ID 자리표시자(`REPLACE_WITH_...`)로만 존재한다.

> ### 보안 한눈에: anon vs service_role
>
> | 키 | 성격 | 어디에 두나 | 이 실습에서 쓰는 곳 |
> |---|---|---|---|
> | `anon` (공개 키) | 브라우저에 노출돼도 되는 **공개** 키. RLS 규칙 안에서만 동작. | 프런트엔드(브라우저)·`script.js`·깃허브 | 게시판 화면(글 읽기·쓰기·신고 신호 보내기) |
> | `service_role` (비밀 키) | **RLS를 통째로 우회**하는 관리자 키. 노출되면 DB 전체가 위험. | **서버/n8n 환경변수에만** | 신고 +1·글 숨김(PATCH) |
>
> 왜 이렇게 나눌까요? 신고를 세고 글을 숨기는 일은 **모든 글을 건드릴 수 있는 강한 힘**입니다.
> 이 힘을 누구나 보는 화면(anon)에 주면, 나쁜 사람이 남의 글을 마음대로 숨길 수 있습니다.
> 그래서 화면은 **"신고 들어왔어요"** 신호만 보내고(`post_id` 하나뿐), 실제로 세고 숨기는 일은
> **n8n이 `service_role` 키로** 서버 안에서만 합니다. 이 키는 **브라우저·코드·깃허브에 절대 넣지 않습니다.**

## 관련 가이드

- [노코드 자동화란 무엇인가 — n8n으로 '반복'을 기계에 넘기기](../../docs/07-automation/01.md)
  (n8n의 노드·트리거·연결 개념이 처음이라면 여기부터 읽으세요.)
- [트리거 1 — 웹훅(Webhook): '무슨 일이 생긴 순간' 깨어나는 자동화](../../docs/07-automation/02.md)
  (신고 처리가 *신고가 들어온 순간*에 깨어나는 원리. 이 워크플로우의 시작점인 Webhook 노드의 근거입니다.)
- [외부 서비스 연동 — 이메일·슬랙·시트·결제를 안전하게 잇기](../../docs/07-automation/04.md)
  (관리자 통보 메일(SMTP)과 **비밀 키를 자격증명/환경변수에 안전하게 두는 법**의 근거입니다.)
- [공개해도 되는 키 vs 절대 숨길 키 — anon/publishable vs service_role/secret 완전 정정](../../docs/04-security/01.md)
  (위 '보안 한눈에' 표의 근거. 두 키를 헷갈리면 사고가 납니다. 반드시 읽으세요.)
- [RLS(행 수준 보안) — 출입증을 공개해도 안전한 진짜 이유](../../docs/04-security/02.md)
  (`is_hidden=false` 인 글만 읽히게 만든 읽기 정책, 그리고 service_role이 그 정책을 왜 우회할 수 있는지의 원리입니다.)
- 관련 실습: [260. RLS 정책으로 '작성자만 자기 글 수정·삭제' 막기](../260/README.md) — '화면 가드'와 'DB의 진짜 잠금(RLS)'의 차이를 먼저 익히면 이 실습이 훨씬 쉽습니다.
- 관련 실습: [261. 게시판에 댓글(1:N)과 좋아요 카운트 추가하기](../261/schema.sql) — 이 실습이 모더레이션할 글·댓글을 만드는 앞 단계입니다.
