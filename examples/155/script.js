// === 실시간 환전 계산기: 환율 API로 받은 '숫자'로 원↔달러 양방향 계산 ===
//
// 이번 실습의 한 줄 핵심:
//   "환율 API에서 ① '오늘 환율(1 USD = ? KRW)'이라는 숫자 하나를 받아와서,
//    ② 그 숫자로 곱하기/나누기 계산을 직접 만들어, 한쪽을 입력하면 반대쪽이 자동으로 바뀌게 한다."
//
// 무엇을 새로 배우나? (실습 153·154의 날씨 API와의 차이)
//   - 날씨 API: 받아온 데이터를 '그대로 보여주기'가 끝이었다.
//   - 환율 API: 받아온 '숫자'를 가지고 '계산 로직'을 직접 만들어야 한다. (곱하기·나누기)
//   - 또한 입력 칸이 두 개라서, '어느 칸을 입력했는지'에 따라 계산 방향이 달라진다. (양방향)
//
// 이 실습이 쓰는 API (열쇠=API 키 없이 누구나 부를 수 있는 '공개' API, 회원가입 불필요):
//   ① 환율: https://api.frankfurter.app/latest?from=USD&to=KRW
//      → { "amount":1, "base":"USD", "date":"2026-06-18", "rates": { "KRW": 1389.42 } } 같은 응답
//   ※ 키가 없으니 코드에 넣을 '비밀값'이 아예 없다. (비밀값을 다루는 원칙은 README 참고)
//   ※ Frankfurter는 유럽중앙은행(ECB) 공시 환율 기반이라, 은행 실거래 환율과는 조금 다를 수 있다(학습용).

// 화면에서 다룰 요소들을 미리 찾아 둔다.
const krwInput = document.getElementById("krwInput");   // 원(KRW) 입력 칸
const usdInput = document.getElementById("usdInput");   // 달러(USD) 입력 칸
const statusEl = document.getElementById("status");     // 안내 문구 자리
const infoEl = document.getElementById("info");         // 적용 환율·기준 날짜 한 줄
const urlView = document.getElementById("urlView");     // ① 요청 주소 표시 칸
const rateView = document.getElementById("rateView");   // ② 받아온 환율 표시 칸
const refreshBtn = document.getElementById("refreshBtn"); // 환율 다시 받기 버튼

// ★상태값★ "1달러 = 몇 원인가"를 여기에 저장해 둔다. (API에서 받아온 뒤 채워진다)
//   - 이 숫자 하나만 있으면, 두 방향 계산이 모두 가능하다:
//       원  →  달러 :  원 ÷ rate
//       달러 →  원   :  달러 × rate
let usdToKrw = null;     // 예: 1389.42  (1 USD = 1389.42 KRW)
let rateDate = "";       // 환율 기준 날짜 (예: "2026-06-18")

// ★1단계★ 오늘의 환율(1 USD = ? KRW) 받아오기
async function loadRate() {
  // 요청 주소를 한 곳에서 만든다. (from=기준통화, to=받을통화)
  const params = new URLSearchParams();
  params.set("from", "USD");
  params.set("to", "KRW");
  const url = "https://api.frankfurter.app/latest?" + params.toString();

  // 우리가 만든 주소를 화면에도 그대로 보여 준다(학습 포인트).
  urlView.textContent = url;

  const res = await fetch(url);
  if (!res.ok) throw new Error("환율 응답이 정상이 아닙니다: " + res.status);

  const data = await res.json();
  // data 예시: { amount:1, base:"USD", date:"2026-06-18", rates:{ KRW: 1389.42 } }
  return {
    rate: data.rates.KRW,  // ★우리가 필요한 '숫자' 하나★
    date: data.date,
  };
}

