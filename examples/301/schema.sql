-- 실습 301: "본인 데이터만" RLS 정책 작성하고, 남의 행을 못 읽는지 검증하기
-- (실습 300에서 "RLS를 켜면 0줄이 된다"를 봤다면, 이번엔 "내 것만 보이게" 정책을 씁니다.)
--
-- Supabase 대시보드 → SQL Editor 에 아래를 "1단계 → 2단계 → 3단계" 순서로,
-- 한 덩어리씩 잘라서 실행하세요.
--
-- 핵심 한 줄: auth.uid() 는 "지금 로그인한 사람의 고유 ID"를 돌려줍니다.
--            정책에 using (auth.uid() = user_id) 를 쓰면
--            "그 줄의 주인 == 지금 로그인한 사람" 일 때만 통과시킵니다.
--            → 그래서 A로 로그인하면 A 줄만, B로 로그인하면 B 줄만 보입니다.


-- =====================================================================
-- 1단계) "주인이 누구인지" 기록하는 테이블 만들기
--        → user_id 컬럼이 그 줄의 "소유자 도장" 역할을 합니다.
-- =====================================================================

-- 개인 메모장이라고 상상하세요. 각 줄은 "누가 쓴 메모"인지 user_id 로 표시합니다.
create table if not exists my_notes (
  id          bigint generated always as identity primary key,
  user_id     uuid not null default auth.uid(),   -- 이 줄의 주인 (로그인한 사람 ID가 자동으로 들어감)
  content     text not null,                       -- 메모 내용
  created_at  timestamptz default now()
);

-- RLS를 켭니다. (켜기만 하면 기본값은 "전부 차단" — 실습 300에서 본 그대로)
alter table my_notes enable row level security;

-- ⚠️ 여기까지만 하면 정책이 하나도 없어서, 로그인해도 0줄입니다(전부 차단).
--    아래 2단계에서 "본인 것만" 여는 정책을 추가해야 비로소 내 줄이 보입니다.


-- =====================================================================
-- 2단계) "본인 데이터만" 정책 4종 추가 (SELECT / INSERT / UPDATE / DELETE)
--        → using : "이 줄을 읽거나/지우거나/고칠 수 있나?"를 판단
--          with check : "이 줄을 새로 넣거나/바꾼 결과가 규칙에 맞나?"를 판단
-- =====================================================================

-- (가) 읽기: 내 줄(주인 == 나)만 SELECT 허용
create policy "내 메모만 읽기"
  on my_notes
  for select
  using (auth.uid() = user_id);

-- (나) 쓰기: 새로 넣는 줄의 주인이 "나"일 때만 INSERT 허용
--     → 남의 user_id 로 위장해 끼워 넣는 것을 막습니다.
create policy "내 이름으로만 쓰기"
  on my_notes
  for insert
  with check (auth.uid() = user_id);

-- (다) 수정: 내 줄만 UPDATE 허용 (그리고 수정 후에도 주인은 계속 나여야 함)
create policy "내 메모만 수정"
  on my_notes
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- (라) 삭제: 내 줄만 DELETE 허용
create policy "내 메모만 삭제"
  on my_notes
  for delete
  using (auth.uid() = user_id);

-- 👉 여기까지 실행하면, 로그인한 사람은 "자기 줄"만 보고/넣고/고치고/지울 수 있습니다.
--    user_id 는 default auth.uid() 라서, 메모를 넣을 때 주인 ID가 자동으로 채워집니다.


-- =====================================================================
-- 3단계) (선택) 정책이 잘 걸렸는지 SQL로 확인하기
-- =====================================================================

-- 이 테이블에 걸린 정책 목록을 확인합니다. 4줄(select/insert/update/delete)이 보여야 정상.
select policyname, cmd, qual as using_식, with_check as with_check_식
from pg_policies
where tablename = 'my_notes';

-- ⚠️ 검증은 SQL Editor가 아니라 "실제 로그인한 브라우저"에서 해야 합니다.
--    SQL Editor는 관리자 권한(service_role급)으로 도는 경우가 많아 RLS를 우회할 수 있어
--    "막히는 모습"을 정확히 못 봅니다. 반드시 index.html 을 anon 키로 열어
--    A 계정 / B 계정으로 번갈아 로그인해 검증하세요. (README의 검증법 참고)
