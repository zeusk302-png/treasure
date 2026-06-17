-- 실습 291 [깨진 코드] — 남의 데이터가 다 보이고, 누구나 다 지우는 방명록
-- 이 파일은 "고치기 전" 잘못된 상태입니다. 절대 이대로 운영에 쓰지 마세요.
-- AI가 방명록을 만들어 달라고 하면 자주 이런 결과가 나옵니다.

-- 1) 방명록 테이블 (로그인한 사용자가 글을 남기는 구조)
create table if not exists guestbook (
  id          bigint generated always as identity primary key,
  user_id     uuid default auth.uid(),   -- 글쓴이(로그인한 본인)
  name        text not null,
  message     text not null,
  created_at  timestamptz default now()
);

-- ──────────────────────────────────────────────────────────────
-- ❌ 문제 1: RLS(행 수준 보안)를 아예 켜지 않았다.
--    아래 'alter table ... enable row level security' 줄이 빠져 있다.
--    → RLS가 꺼져 있으면 공개(anon) 키만으로 모든 행을 읽고 쓰고 지울 수 있다.
--    → Supabase 대시보드가 "RLS Disabled" 빨간 경고를 띄운다.
-- ──────────────────────────────────────────────────────────────

-- ❌ 문제 2: 설령 RLS를 켜더라도, 정책을 이렇게 만들면 사실상 다 열린다.
--    USING (true) = "조건 없이 전부 통과" 라는 뜻이라 잠금 효과가 0이다.
--    아래 정책들은 '고친 버전(schema.sql)'에서 어떻게 바뀌는지 비교해 보세요.

create policy "모두 읽기"  on guestbook for select using (true);
create policy "모두 작성"  on guestbook for insert with check (true);

-- ❌ 핵심 사고 지점: 삭제·수정도 USING (true) 라서
--    "남이 쓴 글"도 누구나 지우고 고칠 수 있다.
create policy "모두 삭제"  on guestbook for delete using (true);
create policy "모두 수정"  on guestbook for update using (true);
