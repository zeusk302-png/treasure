-- 실습 303: 개인정보 최소 수집 — 안 쓰는 칼럼을 테이블에서 통째로 지우기 (데이터 다이어트)
--
-- Supabase 대시보드 → SQL Editor 에서 "1단계 → 2단계 → 3단계" 순서로,
-- 한 덩어리씩 잘라서 실행하세요.
--
-- 핵심 한 줄: 폼에서만 항목을 지우면, 테이블에는 빈 칸으로 남아 "받을 수 있는 상태"가 유지됩니다.
--            진짜 최소 수집은 "받을 곳(테이블 칼럼)" 자체를 없애는 것입니다.
--            칼럼이 없으면, 누가 실수로 INSERT 해도 들어갈 자리가 없어 수집이 원천 차단됩니다.


-- =====================================================================
-- 1단계) ❌ 고치기 전(Before) — "일단 다 받아두자"로 만들어진 비만 테이블
--        (이미 이런 테이블이 있다고 가정합니다. 없으면 이 블록을 먼저 실행해 재현하세요.)
-- =====================================================================

create table if not exists members (
  id              bigint generated always as identity primary key,
  name            text not null,            -- ✅ 필요 (호칭/식별)
  email           text not null unique,     -- ✅ 필요 (로그인 ID·연락)
  -- 아래부터는 "받아는 뒀지만 실제로 안 쓰는" 위험한 항목들 -----------------
  resident_no     text,                     -- ❌ 주민등록번호: 원칙적 수집 금지 대상
  birth_date      date,                     -- ❌ 생년월일: 현재 기능에서 안 씀
  address         text,                     -- ❌ 집 주소: 배송 없는 서비스라 불필요
  phone           text,                     -- ❌ 휴대폰: 이메일로 연락 충분
  gender          text,                     -- ❌ 성별: 개인화 미사용
  created_at      timestamptz default now()
);

-- 👉 문제: 안 쓰는 민감정보 5칸이 "받을 수 있는 상태"로 열려 있습니다.
--    모으는 순간부터 유출 시 책임이 따라붙습니다. (모은 만큼 책임이 커진다)


-- =====================================================================
-- 2단계) ✅ 고친 뒤(After) — 안 쓰는 칼럼을 "칼럼째" 삭제하기
--        DROP COLUMN 으로 받을 자리 자체를 없앱니다 → 수집 원천 차단
-- =====================================================================

-- ⚠️ 주의: ALTER TABLE ... DROP COLUMN 은 그 칼럼의 데이터를 "영구 삭제"합니다.
--          실습용 테이블이라 바로 지워도 되지만, 실서비스라면 백업/영향 확인 후 진행하세요.
--          (오래된 개인정보를 의도적으로 파기하는 것은 최소 수집·보관기간 원칙상 오히려 권장됩니다.)

alter table members drop column if exists resident_no;   -- 주민번호 받을 자리 제거
alter table members drop column if exists birth_date;    -- 생년월일 받을 자리 제거
alter table members drop column if exists address;       -- 주소 받을 자리 제거
alter table members drop column if exists phone;         -- 전화 받을 자리 제거
alter table members drop column if exists gender;        -- 성별 받을 자리 제거

-- 👉 이제 members 에는 id / name / email / created_at 만 남습니다.
--    누가 실수로 resident_no 를 INSERT 하려 해도 "그런 칼럼 없음" 오류가 나서
--    민감정보 수집이 코드 단계에서 막힙니다.


-- =====================================================================
-- (보너스) 보안 마무리 — RLS를 켜서 "본인 줄만" 다루게 하기
--        최소 수집(덜 모으기)과 RLS(모은 건 본인만 보기)는 한 세트입니다.
-- =====================================================================

alter table members enable row level security;

-- 회원 본인만 자기 정보 조회 (auth.uid() = 그 줄의 주인)
-- members.id 를 auth.users 와 연결해 쓰는 구조라면 정책 식은 프로젝트에 맞게 조정하세요.
-- create policy "본인 정보만 조회" on members for select using (auth.uid() = auth_user_id);


-- =====================================================================
-- 3단계) 검증 — 안 쓰는 칼럼이 정말 사라졌는지 확인
-- =====================================================================

-- members 의 현재 칼럼 목록을 봅니다. resident_no/birth_date/address/phone/gender 가
-- "한 줄도 안 나와야" 정상입니다. (id, name, email, created_at 4줄만 나오면 성공)
select column_name, data_type
from information_schema.columns
where table_name = 'members'
order by ordinal_position;
