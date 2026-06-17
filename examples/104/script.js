// ============================================================
// 3단계 가입 폼 (멀티스텝 폼)
//
// 핵심 아이디어:
//  - 3개의 단계(패널)를 HTML에 모두 만들어 두고, "지금 단계만 보이게" 한다.
//  - currentStep 이라는 변수 하나가 "지금 몇 단계인지"를 기억한다. (= 단계 상태 관리)
//  - '다음'을 누르면 먼저 그 단계를 검증하고, 통과해야만 다음으로 넘어간다. (= 단계별 검증)
// ============================================================

// ---- 화면 요소 미리 찾아 두기 ----
const form = document.getElementById("signup-form");
const stepItems = document.querySelectorAll("#steps .step"); // 위쪽 인디케이터 1·2·3
const panels = document.querySelectorAll(".step-panel");      // 단계별 입력 묶음(fieldset)
const prevBtn = document.getElementById("prev-btn");
const nextBtn = document.getElementById("next-btn");
const submitBtn = document.getElementById("submit-btn");
const summary = document.getElementById("summary");
const doneMsg = document.getElementById("done-msg");

const TOTAL_STEPS = panels.length; // 3

// ---- 단계 상태: 지금 몇 단계에 있는지 (1부터 시작) ----
let currentStep = 1;

// ============================================================
// 1) 화면 그리기: currentStep에 맞춰 보이는 것/버튼을 정리한다.
// ============================================================
function render() {
  // (1) 단계 패널: 지금 단계만 보이고 나머지는 숨긴다.
  panels.forEach((panel) => {
    const step = Number(panel.dataset.panel);
    panel.hidden = step !== currentStep;
  });

  // (2) 위쪽 인디케이터: 지나온 단계는 done(초록), 지금은 active(파랑).
  stepItems.forEach((item) => {
    const step = Number(item.dataset.step);
    item.classList.toggle("active", step === currentStep);
    item.classList.toggle("done", step < currentStep);
  });

  // (3) 버튼: 첫 단계엔 '이전' 숨김, 마지막 단계엔 '다음' 대신 '가입 완료'.
  prevBtn.hidden = currentStep === 1;
  const isLast = currentStep === TOTAL_STEPS;
  nextBtn.hidden = isLast;
  submitBtn.hidden = !isLast;

  // (4) 마지막 단계로 오면 앞에서 입력한 값을 요약해 보여 준다.
  if (isLast) {
    fillSummary();
  }
}

// ============================================================
// 2) 단계별 검증: 지금 단계의 입력이 올바른지 확인한다.
//    한 군데라도 틀리면 false를 돌려주고, 빨간 메시지를 띄운다.
// ============================================================
function validateStep(step) {
  let ok = true;

  if (step === 1) {
    const email = document.getElementById("email");
    const password = document.getElementById("password");

    // 이메일: 'something@something.something' 모양인지 간단히 검사
    const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailPattern.test(email.value.trim())) {
      showError(email, "올바른 이메일 형식을 입력하세요.");
      ok = false;
    } else {
      clearError(email);
    }

    // 비밀번호: 8자 이상
    if (password.value.length < 8) {
      showError(password, "비밀번호는 8자 이상이어야 합니다.");
      ok = false;
    } else {
      clearError(password);
    }
  }

  if (step === 2) {
    const nickname = document.getElementById("nickname");
    const age = document.getElementById("age");

    // 닉네임: 2~10글자
    const nameLen = nickname.value.trim().length;
    if (nameLen < 2 || nameLen > 10) {
      showError(nickname, "닉네임은 2~10글자로 입력하세요.");
      ok = false;
    } else {
      clearError(nickname);
    }

    // 나이: 14세 이상 (숫자)
    const ageNum = Number(age.value);
    if (age.value === "" || Number.isNaN(ageNum) || ageNum < 14) {
      showError(age, "만 14세 이상의 나이를 입력하세요.");
      ok = false;
    } else {
      clearError(age);
    }
  }

  if (step === 3) {
    const agree = document.getElementById("agree");
    if (!agree.checked) {
      showError(agree, "약관에 동의해야 가입할 수 있습니다.");
      ok = false;
    } else {
      clearError(agree);
    }
  }

  return ok;
}

// 에러 메시지 보이기: 입력칸을 빨갛게 + 아래 문구 표시
function showError(inputEl, message) {
  const box = document.querySelector(`[data-error-for="${inputEl.name}"]`);
  if (box) box.textContent = message;
  inputEl.classList.add("invalid");
}

// 에러 메시지 지우기
function clearError(inputEl) {
  const box = document.querySelector(`[data-error-for="${inputEl.name}"]`);
  if (box) box.textContent = "";
  inputEl.classList.remove("invalid");
}

// ============================================================
// 3) 3단계 요약 채우기: 앞에서 입력한 값을 사람이 읽기 좋게 보여 준다.
// ============================================================
function fillSummary() {
  const email = document.getElementById("email").value.trim();
  const nickname = document.getElementById("nickname").value.trim();
  const age = document.getElementById("age").value;

  summary.innerHTML = `
    <dt>이메일</dt><dd>${escapeHtml(email)}</dd>
    <dt>닉네임</dt><dd>${escapeHtml(nickname)}</dd>
    <dt>나이</dt><dd>${escapeHtml(age)}세</dd>
  `;
}

// 입력값을 화면에 넣을 때 안전하게 처리(태그가 그대로 실행되지 않도록)
function escapeHtml(text) {
  const div = document.createElement("div");
  div.textContent = text;
  return div.innerHTML;
}

// ============================================================
// 4) 버튼 동작 연결
// ============================================================

// '다음': 지금 단계를 검증 → 통과하면 한 단계 앞으로
nextBtn.addEventListener("click", () => {
  if (!validateStep(currentStep)) return; // 검증 실패 시 멈춤
  if (currentStep < TOTAL_STEPS) {
    currentStep += 1;
    render();
  }
});

// '이전': 검증 없이 한 단계 뒤로 (입력 고치러 갈 수 있게)
prevBtn.addEventListener("click", () => {
  if (currentStep > 1) {
    currentStep -= 1;
    render();
  }
});

// '가입 완료'(submit): 마지막 단계까지 검증한 뒤 완료 처리
form.addEventListener("submit", (event) => {
  event.preventDefault(); // 페이지가 새로고침되지 않게 막는다

  // 안전망: 모든 단계를 한 번 더 검증
  for (let step = 1; step <= TOTAL_STEPS; step++) {
    if (!validateStep(step)) {
      currentStep = step; // 문제 있는 단계로 되돌려 보여 준다
      render();
      return;
    }
  }

  // 통과 → 폼을 숨기고 성공 메시지 표시
  form.hidden = true;
  document.getElementById("steps").hidden = true;
  doneMsg.hidden = false;

  // (실전에서는 여기서 Supabase 등 서버로 값을 보낸다. 다음 단계 105 참고)
});

// ---- 첫 화면 그리기 ----
render();
