// === 내 위치 날씨: 브라우저 위치 권한으로 좌표를 얻어 현재 날씨 표시하기 ===
//
// 이번 실습의 한 줄 핵심:
//   "브라우저에게 '내 위치 알려줘'라고 요청해 ① 좌표(위도·경도)를 받고,
//    ② 그 좌표로 날씨를 받아온 뒤, 응답 속 '숫자 코드'를 한국어 날씨로 바꿔 보여준다."
//
// 실습 153과 무엇이 다를까?
//   153: 사용자가 '도시 이름'을 입력 → 지오코딩으로 좌표를 얻음 (입력이 시작점)
//   154: 사용자 입력 없이 '브라우저 위치 권한'으로 직접 좌표를 얻음 (위치 권한이 시작점)
//   → 그래서 이번에는 "권한을 물어보고, 허용/거부를 어떻게 처리할까"가 새 학습 포인트다.
//
// 위치 권한의 중요한 성질:
//   - 위치 정보는 민감하므로, 브라우저가 사용자에게 직접 "허용/거부"를 물어본다. (우리가 강제할 수 없다)
//   - 사용자가 '거부'하면 좌표를 못 받는다. → 코드는 이 경우를 반드시 친절하게 안내해야 한다.
//   - Geolocation은 보안(https) 또는 localhost, 그리고 file:// 로 연 로컬 파일에서 동작한다.
//     (일부 브라우저는 http:// 원격 주소에서는 위치를 막는다.)
//
// 이 실습이 쓰는 API (열쇠=API 키 없이 누구나 부를 수 있는 '공개' API, 회원가입 불필요):
//   ② 날씨(좌표→현재 날씨): https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..&current=...
//   ※ ①번 좌표는 외부 API가 아니라, '브라우저가 내장한' Geolocation 기능으로 얻는다. (주소 없음)
//   ※ 키가 없으니 코드에 넣을 '비밀값'이 아예 없다. (비밀값을 다루는 원칙은 README 참고)

// 화면에서 다룰 요소들을 미리 찾아 둔다.
const locateBtn = document.getElementById("locateBtn");           // 다시 위치 요청 버튼
const statusEl = document.getElementById("status");               // 안내 문구 자리
const resultEl = document.getElementById("result");               // 날씨 결과 카드(처음엔 숨김)
const coordsView = document.getElementById("coordsView");         // ① 내 좌표 표시 칸
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

// ★1단계★ 브라우저에게 '내 위치'를 물어본다. (권한 요청이 일어나는 곳)
//
// navigator.geolocation.getCurrentPosition은 '예전 방식(콜백)' API라서
// async/await로 깔끔하게 쓰기 위해 Promise로 한 번 감싸 준다.
//   - 성공하면 → 좌표 객체(위도·경도)를 돌려준다.
//   - 실패하면(거부/시간초과 등) → 에러를 던진다. (아래 catch에서 친절히 안내)
function getMyLocation() {
  return new Promise((resolve, reject) => {
    // 이 브라우저가 위치 기능 자체를 지원하는지 먼저 확인한다.
    if (!navigator.geolocation) {
      reject(new Error("UNSUPPORTED"));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      // ① 사용자가 '허용'하고 좌표를 받았을 때
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lon: position.coords.longitude,
        });
      },
      // ② '거부'했거나 위치를 못 얻었을 때 (error.code로 원인을 구분)
      (error) => reject(error),
      // ③ 옵션: 더 정확하게, 최대 10초까지 기다림
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  });
}

// ★2단계 함수★ 좌표 → 현재 날씨 받기 (153과 동일한 공개 API)
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

  // 우리가 만든 주소를 화면에도 그대로 보여 준다(학습 포인트).
  weatherUrlView.textContent = url;

  const res = await fetch(url);
  if (!res.ok) throw new Error("날씨 응답이 정상이 아닙니다: " + res.status);

  const data = await res.json();
  return data.current; // { temperature_2m, weather_code, ... }
}

