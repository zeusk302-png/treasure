# 실습 261 — 게시판에 댓글과 좋아요(공감) 기능 추가하기

게시판의 글 하나에 **댓글 여러 개**를 매달고(1:N 관계), 글마다 **좋아요(공감) 수**를 올려 화면에 보여 줍니다. 글과 댓글을 **외래키**로 묶고, 좋아요는 데이터베이스 안에서 안전하게 **+1 카운트**하는 함수로 처리합니다. "관계형 데이터(여러 표를 연결)"와 "집계 표시(숫자 세기)"를 한 번에 익히는 실습입니다.

> 한 줄 그림: **글쓴이가 글 올림 → 다른 사람이 그 글에 댓글 N개 달기(1:N) → 좋아요 버튼 누르면 like_count가 +1 → 화면에 "댓글 3개 · 좋아요 12" 표시**

> 비유: 글 한 편은 **게시판에 붙인 종이 한 장**이고, 댓글은 그 종이 아래에 줄줄이 붙는 **포스트잇**입니다. 포스트잇마다 "나는 몇 번 종이에 붙은 거야"라는 꼬리표(외래키 `post_id`)가 달려 있어, 종이를 떼면 그 포스트잇들도 같이 따라옵니다. 좋아요는 종이 귀퉁이의 **계수기 숫자**라서, 누를 때마다 1씩 올라갑니다.

> 보안 메모 — 공개해도 되는 값 vs 절대 숨겨야 하는 값
> - **공개되어도 되는 값**: Supabase **anon 키(공개 키, `sb_publishable_...`)**. 브라우저·`script.js`·깃허브에 올라가도 안전합니다. 이 키로 할 수 있는 일은 **RLS(행 수준 보안) 정책이 허락한 것만**이기 때문입니다. 이번 실습에선 "읽기 / 글쓰기 / 댓글 달기 / 좋아요 +1"만 허락하고, 댓글 수정·삭제는 막아 두었습니다.
> - **절대 노출하면 안 되는 비밀값**: **service_role 키(`sb_secret_...`)**. 이건 RLS 자체를 통째로 **우회하는 마스터 키**라, 정책이 뭐든 무시하고 다 됩니다. 그래서 브라우저·코드·깃허브에 **절대** 올리지 말고, 서버(n8n·백엔드)에만 비밀로 둡니다.
> - **사용자 입력 출력은 `textContent`로**: 누가 댓글에 `<script>`를 적어 넣어도 실행되지 않도록, 댓글·제목·내용을 화면에 그릴 때는 `innerHTML`이 아니라 **`textContent`/`createTextNode`**로 넣습니다(`innerHTML`은 XSS 위험).

## 목표
- **1:N 관계를 만든다**: `posts`(글) 1개에 `comments`(댓글) N개가 매달리도록, 댓글 표에 **외래키 `post_id`**를 두어 "이 댓글은 몇 번 글 소속"인지 가리키게 한다.
- **외래키의 효과를 이해한다**: `references public.posts(id)`로 실제 있는 글만 가리킬 수 있게 하고, `on delete cascade`로 글이 지워지면 그 댓글도 자동으로 같이 지워지게 한다.
- **좋아요를 안전하게 센다**: 좋아요 +1을 브라우저에서 "읽고-더하고-쓰기" 따로 하지 않고, DB 함수 `increment_like()`로 **`like_count = like_count + 1` 한 줄**에 처리해 동시 클릭에도 숫자가 새지 않게 한다.
- **RLS로 권한을 통제한다**: 두 표 모두 RLS를 켜고, "누구나 읽기·글쓰기·댓글·좋아요"만 허락하며 댓글 수정·삭제는 일부러 막아, anon(공개) 키로 할 수 있는 일을 정확히 제한한다.

## 따라하는 단계

### A. 데이터베이스 표 만들기 (Supabase)
1. Supabase 대시보드 왼쪽 메뉴에서 **SQL Editor > New query**를 엽니다.
2. 이 폴더의 `schema.sql` 내용을 **통째로 붙여넣고** 오른쪽 위 **Run** 버튼을 누릅니다. 이 한 번으로 아래가 모두 만들어집니다.
   - `posts` 표(좋아요 수를 담는 `like_count` 칸 포함)
   - `comments` 표(외래키 `post_id` + 조회 속도를 위한 인덱스)
   - 좋아요 +1 함수 `increment_like(target_id)`
   - 두 표의 **RLS 켜기 + 정책**(읽기/글쓰기/댓글/좋아요 허용, 댓글 수정·삭제 차단)
   - 확인용 샘플 글 1개(글이 하나도 없을 때만 들어감)
