-- ============================================================
-- 실습 145 — 관리자만 들어가는 회원 목록 페이지 (역할 + RLS 종합)
-- Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 [Run]을 누르세요.
--
-- ★ 이번 실습의 핵심 ★
--   profiles 테이블에 'role(역할)' 칸을 두고,
--   RLS 정책이 그 role을 직접 검사해서
--     - 일반회원(user)은 "자기 한 줄"만 본다
--     - 관리자(admin)는 "모든 회원 줄"을 본다
--   이렇게 '누가 무엇을 봐도 되는지'를 데이터베이스가 직접 판단합니다.
--
--   일반회원이 admin.html 주소를 알아내서 직접 들어와도,
--   RLS가 막아주기 때문에 다른 사람 데이터는 한 줄도 안 옵니다.
--   (= '진짜 보안'은 화면이 아니라 DB에 있다)
-- ============================================================


-- ============================================================
-- 1) profiles 테이블 — 회원 한 명당 한 줄
--    (실습 143·144에서 이미 만들었다면, 이 블록은 건너뛰어도 됩니다.
--     create table if not exists 라서 다시 실행해도 안전합니다.)
--
--    id      = 그 회원의 로그인 계정 id (auth.users 의 id 와 같음)
--    role    = 역할. 'user'(일반회원) 또는 'admin'(관리자). 기본값은 user.
--    nickname= 화면에 보여줄 이름
-- ============================================================
create table if not exists profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  email       text,
  nickname    text,
  role        text not null default 'user' check (role in ('user', 'admin')),
  created_at  timestamptz not null default now()
);


-- ------------------------------------------------------------
-- 2) 회원가입하면 profiles 에 줄이 자동으로 생기게 하는 장치
--    (trigger: auth.users 에 새 계정이 생기면 profiles 에도 한 줄을 넣음)
--    이미 만들어 두었다면 이 블록도 건너뛰어도 됩니다.
-- ------------------------------------------------------------
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, email)
  values (new.id, new.email)
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();


-- ============================================================
-- 3) ★ 핵심 장치 ★ — "지금 로그인한 사람이 admin 인가?"를 알려주는 함수
--
--    왜 함수로 빼야 할까? (아주 중요)
--    RLS 정책 안에서 "내 role 이 admin 인지" 알려면 profiles 를 또 조회해야 합니다.
--    그런데 profiles 의 SELECT 정책 안에서 다시 profiles 를 SELECT 하면
--    → 정책이 자기 자신을 부르는 '무한 반복(recursion)' 에러가 납니다.
--
--    그래서 'security definer'(소유자 권한으로 도는) 함수로 빼냅니다.
--    이 함수는 RLS를 거치지 않고 role 값만 콕 집어 읽어오므로 반복이 끊깁니다.
--    함수는 role 을 '읽기만' 하고 아무 데이터도 노출하지 않으니 안전합니다.
-- ============================================================
create or replace function public.is_admin()
returns boolean
language sql
security definer
set search_path = public
stable
as $$
  select exists (
    select 1
    from public.profiles
    where id = auth.uid()
      and role = 'admin'
  );
$$;


-- ============================================================
-- 4) RLS(행 수준 보안) 켜기
--    ★ 이 한 줄이 없으면 anon(공개) 키를 가진 누구나 모든 회원 줄을 읽습니다.
--    켜면 '기본은 전부 차단'이 되고, 아래 정책으로 허락한 행만 통과합니다.
-- ============================================================
alter table profiles enable row level security;

-- 다시 실행해도 되도록, 같은 이름 정책이 있으면 먼저 지웁니다.
drop policy if exists "본인 또는 관리자 읽기" on profiles;
drop policy if exists "본인 프로필만 수정"   on profiles;


-- ------------------------------------------------------------
-- 5) ★ 역할 기반 읽기 정책 ★ — 이번 실습의 주인공
--    using = "어떤 행을 볼 수 있는가"의 조건.
--      (가) auth.uid() = id      → 나는 '내 한 줄'은 본다 (일반회원도 OK)
--      (나) public.is_admin()    → 내가 admin 이면 '모든 줄'을 본다
--    둘 중 하나라도 참이면 그 행이 결과에 나옵니다 (OR).
--
--    결과:
--      - 일반회원 → 자기 한 줄만 보임
--      - 관리자   → 전체 회원 목록이 다 보임
--    일반회원이 admin.html 로 직접 들어와 "전체 목록 줘"라고 해도,
--    (나) 조건이 거짓이라 자기 한 줄밖에 안 옵니다. → URL로 뚫기 불가!
-- ------------------------------------------------------------
create policy "본인 또는 관리자 읽기"
  on profiles for select
  to authenticated
  using (
    auth.uid() = id          -- (가) 내 한 줄
    or public.is_admin()     -- (나) 내가 관리자면 전부
  );


-- ------------------------------------------------------------
-- 6) 수정 정책 — 누구든 '자기 줄'만 고칠 수 있다.
--    ※ role 칸을 일반회원이 스스로 'admin'으로 바꿔 권한을 훔치지 못하게
--      막는 추가 장치는 아래 7) 의 트리거로 처리합니다.
-- ------------------------------------------------------------
create policy "본인 프로필만 수정"
  on profiles for update
  to authenticated
  using (auth.uid() = id)
  with check (auth.uid() = id);


-- ------------------------------------------------------------
-- 7) ★ 권한 상승(privilege escalation) 막기 ★
--    "수정 정책으로 내 줄은 고칠 수 있다"고 했는데,
--    그럼 일반회원이 자기 role 을 'admin'으로 바꿔치기 하면 어쩌죠?
--    → 일반회원의 role 변경 시도를 막는 트리거를 답니다.
--    (관리자 임명은 아래 8) 처럼 SQL Editor 에서만 합니다.)
-- ------------------------------------------------------------
create or replace function public.prevent_role_change()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  -- role 을 바꾸려 하는데, 바꾸는 사람이 관리자가 아니라면 → 막는다.
  if new.role is distinct from old.role and not public.is_admin() then
    raise exception '권한 없음: 일반회원은 role 을 바꿀 수 없습니다.';
  end if;
  return new;
end;
$$;

drop trigger if exists protect_role on profiles;
create trigger protect_role
  before update on profiles
  for each row execute function public.prevent_role_change();


-- ============================================================
-- 8) 나를 관리자로 임명하기 (테스트용)
--    먼저 memo.html/admin.html 에서 회원가입을 한 번 해서
--    profiles 에 내 줄이 생긴 다음, 아래에서 내 이메일을 admin 으로 올립니다.
--    ▼ 'admin@test.com' 자리에 '내가 관리자로 만들 계정의 이메일'을 넣으세요.
-- ============================================================
-- update profiles set role = 'admin' where email = 'admin@test.com';


-- ============================================================
-- 확인 팁
--  - 위 SELECT 정책은 to authenticated, 즉 '로그인한 사용자'에게만 적용됩니다.
--    로그인 안 한 익명(anon) 방문자는 통과할 정책이 없어 아무것도 못 봅니다.
--  - service_role(secret) 키는 RLS와 위 트리거를 통째로 우회합니다.
--    그래서 그 키는 브라우저·GitHub에 절대 두지 말고,
--    서버(n8n·엣지 함수)에서 환경변수로만 쓰세요.
-- ============================================================
