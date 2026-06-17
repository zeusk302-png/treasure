-- =====================================================================
-- 실습 252 — 주문(orders) 테이블 만들기
-- =====================================================================
-- index.html / script.js 가 주문을 저장할 '표'를 먼저 만들어야 합니다.
-- 이 표가 없으면 insert가 실패합니다.
--
-- 사용법:
--   Supabase 대시보드 왼쪽 메뉴 > SQL Editor > New query 에
--   아래 내용을 통째로 붙여넣고 오른쪽 위 [Run] 버튼을 누르세요.
-- =====================================================================

-- orders 표 만들기 -----------------------------------------------------
-- "주문 한 건"을 표의 한 줄(row)로 저장합니다.
-- 핵심 아이디어: 장바구니에 담긴 여러 상품을 한 칸(items)에 통째로 담아
--               '한 번의 주문'으로 묶어 저장합니다.
--
-- 컬럼(=표의 세로 칸):
--   id            : 주문 한 건마다 자동으로 붙는 고유 번호 = '주문번호' (기본키)
--   customer_name : 주문한 사람 이름. 빈 값은 못 들어가게 막음
--   phone         : 연락처(배송 안내용). 빈 값은 못 들어가게 막음
--   items         : 장바구니에 담긴 상품 목록을 통째로 담는 칸 (JSON 형태)
--                   예) [{"name":"아메리카노","price":4500,"qty":2}, ...]
--   total_price   : 주문 총금액(원). 0 이상만 허용
--   created_at    : 주문이 들어온 시각. 자동으로 '지금'이 채워짐
create table if not exists public.orders (
  id            bigint generated always as identity primary key,
  customer_name text        not null,
  phone         text        not null,
  items         jsonb       not null,
  total_price   integer     not null check (total_price >= 0),
  created_at    timestamptz not null default now()
);

-- 컬럼에 설명 달기(선택) -----------------------------------------------
comment on table  public.orders               is '실습 252: 쇼핑몰 주문 저장 테이블';
comment on column public.orders.id            is '주문번호(자동 증가, 기본키)';
comment on column public.orders.customer_name is '주문자 이름(필수)';
comment on column public.orders.phone         is '주문자 연락처(필수)';
comment on column public.orders.items         is '장바구니 상품 목록(JSON 배열: name/price/qty)';
comment on column public.orders.total_price   is '주문 총금액(원, 0 이상)';
comment on column public.orders.created_at    is '주문이 들어온 시각(자동 기록)';

-- =====================================================================
-- [보안 안내] 이 미니프로젝트(252)는 '여러 데이터를 묶어 한 줄로 저장하는'
-- 흐름을 체험하는 데 집중합니다.
--
--   - anon key (공개 키, sb_publishable_...) : 화면(브라우저) 코드에 넣어도
--     되는 '출입증'. script.js에 넣는 것이 바로 이 키입니다.
--   - service_role key (비밀, sb_secret_...) : 모든 보안을 우회하는 '마스터 키'.
--     절대 화면/코드/깃허브에 올리면 안 됩니다.
--
-- 공개 키(anon)를 안전하게 쓰는 핵심 장치가 RLS(행 수준 보안)입니다.
-- 진짜 쇼핑몰처럼 공개 서비스로 올리기 전에는 반드시 RLS를 켜고 정책을 다세요.
-- (주문은 보통 "손님은 만들기만, 읽기는 주인만" 처럼 정책을 다르게 줍니다.)
--
-- 참고: RLS를 지금 켜 보고 싶다면 아래 2줄의 주석을 푸세요.
-- (정책 없이 RLS만 켜면 insert가 막히므로, '누구나 주문 넣기' 정책도 함께 추가합니다.)
--
-- alter table public.orders enable row level security;
-- create policy "누구나 주문 넣기" on public.orders for insert with check (true);
-- =====================================================================
