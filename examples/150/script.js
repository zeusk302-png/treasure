// === 오늘의 명언 카드: 하나의 JSON에서 '여러 필드'를 동시에 꺼내 쓰기 ===
//
// 핵심 개념(이번 실습의 주제):
//  - 서버가 보내주는 응답(JSON)은 보통 값 하나가 아니라 '여러 개'가 든 한 덩어리다.
//  - 예: { "content": "글귀 내용", "author": "말한 사람" }
//  - 우리는 이 안에서 content(글귀)와 author(작가) '두 개'를 동시에 꺼내
//    한 카드 안의 서로 다른 자리에 나란히 채워 넣는다.
//
// 비유: 택배 상자(JSON) 하나를 열면 그 안에 물건이 여러 개 들어 있다.
//       상자에 붙은 이름표(키, key)를 보고 '글귀'와 '작가'를 각각 꺼내
//       각자의 자리에 올려두는 것이다.
//
// 이 실습이 쓰는 API: https://api.quotable.io/random
//  - 누구나 열쇠(API 키) 없이 부를 수 있는 '공개' API라서 비밀값이 필요 없다.
//  - 응답 JSON 예시:
//      {
//        "content": "오늘 할 수 있는 일에 전력을 다하라.",  ← 글귀
//        "author":  "아이작 뉴턴"                          ← 작가
//      }

// 화면에서 다룰 요소들을 미리 찾아 둔다.
const btn = document.getElementById("newBtn");      // '명언 받기' 버튼
const quoteEl = document.getElementById("quote");   // content(글귀)가 들어갈 자리
const authorEl = document.getElementById("author"); // author(작가)가 들어갈 자리

// 인터넷이 안 될 때를 대비한 예비 명언들.
// (수업 중 와이파이가 끊겨도 '한 덩어리에서 두 필드 꺼내기'라는 핵심은 체험할 수 있게 한다.)
// 예비 데이터도 실제 응답과 똑같이 content/author 두 키를 가진 객체로 만들어 둔다.
const sampleQuotes = [
  { content: "오늘 할 수 있는 일에 전력을 다하라.", author: "아이작 뉴턴" },
  { content: "시작이 반이다.", author: "아리스토텔레스" },
  { content: "천 리 길도 한 걸음부터.", author: "노자" },
  { content: "배움에는 끝이 없다.", author: "공자" },
];

// 받은 명언 한 덩어리(객체)에서 두 필드를 꺼내 화면에 그리는 함수.
// 매개변수 quote 는 { content, author } 모양의 '객체 하나'다.
function render(quote) {
  // 1) 잠깐 흐리게 만들어 '바뀌는 중'임을 보여준다.
  quoteEl.classList.add("fading");
  authorEl.classList.add("fading");

  // 2) 0.2초 뒤에 두 필드를 각자의 자리에 채우고 다시 또렷하게 한다.
  setTimeout(() => {
    // ★ 핵심: 객체 하나(quote)에서 점(.)으로 두 개의 키를 동시에 꺼낸다.
    quoteEl.textContent = quote.content;                 // content 키 → 글귀 자리
    authorEl.textContent = quote.author                  // author 키 → 작가 자리
      ? "— " + quote.author
      : "— 작자 미상";                                    // 작가 정보가 비어 있을 때 대비

    quoteEl.classList.remove("fading");
    authorEl.classList.remove("fading");
  }, 200);
}

// 버튼을 누를 때 실행되는 함수: 명언 한 덩어리를 받아온다.
async function getQuote() {
  // 1) 요청 중에는 버튼을 잠시 막아 두 번 눌리는 걸 막는다.
  btn.disabled = true;

  try {
    // 2) 서버에 명언을 한 덩어리 요청한다(=fetch).
    const res = await fetch("https://api.quotable.io/random");

    // 3) 서버가 실패를 알려줄 수도 있으니 확인한다.
    if (!res.ok) {
      throw new Error("서버 응답이 정상이 아닙니다: " + res.status);
    }

    // 4) 응답 포장을 풀어 JSON(자바스크립트 객체)으로 바꾼다.
    //    data 는 { content: "...", author: "..." } 모양의 객체 한 덩어리다.
    const data = await res.json();

    // 5) 그 한 덩어리를 그대로 render에 넘기면,
    //    render 안에서 content와 author 두 필드를 동시에 꺼내 카드에 채운다.
    render(data);
  } catch (err) {
    // 6) 인터넷이 끊겼다면 예비 명언 중 하나를 무작위로 골라 보여준다.
    //    이 객체도 content/author 두 키를 가지므로 화면 그리는 방식은 똑같다.
    const random = sampleQuotes[Math.floor(Math.random() * sampleQuotes.length)];
    render({ content: "(오프라인) " + random.content, author: random.author });
    console.error(err); // 개발자 콘솔(F12)에 자세한 원인 기록
  } finally {
    // 7) 성공이든 실패든 버튼은 다시 누를 수 있게 풀어준다.
    //    잠깐의 페이드 연출(0.2초)이 끝난 뒤 풀어 자연스럽게 보이게 한다.
    setTimeout(() => {
      btn.disabled = false;
    }, 250);
  }
}

// 버튼을 클릭할 때마다 getQuote 함수를 실행하도록 연결한다.
btn.addEventListener("click", getQuote);
