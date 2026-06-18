-- 실습 270: 실시간 리더보드 — 점수 테이블 + RLS + Realtime 켜기
-- Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 [Run] 하세요.

-- 1) 점수 테이블
create table if not exists scores (
  id          bigint generated always as identity primary key,
  nickname    text not null,
  score       integer not null check (score >= 0),  -- 점수는 0 이상만
  created_at  timestamptz default now()
);

-- 순위 정렬(점수 내림차순)을 빠르게 하기 위한 인덱스
create index if not exists scores_score_idx on scores (score desc);

-- 2) RLS 켜기 (이걸 켜야 anon 키가 공개돼도 안전합니다)
alter table scores enable row level security;

-- 3) 정책: 누구나 읽기, 누구나 점수 올리기 (공개 리더보드이므로)
create policy "누구나 순위 읽기" on scores for select using (true);
create policy "누구나 점수 작성" on scores for insert with check (true);

-- 참고: 수정/삭제 정책은 만들지 않았으므로 anon 키로는 남의 점수를
--       고치거나 지울 수 없습니다. (관리자가 정리하고 싶다면 service_role
--       키로 서버에서 처리 — 절대 브라우저/깃허브에 두지 마세요.)

-- 4) ★ Realtime 켜기 — 이게 이번 실습의 핵심!
--    이 테이블의 변경(INSERT 등)을 구독자에게 실시간으로 흘려보내도록
--    Supabase의 'supabase_realtime' 발행 목록(publication)에 추가합니다.
--    이 줄이 없으면 .channel(...).subscribe()를 해도 알림이 오지 않습니다.
alter publication supabase_realtime add table scores;

-- (대시보드로도 가능: Database → Replication → supabase_realtime →
--  scores 테이블 체크. SQL 한 줄과 같은 동작입니다.)
