# 256. 예약 확정 후 n8n으로 확인 메일 + 하루 전 리마인더 자동 보내기

예약을 받는 가게라면 두 번의 메일이 필요합니다.

1. **확정 즉시 보내는 확인 메일** — "예약됐어요!" (손님이 지금 막 예약을 끝낸 순간)
2. **하루 전에 보내는 리마인더** — "내일 예약 잊지 마세요!" (정해진 시간에 알아서)

이 두 가지는 깨어나는 방식이 다릅니다. 확인 메일은 *무슨 일이 생긴 순간*에 깨어나야 하니 **웹훅(Webhook)** 으로,
리마인더는 *정해진 시간에* 깨어나야 하니 **크론(Cron)** 으로 만듭니다. 이 실습은 이 둘을 **한 워크플로우**에 담습니다.

> 결과물은 한 파일입니다.
> - [`workflow.json`](workflow.json) — n8n에 Import 하면 바로 도는 완성본 (노드 9개)

이 실습은 앞 실습 255번(예약을 Supabase `bookings` 표에 저장하기)의 다음 단계입니다.
`bookings` 표에 `reminder_sent`(불리언, 기본값 false) 열 하나만 미리 추가해 두면 됩니다.

## 목표

- 예약이 확정되면 **웹훅 트리거**로 그 즉시 손님에게 **확인 메일**을 보낸다. (이벤트 기반 자동화)
- **매일 아침 9시 크론**으로 깨어나 Supabase에서 **내일 날짜 예약**만 골라 **리마인더 메일**을 보낸다. (시간 기반 자동화)
- 중간에 **IF(조건 분기)** 를 두어, 내일 예약이 **한 건도 없으면 아무 메일도 보내지 않게** 한다.
- 비밀 키(`service_role`)와 메일 비밀번호를 **워크플로우 JSON에 평문으로 쓰지 않고**, n8n의 환경변수·자격증명에만 두는 안전한 습관을 익힌다.

## 따라하는 단계

### A. 준비 (Supabase)

1. 255번에서 만든 `bookings` 표에 열 하나를 추가한다: `reminder_sent` (타입 `bool`, 기본값 `false`). 이미 보낸 리마인더를 두 번 보내지 않으려는 표시다.
2. 이 표에는 최소 다음 열이 있다고 가정한다: `id`, `name`, `email`, `reserve_date`(예: `2026-06-20`), `reserve_time`(예: `14:00`), `reminder_sent`.

### B. n8n에 워크플로우 올리기

3. n8n에 로그인하고 우측 위 **"..." 메뉴 → Import from File** 로 이 폴더의 [`workflow.json`](workflow.json)을 불러온다. 화면에 **노드 9개**가 보이면 성공이다.
4. 두 개의 **메일 노드**(확인 메일 / 리마인더 메일)에서 **Credential(SMTP)** 칸에 내 메일 계정을 연결한다. JSON 속 `REPLACE_WITH_YOUR_SMTP_CREDENTIAL_ID` 는 자리표시자다. 실제 메일 비밀번호는 **n8n > Credentials** 에만 저장하고 JSON에는 절대 적지 않는다.
5. 두 메일 노드의 `fromEmail`(`no-reply@your-domain.com`)을 내 발신 주소로 바꾼다.

### C. 비밀 키를 환경변수로 넣기 (Supabase service_role)

6. Supabase 대시보드 → **Project Settings → API** 에서 **`service_role`** 키를 복사한다. (`anon`(공개) 키가 아니다! 둘을 헷갈리지 말 것 — 아래 표 참고)
7. n8n에서 환경변수 `SUPABASE_SERVICE_ROLE_KEY` 에 그 키를 넣는다. (n8n 클라우드: Variables / 셀프호스트: `.env`) 워크플로우의 `{{ $env.SUPABASE_SERVICE_ROLE_KEY }}` 가 이 값을 자동으로 가져온다.
8. **"내일 예약 조회"** 와 **"리마인더 발송 표시"** 노드의 URL에서 `YOUR_PROJECT_REF` 를 내 Supabase 프로젝트 주소로 바꾼다. (예: `https://abcdwxyz.supabase.co`)

### D. 확인 메일 흐름 연결 (웹훅)

