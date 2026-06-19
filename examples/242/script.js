// ===== 상세 페이지 라우팅 스크립트 =====
// 이 파일은 detail.html 에서만 동작합니다.
//
// 흐름:
// 1) 주소(URL) 뒤에 붙은 ?id=숫자 값을 읽는다.
// 2) 그 숫자에 해당하는 글 데이터를 찾는다.
// 3) 화면(제목·날짜·본문)에 글 내용을 채운다.

// 글 데이터: 실제 서비스라면 데이터베이스(예: Supabase)에서 가져오지만,
// 지금은 라우팅 개념에 집중하기 위해 간단한 객체로 흉내 냅니다.
const posts = {
  1: {
    title: "HTML이 처음인 사람에게",
    date: "2026-06-01",
    body: "HTML은 웹페이지의 뼈대입니다. 제목, 문단, 목록, 링크 같은 '의미'를 태그로 표현합니다. 처음에는 태그 이름이 낯설지만, 자주 쓰는 것은 10개 남짓이라 금방 익숙해집니다.",
  },
  2: {
    title: "CSS로 색과 여백 다루기",
    date: "2026-06-08",
    body: "CSS는 HTML에 옷을 입히는 역할을 합니다. color로 글자색을, background로 배경색을, padding과 margin으로 여백을 조절합니다. 작은 값부터 바꿔 보며 눈으로 확인하는 것이 가장 좋은 학습법입니다.",
  },
  3: {
    title: "자바스크립트로 페이지에 생명 불어넣기",
    date: "2026-06-15",
    body: "자바스크립트는 버튼 클릭, 입력 처리처럼 '움직임'을 담당합니다. 지금 이 글을 화면에 채워 넣은 것도 자바스크립트입니다. 주소에 담긴 정보를 읽어 알맞은 내용을 보여 주는 것이 라우팅의 기본 원리입니다.",
  },
};

// 1) 현재 주소에서 ?id= 값 읽기
//    예: detail.html?id=2  ->  id 는 "2"
//    URLSearchParams 를 쓰는 이유: 주소 문자열을 직접 자르지 않고도 ?뒤의 값들을
//    안전하고 간단하게 꺼낼 수 있는 브라우저 기본 도구이기 때문.
//    주의: 여기서 꺼낸 id 는 숫자가 아니라 문자열("2")이다 — 디버깅 때 자주 헷갈리는 지점.
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

// 2) 화면에 채울 자리(요소)들 미리 잡아 두기
const titleEl = document.getElementById("post-title");
const dateEl = document.getElementById("post-date");
const bodyEl = document.getElementById("post-body");

// 3) id 에 맞는 글 찾아서 채우기
const post = posts[id];

if (post) {
  // 글을 찾았으면 내용 채우기
  document.title = post.title + " - 내 블로그";
  // textContent 로 채우는 이유(중요): 글자를 "글자 그대로" 넣어 안전하다.
  // innerHTML 로 넣으면 내용 안에 들어 있는 <script> 같은 태그가 실제로 실행될 수 있어
  // (XSS, 악성 스크립트 주입) 위험하다. 지금은 우리가 만든 데이터지만, 나중에 사용자가
  // 쓴 글을 보여줄 때를 대비해 처음부터 textContent 쓰는 습관을 들인다.
  titleEl.textContent = post.title;
  dateEl.textContent = post.date;
  bodyEl.textContent = post.body;
} else {
  // id 가 없거나 잘못된 경우 안내 메시지 표시
  titleEl.textContent = "글을 찾을 수 없어요";
  dateEl.textContent = "";
  bodyEl.textContent =
    "주소가 잘못되었거나 존재하지 않는 글입니다. 목록으로 돌아가 다시 선택해 주세요.";
}
