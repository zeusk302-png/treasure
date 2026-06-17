-- 실습 229: 검사할 SQL 정책 (일부러 위험하게 만든 재료)
-- ⚠️ 이건 "고치기 전" 상태입니다. 그대로 쓰면 위험합니다.
-- prompt.md의 보안 체크리스트로 AI에게 이 정책을 심문시키는 연습용입니다.

-- 1) 회원 테이블 (개인정보가 들어 있다: 이름·전화·이메일)
create table if not exists members (
  id          bigint generated always as identity primary key,
  name        text not null,
  phone       text not null,
  email       text not null,
  created_at  timestamptz default now()
);

-- ❌ 함정 A: RLS(행 수준 보안)를 켜지 않았다.
--    RLS가 꺼져 있으면 공개키(anon)만으로도 테이블 전체가 읽힌다.
--    (enable row level security 줄이 통째로 빠져 있음)

-- ❌ 함정 B: 설령 RLS를 켰더라도, 아래 정책은 "아무나 전체 읽기"라
--    개인정보 명단이 통째로 노출된다. (using (true) = 모두 허용)
create policy "전체 공개 읽기" on members
  for select using (true);

-- ⚠️ 함정 C: 작성/수정/삭제도 아무나 가능하게 열려 있다.
--    (본인 것만 / 관리자만 같은 제한이 없다)
create policy "아무나 쓰기"   on members for insert with check (true);
create policy "아무나 수정"   on members for update using (true);
create policy "아무나 삭제"   on members for delete using (true);
