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

## 검증법
- n8n 실행 기록(Executions)에서 노드들이 위에서 아래로 **모두 초록색**으로 통과했는가?
- **AI Agent 노드의 출력**이 `{"category":"...","summary":"...","is_returning":true/false,"saved":true/false}` JSON 한 줄 형태인가? (다른 잡담 없이 이 형식만 나와야 한다.)
- Supabase의 `inquiries` 테이블에 방금 보낸 문의가 **새 행으로 한 줄 추가**되었는가? `category`와 `summary` 칸이 채워져 있는가?
- 같은 이메일로 **두 번째 문의**를 보내면 `is_returning`이 `true`로 바뀌는가? (AI가 이전 문의를 조회해 재방문 고객임을 알아챘다는 뜻이다.)
- Slack 채널에 카테고리·요약·재문의 여부·저장 결과가 담긴 알림 메시지가 도착했는가?

## 관련 가이드
- [AI를 도구로 엮기 — AI Agent 노드, MCP, Claude 스킬의 자리](https://zeusk302-png.github.io/treasure/07-automation/05/)
- [n8n과 MCP의 만남 — 워크플로우를 AI의 도구로, AI를 워크플로우의 도구로](https://zeusk302-png.github.io/treasure/07-automation/06/)
