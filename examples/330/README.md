# 실습 330 — Dockerfile로 앱 컨테이너 만들기

작은 웹 앱(Node.js 서버)을 **Dockerfile**로 감싸 하나의 **이미지**로 굽고, 그 이미지로 **컨테이너**를 띄워 봅니다. "내 컴퓨터에선 됐는데 서버에선 안 돼"라는 단골 문제를, 앱과 실행환경을 **한 상자에 통째로 담아** 어디서든 똑같이 실행함으로써 없애는 것이 목표입니다. 빌드 → 실행 → 접속까지 직접 손으로 해 봅니다.

> 한 줄 그림: **server.js(작은 앱) → Dockerfile이 'Node 깔고·라이브러리 설치하고·이 명령으로 실행해'라고 적어 둠 → `docker build`로 이미지(도장틀) 굽기 → `docker run`으로 컨테이너(실제로 도는 앱) 띄우기 → 브라우저로 `localhost:3000` 접속**

> 비유: 이미지는 **밀키트(요리에 필요한 재료·레시피를 한 상자에 담은 것)**, 컨테이너는 그 밀키트로 **실제로 차려 낸 한 끼**입니다. 밀키트만 있으면 누구의 주방에서 끓여도 같은 맛이 나오듯, 이미지만 있으면 누구의 컴퓨터에서 띄워도 앱이 똑같이 돕니다. Dockerfile은 그 밀키트에 붙은 **레시피 카드**고요.

> 보안 메모 — 이미지에 넣어도 되는 것 vs 절대 넣으면 안 되는 것
> - **이미지에 넣어도 되는 것**: 앱 소스코드(`server.js`), 의존성 명세(`package.json`), 공개되어도 되는 설정. 이건 누가 봐도 안전합니다.
> - **절대 이미지에 박으면 안 되는 것**: API 키·DB 비밀번호 같은 **진짜 비밀값**. Dockerfile이나 코드에 박으면 이미지를 받은 누구나 꺼내 볼 수 있습니다. 비밀값은 실행할 때 `docker run -e` 또는 배포 플랫폼의 **시크릿 저장소**로 주입합니다.
> - 그래서 이 폴더의 `.dockerignore`가 `.env`를 이미지에서 **빼고**, `.env.example`에는 **자리표시자만** 들어 있습니다.

## 목표
- **컨테이너의 개념을 체감한다**: 이미지(도장틀)와 컨테이너(실제 인스턴스)가 어떻게 다른지, 왜 "환경까지 통째로" 담는지를 직접 띄워 보며 이해한다.
- **Dockerfile을 한 줄씩 읽는다**: `FROM`·`WORKDIR`·`COPY`·`RUN`·`EXPOSE`·`USER`·`CMD`가 각각 무엇을 하는지, 왜 `package.json`을 먼저 복사하는지(캐시) 같은 핵심 의도를 안다.
- **빌드·실행을 직접 한다**: `docker build`로 이미지를 굽고 `docker run`으로 컨테이너를 띄워, 브라우저에서 내 앱이 컨테이너 안에서 도는 걸 확인한다.
- **비밀값을 이미지에 박지 않는 습관을 들인다**: `.dockerignore`로 `.env`를 제외하고, 비밀값은 실행 시 주입한다는 원칙을 익힌다.

## 따라하는 단계

### A. 준비물 확인
1. **Docker Desktop**을 설치하고 실행해 둡니다(고래 아이콘이 떠 있어야 함). 터미널에서 `docker --version`이 버전을 출력하면 준비 완료입니다.
2. 이 폴더(`examples/330/`)로 이동합니다. 안에 `server.js`, `package.json`, `Dockerfile`, `.dockerignore` 등이 있습니다.

### B. (선택) 도커 없이 먼저 그냥 돌려 보기
3. 먼저 도커 없이 앱이 도는지 보고 싶다면: `npm install` 후 `npm start`를 실행하고 브라우저에서 `http://localhost:3000`을 엽니다. 인사 페이지가 보이면 앱 자체는 정상입니다. (확인했으면 `Ctrl`+`C`로 끕니다. 도커로 다시 띄울 거예요.)

### C. 이미지 굽기 (build)
4. 이 폴더에서 아래 명령으로 이미지를 만듭니다. `-t docker-demo`는 "이 이미지에 `docker-demo`라는 이름표를 붙여라"라는 뜻이고, 끝의 `.`은 "지금 이 폴더의 Dockerfile을 써라"라는 뜻입니다.
   ```bash
   docker build -t docker-demo .
   ```
