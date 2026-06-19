/*
  이 파일은 무엇인가:
  날씨 위젯의 "동작" 부분입니다. 선택한 도시의 좌표로 외부 날씨 API(Open-Meteo)를 호출하고,
  그 결과를 화면에 그립니다.
  왜 있는가:
  실습 329의 핵심인 "외부 API 호출 → 로딩 표시 → 성공/실패 처리"의 한 사이클을
  비전공자가 한 줄씩 읽고 이해할 수 있게 만든 예제입니다.

  꼭 기억할 3가지 상태(state):
  1) 로딩 중  — 데이터를 기다리는 중. 스켈레톤(깜빡이는 회색 줄)을 보여줍니다.
  2) 성공     — 데이터가 왔다. 온도·날씨를 그립니다.
  3) 실패     — 네트워크 오류·서버 오류 등. 빨간 에러 + "다시 시도" 버튼을 보여줍니다.
  이 세 상태를 모두 처리해야 "멈춘 것처럼 보이는" 나쁜 경험을 막을 수 있습니다.
*/

// 화면에서 자주 쓰는 요소를 미리 찾아둡니다. (매번 찾으면 코드가 길어지고 느려져서, 한 번만 찾아 보관)
const citySelect = document.getElementById("city");
const loadBtn = document.getElementById("loadBtn");
const resultEl = document.getElementById("result");

// 날씨 코드(WMO) → 사람이 읽는 한국어 설명 + 이모지로 바꾸는 표입니다.
// 왜 필요한가: API는 날씨를 "숫자 코드"로만 줍니다(예: 0=맑음). 그대로 보여주면 사용자가 못 알아봅니다.
const WEATHER_CODE = {
  0:  ["맑음", "☀️"],
  1:  ["대체로 맑음", "🌤️"],
  2:  ["부분적으로 흐림", "⛅"],
  3:  ["흐림", "☁️"],
  45: ["안개", "🌫️"],
  48: ["짙은 안개", "🌫️"],
  51: ["약한 이슬비", "🌦️"],
  61: ["약한 비", "🌧️"],
  63: ["비", "🌧️"],
  65: ["강한 비", "🌧️"],
  71: ["약한 눈", "🌨️"],
  73: ["눈", "🌨️"],
  80: ["소나기", "🌦️"],
  95: ["천둥번개", "⛈️"],
};

// 화면을 "로딩 상태"로 바꾸는 함수.
// 왜 분리했나: 상태가 바뀔 때마다 화면 만드는 코드를 한 곳에 모아두면, 빠뜨림 없이 일관되게 보입니다.
function renderLoading() {
  // textContent가 아니라 정적인 스켈레톤 HTML이라 안전합니다. (사용자 입력이 아닌, 우리가 정한 고정 마크업)
  resultEl.innerHTML = `
    <div class="skeleton" style="width:60%"></div>
    <div class="skeleton" style="width:40%;height:40px"></div>
    <div class="skeleton" style="width:50%"></div>
  `;
}

// 화면을 "성공 상태"로 바꾸는 함수. 받아온 날씨 데이터를 화면에 그립니다.
function renderSuccess(cityName, data) {
  const code = data.weather_code;
  // 표에 없는 코드가 와도 앱이 깨지지 않게 기본값("정보 없음")을 둡니다. (방어적 코딩)
  const [desc, emoji] = WEATHER_CODE[code] || ["정보 없음", "❓"];

  // 먼저 안전하게 만든 요소들로 화면을 비웁니다.
  resultEl.innerHTML = "";

  // ⚠️ 보안 포인트: 사용자가 고른 도시 이름 등 "값"은 textContent로 넣습니다.
  // innerHTML로 문자열을 합쳐 넣으면, 값에 <script>가 섞였을 때 실행될 수 있어(XSS) 위험합니다.
  const emojiEl = document.createElement("div");
  emojiEl.className = "emoji";
  emojiEl.textContent = emoji;

  const tempEl = document.createElement("div");
  tempEl.className = "temp";
  tempEl.textContent = `${Math.round(data.temperature_2m)}°C`;

  const descEl = document.createElement("div");
  descEl.className = "desc";
  descEl.textContent = `${cityName} · ${desc}`;

  const metaEl = document.createElement("div");
  metaEl.className = "meta";
  metaEl.textContent = `습도 ${data.relative_humidity_2m}% · 바람 ${data.wind_speed_10m}km/h`;

  resultEl.append(emojiEl, tempEl, descEl, metaEl);
}

