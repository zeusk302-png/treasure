# 실습 312 — Meilisearch로 즉시 검색창 만들기

오픈소스 검색엔진 **Meilisearch**에 데이터를 넣어 두고(이걸 "색인"이라 합니다), 그 위에 검색창을 붙입니다. 글자를 칠 때마다 결과가 **즉시** 뜨고, "스파게티"를 "스파게이"로 잘못 쳐도 **오타를 알아서 봐주는** 검색을 만드는 게 목표입니다. 데이터베이스의 `LIKE '%검색어%'`보다 빠르고 똑똑한 '전문 검색(full-text search)'을 직접 체감합니다.

> 한 줄 그림: **데이터(메뉴 목록)를 Meilisearch에 색인 → 사용자가 검색창에 "스파게이" 입력 → 우리 서버가 Meilisearch에 물어봄 → "스파게티" 같은 결과를 오타 교정해서 즉시 돌려줌 → 화면에 목록으로 표시**

> 비유: 일반 DB 검색(`LIKE`)은 **책을 1쪽부터 끝까지 손가락으로 훑어 단어를 찾는 것**입니다. Meilisearch는 **책 뒤의 '찾아보기(색인)'를 보고 곧장 해당 쪽으로 점프하는 것**이고요. 게다가 이 찾아보기는 "스파게이로 찾아도 스파게티 쪽을 알려주는" 친절한 사서까지 딸려 있습니다.

> 보안 메모 — 공개해도 되는 값 vs 절대 숨겨야 하는 값
> - **공개돼도 되는 것**: 우리 검색 페이지 주소, 검색창 UI 코드(`index.html`). 누가 봐도 안전합니다.
> - **절대 숨겨야 하는 것**: Meilisearch **마스터 키(`MEILI_MASTER_KEY`)** 와 **관리자/검색용 API 키**. 이 키가 새면 남이 내 색인을 통째로 지우거나 바꿀 수 있습니다. 그래서 **브라우저(`index.html`/JS)에 절대 박지 않고**, 우리 **서버(`server.js`)에서만** 사용합니다. 브라우저는 우리 서버의 `/api/search`만 부르고, Meilisearch와의 대화는 서버가 대신합니다.
> - 이 폴더에는 진짜 키가 없습니다. `.env.example`에 **자리표시자만** 있고, 진짜 값은 복사본 `.env`에만 적으며 `.env`는 `.gitignore`로 깃에서 빠집니다.

## 목표
- **전문 검색의 가치를 체감한다**: DB의 `LIKE` 검색과 달리, 오타에 강하고(typo tolerance) 입력 즉시 결과가 뜨는 검색을 직접 만들어 본다.
- **'색인(index)'의 개념을 익힌다**: 검색하려면 먼저 데이터를 검색엔진에 미리 정리해 넣어야 한다는 것을, 색인 스크립트를 직접 돌려 본다.
- **키를 서버에만 둔다**: Meilisearch 키는 브라우저가 아니라 서버(`server.js`)에서만 쓰고, 프론트는 우리 서버의 검색 API만 호출하는 안전한 구조를 만든다.
- **검색 UI를 붙인다**: 입력할 때마다 결과가 갱신되는 검색창을 만들고, 검색어와 일치하는 부분이 강조(하이라이트)되는 결과를 본다.

## 따라하는 단계