// ★2단계★ 받아온 환율을 화면 상태에 저장하고, 입력 칸을 사용할 수 있게 켠다.
async function refreshRate() {
  statusEl.textContent = "오늘 환율을 받아오는 중…";
  // 받아오는 동안은 입력/버튼을 잠가 둔다(아직 계산할 환율이 없으므로).
  krwInput.disabled = true;
  usdInput.disabled = true;
  refreshBtn.disabled = true;
  rateView.textContent = "(받아오는 중…)";

  try {
    const { rate, date } = await loadRate();

    // 받아온 '숫자'를 상태값에 저장한다.
    usdToKrw = rate;
    rateDate = date;

    // 화면 곳곳에 받아온 환율을 표시한다.
    rateView.textContent = `1 USD = ${rate.toLocaleString("ko-KR")} KRW (기준일 ${date})`;
    infoEl.textContent =
      `적용 환율: 1달러 = ${rate.toLocaleString("ko-KR")}원 · 기준일 ${date}`;
    statusEl.textContent = "환율을 받아왔어요. 아래에 금액을 입력해 보세요.";

    // 입력 칸과 버튼을 켠다.
    krwInput.disabled = false;
    usdInput.disabled = false;
    refreshBtn.disabled = false;

    // 이미 입력해 둔 값이 있으면, 새 환율로 다시 계산해 준다.
    if (krwInput.value !== "") {
      convertFromKrw();
    } else if (usdInput.value !== "") {
      convertFromUsd();
    }
  } catch (err) {
    // 실패 시 친절한 한국어 안내. (인터넷 끊김, API 점검 등)
    statusEl.textContent =
      "환율을 받아오지 못했어요. 인터넷 연결을 확인하고 [오늘 환율 다시 받기]를 눌러 주세요.";
    rateView.textContent = "(받지 못함)";
    refreshBtn.disabled = false; // 다시 시도할 수 있게 버튼은 풀어 준다.
    console.error(err); // 개발자 콘솔(F12)에 자세한 원인 기록
  }
}

// 입력값(글자)을 숫자로 안전하게 바꾼다. 빈 칸/이상한 값이면 null을 돌려준다.
function readNumber(el) {
  if (el.value.trim() === "") return null;
  const n = Number(el.value);
  if (Number.isNaN(n) || n < 0) return null;
  return n;
}

// 보기 좋게 반올림한다. (소수점 둘째 자리까지, 불필요한 0은 제거)
function roundMoney(n) {
  return Math.round(n * 100) / 100;
}

// ★계산 로직 A★ 원(KRW)을 입력했을 때 → 달러(USD)를 자동으로 채운다.
//   달러 = 원 ÷ (1달러당 원)
function convertFromKrw() {
  if (usdToKrw === null) return;            // 아직 환율을 못 받았으면 아무것도 안 함
  const krw = readNumber(krwInput);
  if (krw === null) {                       // 원 칸이 비었으면 달러 칸도 비운다
    usdInput.value = "";
    return;
  }
  usdInput.value = roundMoney(krw / usdToKrw);
}

// ★계산 로직 B★ 달러(USD)를 입력했을 때 → 원(KRW)을 자동으로 채운다.
//   원 = 달러 × (1달러당 원)
function convertFromUsd() {
  if (usdToKrw === null) return;
  const usd = readNumber(usdInput);
  if (usd === null) {                       // 달러 칸이 비었으면 원 칸도 비운다
    krwInput.value = "";
    return;
  }
  krwInput.value = roundMoney(usd * usdToKrw);
}

// ★양방향 연결★ 타이핑할 때마다(input 이벤트) 반대쪽 칸을 즉시 갱신한다.
//   - 원 칸을 입력하면 → 달러 칸을 계산
//   - 달러 칸을 입력하면 → 원 칸을 계산
krwInput.addEventListener("input", convertFromKrw);
usdInput.addEventListener("input", convertFromUsd);

// 버튼을 누르면 오늘 환율을 다시 받아온다(환율은 시시각각 바뀌므로).
refreshBtn.addEventListener("click", refreshRate);

// 페이지를 처음 열었을 때 자동으로 한 번 환율을 받아온다.
refreshRate();
