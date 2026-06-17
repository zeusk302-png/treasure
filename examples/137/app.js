// ============================================================
// 실습 137 — 로그인한 사람의 이메일·가입일 보여주는 '내 프로필' 카드
// 핵심: getUser()로 "지금 로그인한 사람이 누구인지"를 읽어 화면에 표시한다.
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
const profileCard = document.getElementById("profileCard");
const demoLogin = document.getElementById("demoLogin");
const msgEl = document.getElementById("msg");

// 날짜 문자열(ISO)을 사람이 읽기 좋은 한국어 형식으로 바꿔주는 작은 도우미.
// 예) "2026-01-15T08:30:00.123Z" → "2026년 1월 15일 17:30"
function formatDate(isoString) {
  if (!isoString) return "(정보 없음)";
  const d = new Date(isoString);
  return d.toLocaleString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

// ★ 이번 실습의 주인공: getUser()로 현재 로그인한 사용자 정보를 읽어 카드를 그립니다.
async function loadProfile() {
  // getUser()는 "지금 로그인한 사람이 누구냐"를 물어보는 함수입니다.
  // - 로그인 상태면  → data.user 안에 이메일·가입시각·id 등이 들어 있습니다.
  // - 로그아웃 상태면 → data.user 가 null 입니다. (error는 없음)
  const { data, error } = await db.auth.getUser();

  if (error) {
    profileCard.innerHTML = `<p class="locked">정보를 불러오지 못했어요: ${error.message}</p>`;
    return;
  }

  const user = data.user;

  if (!user) {
    // ── 로그아웃 상태: 보여줄 사람이 없습니다 ──
    headerEl.innerHTML = `
      <a class="logo" href="mypage.html">👤 마이페이지</a>
      <nav><a class="login-btn" href="mypage.html">로그인하러 가기</a></nav>
    `;
    profileCard.innerHTML = `<p class="locked">🔒 로그인하면 내 프로필이 여기에 표시됩니다.</p>`;
    demoLogin.style.display = "block"; // 다시 로그인할 수 있게 데모 박스 보이기
    return;
  }

  // ── 로그인 상태: user 객체에서 필요한 값들을 꺼냅니다 ──
  const email = user.email;            // 이메일 주소
  const createdAt = user.created_at;   // 가입한 시각 (계정이 처음 만들어진 때)
  const lastSignIn = user.last_sign_in_at; // 마지막으로 로그인한 시각
  const userId = user.id;              // 이 사람의 고유 번호(UUID) — DB에서 사람을 구분하는 열쇠

  // 헤더에 이메일을 표시합니다.
  headerEl.innerHTML = `
    <a class="logo" href="mypage.html">👤 마이페이지</a>
    <nav><span class="user">${email}</span></nav>
  `;

  // 프로필 카드를 채웁니다. (user id는 길고 비밀스러워 보이지만 '비밀번호'는 아닙니다.
  //  그래도 화면에 그대로 노출하기보단, 실제 서비스에선 내부 식별용으로만 쓰는 게 보통입니다.)
  profileCard.innerHTML = `
    <div class="avatar">${email.charAt(0).toUpperCase()}</div>
    <h2 class="email">${email}</h2>
    <dl class="info">
      <dt>가입일</dt>
      <dd>${formatDate(createdAt)}</dd>
      <dt>마지막 로그인</dt>
      <dd>${formatDate(lastSignIn)}</dd>
      <dt>내 user id</dt>
      <dd><code>${userId}</code></dd>
    </dl>
  `;
  demoLogin.style.display = "none"; // 로그인했으니 데모 로그인 박스는 숨기기
}

// 페이지가 열리면 곧바로 프로필을 그립니다.
loadProfile();

// onAuthStateChange: 로그인/로그아웃 순간마다 다시 호출됩니다. (실습 135에서 배운 패턴)
// 데모 박스로 로그인하면 'SIGNED_IN'이 들어와 다시 그려집니다.
db.auth.onAuthStateChange((event) => {
  console.log("인증 상태 변화:", event);
  loadProfile();
});

// ──────────────────────────────────────────────────────────
// 아래는 '프로필을 보려면 먼저 로그인부터' 하라고 넣은 데모용 로그인 처리입니다.
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
  // 성공하면 onAuthStateChange가 'SIGNED_IN'으로 호출되어 loadProfile이 카드를 그립니다.
});
