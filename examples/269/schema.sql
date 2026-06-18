-- =====================================================================
-- 실습 269 — 웹게임 점수를 Supabase '리더보드'에 저장하고 순위로 보여주기
-- =====================================================================
-- 사용법:
--   Supabase 대시보드 왼쪽 메뉴 > SQL Editor > New query 에
--   아래 내용을 통째로 붙여넣고 오른쪽 위 [Run] 버튼을 누르세요.
--
-- 이번 실습이 하는 일(딱 한 가지):
--   미니 게임이 끝나면 '이름 + 점수'를 한 줄로 저장하고,
--   점수가 높은 순서(정렬)로 상위 10명만 뽑아 화면에 보여 줍니다.
--
-- 핵심 개념 2가지:
--   1) 리더보드(leaderboard) : '이름 + 점수'가 쌓이는 점수판 표 한 개
--   2) 정렬 조회(sorted query): 점수 높은 순(desc)으로 정렬해 위에서 N개만(limit) 가져오기
-- =====================================================================


-- ---------------------------------------------------------------------
-- 1단계) '점수판(scores)' 표 만들기
-- ---------------------------------------------------------------------
create table if not exists public.scores (
  id          bigint generated always as identity primary key,
  player      text        not null,            -- 플레이어 이름(닉네임)
  score       integer     not null,            -- 이번 판 점수 (이 칸을 기준으로 순위를 매김)
  created_at  timestamptz not null default now()
);

-- '점수 높은 순으로 빠르게 정렬'하기 위해 score 칸에 색인(index)을 겁니다.
--   desc(내림차순)로 자주 정렬하므로, 색인도 desc로 만들어 줍니다.
create index if not exists scores_score_desc_idx on public.scores (score desc);


-- ---------------------------------------------------------------------
-- 2단계) RLS(행 수준 보안) 켜기
-- ---------------------------------------------------------------------
-- RLS = Row Level Security. "표의 줄(row)마다 출입 통제를 건다"는 뜻.
-- 켜는 순간 기본은 '전부 거절' → 아래에서 허락한 동작만 가능해집니다.
alter table public.scores enable row level security;


-- ---------------------------------------------------------------------
-- 3단계) [정책] 누구나 점수 읽기 + 누구나 점수 올리기(insert)
-- ---------------------------------------------------------------------
-- 이번 실습은 '공개 리더보드'라 누구나 점수를 보고, 누구나 자기 점수를 올릴 수 있게 둡니다.
drop policy if exists "anyone can read scores"   on public.scores;
drop policy if exists "anyone can insert scores" on public.scores;

create policy "anyone can read scores"
  on public.scores for select
  to anon, authenticated using (true);

create policy "anyone can insert scores"
  on public.scores for insert
  to anon, authenticated with check (true);

-- ★ 일부러 update/delete 정책은 만들지 않았습니다.
--   → anon(공개) 키로는 남의 점수를 고치거나 지울 수 없습니다(기본 거절).
--   → 운영자가 잘못된/장난 점수를 지울 때는 Supabase 대시보드 > Table editor 에서
--     직접 지웁니다(service_role 권한, 대시보드 안에서만).


-- ---------------------------------------------------------------------
-- 4단계) (선택) 동작 확인용 샘플 점수 몇 개 — 이미 점수가 있으면 건너뜁니다.
-- ---------------------------------------------------------------------
insert into public.scores (player, score)
select * from (values
  ('연습봇 A', 12),
  ('연습봇 B', 8),
  ('연습봇 C', 5)
) as seed(player, score)
where not exists (select 1 from public.scores);


-- =====================================================================
-- [보안 안내 — anon(공개) vs service_role(비밀)]
--
--   - anon key (공개 키, sb_publishable_...) : 화면(브라우저)·script.js·깃허브에
--     올려도 되는 '출입증'. RLS 정책의 통제를 그대로 받으므로 공개해도 안전합니다.
--     이번 실습에선 '점수 읽기 / 점수 올리기' 만 허락했고, 점수 수정·삭제는 막혀 있습니다.
--   - service_role key (비밀, sb_secret_...) : ★ RLS 자체를 통째로 우회하는 마스터 키 ★.
--     정책이 뭐든 무시하고 다 됩니다. 그래서 절대! 브라우저·코드·깃허브에 올리면 안 되고,
--     오직 서버(예: n8n, 백엔드)에서만 비밀로 보관해 씁니다.
-- =====================================================================
