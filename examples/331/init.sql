-- =============================================================================
-- 이 파일은 무엇인가:
--   init.sql — Postgres(db 컨테이너)가 "처음 빈 DB로 뜰 때" 자동 실행되는 초기화 SQL입니다.
-- 왜 있는가:
--   앱이 쓸 visits 테이블을 사람이 손으로 만들지 않아도 되게,
--   환경이 뜨는 순간 테이블이 준비되도록 자동화합니다.
--   (docker-compose.yml에서 이 파일을 /docker-entrypoint-initdb.d 에 마운트하기 때문)
-- 주의:
--   이 스크립트는 DB 데이터 폴더가 '비어 있을 때만' 실행됩니다.
--   이미 데이터가 있으면(=down 후 다시 up 한 경우) 다시 실행되지 않습니다.
--   완전히 새로 만들려면 'docker compose down -v'로 volume까지 지운 뒤 up 하세요.
-- =============================================================================

-- IF NOT EXISTS: 테이블이 이미 있으면 에러 없이 넘어가게 해, 재실행에 안전합니다.
CREATE TABLE IF NOT EXISTS visits (
  -- id: 자동 증가하는 기본 키. 각 방문을 고유하게 식별합니다.
  id          SERIAL PRIMARY KEY,
  -- visited_at: 방문 시각. 기본값으로 현재 시각(UTC)을 자동 기록합니다.
  --   왜 DEFAULT now(): 앱이 매번 시각을 계산해 넣지 않아도 DB가 알아서 채워줍니다.
  visited_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- user_agent: 어떤 브라우저로 들어왔는지(데모용 부가 정보).
  user_agent  TEXT
);
