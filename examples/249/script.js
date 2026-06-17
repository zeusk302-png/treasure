// =============================================================
// 실습 249 — 상품 목록: Supabase products 표에서 SELECT 해서 카드 그리드로 그리기
// =============================================================
//
// 이 실습의 한 가지 목표:
//   Supabase 표(products)에서 상품 데이터를 '읽어(SELECT)' 와서,
//   화면에 카드 모양으로 죽 늘어놓는 것.
//   즉 "DB → 브라우저로 데이터를 읽어 그리는 흐름"입니다.
//
// 핵심 함수는 단 하나: db.from("products").select("*")

// -------------------------------------------------------------
// 1) 내 프로젝트 값 (Supabase 대시보드: Settings → API 에서 복사)
// -------------------------------------------------------------
//
// ▶ URL : 내 데이터베이스가 사는 인터넷 주소. 비밀이 아닙니다.
// ▶ anon key(공개 키, sb_publishable_...) : 브라우저에 그대로 박아도 되는 '출입증'.
//    - anon 키가 공개돼도 안전한 이유는 표에 RLS(행 수준 보안)를 켜고
//      "읽기(SELECT)만 허용" 정책을 달았기 때문입니다. (schema.sql 참고)
//    - 반대로 service_role 키(= sb_secret_...)는 RLS를 통째로 '우회'하는 마스터 키라서
//      절대! 브라우저나 깃허브에 올리면 안 됩니다. (서버에서만 비밀로 사용)
//
// 아래 두 값은 '자리표시자(placeholder)'입니다. 내 진짜 anon 값으로 바꿔 주세요.
const SUPABASE_URL = "https://여기에-내-프로젝트-ID.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_여기에-내-anon-공개키-붙여넣기";

// -------------------------------------------------------------
// 2) 연결(클라이언트) 만들기
// -------------------------------------------------------------
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// 화면 요소들 미리 잡아 두기
const gridEl = document.getElementById("product-grid"); // 카드들이 들어갈 그리드
const statusEl = document.getElementById("status");      // 안내 메시지

// 자리표시자를 안 바꾼 채 실행하면 무조건 실패하므로, 미리 알려 주는 도우미
function isPlaceholder() {
  return SUPABASE_URL.includes("여기에-내") || SUPABASE_ANON_KEY.includes("여기에-내");
}

// -------------------------------------------------------------
// 3) [읽기] products 표에서 상품 목록을 SELECT 해 오는 함수
// -------------------------------------------------------------
async function loadProducts() {
  try {
    // ★ 이 한 줄이 실습의 핵심 ★
    // from(표 이름).select("*") → 표의 모든 줄(상품)을 읽어 옵니다.
    // .order(...) 로 최신 등록 순으로 정렬해서 가져옵니다.
    const { data, error } = await db
      .from("products")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) throw error;

    console.log("✅ 상품 불러오기 성공:", data);

    // 표는 만들었는데 상품이 한 개도 없는 경우
    if (!data || data.length === 0) {
      showStatus("info", "아직 등록된 상품이 없어요. schema.sql의 4단계(예시 데이터)를 실행해 보세요.");
      return;
    }

    renderProducts(data); // 받아온 데이터를 화면에 그리기
  } catch (err) {
    console.error("❌ 상품 불러오기 실패:", err.message);

    // 비전공자도 알아볼 수 있게 자주 나는 에러를 친절히 풀어 줍니다.
    let friendly = "상품을 불러오지 못했어요: " + err.message;

    if (err.message && err.message.includes("does not exist")) {
      friendly = "products 표가 없어요. schema.sql을 Supabase SQL Editor에서 먼저 실행하세요.";
    } else if (err.message && err.message.includes("Invalid API key")) {
      friendly = "anon 키가 틀린 것 같아요. script.js의 SUPABASE_ANON_KEY를 다시 확인하세요.";
    } else if (err.message && err.message.includes("Failed to fetch")) {
      friendly = "연결에 실패했어요. SUPABASE_URL 철자와 https:// 를 확인하세요.";
    }

    showStatus("fail", friendly);
  }
}

// -------------------------------------------------------------
// 4) 받아온 상품 배열을 카드로 그려 주는 함수
// -------------------------------------------------------------
function renderProducts(products) {
  // 기존 안내 메시지(불러오는 중…)를 지우고 새로 그립니다.
  gridEl.innerHTML = "";

  products.forEach((p) => {
    const card = document.createElement("article");
    card.className = "card";

    // 가격을 1,000원 같이 천 단위 콤마로 보기 좋게 만듭니다.
    const priceText = Number(p.price).toLocaleString("ko-KR") + "원";

    // 사진 주소가 없으면 회색 빈 박스가 자연스레 보이도록 src를 비워 둡니다.
    const imgSrc = p.image_url ? p.image_url : "";
    const desc = p.description ? p.description : "";

    card.innerHTML = `
      <img src="${imgSrc}" alt="${p.name}" loading="lazy" />
      <div class="body">
        <h2 class="name">${p.name}</h2>
        <p class="desc">${desc}</p>
        <p class="price">${priceText}</p>
      </div>
    `;

    gridEl.appendChild(card);
  });
}

// -------------------------------------------------------------
// 5) 보조 함수 — 안내 메시지 표시 (그리드 안에 한 줄로)
// -------------------------------------------------------------
function showStatus(kind, text) {
  gridEl.innerHTML = `<p class="status ${kind}">${text}</p>`;
}

// -------------------------------------------------------------
// 6) 실행 트리거 — 페이지가 열리면 곧바로 상품을 불러옵니다.
// -------------------------------------------------------------
if (isPlaceholder()) {
  console.warn(
    "⚠️ 아직 자리표시자 그대로입니다. script.js의 SUPABASE_URL / SUPABASE_ANON_KEY를 내 anon 값으로 바꾸세요."
  );
  showStatus("fail", "아직 내 프로젝트 값이 입력되지 않았어요 (script.js 수정 필요)");
} else {
  loadProducts();
}
