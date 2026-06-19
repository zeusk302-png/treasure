# 실습 324 — RAG: 내 문서로 답하는 챗봇 만들기

내 문서(회사 소개, 제품 매뉴얼, 강의 노트 등)를 잘게 쪼개 **임베딩**(숫자 벡터)으로 바꿔 **pgvector**(Supabase)에 저장하고, 사용자가 질문하면 **질문과 가장 가까운 문서 조각**을 찾아 Claude에게 함께 건네 답을 받는 **RAG(검색 증강 생성) 챗봇**을 만듭니다. "AI가 모르는 내 자료"를 근거로 답하게 만들어 **환각(없는 사실을 지어내는 것)을 줄이는** 원리를 직접 체험하는 것이 목표입니다.

> 한 줄 그림: **내 문서를 조각내 임베딩 → pgvector에 저장 → 질문도 임베딩 → 가까운 조각 N개 검색 → 그 조각 + 질문을 Claude에게 → 근거에 기반한 답변**

> 비유: 그냥 LLM은 "기억으로만 답하는 똑똑한 사람"이라, 모르는 걸 물으면 아는 척 지어냅니다. RAG는 그 사람에게 **시험 직전 오픈북**을 쥐어주는 것입니다. 질문을 보고 **책에서 관련 페이지만 펼쳐(벡터 검색)** 옆에 두고 답하게 하니, "책에 없으면 모른다고 하세요"라고 시킬 수 있죠.

> 보안 메모 — 공개해도 되는 값 vs 절대 숨겨야 하는 값
> - **절대 노출하면 안 되는 비밀값**: `ANTHROPIC_API_KEY`(Claude API 키), Supabase의 `service_role` 키. 이 둘은 **서버(`server.js`)에서만** 쓰고, 브라우저 코드나 깃에 절대 올리지 않습니다. 노출되면 남이 내 요금으로 API를 쓰거나 내 DB를 통째로 읽을 수 있습니다.
> - **공개되어도 되는 값**: Supabase `anon` 키와 프로젝트 URL은 원래 브라우저에 나가도 되는 값입니다(보호는 RLS=행 수준 보안으로 합니다). 다만 이 실습은 단순화를 위해 **모든 DB 접근을 서버에서** 하므로, 브라우저에는 키를 아예 보내지 않습니다.
> - 진짜 값은 전부 `.env`(자리표시자 견본은 `.env.example`)에만 적고, `.env`는 `.gitignore`로 깃에서 빠집니다.

## 목표

- **RAG의 전체 흐름을 이해한다**: `문서 → 청크(조각) → 임베딩 → 벡터 저장 → 질문 임베딩 → 유사도 검색 → LLM에 근거 주입 → 답변`.
- **임베딩과 벡터 검색이 무엇인지 체감한다**: 글을 숫자 좌표로 바꾸면 "의미가 비슷한 글"을 거리로 찾을 수 있다는 걸 직접 확인한다.
- **pgvector를 켜고 쓴다**: Supabase에서 `vector` 확장을 켜고, 코사인 거리로 가까운 조각을 찾는 SQL 함수(`match_chunks`)를 만든다.
- **환각을 줄이는 프롬프트를 안다**: "준 자료 안에서만 답하고, 없으면 모른다고 해"라고 Claude에게 시켜, 근거 없는 답을 막는다.
- **비밀값을 코드 밖에 둔다**: API 키와 `service_role` 키는 `.env`에만 넣고 서버에서만 사용한다.

## 따라하는 단계

### A. Supabase 준비 (pgvector 켜기)

