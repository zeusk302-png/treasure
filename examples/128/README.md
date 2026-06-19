# 실습 128 — Realtime 구독으로 다른 사람 글이 실시간으로 뜨게 하기

117·123번까지는 방명록 글을 **불러오기(select)** 해서 보여 줬습니다.
그런데 지금까지는 **내가 직접 새로고침(F5)** 해야 새 글이 보였습니다.
다른 사람이 방금 글을 써도, 내 화면은 그대로니까요.

이번 128번의 핵심은 **`supabase.channel().on('postgres_changes')`** 로
`guestbook` 표에 글이 **추가(INSERT)되는 순간을 '구독'** 하는 것입니다.
그러면 **다른 브라우저(혹은 다른 사람)** 가 글을 쓰는 순간,
**내 화면에도 새로고침 없이 저절로** 새 글이 떠오릅니다.

```js
const channel = db
  .channel("guestbook-realtime")          // 실시간 '방송 채널'을 하나 연다
  .on("postgres_changes",
    { event: "INSERT", schema: "public", table: "guestbook" }, // guestbook에 새 글이 들어올 때만
    (payload) => {
      const newPost = payload.new;         // ← 방금 추가된 글 한 줄이 통째로 들어 있음
      listEl.prepend(makeRow(newPost));    // 목록 맨 위에 끼워 넣기
    })
  .subscribe();                            // 실제로 듣기 시작
```

> 비유: 지금까지는 "글 썼어? 그럼 네가 직접 새로고침해서 확인해" 방식이었습니다.
> Realtime 구독은 **"표에 새 글이 들어오면 서버가 나한테 '띵동!' 하고 알려 줘"** 를
> 미리 신청해 두는 것입니다. 그래서 내가 가만히 있어도 새 글이 저절로 떠요.

이 폴더에 있는 파일:

- `README.md` — 이 안내문
- `index.html` — 방명록 화면 (글쓰기 폼 + 글 목록 `ul#list` + **실시간 연결 표시등**)
- `script.js` — **핵심 코드.** select로 기존 글을 채운 뒤, `channel().on('postgres_changes')` 로 새 글을 실시간 수신합니다.

> ℹ️ 이 실습은 116·117·123번에서 만든 **`guestbook` 표를 그대로 씁니다.** 새 표를 따로 만들 필요는 없고, 그 표의 **Realtime만 켜 주면** 됩니다(아래 1단계).

## 목표

- `supabase.channel().on('postgres_changes', { event: 'INSERT' ... })` 로 **표의 변경 사건을 구독**한다.
- 새 글이 도착하면 콜백의 **`payload.new`** 안에 '방금 추가된 글 한 줄'이 통째로 들어온다는 것을 안다.
- 도착한 글을 **목록 맨 위에 끼워 넣어**(`prepend`), 전체를 다시 불러오지 않고도 화면을 실시간으로 갱신한다.
- 내가 쓴 글도 **insert만 하고 화면에 직접 그리지 않는다** — 구독이 '새 글'로 되돌려 주므로 한 번만 떠야 정상임을 이해한다.
- `.subscribe()` 가 알려 주는 **연결 상태(`SUBSCRIBED`/`CHANNEL_ERROR` 등)** 를 표시등으로 보여 준다.

## 따라하는 단계

1. **`guestbook` 표의 Realtime을 켠다.** (이번 실습에서 가장 중요한 준비)
   Supabase 대시보드 → **Table Editor → `guestbook` 표 선택 → 오른쪽 위 점 3개(⋮) 또는 Edit Table** 에서
   **Enable Realtime**(실시간) 옵션을 켭니다.
   (또는 **Database → Replication / Publications** 메뉴에서 `guestbook` 표를 publication에 추가합니다.)
   → 이걸 켜지 않으면 글을 써도 실시간으로 안 뜹니다. (직접 새로고침하면 보이긴 합니다.)
