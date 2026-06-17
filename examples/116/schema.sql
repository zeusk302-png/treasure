-- =====================================================================
-- 실습 116 — 방명록(guestbook) 테이블 만들기
-- =====================================================================
-- index.html / script.js 가 글을 저장할 '표'를 먼저 만들어야 합니다.
-- 이 표가 없으면 insert가 실패합니다.
--
-- 사용법:
--   Supabase 대시보드 왼쪽 메뉴 > SQL Editor > New query 에
--   아래 내용을 통째로 붙여넣고 오른쪽 위 [Run] 버튼을 누르세요.
-- =====================================================================

-- guestbook 표 만들기 --------------------------------------------------
-- 컬럼(=표의 세로 칸) 4개:
--   id         : 글 한 줄마다 자동으로 붙는 고유 번호 (절대 안 겹침, 기본키)
--   name       : 글쓴이 이름. 빈 값은 못 들어가게 막음
--   message    : 메시지 내용. 빈 값은 못 들어가게 막음
--   created_at : 이 줄이 만들어진 시각. 자동으로 '지금'이 채워짐
create table if not exists public.guestbook (
  id          bigint generated always as identity primary key,
  name        text        not null,
  message     text        not null,
  created_at  timestamptz not null default now()
);

-- 컬럼에 설명 달기(선택) -----------------------------------------------
comment on table  public.guestbook            is '실습 116: 방명록 글 저장 테이블';
comment on column public.guestbook.id         is '글 고유 번호(자동 증가, 기본키)';
comment on column public.guestbook.name       is '글쓴이 이름(필수)';
comment on column public.guestbook.message    is '메시지 내용(필수)';
comment on column public.guestbook.created_at is '글이 작성된 시각(자동 기록)';

-- =====================================================================
-- [보안 안내] 이 실습(116)에서는 insert가 통하는지 '체험'에 집중합니다.
--
--   - anon key (공개 키, sb_publishable_...) : 화면(브라우저) 코드에 넣어도
--     되는 '출입증'. script.js에 넣는 것이 바로 이 키입니다.
--   - service_role key (비밀, sb_secret_...) : 모든 보안을 우회하는 '마스터 키'.
--     절대 화면/코드/깃허브에 올리면 안 됩니다.
--
-- 공개 키(anon)를 안전하게 쓰는 핵심 장치가 RLS(행 수준 보안)입니다.
-- 실제 공개 서비스로 올리기 전에는 반드시 RLS를 켜고 정책을 다세요.
-- 본격적으로 켜는 법은 실습 119에서 다룹니다.
--
-- 참고: RLS를 지금 켜 보고 싶다면 아래 3줄의 주석을 푸세요.
-- (정책 없이 RLS만 켜면 insert가 막히므로, '누구나 작성' 정책도 함께 추가합니다.)
--
-- alter table public.guestbook enable row level security;
-- create policy "누구나 읽기" on public.guestbook for select using (true);
-- create policy "누구나 작성" on public.guestbook for insert with check (true);
-- =====================================================================
