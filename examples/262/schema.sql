-- =====================================================================
-- 실습 262 — 게시판 '신고(report)'와 '자동 숨김(is_hidden)' 준비
-- =====================================================================
-- 사용법:
--   Supabase 대시보드 왼쪽 메뉴 > SQL Editor > New query 에
--   아래 내용을 통째로 붙여넣고 오른쪽 위 [Run] 버튼을 누르세요.
--
-- 이번 실습이 하는 일(딱 한 가지):
--   글이 신고를 일정 횟수(예: 3회) 넘게 받으면,
--   n8n이 그 글을 자동으로 '숨김' 처리하고 관리자에게 메일로 알립니다.
--   이 SQL은 그 자동화가 작동하도록 '글 표(posts)'에 두 칸만 더 붙이는 준비물입니다.
--
-- 추가하는 칸 2개:
--   report_count : 이 글이 신고받은 횟수 (기본 0)
--   is_hidden    : 숨김 여부 (기본 false). true 가 되면 화면에서 가립니다.
-- =====================================================================


-- ---------------------------------------------------------------------
-- 0단계) 글(posts) 표 — 게시판 실습(258~261)에서 이미 만들었다면 그대로 쓰입니다.
--         처음이면 이 한 덩어리도 같이 실행하세요.
-- ---------------------------------------------------------------------
create table if not exists public.posts (
  id          bigint generated always as identity primary key,
  title       text        not null,            -- 글 제목
  body        text        not null,            -- 글 내용
  created_at  timestamptz not null default now()
);

-- ★ 이번 실습에서 쓰는 칸 2개를 '없으면 추가'합니다(이미 있으면 건너뜀).
alter table public.posts
  add column if not exists report_count integer not null default 0;   -- 신고 누적 횟수

alter table public.posts
  add column if not exists is_hidden boolean not null default false;   -- 숨김 여부


-- ---------------------------------------------------------------------
-- 1단계) 신고 횟수를 '안전하게 +1' 하고, 올린 뒤의 값을 돌려주는 함수
-- ---------------------------------------------------------------------
-- 왜 함수로 만드나요?
--   "현재 값을 읽고 → +1 해서 → 다시 쓰기" 를 따로따로 하면,
--   두 사람이 동시에 신고할 때 한 번이 새어 나갈 수 있습니다(둘 다 2를 읽고 둘 다 3을 씀).
--   DB 안에서 'set report_count = report_count + 1' 한 줄로 처리하면 누락이 없습니다.
--   n8n은 이 함수 하나만 호출하면 '올린 뒤의 신고 수'를 바로 돌려받아 임계치와 비교할 수 있습니다.
create or replace function public.increment_report(target_id bigint)
returns table (id bigint, title text, report_count integer, is_hidden boolean)
language sql
as $$
  update public.posts
     set report_count = report_count + 1
   where id = target_id
  returning id, title, report_count, is_hidden;
$$;


-- ---------------------------------------------------------------------
-- 2단계) RLS(행 수준 보안) 켜기
-- ---------------------------------------------------------------------
-- RLS = Row Level Security. 켜는 순간 기본은 '전부 거절' → 허락한 동작만 가능.
alter table public.posts enable row level security;


-- ---------------------------------------------------------------------
-- 3단계) [정책] 화면(anon)에서 할 수 있는 일만 콕 집어 허용
-- ---------------------------------------------------------------------
-- 핵심 원칙:
--   * 화면(브라우저)은 'anon(공개) 키'로 동작합니다 → 아래 정책 안에서만 움직입니다.
--   * '글 숨김(is_hidden=true)' 같은 모더레이션은 anon 으로는 절대 못 합니다.
--     → 그건 n8n이 'service_role(비밀) 키'로 RLS를 우회해 처리합니다(서버 전용).

-- (읽기) 숨김 처리된 글은 화면에서 아예 안 보이게: is_hidden = false 인 글만 읽기 허용
drop policy if exists "anyone can read visible posts" on public.posts;
create policy "anyone can read visible posts"
  on public.posts for select
  to anon, authenticated
  using (is_hidden = false);

-- (쓰기) 누구나 글 작성 허용 (공개 게시판)
drop policy if exists "anyone can insert posts" on public.posts;
create policy "anyone can insert posts"
  on public.posts for insert
  to anon, authenticated
  with check (true);

-- ※ update/delete 정책은 일부러 만들지 않습니다.
--   → anon(공개) 키로는 report_count·is_hidden 을 직접 못 바꿉니다(기본 거절).
--   → 신고 +1과 숨김은 오직 n8n(service_role)을 거쳐야만 일어납니다. 이게 핵심 안전장치입니다.


-- ---------------------------------------------------------------------
-- 4단계) (선택) 동작 확인용 샘플 글 1개 — 이미 글이 있으면 건너뛰어도 됩니다.
-- ---------------------------------------------------------------------
insert into public.posts (title, body)
select '신고 테스트용 글', '이 글을 3번 신고하면 자동으로 숨겨집니다.'
where not exists (select 1 from public.posts);


-- =====================================================================
-- [보안 안내 — anon(공개) vs service_role(비밀)]
--
--   - anon key (공개 키) : 화면(브라우저)·script.js·깃허브에 올려도 되는 '출입증'.
--     RLS 정책의 통제를 그대로 받습니다. 이번 실습에서 화면이 할 수 있는 건
--     '보이는 글 읽기'와 '글쓰기'뿐. 신고 +1·숨김은 막혀 있습니다.
--
--   - service_role key (비밀 키) : ★ RLS 자체를 통째로 우회하는 마스터 키 ★.
--     정책이 뭐든 무시하고 다 됩니다. 그래서 절대! 브라우저·코드·깃허브에 올리면 안 되고,
--     오직 서버(여기서는 n8n) 안에서만 비밀(환경변수)로 보관해 씁니다.
--     → 신고 함수 호출·글 숨김은 n8n이 service_role 로 대신 수행합니다.
-- =====================================================================
