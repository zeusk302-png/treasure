// index.html 에서 <script src="script.js" defer></script> 로 불러온다.

// 진짜 서버 대신, 0.3초 뒤에 JSON 문자열을 돌려주는 가짜 API를 흉내 낸다.
// 실제 fetch(...).then(res => res.text()) 으로 받는 "응답 본문(문자열)"과 같은 모양이다.
function fetchWeather() {
  return new Promise(function (resolve) {
    setTimeout(function () {
      const jsonText =
        '{ "name": "부산", "main": { "temp": 24.6, "humidity": 70 }, "weather": [ { "description": "맑음" } ] }';
      resolve(jsonText);
    }, 300);
  });
}

async function showWeather() {
  const cityEl = document.getElementById("city");
  const tempEl = document.getElementById("temp");
  const descEl = document.getElementById("desc");

  try {
    const jsonText = await fetchWeather();
    const data = JSON.parse(jsonText);

    // ✅ 고치기 전에 반드시 했어야 할 한 줄: 응답을 통째로 콘솔에 찍어 본다.
    //    이 한 줄 덕분에 "도시는 name, 기온은 main.temp, 설명은 weather[0].description"
    //    이라는 진짜 구조를 눈으로 확인할 수 있다. (검증 습관)
    console.log("실제 응답 구조:", data);
    // 펼쳐 보면 이렇게 생겼다:
    // {
    //   name: "부산",
    //   main: { temp: 24.6, humidity: 70 },
    //   weather: [ { description: "맑음" } ]
    // }

    // ✅ 고친 핵심: 코드의 키 이름을 "실제 응답의 키 이름"에 정확히 맞췄다.
    //    - 도시: data.city  →  data.name
    //    - 기온: data.temp  →  data.main.temp        (객체 안의 객체, 한 단계 더 들어감)
    //    - 설명: data.weather.description  →  data.weather[0].description (배열의 첫 번째 항목)
    cityEl.textContent = data.name;
    tempEl.textContent = data.main.temp + "°C";
    descEl.textContent = data.weather[0].description;
  } catch (error) {
    // JSON 문자열이 깨졌거나(파싱 실패) 네트워크가 끊기면 여기로 온다.
    cityEl.textContent = "날씨를 불러오지 못했어요";
    console.error("날씨 불러오기 실패:", error);
  }
}

showWeather();
