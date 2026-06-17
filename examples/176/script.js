// 브랜치 -> Preview 배포 흐름을 흉내 낸 연습판 스크립트
// 실제 Git/Vercel을 호출하지 않습니다. 단계 버튼을 순서대로 눌러 흐름을 체험합니다.

// ---- 설정값 (자리표시자) ----------------------------------------
// 실제 주소는 본인 프로젝트/계정에 따라 달라집니다. 아래는 형식만 보여주는 예시입니다.
const BRANCH = "feature/new-hero";
// Vercel Preview URL 형식: <프로젝트>-git-<브랜치>-<계정스코프>.vercel.app
//  - 브랜치명의 슬래시(/)는 하이픈(-)으로 바뀝니다.  feature/new-hero -> feature-new-hero
const PREVIEW_URL =
  "https://my-site-git-feature-new-hero-myname.vercel.app";
const PROD_URL = "https://my-site.vercel.app";

// ---- DOM 참조 ---------------------------------------------------
const buttons = document.querySelectorAll(".run");
const terminal = document.getElementById("terminal");
const previewCard = document.getElementById("preview-card");
const previewEmpty = document.getElementById("preview-empty");
const resultSection = document.getElementById("result");
const resultUrl = document.getElementById("result-url");
const resetBtn = document.getElementById("reset");

// 단계 순서 (앞 단계를 끝내야 다음 버튼이 열림)
const ORDER = ["branch", "commit", "push", "deploy"];

// ---- 도우미 -----------------------------------------------------
function log(text, cls = "") {
  const p = document.createElement("p");
  p.className = "term-line" + (cls ? " " + cls : "");
  p.textContent = text;
  terminal.appendChild(p);
  terminal.scrollTop = terminal.scrollHeight;
}

function btnFor(step) {
  return document.querySelector(`.run[data-step="${step}"]`);
}

function enableNext(step) {
  const idx = ORDER.indexOf(step);
  const next = ORDER[idx + 1];
  if (next) btnFor(next).disabled = false;
}

// 각 단계가 하는 일
const actions = {
  branch() {
    log(`$ git checkout -b ${BRANCH}`);
    log(`Switched to a new branch '${BRANCH}'`, "ok");
    log(`# main은 그대로. 지금부터의 변경은 이 브랜치에만 쌓입니다.`, "dim");
  },
  commit() {
    log(`$ git commit -am "히어로 문구 변경"`);
    log(`[${BRANCH} a1b2c3d] 히어로 문구 변경`, "ok");
    log(` 1 file changed, 3 insertions(+), 1 deletion(-)`, "dim");
  },
  push() {
    log(`$ git push -u origin ${BRANCH}`);
    log(`To github.com:myname/my-site.git`, "dim");
    log(` * [new branch]      ${BRANCH} -> ${BRANCH}`, "ok");
    log(`# Vercel이 새 브랜치 push를 감지했습니다. Preview 배포를 시작합니다…`, "dim");
  },
  deploy() {
    log(`Vercel  Building...`, "dim");
    log(`Vercel  Deployment ready`, "ok");
    log(`Preview: ${PREVIEW_URL}`, "url");
    // 보드/결과 갱신
    previewEmpty.hidden = true;
    previewCard.hidden = false;
    resultUrl.textContent = PREVIEW_URL;
    resultSection.hidden = false;
    log(`# Production(${PROD_URL})은 변하지 않았습니다.`, "dim");
  },
};

// ---- 이벤트 -----------------------------------------------------
buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const step = btn.dataset.step;
    actions[step]();
    btn.disabled = true;
    btn.classList.add("done");
    btn.textContent = "완료 ✓";
    enableNext(step);
  });
});

resetBtn.addEventListener("click", () => {
  // 터미널 비우기
  terminal.innerHTML =
    '<p class="term-line dim">$ # 위 단계를 순서대로 실행하면 여기에 로그가 나옵니다</p>';
  // 보드 초기화
  previewCard.hidden = true;
  previewEmpty.hidden = false;
  resultSection.hidden = true;
  // 버튼 초기화: 첫 단계만 활성
  buttons.forEach((btn, i) => {
    btn.classList.remove("done");
    btn.textContent = btn.dataset.step === "deploy" ? "배포 진행" : "실행";
    btn.disabled = i !== 0;
  });
});

// 초기 상태: 첫 단계 버튼만 활성화 (HTML의 disabled로 이미 처리됨)
