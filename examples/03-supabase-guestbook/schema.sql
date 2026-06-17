-- 실습 03: 방명록 테이블 + RLS(행 수준 보안)
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.

-- 1) 방명록 테이블
create table if not exists guestbook (
  id          bigint generated always as identity primary key,
  name        text not null,
  message     text not null,
  created_at  timestamptz default now()
);

-- 2) RLS 켜기 (이걸 켜야 anon 키가 공개돼도 안전합니다)
alter table guestbook enable row level security;

-- 3) 정책: 누구나 읽기, 누구나 작성 (공개 방명록이므로)
create policy "누구나 읽기"  on guestbook for select using (true);
create policy "누구나 작성"  on guestbook for insert with check (true);

-- 참고: 수정/삭제 정책은 만들지 않았으므로 anon 키로는 수정·삭제가 막힙니다.
-- (관리자만 지우고 싶다면 service_role 키로 서버에서 처리 — 절대 프론트에 두지 마세요.)
