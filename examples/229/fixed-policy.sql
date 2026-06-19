-- 실습 229: 고친 SQL 정책 (보안 리뷰 결과 반영)
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 실행하세요.
--
-- 핵심 수정 3가지
--   (가) RLS(행 수준 보안)를 켰다 → 공개키가 노출돼도 테이블이 통째로 안 털린다.
--   (나) "아무나 전체 읽기"를 없애고, 본인 행만 읽도록 좁혔다 → 명단 통째 조회 차단.
--   (다) 수정/삭제도 본인 것만 가능하게 좁혔다.

-- 1) 회원 테이블 (개인정보 포함)
--    로그인한 사용자(auth.users)와 연결하기 위해 user_id 컬럼을 둔다.
--    references auth.users: "이 행은 누구 것인지"를 로그인 사용자에 묶는다(없으면 본인 행 구분이 불가).
--    default auth.uid(): 새 행을 넣을 때 user_id를 비워도 "지금 로그인한 사람"으로 자동 채워,
--                        실수로 남의 id를 넣거나 빈칸으로 두는 사고를 막는다.
create table if not exists members (
  id          bigint generated always as identity primary key,
  user_id     uuid not null references auth.users (id) default auth.uid(),
  name        text not null,
  phone       text not null,
  email       text not null,
  created_at  timestamptz default now()
);

-- 2) ✅ RLS 켜기 (이게 빠져 있던 게 가장 큰 구멍이었다)
alter table members enable row level security;

-- 3) ✅ 읽기: "아무나 전체"가 아니라 "로그인한 본인 행만"
--    auth.uid() = 지금 로그인한 사람의 id. 내 행만 통과한다.
create policy "본인 회원정보만 읽기" on members
  for select
  using (auth.uid() = user_id);

-- 4) ✅ 작성: 로그인한 사람이, 자기 user_id 로만 추가 가능
create policy "본인으로만 등록" on members
  for insert
  with check (auth.uid() = user_id);

-- 5) ✅ 수정/삭제: 본인 행만
create policy "본인 것만 수정" on members
  for update
  using (auth.uid() = user_id);

create policy "본인 것만 삭제" on members
  for delete
  using (auth.uid() = user_id);

-- 참고)
-- ▶ 회원 명단 전체를 봐야 하는 "관리자 기능"이 정말 필요하다면,
--    그건 프론트가 아니라 서버(에서만)에서 service_role(sb_secret_) 키로 처리한다.
--    service_role 키는 절대 HTML/프론트 JS/NEXT_PUBLIC_ 에 두지 않는다.
-- ▶ 위 정책을 적용한 뒤, 기존의 "전체 공개 읽기 / 아무나 쓰기·수정·삭제" 정책이
--    남아 있다면 반드시 삭제해야 한다 (정책은 OR로 합쳐지므로 하나만 열려도 뚫린다):
--    drop policy "전체 공개 읽기" on members;
--    drop policy "아무나 쓰기"   on members;
--    drop policy "아무나 수정"   on members;
--    drop policy "아무나 삭제"   on members;
