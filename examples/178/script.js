// 커스텀 도메인 구매 -> Vercel 추가 -> DNS 설정 -> 301 통일 -> 전파 -> HTTPS 자물쇠
// 흐름을 흉내 낸 연습판 스크립트. 실제 도메인/DNS/Vercel을 호출하지 않습니다.
// 단계는 순서대로만 열립니다(앞 단계를 끝내야 다음 버튼이 활성화).

// ---- DOM 참조 ---------------------------------------------------
const terminal = document.getElementById("terminal");

const domainInput = document.getElementById("domain-input");
const buyBtn = document.getElementById("buy-btn");
const buyStatus = document.getElementById("buy-status");

const addBtn = document.getElementById("add-btn");
const addStatus = document.getElementById("add-status");

const dnsBtn = document.getElementById("dns-btn");
const dnsStatus = document.getElementById("dns-status");

const redirectBtn = document.getElementById("redirect-btn");
const redirectStatus = document.getElementById("redirect-status");

const waitBtn = document.getElementById("wait-btn");
const waitStatus = document.getElementById("wait-status");

const goalCard = document.getElementById("goal-card");
const goalLock = document.getElementById("goal-lock");
const goalUrl = document.getElementById("goal-url");
const goalDesc = document.getElementById("goal-desc");

const resultSection = document.getElementById("result");
const resultDomain = document.getElementById("result-domain");
const resultRedirect = document.getElementById("result-redirect");

const resetBtn = document.getElementById("reset");

// ---- 상태 -------------------------------------------------------
let domain = "내이름.com"; // 입력값을 정리해서 보관 (자리표시자 성격)

// ---- 도우미 -----------------------------------------------------
function log(text, cls = "") {
  const p = document.createElement("p");
  p.className = "term-line" + (cls ? " " + cls : "");
  p.textContent = text;
  terminal.appendChild(p);
  terminal.scrollTop = terminal.scrollHeight;
}

function markDone(btn, label) {
  btn.classList.add("done");
  btn.textContent = label;
  btn.disabled = true;
}

