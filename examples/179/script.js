// 깨진 배포 -> Instant Rollback(즉시 되돌리기) -> 정상화 흐름을 흉내 낸 연습판 스크립트.
// 실제 Vercel을 호출하지 않습니다. "이전 정상 배포로 라이브를 되돌린다"는 감각을 손으로 익히는 용도입니다.

// ---- 설정값 (자리표시자) ----------------------------------------
// 실제 배포 ID/주소는 본인 프로젝트마다 다릅니다. 아래는 형식만 보여주는 예시입니다.
const PROD_URL = "https://my-site.vercel.app";

// 배포 목록 데이터. 위에서 아래로 = 최신 -> 과거 순서.
// state: "ready"(정상 빌드) | "error"(런타임은 깨졌지만 빌드는 통과) — Vercel에서는 빌드 실패가 아닌 한
//        깨진 코드도 "Ready"로 배포될 수 있어, 롤백이 필요한 상황이 됩니다.
const baseDeployments = [
  { id: "v3", commit: "a1b2c3d", msg: "신청 버튼 문구 다듬기", state: "ready", age: "2일 전" },
  { id: "v2", commit: "9f8e7d6", msg: "푸터에 연락처 추가", state: "ready", age: "5일 전" },
  { id: "v1", commit: "0c1d2e3", msg: "첫 배포", state: "ready", age: "8일 전" },
];

// 1번에서 "고장난 배포"를 누르면 목록 맨 위에 추가되는 항목
const badDeployment = { id: "v4", commit: "f00dbad", msg: "환영 문구 수정(오타 포함)", state: "ready", age: "방금" };

// 화면 상태
// map(...{ ...d })로 '복사본'을 만드는 이유: 원본 baseDeployments를 그대로 쓰면 화면에서 목록을 바꿀 때
// 원본까지 함께 변해 버려, '처음부터 다시'(resetAll)를 눌러도 깨끗한 초기 상태로 못 돌아갑니다.
// 그래서 원본은 '정답지'로 남겨 두고, 화면용은 따로 복사해서 마음껏 바꾸는 것입니다.
let deployments = baseDeployments.map((d) => ({ ...d })); // 복사본
let currentId = "v3";   // 지금 라이브인 배포 id (= 손님에게 실제로 보이는 배포. 롤백은 이 값을 과거 배포로 바꾸는 일)
let badDeployed = false; // 고장난 v4를 올렸는지 (두 번 올리는 것·결과물 패널 조건 판단에 씀)

// ---- DOM 참조 ---------------------------------------------------
const listEl = document.getElementById("deploy-list");
const terminal = document.getElementById("terminal");
const deployBadBtn = document.getElementById("deploy-bad");
const deployHint = document.getElementById("deploy-hint");
const resetBtn = document.getElementById("reset");
const siteShot = document.getElementById("site-shot");
const statusLine = document.getElementById("status-line");
const resultSection = document.getElementById("result");

// ---- 도우미 -----------------------------------------------------
function log(text, cls = "") {
  const p = document.createElement("p");
  p.className = "term-line" + (cls ? " " + cls : "");
  p.textContent = text;
  terminal.appendChild(p);
  terminal.scrollTop = terminal.scrollHeight;
}

function currentDeployment() {
  return deployments.find((d) => d.id === currentId);
}

// 라이브로 보이는 사이트 화면을 다시 그린다 (깨진 v4가 라이브면 에러 화면)
function renderSite() {
  const cur = currentDeployment();
  const isBroken = cur && cur.state === "error" && cur.id === "v4";
  if (isBroken) {
    siteShot.className = "site-shot broken";
    siteShot.innerHTML =
      '<div class="site-nav">My Site</div>' +
      '<h3 class="site-h">⚠ 페이지를 표시할 수 없습니다</h3>' +
      '<p class="site-p">TypeError: document.getElementByID is not a function</p>' +
      '<button class="site-btn">신청하기</button>';
    statusLine.className = "status-line bad";
    statusLine.innerHTML = "현재 라이브: <strong>v4 (깨짐)</strong> — 손님 화면이 멈췄습니다!";
  } else {
    siteShot.className = "site-shot good";
    siteShot.innerHTML =
      '<div class="site-nav">My Site</div>' +
      '<h3 class="site-h">환영합니다 🎉</h3>' +
      '<p class="site-p">정상 작동 중인 멀쩡한 페이지입니다.</p>' +
      '<button class="site-btn">신청하기</button>';
    statusLine.className = "status-line good";
    statusLine.innerHTML =
      "현재 라이브: <strong>" + (cur ? cur.id : "?") + " (정상)</strong> — 사이트가 정상입니다.";
  }
}

