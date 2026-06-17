// =====================================================================
// 실습 164 — 서버 쪽 '중간 창구' (Vercel 서버리스 함수)
//   "AI 여행 한 컷" 미니앱의 두뇌가 여기 있습니다.
//
// 이 파일은 Vercel 서버에서만 실행됩니다. 브라우저로는 절대 안 내려갑니다.
//
// 무엇을 하나요?
//   도시 이름 하나를 받아서, 여러 외부 서비스를 '동시에' 불러 한 화면에 모읍니다.
//     ① 위치 찾기(지오코딩) — 도시 이름 → 위도·경도 (키 필요 없는 공개 API)
//     ② 날씨           — 그 좌표의 오늘 날씨   (키 필요 없는 공개 API: Open-Meteo)
//     ③ 사진           — 그 도시 분위기 사진   (키 필요 없는 공개 이미지)
//     ④ 지도           — 그 좌표의 지도 (브라우저가 iframe 으로 직접 박음. 키 없음)
//     ⑤ AI 코멘트      — 위 정보를 모아 Claude 가 '그날의 추천 한마디' 생성
//
// 이 실습의 핵심 두 가지:
//   (A) 여러 외부 연동을 '하나의 흐름'으로 묶기
//       → 날씨·사진을 Promise.allSettled 로 '동시에' 부릅니다. (병렬 호출)
//   (B) 부분 실패를 견디게 설계하기
//       → 사진 API 하나가 죽어도 날씨와 AI 코멘트는 그대로 나오도록,
//         실패한 조각만 비우고 나머지는 살려서 돌려줍니다.
//
// 비밀 키는 이 코드에 직접 적지 않습니다.
//   ANTHROPIC_API_KEY 는 process.env 로만 읽습니다. (진짜 키는 환경변수에만)
//   ※ 날씨·지오코딩·지도·사진은 '공개(키 없는)' 서비스라 비밀이 없습니다.
//      과금되는 비밀은 오직 Claude 키 하나뿐입니다.
// =====================================================================

// AI 코멘트 규칙(프롬프트)을 코드에 '고정'합니다.
// 사용자가 보낸 건 도시 이름뿐. "어떻게 코멘트할지"는 서버가 정해 둡니다.
const COMMENT_SYSTEM_PROMPT = [
  "당신은 여행지의 '그날의 한마디'를 만들어 주는 친절한 여행 도우미입니다.",
  "규칙:",
  "1) 주어진 도시 이름과 오늘 날씨 정보를 보고, 따뜻하고 구체적인 추천 한마디를 만듭니다.",
  "2) 두 문장 이내, 대략 80자 이내로 짧게 씁니다.",
  "3) 날씨에 맞는 실용적인 팁(옷차림·우산·일정 등)을 한 가지 자연스럽게 녹입니다.",
  "4) 이모지나 머리말('추천:') 없이, 코멘트 문장만 출력합니다.",
  "5) 날씨 정보가 없으면 도시 이름만으로 산뜻한 한마디를 만듭니다.",
].join("\n");

// 날씨 코드(WMO)를 사람이 읽는 한국어로 바꾸는 작은 사전 (자주 쓰는 것만)
const WEATHER_TEXT = {
  0: "맑음",
  1: "대체로 맑음",
  2: "구름 조금",
  3: "흐림",
  45: "안개",
  48: "짙은 안개",
  51: "약한 이슬비",
  61: "약한 비",
  63: "비",
  65: "강한 비",
  71: "약한 눈",
  73: "눈",
  75: "강한 눈",
  80: "소나기",
  95: "천둥번개",
};

