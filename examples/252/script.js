// =============================================================
// 실습 252 — 주문 폼으로 주문 한 건을 Supabase orders 테이블에 저장하기
// =============================================================
//
// 이 파일이 하는 일:
//   (1) 내 프로젝트 정보(URL + anon 키)로 Supabase에 '연결'을 만든다.
//   (2) 장바구니(CART) 상품들을 화면에 그리고, +/- 버튼으로 수량을 조절한다.
//   (3) [주문하기]를 누르면, 장바구니에 담긴 '여러 상품'을 한 칸(items)에 묶고
//       총금액과 주문자 정보까지 합쳐, orders 표에 '주문 한 줄'을 insert 한다.
//   (4) 서버가 자동으로 매겨 준 id(=주문번호)를 화면에 보여 준다.
//
// 핵심 포인트(이 미니프로젝트의 주제):
//   "장바구니에 담긴 여러 데이터를 하나로 묶어, 한 번의 주문으로 저장한다."

// -------------------------------------------------------------
// 1) 내 프로젝트 값 (Supabase 대시보드: Settings → API 에서 복사)
// -------------------------------------------------------------
//
// ▶ URL : 내 데이터베이스가 사는 인터넷 주소. 비밀이 아닙니다.
// ▶ anon key(공개 키, sb_publishable_...) : 브라우저에 그대로 박아도 되는 '출입증'입니다.
//    - anon 키는 "로그인 안 한 손님" 자격으로만 들어갈 수 있는 열쇠라 공개돼도 됩니다.
//      단, 안전한 진짜 이유는 서버에 RLS(행 수준 보안)를 켜고 정책을 다는 것입니다.
//    - 반대로 service_role 키(= 신형 sb_secret_... )는 모든 보안을 우회하는
//      '마스터 키'라서 절대! 브라우저나 깃허브에 올리면 안 됩니다.
//
// 아래 두 값은 '자리표시자(placeholder)'입니다. 내 진짜 값으로 바꿔 주세요.
const SUPABASE_URL = "https://여기에-내-프로젝트-ID.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_여기에-내-anon-공개키-붙여넣기";

// -------------------------------------------------------------
// 2) 연결(클라이언트) 만들기
// -------------------------------------------------------------
// CDN 라이브러리가 전역에 만들어 준 supabase 객체의 createClient를 부릅니다.
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// -------------------------------------------------------------
// 3) 장바구니 데이터 (보통은 이전 화면에서 담아 온 값입니다.
//    여기서는 연습을 위해 코드 안에 미리 넣어 둡니다.)
// -------------------------------------------------------------
// 상품 한 개 = { name: 이름, price: 단가(원), qty: 수량 }
const CART = [
  { name: "아메리카노", price: 4500, qty: 2 },
  { name: "카페라떼",   price: 5000, qty: 1 },
  { name: "치즈케이크", price: 6500, qty: 1 },
];

// 화면 요소들 미리 잡아 두기
const cartEl = document.getElementById("cart");
const totalEl = document.getElementById("total");
const form = document.getElementById("order-form");
const nameInput = document.getElementById("name");
const phoneInput = document.getElementById("phone");
const submitBtn = document.getElementById("submit-btn");
const resultEl = document.getElementById("result");

// 숫자를 "4,500원" 처럼 보기 좋게 만드는 도우미
function won(n) {
  return n.toLocaleString("ko-KR") + "원";
}

// 장바구니 총금액 계산: (단가 × 수량)을 모두 더한다
function getTotal() {
  return CART.reduce((sum, item) => sum + item.price * item.qty, 0);
}

// -------------------------------------------------------------
// 4) 장바구니를 화면에 그리기 (수량이 바뀔 때마다 다시 그림)
// -------------------------------------------------------------
function renderCart() {
  cartEl.innerHTML = ""; // 일단 비우고 새로 그린다

  CART.forEach((item, index) => {
    const row = document.createElement("div");
    row.className = "item";
    row.innerHTML = `
      <div class="info">
        ${item.name}
        <div class="price">${won(item.price)} / 개</div>
      </div>
      <div class="qty">
        <button type="button" data-action="minus" data-index="${index}">−</button>
        <span class="count">${item.qty}</span>
        <button type="button" data-action="plus" data-index="${index}">+</button>
      </div>
    `;
    cartEl.appendChild(row);
  });

  totalEl.textContent = won(getTotal());
}