2. Supabase 대시보드 **Settings(톱니바퀴) → API** 에서 두 값을 복사한다.
   - **Project URL** : `https://xxxxxxxx.supabase.co` 형태의 주소 (비밀 아님)
   - **anon public** 키 (신형은 `sb_publishable_...` 로 시작) : 브라우저에 둬도 되는 **공개 출입증**
   - ⚠️ 같은 화면의 **`service_role` / `sb_secret_...` 키는 절대 쓰지 마세요.** 모든 보안을 무시하는 마스터 키입니다.
3. 이 폴더의 `script.js`를 열고, 맨 위 두 줄의 **자리표시자**를 내 값으로 바꾼다.
   ```js
   const SUPABASE_URL = "https://여기에-내-프로젝트-ID.supabase.co";        // ← 내 Project URL
   const SUPABASE_ANON_KEY = "sb_publishable_여기에-내-anon-공개키-붙여넣기"; // ← 내 anon public 키
   ```
4. `index.html`을 **브라우저로 연다.** (파일을 더블클릭)
   → 페이지가 열리면 기존 글을 한 번 불러와 채우고, 제목 옆 표시등이 **초록색 '실시간 연결됨'** 으로 바뀌면 구독 성공입니다.
5. **실시간을 눈으로 체험한다.** 이 페이지를 **두 개의 창(또는 탭)** 으로 동시에 연다.
6. 한쪽 창에서 이름·메시지를 적고 **[글 남기기]** 를 누른다.
   → **다른 쪽 창**에 새로고침을 안 했는데도 그 글이 **저절로 맨 위에 (잠깐 초록 테두리로) 뜨면** 성공입니다.
7. (이해 점검) 글을 쓴 창에서도 글이 **딱 한 번만** 뜨는지 확인한다.
   `script.js`의 폼 처리는 **insert만** 하고 화면에 직접 그리지 않습니다. 화면 표시는 **구독이 대신** 해 줍니다.

## 🤖 바이브코딩 프롬프트

이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다. 순서대로 시키세요.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 웹 초보를 돕는 친절한 코딩 조수야. Supabase를 쓰는 '실시간 방명록' 한 페이지를
  index.html + script.js 두 파일로만 만들어 줘. (CDN으로 supabase-js를 불러오고, 빌드 도구는 쓰지 마.)

  먼저 select로 기존 글을 불러오는 기본형부터:
  - guestbook 표(컬럼: name, message, created_at)에서 created_at 최신순으로 글을 select해서
    화면의 <ul id="list">에 한 줄씩 보여 줘.
  - 글쓰기 폼(이름 input, 메시지 textarea, 보내기 버튼)으로 insert도 되게 해 줘.
  - SUPABASE_URL과 SUPABASE_ANON_KEY는 코드 맨 위에 '자리표시자'로 두고,
    내가 내 값으로 바꿔 넣으라고 주석으로 안내해 줘. (anon 키는 공개돼도 되는 키라고도 적어 줘.)
  - 사용자 입력은 textContent로 출력해서 XSS를 막아 줘.
  ```

- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  좋아. 이제 이 방명록을 '실시간'으로 만들어 줘. 핵심은 새로고침 없이 다른 사람 글이 뜨는 거야.
  - supabase.channel(...).on('postgres_changes', { event:'INSERT', schema:'public', table:'guestbook' }, ...)
    로 새 글 INSERT 사건을 구독하고, payload.new를 목록 맨 위에 prepend 해 줘.
  - 내가 쓴 글도 구독으로 되돌아오니까, 폼 제출 시에는 insert만 하고 화면에 직접 그리지는 마.
    (그래야 글이 두 번 안 뜨고 딱 한 번 떠.)
  - .subscribe((status)=>) 의 연결 상태(SUBSCRIBED/CHANNEL_ERROR 등)를 받아서
    제목 옆에 초록/빨강 표시등으로 보여 줘.
  - 방금 도착한 새 글에는 잠깐 초록 테두리(fresh) 효과를 줘서 눈에 띄게 해 줘.
  ```