9. 맨 왼쪽 **"예약 확정 신호 받기 (Webhook)"** 노드를 더블클릭해 **Production URL** 을 복사한다.
10. 255번 예약 폼의 `script.js` 에서 Supabase에 예약을 **저장한 직후**, 이 Webhook URL로 방금 만든 예약 정보를 POST 하도록 한 줄 추가한다.

    ```js
    // 예약을 Supabase에 insert 한 뒤, 확인 메일 트리거 호출
    await fetch("REPLACE_WITH_YOUR_N8N_WEBHOOK_URL", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name.value,
        email: form.email.value,
        reserve_date: form.reserve_date.value, // 예: 2026-06-20
        reserve_time: form.reserve_time.value, // 예: 14:00
      }),
    });
    ```

### E. 켜기

11. 화면 우측 위 **"Test workflow"** 로 한 번 수동 실행해 본다. (크론 가지는 "내일 예약 조회"부터 직접 실행해 테스트할 수 있다.)
12. 잘 되면 우측 위 토글을 **Active(켜짐)** 로 둔다. 이제 예약이 확정될 때마다 확인 메일이, 매일 9시마다 내일 예약 리마인더가 자동으로 나간다.

## 🤖 바이브코딩 프롬프트

이 실습(웹훅 확인 메일 + 크론 리마인더를 한 n8n 워크플로우에 담기)을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 n8n 자동화 전문가야. 비전공자가 Import만 하면 바로 도는 n8n 워크플로우 JSON 한 개를 만들어 줘.
  목표: 식당 예약 시스템의 두 가지 메일 자동화를 '하나의 워크플로우'에 담는다.
    (가지 1) 웹훅(POST /booking-confirmed)을 받으면 즉시 손님에게 '예약 확정' 확인 메일(SMTP)을 보내고, 호출한 브라우저에 200 OK JSON으로 응답한다.
    (가지 2) 매일 아침 9시 크론('0 9 * * *')으로 깨어나 Supabase REST로 '내일 날짜 & reminder_sent=false'인 예약만 조회한다.
  제약:
    - 비밀 키(service_role)와 메일 비밀번호를 JSON에 평문으로 절대 쓰지 말 것.
      service_role 키는 {{ $env.SUPABASE_SERVICE_ROLE_KEY }} 환경변수 참조로, SMTP 비밀번호는 n8n Credentials(자격증명) 연결로만 처리.
    - Supabase 프로젝트 주소는 YOUR_PROJECT_REF 자리표시자로 둔다.
  산출물: n8n에 Import 가능한 workflow.json 하나. 각 노드에 비전공자용 한국어 'notes'(이 노드가 무엇을 왜 하는지)를 달아 줘.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  위 워크플로우에 다음을 추가해 줘.
    1) 크론 가지에 IF(조건 분기)를 넣어, 내일 예약이 '한 건도 없으면' 메일을 한 통도 보내지 않게 한다(예약 id 존재 여부로 판정).
    2) 내일 예약이 여러 건일 수 있으니 '한 건씩 반복(Loop, splitInBatches)' 노드로 차례로 리마인더 메일을 보낸다.
    3) 리마인더를 보낸 예약은 Supabase에 PATCH로 reminder_sent=true 로 바꿔, 다음 날 같은 예약에 메일이 또 가지 않게(중복 방지) 한다.
  왜 그렇게 했는지 각 노드 notes에 한국어로 설명을 덧붙여 줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  n8n에서 '내일 예약 조회' 노드를 실행했더니 결과가 비어 있거나(빈 배열) 401/403 에러가 나. 아래를 단계별로 진단해 줘.
    - 내가 anon 키와 service_role 키를 헷갈려 넣은 건 아닌지(모든 손님 예약을 읽으려면 RLS를 우회하는 service_role 키가 필요).
    - {{ $env.SUPABASE_SERVICE_ROLE_KEY }} 환경변수가 실제로 등록돼 있는지, URL의 YOUR_PROJECT_REF를 안 바꾼 건 아닌지.
    - 날짜 필터 '{{ $today.plus(1, "days").toFormat("yyyy-MM-dd") }}'가 내 예약 데이터의 reserve_date 형식과 맞는지.
  무엇을 어디서 확인해야 하는지 순서대로 알려 줘.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석(노드 notes)으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다.

