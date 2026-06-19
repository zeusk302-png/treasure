# 실습 311 — Supabase Realtime으로 실시간 방명록 만들기

방명록에 누군가 새 글을 남기면, **내가 새로고침하지 않아도** 그 글이 내 화면에 스르륵 떠오르게 만듭니다. 보통 이런 "실시간" 기능은 직접 WebSocket 서버를 짜야 하지만, 여기서는 **Supabase Realtime**을 구독(subscribe)하기만 하면 됩니다. 서버 코드 한 줄 없이, 정적 HTML 한 장 + Supabase 설정만으로 실시간을 붙여 봅니다.

> 한 줄 그림: **A가 글 작성 → Supabase DB에 저장(insert) → DB가 "새 글 생겼어!"를 발행 → 그 표를 구독 중이던 B의 브라우저로 즉시 전달 → B 화면 맨 위에 새 글이 깜빡이며 등장**

> 비유: 방명록 표(table)를 **단톡방**이라고 생각하세요. Realtime을 켠다는 건 그 방의 **알림을 켜는 것**입니다. 누가 글을 올리면(메시지 전송) 방에 들어와 있는 모두에게 알림이 울려서, 굳이 방을 들락거리며 새로고침하지 않아도 새 글이 바로 보입니다. WebSocket 서버라는 "알림 배달부"는 Supabase가 대신 고용해 줍니다.

> 보안 메모 — 공개해도 되는 값 vs 절대 숨겨야 하는 값
> - **공개되어도 되는 값**: `index.html`에 적는 **프로젝트 URL**과 **anon(공개) 키**. 이건 "출입증"일 뿐이라 브라우저에 나가도 됩니다. 진짜 보호는 DB의 **RLS(행 수준 보안)**가 합니다.
> - **절대 노출하면 안 되는 비밀값**: **service_role 키**. 이 키는 RLS를 통째로 무시하므로(=모든 데이터에 무제한 접근) 페이지 코드나 깃에 절대 넣지 않습니다. 이 실습은 브라우저만 쓰므로 service_role 키가 **아예 필요 없습니다**.
> - 그래서 `.env.example`에는 자리표시자만 있고, 진짜 값을 적을 `.env`는 `.gitignore`로 깃에서 빠집니다.

## 목표
- **직접 서버 없이 실시간을 붙인다**: Supabase Realtime 구독으로, 새 글이 새로고침 없이 화면에 자동으로 뜨는 경험을 만든다.
- **구독(subscribe)의 흐름을 이해한다**: `채널 열기 → postgres_changes(INSERT) 구독 → 이벤트 콜백에서 화면 갱신`의 한 사이클을 직접 본다.
- **보호는 RLS로 한다는 원칙을 체득한다**: anon 키는 공개해도 되고, "누가 무엇을 할 수 있나"는 DB의 RLS 정책으로 막는다.
- **XSS를 피하는 출력 습관을 들인다**: 사용자가 남긴 글은 `innerHTML`이 아니라 `textContent`로 출력해 악성 태그가 실행되지 않게 한다.

## 따라하는 단계