export default async function handler(req, res) {
  // 1) POST 요청만 허용 (브라우저 script.js 가 POST 로 부른다)
  if (req.method !== "POST") {
    return res.status(405).json({ error: "POST 요청만 받습니다." });
  }

  // 2) 브라우저가 보낸 '도시 이름' 꺼내기
  const { city } = req.body || {};
  if (!city || typeof city !== "string" || !city.trim()) {
    return res.status(400).json({ error: "도시 이름(city)이 필요합니다." });
  }
  const cityName = city.trim().slice(0, 60); // 너무 긴 입력 방어

  // 한 화면에 모을 결과 바구니. 실패한 조각은 그냥 비워 둔다(부분 실패 허용).
  const result = {
    city: cityName,
    location: null, // { name, country, latitude, longitude }
    weather: null, // { text, temperature, code }
    photoUrl: null, // 사진 주소
    mapUrl: null, // 지도 iframe 주소
    comment: null, // AI 한마디
    errors: [], // 어떤 조각이 왜 실패했는지(키 값은 절대 안 담음)
  };

  // ───────────────────────────────────────────────────────────────────
  // 3) 1단계: 도시 이름 → 좌표(지오코딩). 이게 있어야 날씨·지도를 부를 수 있다.
  //    (키 필요 없는 공개 API)
  // ───────────────────────────────────────────────────────────────────
  try {
    const geoUrl =
      "https://geocoding-api.open-meteo.com/v1/search?count=1&language=ko&name=" +
      encodeURIComponent(cityName);
    const geoRes = await fetch(geoUrl);
    const geoData = await geoRes.json();
    const hit = geoData?.results?.[0];
    if (hit) {
      result.location = {
        name: hit.name,
        country: hit.country || "",
        latitude: hit.latitude,
        longitude: hit.longitude,
      };
      // 지도는 OpenStreetMap embed (키 없음). 브라우저가 iframe 으로 박는다.
      const { latitude: la, longitude: lo } = hit;
      const d = 0.15; // 지도에 보여 줄 네모 범위
      result.mapUrl =
        "https://www.openstreetmap.org/export/embed.html?bbox=" +
        [lo - d, la - d, lo + d, la + d].join("%2C") +
        "&layer=mapnik&marker=" +
        la +
        "%2C" +
        lo;
    } else {
      result.errors.push("위치를 찾지 못했어요(도시 이름을 확인해 보세요).");
    }
  } catch (e) {
    result.errors.push("위치 찾기 실패: " + e.message);
  }

  // ───────────────────────────────────────────────────────────────────
  // 4) 2단계: 날씨 + 사진을 '동시에' 부른다 (병렬 호출).
  //    Promise.allSettled → 하나가 실패해도 다른 하나는 그대로 받는다.
  //    (부분 실패 견디기의 핵심)
  // ───────────────────────────────────────────────────────────────────
  const tasks = [];

  // (a) 날씨 — 좌표가 있을 때만 의미가 있다
  if (result.location) {
    const { latitude, longitude } = result.location;
    const wUrl =
      "https://api.open-meteo.com/v1/forecast?current_weather=true" +
      "&latitude=" +
      latitude +
      "&longitude=" +
      longitude;
    tasks.push(
      fetch(wUrl)
        .then((r) => r.json())
        .then((w) => {
          const cw = w?.current_weather;
          if (cw) {
            result.weather = {
              temperature: cw.temperature,
              code: cw.weathercode,
              text: WEATHER_TEXT[cw.weathercode] || "날씨 정보",
            };
          } else {
            result.errors.push("날씨 데이터를 못 받았어요.");
          }
        })
        .catch((e) => result.errors.push("날씨 호출 실패: " + e.message))
    );
  }

  // (b) 사진 — 키가 필요 없는 공개 이미지(도시 이름으로 검색되는 그림).
  //     실패해도 화면은 굴러가야 하므로 try 안에 가둔다.
  const photoSearch =
    "https://source.unsplash.com/800x500/?" +
    encodeURIComponent(cityName + ",city,travel");
  tasks.push(
    fetch(photoSearch, { redirect: "follow" })
      .then((r) => {
        // 실제 이미지로 리다이렉트되면 그 최종 주소를 쓴다.
        if (r.ok && r.url) result.photoUrl = r.url;
        else result.errors.push("사진을 못 받았어요.");
      })
      .catch((e) => result.errors.push("사진 호출 실패: " + e.message))
  );

  // 날씨·사진을 동시에 기다린다. 하나가 실패해도 멈추지 않는다.
  await Promise.allSettled(tasks);

  // ───────────────────────────────────────────────────────────────────
  // 5) 3단계: 모은 정보로 Claude 에게 '그날의 한마디'를 부탁한다.
  //    AI 코멘트가 실패해도 날씨·사진·지도는 이미 result 에 들어 있다(부분 실패 허용).
  // ───────────────────────────────────────────────────────────────────
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    // 키가 없으면 AI 코멘트만 비워 두고, 나머지는 그대로 돌려준다.
    result.errors.push(
      "AI 코멘트는 건너뜀: 서버에 ANTHROPIC_API_KEY 환경변수가 없습니다. " +
        "Vercel > Settings > Environment Variables 에 키를 넣고 다시 배포하세요."
    );
    return res.status(200).json(result);
  }

  try {
    // 사용자가 보낸 건 도시 이름뿐. 날씨는 서버가 알아낸 사실로 덧붙인다.
    const factLine = result.weather
      ? `도시: ${result.location?.name || cityName}, 오늘 날씨: ${result.weather.text}, 기온: ${result.weather.temperature}도`
      : `도시: ${cityName} (날씨 정보 없음)`;

    const anthropicRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey, // ← 비밀 키. 서버에서만 붙는다. 브라우저는 못 본다.
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-opus-4-8",
        max_tokens: 256, // 짧은 한마디라 작게
        system: COMMENT_SYSTEM_PROMPT,
        messages: [
          {
            role: "user",
            content: "다음 여행지의 '그날의 한마디'를 만들어 줘.\n" + factLine,
          },
        ],
      }),
    });

    const data = await anthropicRes.json();

    if (!anthropicRes.ok) {
      const msg =
        data?.error?.message || `Claude API 오류 (${anthropicRes.status})`;
      result.errors.push("AI 코멘트 실패: " + msg);
    } else {
      result.comment = (data.content || [])
        .filter((block) => block.type === "text")
        .map((block) => block.text)
        .join("")
        .trim()
        .replace(/\s*\n\s*/g, " ");
    }
  } catch (err) {
    result.errors.push("AI 코멘트 호출 실패: " + err.message);
  }

  // 6) 부분 실패가 있어도 200 으로 돌려준다. 화면은 받은 조각만 보여 준다.
  return res.status(200).json(result);
}
