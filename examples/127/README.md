# 실습 127 — 가계부를 Supabase로 옮기고 분류별 합계 집계하기

브라우저에만 저장하던 가계부를 **Supabase 데이터베이스(`expenses` 표)**로 옮기고, 받아온 지출 목록을 화면에서 **분류별 합계**로 묶어 보여 줍니다. 여기에 **월별 필터**(날짜 범위)를 더해, "이번 달 식비는 얼마인지"를 골라 보는 진짜 가계부를 완성합니다. 이번 실습의 두 무기는 **날짜 범위 필터(`gte`/`lte`)**와 **집계(`reduce`)**입니다.

> 한 줄 그림: **월 선택(2026-06) → 서버에 "그 달 1일~말일 줄만 줘"(`gte`/`lte`) → 받은 목록을 브라우저가 분류별로 더해(`reduce`) → 식비 11,000원 / 교통 1,400원 카드로 표시**

> 비유: 서버(Supabase)는 **창고 직원**입니다. "6월에 산 영수증만 한 묶음 꺼내 줘"라고 날짜로 범위를 찍어 부탁하는 게 `gte`/`lte`입니다. 그렇게 받은 영수증 더미를 책상에서 **식비끼리, 교통끼리 쌓아 합을 내는 일**은 직원이 아니라 내(브라우저)가 합니다. 그 '쌓아 더하기'가 `reduce`입니다.

> 보안 메모 — 공개해도 되는 값 vs 절대 숨겨야 하는 값
> - **공개해도 되는 값**: `SUPABASE_URL`(내 DB 인터넷 주소)과 **anon 키**(`sb_publishable_...`, 공개 키)입니다. 브라우저에 박히고 깃허브에 올라가도 안전합니다. 이 키는 **RLS(행 수준 보안) 정책의 통제**를 받기 때문입니다. 이번 `script.js`에는 **반드시 anon 키만** 넣습니다.
> - **절대 숨겨야 하는 값**: **service_role 키**(`sb_secret_...`)입니다. 이건 RLS를 통째로 우회하는 **마스터 키**라, 브라우저·코드·깃허브에 올리면 누구나 표 전체를 지우거나 훔칠 수 있습니다. 서버(또는 n8n 같은 백엔드)에서만 비밀로 씁니다.
> - 즉, "anon = 비밀키"는 **틀린 설명**입니다. anon 키는 공개해도 되고, 보호는 키를 숨기는 게 아니라 **RLS 정책**으로 합니다(`schema.sql`이 그 정책을 켭니다).

## 목표
- **데이터를 DB로 옮긴다**: 지출 내역을 `expenses` 표(`item`·`category`·`amount`·`spent_on`)에 `insert`로 쌓고 `select`로 받아온다.
- **날짜 범위 필터를 익힌다**: `.gte('spent_on', 시작일).lte('spent_on', 끝일)`로 선택한 달 1일~말일 사이 줄만 받아온다. `gte`=크거나 같다(>=), `lte`=작거나 같다(<=).
- **집계 감각을 익힌다**: 서버는 '목록'만 주고, 분류별로 합치는 건 브라우저가 `reduce`로 한다(`{ 식비: 11000, 교통: 1400 }`).
- **보안 원칙을 지킨다**: 코드엔 anon(공개) 키만 넣고, service_role은 절대 넣지 않으며, 보호는 RLS 정책으로 한다.

## 따라하는 단계

### A. 표·보안·정책 만들기 (`schema.sql`)
1. Supabase 대시보드 왼쪽 메뉴에서 **SQL Editor → New query**를 엽니다.
2. 이 폴더의 `schema.sql` 내용을 **통째로 붙여넣고** 오른쪽 위 **Run**을 누릅니다. 한 번에 네 가지가 실행됩니다.
   - 1단계: `expenses` 표 생성(`amount`는 `check (amount > 0)`로 0 이하를 막고, `spent_on`은 날짜만 저장).
   - 2단계: **RLS(행 수준 보안) 켜기** — 켜면 정책이 허락한 동작만 가능해집니다(기본은 전부 거절).
   - 3단계: **읽기/쓰기 정책** 추가(연습용이라 누구나 `select`·`insert` 허용). 실제 서비스라면 '로그인한 본인 줄만'으로 더 좁힙니다.
   - 4단계: 이번 달/지난 달에 골고루 깔린 **예시 지출 6건**을 넣어, 월별 필터를 바로 체험하게 합니다(이미 데이터가 있으면 건너뜀 — 여러 번 Run 해도 안전).

