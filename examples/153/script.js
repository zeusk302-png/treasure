// === 오늘 날씨 위젯: 도시 이름을 넣어 공개 날씨 API로 오늘 날씨 표시하기 ===
//
// 이번 실습의 한 줄 핵심:
//   "도시 이름을 받아서 ① 그 도시의 좌표(위도·경도)를 찾고
//    ② 그 좌표로 날씨를 받아온 뒤, 응답 속 '숫자 코드'를 한국어 날씨로 바꿔 보여준다."
//
// 왜 두 번 요청할까?
//   날씨 API는 '도시 이름'이 아니라 '좌표(위도·경도)'로 날씨를 알려준다.
//   그래서 먼저 "부산은 어디?"를 물어 좌표를 얻고(=지오코딩),
//   그 좌표로 다시 "거기 날씨 알려줘"를 요청한다. (두 단계 = 호출 연쇄)
//
// 이 실습이 쓰는 API (열쇠=API 키 없이 누구나 부를 수 있는 '공개' API, 회원가입 불필요):
//   ① 지오코딩(도시→좌표): https://geocoding-api.open-meteo.com/v1/search?name=부산&language=ko
//   ② 날씨(좌표→오늘 날씨): https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..&current=...
//   ※ Open-Meteo는 비영리/학습용으로 키 없이 무료 사용이 가능한 공개 엔드포인트다.
//   ※ 키가 없으니 코드에 넣을 '비밀값'이 아예 없다. (비밀값을 다루는 원칙은 README 참고)

// 화면에서 다룰 요소들을 미리 찾아 둔다.
const form = document.getElementById("cityForm");        // 입력창을 감싼 form
const cityInput = document.getElementById("city");       // 도시 이름 입력칸
const statusEl = document.getElementById("status");      // 안내 문구 자리
const resultEl = document.getElementById("result");      // 날씨 결과 카드(처음엔 숨김)
const geoUrlView = document.getElementById("geoUrlView");        // ① 좌표 찾기 주소 표시 칸
const weatherUrlView = document.getElementById("weatherUrlView"); // ② 날씨 받기 주소 표시 칸

// ★핵심 매핑★ 날씨 API는 날씨 상태를 '숫자 코드(WMO 코드)'로 준다.
// 사람이 읽을 수 있게 [한국어 설명, 이모지] 로 바꿔 주는 표를 만든다.
// (코드 전체 목록은 Open-Meteo 문서의 WMO Weather interpretation codes 참고)
const WEATHER_CODE = {
  0:  ["맑음", "☀️"],
  1:  ["대체로 맑음", "🌤️"],
  2:  ["구름 조금", "⛅"],
  3:  ["흐림", "☁️"],
  45: ["안개", "🌫️"],
  48: ["짙은 안개", "🌫️"],
  51: ["약한 이슬비", "🌦️"],
  53: ["이슬비", "🌦️"],
  55: ["강한 이슬비", "🌧️"],
  61: ["약한 비", "🌦️"],
  63: ["비", "🌧️"],
  65: ["강한 비", "🌧️"],
  66: ["어는 비", "🌧️"],
  67: ["강한 어는 비", "🌧️"],
  71: ["약한 눈", "🌨️"],
  73: ["눈", "🌨️"],
  75: ["강한 눈", "❄️"],
  77: ["싸락눈", "🌨️"],
  80: ["약한 소나기", "🌦️"],
  81: ["소나기", "🌧️"],
  82: ["강한 소나기", "⛈️"],
  85: ["약한 눈 소나기", "🌨️"],
  86: ["강한 눈 소나기", "❄️"],
  95: ["천둥번개", "⛈️"],
  96: ["우박 동반 천둥번개", "⛈️"],
  99: ["강한 우박 동반 천둥번개", "⛈️"],
};

// 숫자 코드를 [설명, 이모지]로 바꾼다. 표에 없는 코드면 기본값을 준다.
function describeWeather(code) {
  return WEATHER_CODE[code] || ["알 수 없음", "❓"];
}

