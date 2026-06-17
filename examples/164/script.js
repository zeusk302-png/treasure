// =====================================================================
// 실습 164 — 브라우저 쪽 코드 (프론트엔드)
//
// 핵심: 이 파일 어디에도 비밀 키(sk-ant-...)가 없습니다.
// 브라우저는 외부 API들(Claude·날씨·사진)을 직접 부르지 않고,
// 우리 서버의 '중간 창구' /api/travel-snapshot 만 부릅니다.
// 진짜 외부 호출 + 비밀 키 사용 + 여러 API를 한 흐름으로 묶는 일은
// 모두 서버 함수(api/travel-snapshot.js) 안에서 일어납니다.
// =====================================================================

// ❌ 이렇게 하면 절대 안 됩니다 (비밀 키가 브라우저에 노출됨!):
//
//   const ANTHROPIC_KEY = "sk-ant-진짜키";   // F12로 누구나 봄 → 키 도둑맞음
//   fetch("https://api.anthropic.com/v1/messages", { headers: { "x-api-key": ANTHROPIC_KEY } });
//
// ✅ 올바른 방법: 우리 서버 창구(/api/travel-snapshot)에만 도시 이름을 보낸다.

const PROXY_URL = "/api/travel-snapshot"; // 같은 사이트 안의 서버 함수. 키가 필요 없다.

const cityEl = document.getElementById("city");
const goBtn = document.getElementById("goBtn");
const statusEl = document.getElementById("status");

const snapshotEl = document.getElementById("snapshot");
const placeTitleEl = document.getElementById("placeTitle");

const commentBox = document.getElementById("commentBox");
const commentEl = document.getElementById("comment");

const photoBox = document.getElementById("photoBox");
const photoEl = document.getElementById("photo");

const weatherBox = document.getElementById("weatherBox");
const weatherTextEl = document.getElementById("weatherText");
const weatherTempEl = document.getElementById("weatherTemp");

const mapBox = document.getElementById("mapBox");
const mapEl = document.getElementById("map");

const errorsBox = document.getElementById("errorsBox");
const errorsList = document.getElementById("errorsList");

// ── 여행 한 컷 요청 ─────────────────────────────────────────────────
goBtn.addEventListener("click", run);
cityEl.addEventListener("keydown", (e) => {
  if (e.key === "Enter") run();
});

async function run() {
  const city = cityEl.value.trim();
  if (!city) {
    setStatus("도시 이름을 먼저 입력해 주세요.", "bad");
    return;
  }

  goBtn.disabled = true;
  snapshotEl.hidden = true;
  setStatus("서버 창구가 날씨·지도·사진·AI를 동시에 모으는 중…");

  try {
    // 브라우저 → 우리 서버 창구. '도시 이름'만 보낸다. 키는 보내지 않는다.
    const res = await fetch(PROXY_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ city }),
    });

    const data = await res.json();

    if (!res.ok) {
      throw new Error(data.error || `서버 오류 (${res.status})`);
    }

    render(data); // 받은 조각만 화면에 그린다 (부분 실패 견디기)
    setStatus("완료! 받아온 조각들을 한 화면에 모았습니다.", "ok");
  } catch (err) {
    setStatus("실패: " + err.message, "bad");
  } finally {
    goBtn.disabled = false;
  }
}

// 서버가 모아 준 결과를 화면에 그린다.
// 없는 조각(실패한 부분)은 그냥 숨겨 둔다 → 나머지는 그대로 보인다.
function render(data) {
  snapshotEl.hidden = false;

  const place =
    data.location && data.location.name
      ? data.location.name + (data.location.country ? " · " + data.location.country : "")
      : data.city;
  placeTitleEl.textContent = place + " — 여행 한 컷";

  // AI 한마디
  showOrHide(commentBox, data.comment, () => {
    commentEl.textContent = data.comment;
  });

  // 사진
  showOrHide(photoBox, data.photoUrl, () => {
    photoEl.src = data.photoUrl;
  });

  // 날씨
  showOrHide(weatherBox, data.weather, () => {
    weatherTextEl.textContent = data.weather.text;
    weatherTempEl.textContent = data.weather.temperature + "℃";
  });

  // 지도
  showOrHide(mapBox, data.mapUrl, () => {
    mapEl.src = data.mapUrl;
  });

  // 부분 실패 안내 (실패한 조각이 있으면 표시)
  const errs = Array.isArray(data.errors) ? data.errors : [];
  if (errs.length > 0) {
    errorsList.innerHTML = "";
    errs.forEach((msg) => {
      const li = document.createElement("li");
      li.textContent = msg;
      errorsList.appendChild(li);
    });
    errorsBox.hidden = false;
  } else {
    errorsBox.hidden = true;
  }
}

// 값이 있으면 채우고 보여 주고, 없으면 그 조각만 숨긴다.
function showOrHide(box, value, fill) {
  if (value) {
    fill();
    box.hidden = false;
  } else {
    box.hidden = true;
  }
}

function setStatus(msg, kind = "") {
  statusEl.textContent = msg;
  statusEl.className = "status" + (kind ? " " + kind : "");
}

// ---------------------------------------------------------------------
// "비밀 키가 안 보인다"를 눈으로 확인시켜 주는 간단 검사기.
// 현재 페이지가 불러온 script.js 글자 안에 진짜 키 패턴이 있는지만 본다.
// ---------------------------------------------------------------------
const scanBtn = document.getElementById("scanBtn");
const scanResult = document.getElementById("scanResult");

scanBtn.addEventListener("click", async () => {
  scanResult.textContent = "검사 중…";
  scanResult.className = "status";
  try {
    const res = await fetch("script.js", { cache: "no-store" });
    const fileText = await res.text();

    // 실제 키 패턴(주석의 'sk-ant-진짜키'는 한글이 섞여 매칭 안 됨)
    const realKeyPattern = /sk-ant-[A-Za-z0-9_-]{20,}/;
    const found = realKeyPattern.test(fileText);

    if (found) {
      scanResult.textContent =
        "위험! 브라우저 코드에서 진짜 키 패턴이 발견됐습니다. 즉시 제거하세요.";
      scanResult.className = "status bad";
    } else {
      scanResult.textContent =
        "안전: 이 페이지의 JS에는 진짜 비밀 키(sk-ant-...)가 없습니다.";
      scanResult.className = "status ok";
    }
  } catch (err) {
    scanResult.textContent = "검사 실패: " + err.message;
    scanResult.className = "status bad";
  }
});