// 화면을 "실패 상태"로 바꾸는 함수. 무엇이 잘못됐는지 + 다시 시도 버튼을 보여줍니다.
function renderError(message) {
  resultEl.innerHTML = "";
  const msg = document.createElement("p");
  msg.className = "error";
  msg.textContent = `⚠️ ${message}`; // 에러 메시지도 textContent로 — 어떤 문자가 와도 안전합니다.

  const retry = document.createElement("button");
  retry.textContent = "다시 시도";
  retry.addEventListener("click", loadWeather); // 실패해도 사용자가 한 번 더 시도할 길을 줍니다.

  resultEl.append(msg, retry);
}

// 핵심: 외부 API를 호출해 날씨를 가져오는 함수.
// async/await: "기다렸다가 다음 줄"을 자연스럽게 쓰기 위한 문법입니다. (네트워크는 시간이 걸리므로 기다려야 함)
async function loadWeather() {
  // 선택된 "위도,경도"를 꺼내 쪼갭니다. (option의 value가 "35.18,129.08" 형태)
  const [lat, lon] = citySelect.value.split(",");
  const cityName = citySelect.options[citySelect.selectedIndex].text;

  // 1) 로딩 시작: 버튼을 잠가 "두 번 누르기"로 중복 호출되는 것을 막고, 스켈레톤을 보여줍니다.
  loadBtn.disabled = true;
  renderLoading();

  // Open-Meteo 요청 주소를 만듭니다.
  //  - 이 API는 키가 필요 없습니다(공개 API). 그래서 주소를 프론트에 그대로 둬도 안전합니다.
  //  - current= 로 "지금 현재값" 항목들을 지정합니다.
  const url =
    `https://api.open-meteo.com/v1/forecast` +
    `?latitude=${lat}&longitude=${lon}` +
    `&current=temperature_2m,relative_humidity_2m,weather_code,wind_speed_10m`;

  try {
    // 2) 실제 호출. fetch는 "주소로 데이터를 받아오는" 브라우저 내장 도구입니다.
    const res = await fetch(url);

    // 주의: fetch는 404·500 같은 서버 오류에도 throw하지 않습니다(reject 안 함).
    //       그래서 res.ok로 직접 확인해, 아니면 우리가 에러로 만들어 catch로 보냅니다.
    if (!res.ok) {
      throw new Error(`서버가 ${res.status} 오류를 보냈어요.`);
    }

    const json = await res.json(); // 받은 본문을 JSON(객체)으로 해석합니다.

    // 응답 모양이 우리가 기대한 것과 다를 수도 있으니, 핵심 필드 존재를 확인합니다. (방어적 점검)
    if (!json.current) {
      throw new Error("날씨 데이터 형식이 예상과 달라요.");
    }

    // 3) 성공: 화면에 그립니다.
    renderSuccess(cityName, json.current);
  } catch (err) {
    // 3') 실패: 네트워크 끊김·오프라인·서버 오류 등 모든 실패가 여기로 모입니다.
    //     사용자에게는 친절한 한국어 메시지를, 개발자에게는 콘솔에 원본 오류를 남깁니다.
    console.error(err); // 원인 추적용(F12 → Console). 사용자에게 보이는 메시지와 분리합니다.
    renderError("날씨를 불러오지 못했어요. 인터넷 연결을 확인하고 다시 시도해 주세요.");
  } finally {
    // 성공이든 실패든 마지막엔 항상 버튼을 다시 풀어, 사용자가 다시 조회할 수 있게 합니다.
    loadBtn.disabled = false;
  }
}

// 버튼 클릭과 도시 변경 시 조회가 일어나게 연결합니다.
loadBtn.addEventListener("click", loadWeather);
citySelect.addEventListener("change", loadWeather);

// 페이지가 처음 열렸을 때도 바로 한 번 보여줍니다. (빈 화면 대신 첫 결과를 주는 게 좋은 경험)
loadWeather();