// ★1단계 함수★ 도시 이름 → 좌표(위도·경도) 찾기 (지오코딩)
async function findCity(cityName) {
  // URLSearchParams를 쓰면 한글·공백을 자동으로 안전하게 인코딩해 준다.
  const params = new URLSearchParams();
  params.set("name", cityName);  // ← "부산", "Tokyo" 등. 인코딩은 자동 처리됨
  params.set("count", "1");      // 가장 잘 맞는 1곳만
  params.set("language", "ko");  // 결과(나라·지역명)를 한국어로
  const url = "https://geocoding-api.open-meteo.com/v1/search?" + params.toString();

  // 우리가 만든 주소를 화면에도 그대로 보여 준다(학습 포인트).
  geoUrlView.textContent = url;

  const res = await fetch(url);
  if (!res.ok) throw new Error("좌표 찾기 응답이 정상이 아닙니다: " + res.status);

  const data = await res.json();
  // 결과가 없으면(없는 도시명) results 자체가 없거나 빈 배열이다.
  if (!data.results || data.results.length === 0) {
    return null;
  }
  return data.results[0]; // { name, latitude, longitude, country, admin1, ... }
}

// ★2단계 함수★ 좌표 → 오늘 현재 날씨 받기
async function getWeather(lat, lon) {
  const params = new URLSearchParams();
  params.set("latitude", lat);
  params.set("longitude", lon);
  // current= 뒤에 우리가 받고 싶은 항목들을 콤마로 나열한다.
  params.set(
    "current",
    "temperature_2m,relative_humidity_2m,apparent_temperature,weather_code,wind_speed_10m"
  );
  params.set("timezone", "auto"); // 그 지역 시간대 기준으로
  const url = "https://api.open-meteo.com/v1/forecast?" + params.toString();

  weatherUrlView.textContent = url;

  const res = await fetch(url);
  if (!res.ok) throw new Error("날씨 응답이 정상이 아닙니다: " + res.status);

  const data = await res.json();
  return data.current; // { temperature_2m, weather_code, ... }
}

// ★전체 흐름★ 도시 이름 한 개를 받아 끝까지 처리한다.
async function showWeather(cityName) {
  const name = cityName.trim();

  // 1) 빈 입력이면 화면을 비우고 끝낸다.
  if (!name) {
    statusEl.textContent = "도시 이름을 입력해 주세요.";
    resultEl.hidden = true;
    geoUrlView.textContent = "(아직 검색 전)";
    weatherUrlView.textContent = "(아직 검색 전)";
    return;
  }

  statusEl.textContent = `"${name}" 위치를 찾는 중…`;
  resultEl.hidden = true;

  try {
    // 2) 도시 → 좌표 (1단계)
    const place = await findCity(name);
    if (!place) {
      statusEl.textContent = `"${name}"라는 도시를 찾지 못했어요. 철자를 확인하거나 다른 이름으로 시도해 보세요.`;
      weatherUrlView.textContent = "(좌표를 못 찾아 요청 안 함)";
      return;
    }

    // 3) 좌표 → 날씨 (2단계)
    statusEl.textContent = `"${place.name}" 날씨를 받아오는 중…`;
    const current = await getWeather(place.latitude, place.longitude);

    // 4) 응답 필드를 화면에 매핑(연결)한다. ★응답 필드 매핑이 이번 실습의 핵심★
    const [desc, emoji] = describeWeather(current.weather_code);

    document.getElementById("weatherIcon").textContent = emoji;
    document.getElementById("temp").textContent = Math.round(current.temperature_2m) + "°C";
    document.getElementById("desc").textContent = desc;

    // 도시명 + 상위 지역 + 나라를 보기 좋게 합친다(없는 값은 건너뜀).
    const placeLabel = [place.name, place.admin1, place.country]
      .filter(Boolean)
      .join(", ");
    document.getElementById("place").textContent = placeLabel;

    document.getElementById("feels").textContent =
      Math.round(current.apparent_temperature) + "°C";
    document.getElementById("humidity").textContent =
      current.relative_humidity_2m + "%";
    // API는 바람을 km/h로 준다. m/s로 바꾸려면 3.6으로 나눈다.
    document.getElementById("wind").textContent =
      (current.wind_speed_10m / 3.6).toFixed(1) + " m/s";

    resultEl.hidden = false;
    statusEl.textContent = `오늘 ${placeLabel}의 현재 날씨입니다.`;
  } catch (err) {
    statusEl.textContent = "날씨를 받아오지 못했어요. 인터넷 연결을 확인해 주세요.";
    resultEl.hidden = true;
    console.error(err); // 개발자 콘솔(F12)에 자세한 원인 기록
  }
}

// 날씨 보기 버튼을 누르거나 Enter를 치면 검색한다.
form.addEventListener("submit", (event) => {
  event.preventDefault(); // 폼 기본 동작(페이지 새로고침)을 막는다.
  showWeather(cityInput.value);
});

// 페이지를 처음 열었을 때, 미리 채워진 도시("부산")로 한 번 검색해 둔다.
showWeather(cityInput.value);
