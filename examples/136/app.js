// ============================================================
// 실습 136 — 로그아웃 버튼 만들고 깔끔하게 빠져나가기
// 핵심: signOut으로 세션을 지우고 → 화면의 보호 데이터를 비우고 → 로그인 페이지로 보낸다.
// ============================================================

// 아래 두 값을 내 Supabase 프로젝트 값으로 바꾸세요. (Settings → API)
// anon(publishable) 키는 '공개돼도 되는 출입증'이라 브라우저에 둬도 됩니다.
// service_role(secret) 키는 절대 여기에 넣지 마세요 — RLS를 통째로 우회합니다.
const SUPABASE_URL = "https://여기에-내-프로젝트.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_여기에-내-anon-키";

// Supabase 클라이언트 생성 (persistSession 기본값 true → 새로고침해도 로그인 유지)
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 자주 쓰는 화면 요소들을 미리 잡아둡니다.
const headerEl = document.getElementById("appHeader");
const secretBox = document.getElementById("secretBox");
const demoLogin = document.getElementById("demoLogin");
const logoutMainBtn = document.getElementById("logoutMain");
const msgEl = document.getElementById("msg");

// ★ 이번 실습의 주인공 함수: 로그아웃 처리.
//   순서가 중요합니다 — (1) 세션 지우기 → (2) 화면 정리 → (3) 로그인 페이지로 이동.
async function logout() {
  // (1) 세션 지우기: signOut을 부르면 브라우저에 저장돼 있던 로그인 정보가 삭제됩니다.
  //     scope: "local"  = 이 브라우저의 세션만 (기본값)
  //     scope: "global" = 다른 기기·탭의 세션까지 전부 (모든 기기에서 로그아웃)
  const { error } = await db.auth.signOut();
  if (error) {
    alert("로그아웃 중 문제가 생겼어요: " + error.message);
    return; // 실패하면 화면을 지우지 않고 멈춥니다.
  }

  // (2) 화면 정리: 세션만 지우고 화면을 그대로 두면, 방금까지 보던 '비밀 메모'가
  //     글자 그대로 화면에 남아 있습니다. 다음 사람이 그대로 볼 수 있으니 꼭 비웁니다.
  secretBox.innerHTML = "";

  // (3) 로그인 페이지로 이동.
  //     replace를 쓰면 '뒤로 가기'를 눌러도 보호 페이지로 되돌아오지 못합니다.
  //     (이 실습 폴더엔 login.html이 없으니, 같은 줄을 켜서 실제 경로로 바꿔 쓰세요.)
  alert("로그아웃되었습니다. 로그인 페이지로 이동합니다.");
  // window.location.replace("login.html");

  // ↑ 실제 서비스에서는 위 한 줄로 끝입니다. 이 데모에서는 페이지 이동 대신
  //   onAuthStateChange가 'SIGNED_OUT'을 받아 헤더/데모박스를 로그아웃 상태로 다시 그립니다.
}

// 로그인 상태에 맞춰 '보호 데이터'와 헤더를 그리는 함수.
function render(session) {
  if (session) {
    // ── 로그인 상태 ──
    const email = session.user.email;
    headerEl.innerHTML = `
      <a class="logo" href="index.html">🔒 마이페이지</a>
      <nav>
        <span class="user">${email}</span>
        <button id="logoutHeader">로그아웃</button>
      </nav>
    `;
    // 헤더의 작은 로그아웃 버튼에도 같은 logout 함수를 연결합니다.
    document.getElementById("logoutHeader").addEventListener("click", logout);

    // 로그인한 사람에게만 보여줄 '비밀 메모'(보호 데이터)를 그립니다.
    // 실제 서비스라면 여기서 db.from('memos').select() 로 DB에서 가져오겠지만,
    // 이 실습은 '로그아웃 시 화면 정리'가 주제라 예시 텍스트로 대신합니다.
    secretBox.innerHTML = `
      <p>📝 ${email} 님만 볼 수 있는 비밀 메모입니다.</p>
      <p>이번 주 비밀번호 힌트, 다음 달 여행 계획… 같은 개인 정보가 여기 있다고 상상해 보세요.</p>
    `;
    logoutMainBtn.style.display = "block"; // 큰 로그아웃 버튼 보이기
    demoLogin.style.display = "none";      // 로그인했으니 데모 로그인 박스는 숨기기
  } else {
    // ── 로그아웃 상태 ──
    headerEl.innerHTML = `
      <a class="logo" href="index.html">🔒 마이페이지</a>
      <nav>
        <a class="login-btn" href="index.html">로그인하러 가기</a>
      </nav>
    `;
    // 보호 데이터는 반드시 비웁니다. (로그아웃했는데 비밀 메모가 남으면 안 됨)
    secretBox.innerHTML = `<p class="locked">🔒 로그인해야 비밀 메모를 볼 수 있어요.</p>`;
    logoutMainBtn.style.display = "none"; // 큰 로그아웃 버튼 숨기기
    demoLogin.style.display = "block";    // 다시 로그인할 수 있게 데모 박스 보이기
  }
}

// 본문의 큰 로그아웃 버튼에도 같은 logout 함수를 연결합니다.
logoutMainBtn.addEventListener("click", logout);

// onAuthStateChange: 로그인/로그아웃 순간마다 다시 호출됩니다. (실습 135에서 배운 패턴)
// 페이지가 처음 열릴 때도 현재 세션을 들고 한 번 호출되므로, 초기 화면이 알맞게 그려집니다.
db.auth.onAuthStateChange((event, session) => {
  console.log("인증 상태 변화:", event); // 로그아웃하면 'SIGNED_OUT'이 찍힙니다.
  render(session);
});

// ──────────────────────────────────────────────────────────
// 아래는 '로그아웃을 체험하려면 먼저 로그인부터' 하라고 넣은 데모용 로그인 처리입니다.
// 실제 서비스라면 로그인은 login.html(실습 132)에서 합니다.
// ──────────────────────────────────────────────────────────
document.getElementById("loginForm").addEventListener("submit", async (e) => {
  e.preventDefault();
  msgEl.classList.remove("show");
  const email = document.getElementById("email").value.trim();
  const password = document.getElementById("password").value;

  const { error } = await db.auth.signInWithPassword({ email, password });
  if (error) {
    msgEl.textContent = "로그인 실패: " + error.message;
    msgEl.classList.add("show");
  }
  // 성공하면 onAuthStateChange가 'SIGNED_IN'으로 호출되어 render가 로그인 화면을 그립니다.
});
