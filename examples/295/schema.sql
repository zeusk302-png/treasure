-- =============================================================
-- 실습 295 — 연습용 테이블 만들기 (작성자 10명 + 글 50개)
-- =============================================================
-- Supabase 대시보드 → SQL Editor 에 통째로 붙여넣고 [Run] 하세요.
-- N+1을 재현하려면 "글이 작성자보다 훨씬 많아야" 합니다. (글 50 : 작성자 10)

-- 1) 작성자 테이블
create table if not exists authors (
  id   bigint primary key,
  name text not null
);

-- 2) 글 테이블 (author_id 가 authors.id 를 가리키는 '관계')
--    이 외래키(references) 덕분에 방법 A(관계 조회 join)가 동작합니다.
create table if not exists posts (
  id         bigint primary key,
  title      text not null,
  author_id  bigint not null references authors(id)
);

-- 3) 작성자 10명 넣기
insert into authors (id, name) values
  (1,'홍길동'),(2,'김영희'),(3,'이철수'),(4,'박민지'),(5,'최준호'),
  (6,'정수아'),(7,'강도현'),(8,'윤서연'),(9,'임태양'),(10,'한가람')
on conflict (id) do nothing;

-- 4) 글 50개 자동 생성 (작성자를 골고루 섞어 배정)
insert into posts (id, title, author_id)
select g,
       '연습용 게시글 #' || g,
       ((g - 1) % 10) + 1   -- 1~10번 작성자에게 돌아가며 배정
from generate_series(1, 50) as g
on conflict (id) do nothing;

-- 5) 누구나 '읽기'만 가능하도록 RLS 켜고 select 정책만 허용
--    (이 실습은 '읽기 성능'이 주제라 읽기만 열어 둡니다. 공개 anon 키로 조회됩니다.)
alter table authors enable row level security;
alter table posts   enable row level security;

drop policy if exists "authors_read" on authors;
create policy "authors_read" on authors for select using (true);

drop policy if exists "posts_read" on posts;
create policy "posts_read" on posts for select using (true);

-- 확인용: 글 개수가 50이면 성공
-- select count(*) from posts;   -- → 50