// +/- 버튼 클릭 처리 (장바구니 영역 한 곳에서 모아서 듣기 = 이벤트 위임)
cartEl.addEventListener("click", (event) => {
  const btn = event.target.closest("button");
  if (!btn) return; // 버튼이 아닌 곳을 누르면 무시

  const index = Number(btn.dataset.index);
  const action = btn.dataset.action;

  if (action === "plus") {
    CART[index].qty += 1;
  } else if (action === "minus") {
    // 수량은 1 미만으로 내려가지 않게 막는다
    CART[index].qty = Math.max(1, CART[index].qty - 1);
  }

  renderCart(); // 바뀐 수량/합계를 화면에 반영
});

// 처음 화면 그리기
renderCart();

// -------------------------------------------------------------
// 5) [주문하기] 버튼(또는 Enter)으로 폼이 제출될 때 실행
// -------------------------------------------------------------
form.addEventListener("submit", async (event) => {
  // form은 기본적으로 제출 시 페이지를 새로고침합니다.
  // 우리는 JS로 직접 저장할 거라, 그 기본 동작을 막습니다.
  event.preventDefault();

  // 값을 안 바꾸고 그대로 두면 분명히 실패하므로, 친절하게 먼저 알려줍니다.
  if (SUPABASE_URL.includes("여기에-내") || SUPABASE_ANON_KEY.includes("여기에-내")) {
    console.warn(
      "⚠️ 아직 자리표시자 그대로입니다. script.js의 SUPABASE_URL / SUPABASE_ANON_KEY를 내 값으로 바꾸세요."
    );
    showFail("아직 내 프로젝트 값이 입력되지 않았어요 (script.js 수정 필요)");
    return;
  }

  // 입력값 읽고, 앞뒤 공백 정리
  const customerName = nameInput.value.trim();
  const phone = phoneInput.value.trim();

  // 아주 기본적인 검사 (빈 칸 막기)
  if (!customerName || !phone) {
    showFail("이름과 연락처를 모두 채워 주세요.");
    return;
  }

  // 저장하는 동안 버튼을 잠가 두어 중복 주문을 막습니다.
  submitBtn.disabled = true;
  submitBtn.textContent = "주문 중…";

  // 저장 직전에 다시 한 번 총금액을 계산해 둡니다(수량이 바뀌었을 수 있으니).
  const total = getTotal();
  console.log("⏳ 주문 저장을 시도합니다…", { customerName, phone, items: CART, total });

  // ----- 핵심 한 줄: orders 표에 '주문 한 줄' 넣기 -----
  // 장바구니(CART) 전체를 items 칸에 통째로 담아 보냅니다.
  //   - items   : JSON 형태로 상품 목록 전체가 한 칸에 들어감 (여러 데이터를 '묶어' 저장)
  //   - total_price : 합계 금액
  // 컬럼 이름은 schema.sql에서 만든 표의 칸 이름과 똑같아야 합니다.
  // id, created_at은 표가 자동으로 채워 주므로 우리가 보내지 않습니다.
  const { data, error } = await db
    .from("orders")
    .insert([
      {
        customer_name: customerName,
        phone: phone,
        items: CART,         // ← 장바구니 배열을 통째로 (supabase-js가 JSON으로 변환)
        total_price: total,
      },
    ])
    .select(); // .select()를 붙이면 방금 저장된 줄(자동 채워진 id=주문번호 포함)을 돌려받습니다.

  // 버튼 원상복구
  submitBtn.disabled = false;
  submitBtn.textContent = "주문하기";

  if (error) {
    // 서버에서 에러가 돌아온 경우 (대표 원인은 README 검증법 참고)
    console.error("❌ 주문 실패:", error.message);
    showFail("주문 실패: " + error.message);
    return;
  }

  // 성공! 방금 저장된 줄이 data 배열에 담겨 돌아옵니다.
  const order = data[0];
  console.log("✅ 주문 성공! 서버가 돌려준 데이터:", order);
  showOk(
    "주문이 접수됐어요! 주문번호: " + order.id + " (결제 금액 " + won(order.total_price) + ")"
  );

  // 다음 주문을 바로 할 수 있게 입력칸 비우기
  form.reset();
});

// 결과 박스를 성공(초록)으로
function showOk(text) {
  resultEl.textContent = "✅ " + text;
  resultEl.classList.remove("fail");
  resultEl.classList.add("ok");
}

// 결과 박스를 실패(빨강)로
function showFail(text) {
  resultEl.textContent = "❌ " + text;
  resultEl.classList.remove("ok");
  resultEl.classList.add("fail");
}
