-- 실습 300: Supabase 테이블에 RLS 켜기 — 끄면 어떻게 새는지 먼저 확인
-- Supabase 대시보드 → SQL Editor 에 아래를 "1단계 → 2단계 → 3단계" 순서로,
-- 한 덩어리씩 잘라서 실행하세요. (전체를 한 번에 실행하면 "새는 모습"을 못 봅니다.)
--
-- 핵심 한 줄: 공개(publishable) 키가 안전한 진짜 이유는 "키를 숨겨서"가 아니라
--            "RLS(행 수준 보안)가 막아줘서"입니다. 그걸 눈으로 확인하는 실습입니다.


-- =====================================================================
-- 1단계) 일부러 RLS를 "끈 채로" 테이블을 만든다 (취약한 상태)
--        → 이 상태에서 공개 키로 통째로 읽히는 걸 먼저 본다.
-- =====================================================================

-- 회원 비상연락처처럼 "원래는 새면 안 되는" 데이터라고 상상하세요.
create table if not exists secret_notes (
  id          bigint generated always as identity primary key,
  owner_name  text not null,         -- 작성자 이름
  phone       text not null,         -- 전화번호 (절대 새면 안 되는 값)
  memo        text not null,         -- 내용
  created_at  timestamptz default now()
);

-- 확인용 샘플 데이터 3줄 (실제 비밀번호/실번호 넣지 마세요. 자리표시자입니다)
insert into secret_notes (owner_name, phone, memo) values
  ('민지', '010-0000-0001', '내 카드 비밀번호 메모 (예시)'),
  ('준호', '010-0000-0002', '집 현관 도어락 번호 (예시)'),
  ('서연', '010-0000-0003', '회사 와이파이 비번 (예시)');

-- ⚠️ 여기서 일부러 alter table ... enable row level security 를 "하지 않았습니다".
--    Supabase 대시보드 Table Editor 에서 이 테이블 옆에 "RLS Disabled"(빨간 경고)가
--    뜨는지 확인하세요. 지금이 바로 "새는 상태"입니다.
--
-- 👉 이제 index.html 을 publishable(anon) 키로 열어 [조회] 버튼을 누르면,
--    secret_notes 의 전화번호 3줄이 그대로 다 읽힙니다. (1번 캡처 = "새는 증거")


-- =====================================================================
-- 2단계) RLS를 "켠다" → 같은 공개 키로 다시 조회하면 한 줄도 안 보인다.
-- =====================================================================

-- RLS를 켜면, "허용 정책(policy)"이 따로 없는 한 기본값은 "전부 차단"입니다.
-- 즉, 켜기만 해도 secret_notes 는 공개 키로 0줄이 됩니다.
alter table secret_notes enable row level security;

-- 👉 index.html 로 돌아가 다시 [조회] → 이제 "0줄 / 빈 목록"이 나옵니다.
--    (2번 캡처 = "RLS가 막은 증거"). 키는 똑같은데 결과가 달라진 게 포인트입니다.


-- =====================================================================
-- 3단계) "원래 공개여도 되는 데이터"는 정책으로 딱 필요한 만큼만 연다
--        → RLS는 "전부 잠그기"가 아니라 "필요한 행만 열기"라는 걸 익힌다.
-- =====================================================================

-- 공개 게시판처럼 "누구나 읽어도 되는" 별도 테이블을 만들어 비교합니다.
create table if not exists public_posts (
  id          bigint generated always as identity primary key,
  title       text not null,
  body        text not null,
  created_at  timestamptz default now()
);

insert into public_posts (title, body) values
  ('첫 공지', '이 글은 누구나 읽어도 됩니다.'),
  ('두 번째 공지', '공개 게시판이라 읽기는 모두 허용합니다.');

-- public_posts 도 RLS를 켠다 (기본은 차단)
alter table public_posts enable row level security;

-- 그런 다음 "읽기만 누구나 허용" 정책을 명시적으로 추가한다.
-- → 이렇게 "의도한 행"만 열리는 것이 RLS의 올바른 사용법입니다.
create policy "공개글 누구나 읽기"
  on public_posts
  for select
  using (true);

-- 👉 index.html 의 [공개글 조회] 버튼으로 public_posts 를 읽으면 2줄이 보입니다.
--    같은 공개 키인데 secret_notes(정책 없음)=0줄, public_posts(읽기 정책)=2줄.
--    "RLS는 키를 막는 게 아니라, 행 단위로 열고 닫는 잠금장치"라는 결론.

-- 참고) using (true) 는 "모든 행을 읽기 허용"이라 공개 게시판에는 맞지만,
--       개인 데이터(secret_notes 같은 것)에 쓰면 사실상 전부 새는 위험한 패턴입니다.
--       "본인 것만"이 필요하면 로그인 후 using (auth.uid() = user_id) 형태로 좁힙니다.
