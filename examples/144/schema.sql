-- ============================================================
-- 실습 144 — 역할(role)에 따라 화면 나누기 : profiles + role 컬럼 + RLS
-- Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 [Run]을 누르세요.
--
-- ★ 이번 실습의 핵심 ★
--   profiles 테이블에 role 컬럼('user' 또는 'admin')을 두고,
--   화면에서 그 값을 읽어 "관리자에게만 관리 메뉴를 보여주는" 분기를 만듭니다.
--   다만 화면에서 숨기는 건 'UI 친절'일 뿐, 진짜 방어는 다음 실습(145)의
--   '역할 기반 RLS'로 완성합니다. 여기서는 '내 역할은 내가 못 바꾼다'까지만 잠급니다.
-- ============================================================

-- 1) 프로필 테이블 (+ role 컬럼)
--    id 는 '이 프로필의 주인'입니다. auth.users(로그인한 사용자 목록)의 id와 1:1로 묶습니다.
--    role 은 'user'(일반회원) 또는 'admin'(관리자) 두 값만 허용합니다.
--    default 'user' 덕분에 새 회원은 자동으로 일반회원으로 시작합니다.
create table if not exists profiles (
  id          uuid primary key default auth.uid() references auth.users (id) on delete cascade,
  nickname    text not null default '',
  role        text not null default 'user' check (role in ('user', 'admin')),
  updated_at  timestamptz not null default now()
);

-- 이미 142/143에서 profiles를 만들었다면 role 컬럼만 추가합니다(있으면 건너뜀).
alter table profiles
  add column if not exists role text not null default 'user' check (role in ('user', 'admin'));

-- 2) RLS(행 수준 보안) 켜기
--    ★ 이 한 줄을 켜지 않으면, anon(공개) 키를 가진 누구나 모든 사람의 프로필을
--      읽고 고칠 수 있습니다. RLS를 켜면 '기본은 전부 차단'이 되고,
--      아래 정책으로 허락한 행만 통과합니다.
alter table profiles enable row level security;

-- ------------------------------------------------------------
-- 3) 정책(policy) — "누가 / 어떤 행을" 다룰 수 있는지의 규칙
--    auth.uid() = 지금 로그인한 사람의 id (로그인 안 했으면 null)
-- ------------------------------------------------------------

-- 3-1) 읽기(SELECT): 내 프로필만 보인다. (여기서 role 값을 읽어 화면을 분기합니다)
create policy "본인 프로필만 읽기"
  on profiles for select
  to authenticated
  using (auth.uid() = id);

-- 3-2) 작성(INSERT): 내 id 로만 프로필을 만들 수 있다.
create policy "본인 프로필만 작성"
  on profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- 3-3) 수정(UPDATE): 내 프로필만 고칠 수 있다.
--      ★ 여기서 중요한 함정 하나 ★
--      이 정책만으로는 '나는 내 줄을 고칠 수 있다'까지만 보장됩니다.
--      즉, 일반회원이 자기 role을 'admin'으로 바꾸는 update도 통과해 버립니다.
--      그래서 아래 3-4) 트리거로 "내 역할은 내가 못 바꾼다"를 막습니다.
create policy "본인 프로필만 수정"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);

-- ------------------------------------------------------------
-- 3-4) ★ role 상승(권한 탈취) 막기 ★
--      일반회원이 db.from('profiles').update({ role: 'admin' }) 같은 식으로
--      스스로를 관리자로 올리는 걸 막는 트리거입니다.
--      "로그인한 일반 사용자가 role 값을 바꾸려 하면" 막아버립니다.
--
--      핵심: 브라우저에서 anon 키로 들어오는 요청은 auth.uid()가 '그 사람 id'입니다.
--            반대로 SQL Editor나 service_role(서버)로 들어오는 요청은
--            auth.uid()가 NULL 입니다. 그래서 "auth.uid()가 있을 때만(=일반 사용자일 때만)"
--            role 변경을 막으면, 관리자 임명(아래 5번)은 통과시키면서
--            일반회원의 자가 권한상승은 차단할 수 있습니다.
-- ------------------------------------------------------------
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
as $$
begin
  -- auth.uid()가 NULL이 아니다 = 브라우저에서 로그인한 일반 사용자의 요청.
  -- 그런 요청이 role을 바꾸려 하면 막는다. (SQL Editor/service_role은 NULL이라 통과)
  if auth.uid() is not null and (new.role is distinct from old.role) then
    raise exception '역할(role)은 스스로 바꿀 수 없습니다.';
  end if;
  return new;
end;
$$;

drop trigger if exists guard_role_change on profiles;
create trigger guard_role_change
  before update on profiles
  for each row execute function public.prevent_role_change();

-- ============================================================
-- 4) (편의) 회원가입하면 빈 프로필을 자동으로 하나 만들어주는 트리거
--    새 회원은 role 기본값('user')으로 시작합니다.
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
  insert into public.profiles (id, nickname, role)
  values (new.id, '', 'user')
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- ============================================================
-- 5) ★ 관리자 임명 ★ — 어떤 회원 한 명을 관리자로 만들기
--    회원가입을 먼저 한 뒤, 아래 이메일을 '관리자로 만들 사람'의 이메일로 바꿔
--    이 한 줄만 다시 실행하세요. (SQL Editor는 RLS/트리거를 우회하므로 됩니다.)
--    'admin@test.com' 은 자리표시자입니다. 내가 가입한 이메일로 바꾸세요.
update profiles
set role = 'admin'
where id = (select id from auth.users where email = 'admin@test.com');

-- ============================================================
-- 확인 팁
--  - 위 select/update/insert 정책은 to authenticated, 즉 '로그인한 사용자'에게만
--    적용됩니다. 로그인 안 한 익명(anon)은 통과할 정책이 없어 아무것도 못 봅니다.
--  - SQL Editor는 관리자 권한(service_role급)으로 돌기 때문에 RLS·트리거를 우회합니다.
--    그래서 여기서는 위 5)처럼 role을 직접 admin으로 올릴 수 있는 게 정상입니다.
--  - service_role(secret) 키는 RLS를 통째로 우회합니다. 그 키는 브라우저·GitHub에
--    절대 두지 말고, 서버(n8n·엣지 함수)에서 환경변수로만 쓰세요.
-- ============================================================
