/*
  이 파일은 무엇인가:
  데모 페이지의 "캐시 정책 불러오기" 버튼 동작을 담은 작은 스크립트입니다.
  버튼을 누르면 서버의 /headers(JSON)를 가져와, 지금 자원별로 어떤 Cache-Control이
  걸려 있는지 화면에 글로 보여 줍니다.

  왜 여기(/static)에 있는가:
  style.css와 마찬가지로 /static 경로라 1년 immutable 캐시로 옵니다(재방문 시 즉시 실행).
  내용을 바꾸면 index.html의 ?v= 값을 올려 새로 받게 합니다(캐시 버스팅).
*/

// 버튼과 출력 영역을 잡아 둡니다.
const checkBtn = document.getElementById("checkBtn");
const output = document.getElementById("output");

checkBtn.addEventListener("click", async () => {
  try {
    // 서버의 진단 엔드포인트 호출. cache: "no-store"는 이 진단 요청만큼은
    // 브라우저 캐시를 쓰지 말고 항상 새로 받으라는 뜻(정확한 현재 상태를 보기 위함).
    const res = await fetch("/headers", { cache: "no-store" });
    const data = await res.json();

    // 보안 메모: 서버가 준 데이터를 화면에 넣을 때 innerHTML 대신 textContent를 씁니다.
    // 왜: innerHTML로 넣으면 데이터 안에 <script> 같은 게 있을 때 실행될 수 있어 XSS 위험이라,
    //     '글자 그대로만' 출력하는 textContent로 막는 것입니다.
    output.textContent = JSON.stringify(data, null, 2);
  } catch (err) {
    // 실패해도 페이지가 멈추지 않게, 에러 메시지를 글자로만 보여 줍니다.
    output.textContent = "불러오기 실패: " + err.message;
  }
});
