// =============================================================
// 실시간 글자 수 카운터 - 동작(자바스크립트) 파일
// 무엇: 입력칸에 글자가 바뀔 때마다 글자 수를 세서 화면 숫자를 갱신한다.
// 왜 있나: HTML(index.html)은 가만히 있는 뼈대일 뿐이라, "타이핑하면 숫자가 즉시 바뀐다"는
//         살아 있는 반응은 이 파일이 담당한다. 이 실습의 핵심 학습 포인트.
// =============================================================

// 1) 화면에서 필요한 요소를 찾아옵니다
//    왜 미리 변수에 담아두나: 이벤트가 발생할 때마다 매번 찾는 것보다,
//    한 번 찾아 변수에 보관해 두면 코드가 짧고 빨라지기 때문.
const message = document.getElementById("message"); // 글을 적는 입력칸(textarea)
const count = document.getElementById("count"); // 현재 글자 수가 표시될 자리

// 허용하는 최대 글자 수. index.html의 maxlength="100"과 똑같이 맞춥니다.
const MAX = 100;

// 2) 입력칸에 "input" 이벤트를 연결합니다.
//    input 이벤트는 글자를 한 자 칠 때마다, 지울 때마다, 붙여넣을 때마다 즉시 발생합니다.
//    (click은 한 번 눌러야 하지만, input은 내용이 바뀔 때마다 계속 실행됩니다.)
message.addEventListener("input", function () {
  // message.value : 입력칸에 지금 들어 있는 글자 전체(문자열)
  // .length        : 그 문자열의 글자 수
  const length = message.value.length;

  // 3) 찾아낸 글자 수를 화면의 숫자 자리에 그대로 써넣습니다.
  //    textContent를 쓰는 이유: 넣는 값을 '글자 그대로' 표시해 안전하기 때문.
  //    (innerHTML로 넣으면 사용자가 친 <script> 같은 내용이 코드로 실행될 수 있어 XSS 위험이 생김.)
  count.textContent = length;

  // 4) (선택) 글자 수가 최대치에 거의 다 차면 색을 빨갛게 바꿔 알려줍니다.
  if (length >= MAX) {
    count.classList.add("full"); // 100자에 도달 -> 빨간색
  } else {
    count.classList.remove("full"); // 아직 여유 있음 -> 원래 색
  }
});