// 배포 목록을 다시 그린다
function renderList() {
  listEl.innerHTML = "";
  deployments.forEach((d) => {
    const isCurrent = d.id === currentId;
    const isError = d.state === "error";

    const li = document.createElement("li");
    li.className =
      "deploy-item" + (isCurrent ? " is-current" : "") + (isError ? " is-error" : "");

    // 상태 점
    const dot = document.createElement("span");
    dot.className = "dep-dot " + (isError ? "error" : "ready");
    li.appendChild(dot);

    // 가운데 정보
    const mainDiv = document.createElement("div");
    mainDiv.className = "dep-main";
    const ver = document.createElement("div");
    ver.className = "dep-ver";
    ver.textContent = d.id + " · " + d.msg;
    const meta = document.createElement("div");
    meta.className = "dep-meta";
    meta.textContent = "commit " + d.commit + " · " + d.age + " · " + (isError ? "Error" : "Ready");
    mainDiv.appendChild(ver);
    mainDiv.appendChild(meta);
    li.appendChild(mainDiv);

    // Current 배지
    if (isCurrent) {
      const pill = document.createElement("span");
      pill.className = "pill current" + (isError ? " err" : "");
      pill.textContent = "Current (라이브)";
      li.appendChild(pill);
    }

    // 롤백 버튼: 라이브가 아닌 정상(ready) 배포에만 붙는다
    if (!isCurrent && !isError) {
      const btn = document.createElement("button");
      btn.className = "rollback-btn";
      btn.textContent = "이 버전으로 롤백";
      btn.addEventListener("click", () => rollbackTo(d.id));
      li.appendChild(btn);
    }

    listEl.appendChild(li);
  });
}

// ---- 동작 -------------------------------------------------------

// 1) 고장난 v4 배포하기
function deployBad() {
  if (badDeployed) return;
  badDeployed = true;

  // v4를 목록 맨 위에 추가하고, 빌드는 통과하지만 런타임이 깨진(error) 상태로 둔다
  const bad = { ...badDeployment, state: "error" };
  deployments.unshift(bad);
  currentId = "v4";

  log("$ git push  # 오타가 든 코드를 올림");
  log("Vercel  Building (Production) ...", "dim");
  log("Vercel  Build completed — Ready", "ok");
  log("Vercel  Promoted to Production: v4", "url");
  log("⚠ 그러나 페이지를 열면 런타임 오류로 화면이 멈춥니다.", "err");
  log("   TypeError: document.getElementByID is not a function", "err");
  log("# 빌드는 통과했지만(코드 문법은 맞음) 실행 중 깨졌습니다 -> 롤백이 필요!", "dim");

  deployBadBtn.disabled = true;
  deployHint.textContent = "v4가 라이브가 되며 사이트가 깨졌습니다. 아래 목록에서 v3로 롤백하세요.";

  renderSite();
  renderList();
}

// 2) 과거 정상 배포로 롤백(되돌리기)
function rollbackTo(targetId) {
  const target = deployments.find((d) => d.id === targetId);
  if (!target) return;

  log("$ vercel rollback " + targetId + "   # (대시보드의 ⋯ -> Instant Rollback 과 동일)");
  log("Vercel  " + targetId + " 배포를 다시 Production으로 승격합니다(재빌드 없음)...", "dim");
  log("Vercel  Production now points to " + targetId, "ok");
  log("Production: " + PROD_URL + "  (이제 정상 화면 복구)", "url");
  log("# 코드를 고친 게 아니라 '과거의 멀쩡한 배포'를 다시 라이브로 가리켰을 뿐입니다.", "dim");

  currentId = targetId;
  renderSite();
  renderList();

  // 결과물 패널: 깨졌던 v4에서 정상 v3로 돌아왔을 때만 의미가 있음
  if (badDeployed && target.state === "ready") {
    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// 처음부터 다시
function resetAll() {
  deployments = baseDeployments.map((d) => ({ ...d }));
  currentId = "v3";
  badDeployed = false;
  deployBadBtn.disabled = false;
  deployHint.textContent = "누르면 새 배포 v4가 라이브가 됩니다(그리고 깨집니다).";
  terminal.innerHTML =
    '<p class="term-line dim"># 배포/롤백할 때 Vercel에서 일어나는 일이 여기에 표시됩니다</p>';
  resultSection.hidden = true;
  renderSite();
  renderList();
}

// ---- 이벤트 연결 + 초기 렌더 ------------------------------------
deployBadBtn.addEventListener("click", deployBad);
resetBtn.addEventListener("click", resetAll);

renderSite();
renderList();
