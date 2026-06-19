-- =====================================================================
-- 209 실습 보조 SQL: 환영 메일 자동화를 위한 profiles 테이블 준비
-- 실행 위치: Supabase 대시보드 → SQL Editor → 붙여넣고 Run
-- =====================================================================

-- 1) 사용자 프로필 테이블
--    Supabase의 로그인 사용자(auth.users)와 1:1로 연결되는 공개 프로필입니다.
--    welcome_sent 칼럼이 "환영 메일을 이미 보냈는가?"를 기록하는 핵심 스위치입니다.
create table if not exists public.profiles (
  id           uuid primary key references auth.users (id) on delete cascade,
  email        text,
  full_name    text,
  welcome_sent boolean not null default false,   -- 아직 안 보냄 = false
  created_at   timestamptz not null default now()
);

-- 2) 새 사용자가 가입하면 profiles에 자동으로 한 줄 추가하는 트리거
--    (가입 즉시 welcome_sent = false 상태로 들어갑니다 → n8n이 나중에 집어감)
create or replace function public.handle_new_user()
returns trigger
language plpgsql
-- security definer: 이 함수를 "만든 사람(관리자)의 권한"으로 실행하라는 뜻.
--   가입하는 일반 사용자는 profiles에 직접 쓸 권한이 없지만, 이 트리거 함수가
--   대신 한 줄을 넣어줘야 하므로 관리자 권한이 필요해서 넣은 설정입니다.
security definer
-- search_path를 public으로 고정 — 함수가 의도한 테이블만 보도록 막는 보안 관례.
set search_path = public
as $$
begin
  insert into public.profiles (id, email, full_name)
  -- raw_user_meta_data ->> 'full_name': 가입 폼에서 받은 이름을 꺼내옴(없으면 NULL).
  values (new.id, new.email, new.raw_user_meta_data ->> 'full_name')
  -- on conflict (id) do nothing: 혹시 같은 id가 이미 있으면 에러 내지 말고 그냥 넘어가라.
  --   트리거가 두 번 도는 드문 상황에서도 가입이 실패하지 않게 하는 안전장치입니다.
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- =====================================================================
-- 3) RLS(Row Level Security) — 보안의 핵심
-- =====================================================================
-- RLS를 켜면 기본적으로 "아무도 못 읽고 못 씁니다".
-- 그래서 정책(policy)으로 "누가 무엇을 할 수 있는지" 명시해 줘야 합니다.
alter table public.profiles enable row level security;

-- (브라우저에서 쓰는) anon / 로그인 사용자는 "자기 자신의 프로필"만 볼 수 있게 허용.
-- 이렇게 하면 anon 키가 유출돼도 남의 데이터를 긁어갈 수 없습니다.
drop policy if exists "본인 프로필만 조회" on public.profiles;
create policy "본인 프로필만 조회"
  on public.profiles
  for select
  to authenticated
  using (auth.uid() = id);

-- ※ 중요: n8n 워크플로우는 service_role 키를 사용합니다.
--   service_role 키는 RLS를 "통과(우회)"하므로 위 정책과 상관없이
--   모든 신규 가입자를 조회하고 welcome_sent 값을 갱신할 수 있습니다.
--   따라서 service_role 키는 절대 브라우저/프론트엔드에 두면 안 되고,
--   n8n 서버의 환경변수(비밀)로만 보관합니다.
