// Pull Request -> Preview 검토 -> Merge -> Production 반영 흐름을 흉내 낸 연습판 스크립트
// 실제 GitHub/Vercel을 호출하지 않습니다. 검토 체크리스트를 모두 통과해야 Merge가 열립니다.

// ---- 설정값 (자리표시자) ----------------------------------------
// 실제 주소/번호는 본인 프로젝트와 계정에 따라 달라집니다. 아래는 형식만 보여주는 예시입니다.
const PR_NUMBER = 42;
const BRANCH = "feature/new-hero";
const PROD_URL = "https://my-site.vercel.app";
// Preview URL 형식: <프로젝트>-git-<브랜치>-<계정스코프>.vercel.app  (슬래시 / 는 하이픈 - 으로 변환)
const PREVIEW_URL = "https://my-site-git-feature-new-hero-myname.vercel.app";

// ---- DOM 참조 ---------------------------------------------------
const checks = document.querySelectorAll(".chk");
const mergeBtn = document.getElementById("merge-btn");
const mergeHint = document.getElementById("merge-hint");
const terminal = document.getElementById("terminal");
const prState = document.getElementById("pr-state");
const prodDesc = document.getElementById("prod-desc");
const prodCard = document.querySelector(".deploy.prod");
const resultSection = document.getElementById("result");
const resetBtn = document.getElementById("reset");

// ---- 도우미 -----------------------------------------------------
function log(text, cls = "") {
  const p = document.createElement("p");
  p.className = "term-line" + (cls ? " " + cls : "");
  p.textContent = text;
  terminal.appendChild(p);
  terminal.scrollTop = terminal.scrollHeight;
}

function allChecked() {
  return Array.from(checks).every((c) => c.checked);
}

function refreshMergeButton() {
  if (allChecked()) {
    mergeBtn.disabled = false;
    mergeHint.textContent = "검토 완료! 이제 Merge할 수 있습니다.";
  } else {
    mergeBtn.disabled = true;
    mergeHint.textContent = "위 4가지를 모두 체크하면 열립니다";
  }
}

// ---- 이벤트 -----------------------------------------------------
checks.forEach((c) => c.addEventListener("change", refreshMergeButton));

mergeBtn.addEventListener("click", () => {
  // 한 번만 실행
  if (mergeBtn.classList.contains("done")) return;

  log(`# Pull Request #${PR_NUMBER} 검토 통과 -> Merge 진행`);
  log(`Merge pull request #${PR_NUMBER} from ${BRANCH}`, "ok");
  log(`Merged into main (commit e5f6a7b)`, "ok");
  log(`# main이 갱신됐습니다. Vercel이 main push를 감지해 Production 배포를 시작합니다...`, "dim");
  log(`Vercel  Building (Production)...`, "dim");
  log(`Vercel  Production deployment ready`, "ok");
  log(`Production: ${PROD_URL}  (이제 초록 버튼 반영)`, "url");

  // PR 상태: Open -> Merged
  prState.textContent = "● Merged";
  prState.classList.remove("open");
  prState.classList.add("merged");

  // Production 카드 갱신
  prodCard.classList.add("updated");
  // innerHTML을 쓰는 이유: 문구 안에 <strong> 강조 태그를 넣어야 해서입니다.
  // 여기서는 우리가 직접 적은 "고정 문자열"만 넣으므로 안전합니다. 만약 사용자가 입력한 값을
  // 화면에 보여줄 때는 innerHTML 대신 textContent를 써야 합니다(innerHTML은 <script>가 끼면
  // 실행되는 XSS 위험이 있기 때문). — 이 차이가 보안의 핵심 포인트라 적어 둡니다.
  prodDesc.innerHTML = "검토를 거쳐 반영 완료. <strong>이제 버튼이 초록</strong>입니다.";

  // 버튼 상태 고정
  mergeBtn.classList.add("done");
  mergeBtn.textContent = "Merged ✓";
  mergeBtn.disabled = true;
  mergeHint.textContent = "병합 완료. 아래 결과물을 확인하세요.";

  // 결과 패널 표시
  resultSection.hidden = false;
  resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
});

resetBtn.addEventListener("click", () => {
  // 체크 초기화
  checks.forEach((c) => (c.checked = false));
  // 터미널 초기화
  terminal.innerHTML =
    '<p class="term-line dim"># Merge하면 GitHub와 Vercel에서 일어나는 일이 여기에 표시됩니다</p>';
  // PR 상태 초기화
  prState.textContent = "● Open";
  prState.classList.remove("merged");
  prState.classList.add("open");
  // Production 카드 초기화
  prodCard.classList.remove("updated");
  prodDesc.innerHTML = "진짜 손님이 보는 화면. <strong>아직 옛날 버튼 색(파랑)</strong> 그대로입니다.";
  // Merge 버튼 초기화
  mergeBtn.classList.remove("done");
  mergeBtn.textContent = "Merge pull request";
  // 결과 숨김 + 버튼 상태 재계산
  resultSection.hidden = true;
  refreshMergeButton();
});

// 초기 상태 계산
refreshMergeButton();
