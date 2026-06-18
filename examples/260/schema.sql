-- 실습 260: 게시판 + RLS(행 수준 보안)로 "작성자만 자기 글 수정·삭제"
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 [Run] 으로 실행하세요.
--
-- 핵심 한 줄: "누구냐(인증, Auth)"는 로그인이 정하고,
--            "그 사람이 이 줄(행)을 건드려도 되냐(인가)"는 아래 RLS 정책이 정합니다.

-- 1) 게시판 테이블
--    user_id 에 "이 글을 누가 썼는지"를 박아 둡니다. 이게 나중에 주인을 가리는 도장입니다.
create table if not exists posts (
  id          bigint generated always as identity primary key,
  title       text not null,
  content     text not null,
  user_id     uuid not null default auth.uid(),   -- 글 쓴 사람의 로그인 ID(자동 기록)
  created_at  timestamptz default now()
);

-- 2) RLS 켜기
--    이 줄을 켜야 "정책에 허락된 행만" 보이고/바뀝니다.
--    안 켜면 anon(공개) 키로 남의 글까지 마음대로 지울 수 있어 위험합니다.
alter table posts enable row level security;

-- 3) 정책 4종 (혹시 이미 있으면 지우고 다시 만들기)
drop policy if exists "누구나 글 읽기"        on posts;
drop policy if exists "로그인한 사람만 글 쓰기" on posts;
drop policy if exists "작성자만 수정"          on posts;
drop policy if exists "작성자만 삭제"          on posts;

-- (읽기) 누구나 읽을 수 있는 공개 게시판
create policy "누구나 글 읽기"
  on posts for select
  using ( true );

-- (쓰기) 로그인한 사람만, 그리고 user_id 는 "자기 자신"으로만 넣을 수 있게 강제
--   with check: 새로 들어오는 행이 이 조건을 통과해야 INSERT 허용
create policy "로그인한 사람만 글 쓰기"
  on posts for insert
  with check ( auth.uid() = user_id );

-- (수정) 자기 글만! auth.uid() = 지금 로그인한 사람, user_id = 그 글의 주인
--   using: 어떤 행을 수정 대상으로 "볼" 수 있는가
create policy "작성자만 수정"
  on posts for update
  using ( auth.uid() = user_id )
  with check ( auth.uid() = user_id );

-- (삭제) 자기 글만!
create policy "작성자만 삭제"
  on posts for delete
  using ( auth.uid() = user_id );

-- 확인 포인트:
--  - 위 정책들 덕분에, 로그인 A가 로그인 B의 글을 update/delete 하려 하면
--    "0 rows" 로 조용히 막힙니다(에러가 아니라 "건드릴 행이 없음"으로 처리).
--  - service_role(secret) 키는 이 RLS 를 통째로 무시합니다 → 절대 브라우저/깃허브에 두지 마세요.