5. 줄마다 `[1/5]`처럼 단계가 지나가고 마지막에 성공 메시지가 뜹니다. `docker images`를 치면 방금 만든 `docker-demo` 이미지가 목록에 보입니다.

### D. 컨테이너 띄우기 (run)
6. 이미지로 컨테이너를 띄웁니다. `-p 3000:3000`은 "내 컴퓨터의 3000번 문 ↔ 컨테이너의 3000번 문을 연결하라"는 뜻입니다. 이게 없으면 컨테이너 안에서만 돌고 밖에서 접속이 안 됩니다.
   ```bash
   docker run -p 3000:3000 docker-demo
   ```
7. `서버 시작됨: 포트 3000 ...`이 보이면 브라우저에서 `http://localhost:3000`을 엽니다. 인사 페이지와 함께 **컨테이너 호스트명**(랜덤 문자열)이 보이면, 앱이 컨테이너 안에서 도는 것입니다. `Ctrl`+`C`로 멈춥니다.

### E. (선택) 백그라운드로 띄우고 포트 바꿔 보기
8. 터미널을 점유하지 않고 띄우려면 `-d`(detached)를 붙입니다. 컨테이너에 이름도 붙여 두면 멈추기 쉽습니다.
   ```bash
   docker run -d --name myapp -p 8080:3000 docker-demo
   ```
   - 위는 "내 컴퓨터 8080 ↔ 컨테이너 3000"으로 연결한 것이라, 이번엔 `http://localhost:8080`으로 접속합니다. (한 이미지로 포트만 바꿔 여러 번 띄울 수 있다는 걸 보여 줍니다.)
   - 로그 보기: `docker logs myapp` · 멈추기: `docker stop myapp` · 치우기: `docker rm myapp`

### F. (선택) 비밀값은 실행할 때 주입하기
9. 진짜 비밀값(예: API 키)은 Dockerfile에 박지 말고 실행 시 `-e`로 넣습니다. 예: `docker run -e PORT=3000 -e SOME_SECRET_API_KEY=... docker-demo`. 이렇게 하면 같은 이미지를 환경마다 다른 비밀값으로 띄울 수 있고, 키가 이미지에 남지 않습니다.

## 🤖 바이브코딩 프롬프트
이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 Docker를 처음 배우는 비전공자를 가르치는 멘토야.
  아주 작은 Node.js + Express 웹 앱을 컨테이너화하는 최소 예제를 만들어 줘. 산출물은 4개 파일이야:
  1) server.js — "/" 접속 시 인사 HTML을 보내고, "/health"는 {status:"ok"} JSON을 보내는 작은 서버. 포트는 process.env.PORT || 3000, 0.0.0.0에 바인딩.
  2) package.json — express 의존성과 "start": "node server.js" 스크립트 포함.
  3) Dockerfile — node:20-slim 기반, package.json 먼저 복사 후 npm install(--omit=dev), 그다음 소스 복사, EXPOSE 3000, 비-root 사용자(node)로 실행, CMD는 npm start.
  4) .dockerignore — node_modules와 .env를 이미지에서 제외.
  제약: 비밀값은 어떤 파일에도 박지 말 것. 모든 코드/설정에 "무엇을 하는지 + 왜 그렇게 했는지"를 한국어 주석으로 달고, 특히 'package.json을 먼저 복사하는 이유(빌드 캐시)'와 '0.0.0.0 바인딩 이유'는 꼭 설명해 줘. 식별자는 영어로.
  ```

- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  위 예제를 이어서 개선해 줘.
  1) Dockerfile에 HEALTHCHECK를 추가해서, 도커가 /health를 주기적으로 찔러 보고 응답이 없으면 unhealthy로 표시하게 해 줘.
  2) 멀티스테이지 빌드로 바꿔, 빌드용 단계와 실행용 단계를 나눠 최종 이미지 용량을 줄여 줘.
  3) docker build, docker run(-p, -d, --name), docker logs/stop/rm 명령을 비전공자가 따라할 수 있게 순서대로 정리해 줘.
  각 변경마다 "왜 이렇게 하면 더 좋은지"를 한 줄 주석/설명으로 붙이고, 비밀값은 여전히 이미지에 넣지 말고 docker run -e 로 주입하는 방법도 알려 줘.
  ```

