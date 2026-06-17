// 1) 화면에서 필요한 요소를 찾아옵니다
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
  count.textContent = length;

  // 4) (선택) 글자 수가 최대치에 거의 다 차면 색을 빨갛게 바꿔 알려줍니다.
  if (length >= MAX) {
    count.classList.add("full"); // 100자에 도달 -> 빨간색
  } else {
    count.classList.remove("full"); // 아직 여유 있음 -> 원래 색
  }
});
