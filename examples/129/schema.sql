-- =====================================================================
-- 실습 129 — 배포용 방명록 CRUD (guestbook 표 + RLS + 정책)
-- =====================================================================
-- 이 실습(129)은 "이미 만든 CRUD 앱을 Vercel로 공개 배포하기"가 핵심입니다.
-- 표 자체는 실습 116~125에서 쓰던 것과 '같은 guestbook 표'를 그대로 씁니다.
--   이미 그 표를 만들어 둔 적이 있다면 이 파일을 다시 실행하지 않아도 됩니다.
--   (아래는 `if not exists` 라서 또 실행해도 안전합니다 — 이미 있으면 그냥 넘어감)
--
-- 사용법:
--   Supabase 대시보드 왼쪽 메뉴 > SQL Editor > New query 에
--   이 파일 내용을 통째로 붙여넣고 오른쪽 위 [Run] 버튼을 누르세요.
--
-- ★ 이 실습은 '공개 배포'가 목표이므로, 처음부터 RLS를 켜고
--   '누구나 읽기/쓰기/삭제' 정책을 함께 답니다.
--   (실제 서비스에서는 '본인 글만 삭제' 같은 더 엄격한 정책으로 좁혀야 합니다 — 심화)
-- =====================================================================

-- 1) guestbook 표 만들기 ----------------------------------------------
-- 컬럼(=표의 세로 칸):
--   id         : 글마다 자동으로 붙는 고유 번호 (절대 안 겹침, 기본키)
--   name       : 글쓴이 이름 (빈 값 금지)
--   message    : 메시지 내용 (빈 값 금지)
--   created_at : 글이 만들어진 시각 (자동으로 '지금'이 채워짐)
create table if not exists public.guestbook (
  id          bigint generated always as identity primary key,
  name        text        not null,
  message     text        not null,
  created_at  timestamptz not null default now()
);

comment on table  public.guestbook            is '방명록 글 저장 테이블 (실습 116~129 공용)';
comment on column public.guestbook.id         is '글 고유 번호(자동 증가, 기본키)';
comment on column public.guestbook.name       is '글쓴이 이름(필수)';
comment on column public.guestbook.message    is '메시지 내용(필수)';
comment on column public.guestbook.created_at is '글이 작성된 시각(자동 기록)';

-- 2) RLS(행 수준 보안) 켜기 -------------------------------------------
-- RLS를 켜면, 정책(policy)으로 '허락'한 동작만 anon(공개) 키로 할 수 있습니다.
-- RLS를 켜고 정책을 안 달면 → 아무것도 안 보이고/안 써집니다(흔한 함정).
alter table public.guestbook enable row level security;

-- 3) 정책(policy) 달기 -------------------------------------------------
-- 방명록은 '누구나' 읽고/쓰고/지울 수 있는 공개 게시판이라 가정합니다.
--   (drop ... if exists 를 먼저 해서, 다시 실행해도 '이미 있다' 에러가 안 나게 함)
drop policy if exists "누구나 읽기"   on public.guestbook;
drop policy if exists "누구나 작성"   on public.guestbook;
drop policy if exists "누구나 삭제"   on public.guestbook;

create policy "누구나 읽기" on public.guestbook
  for select using (true);

create policy "누구나 작성" on public.guestbook
  for insert with check (true);

create policy "누구나 삭제" on public.guestbook
  for delete using (true);

-- 4) (선택) 배포 후 화면에 뭐라도 보이게 예시 글 3개 넣기 -------------
-- 이미 글이 있으면 이 부분은 지우거나 그대로 둬도 됩니다(중복돼도 무방).
insert into public.guestbook (name, message)
values
  ('운영자', '드디어 인터넷에 공개됐어요! 🎉'),
  ('첫 손님', '배포 축하합니다. 잘 보고 가요.'),
  ('지나가던 1인', '환경변수로 키 관리하는 거 멋지네요.');

-- =====================================================================
-- [보안 안내] 화면(브라우저) 코드에 들어가는 키와 절대 넣으면 안 되는 키
--
--   - anon key (공개 키, sb_publishable_...) : 브라우저에 노출돼도 되는 '출입증'.
--     RLS + 위 정책이 켜져 있어서, 이 키로는 '허락한 동작'만 할 수 있습니다.
--     → 이 실습에서 config.js / Vercel 환경변수에 넣는 키가 바로 이것입니다.
--
--   - service_role key (비밀, sb_secret_...) : RLS를 통째로 우회하는 '마스터 키'.
--     ★ 절대 화면 코드·config.js·깃허브·Vercel의 'NEXT_PUBLIC_/공개되는 곳'에
--       넣으면 안 됩니다. 브라우저에 노출되는 순간 누구나 데이터를 마음대로 만집니다.
--     → service_role 은 오직 '서버에서만' 쓰며, 이 정적 사이트 실습에서는 아예 쓰지 않습니다.
--
-- 즉, anon 키는 '공개돼도 안전하게 설계'한 키이고,
-- 환경변수로 분리하는 진짜 이유는 "키를 숨기려는 것"보다
-- "코드와 설정값을 깔끔히 분리해 실제 서비스처럼 운영하는 습관"을 익히는 데 있습니다.
-- (service_role 같은 진짜 비밀값이 생겼을 때 그 습관이 그대로 안전장치가 됩니다.)
-- =====================================================================
