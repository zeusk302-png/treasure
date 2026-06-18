// =============================================================
// 실습 295 — (❌ 깨진/느린 버전) N+1 쿼리: 글 50개에 51번 DB를 두드린다
// =============================================================
//
// "게시판 목록"을 그리는 흔한 코드입니다. 화면에는 멀쩡하게 잘 나옵니다.
// 그런데 속을 들여다보면, 글 50개를 보여주려고 서버를 51번이나 두드립니다.
//   - 1번: 글 목록(50개) 가져오기
//   - 50번: 글 하나하나마다 "이 글 작성자가 누구지?"를 따로따로 물어보기
// 합쳐서 1 + 50 = 51번. 이게 바로 'N+1 쿼리' 문제입니다.
//   (글이 N개면 → 1번 + N번 = N+1번)
//
// 글이 50개면 51번이지만, 글이 1000개가 되면 1001번이 됩니다.
// 사용자가 몰리면 서버가 비명을 지르고 목록이 한참 뒤에 뜹니다.

// ----- 화면에 한 줄을 그리는 도우미 (좋은 코드/나쁜 코드 공용) -----
function 글한줄그리기(컨테이너, 글) {
  const 작성자이름 = 글.작성자이름 || "(알 수 없음)";
  const row = document.createElement("div");
  row.className = "post";
  row.innerHTML =
    '<span class="post-title">' + 글.title + "</span>" +
    '<span class="post-author">by ' + 작성자이름 + "</span>";
  컨테이너.appendChild(row);
}

// ----- ❌ 느린 목록 그리기 (N+1) -----
async function 느리게목록그리기() {
  const 결과박스 = document.getElementById("brokenResult");
  const 리스트박스 = document.getElementById("brokenList");
  리스트박스.innerHTML = "";
  결과박스.textContent = "측정 중…";

  if (설정이비었나()) {
    결과박스.textContent =
      "⚠️ 먼저 config.js의 SUPABASE_URL / SUPABASE_ANON_KEY를 내 값으로 바꾸세요.";
    return;
  }

  const 측정 = setupCounter(); // ← 여기서부터 요청 수를 셉니다
  console.log("===== ❌ 느린 버전(N+1) 시작 =====");
  const 시작시각 = performance.now();

  // (1) 글 목록만 먼저 가져옵니다. ← 요청 1번
  const { data: 글목록, error } = await db
    .from("posts")
    .select("id, title, author_id")
    .order("id")
    .limit(50);

  if (error) {
    측정.멈추기();
    결과박스.textContent = "에러: " + error.message;
    console.error(error);
    return;
  }

  // (2) ❌ 문제의 핵심: 글을 하나씩 돌면서, 매번 작성자를 따로 조회합니다.
  //     글이 50개면 이 반복문이 작성자 조회 요청을 50번 더 보냅니다.
  for (const 글 of 글목록) {
    const { data: 작성자 } = await db
      .from("authors")
      .select("name")
      .eq("id", 글.author_id)
      .single(); // ← 글 하나당 요청 1번씩 추가 (이게 누적되어 50번)

    글.작성자이름 = 작성자 ? 작성자.name : null;
    글한줄그리기(리스트박스, 글);
  }

  const 걸린시간 = Math.round(performance.now() - 시작시각);
  측정.멈추기(); // 측정 끝 → fetch 원상복구

  결과박스.innerHTML =
    "총 <b>" + 측정.횟수 + "번</b> DB 요청 (" +
    걸린시간 + "ms 걸림) — 글 " + 글목록.length + "개에 1+" +
    글목록.length + "번";
  console.log(
    "❌ 느린 버전 결과: DB 요청 " + 측정.횟수 + "번 / " + 걸린시간 + "ms"
  );
  console.log("   (글 " + 글목록.length + "개 → 1 + " + 글목록.length + " = " + 측정.횟수 + "번)");
}

// 버튼에 연결
document
  .getElementById("runBroken")
  .addEventListener("click", 느리게목록그리기);
