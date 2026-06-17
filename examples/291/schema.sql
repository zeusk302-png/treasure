-- 실습 291 [고친 버전] — RLS로 잠근 안전한 방명록
-- "누구나 읽고 쓰지만, 지우고 고치는 건 작성자 본인만"
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.

-- 1) 방명록 테이블 (broken.sql과 동일)
create table if not exists guestbook (
  id          bigint generated always as identity primary key,
  user_id     uuid default auth.uid(),   -- 글쓴이(로그인한 본인)
  name        text not null,
  message     text not null,
  created_at  timestamptz default now()
);

-- 2) ✅ 고침 1: RLS(행 수준 보안)를 반드시 켠다.
--    이걸 켜야 공개(anon) 키가 노출돼도 정책이 잠금장치 역할을 한다.
alter table guestbook enable row level security;

-- 깨진 정책이 이미 만들어져 있을 수 있으니, 깨끗이 지우고 다시 만든다.
drop policy if exists "모두 읽기"  on guestbook;
drop policy if exists "모두 작성"  on guestbook;
drop policy if exists "모두 삭제"  on guestbook;
drop policy if exists "모두 수정"  on guestbook;

-- 3) ✅ 고침 2: 읽기·작성은 열어두되, 의미를 좁힌다.
--    방명록이므로 글 목록은 누구나 본다.
create policy "누구나 읽기"
  on guestbook for select
  using (true);

--    글 작성은 '로그인한 본인 명의'로만 허용한다.
--    auth.uid() = user_id : 내가 쓴 글의 글쓴이는 나여야 한다.
create policy "로그인 사용자만 작성"
  on guestbook for insert
  with check (auth.uid() = user_id);

-- 4) ✅ 고침 3(핵심): 삭제·수정은 '작성자 본인'만.
--    auth.uid() = user_id 가 핵심 잠금. 남의 글은 0행 처리되어 막힌다.
create policy "작성자만 삭제"
  on guestbook for delete
  using (auth.uid() = user_id);

create policy "작성자만 수정"
  on guestbook for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- 참고: 관리자가 강제로 지워야 한다면 service_role(secret) 키를 '서버에서만' 쓴다.
--       service_role 키는 RLS를 통째로 우회하므로 브라우저·GitHub에 절대 두면 안 된다.
