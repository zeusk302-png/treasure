// =============================================================
// 실습 250 — 쇼핑몰 장바구니 (localStorage 버전)
//
// 이 파일이 이번 실습의 "핵심 결과물"입니다.
//
// 큰 그림(이 4단계만 기억하면 됩니다):
//  1) cart 라는 배열 하나가 "장바구니의 진실"이다. (= 상태, state)
//  2) 담기/빼기/수량변경 함수는 오직 이 cart 배열만 고친다.
//  3) cart가 바뀌면 → 화면을 처음부터 다시 그린다(render).
//                  → 그리고 localStorage에 통째로 저장한다(save).
//  4) 페이지를 열 때 localStorage에서 cart를 불러온다(load).
//
// 화면을 직접 조금씩 고치지 않고, "배열을 원본으로 두고 매번 새로
// 그리는" 방식이라 실수가 적고 이해하기 쉽습니다.
// =============================================================

// ---------------------------------------------------------------
// 0. 판매 중인 상품 목록 (고정 데이터)
//    실제 쇼핑몰이라면 이 부분이 서버/DB에서 옵니다. 지금은 연습이라
//    코드 안에 직접 적어 둡니다. id는 상품을 구분하는 고유 번호.
// ---------------------------------------------------------------
const PRODUCTS = [
  { id: "p1", name: "아메리카노", price: 3000, emoji: "☕" },
  { id: "p2", name: "카페라떼", price: 4000, emoji: "🥛" },
  { id: "p3", name: "치즈케이크", price: 6500, emoji: "🍰" },
  { id: "p4", name: "크루아상", price: 3500, emoji: "🥐" },
  { id: "p5", name: "샌드위치", price: 5500, emoji: "🥪" },
  { id: "p6", name: "쿠키", price: 2000, emoji: "🍪" },
];

// localStorage에 저장할 때 쓸 "이름표(key)". 다른 사이트와 안 겹치게 고유하게.
const STORAGE_KEY = "mini-cart-250";

// ---------------------------------------------------------------
// 1. 장바구니 상태(state)
//    각 항목은 { id, qty } 모양이다.
//      - id : 어떤 상품인지 (PRODUCTS의 id와 짝)
//      - qty: 그 상품을 몇 개 담았는지 (수량)
//    가격/이름은 여기 저장하지 않는다. 필요하면 id로 PRODUCTS에서 찾는다.
//    (가격을 두 군데 적어두면 한쪽만 바뀌어 어긋나기 쉽기 때문)
// ---------------------------------------------------------------
let cart = [];

// 화면에서 자주 쓰는 요소들을 미리 찾아둔다.
const productListEl = document.getElementById("product-list");
const cartListEl = document.getElementById("cart-list");
const cartEmptyEl = document.getElementById("cart-empty");
const totalCountEl = document.getElementById("total-count");
const totalPriceEl = document.getElementById("total-price");
const clearBtn = document.getElementById("clear-cart");

// ---------------------------------------------------------------
// 2. localStorage 저장/불러오기
//    localStorage에는 "문자열"만 저장할 수 있다. 그래서
//      - 저장할 때 : 배열 → JSON.stringify로 문자열로 바꿔 넣고
//      - 불러올 때 : 문자열 → JSON.parse로 다시 배열로 되돌린다.
// ---------------------------------------------------------------
function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(cart));
}

function load() {
  const saved = localStorage.getItem(STORAGE_KEY);
  // 저장된 게 없으면 빈 장바구니로 시작
  if (!saved) {
    cart = [];
    return;
  }
  try {
    cart = JSON.parse(saved);
  } catch (e) {
    // 저장값이 깨졌을 때를 대비한 안전장치
    console.warn("저장된 장바구니를 읽지 못해 새로 시작합니다.", e);
    cart = [];
  }
}

// ---------------------------------------------------------------
// 3. 상품 id로 PRODUCTS에서 상품 정보(이름·가격)를 찾아 주는 도우미
// ---------------------------------------------------------------
function findProduct(id) {
  return PRODUCTS.find(function (p) {
    return p.id === id;
  });
}

// ---------------------------------------------------------------
// 4. 합계 계산 (이번 실습의 핵심 로직)
//    cart 배열을 한 바퀴 돌며
//      - 총 개수   = 각 항목 qty를 모두 더한 값
//      - 총 금액   = (상품 가격 × qty)를 모두 더한 값
// ---------------------------------------------------------------
function calcTotals() {
  let count = 0;
  let price = 0;

  cart.forEach(function (item) {
    const product = findProduct(item.id);
    if (!product) return; // 혹시 모를 잘못된 id는 건너뛴다

    count += item.qty;
    price += product.price * item.qty;
  });

  return { count: count, price: price };
}

// 숫자를 "1,000" 처럼 천 단위 콤마가 있는 보기 좋은 형태로 바꾼다.
function formatPrice(n) {
  return n.toLocaleString("ko-KR");
}

// ---------------------------------------------------------------
// 5. 상태를 바꾸는 함수들 (오직 cart 배열만 손댄다)
// ---------------------------------------------------------------

