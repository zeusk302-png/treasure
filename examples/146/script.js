// === 공개 명언 API에서 글귀 한 줄 받아오기 ===
//
// 비유: API 호출은 "남의 주방에 음식 한 접시를 주문"하는 것과 같다.
//  - fetch(주소)  : 주방(서버)에 "이거 하나 주세요" 하고 주문서를 보낸다.
//  - await        : 음식이 나올 때까지 잠깐 기다린다.
//  - res.json()   : 받은 접시(응답)의 포장을 풀어 안의 내용(데이터)을 꺼낸다.
//
// 이 실습에서 쓰는 API: https://api.quotable.io/random
//  - 누구나 열쇠(API 키) 없이 부를 수 있는 '공개' API라서 비밀값이 필요 없다.
//  - 응답 JSON 예시: { "content": "명언 내용", "author": "말한 사람" }

// 화면에서 다룰 요소 3개를 미리 찾아 둔다.
const btn = document.getElementById("getBtn");     // '명언 받기' 버튼
const quoteEl = document.getElementById("quote");  // 명언이 들어갈 자리
const authorEl = document.getElementById("author"); // 이름이 들어갈 자리

// 명언을 한 번 받아와 화면에 그리는 함수
async function getQuote() {
  // 1) 요청 중에는 버튼을 잠시 막아 두 번 눌리는 걸 막는다.
  btn.disabled = true;
  quoteEl.textContent = "명언을 받아오는 중…";
  authorEl.textContent = "";

  try {
    // 2) API에 주문서를 보내고(=fetch), 접시가 나올 때까지 기다린다(=await).
    const res = await fetch("https://api.quotable.io/random");

    // 3) 주방이 "그런 메뉴 없어요"(404)처럼 실패를 알려줄 수도 있다. 확인한다.
    if (!res.ok) {
      throw new Error("서버 응답이 정상이 아닙니다: " + res.status);
    }

    // 4) 응답 포장을 풀어 JSON(자바스크립트 객체)으로 바꾼다.
    const data = await res.json();

    // 5) 객체 안에서 필요한 값만 꺼내 화면에 넣는다.
    quoteEl.textContent = data.content;       // 명언 내용
    authorEl.textContent = "— " + data.author; // 말한 사람
  } catch (err) {
    // 6) 인터넷이 끊겼거나 서버가 죽었을 때 사용자에게 친절히 알려준다.
    quoteEl.textContent = "명언을 가져오지 못했어요. 잠시 후 다시 눌러주세요.";
    authorEl.textContent = "";
    console.error(err); // 개발자 콘솔(F12)에 자세한 원인 기록
  } finally {
    // 7) 성공이든 실패든 버튼은 다시 누를 수 있게 풀어준다.
    btn.disabled = false;
  }
}

// 버튼을 클릭하면 getQuote 함수를 실행하도록 연결한다.
btn.addEventListener("click", getQuote);
