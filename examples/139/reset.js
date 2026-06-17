// ============================================================
// 실습 139 — reset.js  (2단계: 새 비밀번호 저장)
// 메일 링크로 돌아온 사용자가 새 비밀번호를 정하면 저장합니다.
// 핵심 함수: db.auth.updateUser({ password: 새비밀번호 })
// ============================================================

const msgEl = document.getElementById("msg");
const doneBox = document.getElementById("doneBox");
const form = document.getElementById("resetForm");

// 메일 링크를 누르면 Supabase가 'recovery(복구)' 이벤트와 함께 임시 세션을 만들어 줍니다.
// 이 임시 세션이 있어야만 updateUser로 비밀번호를 바꿀 수 있습니다.
// 정상적으로 들어왔는지 확인하고, 아니면 안내합니다.
let canReset = false;

db.auth.onAuthStateChange((event) => {
  // event 예: "PASSWORD_RECOVERY" → 재설정 링크를 타고 정상 진입했다는 신호
  if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
    canReset = true;
  }
});

// 혹시 onAuthStateChange가 늦게 잡힐 때를 대비해, 현재 세션도 직접 확인합니다.
(async () => {
  const { data } = await db.auth.getSession();
  if (data.session) {
    canReset = true;
  } else {
    // 메일 링크 없이 reset.html에 직접 들어온 경우 → 임시 세션이 없습니다.
    msgEl.textContent =
      "유효한 재설정 링크로 들어와야 합니다. 비밀번호 찾기부터 다시 시도해 주세요.";
    msgEl.classList.add("show");
  }
})();

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  msgEl.classList.remove("show");

  const pw = document.getElementById("password").value;
  const pw2 = document.getElementById("password2").value;

  // 두 번 입력한 비밀번호가 같은지 먼저 확인 (오타 방지)
  if (pw !== pw2) {
    msgEl.textContent = "두 비밀번호가 서로 다릅니다. 다시 확인해 주세요.";
    msgEl.classList.add("show");
    return;
  }

  if (!canReset) {
    msgEl.textContent =
      "임시 세션이 없습니다. 재설정 메일의 링크를 다시 눌러 들어와 주세요.";
    msgEl.classList.add("show");
    return;
  }

  // 새 비밀번호 저장. 임시 세션 덕분에 '지금 이 사람'의 비밀번호가 바뀝니다.
  const { error } = await db.auth.updateUser({ password: pw });

  if (error) {
    msgEl.textContent = "변경 실패: " + error.message;
    msgEl.classList.add("show");
    return;
  }

  // 성공 → 안내를 보여주고, 임시 세션을 정리한 뒤 로그인 페이지로 보냅니다.
  doneBox.hidden = false;
  form.style.display = "none";
  await db.auth.signOut(); // 임시 세션 정리 (새 비밀번호로 다시 로그인하도록)
  setTimeout(() => {
    location.replace("login.html");
  }, 1800);
});