1. [supabase.com](https://supabase.com)에서 무료 프로젝트를 만듭니다(이미 있으면 그걸 써도 됩니다).
2. 좌측 메뉴 **SQL Editor**를 열고, 이 폴더의 `schema.sql` 내용을 **그대로 붙여넣고 실행(RUN)** 합니다. 이 스크립트가 하는 일:
   - `vector` 확장을 켭니다(`create extension vector`).
   - 문서 조각을 담을 `documents` 테이블을 만듭니다(본문 + `embedding vector(1536)`).
   - 질문 벡터와 가까운 조각을 찾아주는 함수 `match_chunks`를 만듭니다.
3. 좌측 **Project Settings → API**에서 다음 3개를 복사해 둡니다: **Project URL**, **`anon` public 키**, **`service_role` 키**.

### B. 프로젝트 설정 (키 넣기)

4. 이 폴더에서 의존성을 설치합니다: `npm install`
5. `.env.example`을 복사해 `.env`를 만들고, 빈칸을 진짜 값으로 채웁니다.
   - `ANTHROPIC_API_KEY` — [console.anthropic.com](https://console.anthropic.com)에서 발급(키는 `sk-ant-...` 형태).
   - `OPENAI_API_KEY` — 임베딩 생성용. [platform.openai.com](https://platform.openai.com)에서 발급(`text-embedding-3-small` 모델 사용, 매우 저렴).
   - `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` — A-3에서 복사한 값.
   - **이 값들은 `.env`에만** 적습니다. 코드나 깃에 박지 않습니다.

### C. 내 문서 넣기 (임베딩 → 저장)

6. `docs/` 폴더에 답하게 하고 싶은 `.txt`/`.md` 문서를 넣습니다(예제로 `sample.md`가 들어 있습니다).
7. `npm run ingest`를 실행합니다. 이 스크립트(`ingest.js`)가 하는 일:
   - 문서를 읽어 **문단 단위 조각(청크)**으로 나눕니다.
   - 각 조각을 임베딩 API로 **숫자 벡터**로 바꿉니다.
   - 조각 본문 + 벡터를 `documents` 테이블에 저장합니다.
   - 콘솔에 "N개 조각 저장 완료"가 뜨면 성공입니다.

### D. 챗봇 띄우고 물어보기

8. `npm start`로 서버를 켜고, 브라우저에서 `http://localhost:3000`을 엽니다.
9. 내 문서에 관한 질문을 입력해 봅니다. 서버는 `질문 임베딩 → match_chunks로 가까운 조각 검색 → 그 조각 + 질문을 Claude에게 → 답변`을 수행합니다.
10. **환각 테스트**: 문서에 전혀 없는 내용을 물어봅니다. "제공된 자료에는 그 내용이 없습니다" 같은 답이 나오면, 근거 기반 답변이 잘 작동하는 것입니다.

> 임베딩을 OpenAI로 만드는 이유: 임베딩(글→벡터)과 답변 생성(Claude)은 다른 일입니다. 이 실습은 **답변은 Claude(`claude-opus-4-8`)**, **임베딩은 저렴한 전용 임베딩 모델**로 나눠 씁니다. 둘 다 키는 서버에만 둡니다.

## 🤖 바이브코딩 프롬프트

이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 비전공자도 따라 할 수 있게 설명하는 시니어 개발자야.
  Node.js + Express로 "RAG(검색 증강 생성) 챗봇"의 뼈대를 만들어줘.

  목표: 내 문서로 답하는 챗봇. 벡터 DB는 Supabase pgvector, 답변 생성은 Anthropic Claude(모델 claude-opus-4-8) 사용.

  구성:
  1) schema.sql — pgvector 확장 켜기, documents(content text, embedding vector(1536)) 테이블,
     코사인 거리로 가까운 조각을 찾는 SQL 함수 match_chunks(query_embedding, match_count).
  2) ingest.js — docs/ 폴더의 .md/.txt를 문단 단위로 쪼개 임베딩하고 documents에 저장.
  3) server.js — POST /api/chat: 질문을 임베딩 → match_chunks로 가까운 조각 검색 →
     그 조각들을 컨텍스트로 Claude에게 전달 → 답변 반환. 정적 파일(public/index.html)도 서빙.
  4) public/index.html — 간단한 채팅 UI.

  제약(중요):
  - 비밀값(ANTHROPIC_API_KEY, OPENAI_API_KEY, SUPABASE_SERVICE_ROLE_KEY)은 코드에 절대 박지 말고
    .env에서 읽어. .env.example(자리표시자만)와 .gitignore도 만들어줘.
  - Supabase 접근은 service_role 키로 서버에서만. 브라우저엔 키를 보내지 마.
  - 코드만 주지 말고, 각 줄이 "무엇을 하는지 + 왜 그렇게 했는지"를 한국어 주석으로 달아줘.
  - 사용자 입력/답변을 화면에 표시할 땐 textContent로 (innerHTML 금지, XSS 방지).
  ```

- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  방금 만든 RAG 챗봇을 개선해줘:
  1) 환각 방지: Claude 시스템 프롬프트에 "아래 <자료> 안에서만 답하고, 자료에 없으면
     '제공된 자료에는 없습니다'라고 답하라"는 규칙을 넣어줘.
  2) 답변에 "근거"를 함께 보여줘: 검색된 조각의 출처(파일명)와 본문 일부를 응답에 포함하고,
     UI에서 접었다 펼 수 있게 해줘.
  3) match_chunks가 코사인 유사도 점수(similarity)도 함께 돌려주게 하고,
     유사도가 일정 값(예: 0.3) 미만이면 "관련 자료를 못 찾음"으로 처리해줘.
  4) 같은 질문이 반복되면 임베딩/검색 결과를 메모리에 잠깐 캐싱해 속도를 높여줘.
  바뀐 부분마다 왜 그렇게 했는지 주석으로 설명해줘.
  ```