### B. 내 프로젝트 값 넣기 (`script.js`)
3. Supabase 대시보드의 **Settings → API**에서 **Project URL**과 **anon public 키**를 복사합니다.
4. `script.js` 맨 위 두 줄의 자리표시자를 내 진짜 값으로 바꿉니다.
   - `SUPABASE_URL` → 내 Project URL
   - `SUPABASE_ANON_KEY` → 내 **anon(공개) 키**(`sb_publishable_...`). service_role(`sb_secret_...`)을 넣으면 안 됩니다.
   - 자리표시자를 안 바꾸면 페이지가 빨간 안내("아직 내 프로젝트 값이 입력되지 않았어요")를 띄우게 만들어 뒀습니다.

### C. 열어 보고 써 보기 (`index.html`)
5. `index.html`을 브라우저로 엽니다. 페이지가 열리면 자동으로 **이번 달** 지출을 불러와 분류별 합계 카드와 목록을 그립니다.
6. **월 선택** 칸(`input[type=month]`)을 지난 달로 바꿔 봅니다. 그 달치만 다시 받아와(`gte`/`lte`) 합계가 갱신됩니다.
7. **지출 추가 폼**에 내용·금액·분류·날짜를 넣고 **지출 추가**를 누릅니다. 서버에 `insert`된 뒤, 화면이 그 지출의 달로 맞춰져 다시 불러옵니다.

## 🤖 바이브코딩 프롬프트
이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다. 한 단계씩 시키고, 결과가 옳은지(특히 anon 키만 들어갔는지, 집계가 맞는지)를 직접 확인하세요.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 비전공자를 돕는 웹/DB 멘토야. Supabase로 동작하는 '가계부' 데모를 만들어 줘.
  산출물 3개: schema.sql, index.html, script.js.
  (1) schema.sql:
      - expenses 표를 만들어 줘. 칼럼: id(자동 증가 PK), item(text, not null),
        category(text, not null), amount(integer, 0보다 커야 함 — check 제약),
        spent_on(date, 기본값 오늘), created_at(timestamptz, 기본값 now()).
      - RLS(행 수준 보안)를 켜고, 연습용이라 anon/authenticated 모두에게
        select·insert를 허용하는 정책을 만들어 줘(여러 번 실행해도 되게 drop policy if exists 포함).
      - 이번 달/지난 달에 골고루 깔린 예시 지출 몇 건을 넣되, 이미 데이터가 있으면 건너뛰게 해 줘.
  (2) index.html: 월 선택(input[type=month]), 지출 추가 폼(내용/금액/분류 select/날짜),
      '분류별 합계' 카드 영역, '지출 내역' 목록 영역을 가진 깔끔한 한 페이지. CSS는 한 파일 안에.
  (3) script.js: supabase-js로 연결하고, 선택한 달의 지출만 받아와 목록과 분류별 합계를 그려.
  제약: script.js에는 anon(공개) 키만 넣는 '자리표시자'를 두고, service_role 키는 절대 쓰지 마.
        왜 anon 키는 공개해도 되고 service_role은 안 되는지(보호는 RLS로 한다는 점)를 주석으로 설명해 줘.
  코드만 주지 말고 초보가 막힐 지점에 '왜 그렇게 했는지' 주석을 한국어로 달아 줘.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  위 가계부에 '날짜 범위 필터'와 '분류별 집계'를 정확히 넣어 줘.
  - 월 선택 값("2026-06")에서 그 달의 1일과 말일을 계산하는 함수를 만들고,
    select에 .gte('spent_on', 시작일).lte('spent_on', 끝일)을 붙여 그 달치만 받아오게 해 줘.
    (말일 계산은 new Date(year, month, 0).getDate() 트릭을 쓰고 왜 되는지 주석으로 설명.)
  - 받은 목록을 reduce로 돌며 { 분류: 합계 } 객체를 만들어 분류별 합계 카드를 그려 줘.
    합계가 큰 분류부터 정렬하고, 맨 아래에 '이 달 전체 합계'도 보여 줘.
  - 금액은 toLocaleString('ko-KR')로 11000 → "11,000원"처럼 표시해 줘.
  - 사용자가 적은 item을 화면에 넣을 때는 innerHTML이 아니라 textContent로 넣어
    (사용자 입력 안의 <script>가 실행되는 XSS를 막기 위해) — 그 이유도 주석으로 적어 줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  Supabase 가계부가 안 떠. 단계별로 원인을 찾아 줘. (콘솔 F12 → Console 탭 에러를 같이 볼게.)
  - 화면 상태 박스 / 콘솔에 뜬 에러 메시지 전문: (여기에 붙여넣기)
  가장 흔한 순서로 점검해 줘:
  (1) "relation \"expenses\" does not exist" → schema.sql 1단계(표 만들기)를 안 돌린 것인지,
  (2) "row-level security" 위반 → RLS는 켰는데 정책(3단계)을 안 만든 것인지,
  (3) "Invalid API key" → script.js의 SUPABASE_ANON_KEY가 anon 키가 맞는지(혹시 service_role?),
  (4) 합계가 이상함 → reduce에서 amount를 문자열로 더해 "65004500"처럼 이어붙는지(Number로 변환했는지),
  (5) 월을 바꿔도 안 바뀜 → monthPicker change 이벤트가 loadMonth에 연결됐는지.
  고친 부분은 왜 그게 원인이었는지 한 줄씩 풀어서 설명해 줘.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다.

