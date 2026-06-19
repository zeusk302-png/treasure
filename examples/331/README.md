# 실습 331 — docker-compose로 앱+DB 함께 띄우기

내 컴퓨터에 Postgres를 직접 설치하지 않고도, **`docker-compose up` 한 줄**로 작은 웹앱(Node.js)과 데이터베이스(Postgres)를 **동시에** 띄워 서로 연결되게 만듭니다. "내 컴퓨터에선 됐는데 남의 컴퓨터에선 안 돼요" 문제를 없애고, 개발 환경 전체를 **코드(파일)로 박제**해 누구나 똑같이 재현하는 법을 익히는 것이 목표입니다.

> 한 줄 그림: **`docker compose up` 실행 → 컨테이너 2개(앱 + Postgres)가 같은 네트워크에서 태어남 → 앱이 `db`라는 이름으로 Postgres에 접속 → 브라우저로 앱을 열면 DB에 저장된 방문 기록이 보임**

> 비유: docker-compose는 **공연 무대감독의 큐시트**입니다. "조명(앱) 켜고, 음향(DB) 켜고, 둘을 같은 무대(네트워크)에 세워"라고 한 장의 종이(`docker-compose.yml`)에 적어 두면, 매번 손으로 하나씩 켜지 않아도 `up` 한 번에 모든 배우가 제자리에 섭니다. 공연이 끝나면 `down` 한 번으로 무대를 싹 정리하고요.

> 보안 메모 — 공개해도 되는 값 vs 절대 숨겨야 하는 값
> - **로컬 개발용 DB 비밀번호**(예: `postgres`)는 내 컴퓨터 안에서만 도는 값이라 예제에 보여도 큰일은 아니지만, **습관을 들이기 위해** 진짜 값은 `.env`에 두고 `docker-compose.yml`에는 `${POSTGRES_PASSWORD}`처럼 **참조**만 남깁니다.
> - **실제 운영(클라우드) DB 비밀번호·API 키**는 절대 코드/깃에 올리면 안 됩니다. 이 폴더의 `.env`는 `.gitignore`로 깃에서 빠지고, 깃에는 자리표시자만 든 `.env.example`만 올라갑니다.

## 목표
- **여러 컨테이너를 한 파일로 띄운다**: `docker-compose.yml` 하나로 앱(`web`)과 DB(`db`) 두 서비스를 정의하고 `docker compose up` 한 번에 함께 실행한다.
- **컨테이너끼리 연결하는 법을 익힌다**: 앱이 `localhost`가 아니라 **서비스 이름 `db`**로 Postgres에 접속하는 이유(같은 compose 네트워크 안에서 서비스 이름이 곧 호스트 이름)를 이해한다.
- **로컬 환경을 코드로 재현한다**: 누가 받아도 `docker compose up`만 하면 똑같은 앱+DB 환경이 뜨는 "환경의 코드화"를 체감한다.
- **데이터를 잃지 않게 한다**: named volume로 DB 데이터를 보존해, 컨테이너를 지웠다 다시 띄워도 데이터가 살아 있는지 확인한다.
- **비밀값을 코드에서 분리한다**: DB 비밀번호를 `docker-compose.yml`에 박지 않고 `.env`로 빼서, 환경변수로 주입하는 습관을 들인다.

## 따라하는 단계

### A. 준비물 확인
1. **Docker Desktop**을 설치하고 실행합니다. 터미널에서 `docker --version`과 `docker compose version`이 모두 버전을 출력하면 준비 완료입니다. (Compose는 요즘 Docker에 기본 포함되어 `docker compose`로 띄어쓰기 형태로 씁니다.)
2. 이 폴더(`examples/331`)의 파일을 모두 받습니다: `docker-compose.yml`, `Dockerfile`, `package.json`, `server.js`, `init.sql`, `.env.example`, `.gitignore`.

### B. 비밀값(.env) 만들기
3. `.env.example`을 복사해 같은 폴더에 `.env`라는 이름으로 저장합니다.
   - Windows PowerShell: `Copy-Item .env.example .env`
   - macOS/Linux: `cp .env.example .env`
4. `.env`를 열어 값을 채웁니다. **로컬 실습용**이라면 기본값 그대로 둬도 됩니다(`POSTGRES_PASSWORD=postgres` 등). `.env`는 `.gitignore` 덕분에 깃에 올라가지 않습니다.