3. 에러 없이 "Success"가 뜨면, 왼쪽 **Table editor**에서 `posts`·`comments` 두 표가 생겼는지 눈으로 확인합니다.

### B. 화면에 연결하기 (`script.js`)
4. Supabase 대시보드 **Project Settings > API**에서 **Project URL**과 **anon 공개 키**를 복사합니다. (anon 키는 공개 가능한 값이라 화면 코드에 둬도 됩니다.)
5. 같은 폴더에 `script.js`를 만들어, 그 URL·anon 키로 Supabase 클라이언트를 만들고 아래 동작을 연결합니다. (이 부분은 아래 **바이브코딩 프롬프트**로 AI에게 시켜 만드는 것을 권장합니다.)
   - 글 목록 불러와 그리기: `posts`를 최신순으로 읽어 `#postList`에 카드로 그립니다. 카드마다 **좋아요 버튼(현재 수 표시)** 과 **댓글 영역**을 함께 그립니다.
   - 새 글 올리기: `#postForm` 제출 시 `posts`에 `insert`.
   - 댓글 달기: 각 글의 댓글 입력 줄 제출 시 `comments`에 `post_id`와 함께 `insert`, 그 글 댓글만 다시 그리기.
   - 좋아요 누르기: 좋아요 버튼 클릭 시 `supabase.rpc('increment_like', { target_id })`를 호출하고, 돌려받은 새 숫자로 화면을 갱신.
6. `index.html`을 브라우저에서 엽니다(또는 배포합니다). `index.html`은 Supabase 라이브러리(CDN)를 먼저 불러온 뒤 `script.js`를 불러오므로, **순서를 바꾸면 "supabase is not defined" 오류**가 납니다.

### C. 직접 써 보기
7. 글을 하나 올리고, 그 글에 댓글을 2~3개 달아 봅니다. 같은 글 아래 댓글이 쌓이면 1:N이 동작하는 것입니다.
8. 좋아요 버튼을 여러 번 눌러 숫자가 올라가는지 봅니다. 새로고침해도 숫자가 유지되면 DB에 저장된 것입니다.

## 🤖 바이브코딩 프롬프트
이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다. 한 단계씩 시키고, 결과가 옳은지(특히 1:N 연결과 보안)를 직접 확인하세요.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 비전공자를 돕는 웹/DB 멘토야. Supabase를 쓰는 '댓글+좋아요 게시판'을 만들어 줘.
  먼저 SQL 스키마(schema.sql)부터 만들어 줘.
  - posts 표: id, title, body, like_count(정수, 기본값 0), created_at.
  - comments 표: id, post_id(외래키 → posts.id, on delete cascade), author, content, created_at.
    post_id에는 조회용 인덱스도 걸어 줘.
  - 좋아요를 안전하게 +1 하는 SQL 함수 increment_like(target_id)도 만들어 줘.
    (브라우저에서 읽고-더하고-쓰기 하지 말고, DB 안에서 like_count = like_count + 1 한 줄로 처리)
  - 두 표 모두 RLS를 켜고, anon/authenticated에게 '읽기/글쓰기/댓글/좋아요(update)'만 허용,
    댓글 수정·삭제 정책은 만들지 마(=기본 거절로 막히게).
  코드만 주지 말고, 외래키가 왜 필요한지·on delete cascade가 무슨 뜻인지·왜 함수로 +1 하는지를
  비전공자가 이해하게 한 줄씩 주석으로 풀어서 설명해 줘.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  위 스키마에 연결되는 화면 동작 script.js를 만들어 줘. Supabase JS v2 (CDN)를 쓴다고 가정해.
  - Supabase URL과 anon(공개) 키로 클라이언트를 만들어. (anon 키는 공개 가능하니 코드에 둬도 됨)
  - 글 목록을 최신순으로 읽어 #postList에 카드로 그려 줘. 카드마다 '좋아요 버튼(현재 수 표시)'과
    그 글의 댓글 목록 + 댓글 입력 줄을 같이 그려 줘.
  - #postForm 제출 → posts에 insert. 댓글 입력 제출 → comments에 post_id 포함해서 insert.
  - 좋아요 버튼 클릭 → supabase.rpc('increment_like', { target_id: 글id }) 호출하고
    돌려받은 새 숫자로 화면만 갱신해 줘.
  보안: 사용자가 입력한 제목/내용/댓글을 화면에 그릴 때 innerHTML 말고 textContent(또는
  createTextNode)로 넣어 줘. 그래야 누가 <script>를 댓글에 적어도 실행 안 되고 XSS를 막을 수 있어.
  왜 textContent를 쓰는지 주석으로 한 줄 설명도 붙여 줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  댓글이나 좋아요가 화면에 반영이 안 돼. 아래 정보로 단계별로 원인을 찾아 줘.
  - 브라우저 콘솔(F12)에 뜬 에러 전문: (여기에 붙여넣기)
  - 어떤 동작이 안 되는지: (예: 좋아요 눌러도 숫자 그대로 / 댓글 insert가 401·permission denied)
  흔한 원인부터 순서대로 점검해 줘:
  (1) script.js를 Supabase 라이브러리보다 먼저 불러와서 supabase is not defined가 나는지,
  (2) comments.insert에 post_id를 안 넣어서 외래키 제약에 걸리는지,
  (3) RLS 정책이 없어서(또는 update 정책 누락으로) 좋아요/댓글이 막히는지,
  (4) rpc 함수 이름('increment_like')이나 인자명(target_id)이 schema.sql과 다른지.
  고친 부분은 왜 그게 원인이었는지 한 줄씩 풀어서 설명해 줘.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다.

