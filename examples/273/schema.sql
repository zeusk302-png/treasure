-- 실습 273: 챗봇 대화 기록 저장 테이블 + RLS(행 수준 보안)
-- Supabase 대시보드 → SQL Editor 에 붙여넣고 [Run] 하세요.

-- 1) 대화 한 줄(메시지 하나)을 저장하는 테이블
--    같은 대화를 사용자별로 구분하기 위해 user_key 를 둡니다.
--    (로그인 없이도 실습할 수 있도록, 여기서는 브라우저가 만든 임의의 user_key 를 씁니다.)
create table if not exists chat_messages (
  id          bigint generated always as identity primary key,
  user_key    text not null,                       -- 누구의 대화인지 (사용자별 구분 도장)
  role        text not null check (role in ('user','assistant')),  -- 'user'=사람, 'assistant'=AI
  content     text not null,                        -- 메시지 내용
  created_at  timestamptz default now()             -- 보낸 시각(이 순서로 다시 불러옵니다)
);

-- 대화를 시간순으로 빠르게 불러오기 위한 인덱스
create index if not exists chat_messages_user_time_idx
  on chat_messages (user_key, created_at);

-- 2) RLS 켜기 (이걸 켜야 anon 공개 키가 화면에 있어도 안전합니다)
alter table chat_messages enable row level security;

-- 3) 정책: 이 실습은 "로그인 없는 데모"라 누구나 읽기/쓰기를 허용합니다.
--    (실서비스라면 로그인을 붙이고 'auth.uid() = user_id' 로 본인 것만 보게 막습니다 — 281/260 실습 참고)
create policy "데모: 누구나 읽기"  on chat_messages for select using (true);
create policy "데모: 누구나 쓰기"  on chat_messages for insert with check (true);

-- 참고: 수정/삭제 정책은 만들지 않았으므로 anon 키로는 수정·삭제가 막힙니다.
-- 비밀값이 필요한 작업(관리자 일괄 삭제 등)은 service_role 키로 서버/n8n 에서만 처리하세요.
-- service_role(secret) 키는 RLS를 통째로 우회하므로 브라우저·GitHub에 절대 두지 마세요.
