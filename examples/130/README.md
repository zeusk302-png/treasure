# 실습 130 — n8n으로 새 글 알림 자동화 + Claude 디렉터 프롬프트로 전체 점검하기

지금까지 만든 방명록(Supabase) 앱에 **새 글이 들어오면 자동으로 이메일·슬랙 알림**이 가게 만들고, 만든 앱 전체를 **Claude에게 "디렉터" 관점으로 코드 리뷰**까지 받아 마무리하는 실습입니다. 코드를 더 짜는 게 아니라, "무엇을·언제·누구에게 시킬지"를 사람이 정하고 기계와 AI에게 정확히 시키는 연습입니다.

이 폴더에는 두 개의 파일이 들어 있습니다.
- `workflow.json` — n8n에 그대로 불러올(import) 수 있는 자동화 워크플로우. 5분마다 방명록을 들여다보고, 새 글이 있으면 이메일과 슬랙으로 알림을 보냅니다.
- `director-prompt.md` — 만든 앱을 Claude에게 점검받을 때 복사해서 쓰는 프롬프트 4개 + 사람이 직접 확인할 체크리스트.

## 목표
- 사람이 화면을 안 보고 있어도 **"새 글이 생기면 알림이 간다"**는 자동화 한 줄을 직접 동작시켜 본다.
- n8n의 기본 흐름 **트리거(5분마다) → 데이터 가져오기 → 조건(IF) → 알림 보내기**를 눈으로 따라가며 이해한다.
- 비밀값(`service_role` 키, 슬랙 Webhook URL, 이메일 비번)은 **코드/깃허브에 절대 두지 않고** n8n 안에만 보관한다는 원칙을 체득한다.
- "코드 다 짜 줘"가 아니라 **점검 기준을 사람이 정하고 AI에게 시키는** 디렉팅 방식을 경험한다.

## 따라하는 단계
1. n8n을 준비한다(클라우드 가입 또는 데스크톱 앱). 새 워크플로우 화면에서 **Import from File**로 이 폴더의 `workflow.json`을 불러온다.
2. **"최근 5분 새 글 조회" 노드**를 열어, `url`의 `여기에-내-프로젝트-ID` 부분을 내 Supabase 프로젝트 주소로 바꾼다.
3. 같은 노드의 헤더에서 `REPLACE_WITH_SERVICE_ROLE_KEY` 두 군데를 내 **service_role 키**로 채운다. (이 키는 워크플로우 안에만 두고, 브라우저 코드나 깃허브엔 절대 넣지 않습니다.)
4. **"이메일 알림" 노드**에서 받는 주소 `REPLACE_WITH_MY_EMAIL@example.com`를 내 이메일로 바꾸고, n8n의 **Credentials**에 SMTP(메일 보내기) 계정을 연결한다.
5. **"슬랙 알림" 노드**의 `REPLACE_WITH_SLACK_WEBHOOK_URL`을 내 슬랙 **Incoming Webhook URL**로 바꾼다. (슬랙을 안 쓰면 이 노드는 지워도 됩니다.)
6. 워크플로우를 저장하고 **Active(켜기)** 한다. 또는 우선 **Execute Workflow** 버튼으로 한 번 수동 실행해 본다.
7. 방명록 앱에서 글을 하나 새로 남긴 뒤, 5분 안에 이메일/슬랙으로 알림이 오는지 확인한다.
8. 알림 흐름이 잘 되면, `director-prompt.md`를 열어 **프롬프트 1 → 2 → 3 → 4** 순서대로 Claude에게 보내 내 앱 전체를 점검받는다. (붙여넣기 전, 문서 맨 위 "안전 점검"대로 비밀값을 `REPLACE_WITH_...`로 가린 뒤 보낸다.)

## 검증법
- 새 글을 남긴 뒤 5분 안에 **이메일이 오고**, 슬랙 채널에 **"방명록 새 글 ..." 메시지**가 뜨는가?
- 새 글이 없을 때 실행하면 **아무 알림도 오지 않고 조용히 끝나는가?** (IF 노드가 새 글 0개를 걸러 줍니다.)
- n8n의 **Executions** 기록에서 각 단계가 초록색(성공)으로 끝났는가? 빨간색이면 그 노드를 열어 키/주소 오타를 점검한다.
- `workflow.json`을 깃허브에 올려도 그 안에 **진짜 비밀값이 없는가?** (전부 `REPLACE_WITH_...` 자리표시자여야 합니다.)
- `director-prompt.md`의 체크리스트대로, `script.js`에 든 키가 `sb_publishable_`(공개용 anon)로 시작하고 `sb_secret_`(비밀 service_role)가 **아닌지** 내 눈으로 확인했는가?

## 관련 가이드
- [노코드 자동화란 무엇인가 — n8n으로 '반복'을 기계에 넘기기](https://zeusk302-png.github.io/treasure/07-automation/01/)
- [트리거 2 — 스케줄/크론: '정해진 시간에' 도는 자동화](https://zeusk302-png.github.io/treasure/07-automation/03/)
- [외부 서비스 연동 — 이메일·슬랙·시트·결제를 안전하게 잇기](https://zeusk302-png.github.io/treasure/07-automation/04/)
- [공개해도 되는 키 vs 절대 숨길 키 (anon vs service_role)](https://zeusk302-png.github.io/treasure/04-security/01/)
- [RLS — 출입증을 공개해도 안전한 진짜 이유](https://zeusk302-png.github.io/treasure/04-security/02/)
