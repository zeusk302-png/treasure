/*
  실습 321 — 스켈레톤 로딩 UI (script.js)
  무엇: 버튼을 누르면 (1) 스켈레톤을 깔고 → (2) 가짜 데이터를 받아 진짜 카드로 교체하는
        "상태 전환" 로직입니다.
  왜: 화면이 항상 'loading / success / error' 셋 중 하나만 보이도록 한 함수(render)로 관리하면,
      코드가 헷갈리지 않고 상태가 꼬이지 않습니다(로딩 상태 설계의 기본).
  주의: 실제 서버 대신 setTimeout으로 "기다림"을 흉내 냅니다.
        진짜 API로 바꾸려면 loadData() 안의 setTimeout 부분만 fetch로 교체하면 됩니다.
*/

// ── 설정값(여기만 바꿔도 동작이 달라지도록 위로 모았습니다) ──
const SKELETON_COUNT = 6;   // 깔아 둘 스켈레톤 카드 수. 진짜 데이터 수와 같게 맞추면 화면이 안 흔들립니다.
const FAKE_DELAY_MS = 1500; // 데이터가 도착하기까지 흉내 낼 대기 시간(ms). 3000으로 올리면 스켈레톤 효과가 더 잘 보입니다.

// 화면에서 자주 쓰는 요소들을 한 번만 찾아 둡니다(매번 찾으면 비효율).
const listEl = document.getElementById("list");
const loadBtn = document.getElementById("loadBtn");
const failBtn = document.getElementById("failBtn");

/*
  화면을 그리는 단 하나의 함수.
  state: 'loading' | 'success' | 'error' 중 하나.
  data : success일 때 보여 줄 카드 배열.
  이렇게 "상태에 따라 화면을 다시 그린다"가 이 실습의 핵심 사고방식입니다.
*/
function render(state, data) {
  // 로딩 중이면 aria-busy를 true로 — 화면을 못 보는 사람에게 "지금 로딩 중"을 알립니다.
  listEl.setAttribute("aria-busy", state === "loading" ? "true" : "false");

  // 기존 내용을 비웁니다. textContent="" 로 비워야 안전하게 초기화됩니다.
  listEl.textContent = "";

  if (state === "loading") {
    // 스켈레톤 카드를 SKELETON_COUNT개 만들어 깝니다.
    for (let i = 0; i < SKELETON_COUNT; i++) {
      listEl.appendChild(createSkeletonCard());
    }
    return;
  }

  if (state === "error") {
    listEl.appendChild(createErrorBox());
    return;
  }

  // state === 'success': 진짜 카드를 그립니다.
  data.forEach((item) => listEl.appendChild(createCard(item)));
}

/*
  스켈레톤 카드 한 장을 만듭니다.
  진짜 카드와 같은 .skeleton-card 틀 + 같은 크기의 썸네일/줄을 넣어,
  나중에 진짜 카드로 바뀌어도 자리가 그대로라 화면이 안 흔들립니다.
*/
function createSkeletonCard() {
  const card = document.createElement("div");
  card.className = "skeleton-card";

  // 썸네일 자리(회색 + shimmer)
  const thumb = document.createElement("div");
  thumb.className = "skel skel-thumb";

  // 제목 줄
  const title = document.createElement("div");
  title.className = "skel skel-title";

  // 본문 두 줄(마지막 줄은 짧게)
  const line1 = document.createElement("div");
  line1.className = "skel skel-line";
  const line2 = document.createElement("div");
  line2.className = "skel skel-line short";

  card.append(thumb, title, line1, line2);
  return card;
}

/*
  진짜 카드 한 장을 만듭니다.
  중요: 제목/본문 같은 '데이터'는 innerHTML이 아니라 textContent로 넣습니다.
        innerHTML로 넣으면 데이터에 섞인 <script>가 실행될 수 있어 XSS(보안) 위험이 있기 때문입니다.
*/
function createCard(item) {
  const card = document.createElement("div");
  card.className = "card";

  // 썸네일(여기선 그라데이션 박스로 대체). 실제로는 <img>를 쓰되 width/height를 지정해 자리를 예약하세요.
  const thumb = document.createElement("div");
  thumb.className = "thumb";

  const h3 = document.createElement("h3");
  h3.textContent = item.title; // 데이터 출력은 textContent — XSS 방지

  const p = document.createElement("p");
  p.textContent = item.body;   // 데이터 출력은 textContent — XSS 방지

  card.append(thumb, h3, p);
  return card;
}

/*
  에러 상자를 만듭니다. "다시 시도" 버튼을 누르면 정상 불러오기를 재시도합니다.
  사용자가 막다른 길에 갇히지 않도록 '회복 경로'를 주는 것이 좋은 로딩 설계입니다.
*/
function createErrorBox() {
  const box = document.createElement("div");
  box.className = "error-box";

  const msg = document.createElement("p");
  msg.textContent = "데이터를 불러오지 못했어요. 잠시 후 다시 시도해 주세요.";

  const retry = document.createElement("button");
  retry.className = "btn retry";
  retry.type = "button";
  retry.textContent = "다시 시도";
  // 다시 시도는 '정상' 경로로 재시도(fail=false).
  retry.addEventListener("click", () => loadData(false));

  box.append(msg, retry);
  return box;
}

/*
  데이터를 불러오는 흐름.
  shouldFail=true 면 일부러 실패시켜 에러 상태를 보여 줍니다.
  진짜 서버를 붙이려면 아래 setTimeout 블록을 fetch(...) 로 바꾸면 됩니다.
*/
function loadData(shouldFail) {
  // 1) 먼저 스켈레톤을 즉시 깝니다 — 사용자가 "반응이 시작됐다"를 바로 느끼게 합니다.
  render("loading");

  // 2) 잠시 기다린 뒤(=네트워크 흉내) 결과에 따라 화면을 바꿉니다.
  setTimeout(() => {
    if (shouldFail) {
      render("error");
      return;
    }
    // 가짜 데이터 생성. 개수를 SKELETON_COUNT와 같게 맞춰 교체 시 흔들림이 없게 합니다.
    const data = Array.from({ length: SKELETON_COUNT }, (_, i) => ({
      title: `카드 제목 ${i + 1}`,
      body: "스켈레톤이 진짜 콘텐츠로 매끄럽게 바뀌었습니다.",
    }));
    render("success", data);
  }, FAKE_DELAY_MS);
}

// 버튼과 동작을 연결합니다.
loadBtn.addEventListener("click", () => loadData(false)); // 정상 불러오기
failBtn.addEventListener("click", () => loadData(true));  // 실패 모드
