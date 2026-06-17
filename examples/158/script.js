// =============================================================
//  주소 입력 → 지도에 핀 찍기
//  - 지도: Leaflet (공개 지도 라이브러리, 키 필요 없음)
//  - 지오코딩(주소→좌표): Nominatim / OpenStreetMap (무료, 키 필요 없음)
//
//  '디렉터'로서 기억할 흐름은 단 세 단계입니다.
//   ① 화면에 글자(주소)를 받는다.
//   ② 지오코딩 API에 그 글자를 보내 위도·경도(좌표)를 받아온다.
//   ③ 그 좌표 자리에 지도를 옮기고 마커(핀)를 꽂는다.
// =============================================================

// ---- 화면 요소들을 미리 붙잡아 둔다 ----
const addressInput = document.getElementById("addressInput");
const searchBtn = document.getElementById("searchBtn");
const statusEl = document.getElementById("status");
const coordsEl = document.getElementById("coords");

// ---- ③에서 쓸 '마커'를 기억해 둘 변수 (처음엔 아직 없음) ----
// 검색할 때마다 새 핀을 꽂되, 이전 핀은 지워서 핀이 쌓이지 않게 합니다.
let marker = null;

// =============================================================
//  ⓪ 지도 초기화 — 처음 한 번만 실행
//  처음에는 부산 시청쯤을 가운데로 두고 지도를 그립니다.
//  (검색하면 그 좌표로 지도가 부드럽게 이동합니다.)
// =============================================================
const BUSAN = [35.1796, 129.0756]; // [위도(lat), 경도(lng)]
const map = L.map("map").setView(BUSAN, 12); // 12 = 줌 레벨(클수록 확대)

// 지도 '타일'(실제 지도 이미지 조각)을 OpenStreetMap에서 불러와 깔아 줍니다.
// attribution(출처 표기)은 OpenStreetMap 이용약관상 반드시 남겨야 합니다.
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '© OpenStreetMap 기여자',
}).addTo(map);

// =============================================================
//  ① + ② + ③  검색 한 번의 전체 흐름
// =============================================================
async function searchAndPin() {
  // ① 입력값 읽고 다듬기 (앞뒤 공백 제거)
  const query = addressInput.value.trim();

  if (!query) {
    setStatus("먼저 장소나 주소를 입력해 주세요.", "error");
    return; // 빈 칸이면 더 진행하지 않음
  }

  // 검색 중에는 버튼을 잠가 더블 클릭으로 두 번 요청되는 일을 막습니다.
  searchBtn.disabled = true;
  setStatus(`"${query}" 위치를 찾는 중이에요…`);

  try {
    // ② 지오코딩 API 호출: 글자(주소) → 좌표
    //    Nominatim은 무료·키 불필요 공개 API입니다. (그래서 브라우저에서 바로 호출 가능)
    //    format=json : JSON으로 달라  /  limit=1 : 가장 잘 맞는 1곳만
    const url =
      "https://nominatim.openstreetmap.org/search" +
      "?format=json&limit=1&q=" +
      encodeURIComponent(query); // 한글·공백을 URL에 안전하게 넣기

    const res = await fetch(url, {
      headers: { "Accept-Language": "ko" }, // 결과 이름을 한국어 우선으로
    });

    if (!res.ok) {
      // 서버가 200이 아닌 응답(예: 429 너무 많은 요청)을 주면 여기로
      throw new Error("지오코딩 서버 응답 오류 (상태코드 " + res.status + ")");
    }

    const data = await res.json(); // 결과를 자바스크립트 배열/객체로 변환

    // 검색 결과가 하나도 없으면 빈 배열 [] 이 옵니다.
    if (!Array.isArray(data) || data.length === 0) {
      setStatus(
        `"${query}"에 해당하는 장소를 찾지 못했어요. 더 구체적으로 적어 보세요.`,
        "error"
      );
      return;
    }

    // 가장 잘 맞는 첫 번째 결과의 좌표를 꺼냅니다.
    const place = data[0];
    const lat = parseFloat(place.lat); // 문자열로 오므로 숫자로 변환
    const lng = parseFloat(place.lon);
    const displayName = place.display_name || query;

    // ③ 지도 이동 + 핀(마커) 꽂기
    map.setView([lat, lng], 16); // 16 = 건물이 보일 만큼 가까이 확대

    if (marker) {
      map.removeLayer(marker); // 이전 핀이 있으면 먼저 제거 (핀 누적 방지)
    }
    marker = L.marker([lat, lng]).addTo(map);
    marker.bindPopup(displayName).openPopup(); // 핀 위에 장소 이름 말풍선

    // 사용자에게 성공 안내 + 좌표 표시
    setStatus(`"${query}" 위치에 핀을 찍었어요!`, "success");
    coordsEl.hidden = false;
    coordsEl.textContent = `위도 ${lat.toFixed(5)}, 경도 ${lng.toFixed(5)}`;
  } catch (err) {
    // 인터넷이 끊겼거나 서버 오류 등 모든 실패가 여기로 모입니다.
    // 자세한 원인은 콘솔에만, 사용자에게는 친절한 한 줄만 보여 줍니다.
    console.error("핀 찍기 실패:", err);
    setStatus(
      "위치를 찾는 중 문제가 생겼어요. 인터넷 연결을 확인하고 다시 시도해 주세요.",
      "error"
    );
  } finally {
    // 성공하든 실패하든 버튼은 다시 눌릴 수 있게 풀어 줍니다.
    searchBtn.disabled = false;
  }
}

// 상태 안내 줄의 글자와 색(성공/실패)을 한 곳에서 바꾸는 도우미
function setStatus(message, type) {
  statusEl.textContent = message;
  statusEl.classList.remove("success", "error");
  if (type) statusEl.classList.add(type); // type = "success" | "error" | undefined
}

// =============================================================
//  이벤트 연결: 버튼 클릭 / 엔터 키 / 예시 칩
// =============================================================
searchBtn.addEventListener("click", searchAndPin);

// 입력칸에서 Enter 를 눌러도 검색되게
addressInput.addEventListener("keydown", (e) => {
  if (e.key === "Enter") searchAndPin();
});

// 예시 칩을 누르면 입력칸을 채우고 바로 검색
document.querySelectorAll(".chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    addressInput.value = chip.dataset.q;
    searchAndPin();
  });
});