- **막혔을 때(디버깅)** 프롬프트:
  ```text
  Docker 실습 중 에러가 났어. 아래 정보를 보고 원인을 초보가 이해하게 한국어로 짚어 주고, 가장 가능성 높은 것부터 단계별 점검 순서를 알려 줘. 추측만 하지 말고 "이 명령을 쳐서 무엇이 나오면 무엇이 원인" 형태로 진단 절차를 줘.
  - 하려던 것: (예) docker build -t docker-demo . 또는 docker run -p 3000:3000 docker-demo
  - 에러 메시지 전체: (여기에 붙여넣기)
  - 증상: (예) build는 됐는데 localhost:3000이 안 열림 / "port is already allocated" / 컨테이너가 바로 꺼짐
  특히 다음을 점검해 줘: -p 포트 매핑 빠짐, server.js가 127.0.0.1에만 바인딩됨, 다른 프로세스가 3000 포트 점유, docker logs로 컨테이너 내부 에러 확인.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다.

## 검증법
- **이미지가 만들어졌는지**: `docker images`에 `docker-demo`가 보이면 빌드 성공이다.
- **컨테이너에서 앱이 도는지**: `docker run -p 3000:3000 docker-demo` 후 `http://localhost:3000`을 열어 인사 페이지가 뜨면 성공. 페이지에 보이는 **호스트명(랜덤 문자열)**이 컨테이너 안에서 왔다는 증거다.
- **헬스체크 응답 확인**: 브라우저나 `curl http://localhost:3000/health`로 `{"status":"ok",...}` JSON이 돌아오면 정상이다.
- **포트 매핑 효과 확인**: `-p 8080:3000`으로 띄우면 `localhost:8080`으로 접속돼야 한다(같은 이미지인데 문만 바뀐 것). `-p`를 빼고 띄우면 접속이 안 되는 것도 확인해, 포트 매핑의 역할을 눈으로 본다.
- **비밀값이 이미지에 없는지 확인**: 빌드 후 `docker run --rm docker-demo cat .env`를 쳤을 때 `.env`가 **없다고 나와야** 정상이다(`.dockerignore`로 제외했기 때문). `.env`가 보이면 안 된다.
- **재현성 확인**: 같은 폴더를 다른 컴퓨터(또는 깨끗한 환경)에서 `docker build` → `docker run` 해도 동일하게 동작하면, "내 컴퓨터에선 됐는데" 문제가 사라진 것이다.

## 파일 구성
- `server.js` — 컨테이너에 담을 아주 작은 Express 앱(인사 페이지 + `/health`).
- `package.json` — 의존성(express)과 실행 스크립트(`npm start`) 명세. 도커가 이걸 보고 설치·실행한다.
- `Dockerfile` — 이미지 조립 설명서. `FROM`→`WORKDIR`→`COPY`→`RUN`→`COPY`→`EXPOSE`→`USER`→`CMD` 순서와 그 이유를 주석으로 설명.
- `.dockerignore` — 이미지에 넣지 말 것 목록(`node_modules`, `.env` 등). 빌드 속도 + 보안.
- `.env.example` — 설정값 견본(자리표시자만). 복사해 `.env`를 만들고 진짜 값은 거기/시크릿 저장소에만 둔다.
- `.gitignore` — `.env`·`node_modules`가 깃에 안 올라가게 막는다.

## 관련 가이드
- [13권 10 — 배포·인프라 도구 지형도 (무엇에 올릴까: Vercel·컨테이너·Docker의 자리)](../../docs/13-ai-tools/10.md)
- [5권 — 세상에 내보내기: 배포·운영·SEO (배포한 앱을 운영하기)](../../docs/05-deploy-ops-seo/index.md)
- [11권 — 백엔드 심화 (서버 앱을 제대로 다루기)](../../docs/11-backend-advanced/index.md)
- 관련 실습: 실습 331 (docker-compose로 앱+DB 함께 띄우기) — 이번에 만든 컨테이너를 데이터베이스와 함께 묶는 다음 단계.
- 관련 실습: 실습 333 (환경변수·시크릿 안전하게 관리하기) — 비밀값을 이미지/코드 밖에 두는 원리를 더 깊이 다룬다.
- Docker 공식 문서 — "Build your Node.js image"(영문): https://docs.docker.com/language/nodejs/build-images/
- Dockerfile 레퍼런스(영문): https://docs.docker.com/reference/dockerfile/
