-- ============================================================
-- newsletter 테이블 만들기 (뉴스레터 구독 이메일 보관용)
-- 실행 위치: Supabase 대시보드 > 왼쪽 메뉴 SQL Editor > New query
-- 아래 전체를 붙여넣고 [Run] 버튼을 누르면 됩니다.
-- ============================================================

-- 1) 테이블 생성
--    "이메일을 한 줄씩 담는 표"라고 생각하면 됩니다.
--    한 줄(row) = 한 명의 구독자, 칸(column) = 그 사람에 대한 정보입니다.
create table if not exists public.newsletter (
  -- id: 각 구독자에게 자동으로 붙는 고유 번호표 (직접 입력하지 않아도 자동 생성)
  id          bigint generated always as identity primary key,

  -- email: 구독자 이메일 주소. 빈 값(null) 금지 + 중복 금지(같은 이메일 두 번 저장 X)
  email       text        not null unique,

  -- created_at: 구독한 시각. 행이 만들어질 때 현재 시간이 자동으로 들어갑니다.
  created_at  timestamptz not null default now()
);

-- 2) 행 수준 보안(RLS) 켜기
--    RLS를 켜면 "기본적으로 아무도 못 읽고 못 쓰게" 잠깁니다.
--    그다음 아래 정책(policy)으로 "딱 필요한 동작만" 열어줍니다. (보안의 핵심)
alter table public.newsletter enable row level security;

-- 3) 정책 1: 누구나 구독(INSERT)은 가능
--    웹페이지에 박히는 anon(공개) 키로도 구독 신청이 되도록 INSERT만 허용합니다.
--    anon 키는 브라우저에 노출돼도 되는 "공개 열쇠"입니다.
create policy "anyone can subscribe"
  on public.newsletter
  for insert
  to anon, authenticated
  with check (true);

-- 4) 정책 2: 공개 사용자는 목록을 읽지 못함 (SELECT 정책을 안 만듦)
--    SELECT 정책을 만들지 않았으므로 anon 키로는 구독자 명단을 조회할 수 없습니다.
--    => 남의 이메일 명단이 그대로 노출되는 사고를 막습니다.
--    구독자 명단 전체 조회는 service_role(비밀 키)로만 하세요.
--    service_role 키는 절대 브라우저/깃허브에 올리지 말고 서버나 n8n에서만 사용합니다.

-- 끝. 왼쪽 메뉴 Table Editor 에서 newsletter 테이블이 보이면 성공입니다.
