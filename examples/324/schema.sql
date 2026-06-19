-- =============================================================
-- 이 파일은 무엇인가:
--   RAG 챗봇이 쓸 Supabase(PostgreSQL) 데이터베이스를 준비하는 SQL입니다.
-- 왜 있는가:
--   "내 문서 조각 + 그 조각의 임베딩(숫자 벡터)"을 저장할 곳과,
--   질문 벡터와 가장 가까운 조각을 찾아주는 함수가 있어야 RAG가 동작합니다.
-- 어떻게 쓰나:
--   Supabase 대시보드 → SQL Editor에 이 내용을 그대로 붙여넣고 RUN 하세요.
-- =============================================================

-- 1) pgvector 확장 켜기.
--    왜: PostgreSQL은 기본적으로 "벡터"라는 자료형과 "벡터끼리의 거리 계산"을 모릅니다.
--    이 확장을 켜야 vector(1536) 타입과 <=> (코사인 거리) 연산자를 쓸 수 있습니다.
create extension if not exists vector;

-- 2) 문서 조각을 담을 테이블.
--    한 행 = 문서 한 조각(청크).
create table if not exists documents (
  id          bigserial primary key,        -- 자동 증가 식별자
  source      text,                          -- 출처(파일명) — 답변에 "근거"로 보여주기 위해 저장
  content     text not null,                 -- 조각 본문(사람이 읽는 글)
  -- 임베딩 벡터. 차원 1536은 임베딩 모델 text-embedding-3-small의 출력 차원과 "반드시" 같아야 함.
  -- 왜 1536인가: ingest.js가 그 모델로 벡터를 만들기 때문. 모델을 바꾸면 이 숫자도 함께 바꿔야 합니다.
  embedding   vector(1536),
  created_at  timestamptz default now()
);

-- 3) 벡터 검색용 인덱스(선택이지만 권장).
--    왜: 데이터가 많아지면 전수 비교가 느립니다. ivfflat 인덱스로 "가까운 것 빨리 찾기"를 돕습니다.
--    vector_cosine_ops = 코사인 거리 기준으로 인덱싱(아래 함수도 코사인을 씁니다).
create index if not exists documents_embedding_idx
  on documents
  using ivfflat (embedding vector_cosine_ops)
  with (lists = 100);

-- 4) 질문 벡터와 가까운 조각을 찾아주는 함수.
--    왜 함수로 만드나: 서버(server.js)에서 한 줄(rpc 호출)로 "가까운 조각 N개"를 받기 위해서입니다.
--    입력: query_embedding(질문을 임베딩한 벡터), match_count(몇 개 가져올지)
--    출력: 조각 본문 + 출처 + 유사도(similarity, 1에 가까울수록 비슷함)
create or replace function match_chunks (
  query_embedding vector(1536),
  match_count int default 5
)
returns table (
  id bigint,
  source text,
  content text,
  similarity float
)
language sql stable
as $$
  select
    documents.id,
    documents.source,
    documents.content,
    -- <=> 는 "코사인 거리"(0=완전 같음, 2=정반대). 1에서 빼면 "유사도"(1=완전 같음)가 됩니다.
    -- 왜 이렇게: 사람이 이해하기 쉬운 "비슷한 정도"로 바꿔 돌려주려고.
    1 - (documents.embedding <=> query_embedding) as similarity
  from documents
  -- 질문 벡터에 가까운 순서(거리 오름차순)로 정렬해 위에서부터 match_count개만.
  order by documents.embedding <=> query_embedding
  limit match_count;
$$;
