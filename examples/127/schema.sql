-- =====================================================================
-- 실습 127 — 가계부를 Supabase로 옮기고 '분류별 합계 + 월별 필터' 만들기
-- =====================================================================
-- 앞선 실습(할 일/방명록)에서 insert·select·order·ilike를 배웠습니다.
-- 이번에는 '가계부(지출 내역)'를 expenses 표로 옮긴 뒤,
--   1) 받은 데이터를 화면에서 '분류별 합계'로 묶어 보여 주고(reduce),
--   2) '월별 필터'를 날짜 범위(gte/lte)로 걸어 그 달치만 받아옵니다.
--
-- ★ 이번 실습의 두 가지 핵심 ★
--   (1) 날짜 범위 필터: .gte('spent_on', 시작일).lte('spent_on', 끝일)
--       gte = greater than or equal = "이 날짜보다 크거나 같다(>=)"
--       lte = less than or equal    = "이 날짜보다 작거나 같다(<=)"
--       → 두 개를 같이 쓰면 '시작일 ~ 끝일' 사이의 줄만 받아옵니다(그 달치).
--   (2) 집계(합계)는 '화면(자바스크립트)에서 reduce'로 계산합니다.
--       서버는 '그 달 지출 목록'만 주고, 분류별로 합치는 건 브라우저가 합니다.
--
-- 사용법:
--   Supabase 대시보드 왼쪽 메뉴 > SQL Editor > New query 에
--   아래 내용을 통째로 붙여넣고 오른쪽 위 [Run] 버튼을 누르세요.
--   (1~4단계가 한 번에 실행됩니다. 여러 번 실행해도 안전하게 만들어 뒀습니다.)
-- =====================================================================


-- =====================================================================
-- 1단계) expenses(지출) 표 만들기
-- =====================================================================
--   id          : 줄(row)을 구별하는 고유 번호. 서버가 1, 2, 3... 자동으로 매깁니다.
--   item        : 무엇에 썼는지 (예: '점심 김밥'). 비어 있으면 안 되므로 not null.
--   category    : 분류 (예: '식비', '교통', '문화'). 분류별 합계를 낼 기준입니다.
--   amount      : 금액(원). 0보다 커야 하므로 check 로 막아 둡니다.
--   spent_on    : 지출한 '날짜' (시각이 아니라 날짜만). 월별 필터의 기준이 됩니다.
--   created_at  : 줄을 만든 시각. 서버가 자동으로 '지금 시각'을 넣습니다(now()).
create table if not exists public.expenses (
  id          bigint      generated always as identity primary key,
  item        text        not null,
  category    text        not null,
  amount      integer     not null check (amount > 0),
  spent_on    date        not null default current_date,
  created_at  timestamptz not null default now()
);


-- =====================================================================
-- 2단계) RLS(행 수준 보안) 켜기
-- =====================================================================
-- RLS = Row Level Security. "표의 줄 하나하나마다 출입 통제를 건다"는 뜻입니다.
-- 켜면 '정책(policy)으로 허락한 동작'만 가능합니다(기본은 전부 거절).
alter table public.expenses enable row level security;


-- =====================================================================
-- 3단계) 읽기/쓰기 정책 추가하기
-- =====================================================================
-- 이 실습은 '혼자 쓰는 연습용 공개 가계부'라 누구나 읽기/쓰기를 허용합니다.
-- (실제 서비스라면 '로그인한 본인 줄만' 보이게 정책을 더 좁혀야 합니다.)

-- (읽기) 누구나 지출 목록을 볼 수 있게 허용 ----------------------------
drop policy if exists "anyone can read expenses" on public.expenses;
create policy "anyone can read expenses"
  on public.expenses
  for select              -- '읽기(select)' 동작에만 적용
  to anon, authenticated  -- 비로그인 손님(anon) + 로그인 사용자 모두
  using (true);           -- 어떤 줄을 보여줄지 조건. true = 전부 공개

-- (쓰기) 누구나 지출을 추가할 수 있게 허용 ----------------------------
drop policy if exists "anyone can insert expenses" on public.expenses;
create policy "anyone can insert expenses"
  on public.expenses
  for insert              -- '쓰기(insert)' 동작에만 적용
  to anon, authenticated
  with check (true);      -- 새로 들어오는 줄을 검사하는 조건. true = 전부 허용


-- =====================================================================
-- 4단계) (선택) 화면에 보여 줄 예시 지출 몇 개 미리 넣기
-- =====================================================================
-- 이미 데이터가 있으면 건너뜁니다(여러 번 실행해도 중복으로 쌓이지 않게).
-- 날짜는 '오늘 기준'으로 이번 달/지난 달에 골고루 깔아 둬서 월별 필터를 바로 체험할 수 있게 합니다.
insert into public.expenses (item, category, amount, spent_on)
select x.item, x.category, x.amount, x.spent_on
from (values
  ('점심 김밥',    '식비',   6500,  date_trunc('month', current_date)::date + 2),
  ('지하철 교통비', '교통',   1400,  date_trunc('month', current_date)::date + 2),
  ('카페 아메리카노','식비',  4500,  date_trunc('month', current_date)::date + 5),
  ('영화 관람',    '문화',  14000, date_trunc('month', current_date)::date + 9),
  ('마트 장보기',  '생활',  32000, date_trunc('month', current_date)::date + 12),
  ('지난달 책 구매','문화',  18000, (date_trunc('month', current_date) - interval '1 month')::date + 10)
) as x(item, category, amount, spent_on)
where not exists (select 1 from public.expenses);


-- =====================================================================
-- [보안 안내 — anon(공개) vs service_role(비밀)]
--   - anon key (공개 키, sb_publishable_...) : script.js·브라우저·깃허브에 올려도
--     되는 '출입증'. RLS 정책의 통제를 받으므로 공개해도 안전합니다.
--     → 이번 실습 script.js 에는 반드시 이 anon 키만 넣습니다.
--   - service_role key (비밀, sb_secret_...) : ★ RLS를 통째로 우회하는 마스터 키 ★.
--     절대! 브라우저·코드·깃허브에 올리면 안 됩니다(서버에서만 비밀로 사용).
-- =====================================================================