- **막혔을 때(디버깅)** 프롬프트:
  ```text
  글을 써도 다른 창에 실시간으로 안 떠. 콘솔에 이런 게 찍혀: (여기에 콘솔 메시지/표시등 색을 붙여넣기)
  비전공자도 알아듣게 가능한 원인을 하나씩 짚어 줘. 특히
  (1) Supabase 대시보드에서 guestbook 표의 Realtime(publication)을 켰는지,
  (2) anon 키를 service_role 키와 헷갈려 넣지 않았는지,
  (3) SUPABASE_URL이 자리표시자 그대로는 아닌지
  를 순서대로 확인하는 방법을 알려 줘.
  ```

> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 훨씬 좋습니다.

## 검증법

- 페이지를 열면 제목 옆 표시등이 **초록 '실시간 연결됨'** 으로 바뀌는가? (구독 성공의 증거)
- 두 창을 띄워 한쪽에서 글을 쓰면, **다른 쪽 창에 새로고침 없이** 그 글이 맨 위에 뜨는가? (이번 실습의 핵심)
- 새로 도착한 글에 **잠깐 초록 테두리(`fresh`)** 가 보였다가 사라지는가?
- 글을 쓴 창에서도 글이 **중복 없이 한 번만** 뜨는가? (insert는 한 번, 화면 표시는 구독이 처리)
- 브라우저 **개발자 도구 → Console**(윈도우 `F12`, 맥 `Cmd + Option + I`)에
  `🔌 구독 상태: SUBSCRIBED` 와, 글이 올 때마다 `📡 실시간 새 글 도착:` 로그가 찍히는가?
- **실패할 때 원인 찾기** (표시등 색·콘솔 메시지로 구분):
  - 표시등이 **빨강 '연결 오류 (Realtime 켰는지 확인)'** → **1단계**에서 `guestbook` 표의 Realtime을 안 켰을 가능성이 큽니다.
  - **표시등은 초록인데 다른 창에 글이 안 뜬다** → 역시 표의 Realtime(publication)이 꺼져 있는지 다시 확인하세요.
  - `아직 내 프로젝트 값이 입력되지 않았어요` → **3단계**에서 자리표시자를 안 바꿈.
  - `relation "public.guestbook" does not exist` → 표가 없음. 116·117·123 폴더의 `schema.sql`로 먼저 표를 만드세요.
  - `Invalid API key` → anon 키를 잘못 붙여넣음. (혹시 service_role을 넣지 않았는지도 확인)
  - 주소 오류 / `Failed to fetch` → `SUPABASE_URL`의 철자나 `https://` 확인.
- **(안전 점검)** `script.js`에 넣은 키가 **`anon` / `sb_publishable_`** 로 시작하는가? `service_role` / `sb_secret_` 가 **아닌가?**

## 다음 단계

- 직전 단계(글 목록을 최신순으로 정렬해서 불러오기) → [실습 123](../123/)
- 글 불러오기(select)의 기초 → [실습 117](../117/)
- 완성형 예제가 궁금하면 → [실습 03 — Supabase 방명록](../03-supabase-guestbook/)

## 관련 가이드

- [공개해도 되는 키 vs 절대 숨길 키 — anon/publishable vs service_role/secret](../../docs/04-security/01.md) — `script.js`에 어떤 키를 넣어야 안전한지
- [RLS(행 수준 보안) — 출입증을 공개해도 안전한 진짜 이유](../../docs/04-security/02.md) — anon 키로 실시간 구독을 해도 안전한 근거
- [API가 뭔가 — 주방에 음식을 주문하는 창구](../../docs/02-web-basics/04.md) — 서버가 새 글을 '띵동!' 하고 알려 주는 실시간 통신의 큰 그림
- [실습 — 직접 따라 만들기](../../docs/practice/index.md)