### C. 한 줄로 띄우기
5. 이 폴더에서 아래를 실행합니다.
   ```bash
   docker compose up --build
   ```
   - `--build`는 "앱 이미지를 `Dockerfile`로 새로 빌드해서 띄워라"라는 뜻입니다(처음 한 번, 또는 코드가 바뀌었을 때).
   - 로그에 `db`(Postgres)가 `database system is ready to accept connections`를 찍고, `web`(앱)이 `서버 시작: http://localhost:3000`을 찍으면 둘 다 떴습니다.
6. 브라우저에서 **http://localhost:3000** 을 엽니다. 페이지를 새로고침할 때마다 **방문 기록이 DB에 한 줄씩 쌓이고**, 최근 방문 목록이 화면에 보이면 앱↔DB 연결이 성공한 것입니다.

### D. 데이터 보존(volume) 확인 — 환경 재현의 핵심
7. 터미널에서 `Ctrl`+`C`로 멈춘 뒤 `docker compose down`을 실행합니다(컨테이너 삭제). 그다음 다시 `docker compose up`으로 띄웁니다.
8. 화면의 방문 기록이 **0으로 초기화되지 않고 그대로 남아 있으면**, named volume(`db-data`)에 데이터가 보존된 것입니다.
9. 데이터까지 싹 지우고 완전히 새로 시작하고 싶으면 `docker compose down -v`를 씁니다(`-v`는 volume까지 삭제 — 주의).

### E. 자주 쓰는 명령
- `docker compose ps` — 지금 떠 있는 서비스 목록 보기.
- `docker compose logs -f web` — 앱 로그만 실시간으로 따라 보기.
- `docker compose exec db psql -U postgres -d appdb -c "SELECT * FROM visits;"` — DB 컨테이너 안에 들어가 직접 SQL로 데이터 확인하기.

## 🤖 바이브코딩 프롬프트
이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓰면 됩니다.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 도커 초보자에게 친절히 설명하는 데브옵스 멘토야.
  목표: docker-compose 하나로 "Node.js 웹앱 + Postgres DB"를 함께 띄우는 가장 단순한 로컬 개발 환경을 만들어줘.
  요구사항:
  - 서비스 두 개: web(Node.js Express 앱, 포트 3000 노출), db(공식 postgres 이미지).
  - web은 환경변수로 DB 접속 정보를 받고, 호스트는 localhost가 아니라 서비스 이름 "db"로 접속해야 해. 왜 db로 접속하는지 주석으로 설명해줘.
  - DB 비밀번호 같은 값은 docker-compose.yml에 직접 박지 말고 .env 파일에서 ${변수}로 주입해줘. .env.example과 .gitignore도 같이 만들어줘.
  - web 앱은 "/"로 접속하면 visits 테이블에 방문 1건을 INSERT하고 최근 방문 목록을 보여주는 아주 단순한 앱이면 돼.
  산출물: docker-compose.yml, Dockerfile, package.json, server.js, init.sql, .env.example, .gitignore.
  제약: 코드만 주지 말고 "무엇을 하는지 + 왜 그렇게 했는지"를 한국어 주석으로 한 줄씩 풀어서 달아줘. 비전공자가 읽고 이해할 수 있게.
  ```

- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  지금 만든 compose 환경에 아래를 추가/개선해줘. 각 변경마다 "왜 필요한지" 주석으로 설명해줘.
  1) db 데이터를 named volume(db-data)에 저장해서, docker compose down 후 다시 up 해도 방문 기록이 남게 해줘.
  2) web 서비스에 depends_on과 healthcheck를 걸어, Postgres가 "정말 접속 가능해진 뒤"에 web이 시작되게 해줘(앱이 DB보다 먼저 떠서 연결 실패하는 흔한 문제 방지).
  3) 앱 코드는 컨테이너를 새로 안 굽고도 바뀌게 bind mount로 소스를 마운트하고, 변경 시 자동 재시작(nodemon)되게 해줘. 운영 배포가 아니라 "개발 편의"용임을 주석에 명시해줘.
  4) DB 연결이 실패하면 즉시 죽지 말고 몇 번 재시도한 뒤 에러를 명확히 출력하게 해줘.
  사용자 입력을 화면에 표시할 때는 innerHTML 대신 textContent(또는 서버에서 이스케이프)를 써서 XSS를 막아줘.
  ```

