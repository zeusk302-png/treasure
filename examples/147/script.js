// 실습 147 — Network 탭으로 내 API 요청 엿보기
// 핵심: 이 fetch 한 줄이 곧 "남의 주방에 음식 한 접시 주문"입니다.
// 버튼을 누른 그 순간 F12 → Network 탭에 요청 한 줄이 새로 찍힙니다.

// 공개 명언 API (회원가입·키 없이 누구나 호출 가능)
const QUOTE_API = "https://api.quotable.io/random";

const quoteBox = document.getElementById("quote");
const loadBtn = document.getElementById("loadBtn");

// 1) 버튼을 누르면 API를 한 번 호출해 글귀 한 줄을 화면에 띄운다
loadBtn.addEventListener("click", async () => {
  quoteBox.textContent = "받아오는 중...";
  try {
    // 주문서를 보낸다 (요청). 이 줄이 Network 탭에 한 줄로 찍힌다.
    const response = await fetch(QUOTE_API);

    // 영수증 도장 = 상태코드. 200이면 "정상 제공".
    // 콘솔에도 찍어두면 Network 탭 값과 비교해볼 수 있다.
    console.log("상태코드(status):", response.status);

    // 음식을 받아 JSON으로 푼다 (응답).
    const data = await response.json();
    console.log("응답 JSON:", data);

    // 응답 안의 글귀 한 줄을 꺼내 화면에 표시한다.
    // textContent로 넣는 이유: 외부에서 받은 값(여기선 API 응답)을 innerHTML로 넣으면
    // 그 안에 <script> 같은 게 섞여 있을 때 실행될 수 있어(XSS) 위험하다. 글자 그대로만 찍는 textContent가 안전하다.
    quoteBox.textContent = `"${data.content}" — ${data.author}`;
  } catch (error) {
    // 요청 자체가 실패하면(인터넷 끊김 등) 여기로 온다.
    quoteBox.textContent = "요청에 실패했어요. Network 탭에서 빨간 줄을 확인해 보세요.";
    console.error(error);
  }
});

// 2) 내가 Network 탭에서 직접 본 값을 기록해 페이지에 남긴다
const saveBtn = document.getElementById("saveBtn");
const recorded = document.getElementById("recorded");

saveBtn.addEventListener("click", () => {
  // .trim()으로 앞뒤 공백을 떼는 이유: 사용자가 실수로 띄어쓰기만 입력한 칸을
  // "채워졌다"고 오해하지 않게 하려는 것. 아래 빈 칸 검사를 정확하게 만들어 준다.
  const reqUrl = document.getElementById("reqUrl").value.trim();
  const status = document.getElementById("status").value.trim();
  const respPart = document.getElementById("respPart").value.trim();

  // 빈 칸이 있으면 안내만 하고 멈춘다.
  if (!reqUrl || !status || !respPart) {
    recorded.hidden = false;
    recorded.textContent = "세 칸을 모두 채워 주세요 (요청 URL · 상태코드 · 응답 일부).";
    return;
  }

  // 관찰 결과를 보기 좋게 정리해 화면에 남긴다.
  recorded.hidden = false;
  recorded.textContent =
    "내가 Network 탭에서 본 1차 증거\n" +
    "------------------------------\n" +
    "요청 URL : " + reqUrl + "\n" +
    "상태코드 : " + status + "\n" +
    "응답 일부 : " + respPart;
});
