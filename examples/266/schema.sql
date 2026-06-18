-- 실습 266: 검색·정렬·페이지네이션 테이블 대시보드용 샘플 데이터
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 [Run] 으로 실행하세요.
--
-- 핵심 한 줄: "큰 목록"을 한 번에 다 불러오면 느립니다.
--            그래서 (1) 검색으로 좁히고 (2) 정렬로 줄 세우고 (3) 페이지네이션으로 나눠서 불러옵니다.
--            이 파일은 그걸 연습할 "주문 목록(orders)" 가짜 데이터 120개를 만듭니다.

-- 1) 주문 테이블
--    대시보드에서 흔히 보는 "표" 한 줄이 곧 한 개의 주문입니다.
create table if not exists orders (
  id          bigint generated always as identity primary key,
  customer    text not null,        -- 고객 이름 (검색 대상)
  product     text not null,        -- 상품 이름 (검색 대상)
  amount      integer not null,     -- 결제 금액 (정렬 대상)
  status      text not null,        -- 주문 상태: 결제완료 / 배송중 / 배송완료 / 취소
  created_at  timestamptz not null default now()  -- 주문 시각 (정렬 대상)
);

-- 2) RLS 켜기 + "누구나 읽기만" 정책
--    이 대시보드는 "보여주기 전용(읽기)"이라, 공개 키(anon)로 select 만 허용합니다.
--    추가·수정·삭제 정책은 일부러 안 만들었습니다 → 표를 망가뜨릴 수 없으니 연습이 안전합니다.
alter table orders enable row level security;

drop policy if exists "누구나 주문 읽기" on orders;
create policy "누구나 주문 읽기"
  on orders for select
  using ( true );

-- 3) 가짜 주문 120개 자동 생성
--    실제 형식과 닮지 않은 "연습용" 이름/상품을 무작위로 섞어 넣습니다.
--    (이미 데이터가 있으면 아래를 건너뛰어도 됩니다. 두 번 돌리면 240개가 됩니다.)
insert into orders (customer, product, amount, status, created_at)
select
  (array['김하나','이두리','박세찬','최가람','정누리','한별','오다온','윤마루','임소망','강한결'])[1 + floor(random()*10)::int]
    || (10 + floor(random()*89)::int)::text,                                  -- 예: 김하나42
  (array['연필세트','노트북파우치','텀블러','블루투스이어폰','무선마우스','책상매트','독서대','캔들','에코백','USB허브'])[1 + floor(random()*10)::int],
  (5 + floor(random()*45)::int) * 1000,                                       -- 5,000 ~ 49,000원
  (array['결제완료','배송중','배송완료','취소'])[1 + floor(random()*4)::int],
  now() - (floor(random()*90)::int || ' days')::interval                      -- 최근 90일 사이 아무 날짜
from generate_series(1, 120);

-- 확인 포인트:
--  - Table Editor → orders 에 120개 행이 보이면 성공입니다.
--  - 이 표는 읽기만 됩니다(공개 키로 추가/삭제 불가) → 화면 코드에 집중하기 좋습니다.
--  - service_role(secret) 키는 이 RLS 를 통째로 무시합니다 → 절대 브라우저/깃허브에 두지 마세요.
