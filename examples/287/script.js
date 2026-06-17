// ✅ 고친 핵심 ②: CORS 를 허용해 주는 공개 API 로 주소를 바꿨다.
//
// Open-Meteo 는 누구나 키 없이 쓸 수 있는 무료 날씨 API 이고,
// 응답에 Access-Control-Allow-Origin: * 헤더를 함께 보내 준다.
// = "어느 출처(도메인)에서 불러도 괜찮아"라고 브라우저에게 허락하는 표시.
// 그래서 브라우저가 응답을 막지 않고 우리 자바스크립트로 그대로 넘겨준다.
//
// (참고) 만약 꼭 써야 하는 API 가 CORS 를 허용하지 않는다면,
//   ㄱ. 공개 CORS 프록시를 한 겹 거치거나
//       예: https://api.allorigins.win/raw?url=<원래주소>
//   ㄴ. 우리 서버(백엔드)에서 대신 호출해 결과만 프론트에 내려주는
//       방법(서버리스 함수 등)을 쓴다.
//   브라우저에서 "직접" 부르는 게 막히는 것이지, 서버끼리는 CORS 가 없다.

// 부산 좌표(위도 35.18, 경도 129.08)의 현재 기온을 요청한다.
const API_URL =
  "https://api.open-meteo.com/v1/forecast?latitude=35.18&longitude=129.08&current=temperature_2m";

async function loadWeather() {
  const tempEl = document.getElementById("temp");
  const statusEl = document.getElementById("status");

  try {
    const res = await fetch(API_URL);

    // 응답이 200 OK 가 아니면(예: 404, 500) 여기서 직접 에러로 처리한다.
    if (!res.ok) {
      throw new Error("서버 응답 코드: " + res.status);
    }

    const data = await res.json();
    console.log("받은 데이터:", data); // 콘솔에서 진짜 JSON 이 들어왔는지 확인

    const temp = data.current.temperature_2m; // 현재 기온(℃)
    tempEl.textContent = temp + "℃";
    statusEl.textContent = "갱신 완료";
  } catch (error) {
    // 와이파이 끊김 등 진짜 실패에 대비한 안내. (이제 CORS 로는 막히지 않는다)
    statusEl.textContent = "불러오기 실패: " + error.message;
    console.error("fetch 실패:", error);
  }
}

loadWeather();
