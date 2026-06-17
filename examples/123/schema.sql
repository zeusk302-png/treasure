-- =====================================================================
-- 실습 123 — 방명록(guestbook) 글을 '최신순'으로 정렬해서 보기 (order)
-- =====================================================================
-- 이 실습은 실습 116~117에서 만든 것과 '같은 표(guestbook)'를 사용합니다.
-- 이미 표를 만들었다면 다시 실행할 필요가 없습니다.
--   (아래는 `if not exists` 라서 또 실행해도 안전합니다 — 이미 있으면 그냥 넘어감)
--
-- 표가 아직 없다면, 또는 새 프로젝트라면 이 파일을 실행해 표를 먼저 만드세요.
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
--                ★ 실습 123은 이 created_at 으로 '최신순 정렬'을 합니다.
--                  (.order('created_at', {ascending:false}) → 큰 시각=최신이 위로)
create table if not exists public.guestbook (
  id          bigint generated always as identity primary key,
  name        text        not null,
  message     text        not null,
  created_at  timestamptz not null default now()
);

-- 컬럼에 설명 달기(선택) -----------------------------------------------
comment on table  public.guestbook            is '방명록 글 저장 테이블 (실습 116~125 공용)';
comment on column public.guestbook.id         is '글 고유 번호(자동 증가, 기본키)';
comment on column public.guestbook.name       is '글쓴이 이름(필수, 이름순 정렬 기준)';
comment on column public.guestbook.message    is '메시지 내용(필수)';
comment on column public.guestbook.created_at is '글이 작성된 시각(자동 기록, 최신순 정렬 기준)';

-- (선택) 정렬 효과를 눈으로 확인하려면 시각이 서로 다른 글이 여러 개 있어야 합니다.
-- 아래는 created_at 을 일부러 다르게 넣은 연습용 글 3개입니다.
-- (이미 글이 충분하면 이 부분은 지우거나 그대로 두세요 — 중복돼도 무방)
insert into public.guestbook (name, message, created_at)
values
  ('가나다', '제일 먼저 남긴 글입니다. (가장 오래됨)',  now() - interval '2 hours'),
  ('마바사', '두 번째로 남긴 글입니다.',                now() - interval '1 hour'),
  ('아자차', '방금 막 남긴 글입니다! (가장 최신)',      now());
-- ↑ 최신순(created_at 내림차순)으로 정렬하면 '아자차 → 마바사 → 가나다' 순서로,
--   이름 가나다순(name 오름차순)으로 정렬하면 '가나다 → 마바사 → 아자차' 순서로 보입니다.
--   드롭다운으로 기준을 바꿔 가며 순서가 달라지는 걸 확인하세요.

-- =====================================================================
-- [보안 안내] 123은 117과 마찬가지로 '읽기(select)'가 핵심이며, 거기에
--             '정렬(order)'만 더했습니다. 정렬해도 보안 원칙은 똑같습니다.
--
--   - anon key (공개 키, sb_publishable_...) : 화면(브라우저) 코드에 넣어도
--     되는 '출입증'. script.js에 넣는 것이 바로 이 키입니다.
--   - service_role key (비밀, sb_secret_...) : 모든 보안을 우회하는 '마스터 키'.
--     절대 화면/코드/깃허브에 올리면 안 됩니다.
--
-- 공개 키(anon)로 글이 '보이게' 하려면, 결국 서버가 그 읽기 요청을 허락해야 합니다.
-- 그 허락을 다루는 장치가 RLS(행 수준 보안) + 정책(policy)입니다.
--   - RLS가 꺼져 있으면     → anon 키로도 그냥 다 읽힙니다 (이 실습 단계의 기본 상태).
--   - RLS가 켜져 있는데 정책이 없으면 → select 결과가 '빈 배열 []'로 와서 글이 안 보입니다.
--     (정렬을 바꿔도 어차피 빈 목록 — 에러는 안 나는데 안 보이는 흔한 함정! README 검증법 참고)
--
-- 실제 공개 서비스로 올리기 전에는 반드시 RLS를 켜고 '읽기 허용' 정책을 다세요.
-- 본격적으로 켜는 법은 실습 119에서 다룹니다.
--
-- 참고: 지금 RLS를 켜 보고 싶다면 아래 3줄의 주석을 푸세요.
-- (읽기 정책이 없으면 위 함정처럼 목록이 비어 보이므로, '누구나 읽기' 정책을 함께 추가합니다.)
--
-- alter table public.guestbook enable row level security;
-- create policy "누구나 읽기" on public.guestbook for select using (true);
-- create policy "누구나 작성" on public.guestbook for insert with check (true);
-- =====================================================================
