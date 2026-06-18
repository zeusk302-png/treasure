-- =====================================================================
-- 실습 261 — 게시판에 '댓글(1:N)'과 '좋아요(공감) 카운트' 추가하기
-- =====================================================================
-- 사용법:
--   Supabase 대시보드 왼쪽 메뉴 > SQL Editor > New query 에
--   아래 내용을 통째로 붙여넣고 오른쪽 위 [Run] 버튼을 누르세요.
--
-- 이번 실습이 하는 일(딱 한 가지):
--   '글(posts)' 하나에 '댓글(comments)' 여러 개를 매답니다. (= 1:N 관계)
--   그리고 글마다 '좋아요(공감) 수'를 +1 씩 올려 화면에 보여 줍니다. (= 카운트)
--
-- 핵심 개념 3가지:
--   1) 1:N 관계  : 글 1개  ──< 댓글 N개   ("한 글에 댓글이 여러 개")
--   2) 외래키    : 댓글 줄이 "나는 몇 번 글 소속" 인지 가리키는 화살표(post_id)
--   3) 카운트    : 좋아요 수를 안전하게 +1 하는 함수(여러 명이 동시에 눌러도 안 샘)
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0단계) '글(posts)' 표 — 이미 게시판 실습(258)에서 만들었다면 그대로 쓰입니다.
--         처음이면 이 한 덩어리도 같이 실행하세요. (있으면 그냥 건너뜁니다.)
-- ---------------------------------------------------------------------
create table if not exists public.posts (
  id          bigint generated always as identity primary key,
  title       text        not null,            -- 글 제목
  body        text        not null,            -- 글 내용
  like_count  integer     not null default 0,  -- ★ 좋아요(공감) 수 (이번 실습에서 추가/사용)
  created_at  timestamptz not null default now()
);

-- 이미 posts 표가 있던 분을 위해, like_count 칸이 없으면 새로 붙입니다(안전).
alter table public.posts
  add column if not exists like_count integer not null default 0;


-- ---------------------------------------------------------------------
-- 1단계) '댓글(comments)' 표 만들기 — 여기가 1:N의 핵심
-- ---------------------------------------------------------------------
create table if not exists public.comments (
  id          bigint generated always as identity primary key,
  -- ★ 외래키(foreign key) ★
  --   post_id 는 "이 댓글이 어느 글에 달렸는가"를 가리키는 화살표입니다.
  --   references public.posts(id) : 반드시 posts 표에 '실제로 있는 글'만 가리킬 수 있음.
  --   on delete cascade           : 글이 지워지면, 그 글에 달린 댓글도 같이 자동 삭제.
  post_id     bigint      not null references public.posts(id) on delete cascade,
  author      text        not null,            -- 댓글 작성자 이름
  content     text        not null,            -- 댓글 내용
  created_at  timestamptz not null default now()
);

-- "몇 번 글의 댓글" 을 자주 조회하므로, post_id 에 색인(index)을 걸어 빠르게 만듭니다.
create index if not exists comments_post_id_idx on public.comments(post_id);


-- ---------------------------------------------------------------------
-- 2단계) 좋아요(공감) 수를 '안전하게 +1' 하는 함수 만들기
-- ---------------------------------------------------------------------
-- 왜 함수로 만드나요?
--   "현재 값을 읽고 → +1 해서 → 다시 쓰기" 를 브라우저에서 따로따로 하면,
--   두 사람이 동시에 누를 때 한 번이 새어 나갈 수 있습니다(둘 다 5를 읽고 둘 다 6을 씀 → 7이 아니라 6).
--   DB 안에서 'set like_count = like_count + 1' 한 줄로 처리하면 이런 누락이 없습니다.
create or replace function public.increment_like(target_id bigint)
returns integer            -- 올린 뒤의 새 좋아요 수를 돌려줍니다.
language sql
as $$
  update public.posts
     set like_count = like_count + 1
   where id = target_id
  returning like_count;
$$;


-- ---------------------------------------------------------------------
-- 3단계) RLS(행 수준 보안) 켜기 — 두 표 모두
-- ---------------------------------------------------------------------
-- RLS = Row Level Security. "표의 줄(row)마다 출입 통제를 건다"는 뜻.
-- 켜는 순간 기본은 '전부 거절' → 아래에서 허락한 동작만 가능해집니다.
alter table public.posts    enable row level security;
alter table public.comments enable row level security;


-- ---------------------------------------------------------------------
-- 4단계) [정책] 글: 누구나 읽기 + 누구나 쓰기 (이번 실습은 공개 게시판)
-- ---------------------------------------------------------------------
drop policy if exists "anyone can read posts"   on public.posts;
drop policy if exists "anyone can insert posts" on public.posts;
drop policy if exists "anyone can like posts"   on public.posts;

create policy "anyone can read posts"
  on public.posts for select
  to anon, authenticated using (true);

create policy "anyone can insert posts"
  on public.posts for insert
  to anon, authenticated with check (true);

-- ★ 좋아요 +1 은 like_count 칸을 바꾸는 'update' 이므로, update 정책이 필요합니다.
--   (이번 실습은 공개 좋아요라 누구나 허용. 실제 서비스라면 '본인 1회'로 제한합니다.)
create policy "anyone can like posts"
  on public.posts for update
  to anon, authenticated
  using (true) with check (true);


-- ---------------------------------------------------------------------
-- 5단계) [정책] 댓글: 누구나 읽기 + 누구나 쓰기
-- ---------------------------------------------------------------------
drop policy if exists "anyone can read comments"   on public.comments;
drop policy if exists "anyone can insert comments" on public.comments;

create policy "anyone can read comments"
  on public.comments for select
  to anon, authenticated using (true);

create policy "anyone can insert comments"
  on public.comments for insert
  to anon, authenticated with check (true);

-- (참고) 댓글 '수정/삭제' 정책은 일부러 만들지 않았습니다.
--   → anon(공개) 키로는 남의 댓글을 고치거나 지울 수 없습니다(기본 거절).
--   → 운영자는 Supabase 대시보드 > Table editor 에서 직접 지웁니다(service_role 권한).


-- ---------------------------------------------------------------------
-- 6단계) (선택) 동작 확인용 샘플 글 1개 — 이미 글이 있으면 건너뛰어도 됩니다.
-- ---------------------------------------------------------------------
insert into public.posts (title, body)
select '첫 글입니다', '여기에 댓글을 달고 좋아요를 눌러 보세요!'
where not exists (select 1 from public.posts);


-- =====================================================================
-- [보안 안내 — anon(공개) vs service_role(비밀)]
--
--   - anon key (공개 키, sb_publishable_...) : 화면(브라우저)·script.js·깃허브에
--     올려도 되는 '출입증'. RLS 정책의 통제를 그대로 받으므로 공개해도 안전합니다.
--     이번 실습에선 '읽기/글쓰기/댓글/좋아요+1' 만 허락했고, 댓글 수정·삭제는 막혀 있습니다.
--   - service_role key (비밀, sb_secret_...) : ★ RLS 자체를 통째로 우회하는 마스터 키 ★.
--     정책이 뭐든 무시하고 다 됩니다. 그래서 절대! 브라우저·코드·깃허브에 올리면 안 되고,
--     오직 서버(예: n8n, 백엔드)에서만 비밀로 보관해 씁니다.
-- =====================================================================