// (담기) 같은 상품이 이미 있으면 수량 +1, 없으면 새로 추가
function addToCart(id) {
  const existing = cart.find(function (item) {
    return item.id === id;
  });

  if (existing) {
    existing.qty += 1;
  } else {
    cart.push({ id: id, qty: 1 });
  }
  update(); // 상태가 바뀌었으니 화면 다시 그리기 + 저장
}

// (수량 변경) +1 / -1. delta는 +1 또는 -1이 들어온다.
function changeQty(id, delta) {
  const item = cart.find(function (it) {
    return it.id === id;
  });
  if (!item) return;

  item.qty += delta;

  // 수량이 0 이하가 되면 장바구니에서 아예 뺀다.
  if (item.qty <= 0) {
    removeFromCart(id);
    return; // removeFromCart 안에서 update()를 부르므로 여기서 끝
  }
  update();
}

// (빼기) 해당 id 항목만 제외한 새 배열로 교체
function removeFromCart(id) {
  cart = cart.filter(function (item) {
    return item.id !== id;
  });
  update();
}

// (비우기) 장바구니 전체를 빈 배열로
function clearCart() {
  cart = [];
  update();
}

// ---------------------------------------------------------------
// 6. 화면 그리기
// ---------------------------------------------------------------

// 6-1. 왼쪽 "상품 목록" 그리기 (처음 한 번만 호출하면 됨)
function renderProducts() {
  productListEl.innerHTML = "";

  PRODUCTS.forEach(function (product) {
    const card = document.createElement("div");
    card.className = "product-card";
    card.innerHTML =
      '<div class="emoji">' + product.emoji + "</div>" +
      '<div class="name">' + product.name + "</div>" +
      '<div class="price">' + formatPrice(product.price) + "원</div>";

    const btn = document.createElement("button");
    btn.className = "add-btn";
    btn.type = "button";
    btn.textContent = "담기";
    btn.addEventListener("click", function () {
      addToCart(product.id);
    });

    card.appendChild(btn);
    productListEl.appendChild(card);
  });
}

// 6-2. 오른쪽 "장바구니"와 합계를 그린다 (cart가 바뀔 때마다 호출)
function renderCart() {
  cartListEl.innerHTML = "";

  // 비었으면 안내 문구만 보여준다.
  if (cart.length === 0) {
    cartEmptyEl.style.display = "block";
  } else {
    cartEmptyEl.style.display = "none";
  }

  // 담긴 항목 하나하나를 <li>로 만든다.
  cart.forEach(function (item) {
    const product = findProduct(item.id);
    if (!product) return;

    const lineTotal = product.price * item.qty; // 이 항목의 소계

    const li = document.createElement("li");
    li.className = "cart-item";

    // (1) 상품 이름 + 단가
    const nameBox = document.createElement("div");
    nameBox.className = "item-name";
    nameBox.innerHTML =
      product.emoji + " " + product.name +
      '<span class="item-sub">개당 ' + formatPrice(product.price) + "원</span>";

    // (2) 수량 조절 [-] [수] [+]
    const qtyBox = document.createElement("div");
    qtyBox.className = "qty";

    const minus = document.createElement("button");
    minus.type = "button";
    minus.textContent = "−";
    minus.addEventListener("click", function () {
      changeQty(item.id, -1);
    });

    const num = document.createElement("span");
    num.className = "num";
    num.textContent = item.qty;

    const plus = document.createElement("button");
    plus.type = "button";
    plus.textContent = "+";
    plus.addEventListener("click", function () {
      changeQty(item.id, 1);
    });

    qtyBox.appendChild(minus);
    qtyBox.appendChild(num);
    qtyBox.appendChild(plus);

    // (3) 항목 소계 금액
    const priceEl = document.createElement("div");
    priceEl.className = "item-price";
    priceEl.textContent = formatPrice(lineTotal) + "원";

    // (4) 빼기 버튼
    const removeEl = document.createElement("button");
    removeEl.className = "remove-btn";
    removeEl.type = "button";
    removeEl.title = "빼기";
    removeEl.textContent = "✕";
    removeEl.addEventListener("click", function () {
      removeFromCart(item.id);
    });

    li.appendChild(nameBox);
    li.appendChild(qtyBox);
    li.appendChild(priceEl);
    li.appendChild(removeEl);
    cartListEl.appendChild(li);
  });

  // 합계 갱신
  const totals = calcTotals();
  totalCountEl.textContent = totals.count;
  totalPriceEl.textContent = formatPrice(totals.price);
}

// ---------------------------------------------------------------
// 7. "상태가 바뀔 때마다" 하는 일을 한 곳에 모은 함수
//    (1) 장바구니 화면 다시 그리기  (2) localStorage에 저장
//    -> add/remove/change/clear 함수는 마지막에 이 update()만 부르면 된다.
// ---------------------------------------------------------------
function update() {
  renderCart();
  save();
}

// ---------------------------------------------------------------
// 8. 시작!
// ---------------------------------------------------------------
load(); // (1) localStorage에서 이전 장바구니 불러오기
renderProducts(); // (2) 왼쪽 상품 목록은 한 번만 그린다
renderCart(); // (3) 불러온 장바구니로 첫 화면을 그린다 (save는 불필요)

// "장바구니 비우기" 버튼 연결
clearBtn.addEventListener("click", clearCart);