- **막혔을 때(디버깅)** 프롬프트:
  ```text
  docker compose up 했더니 web 컨테이너가 아래 에러로 죽어. 원인을 초보자도 알게 단계별로 진단해줘.

  (여기에 터미널 에러를 그대로 붙여넣기. 예: "Error: getaddrinfo ENOTFOUND db" 또는 "ECONNREFUSED 127.0.0.1:5432" 또는 "password authentication failed for user")

  점검해줘:
  1) 앱이 접속하는 DB 호스트가 localhost/127.0.0.1로 잘못 되어 있진 않은지(compose 안에서는 서비스 이름 db여야 함).
  2) web이 db보다 먼저 떠서 연결 실패한 건 아닌지(healthcheck/재시도로 해결).
  3) .env의 POSTGRES_PASSWORD와 앱이 쓰는 비밀번호가 서로 다른 건 아닌지.
  4) 포트 3000/5432가 이미 다른 프로그램에 쓰이고 있진 않은지.
  각 원인을 확인하는 명령(docker compose logs, docker compose ps 등)과, 고친 코드를 왜 그렇게 고쳤는지 함께 알려줘.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 훨씬 좋습니다.

## 검증법
- **둘 다 떴는지**: `docker compose ps`를 실행해 `web`과 `db` 두 서비스가 모두 `Up`(또는 `running`) 상태인지 확인한다.
- **연결 성공인지**: 브라우저에서 http://localhost:3000 을 새로고침하면 방문 횟수가 1씩 늘고 최근 방문 목록이 갱신되면, 앱이 `db`에 정상 접속·기록 중인 것이다.
- **DB에 직접 확인**: `docker compose exec db psql -U postgres -d appdb -c "SELECT count(*) FROM visits;"` 결과 숫자가 새로고침 횟수와 대략 맞으면 정상이다.
- **환경 재현 확인**: `docker compose down` 후 다시 `docker compose up` 했을 때 방문 기록이 그대로 남아 있으면 volume 보존이 동작하는 것이다(`down -v`까지 하면 0으로 초기화된다).
- **비밀값이 코드에 안 박혔는지**: `docker-compose.yml`에 진짜 비밀번호가 아니라 `${POSTGRES_PASSWORD}` 같은 참조만 있는지, `.env`가 `.gitignore`에 들어 있는지 확인한다.
  - `grep -nE "password|PASSWORD" docker-compose.yml` → 진짜 값이 아니라 `${...}` 참조만 나와야 정상이다.

## 파일 구성
- `docker-compose.yml` — 핵심 파일. `web`(앱)과 `db`(Postgres) 두 서비스, 네트워크, volume, 환경변수 주입을 한 곳에 정의한다.
- `Dockerfile` — `web` 앱을 이미지로 굽는 설명서(베이스 이미지, 의존성 설치, 실행 명령).
- `package.json` — 앱이 쓰는 Node.js 의존성(`express`, `pg`, `nodemon`)과 실행 스크립트.
- `server.js` — 아주 단순한 Express 앱. `/`로 들어오면 `visits` 테이블에 방문을 기록하고 최근 목록을 보여준다. DB 호스트로 `db`를 쓰는 이유가 주석에 적혀 있다.
- `init.sql` — Postgres 컨테이너가 처음 뜰 때 자동 실행되어 `visits` 테이블을 만든다.
- `.env.example` — 필요한 환경변수 견본(자리표시자만). 복사해 `.env`를 만들고 진짜 값은 `.env`에만 넣는다.
- `.gitignore` — `.env`와 `node_modules`가 깃에 올라가지 않게 막는다.

## 관련 가이드
- [13권 10 — 배포·인프라 도구 지형도 (무엇에 올릴까: 컨테이너·자동배포·모니터링)](../../docs/13-ai-tools/10.md)
- [5권 — 세상에 내보내기: 배포·운영·SEO](../../docs/05-deploy-ops-seo/index.md)
- [12권 — 데이터베이스 심화 (Postgres·스키마·SQL을 다루는 안목)](../../docs/12-database-advanced/index.md)
- 관련 실습: 실습 330 (Dockerfile로 앱 컨테이너 만들기) — 이번 compose의 `web` 서비스가 거기서 구운 이미지와 같은 원리입니다.
- 관련 실습: 실습 332 (GitHub Actions CI) · 실습 333 (환경변수·시크릿 관리) — compose로 만든 환경을 자동 검사·안전 운영으로 잇는 다음 단계입니다.
- Docker Compose 공식 문서(영문): https://docs.docker.com/compose/
- Postgres 공식 이미지(영문): https://hub.docker.com/_/postgres