## 검증법

아래를 모두 만족하면 성공입니다.

- [ ] [`workflow.json`](workflow.json)을 Import 했을 때 노드가 **두 갈래**로 보인다: 위쪽 `Webhook → 확인 메일 → 응답`, 아래쪽 `Cron → 조회 → IF → Loop → 리마인더 메일 → 발송 표시`.
- [ ] 예약 폼에서 예약을 한 건 만들면 **확인 메일**이 곧바로 받은편지함에 도착한다.
- [ ] `reserve_date` 를 **내일 날짜**로 둔 예약을 만들고, "내일 예약 조회" 노드부터 수동 실행하면 → IF가 **위쪽(true) 가지**로 흐르고 **리마인더 메일**이 온다.
- [ ] 실행 후 Supabase에서 그 예약의 `reminder_sent` 가 **true 로 바뀌어** 있다. (다시 실행해도 같은 예약에 리마인더가 또 가지 않는다.)
- [ ] **내일 예약이 한 건도 없을 때** 크론 가지를 실행하면 IF가 **아래쪽(false) 가지**로 끝나 **메일이 한 통도 가지 않는다.**
- [ ] [`workflow.json`](workflow.json)을 메모장으로 열었을 때 **실제 `service_role` 키·메일 비밀번호가 평문으로 보이지 않는다.** 키는 `{{ $env.SUPABASE_SERVICE_ROLE_KEY }}`, 메일 비밀번호는 자격증명 ID 자리표시자(`REPLACE_WITH_...`)로만 존재한다.

> ### 보안 한눈에: anon vs service_role
>
> | 키 | 성격 | 어디에 두나 | 이 실습에서 쓰는 곳 |
> |---|---|---|---|
> | `anon` (공개 키) | 브라우저에 노출돼도 되는 **공개** 키. RLS 규칙 안에서만 동작. | 프런트엔드(브라우저) | (여기선 안 씀 — 255번 예약 폼에서 사용) |
> | `service_role` (비밀 키) | **RLS를 통째로 우회**하는 관리자 키. 노출되면 DB 전체가 위험. | **서버/n8n 환경변수에만** | 내일 예약 조회·발송 표시(PATCH) |
>
> 리마인더는 *모든 손님의* 예약을 읽어야 하므로 RLS를 우회하는 `service_role` 키가 n8n(서버 쪽)에 필요합니다.
> 하지만 이 키는 **브라우저에 절대 넣으면 안 됩니다.** 그래서 n8n 환경변수에만 두고, 워크플로우 JSON에는 `$env` 참조만 남깁니다.

## 관련 가이드

- [노코드 자동화란 무엇인가 — n8n으로 '반복'을 기계에 넘기기](../../docs/07-automation/01.md)
  (n8n의 노드·트리거·연결 개념이 처음이라면 여기부터 읽으세요.)
- [트리거 1 — 웹훅(Webhook): '무슨 일이 생긴 순간' 깨어나는 자동화](../../docs/07-automation/02.md)
  (확인 메일이 *예약 확정 순간*에 깨어나는 원리. 위쪽 Webhook 가지의 근거입니다.)
- [트리거 2 — 스케줄/크론(Cron): '정해진 시간에' 도는 자동화](../../docs/07-automation/03.md)
  (리마인더가 *매일 9시*에 도는 원리. `0 9 * * *` 같은 크론 표현식 읽는 법이 여기 있습니다.)
- [외부 서비스 연동 — 이메일·슬랙·시트·결제를 안전하게 잇기](../../docs/07-automation/04.md)
  (SMTP 메일 보내기와 **비밀 키를 자격증명/환경변수에 안전하게 두는 법**의 근거입니다.)
- 관련 실습: [255. 예약을 Supabase에 저장하고 중복 막기](../255/README.md) — 이 실습이 보내는 메일의 원본 데이터를 만드는 앞 단계입니다.
- 관련 실습: [257. 예약 취소 링크로 고객이 스스로 예약을 DELETE 하게 하기](../257/README.md) — 리마인더 메일에 "취소하기" 링크를 더하는 다음 단계입니다.
