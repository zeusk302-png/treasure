// === '새 명언' 버튼: 누를 때마다 다시 호출해 매번 새 데이터 받기 ===
//
// 핵심 개념(실습 146과의 차이):
//  - 146: 명언을 "한 번" 받아오고 끝.
//  - 148: 버튼을 누를 때마다 fetch를 "다시" 실행한다.
//          → 같은 함수가 클릭마다 반복 호출되고, 그 결과로 화면(DOM)이 매번 갈아끼워진다.
//
// 비유: 자판기 버튼을 한 번 누르면 음료 한 캔이 나온다.
//       또 누르면 또 한 캔. '한 번 받고 끝'이 아니라 '누른 만큼 반복'이다.
//       fetch도 똑같이, 버튼을 누를 때마다 서버에 새 주문서를 보낸다.
//
// 이 실습이 쓰는 API: https://api.quotable.io/random
//  - 누구나 열쇠(API 키) 없이 부를 수 있는 '공개' API라서 비밀값이 필요 없다.
//  - 응답 JSON 예시: { "content": "명언 내용", "author": "말한 사람" }

// 화면에서 다룰 요소들을 미리 찾아 둔다.
const btn = document.getElementById("newBtn");      // '새 명언' 버튼
const quoteEl = document.getElementById("quote");   // 명언이 들어갈 자리
const authorEl = document.getElementById("author"); // 이름이 들어갈 자리
const countEl = document.getElementById("count");   // 호출 횟수 안내

// 지금까지 버튼을 몇 번 눌러 호출했는지 세는 변수.
// 클릭마다 1씩 늘어나면서 '반복 호출'이 일어나고 있음을 눈으로 확인하게 해 준다.
let callCount = 0;

// 인터넷이 안 될 때를 대비한 예비 명언들.
// (수업 중 와이파이가 끊겨도 '누를 때마다 다른 글귀'라는 핵심 흐름은 체험할 수 있게 한다.)
const sampleQuotes = [
  { content: "오늘 할 수 있는 일에 전력을 다하라.", author: "아이작 뉴턴" },
  { content: "시작이 반이다.", author: "아리스토텔레스" },
  { content: "천 리 길도 한 걸음부터.", author: "노자" },
  { content: "배움에는 끝이 없다.", author: "공자" },
];

// 화면의 명언/이름을 새 값으로 갈아끼우는 함수.
// (fetch로 받은 값이든, 예비 명언이든 똑같이 이 함수로 화면을 그린다.)
function render(content, author) {
  // 1) 잠깐 흐리게 만들어 '바뀌는 중'임을 보여준다.
  quoteEl.classList.add("fading");

  // 2) 0.2초 뒤에 새 글귀로 채우고 다시 또렷하게 한다.
  setTimeout(() => {
    quoteEl.textContent = content;
    authorEl.textContent = author ? "— " + author : "";
    quoteEl.classList.remove("fading");
  }, 200);
}

// 버튼을 누를 때마다 실행되는 함수.
async function getNewQuote() {
  // 0) 클릭할 때마다 호출 횟수를 1 올린다 → 반복 호출이 일어남을 수치로 확인.
  callCount = callCount + 1;
  countEl.textContent = "지금까지 " + callCount + "번 받았어요.";

  // 1) 요청 중에는 버튼을 잠시 막아 두 번 눌리는 걸 막는다.
  btn.disabled = true;

  try {
    // 2) 버튼을 누를 때마다 '새로' 주문서를 보낸다(=fetch). 이게 반복 호출의 핵심.
    const res = await fetch("https://api.quotable.io/random");

    // 3) 서버가 실패를 알려줄 수도 있으니 확인한다.
    if (!res.ok) {
      throw new Error("서버 응답이 정상이 아닙니다: " + res.status);
    }

    // 4) 응답 포장을 풀어 JSON(자바스크립트 객체)으로 바꾼다.
    const data = await res.json();

    // 5) 받은 새 값으로 화면을 갈아끼운다(=DOM 갱신).
    render(data.content, data.author);
  } catch (err) {
    // 6) 인터넷이 끊겼다면 예비 명언 중 하나를 무작위로 골라 보여준다.
    //    → 그래도 '누를 때마다 다른 글귀'라는 흐름은 그대로 체험된다.
    const random = sampleQuotes[Math.floor(Math.random() * sampleQuotes.length)];
    render("(오프라인) " + random.content, random.author);
    console.error(err); // 개발자 콘솔(F12)에 자세한 원인 기록
  } finally {
    // 7) 성공이든 실패든 버튼은 다시 누를 수 있게 풀어준다.
    //    잠깐의 페이드 연출(0.2초)이 끝난 뒤 풀어 자연스럽게 보이게 한다.
    setTimeout(() => {
      btn.disabled = false;
    }, 250);
  }
}

// 버튼을 클릭할 때마다 getNewQuote 함수를 실행하도록 연결한다.
// (한 번만 연결해도, 누를 때마다 함수가 다시 실행된다.)
btn.addEventListener("click", getNewQuote);