## 검증법
- **표·정책이 만들어졌는지**: Supabase 대시보드의 **Table Editor**에 `expenses` 표가 보이고 예시 6건이 들어 있는지 확인합니다. **Authentication → Policies**(또는 표의 RLS 설정)에서 읽기·쓰기 정책 2개가 보이면 정상입니다.
- **월별 필터가 듣는지**: 월 선택을 **이번 달 ↔ 지난 달**로 바꿔 가며 목록과 합계가 **달마다 다르게** 나오는지 봅니다(예시 데이터는 이번 달 5건, 지난 달 1건). 콘솔(F12)에 `✅ 2026-06 지출 N건` 로그가 찍힙니다.
- **집계가 맞는지**: 한 분류(예: 식비)의 카드 합계가, 목록에서 그 분류 줄들의 금액을 손으로 더한 값과 같은지 확인합니다. 맨 아래 '이 달 전체 합계'도 카드 합계들의 합과 같아야 합니다.
- **추가가 반영되는지**: 폼으로 지출 하나를 추가하면 "지출이 추가됐어요!"가 뜨고, 화면이 그 지출의 달로 맞춰져 목록·합계에 바로 반영되는지 봅니다.
- **anon 키만 들어갔는지(보안)**: `script.js`의 키가 `sb_publishable_...`(공개)로 시작하는지 확인합니다. `sb_secret_...`(service_role)이 들어 있으면 **즉시 빼고 키를 재발급**해야 합니다. 이 폴더에서 아래로 점검할 수 있습니다.
  - `grep -nE "sb_secret_|service_role" script.js` → **아무것도 안 나와야** 정상입니다.

## 파일 구성
- `schema.sql` — `expenses` 표 생성 + RLS 켜기 + 읽기/쓰기 정책 + 예시 데이터. Supabase SQL Editor에 붙여넣어 Run.
- `index.html` — 가계부 화면(틀). 월 선택·추가 폼·분류별 합계 카드·지출 목록 영역과 CSS. 데이터 처리는 `script.js`가 함.
- `script.js` — Supabase 연결, `gte`/`lte` 월별 필터로 목록 받기, `reduce`로 분류별 합계 계산, `insert`로 지출 추가. 맨 위 `SUPABASE_URL`·`SUPABASE_ANON_KEY`만 내 anon 값으로 교체.

## 관련 가이드
- [12권 — 데이터베이스 심화 (관계·인덱스·SQL·RLS)](../../docs/12-database-advanced/index.md)
- [12권 08 — Supabase/Postgres 심화 (RLS·정책·함수·실시간)](../../docs/12-database-advanced/08.md)
- [12권 05 — SQL 실전 (SELECT·집계 — 이번 합계의 SQL 쪽 사촌)](../../docs/12-database-advanced/05.md)
- 관련 실습: 앞선 할 일/방명록 실습에서 배운 `insert`·`select`·`order`·`ilike` 위에, 이번에 날짜 범위 필터(`gte`/`lte`)와 집계(`reduce`)를 얹습니다.
- Supabase JS 쿼리 필터 문서(영문): https://supabase.com/docs/reference/javascript/using-filters
- Supabase RLS(행 수준 보안) 문서(영문): https://supabase.com/docs/guides/database/postgres/row-level-security