- **막혔을 때(디버깅)** 프롬프트:
  ```text
  RAG 챗봇이 안 돼. 아래 에러와 상황을 보고, 원인 후보를 1~2개로 좁혀서
  한 번에 하나씩 확인하는 순서로 알려줘. 비전공자가 따라 할 수 있게 설명해줘.

  [상황] (예: ingest는 됐는데 챗봇이 "자료에 없습니다"만 답함 / 또는 서버가 안 켜짐)
  [에러 메시지] (여기에 터미널·브라우저 콘솔 에러 그대로 붙여넣기)
  [확인한 것] (예: .env 채움, schema.sql 실행함, npm install 함)

  특히 이런 흔한 원인을 점검해줘:
  - 임베딩 모델 차원(1536)과 테이블 vector(1536) 차원이 다른지
  - match_chunks 함수가 Supabase에 실제로 만들어졌는지
  - documents 테이블에 행(데이터)이 실제로 들어갔는지(select count(*))
  - .env의 키 이름 오타 / 키 값 앞뒤 공백
  ```

> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다.

## 검증법

- **데이터가 들어갔는지 확인**: Supabase SQL Editor에서 `select count(*) from documents;`를 실행해 조각 수가 0이 아닌지 본다.
- **검색이 되는지 확인**: 문서에 분명히 있는 내용을 물었을 때, 답변 아래 "근거"에 관련 조각이 뜨고 답이 맞는지 본다.
- **환각이 줄었는지 확인(핵심)**: 문서에 **없는** 내용을 물었을 때, AI가 지어내지 않고 "제공된 자료에는 없습니다"라고 답하는지 본다.
- **비밀값이 브라우저로 안 나가는지 확인**: 챗봇 페이지에서 `F12`(개발자도구) → Network 탭을 보고, `service_role`/`sk-ant-`/`sk-` 같은 키가 응답이나 소스에 **한 글자도 안 보이는지** 확인한다(키는 서버에만 있어야 한다).
- **깃에 비밀값이 없는지 확인**: 이 폴더에서 아래를 실행하면 **아무것도 안 나와야** 정상이다.
  - `git status` 에 `.env`가 안 보이는지(=.gitignore가 막고 있는지) 확인.
  - `grep -rnE "sk-ant-|service_role|sk-[A-Za-z0-9]{20}" . --include=*.js --include=*.html` → 진짜 키가 안 나와야 정상(코드엔 `process.env.*`만 있어야 한다).

## 파일 구성

- `server.js` — Express 서버. `POST /api/chat`에서 질문 임베딩 → 벡터 검색 → Claude 호출 → 답변. 정적 파일도 서빙.
- `ingest.js` — `docs/`의 문서를 조각내 임베딩하고 `documents` 테이블에 저장하는 1회성 스크립트.
- `schema.sql` — Supabase에서 실행할 SQL. pgvector 확장 + `documents` 테이블 + `match_chunks` 함수.
- `public/index.html` — 채팅 UI(질문 입력, 답변·근거 표시). 출력은 `textContent`로(XSS 방지).
- `docs/sample.md` — 임베딩해 넣을 예제 문서. 내 문서로 바꿔도 된다.
- `package.json` — 실행 스크립트(`ingest`, `start`)와 의존성.
- `.env.example` — 필요한 비밀값 견본(자리표시자만). 복사해 `.env`를 만들고 진짜 값은 거기에만 넣는다.
- `.gitignore` — `.env`, `node_modules` 등이 깃에 안 올라가게 막는다.

## 관련 가이드

- [13권 — AI 도구·연동 지형도 (어떤 AI로 무엇을, 어떻게 잇는가)](../../docs/13-ai-tools/index.md)
- [13권 05 — LLM API 연동 (내 앱에 지능 넣기)](../../docs/13-ai-tools/05.md)
- [12권 — 데이터베이스 심화 (데이터를 안전하고 빠르게)](../../docs/12-database-advanced/index.md)
- Supabase pgvector(벡터 임베딩) 문서(영문): https://supabase.com/docs/guides/ai
- Anthropic Claude Messages API 문서(영문): https://docs.anthropic.com/en/api/messages
- OpenAI Embeddings 문서(영문): https://platform.openai.com/docs/guides/embeddings