// 위치 거부/실패 에러를 사람이 읽을 한국어 안내로 바꿔 준다.
// (error.code: 1=권한 거부, 2=위치 못 얻음, 3=시간 초과)
function describeGeoError(error) {
  if (error && error.message === "UNSUPPORTED") {
    return "이 브라우저는 위치 기능을 지원하지 않아요. 최신 브라우저로 열어 주세요.";
  }
  switch (error && error.code) {
    case 1: // PERMISSION_DENIED
      return "위치 권한이 거부되었어요. 주소창 왼쪽 자물쇠(또는 ⓘ) 아이콘에서 위치를 '허용'으로 바꾼 뒤 다시 시도해 주세요.";
    case 2: // POSITION_UNAVAILABLE
      return "지금 위치를 알아낼 수 없어요. 잠시 후 [내 위치로 날씨 보기]를 다시 눌러 주세요.";
    case 3: // TIMEOUT
      return "위치를 받는 데 시간이 너무 오래 걸렸어요. [내 위치로 날씨 보기]를 다시 눌러 주세요.";
    default:
      return "위치를 받지 못했어요. [내 위치로 날씨 보기]를 다시 눌러 주세요.";
  }
}

// ★전체 흐름★ 위치 권한 요청 → 좌표 → 날씨 → 화면 표시 까지 한 번에 처리한다.
async function showWeatherForMyLocation() {
  // 시작할 때 화면을 '받아오는 중' 상태로 바꾸고, 버튼은 잠시 막는다(중복 클릭 방지).
  statusEl.textContent = "위치 권한을 확인하는 중… (브라우저가 물어보면 [허용]을 눌러 주세요)";
  resultEl.hidden = true;
  locateBtn.disabled = true;
  coordsView.textContent = "(위치 요청 중…)";
  weatherUrlView.textContent = "(좌표를 받은 뒤 요청)";

  try {
    // 1) 브라우저에게 내 위치 물어보기 (여기서 권한 팝업이 뜬다)
    const { lat, lon } = await getMyLocation();

    // 받은 좌표를 화면에 보여 준다(학습 포인트). 소수점 4자리면 충분히 정확.
    coordsView.textContent = `위도 ${lat.toFixed(4)}, 경도 ${lon.toFixed(4)}`;

    // 2) 좌표 → 날씨 (2단계)
    statusEl.textContent = "현재 위치의 날씨를 받아오는 중…";
    const current = await getWeather(lat, lon);

    // 3) 응답 필드를 화면에 매핑(연결)한다. ★응답 필드 매핑★
    const [desc, emoji] = describeWeather(current.weather_code);

    document.getElementById("weatherIcon").textContent = emoji;
    document.getElementById("temp").textContent = Math.round(current.temperature_2m) + "°C";
    document.getElementById("desc").textContent = desc;
    document.getElementById("place").textContent =
      `내 위치 (위도 ${lat.toFixed(2)}, 경도 ${lon.toFixed(2)})`;

    document.getElementById("feels").textContent =
      Math.round(current.apparent_temperature) + "°C";
    document.getElementById("humidity").textContent =
      current.relative_humidity_2m + "%";
    // API는 바람을 km/h로 준다. m/s로 바꾸려면 3.6으로 나눈다.
    document.getElementById("wind").textContent =
      (current.wind_speed_10m / 3.6).toFixed(1) + " m/s";

    resultEl.hidden = false;
    statusEl.textContent = "지금 내 위치의 현재 날씨입니다.";
  } catch (err) {
    // 위치 거부/실패 → 친절한 한국어 안내. 날씨 요청은 일어나지 않았음을 표시.
    if (err && (err.message === "UNSUPPORTED" || typeof err.code === "number")) {
      statusEl.textContent = describeGeoError(err);
      coordsView.textContent = "(위치를 받지 못함)";
      weatherUrlView.textContent = "(좌표를 못 받아 요청 안 함)";
    } else {
      // 좌표는 받았지만 날씨 받기에서 실패한 경우 (예: 인터넷 끊김)
      statusEl.textContent = "날씨를 받아오지 못했어요. 인터넷 연결을 확인해 주세요.";
    }
    resultEl.hidden = true;
    console.error(err); // 개발자 콘솔(F12)에 자세한 원인 기록
  } finally {
    // 성공이든 실패든 버튼은 다시 누를 수 있게 풀어 준다.
    locateBtn.disabled = false;
  }
}

// 버튼을 누르면 위치 요청을 다시 시도한다.
locateBtn.addEventListener("click", showWeatherForMyLocation);

// 페이지를 처음 열었을 때 자동으로 한 번 위치를 요청한다.
// (브라우저가 권한 팝업을 띄운다. 사용자가 거부하면 안내 문구가 보인다.)
showWeatherForMyLocation();
