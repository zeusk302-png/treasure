-- ============================================================
-- 실습 141 — '비밀 메모장' 테이블 + RLS(행 수준 보안)
-- Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 [Run]을 누르세요.
--
-- ★ 이번 실습의 핵심 ★
--   같은 memos 테이블을 여러 사람이 함께 써도,
--   "로그인한 본인의 메모만" 읽고/쓰고/지우게 만드는 것.
--   그 비밀은 RLS + auth.uid() = user_id 정책에 있습니다.
-- ============================================================

-- 1) 메모 테이블
--    user_id 는 '이 메모의 주인'을 가리킵니다.
--    auth.users(로그인한 사용자 목록)의 id를 참조합니다.
--    default auth.uid() 덕분에, 우리가 insert할 때 user_id를 직접 안 넣어도
--    Supabase가 '지금 로그인한 사람의 id'를 자동으로 채워줍니다.
create table if not exists memos (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now()
);

-- 2) RLS(행 수준 보안) 켜기
--    ★ 이 한 줄을 켜지 않으면, anon(공개) 키를 가진 누구나 모든 줄을 읽을 수 있습니다.
--    RLS를 켜면 '기본은 전부 차단'이 되고, 아래 정책으로 허락한 행만 통과합니다.
alter table memos enable row level security;

-- ------------------------------------------------------------
-- 3) 정책(policy) — "누가 / 어떤 행을" 다룰 수 있는지의 규칙
--    auth.uid() = 지금 로그인한 사람의 id (로그인 안 했으면 null)
--    아래 규칙들은 전부 "그 행의 주인(user_id)이 나(auth.uid())와 같을 때만"으로 잠급니다.
-- ------------------------------------------------------------

-- 3-1) 읽기(SELECT): 내 메모만 보인다.
--      using = "어떤 행을 볼 수 있는가"의 조건. 조건이 참인 행만 결과에 나옵니다.
create policy "본인 메모만 읽기"
  on memos for select
  to authenticated
  using (auth.uid() = user_id);

-- 3-2) 작성(INSERT): 내 이름(user_id)으로만 만들 수 있다.
--      with check = "새로 들어오는 행이 만족해야 하는" 조건.
--      남의 user_id를 적어 끼워 넣으려 하면 이 검사에서 막힙니다.
create policy "본인 메모만 작성"
  on memos for insert
  to authenticated
  with check (auth.uid() = user_id);

-- 3-3) 삭제(DELETE): 내 메모만 지울 수 있다.
create policy "본인 메모만 삭제"
  on memos for delete
  to authenticated
  using (auth.uid() = user_id);

-- (선택) 3-4) 수정(UPDATE): 내 메모만 고칠 수 있다.
--      using = 고칠 수 있는 대상 행 조건 / with check = 고친 뒤에도 내 것이어야 한다는 조건
create policy "본인 메모만 수정"
  on memos for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 확인 팁
--  - 위 정책들은 to authenticated, 즉 '로그인한 사용자'에게만 적용됩니다.
--    로그인 안 한 익명(anon) 방문자는 통과할 정책이 하나도 없어 아무것도 못 봅니다.
--  - service_role(secret) 키는 RLS를 통째로 우회합니다. 그래서 그 키는
--    브라우저·GitHub에 절대 두지 말고, 서버(n8n·엣지 함수)에서 환경변수로만 쓰세요.
-- ============================================================
