// =============================================================
// 실습 251 — 상품 상세: 주소창의 ?id= 값으로 상품 '한 개'만 불러오기
// =============================================================
//
// 이 실습의 한 가지 목표:
//   주소창(URL)에 붙은 ?id=값 을 읽어서,
//   그 id에 해당하는 상품 '한 개'를 Supabase에서 가져와 상세 화면에 보여 주는 것.
//   즉 "URL 쿼리(?key=value) → DB에서 그 한 줄만 조회 → 동적으로 화면 표시" 흐름입니다.
//
// 핵심 두 줄:
//   1) const id = new URLSearchParams(location.search).get("id");  // 주소에서 id 꺼내기
//   2) db.from("products").select("*").eq("id", id).single();      // 그 id 한 줄만 읽기

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
const statusEl = document.getElementById("status"); // 안내 메시지
const detailEl = document.getElementById("detail"); // 상세 카드(처음엔 hidden)
const imgEl = document.getElementById("img");
const nameEl = document.getElementById("name");
const priceEl = document.getElementById("price");
const descEl = document.getElementById("desc");
const backEl = document.getElementById("back");

// 자리표시자를 안 바꾼 채 실행하면 무조건 실패하므로, 미리 알려 주는 도우미
function isPlaceholder() {
  return SUPABASE_URL.includes("여기에-내") || SUPABASE_ANON_KEY.includes("여기에-내");
}

// -------------------------------------------------------------
// 3) [핵심 ①] 주소창에서 ?id= 값을 꺼내기
// -------------------------------------------------------------
// location.search 는 주소에서 '?' 부터 끝까지의 글자입니다. 예) "?id=2"
// URLSearchParams 는 그 글자를 사전처럼 다루게 해 주는 도구입니다.
// .get("id") 로 id 값만 쏙 뽑아 옵니다. (?id=2 면 문자열 "2")
// id가 아예 없으면(그냥 index.html 로 열면) null 이 됩니다.
function getIdFromUrl() {
  const params = new URLSearchParams(location.search);
  return params.get("id"); // 예: "2" 또는 null
}

// -------------------------------------------------------------
// 4) [핵심 ②] 그 id 한 줄만 Supabase에서 읽어 오는 함수
// -------------------------------------------------------------
async function loadProduct(id) {
  try {
    // ★ 이 한 줄이 실습의 핵심 ★
    // .eq("id", id)  → "id 칸이 이 값과 같은(equal) 줄만 골라라"
    // .single()      → "결과가 딱 한 줄일 것이다. 배열이 아니라 객체로 달라"
    //                  (0줄이거나 2줄 이상이면 일부러 에러를 내 줍니다 → 처리 쉬움)
    const { data, error } = await db
      .from("products")
      .select("*")
      .eq("id", id)
      .single();

    if (error) throw error;

    console.log("✅ 상품 불러오기 성공:", data);
    renderProduct(data); // 받아온 한 개를 화면에 그리기
  } catch (err) {
    console.error("❌ 상품 불러오기 실패:", err.message);

    // 비전공자도 알아볼 수 있게 자주 나는 에러를 친절히 풀어 줍니다.
    let friendly = "상품을 불러오지 못했어요: " + err.message;

    if (err.message && err.message.includes("does not exist")) {
      friendly = "products 표가 없어요. schema.sql을 Supabase SQL Editor에서 먼저 실행하세요.";
    } else if (
      // .single() 인데 0줄이 나오면 "조회 결과가 없다"는 뜻의 에러가 납니다.
      (err.message && err.message.includes("Results contain 0 rows")) ||
      (err.code && err.code === "PGRST116")
    ) {
      friendly = `id=${id} 인 상품이 없어요. 주소창의 id 값을 확인하세요 (예: ?id=1).`;
    } else if (err.message && err.message.includes("Invalid API key")) {
      friendly = "anon 키가 틀린 것 같아요. script.js의 SUPABASE_ANON_KEY를 다시 확인하세요.";
    } else if (err.message && err.message.includes("Failed to fetch")) {
      friendly = "연결에 실패했어요. SUPABASE_URL 철자와 https:// 를 확인하세요.";
    }

    showStatus("fail", friendly);
  }
}

// -------------------------------------------------------------
// 5) 받아온 상품 한 개를 상세 카드에 채워 넣는 함수
// -------------------------------------------------------------
function renderProduct(p) {
  // 가격을 1,000원 같이 천 단위 콤마로 보기 좋게 만듭니다.
  const priceText = Number(p.price).toLocaleString("ko-KR") + "원";

  // 이름·가격·설명은 innerHTML이 아니라 textContent로 넣습니다.
  // 왜? innerHTML로 넣으면 데이터에 섞인 <script> 같은 태그가 '코드'로 실행될 수 있어(XSS 위험)
  //     글자를 '글자 그대로만' 안전하게 보여 주는 textContent를 씁니다.
  imgEl.src = p.image_url ? p.image_url : "";
  imgEl.alt = p.name;
  nameEl.textContent = p.name;
  priceEl.textContent = priceText;
  descEl.textContent = p.description ? p.description : "";

  // '다른 상품도 보기' 링크는 목록 페이지(실습 249)로 보냅니다.
  // (목록을 따로 안 만들었다면 이 링크는 그냥 데모용입니다.)
  backEl.href = "../249/index.html";

  // 안내 메시지를 감추고, 상세 카드를 보여 줍니다.
  statusEl.hidden = true;
  detailEl.hidden = false;

  // 브라우저 탭 제목도 상품 이름으로 바꿔 줍니다 (동적 페이지다운 마무리).
  document.title = p.name + " — 상품 상세";
}

// -------------------------------------------------------------
// 6) 보조 함수 — 안내 메시지 표시
// -------------------------------------------------------------
function showStatus(kind, text) {
  detailEl.hidden = true;
  statusEl.hidden = false;
  statusEl.className = "status " + kind;
  statusEl.textContent = text;
}

// -------------------------------------------------------------
// 7) 실행 트리거 — 페이지가 열리면 곧바로 시작
// -------------------------------------------------------------
if (isPlaceholder()) {
  console.warn(
    "⚠️ 아직 자리표시자 그대로입니다. script.js의 SUPABASE_URL / SUPABASE_ANON_KEY를 내 anon 값으로 바꾸세요."
  );
  showStatus("fail", "아직 내 프로젝트 값이 입력되지 않았어요 (script.js 수정 필요)");
} else {
  const id = getIdFromUrl();
  if (!id) {
    // 주소에 ?id= 가 없는 경우 (그냥 index.html 로 연 경우)
    showStatus("info", "주소 끝에 ?id=1 처럼 상품 번호를 붙여서 열어 주세요 (예: index.html?id=2).");
  } else {
    loadProduct(id);
  }
}
