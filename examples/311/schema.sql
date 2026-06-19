-- =============================================================
-- 무엇: 실시간 방명록이 쓸 Supabase(Postgres) 테이블 + 보안 규칙 + 실시간 켜기.
-- 왜: 직접 서버를 안 짜도, 이 SQL 한 번으로 (1) 글을 저장할 표,
--     (2) "누가 무엇을 할 수 있나"를 DB 안에서 막는 RLS,
--     (3) 새 글이 들어오면 화면으로 밀어주는 Realtime 발행까지 한꺼번에 켜진다.
-- 어디서 실행: Supabase 대시보드 → 왼쪽 메뉴 SQL Editor → 새 쿼리에 붙여넣고 Run.
-- =============================================================

-- 1) 방명록 글을 담을 표(table)를 만든다.
--    "if not exists"를 붙인 이유: 이미 만들었을 때 다시 돌려도 에러 없이 넘어가게 하려고.
create table if not exists public.guestbook (
  id          bigint generated always as identity primary key,  -- 글마다 자동으로 붙는 고유 번호(직접 안 적어도 됨)
  name        text not null,                                    -- 글쓴이 이름(필수)
  message     text not null,                                    -- 한마디 내용(필수)
  created_at  timestamptz not null default now()                -- 작성 시각(안 적으면 '지금'이 자동으로 들어감)
);

-- 2) 최신 글부터 빨리 찾도록 작성 시각에 인덱스를 건다.
--    왜: 글이 많아져도 "최신순 정렬"이 느려지지 않게 미리 색인을 둔다.
create index if not exists guestbook_created_at_idx
  on public.guestbook (created_at desc);

-- 3) RLS(Row Level Security, 행 수준 보안)를 켠다. ★가장 중요★
--    왜: RLS를 켜면 "정책(policy)으로 허락한 것만" 통과한다(기본은 전부 차단).
--    anon 키는 공개돼도 되는 '출입증'일 뿐, 진짜 보호는 여기 RLS가 한다.
alter table public.guestbook enable row level security;

-- 4) 정책 ① 누구나 "읽기"는 허용 (방명록은 모두에게 공개되는 게시판이므로)
--    drop ... if exists 를 먼저 한 이유: 다시 실행해도 "이미 있다" 에러가 안 나게 하려고.
drop policy if exists "guestbook read for all" on public.guestbook;
create policy "guestbook read for all"
  on public.guestbook
  for select          -- select = 읽기
  to anon, authenticated
  using (true);       -- using(true) = 모든 행을 읽도록 허용

-- 5) 정책 ② 누구나 "쓰기(새 글 작성)"는 허용 (로그인 없이 글 남기는 방명록이므로)
--    주의: 운영 사이트라면 보통 글자 수 제한·도배 방지를 추가한다.
--    아래는 "이름과 메시지가 비어 있지 않고, 너무 길지 않을 때만" 허락하는 안전장치 예시.
drop policy if exists "guestbook insert for all" on public.guestbook;
create policy "guestbook insert for all"
  on public.guestbook
  for insert          -- insert = 새 글 추가
  to anon, authenticated
  with check (        -- with check = "추가하려는 값"이 이 조건을 만족할 때만 허용
    length(name) between 1 and 30
    and length(message) between 1 and 500
  );

-- ※ 일부러 update/delete 정책은 안 만들었다.
--   왜: 정책이 없으면 RLS가 기본으로 막으므로, anon 키로는 남의 글을 고치거나 지울 수 없다.
--   "보호는 RLS로 한다"는 원칙을 그대로 보여주는 부분.

-- 6) Realtime(실시간) 발행을 켠다. ★이게 있어야 새 글이 화면으로 자동으로 밀려온다★
--    왜: Supabase는 "supabase_realtime"이라는 발행 채널에 등록된 표의 변경만 실시간으로 흘려보낸다.
--    아래 한 줄로 guestbook 표의 INSERT/UPDATE/DELETE가 구독자에게 전송된다.
--    (이미 등록돼 있으면 "already member" 에러가 날 수 있는데, 그땐 이미 켜진 것이니 무시해도 된다.)
alter publication supabase_realtime add table public.guestbook;