### A. Supabase 프로젝트와 표 만들기
1. [supabase.com](https://supabase.com)에서 무료 프로젝트를 하나 만듭니다(기존 프로젝트가 있으면 그걸 써도 됩니다).
2. 왼쪽 메뉴에서 **SQL Editor**를 열고, 이 폴더의 `schema.sql` 내용을 **통째로 붙여넣고 Run**합니다.
   - 이 한 번으로 (1) `guestbook` 표, (2) RLS와 읽기/쓰기 정책, (3) Realtime 발행까지 모두 켜집니다.
   - 마지막 줄(`alter publication ... add table`)에서 "already member" 비슷한 메시지가 나와도 괜찮습니다. 이미 실시간이 켜져 있다는 뜻입니다.

### B. 내 키 넣기 (공개 키만 — 비밀 키 아님)
3. 왼쪽 메뉴 **Project Settings → API**로 가서 **Project URL**과 **anon public 키**를 복사합니다.
4. `index.html`을 열어 상단의 두 상수를 내 값으로 바꿉니다.
   - `SUPABASE_URL` = 내 Project URL
   - `SUPABASE_ANON_KEY` = 내 anon public 키
   - 주의: **service_role 키는 절대 넣지 마세요.** 여기엔 anon 키만 들어갑니다.

### C. 열어서 실시간 확인하기
5. `index.html`을 브라우저로 엽니다(더블클릭하거나, VS Code의 Live Server 등으로 열면 됩니다).
6. 상단 점이 **초록색**으로 바뀌고 "실시간 연결됨"이 뜨면 구독 성공입니다.
7. **창을 두 개** 띄웁니다(같은 파일을 새 창/새 탭으로 한 번 더 엽니다).
8. 한쪽 창에서 이름과 한마디를 적고 **남기기**를 누르면 — **다른 창에도 새로고침 없이** 그 글이 맨 위에 파랗게 깜빡이며 나타납니다. 이게 실시간 동기화입니다.

### D. (선택) 친구와 진짜로 동시에
9. `index.html`을 어디든 정적 호스팅(예: Vercel/Netlify에 드래그&드롭, 또는 GitHub Pages)에 올리고 주소를 친구에게 보냅니다. 서로 다른 컴퓨터에서 동시에 열어 글을 남기면 실시간으로 오가는 걸 함께 볼 수 있습니다.

## 🤖 바이브코딩 프롬프트
이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 비전공 초보를 돕는 웹개발 멘토야. Supabase를 백엔드로 쓰는 "실시간 방명록"을 만들 거야.
  먼저 뼈대부터 만들어 줘.
  - 산출물 1: schema.sql — Postgres에 guestbook 표(id, name, message, created_at)를 만들고,
    RLS(행 수준 보안)를 켠 뒤 "누구나 읽기 허용 / 누구나 쓰기 허용" 정책을 만들어 줘.
    그리고 이 표를 supabase_realtime 발행에 추가해서 실시간이 켜지게 해 줘.
    다시 실행해도 에러 안 나게 if not exists / drop policy if exists 를 써 줘.
  - 산출물 2: index.html — @supabase/supabase-js v2를 CDN으로 불러오고, 글 작성 폼과 글 목록을 보여줘.
    SUPABASE_URL과 anon 키는 파일 상단 상수로 두되, "anon은 공개돼도 되는 값, service_role은 절대 금지"라고 주석으로 명확히 적어 줘.
  제약: 코드만 주지 말고, 초보가 막힐 만한 줄에는 '무엇을 하는지 + 왜 그렇게 했는지'를 한국어 주석으로 한 줄씩 풀어 줘.
  ```

- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  좋아. 이제 실시간과 안전 처리를 더해 줘.
  1) Supabase Realtime 구독을 추가해 줘. db.channel(...).on('postgres_changes', { event:'INSERT', schema:'public', table:'guestbook' }, ...).subscribe(...) 형태로,
     새 글이 들어오면 새로고침 없이 목록 맨 위에 추가되게 해 줘.
  2) 같은 글이 두 번 그려지지 않게(첫 로딩분과 실시간 이벤트가 겹칠 때) id 기반 중복 방지를 넣어 줘.
  3) 새로 도착한 글은 1초 정도 배경색으로 깜빡이게 하고, 실시간 연결 상태(연결됨/끊김)를 화면에 작은 점으로 표시해 줘.
  4) ★보안★ 사용자가 입력한 name/message는 절대 innerHTML로 넣지 말고 textContent로 출력해서 XSS를 막아 줘. 왜 textContent를 쓰는지 주석으로 설명해 줘.
  5) 제출 버튼 중복 클릭 방지(저장 중 disabled)도 넣어 줘.
  바뀐 부분마다 '왜 이렇게 했는지'를 한국어 주석으로 남겨 줘.
  ```

- **막혔을 때(디버깅)** 프롬프트:
  ```text
  실시간이 동작하지 않아. 글을 남기면 같은 창에서 새로고침하면 보이는데, 다른 창에는 자동으로 안 떠.
  콘솔에는 이런 게 보여: [여기에 콘솔/네트워크 에러 메시지를 그대로 붙여넣기]
  비전공자도 알아듣게, 가능성이 높은 순서대로 원인과 점검 방법을 단계별로 알려 줘. 특히 아래를 체크해 줘:
  - schema.sql에서 'alter publication supabase_realtime add table public.guestbook' 가 실제로 실행됐는지(실시간 발행 누락)
  - Supabase 대시보드의 Realtime 설정이 켜져 있는지
  - RLS 읽기 정책이 없어서 실시간으로 흘러온 행이 막히는 건 아닌지(실시간 행도 RLS 통제를 받음)
  - .subscribe() 콜백의 status가 'SUBSCRIBED' 로 찍히는지(아니면 무슨 값인지)
  각 원인마다 '어디를 눌러 무엇을 확인하면 되는지'를 구체적으로 알려 줘.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다.

## 검증법
- **실시간 동기화 확인**: 창 두 개를 띄워 한쪽에서 글을 남기면, 다른 창에 **새로고침 없이** 글이 맨 위에 뜬다. (이게 핵심 검증.)
- **연결 상태 확인**: 페이지 상단 점이 **초록색** + "실시간 연결됨"으로 바뀌는지 본다. 빨강/회색이면 구독이 안 붙은 것이다.
- **중복 안 됨 확인**: 내가 글을 남겼을 때 내 화면에 그 글이 **딱 한 번만** 뜨는지 본다(두 번 뜨면 중복 방지가 안 된 것).
- **보안 출력 확인(XSS)**: 이름이나 메시지에 `<b>test</b>` 또는 `<script>alert(1)</script>`를 적어 본다. 굵은 글씨가 되거나 알림창이 뜨면 **위험(틀림)** — 글자 그대로 `<b>test</b>`로 보여야 정상이다(`textContent` 덕분).
- **anon 키만 노출되는지 확인**: 배포했다면 `Ctrl`+`U`(소스 보기)로 `index.html`을 열어 **service_role 키가 한 글자도 없는지** 확인한다. anon 키만 보여야 한다.
- **비밀값이 깃에 없는지 확인**: 이 폴더에서 아래를 실행해 **자리표시자만** 나오는지 본다.
  - `grep -nE "service_role|sb_secret" .env.example index.html` → 진짜 비밀 키가 안 나와야 정상(주석/자리표시자만).

## 파일 구성
- `index.html` — 실시간 방명록 페이지. anon 키만 넣고, 글 작성·목록·실시간 구독·연결 상태 표시를 모두 담았다. 사용자 입력은 `textContent`로 안전 출력.
- `schema.sql` — Supabase에서 한 번 실행하는 SQL. `guestbook` 표 + RLS 정책 + Realtime 발행을 켠다.
- `.env.example` — 필요한 값 견본(자리표시자만). 복사해 `.env`를 만들고 진짜 값은 거기에만 둔다. anon은 공개 가능, service_role은 비밀.
- `.gitignore` — `.env` 등 비밀 파일이 깃에 안 올라가게 막는다(`.env.example`은 추적 유지).

## 관련 가이드
- [12권 — 데이터베이스 심화 (관계·RLS·실시간)](../../docs/12-database-advanced/index.md)
- [12권 08 — Supabase/Postgres 심화: RLS·정책·함수·실시간](../../docs/12-database-advanced/08.md) — 이번 실습의 RLS와 Realtime 발행이 거기서 설명됩니다.
- 관련 실습: 실습 310 (WebSocket으로 실시간 채팅 만들기) — "직접 서버를 짜는 실시간"과 "Supabase가 대신 해주는 실시간"을 비교해 보세요.
- 관련 실습: 실습 03 (Supabase 방명록) — 실시간 없이 새로고침으로 읽던 방명록을, 이번에 실시간으로 업그레이드한 것입니다.
- Supabase Realtime 공식 문서(영문): https://supabase.com/docs/guides/realtime
- Supabase Row Level Security 공식 문서(영문): https://supabase.com/docs/guides/database/postgres/row-level-security
