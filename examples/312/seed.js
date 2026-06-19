/*
 * seed.js — 데이터를 Meilisearch에 "색인(index)"하는 스크립트
 *
 * 무엇: data.json(샘플 메뉴 목록)을 Meilisearch의 'menu' 인덱스에 집어넣고,
 *       어떤 필드로 검색할지/어떤 필드를 강조(하이라이트)할지를 설정합니다.
 * 왜:  검색엔진은 "미리 정리해 둔 데이터(색인)"가 있어야만 검색할 수 있습니다.
 *      (책 뒤 '찾아보기'를 먼저 만들어야 단어를 빨리 찾는 것과 같음)
 *      그래서 검색 서버를 켜기 전에 이 스크립트를 한 번 돌려야 합니다: `npm run seed`
 *
 * 보안: 색인은 '쓰기' 작업이라 권한이 큰 마스터 키가 필요합니다.
 *      이 키는 .env 에서만 읽어 오고, 브라우저로는 절대 나가지 않습니다(이 파일은 서버에서만 실행).
 */

require('dotenv').config(); // .env 파일의 값을 process.env 로 불러옵니다(키를 코드에 박지 않기 위해)
const fs = require('fs');
const path = require('path');
const { MeiliSearch } = require('meilisearch');

// 1) Meilisearch 접속 정보 — 둘 다 .env 에서 읽습니다(코드에 직접 적지 않음)
const host = process.env.MEILI_HOST || 'http://localhost:7700';
const apiKey = process.env.MEILI_MASTER_KEY; // 색인은 쓰기 작업이라 마스터 키 필요

// 키가 없으면 친절히 멈춥니다(초보가 .env 설정을 빠뜨리는 흔한 실수 방지)
if (!apiKey) {
  console.error('[seed] MEILI_MASTER_KEY 가 없습니다. .env.example 을 복사해 .env 를 만들고 키를 넣어 주세요.');
  process.exit(1);
}

const client = new MeiliSearch({ host, apiKey });

async function run() {
  // 2) 색인할 데이터 읽기 — 진짜 프로젝트라면 여기서 DB 결과를 넣습니다.
  const dataPath = path.join(__dirname, 'data.json');
  const documents = JSON.parse(fs.readFileSync(dataPath, 'utf-8'));

  // 3) 'menu' 인덱스 준비 — primaryKey 는 각 문서를 구분하는 고유 식별자(여기선 id)
  const index = client.index('menu');

  // 4) 검색 동작 설정
  //    - searchableAttributes: 어떤 필드를 검색 대상으로 볼지(이름>설명 순으로 중요도)
  //    - 이렇게 좁혀 두면 엉뚱한 필드 매칭이 줄고 결과가 더 정확해집니다.
  await index.updateSettings({
    searchableAttributes: ['name', 'desc', 'category'],
    // displayedAttributes: 검색 결과에 돌려줄 필드(불필요한 내부 필드 노출 방지)
    displayedAttributes: ['id', 'name', 'category', 'desc'],
  });

  // 5) 실제 색인 — addDocuments 는 비동기 '작업(task)'을 만들고, 완료까지 기다립니다.
  const task = await index.addDocuments(documents);
  await client.waitForTask(task.taskUid); // 색인이 끝날 때까지 대기(끝나기 전에 검색하면 결과가 빌 수 있어서)

  console.log(`[seed] ${documents.length}개 문서 색인 완료 → 'menu' 인덱스`);
  console.log('[seed] 이제 `npm start` 로 서버를 켜고 검색해 보세요.');
}

run().catch((err) => {
  // 가장 흔한 원인을 함께 안내(접속 실패/키 불일치)
  console.error('[seed] 색인 실패:', err.message);
  console.error('[seed] 점검: (1) Meilisearch 가 7700 에 떠 있는지 (2) .env 의 MEILI_MASTER_KEY 가 도커 실행 때 준 키와 같은지');
  process.exit(1);
});
