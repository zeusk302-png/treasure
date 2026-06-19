/*
  이 파일은 무엇인가:
  부하테스트(load test)로 "때릴 대상"이 되는 아주 작은 연습용 웹 서버입니다.
  왜 있는가:
  부하테스트는 보낼 요청을 받아 줄 서버가 있어야 합니다. 그런데 남의 서버를
  허락 없이 때리면 공격(DoS)으로 오해받을 수 있으므로, "내가 마음대로 때려도 되는"
  연습용 대상을 직접 띄우려고 만든 서버입니다.

  설계 포인트(왜 이렇게 했는가):
  - Node 내장 http 모듈만 씁니다 → 추가 설치 없이 `node server.js`로 바로 실행돼,
    비전공 입문자가 의존성 문제로 막히지 않게 하려는 의도입니다.
  - 길(엔드포인트)을 일부러 둘로 나눴습니다:
      GET "/"     → 즉시 응답하는 '가벼운 길'
      GET "/slow" → 30~80ms 일부러 지연하는 '무거운 길'
    같은 부하를 줬을 때 둘의 처리량(RPS)·응답시간(p95)이 어떻게 달라지는지
    비교해서 "느린 코드 한 줄이 처리량을 얼마나 깎아먹는지"를 눈으로 보기 위함입니다.

  안전 경고:
  부하테스트는 반드시 "내 것"만 대상으로 하세요. 이 서버처럼 내가 띄운 localhost,
  또는 내가 권한을 가진 도메인만 때려야 합니다.
*/

const http = require("http"); // Node 내장 HTTP 서버 모듈 — 외부 패키지 설치가 필요 없어서 선택

// 포트는 환경변수 PORT가 있으면 그걸 쓰고, 없으면 3000을 씁니다.
// 왜: 배포 환경(클라우드)은 포트를 환경변수로 주입하는 경우가 많아, 거기에도 맞추려는 습관입니다.
const PORT = process.env.PORT || 3000;

// '무거운 길'이 일부러 끄는 지연 시간(밀리초)을 30~80ms 사이에서 랜덤으로 정합니다.
// 왜 랜덤인가: 실제 서버도 매 요청이 똑같이 걸리지 않습니다. 응답시간이 들쭉날쭉할 때
// 평균(avg)은 멀쩡해 보여도 상위 5%(p95)는 느릴 수 있다는 걸 체감시키기 위함입니다.
function randomSlowMs() {
  return 30 + Math.floor(Math.random() * 50); // 30 이상 80 미만
}

// 모든 요청이 이 함수 하나를 거칩니다. (req=들어온 요청, res=내보낼 응답)
const server = http.createServer((req, res) => {
  // 응답은 JSON으로 통일합니다. 부하 도구가 본문 내용보다 "응답 코드/시간"을 주로 보기 때문에,
  // 본문은 단순하게 두는 편이 측정에 깔끔합니다.
  res.setHeader("Content-Type", "application/json; charset=utf-8");

  // 가벼운 길: 받자마자 즉시 200으로 응답합니다. 부하의 '기준선(baseline)'이 됩니다.
  if (req.method === "GET" && req.url === "/") {
    res.statusCode = 200;
    res.end(JSON.stringify({ ok: true, path: "/", note: "light endpoint" }));
    return;
  }

  // 무거운 길: setTimeout으로 일부러 잠깐 늦췄다가 응답합니다.
  // 왜: DB 조회·외부 API 호출처럼 "시간이 걸리는 진짜 서버"를 흉내 내, 부하가 걸렸을 때
  // 처리량이 어떻게 무너지는지 보여 주기 위함입니다.
  if (req.method === "GET" && req.url === "/slow") {
    const delay = randomSlowMs();
    setTimeout(() => {
      res.statusCode = 200;
      res.end(JSON.stringify({ ok: true, path: "/slow", delayMs: delay }));
    }, delay);
    return;
  }

  // 위 두 길이 아니면 404로 답합니다.
  // 왜: 부하 스크립트가 엉뚱한 주소를 때리면 http_req_failed(에러율)에 잡혀,
  // "지금 한계 때문에 실패한 게 아니라 주소가 틀린 것"임을 구분할 수 있습니다.
  res.statusCode = 404;
  res.end(JSON.stringify({ ok: false, error: "not found" }));
});

// 서버를 켜고, 어디로 접속하면 되는지 안내를 출력합니다.
// 왜: 입문자가 "주소가 뭐였더라" 하고 막히지 않게, 실행하자마자 대상 URL을 콘솔에 보여 줍니다.
server.listen(PORT, () => {
  console.log(`[실습 336] 부하테스트 대상 서버가 http://localhost:${PORT} 에서 대기 중`);
  console.log(`  - 가벼운 길:  GET http://localhost:${PORT}/`);
  console.log(`  - 무거운 길:  GET http://localhost:${PORT}/slow  (30~80ms 지연)`);
  console.log(`  종료하려면 Ctrl + C`);
});
