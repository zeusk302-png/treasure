-- =====================================================================
-- 실습 122 — 할 일 삭제 delete로 서버에서 지우기 (todos 표에 '삭제' 권한 추가)
-- =====================================================================
-- 120번: 추가(insert) + 목록 보기(select)
-- 121번: 완료 토글(update) 추가
-- 122번(이번): 삭제(delete) 추가 → 이로써 CRUD(만들고·읽고·고치고·지우기)가 완성됩니다.
--
-- ★ 왜 SQL을 또 실행하나요? ★
--   RLS(행 수준 보안)는 '정책으로 허락한 동작만' 통과시킵니다(기본은 전부 거절).
--   121번까지는 select·insert·update 정책만 만들었기 때문에, delete는 자동으로 막혀 있습니다.
--   그래서 이번에 'delete 정책'을 하나 더 추가해야 삭제 버튼이 서버에 반영됩니다.
--
-- 사용법:
--   Supabase 대시보드 왼쪽 메뉴 > SQL Editor > New query 에
--   아래 내용을 통째로 붙여넣고 오른쪽 위 [Run] 버튼을 누르세요.
--   (120·121번을 이미 실행했다면, 1~4단계는 '이미 있으면 건너뛰기'라 안전합니다.
--    여러 번 실행해도 문제없게 만들어 뒀습니다.)
-- =====================================================================


-- =====================================================================
-- 1단계) todos 표 (120번에서 이미 만들었다면 그대로 둠)
-- =====================================================================
--   id          : 줄(row)을 구별하는 고유 번호. 서버가 1, 2, 3... 자동으로 매깁니다.
--                 → 이번 실습의 주인공! delete할 때 "이 id의 줄만 지워라"라고 콕 집습니다.
--   text        : 할 일 내용
--   done        : 완료 여부. 기본값 false.
--   created_at  : 만든 시각. 서버가 자동으로 넣습니다.
create table if not exists public.todos (
  id          bigint generated always as identity primary key,
  text        text        not null,
  done        boolean     not null default false,
  created_at  timestamptz not null default now()
);


-- =====================================================================
-- 2단계) RLS(행 수준 보안) 켜기 (120번에서 이미 켰다면 그대로 둠)
-- =====================================================================
alter table public.todos enable row level security;


-- =====================================================================
-- 3단계) 읽기·쓰기 정책 (120번 것 그대로 유지) — 한 번 더 실행해도 안전
-- =====================================================================
-- (읽기) 누구나 목록을 볼 수 있게 허용
drop policy if exists "anyone can read todos" on public.todos;
create policy "anyone can read todos"
  on public.todos
  for select
  to anon, authenticated
  using (true);

-- (쓰기) 누구나 할 일을 추가할 수 있게 허용
drop policy if exists "anyone can insert todos" on public.todos;
create policy "anyone can insert todos"
  on public.todos
  for insert
  to anon, authenticated
  with check (true);


-- =====================================================================
-- 4단계) 수정(update) 정책 (121번 것 그대로 유지) — 한 번 더 실행해도 안전
-- =====================================================================
drop policy if exists "anyone can update todos" on public.todos;
create policy "anyone can update todos"
  on public.todos
  for update
  to anon, authenticated
  using (true)
  with check (true);


-- =====================================================================
-- ★ 5단계) 이번 실습의 핵심 — 누구나 할 일을 '삭제(delete)'할 수 있게 허용 ★
-- =====================================================================
-- 이 정책이 있어야 script.js의
--     db.from("todos").delete().eq("id", id)
-- 가 막히지 않고 서버에서 행을 지웁니다.
--
--   using : '어떤 줄을 삭제 대상으로 삼을지' 조건.
--           true = 모든 줄을 삭제 대상으로 허용.
--   ※ delete에는 with check가 없습니다(지운 뒤 남는 줄이 없으므로 검사할 결과 줄도 없음).
--     '대상을 고르는' using 조건만 있습니다.
drop policy if exists "anyone can delete todos" on public.todos;
create policy "anyone can delete todos"
  on public.todos
  for delete                -- '삭제(delete)' 동작에만 적용
  to anon, authenticated    -- 비로그인 손님(anon) + 로그인 사용자 모두
  using (true);             -- 삭제할 줄을 고르는 조건. true = 전부 대상


-- =====================================================================
-- (참고) 이제 todos 표는 select·insert·update·delete 4개 정책을 모두 갖췄습니다.
--   = CRUD(Create·Read·Update·Delete) 완성!
--   정책이 없는 동작은 자동으로 막히므로(기본 거절), 4개 외 동작은 여전히 차단됩니다.
-- =====================================================================


-- =====================================================================
-- [보안 안내 — anon(공개) vs service_role(비밀)]
--   - anon key (공개 키, sb_publishable_...) : script.js·브라우저·깃허브에 올려도
--     되는 '출입증'. RLS 정책의 통제를 그대로 받기 때문에 공개해도 안전합니다.
--     → 이번 실습 script.js에는 반드시 이 anon 키만 넣습니다.
--   - service_role key (비밀, sb_secret_...) : ★ RLS를 통째로 우회하는 마스터 키 ★.
--     절대! 브라우저·코드·깃허브에 올리면 안 됩니다(서버에서만 비밀로 사용).
--
--   ※ delete는 한 번 지우면 되돌릴 수 없는 위험한 동작입니다. 그래서 코드에서는
--     실수 방지용으로 confirm("정말 삭제할까요?")을 먼저 띄웁니다(자세한 건 README).
--   ※ 이번 실습에서 'delete를 누구나 허용'한 것은 학습용입니다. 실제 서비스라면
--     '로그인한 본인이 쓴 줄만 삭제 가능'처럼 조건을 좁히는 것이 안전합니다(추후 학습).
-- =====================================================================
