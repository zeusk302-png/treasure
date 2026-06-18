// =============================================================
// 실습 295 — (✅ 고친 버전) N+1을 묶어서 해결: 51번 → 1~2번
// =============================================================
//
// broken.js와 "화면 결과는 똑같습니다." 글 50개 + 작성자 이름.
// 다른 건 단 하나, '서버를 두드리는 횟수'입니다. 51번 → 1번(또는 2번).
//
// 고치는 방법은 두 가지를 보여 줍니다. 둘 다 핵심 아이디어는 같습니다:
//   "하나씩 50번 물어보지 말고, 한 번에 몰아서 물어본다."
//
//   [방법 A] 관계 조회(join) — 가장 깔끔. 요청 1번.
//     posts 와 authors 가 author_id 로 연결돼 있으면,
//     select 안에서 authors(name) 한 줄로 작성자까지 같이 받아옵니다.
//
//   [방법 B] in 일괄 조회 — 관계 설정이 없을 때의 차선책. 요청 2번.
//     (1) 글 목록을 받고 → (2) 등장한 작성자 id들을 모아 .in()으로 '한 방'에 조회.

// ----- 화면에 한 줄을 그리는 도우미 (broken.js와 동일) -----
function 글한줄그리기(컨테이너, 글) {
  const 작성자이름 = 글.작성자이름 || "(알 수 없음)";
  const row = document.createElement("div");
  row.className = "post";
  row.innerHTML =
    '<span class="post-title">' + 글.title + "</span>" +
    '<span class="post-author">by ' + 작성자이름 + "</span>";
  컨테이너.appendChild(row);
}

// =============================================================
// [방법 A] 관계 조회(join) — 요청 1번
// =============================================================
async function 빠르게_관계조회() {
  const 결과박스 = document.getElementById("fixedResultA");
  const 리스트박스 = document.getElementById("fixedListA");
  리스트박스.innerHTML = "";
  결과박스.textContent = "측정 중…";

  if (설정이비었나()) {
    결과박스.textContent =
      "⚠️ 먼저 config.js의 SUPABASE_URL / SUPABASE_ANON_KEY를 내 값으로 바꾸세요.";
    return;
  }

  const 측정 = setupCounter();
  console.log("===== ✅ 방법 A: 관계 조회(join) 시작 =====");
  const 시작시각 = performance.now();

  // ✅ 핵심: select 안에 authors(name)을 넣으면, 글과 작성자를 '한 번에' 받습니다.
  //    authors:author_id (...) 처럼 외래키 이름을 적어 어떤 관계인지 알려 줍니다.
  //    결과 모양: { id, title, authors: { name: "홍길동" } }
  const { data: 글목록, error } = await db
    .from("posts")
    .select("id, title, authors:author_id ( name )")
    .order("id")
    .limit(50);

  if (error) {
    측정.멈추기();
    결과박스.textContent = "에러: " + error.message;
    console.error(error);
    return;
  }

  for (const 글 of 글목록) {
    글.작성자이름 = 글.authors ? 글.authors.name : null;
    글한줄그리기(리스트박스, 글);
  }

  const 걸린시간 = Math.round(performance.now() - 시작시각);
  측정.멈추기();

  결과박스.innerHTML =
    "총 <b>" + 측정.횟수 + "번</b> DB 요청 (" +
    걸린시간 + "ms) — 글 " + 글목록.length + "개를 한 방에!";
  console.log("✅ 방법 A 결과: DB 요청 " + 측정.횟수 + "번 / " + 걸린시간 + "ms");
}

// =============================================================
// [방법 B] in 일괄 조회 — 요청 2번 (관계 설정이 없을 때)
// =============================================================
async function 빠르게_in일괄조회() {
  const 결과박스 = document.getElementById("fixedResultB");
  const 리스트박스 = document.getElementById("fixedListB");
  리스트박스.innerHTML = "";
  결과박스.textContent = "측정 중…";

  if (설정이비었나()) {
    결과박스.textContent =
      "⚠️ 먼저 config.js의 SUPABASE_URL / SUPABASE_ANON_KEY를 내 값으로 바꾸세요.";
    return;
  }

  const 측정 = setupCounter();
  console.log("===== ✅ 방법 B: in 일괄 조회 시작 =====");
  const 시작시각 = performance.now();

  // (1) 글 목록 받기 ← 요청 1번
  const { data: 글목록, error: e1 } = await db
    .from("posts")
    .select("id, title, author_id")
    .order("id")
    .limit(50);

  if (e1) {
    측정.멈추기();
    결과박스.textContent = "에러: " + e1.message;
    return;
  }

  // 등장한 작성자 id들만 모아 중복을 제거합니다. (예: [1,2,1,3,2] → [1,2,3])
  const 작성자id들 = [...new Set(글목록.map((글) => 글.author_id))];

  // (2) ✅ 핵심: 작성자 id들을 .in()으로 '한 번에' 조회 ← 요청 1번 (반복문 없음!)
  const { data: 작성자들, error: e2 } = await db
    .from("authors")
    .select("id, name")
    .in("id", 작성자id들);

  if (e2) {
    측정.멈추기();
    결과박스.textContent = "에러: " + e2.message;
    return;
  }

  // id로 빠르게 찾도록 '사전(Map)'을 만듭니다. (id → name)
  const 이름찾기 = new Map(작성자들.map((a) => [a.id, a.name]));

  for (const 글 of 글목록) {
    글.작성자이름 = 이름찾기.get(글.author_id) || null;
    글한줄그리기(리스트박스, 글);
  }

  const 걸린시간 = Math.round(performance.now() - 시작시각);
  측정.멈추기();

  결과박스.innerHTML =
    "총 <b>" + 측정.횟수 + "번</b> DB 요청 (" +
    걸린시간 + "ms) — 목록 1번 + 작성자 1번";
  console.log("✅ 방법 B 결과: DB 요청 " + 측정.횟수 + "번 / " + 걸린시간 + "ms");
}

// 버튼에 연결
document.getElementById("runFixedA").addEventListener("click", 빠르게_관계조회);
document.getElementById("runFixedB").addEventListener("click", 빠르게_in일괄조회);
