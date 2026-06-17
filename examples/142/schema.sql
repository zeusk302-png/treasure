-- ============================================================
-- 실습 142 — '비밀 메모장' 검증용 테이블 + RLS (실습 141과 동일)
-- Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 [Run]을 누르세요.
--
-- ★ 이번 실습의 목표 ★
--   "RLS가 진짜로 막아주는지"를 두 계정으로 직접 공격해 보며 검증하는 것.
--   이미 실습 141을 끝냈다면 테이블/정책이 그대로 있으니 이 파일은 건너뛰어도 됩니다.
--   141을 안 했다면 이 파일을 먼저 실행해 검증 대상을 준비하세요.
-- ============================================================

-- 1) 메모 테이블 (141과 동일)
--    default auth.uid() : insert 때 user_id를 안 적으면 '지금 로그인한 사람'이 자동으로 채워짐.
create table if not exists memos (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid() references auth.users (id) on delete cascade,
  content     text not null,
  created_at  timestamptz not null default now()
);

-- 2) RLS 켜기 — 이 한 줄이 '기본 전부 차단'을 만든다.
alter table memos enable row level security;

-- 3) 정책 — "그 행의 주인(user_id)이 나(auth.uid())와 같을 때만" 허용
--    create policy 는 같은 이름이 있으면 에러가 납니다.
--    141에서 이미 만들었다면 아래 4개는 "already exists" 에러가 나도 정상입니다(무시).

create policy "본인 메모만 읽기"
  on memos for select
  to authenticated
  using (auth.uid() = user_id);

create policy "본인 메모만 작성"
  on memos for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "본인 메모만 삭제"
  on memos for delete
  to authenticated
  using (auth.uid() = user_id);

create policy "본인 메모만 수정"
  on memos for update
  to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- ============================================================
-- 검증용 보조 쿼리 (선택)
--  - 아래 SQL Editor는 'service_role급 관리자 권한'으로 도므로 RLS를 우회합니다.
--    그래서 여기서는 a와 b의 메모가 '모두' 보이는 게 정상입니다.
--    (브라우저에서 anon 키로 보는 것과 결과가 다른 게 바로 핵심!)
--
--    select user_id, content, created_at from memos order by created_at;
--
--  - 위험 체험 후 반드시 다시 켜기:
--    alter table memos disable row level security;   -- (실험) 끄면 anon이 다 본다
--    alter table memos enable  row level security;   -- (필수) 실험 끝나면 즉시 다시 켜기
-- ============================================================
