# 실습 234 — n8n AI Agent + MCP로 문의 자동 분류·기록·알림 흐름 만들기

새 고객 문의가 들어오면 **AI Agent**가 내용을 5개 카테고리로 분류하고 한 줄로 요약한 뒤, **MCP(Supabase 도구)**로 같은 이메일의 이전 문의를 조회하고 이번 문의를 DB에 저장하고, 마지막으로 **Slack**으로 담당자에게 알림을 보내는 자동화 워크플로우입니다. 사람이 문의함을 일일이 확인하던 일을 AI가 받아 대신 처리하는, "AI를 워크플로우의 한 부품으로 쓰는" 실전 예제입니다.

이 폴더의 `workflow.json`은 n8n에 그대로 가져올 수 있는 워크플로우 파일입니다. (코드를 직접 짜는 게 아니라, n8n 화면에서 불러와 빈칸만 내 값으로 바꾸면 됩니다.)

## 목표
- AI Agent 노드가 "분류 → 요약 → 도구로 DB 조회·저장 → 정해진 형식으로 답하기"를 스스로 순서대로 해내게 시키는 법을 익힌다.
- MCP Client Tool로 Supabase를 AI의 **도구**로 연결해, AI가 직접 DB를 조회(select)·저장(insert)하게 하는 흐름을 경험한다.
- 시스템 메시지로 AI에게 **안전한 울타리**(카테고리 5개 고정, 삭제·수정 금지, 모르면 '기타')를 치는 디렉팅을 연습한다.

## 따라하는 단계
1. n8n에서 **새 워크플로우 → 우측 상단 메뉴 → Import from File**로 이 폴더의 `workflow.json`을 불러온다.
2. **문의 받기(Webhook)** 노드를 열어 `path`(주소 경로)를 내가 쓸 값으로 정한다. n8n이 만들어 주는 webhook URL을 따로 메모해 둔다. (나중에 문의를 보낼 주소다.)
3. **Claude 모델(Anthropic Chat Model)** 노드에서 Anthropic 자격증명(API 키)을 연결한다. (`REPLACE_WITH_YOUR_ANTHROPIC_CREDENTIAL_ID` 자리.)
4. Supabase에 문의를 담을 `inquiries` 테이블을 만든다. 칼럼: `name`, `email`, `message`, `category`, `summary` (텍스트). Supabase의 **MCP 엔드포인트 URL**과 헤더 인증 키를 준비한다.
5. **Supabase 도구(MCP Client Tool)** 노드에서 `endpointUrl`을 내 Supabase MCP 주소로 바꾸고, 헤더 인증 자격증명을 연결한다.
6. **Slack에 알림(Slack)** 노드에서 Slack 자격증명을 연결하고, 알림을 받을 채널 ID(`REPLACE_WITH_YOUR_SLACK_CHANNEL_ID` 자리)를 넣는다.
7. 워크플로우를 저장하고 활성화한 뒤, 2번에서 메모한 webhook 주소로 테스트 문의를 한 번 보낸다. (예: `name`, `email`, `message`를 담아 POST 요청.)

## 🤖 바이브코딩 프롬프트
이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다. (n8n은 화면에서 노드를 잇는 도구라 코드를 직접 쓰진 않지만, AI에게 "이런 워크플로우 JSON을 만들어줘 / 고쳐줘"라고 시키거나 시스템 메시지·프롬프트 문구를 다듬을 때 아래를 활용하세요.)

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 n8n 워크플로우 설계 도우미야. 비전공자가 이해할 수 있게 설명해줘.
  목표: 고객 문의가 들어오면 AI가 자동으로 분류하고 DB에 기록한 뒤 Slack으로 알리는 n8n 워크플로우를 만들고 싶어.
  필요한 노드를 순서대로 알려줘:
  1) Webhook(POST로 name/email/message를 받음)
  2) AI Agent(@n8n/n8n-nodes-langchain.agent)
  3) Anthropic Chat Model(Claude)을 AI Agent의 언어모델로 연결
  4) 결과를 Set 노드로 정리
  5) Slack 노드로 알림
  제약: 비밀키(API 키, 채널 ID)는 코드에 박지 말고 'REPLACE_WITH_...' 자리표시자로 둬.
  산출물: 각 노드의 역할을 한 줄씩 설명한 표 + n8n에 Import 할 수 있는 workflow.json 초안.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  위 워크플로우에 기능을 더 붙이고 싶어.
  1) MCP Client Tool 노드로 Supabase를 AI Agent의 '도구'로 연결해서, AI가 직접 inquiries 테이블을 조회(select)하고 저장(insert)하게 해줘.
  2) AI Agent의 시스템 메시지에 안전 울타리를 넣어줘: 카테고리는 5개(결제문의/환불요청/기능제안/버그신고/기타)만, delete·update 금지, 모르면 '기타', 마지막 답은 정해진 JSON 한 줄로만.
  3) 같은 이메일로 다시 문의가 오면 is_returning을 true로 표시하게 해줘.
  각 변경이 왜 필요한지, 어떤 위험을 막는지도 한 줄씩 설명해줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  n8n 실행에서 에러가 났어. 아래 정보를 보고 원인을 단계별로 짚어줘.
  - 빨갛게 실패한 노드 이름: (여기에)
  - 그 노드의 에러 메시지 전체: (여기에 붙여넣기)
  - AI Agent 노드의 실제 출력(output): (여기에 붙여넣기)
  특히 이런 점을 확인해줘: AI가 JSON 형식만 출력했는지(잡담이 섞였는지), Supabase MCP 도구가 제대로 연결됐는지, 자격증명(API 키)이 비어있진 않은지.
  내가 직접 눌러볼 수 있는 점검 순서로 알려줘.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다.

## 검증법
- n8n 실행 기록(Executions)에서 노드들이 위에서 아래로 **모두 초록색**으로 통과했는가?
- **AI Agent 노드의 출력**이 `{"category":"...","summary":"...","is_returning":true/false,"saved":true/false}` JSON 한 줄 형태인가? (다른 잡담 없이 이 형식만 나와야 한다.)
- Supabase의 `inquiries` 테이블에 방금 보낸 문의가 **새 행으로 한 줄 추가**되었는가? `category`와 `summary` 칸이 채워져 있는가?
- 같은 이메일로 **두 번째 문의**를 보내면 `is_returning`이 `true`로 바뀌는가? (AI가 이전 문의를 조회해 재방문 고객임을 알아챘다는 뜻이다.)
- Slack 채널에 카테고리·요약·재문의 여부·저장 결과가 담긴 알림 메시지가 도착했는가?

## 관련 가이드
- [AI를 도구로 엮기 — AI Agent 노드, MCP, Claude 스킬의 자리](https://zeusk302-png.github.io/treasure/07-automation/05/)
- [n8n과 MCP의 만남 — 워크플로우를 AI의 도구로, AI를 워크플로우의 도구로](https://zeusk302-png.github.io/treasure/07-automation/06/)