## 검증법
- **1:N 동작 확인**: 한 글에 댓글을 여러 개 달았을 때, 그 댓글들이 모두 **그 글 아래에만** 모이는지 본다. 다른 글로 새는 댓글이 없어야 정상이다.
- **외래키(cascade) 확인**: Supabase **Table editor**에서 글 한 줄을 지워 보면, 그 글에 달렸던 댓글도 `comments` 표에서 **자동으로 같이 사라지는지** 확인한다(`on delete cascade`).
- **좋아요 카운트 확인**: 좋아요 버튼을 누른 뒤 화면 숫자가 +1 되고, **새로고침해도 그 숫자가 유지**되는지 본다(=DB에 저장됨). Table editor에서 `posts.like_count` 값과도 일치하는지 비교한다.
- **권한(RLS) 확인**: anon 키로는 **남의 댓글을 수정·삭제할 수 없어야** 한다. (콘솔에서 `comments`를 `update`/`delete` 시도하면 막히는 게 정상.)
- **보안(입력 출력) 확인**: 댓글에 `<b>굵게</b>`나 `<script>alert(1)</script>` 같은 태그를 그대로 적어 보낸 뒤, 화면에 **태그가 글자 그대로 보이고 실행되지 않는지** 확인한다(=`textContent`로 안전하게 출력 중).
- **비밀값이 코드에 없는지 확인**: 배포된 페이지에서 소스 보기(`Ctrl`+`U`)로 **service_role 키(`sb_secret_...`)가 한 글자도 없는지** 본다. anon 키만 보여야 정상이다.

## 파일 구성
- `schema.sql` — Supabase에 붙여넣어 실행할 SQL. `posts`·`comments` 표(외래키 1:N), 좋아요 +1 함수 `increment_like()`, RLS 켜기와 정책(읽기/글쓰기/댓글/좋아요 허용, 댓글 수정·삭제 차단)을 한 번에 만든다.
- `index.html` — 게시판 화면의 뼈대. 글쓰기 폼과 글 목록 자리만 잡아 두고, 실제 데이터는 `script.js`가 채운다. Supabase 라이브러리(CDN)를 먼저, `script.js`를 그다음에 불러온다.
- `style.css` — 카드·좋아요 버튼·댓글 영역의 최소 디자인.
- `script.js` — (직접/AI로 추가) Supabase에 연결해 글·댓글을 읽고 쓰고, 좋아요를 `rpc('increment_like')`로 올린다. anon(공개) 키만 사용한다.

## 관련 가이드
- [12권 — 데이터베이스 심화 (관계·외래키·인덱스·SQL·RLS)](../../docs/12-database-advanced/index.md)
- [12권 01 — 관계형 모델 (테이블·행·열·관계로 1:N 이해하기)](../../docs/12-database-advanced/01.md)
- [12권 08 — Supabase/Postgres 심화 (RLS·정책·함수·실시간)](../../docs/12-database-advanced/08.md)
- Supabase 외래키/관계 문서(영문): https://supabase.com/docs/guides/database/tables
- Supabase RLS(행 수준 보안) 문서(영문): https://supabase.com/docs/guides/database/postgres/row-level-security
