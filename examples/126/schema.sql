-- =====================================================================
-- 실습 126 — 글마다 좋아요(likes) 달기 + RPC로 안전하게 +1 하기
-- =====================================================================
-- 앞선 실습(123 방명록)에서는 글을 '추가(insert)'하고 '목록(select)'을 봤습니다.
-- 이번에는 각 글에 'likes(좋아요 수)' 컬럼을 두고,
-- 좋아요 버튼을 누르면 그 줄의 likes를 1 올립니다(+1).
--
-- ★ 왜 그냥 update 로 +1 하지 않고 'RPC(서버 함수)'를 쓰나요? ★
--   "지금 값을 읽어 와서(예: 3) → 자바스크립트에서 +1 해서 → 4로 update" 방식은
--   두 사람이 '동시에' 누르면 둘 다 3을 읽어 둘 다 4로 덮어써서, 5가 돼야 하는데 4가 됩니다.
--   이걸 '경쟁 상태(race condition)'라고 합니다. 좋아요가 한 번 사라지는 셈이죠.
--   → 해결책: 더하기 계산을 '서버 안에서 한 번에' 시키는 함수를 만들고,
--     자바스크립트는 그 함수를 호출(supabase.rpc)만 합니다. 동시에 눌러도 안전하게 +1씩 쌓입니다.
--
-- 사용법:
--   Supabase 대시보드 왼쪽 메뉴 > SQL Editor > New query 에
--   아래 내용을 통째로 붙여넣고 오른쪽 위 [Run] 버튼을 누르세요.
--   (1~4단계가 한 번에 실행됩니다. 여러 번 실행해도 안전하게 만들어 뒀습니다.)
-- =====================================================================


-- =====================================================================
-- 1단계) posts 표 만들기 (likes 컬럼 포함)
-- =====================================================================
--   id          : 줄(row)을 구별하는 고유 번호. 서버가 1, 2, 3... 자동으로 매깁니다.
--   content     : 글 내용 (비어 있으면 안 되므로 not null)
--   likes       : 좋아요 수. 기본값 0(아직 아무도 안 누름). not null 로 항상 숫자 보장.
--   created_at  : 만든 시각. 서버가 자동으로 '지금 시각'을 넣습니다(now()).
create table if not exists public.posts (
  id          bigint generated always as identity primary key,
  content     text        not null,
  likes       integer     not null default 0,
  created_at  timestamptz not null default now()
);


-- =====================================================================
-- 2단계) RLS(행 수준 보안) 켜기
-- =====================================================================
-- RLS = Row Level Security. "표의 줄 하나하나마다 출입 통제를 건다"는 뜻입니다.
-- 켜면 '정책(policy)으로 허락한 동작'만 가능합니다(기본은 전부 거절).
alter table public.posts enable row level security;


-- =====================================================================
-- 3단계) 읽기/쓰기 정책 추가하기
-- =====================================================================
-- (읽기) 누구나 글 목록을 볼 수 있게 허용 -------------------------------
drop policy if exists "anyone can read posts" on public.posts;
create policy "anyone can read posts"
  on public.posts
  for select              -- '읽기(select)' 동작에만 적용
  to anon, authenticated  -- 비로그인 손님(anon) + 로그인 사용자 모두
  using (true);           -- 어떤 줄을 보여줄지 조건. true = 전부 공개

-- (쓰기) 누구나 글을 추가할 수 있게 허용 -------------------------------
drop policy if exists "anyone can insert posts" on public.posts;
create policy "anyone can insert posts"
  on public.posts
  for insert              -- '쓰기(insert)' 동작에만 적용
  to anon, authenticated
  with check (true);      -- 새로 들어오는 줄을 검사하는 조건. true = 전부 허용

-- ※ '직접 update' 정책은 일부러 만들지 않습니다.
--    좋아요 +1 은 4단계에서 만들 '서버 함수(RPC)'를 통해서만 하도록 하기 위함입니다.
--    (함수가 security definer 로 동작하므로 update 정책 없이도 함수 안에서는 안전하게 올라갑니다.)


-- =====================================================================
-- 4단계) 좋아요 +1 함수(RPC) 만들기  ★ 이번 실습의 핵심 ★
-- =====================================================================
-- increment_likes(post_id) : 받은 id의 글 likes 를 '서버 안에서' 1 올리고,
--                            올린 뒤의 새 likes 값을 돌려줍니다.
--
--   set likes = likes + 1  ← 핵심!
--     "현재 likes 값에 1을 더해라"를 데이터베이스가 '한 번의 동작'으로 처리합니다.
--     자바스크립트에서 읽고-더하고-쓰는 게 아니라서, 동시에 여러 명이 눌러도 안전합니다.
--
--   security definer
--     이 함수는 '함수를 만든 사람(=관리자)의 권한'으로 실행됩니다.
--     그래서 anon(공개) 키로 호출해도, posts 에 'update 정책'이 없는데도
--     함수 내부의 +1 만큼은 통과합니다. (직접 update 는 여전히 막혀 있어 안전)
create or replace function public.increment_likes(post_id bigint)
returns integer            -- 올린 뒤의 새 likes 숫자를 돌려줌
language sql
security definer
set search_path = public   -- 보안 권장: 함수가 바라볼 스키마를 고정
as $$
  update public.posts
     set likes = likes + 1  -- ★ 읽고-더하고-쓰기를 서버가 '한 번에' (동시성 안전)
   where id = post_id
  returning likes;          -- 갱신된 likes 값을 결과로 반환
$$;

-- anon(공개) / 로그인 사용자가 이 함수를 '호출'할 수 있게 권한을 줍니다.
grant execute on function public.increment_likes(bigint) to anon, authenticated;


-- =====================================================================
-- 5단계) (선택) 화면에 보여 줄 예시 글 몇 개 미리 넣기
-- =====================================================================
-- 이미 글이 있으면 건너뜁니다(여러 번 실행해도 중복으로 쌓이지 않게).
insert into public.posts (content)
select x.content
from (values
  ('첫 글입니다. 좋아요 눌러 보세요!'),
  ('오늘 날씨가 참 좋네요.'),
  ('웹개발 실습 126번 도전 중!')
) as x(content)
where not exists (select 1 from public.posts);


-- =====================================================================
-- [보안 안내 — anon(공개) vs service_role(비밀)]
--   - anon key (공개 키, sb_publishable_...) : script.js·브라우저·깃허브에 올려도
--     되는 '출입증'. RLS 정책과 함수 권한(grant)의 통제를 받으므로 공개해도 안전합니다.
--     → 이번 실습 script.js 에는 반드시 이 anon 키만 넣습니다.
--   - service_role key (비밀, sb_secret_...) : ★ RLS를 통째로 우회하는 마스터 키 ★.
--     절대! 브라우저·코드·깃허브에 올리면 안 됩니다(서버에서만 비밀로 사용).
-- =====================================================================
