-- ============================================================
-- 실습 143 — '내 프로필(닉네임)' 테이블 + RLS(행 수준 보안)
-- Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 [Run]을 누르세요.
--
-- ★ 이번 실습의 핵심 ★
--   회원마다 '닉네임/한 줄 소개'를 저장하는 profiles 테이블을 만들고,
--   "본인은 자기 프로필만 보고/만들고/고칠 수 있게" RLS로 잠그는 것.
--   비결은 화면 코드가 아니라 RLS + auth.uid() = id 정책에 있습니다.
-- ============================================================

-- 1) 프로필 테이블
--    id 는 '이 프로필의 주인'입니다. auth.users(로그인한 사용자 목록)의 id와 1:1로 묶습니다.
--    한 사람당 프로필 한 줄이면 충분하므로 id 자체를 기본키로 씁니다.
--    default auth.uid() 덕분에 insert할 때 id를 직접 안 넣어도
--    '지금 로그인한 사람의 id'가 자동으로 채워집니다.
create table if not exists profiles (
  id          uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  nickname    text not null default '',
  bio         text not null default '',
  updated_at  timestamptz not null default now()
);

-- 2) RLS(행 수준 보안) 켜기
--    ★ 이 한 줄을 켜지 않으면, anon(공개) 키를 가진 누구나 모든 사람의 프로필을
--      읽고 고칠 수 있습니다. RLS를 켜면 '기본은 전부 차단'이 되고,
--      아래 정책으로 허락한 행만 통과합니다.
alter table profiles enable row level security;

-- ------------------------------------------------------------
-- 3) 정책(policy) — "누가 / 어떤 행을" 다룰 수 있는지의 규칙
--    auth.uid() = 지금 로그인한 사람의 id (로그인 안 했으면 null)
--    아래 규칙들은 전부 "그 행의 주인(id)이 나(auth.uid())와 같을 때만"으로 잠급니다.
-- ------------------------------------------------------------

-- 3-1) 읽기(SELECT): 내 프로필만 보인다.
--      using = "어떤 행을 볼 수 있는가"의 조건. 조건이 참인 행만 결과에 나옵니다.
create policy "본인 프로필만 읽기"
  on profiles for select
  to authenticated
  using (auth.uid() = id);

-- 3-2) 작성(INSERT): 내 id 로만 프로필을 만들 수 있다.
--      with check = "새로 들어오는 행이 만족해야 하는" 조건.
--      남의 id를 적어 끼워 넣으려 하면 이 검사에서 막힙니다.
create policy "본인 프로필만 작성"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- 3-3) 수정(UPDATE): 내 프로필만 고칠 수 있다. ★ 이번 실습의 주인공 ★
--      using      = 고칠 수 있는 '대상 행'의 조건
--      with check = 고친 '뒤에도' 내 것이어야 한다는 조건
--      → 둘 다 auth.uid() = id 라서, 남의 프로필은 고를 수도 없고
--        내 행의 주인을 남으로 바꿔치기 할 수도 없습니다.
create policy "본인 프로필만 수정"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ============================================================
-- 4) (편의) 회원가입하면 빈 프로필을 자동으로 하나 만들어주는 트리거
--    이게 없으면 첫 방문 때 화면 코드가 직접 insert 해야 합니다.
--    (화면 코드에도 'upsert'로 대비해 두었으니, 이 트리거는 선택입니다.)
--    security definer : 트리거 함수는 주인(생성자) 권한으로 돌아 RLS의 방해 없이
--                       새 회원의 빈 프로필을 안전하게 만들 수 있습니다.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, nickname)
  values (new.id, '')
  on conflict (id) do nothing;
  return new;
end;
$$;

-- 같은 트리거가 이미 있으면 지우고 다시 만든다(여러 번 실행해도 안전).
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 확인 팁
--  - 위 정책들은 to authenticated, 즉 '로그인한 사용자'에게만 적용됩니다.
--    로그인 안 한 익명(anon) 방문자는 통과할 정책이 하나도 없어 아무것도 못 봅니다.
--  - SQL Editor는 관리자 권한(service_role급)으로 돌기 때문에 RLS를 우회합니다.
--    그래서 여기서 select * from profiles; 하면 모두의 프로필이 보이는 게 정상입니다.
--    (브라우저에서 anon 키로 보는 것과 결과가 다른 게 바로 핵심!)
--  - service_role(secret) 키는 RLS를 통째로 우회합니다. 그래서 그 키는
--    브라우저·GitHub에 절대 두지 말고, 서버(n8n·엣지 함수)에서 환경변수로만 쓰세요.
-- ============================================================
