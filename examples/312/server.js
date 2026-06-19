/*
 * server.js — 검색 API + 검색 페이지를 제공하는 작은 서버
 *
 * 무엇: 브라우저에 검색 페이지(public/index.html)를 내려 주고,
 *       GET /api/search?q=검색어 요청을 받으면 Meilisearch에 물어 결과(JSON)를 돌려줍니다.
 * 왜:  Meilisearch 키(권한이 큼)를 브라우저에 두면 누구나 F12로 훔쳐 색인을 지울 수 있습니다.
 *      그래서 "브라우저 → 우리 서버 → Meilisearch" 로 한 단계 거치게 만들어,
 *      키는 서버(여기)에만 두고 브라우저는 우리 /api/search 만 부르게 합니다.
 *
 * 실행: 1) Meilisearch 띄우기  2) npm run seed (색인)  3) npm start (이 파일)
 */

require('dotenv').config(); // 비밀값을 .env 에서 읽기(코드에 박지 않기 위해)
const path = require('path');
const express = require('express');
const { MeiliSearch } = require('meilisearch');

const app = express();
const PORT = process.env.PORT || 3000;

// Meilisearch 접속 — 키는 서버에서만 사용(브라우저로 절대 안 나감)
const client = new MeiliSearch({
  host: process.env.MEILI_HOST || 'http://localhost:7700',
  apiKey: process.env.MEILI_MASTER_KEY, // 데모 단순화를 위해 마스터 키 사용.
  // 실제 서비스라면 검색 전용 'search key'(권한이 검색뿐인 키)를 따로 발급해 쓰는 게 더 안전합니다.
});
const index = client.index('menu');

// 1) 정적 파일 제공 — public/ 안의 index.html 등을 그대로 내려 줍니다.
app.use(express.static(path.join(__dirname, 'public')));

// 2) 검색 API — 브라우저가 부르는 유일한 검색 통로
app.get('/api/search', async (req, res) => {
  // 쿼리스트링 q 를 받되, 문자열이 아니면 빈 문자열로(타입 방어)
  const q = typeof req.query.q === 'string' ? req.query.q.trim() : '';

  // 빈 검색어면 굳이 검색엔진을 부르지 않고 빈 결과 반환(불필요한 요청 절약)
  if (q === '') {
    return res.json({ query: q, hits: [] });
  }

  try {
    // Meilisearch 검색 호출
    // - limit: 결과 최대 개수
    // - attributesToHighlight: 일치한 글자를 <em>..</em> 로 감싼 _formatted 를 함께 받음
    //   (오타 교정 typo tolerance 는 Meilisearch 기본값으로 자동 동작)
    const result = await index.search(q, {
      limit: 10,
      attributesToHighlight: ['name', 'desc'],
      highlightPreTag: '<em>',
      highlightPostTag: '</em>',
    });

    // 브라우저가 그리기 쉬운 형태로만 정리해 돌려줍니다(내부 필드 노출 최소화)
    const hits = result.hits.map((h) => ({
      id: h.id,
      name: h.name,
      category: h.category,
      desc: h.desc,
      // _formatted: <em> 강조가 들어간 버전(있으면 사용)
      nameHighlighted: h._formatted ? h._formatted.name : h.name,
      descHighlighted: h._formatted ? h._formatted.desc : h.desc,
    }));

    res.json({ query: q, hits });
  } catch (err) {
    // 검색엔진이 꺼져 있거나 인덱스가 없을 때 — 브라우저가 안내를 띄울 수 있게 에러로 응답
    console.error('[search] 실패:', err.message);
    res.status(500).json({ error: '검색 서버에 연결하지 못했습니다. Meilisearch와 색인 상태를 확인하세요.' });
  }
});

app.listen(PORT, () => {
  console.log(`[server] 검색 데모 실행 중 → http://localhost:${PORT}`);
  console.log('[server] 검색이 비어 있으면 먼저 `npm run seed` 로 색인했는지 확인하세요.');
});