function cleanDomain(raw) {
  // http(s):// 와 끝 슬래시, 앞뒤 공백만 정리. 한글 도메인도 그대로 허용(연습용).
  return raw
    .trim()
    .replace(/^https?:\/\//i, "")
    .replace(/\/+$/, "");
}

// ---- 1) 도메인 구매 --------------------------------------------
buyBtn.addEventListener("click", () => {
  const entered = cleanDomain(domainInput.value);
  if (!entered || !entered.includes(".")) {
    buyStatus.textContent = "도메인 형식이 이상해요. (예: 내이름.com 처럼 점이 있어야 합니다)";
    buyStatus.className = "step-status wait";
    return;
  }
  domain = entered;

  log(`# 1) 도메인 구매`);
  log(`등록업체에서 "${domain}" 사용 가능 확인 -> 1년 등록 완료`, "ok");

  buyStatus.textContent = `"${domain}" 구매 완료! 이제 Vercel에 연결할 수 있습니다.`;
  buyStatus.className = "step-status ok";
  markDone(buyBtn, "구매 완료 ✓");

  // 다음 단계 열기
  addBtn.disabled = false;
  addStatus.textContent = "Vercel에 도메인을 추가할 준비가 됐습니다. 버튼을 누르세요.";
  addStatus.className = "step-status";

  // 목표 카드 주소도 입력한 도메인으로 갱신
  goalUrl.innerHTML = `<span class="lock dim" id="goal-lock">🔓</span> https://${domain}`;
});

// ---- 2) Vercel에 도메인 추가 -----------------------------------
addBtn.addEventListener("click", () => {
  log(`# 2) Vercel 프로젝트(my-site)에 도메인 추가`);
  log(`Settings -> Domains -> "${domain}" 입력`, "");
  log(`Vercel: "아래 DNS 레코드를 등록업체에 넣어 주세요" 안내 표시`, "wait");

  addStatus.textContent = "Vercel이 'DNS 레코드를 넣으라'고 안내합니다. 3번으로 가세요.";
  addStatus.className = "step-status ok";
  markDone(addBtn, "도메인 추가됨 ✓");

  dnsBtn.disabled = false;
  dnsStatus.textContent = "위 표의 레코드 2줄을 등록업체에 넣고, 저장 버튼을 누르세요.";
  dnsStatus.className = "step-status";
});

// ---- 3) DNS 레코드 저장 ----------------------------------------
dnsBtn.addEventListener("click", () => {
  log(`# 3) DNS 레코드 저장 (등록업체 DNS 설정)`);
  log(`A     @     76.76.21.21            (루트 -> Vercel IP)`, "");
  log(`CNAME www   cname.vercel-dns.com   (www -> Vercel 별칭)`, "");
  log(`레코드 2줄 저장됨. (비밀값 아님 - 공개돼도 안전한 정보)`, "ok");

  dnsStatus.textContent = "DNS 레코드 저장 완료! 다음은 www/루트 통일입니다.";
  dnsStatus.className = "step-status ok";
  markDone(dnsBtn, "DNS 저장됨 ✓");

  redirectBtn.disabled = false;
  redirectStatus.textContent = "대표 주소를 고르고 '301 통일 적용'을 누르세요.";
  redirectStatus.className = "step-status";
});

// ---- 4) www / 루트 301 통일 ------------------------------------
redirectBtn.addEventListener("click", () => {
  const choice = document.querySelector('input[name="canonical"]:checked').value;
  // 루트(예: 내이름.com)에서 www를 떼고/붙이고 계산
  const root = domain.replace(/^www\./i, "");
  const canonical = choice === "www" ? `www.${root}` : root;
  const other = choice === "www" ? root : `www.${root}`;

  log(`# 4) www/루트 통일 (301 영구 이동)`);
  log(`대표 주소: ${canonical}`, "ok");
  log(`${other}  ->(301)->  ${canonical}   (한 사이트, 한 주소로 SEO 정리)`, "url");

  redirectStatus.textContent = `${other} 는 이제 ${canonical} 로 자동 이동합니다.`;
  redirectStatus.className = "step-status ok";
  markDone(redirectBtn, "301 통일됨 ✓");

  // 결과 표시용 값 보관
  resultDomain.textContent = `https://${canonical}`;
  resultRedirect.textContent = `${other} → ${canonical}`;
  goalUrl.innerHTML = `<span class="lock dim" id="goal-lock">🔓</span> https://${canonical}`;

  waitBtn.disabled = false;
  waitStatus.textContent = "이제 DNS 전파를 기다릴 차례입니다. (실제로는 수 분~수 시간)";
  waitStatus.className = "step-status";
});

// ---- 5) 전파 기다리기 -> HTTPS 자물쇠 --------------------------
waitBtn.addEventListener("click", () => {
  if (waitBtn.classList.contains("done")) return;
  waitBtn.disabled = true;
  waitBtn.textContent = "전파 기다리는 중...";

  log(`# 5) DNS 전파 기다리기 (실제로는 수 분 ~ 최대 48시간)`);
  log(`지금은 "Invalid Configuration / 사이트 못 찾음"이 떠도 정상입니다. 기다립니다...`, "wait");

  const lockEl = document.getElementById("goal-lock");

  // 전파 진행을 짧게 흉내 (실제 대기를 압축한 연출)
  setTimeout(() => log(`확인 중... (전국 DNS 안내소에 새 주소 퍼지는 중)`, "wait"), 700);
  setTimeout(() => {
    log(`DNS 전파 완료: ${resultDomain.textContent} 가 Vercel을 가리킴`, "ok");
    log(`Vercel: HTTPS 인증서 자동 발급 완료 (Let's Encrypt) -> 자물쇠 🔒`, "ok");
    log(`라이브: ${resultDomain.textContent}  (보안 연결)`, "url");

    // 목표 카드를 '라이브 + 자물쇠'로 갱신
    goalCard.classList.add("live");
    if (lockEl) {
      lockEl.textContent = "🔒";
      lockEl.classList.remove("dim");
    }
    goalDesc.innerHTML = "연결 완료! 주소창에 <strong>자물쇠(🔒)</strong>가 채워졌습니다.";

    waitBtn.classList.add("done");
    waitBtn.textContent = "전파 완료 · 자물쇠 🔒 ✓";
    waitStatus.textContent = "HTTPS 자물쇠 확인! 아래 결과물을 보세요.";
    waitStatus.className = "step-status ok";

    resultSection.hidden = false;
    resultSection.scrollIntoView({ behavior: "smooth", block: "start" });
  }, 1600);
});

// ---- 처음부터 다시 ---------------------------------------------
resetBtn.addEventListener("click", () => {
  domain = "내이름.com";
  domainInput.value = "내이름.com";

  // 터미널 초기화
  terminal.innerHTML =
    '<p class="term-line dim"># 단계를 진행하면 Vercel/DNS에서 일어나는 일이 여기에 표시됩니다</p>';

  // 각 버튼/상태 초기화
  const resets = [
    [buyBtn, "이 도메인 구매하기", buyStatus, "아직 구매 전입니다. 위 버튼을 눌러 보세요.", false],
    [addBtn, "Vercel에 my-site 프로젝트로 도메인 추가", addStatus, "1번(도메인 구매)을 먼저 끝내야 활성화됩니다.", true],
    [dnsBtn, "DNS 레코드 2줄 저장", dnsStatus, "2번(Vercel에 도메인 추가)을 먼저 끝내야 활성화됩니다.", true],
    [redirectBtn, "이 대표 주소로 301 통일 적용", redirectStatus, "3번(DNS 레코드 저장)을 먼저 끝내야 활성화됩니다.", true],
    [waitBtn, "전파 기다리기 (시뮬레이션)", waitStatus, "4번(301 통일)을 먼저 끝내야 활성화됩니다.", true],
  ];
  resets.forEach(([btn, label, status, msg, disabled]) => {
    btn.classList.remove("done");
    btn.textContent = label;
    btn.disabled = disabled;
    status.textContent = msg;
    status.className = "step-status";
  });

  // 목표 카드 초기화
  goalCard.classList.remove("live");
  goalUrl.innerHTML = '<span class="lock dim" id="goal-lock">🔓</span> https://내이름.com';
  goalDesc.innerHTML = "아직 연결 전. 아래 단계를 끝내면 여기 <strong>자물쇠(🔒)</strong>가 채워집니다.";

  // 결과 숨김
  resultSection.hidden = true;
  resultDomain.textContent = "https://내이름.com";
  resultRedirect.textContent = "www.내이름.com → 내이름.com";

  // 라디오 기본값(루트)으로
  document.querySelector('input[name="canonical"][value="root"]').checked = true;
});