### A. Meilisearch 띄우기 (Docker가 가장 쉬움)
1. Docker가 설치돼 있다면, 터미널에서 아래 한 줄로 Meilisearch를 로컬에 띄웁니다. (`MEILI_MASTER_KEY`는 아무 긴 임의 문자열로 정하세요. 이게 우리 검색서버의 '대문 열쇠'입니다.)
   ```bash
   docker run -it --rm -p 7700:7700 \
     -e MEILI_MASTER_KEY="aSampleMasterKeyChangeMe123" \
     getmeili/meilisearch:v1.8
   ```
   - Docker가 없으면 [Meilisearch 설치 문서](https://www.meilisearch.com/docs/learn/getting_started/installation)대로 바이너리로 받아도 됩니다.
2. 브라우저에서 `http://localhost:7700` 이 열리면 Meilisearch가 살아 있는 겁니다. (이 화면은 개발용 미니 대시보드입니다.)

### B. 우리 서버 준비 + 비밀값 넣기
3. 이 폴더에서 의존성을 설치합니다.
   ```bash
   npm install
   ```
4. `.env.example`을 복사해 `.env`를 만들고, A에서 정한 마스터 키와 주소를 적습니다. (`.env`는 깃에 안 올라갑니다.)
   ```bash
   cp .env.example .env
   ```
   - `MEILI_HOST=http://localhost:7700`
   - `MEILI_MASTER_KEY=aSampleMasterKeyChangeMe123` ← A에서 정한 값과 똑같이

### C. 데이터를 색인하기 (검색하려면 먼저 넣어야 함)
5. 샘플 데이터(`data.json`, 메뉴 목록)를 Meilisearch에 색인합니다.
   ```bash
   npm run seed
   ```
   - 성공하면 "N개 문서 색인 완료" 같은 메시지가 뜹니다. 이게 "책 뒤 찾아보기를 만든" 단계입니다.

### D. 서버 켜고 검색해 보기
6. 검색 서버를 켭니다.
   ```bash
   npm start
   ```
7. 브라우저에서 `http://localhost:3000` 을 엽니다. 검색창에 글자를 치면 결과가 **즉시** 바뀝니다.
8. **오타 교정 확인**: "스파게이", "샐러드" 대신 "샐러드ㅡ" 처럼 일부러 틀리게 쳐도 맞는 결과가 나오는지 봅니다. 일치하는 글자가 `<mark>`로 강조돼 보입니다.

## 🤖 바이브코딩 프롬프트
이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 Node.js 백엔드를 가르치는 멘토야. 비전공자가 따라할 수 있게 만들어줘.
  목표: 로컬 Meilisearch(http://localhost:7700)에 연결해 '즉시 검색' 데모를 만든다.
  요구사항:
  - 폴더 구성: server.js(Express), seed.js(색인 스크립트), data.json(샘플 메뉴 10개), public/index.html(검색 UI)
  - 보안: Meilisearch 마스터 키는 브라우저에 절대 노출하지 말고 server.js에서만 .env로 읽어 써라.
    브라우저는 오직 우리 서버의 GET /api/search?q=... 만 호출하게 해라.
  - seed.js: data.json을 'menu' 인덱스에 색인하고, 검색 대상 필드와 정렬을 설정한다.
  - server.js: /api/search 가 q를 받아 Meilisearch에 질의하고 결과(JSON)를 돌려준다.
  - .env.example(자리표시자만)과 .gitignore(.env 제외)도 만들어라.
  중요: 코드만 주지 말고, 각 줄이 '무엇을 하는지'와 '왜 그렇게 했는지'를 한국어 주석으로 달아줘.
  변수·함수 이름은 영어로, 설명은 한국어로.
  ```

- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  위 검색 데모에 아래를 추가해줘. 이유 주석도 함께.
  1) 디바운스: 입력할 때마다가 아니라 250ms 멈췄을 때만 /api/search 를 호출해 서버 부하를 줄여라.
  2) 하이라이트: Meilisearch의 _formatted(attributesToHighlight)로 일치 글자를 <em>로 감싸 받아,
     화면에는 textContent 기반으로 안전하게 강조 표시해라(사용자 입력 그대로 innerHTML 금지).
  3) 빈 검색어/결과 없음/네트워크 에러 각각의 안내 문구를 보여줘라.
  4) 오타 교정(typo tolerance)이 동작하는지 확인할 수 있게, 결과 위에 '검색어: ___' 를 표시해라.
  비전공자가 이해하도록 한 줄씩 풀어서 주석을 달아줘.
  ```

- **막혔을 때(디버깅)** 프롬프트:
  ```text
  Meilisearch 검색 데모가 안 돼. 아래 정보를 보고 원인을 단계별로 짚어줘.
  - 증상: (예) 검색하면 항상 빈 배열만 온다 / 401 Unauthorized 가 뜬다 / index가 없다고 한다
  - 터미널 에러: (여기에 그대로 붙여넣기)
  - 확인해줄 것:
    1) Meilisearch가 7700에서 떠 있는지(curl http://localhost:7700/health),
    2) .env의 MEILI_MASTER_KEY가 도커 실행 때 준 키와 같은지,
    3) npm run seed 를 먼저 돌려 'menu' 인덱스에 문서가 들어갔는지,
    4) 키를 브라우저에 노출하지 않고 서버에서만 쓰고 있는지.
  원인 추정 → 확인 명령 → 고치는 법 순서로 알려줘.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다.

## 검증법
- **즉시성 확인**: 검색창에 글자를 한 자씩 칠 때, 페이지 새로고침 없이 결과 목록이 바로바로 바뀌는지 본다.
- **오타 교정 확인**: 일부러 한두 글자 틀리게 쳐도(예: "스파게이") 맞는 항목("스파게티")이 결과에 나오는지 본다. 이게 `LIKE` 검색과의 결정적 차이다.
- **색인 안 하면 안 나옴 확인**: `npm run seed`를 돌리기 *전*에는 검색 결과가 비어 있고, 돌린 *후*에는 나오는지 비교한다. → "검색하려면 먼저 색인해야 한다"를 체감.
- **키가 브라우저에 없는지 확인**: 검색 페이지에서 `Ctrl`+`U`(소스 보기)와 개발자도구 Network 탭을 열어, **마스터 키나 API 키가 한 글자도 안 보이는지** 본다. 브라우저는 우리 서버의 `/api/search`만 부르는 게 정상이다.
  - 폴더에서 아래를 실행하면 진짜 키가 **안** 나와야 정상이다(자리표시자만 나와야 함).
    ```bash
    grep -rn "MEILI_MASTER_KEY" public/ index.html 2>/dev/null
    ```
- **빈/에러 처리 확인**: 검색창을 비우면 안내 문구가, 없는 단어를 치면 "결과 없음"이, Meilisearch를 끄고 검색하면 에러 안내가 뜨는지 본다.

## 파일 구성
- `server.js` — Express 검색 서버. Meilisearch 키를 `.env`에서 읽어 **서버에서만** 쓰고, 브라우저에는 `/api/search`만 노출한다.
- `seed.js` — `data.json`을 Meilisearch `menu` 인덱스에 **색인**하고 검색 가능 필드를 설정하는 스크립트(`npm run seed`).
- `data.json` — 색인할 샘플 데이터(메뉴 10개). 진짜 프로젝트라면 DB에서 뽑아 쓴다.
- `public/index.html` — 검색 UI. 디바운스 + 안전한 하이라이트 표시. 키는 절대 여기 없다.
- `package.json` — 의존성(`express`, `meilisearch`, `dotenv`)과 실행 스크립트(`seed`/`start`).
- `.env.example` — 필요한 비밀값 견본(자리표시자만). 복사해 `.env`를 만들고 진짜 값은 거기에만 넣는다.
- `.gitignore` — `.env`와 `node_modules`가 깃에 안 올라가게 막는다.

## 관련 가이드
- [13권 08 — 검색 연동: Algolia·Meilisearch로 빠른 검색](../../docs/13-ai-tools/08.md)
- [12권 — 데이터베이스 심화 (LIKE 검색·인덱스와 비교)](../../docs/12-database-advanced/index.md)
- [10권 — 프론트엔드 심화 (검색창 UI·디바운스·로딩 상태)](../../docs/10-frontend-advanced/index.md)
- 관련 실습: 실습 313 (디바운스 자동완성 검색 UI) — 이번 검색창의 '잠깐 멈췄을 때만 요청' 절약 기법을 더 깊게 다룹니다.
- Meilisearch 공식 문서(영문): https://www.meilisearch.com/docs
- Meilisearch JS 클라이언트(영문): https://github.com/meilisearch/meilisearch-js
