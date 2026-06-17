// === 날씨 위젯: 로딩 · 성공 · 실패 '세 가지 화면 상태' 만들기 ===
//
// 이번 실습의 한 줄 핵심:
//   "데이터를 받아오는 일은 ① 받아오는 중(로딩) → ② 성공(결과) → ③ 실패(에러) 라는
//    세 가지 상태를 거친다. 화면은 이 셋을 모두 보여 줄 수 있어야 한다."
//
// 왜 중요한가? (디렉터 시각)
//   - AI에게 "날씨 받아와서 보여줘"라고 하면, 보통 '성공했을 때'만 짜 줍니다.
//   - 하지만 인터넷이 끊기거나, 주소가 틀렸거나, 서버가 점검 중이면 '실패'합니다.
//   - 이때 빈 화면이나 멈춘 화면이 나오면 사용자는 당황합니다.
//   - 그래서 우리가 직접 '실패 경로(에러 처리)'를 챙겨 넣어야 합니다. → try/catch 의 역할.
//
// 이 실습이 쓰는 API (열쇠=API 키 없이 누구나 부를 수 있는 '공개' API, 회원가입 불필요):
//   Open-Meteo: https://api.open-meteo.com/v1/forecast?latitude=..&longitude=..&current=temperature_2m,weather_code
//   ※ 키가 없으니 코드에 넣을 '비밀값'이 아예 없다. (비밀값을 다루는 원칙은 README 참고)

// 화면에서 다룰 요소들을 미리 찾아 둔다.
const citySelect = document.getElementById("citySelect"); // 도시 선택 드롭다운
const loadBtn = document.getElementById("loadBtn");        // [날씨 받기] 버튼

const loadingBox = document.getElementById("loadingBox");  // ① 로딩 화면
const resultBox = document.getElementById("resultBox");    // ② 성공 화면
const errorBox = document.getElementById("errorBox");      // ③ 실패 화면
const hint = document.getElementById("hint");              // 시작 안내 문구

const emojiEl = document.getElementById("emoji");          // 날씨 그림(이모지)
const cityNameEl = document.getElementById("cityName");    // 도시 이름
const tempEl = document.getElementById("temp");            // 기온
const descEl = document.getElementById("desc");            // 날씨 설명
const errorText = document.getElementById("errorText");    // 에러 문구
const retryBtn = document.getElementById("retryBtn");      // [다시 시도] 버튼

// 도시별 위도/경도. 'broken'은 일부러 잘못된 좌표를 넣어 '실패 화면'을 보여 주려는 항목이다.
const CITIES = {
  seoul: { name: "서울", lat: 37.5665, lon: 126.978 },
  busan: { name: "부산", lat: 35.1796, lon: 129.0756 },
  jeju: { name: "제주", lat: 33.4996, lon: 126.5312 },
  // ★일부러 고장★ 위도/경도 범위를 벗어난 값 → API가 에러를 돌려줘 ③ 실패 화면이 뜬다.
  broken: { name: "(없는 도시)", lat: 999, lon: 999 },
};

// 날씨 코드(weather_code)를 사람이 읽을 수 있는 그림+설명으로 바꾼다(대표적인 것만).
function describeWeather(code) {
  if (code === 0) return { emoji: "☀️", text: "맑음" };
  if (code <= 3) return { emoji: "🌤️", text: "구름 조금" };
  if (code <= 48) return { emoji: "🌫️", text: "안개" };
  if (code <= 67) return { emoji: "🌧️", text: "비" };
  if (code <= 77) return { emoji: "🌨️", text: "눈" };
  if (code <= 82) return { emoji: "🌦️", text: "소나기" };
  if (code <= 99) return { emoji: "⛈️", text: "천둥번개" };
  return { emoji: "🌡️", text: "날씨 정보" };
}

// ★상태 전환 도우미★ 한 번에 '하나의 상태'만 화면에 보이게 한다.
//   which = "loading" | "result" | "error" | "idle"(시작 안내)
function showState(which) {
  loadingBox.hidden = which !== "loading";
  resultBox.hidden = which !== "result";
  errorBox.hidden = which !== "error";
  hint.hidden = which !== "idle";
}

// ★핵심★ 날씨를 받아오는 전체 흐름: 로딩 → (성공 or 실패)
async function loadWeather() {
  const key = citySelect.value;
  const city = CITIES[key];

  // ① 로딩 상태로 전환 + 버튼 잠그기(중복 클릭 방지)
  showState("loading");
  loadBtn.disabled = true;

  try {
    // 요청 주소를 한 곳에서 만든다.
    const params = new URLSearchParams();
    params.set("latitude", city.lat);
    params.set("longitude", city.lon);
    params.set("current", "temperature_2m,weather_code");
    const url = "https://api.open-meteo.com/v1/forecast?" + params.toString();

    const res = await fetch(url);

    // 응답이 정상(200대)이 아니면, 일부러 에러를 던져서 catch로 보낸다.
    // (이게 없으면 res.ok가 false여도 그냥 통과해 버려, '성공한 척'하는 버그가 된다.)
    if (!res.ok) {
      throw new Error("서버가 정상 응답을 주지 않았어요 (상태코드 " + res.status + ")");
    }

    const data = await res.json();

    // 받아온 데이터에 필요한 값이 없으면 그것도 실패로 본다.
    if (!data.current || typeof data.current.temperature_2m !== "number") {
      throw new Error("날씨 데이터 형식이 예상과 달라요");
    }

    // ② 성공 상태: 받아온 값을 화면에 채운다.
    const temp = data.current.temperature_2m;            // 예: 23.4 (℃)
    const w = describeWeather(data.current.weather_code); // 그림 + 설명
    emojiEl.textContent = w.emoji;
    cityNameEl.textContent = city.name;
    tempEl.textContent = Math.round(temp) + "℃";
    descEl.textContent = w.text;
    showState("result");
  } catch (err) {
    // ③ 실패 상태: 사용자에게는 '친절한 한국어 한 줄'을 보여 준다.
    //    (자세한 원인은 개발자만 보는 콘솔에 따로 남긴다.)
    errorText.textContent =
      "날씨를 받아오지 못했어요. 인터넷 연결을 확인하고 [다시 시도]를 눌러 주세요.";
    showState("error");
    console.error("날씨 받아오기 실패:", err); // F12 → Console 에서 확인
  } finally {
    // 성공이든 실패든 마지막에는 항상 버튼을 다시 풀어 준다.
    loadBtn.disabled = false;
  }
}

// 버튼/드롭다운 연결
loadBtn.addEventListener("click", loadWeather);
retryBtn.addEventListener("click", loadWeather); // 실패 화면의 [다시 시도]도 같은 함수

// 처음에는 아무것도 받아오지 않은 '시작 안내' 상태로 둔다.
showState("idle");
