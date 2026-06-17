// === 랜덤 강아지/고양이 사진 갤러리: JSON 안의 '주소'를 img 태그에 연결하기 ===
//
// 이번 실습의 한 줄 핵심:
//   "API가 돌려준 JSON 안에 들어 있는 이미지 주소(URL)를 꺼내서,
//    <img>의 src에 꽂으면 화면에 사진이 뜬다."
//
// 비유: 택배 상자(JSON)를 열면 안에 '사진이 걸려 있는 인터넷 주소'라는 쪽지가 들어 있다.
//       그 주소를 액자(img)의 못(src)에 걸면 사진이 보인다.
//
// 이 실습이 쓰는 API (둘 다 누구나 열쇠=API 키 없이 부를 수 있는 '공개' API):
//   - 강아지: https://dog.ceo/api/breeds/image/random
//       응답 예: { "message": "https://images.dog.ceo/.../사진.jpg", "status": "success" }
//       → 사진 주소는 data.message 안에 들어 있다.
//   - 고양이: https://api.thecatapi.com/v1/images/search
//       응답 예: [ { "url": "https://cdn2.thecatapi.com/.../사진.jpg", ... } ]
//       → 응답이 '배열'이라서, 첫 번째 칸(data[0])의 url 안에 사진 주소가 있다.
//
// 두 API는 JSON 모양이 살짝 다르다. "같은 사진 주소라도 들어 있는 위치가 다를 수 있다"는
// 점을 직접 보는 것도 이 실습의 목표다.

// 화면에서 다룰 요소들을 미리 찾아 둔다.
const img = document.getElementById("animalImg");   // 사진이 들어갈 액자(img)
const statusEl = document.getElementById("status");  // 받아오는 중/실패 안내 문구
const countEl = document.getElementById("count");    // 지금까지 몇 장 받았는지
const newBtn = document.getElementById("newBtn");    // '새 사진' 버튼
const animalBtns = document.querySelectorAll(".animalBtn"); // 강아지/고양이 선택 버튼들

// 지금 고른 동물 종류. 기본값은 강아지("dog").
let currentAnimal = "dog";

// 지금까지 사진을 몇 장 받았는지 세는 변수.
let count = 0;

// 인터넷이 안 될 때를 대비한 예비 사진 주소.
// (수업 중 와이파이가 끊겨도 'JSON 속 주소를 img.src에 꽂는다'는 핵심 흐름은 체험할 수 있게 한다.)
// 외부 통신이 막혀도 보이도록, 글자만으로 그린 SVG 이미지를 주소처럼 사용한다.
const fallbackImages = {
  dog: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='300' height='220'>" +
    "<rect width='300' height='220' fill='#ffe3c2'/>" +
    "<text x='150' y='120' font-size='80' text-anchor='middle'>🐶</text>" +
    "<text x='150' y='180' font-size='16' text-anchor='middle' fill='#a0522d'>(오프라인 예비 사진)</text>" +
    "</svg>"
  ),
  cat: "data:image/svg+xml;charset=UTF-8," + encodeURIComponent(
    "<svg xmlns='http://www.w3.org/2000/svg' width='300' height='220'>" +
    "<rect width='300' height='220' fill='#d8e8ff'/>" +
    "<text x='150' y='120' font-size='80' text-anchor='middle'>🐱</text>" +
    "<text x='150' y='180' font-size='16' text-anchor='middle' fill='#3b6ea5'>(오프라인 예비 사진)</text>" +
    "</svg>"
  ),
};

// API에서 받은 JSON에서 '사진 주소'만 꺼내는 함수.
// 강아지와 고양이는 JSON 모양이 다르므로, 동물에 따라 다른 칸에서 꺼낸다.
function getImageUrl(animal, data) {
  if (animal === "dog") {
    // 강아지: { message: "주소" } → message 칸에서 꺼낸다.
    return data.message;
  } else {
    // 고양이: [ { url: "주소" } ] → 배열의 첫 칸(data[0])의 url에서 꺼낸다.
    return data[0].url;
  }
}

// 동물 종류에 맞는 API 주소를 돌려주는 함수.
function getApiUrl(animal) {
  if (animal === "dog") {
    return "https://dog.ceo/api/breeds/image/random";
  } else {
    return "https://api.thecatapi.com/v1/images/search";
  }
}

// 새 사진 한 장을 받아와 화면에 거는 함수. (버튼을 누를 때마다 실행된다.)
async function loadNewPhoto() {
  // 1) 요청 중에는 버튼을 잠시 막아 두 번 눌리는 걸 막는다.
  newBtn.disabled = true;
  statusEl.textContent = "사진을 받아오는 중…";
  img.classList.add("loading"); // 받아오는 동안 살짝 흐리게

  try {
    // 2) 고른 동물에 맞는 주소로 서버에 사진을 요청한다(=fetch).
    const res = await fetch(getApiUrl(currentAnimal));

    // 3) 서버가 실패를 알려줄 수도 있으니 확인한다.
    if (!res.ok) {
      throw new Error("서버 응답이 정상이 아닙니다: " + res.status);
    }

    // 4) 응답 포장을 풀어 JSON(자바스크립트 값)으로 바꾼다.
    const data = await res.json();

    // 5) ★이 실습의 핵심★ JSON 안에서 '사진 주소'만 꺼낸다.
    const imageUrl = getImageUrl(currentAnimal, data);

    // 6) 꺼낸 주소를 img의 src에 꽂는다 → 그 순간 화면에 사진이 뜬다.
    img.src = imageUrl;

    // 7) 사진이 다 보이면 안내 문구를 지우고 횟수를 1 올린다.
    statusEl.textContent = "";
    count = count + 1;
    countEl.textContent = "지금까지 " + count + "장 받았어요.";
  } catch (err) {
    // 8) 인터넷이 끊겼다면 예비 사진을 보여준다.
    //    → 그래도 'JSON 속 주소를 src에 꽂는다'는 흐름은 그대로 체험된다.
    img.src = fallbackImages[currentAnimal];
    statusEl.textContent = "(오프라인) 예비 사진을 보여줘요.";
    console.error(err); // 개발자 콘솔(F12)에 자세한 원인 기록
  } finally {
    // 9) 성공이든 실패든 버튼은 다시 누를 수 있게 풀어준다.
    img.classList.remove("loading");
    newBtn.disabled = false;
  }
}

// 강아지/고양이 선택 버튼을 누르면, 고른 동물을 바꾸고 곧바로 그 동물 사진을 받아온다.
animalBtns.forEach((b) => {
  b.addEventListener("click", () => {
    // 1) 모든 버튼에서 '선택됨' 표시를 떼고, 방금 누른 버튼에만 붙인다.
    animalBtns.forEach((x) => x.classList.remove("is-active"));
    b.classList.add("is-active");

    // 2) 고른 동물 종류를 기억한다. (버튼의 data-animal 값을 읽는다.)
    currentAnimal = b.dataset.animal;

    // 3) 새로 고른 동물의 사진을 바로 받아온다.
    loadNewPhoto();
  });
});

// '새 사진' 버튼을 누를 때마다 사진을 다시 받아오도록 연결한다.
newBtn.addEventListener("click", loadNewPhoto);
