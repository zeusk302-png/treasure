// 1) HTML에서 시각/날짜를 보여줄 요소를 미리 찾아둡니다.
//    document.getElementById는 "이름표(id)로 요소 하나를 찾아줘"라는 뜻입니다.
const clockBox = document.getElementById("clock");
const dateBox = document.getElementById("date");

// 2) 숫자가 한 자리면 앞에 0을 붙여 주는 작은 도우미 함수입니다.
//    예: 9 -> "09",  15 -> "15"  (시계는 항상 두 자리로 보여야 보기 좋습니다)
function twoDigits(number) {
  // padStart(2, "0"): 글자 길이가 2가 될 때까지 앞을 "0"으로 채웁니다.
  return String(number).padStart(2, "0");
}

// 3) "지금 이 순간"을 화면에 그리는 함수입니다.
function showTime() {
  // new Date()는 "지금 이 순간의 날짜·시각"을 담은 상자(Date 객체)를 만듭니다.
  const now = new Date();

  // Date 객체에서 시·분·초를 꺼냅니다. (컴퓨터에 설정된 현지 시각 기준)
  const hours = now.getHours();     // 0 ~ 23
  const minutes = now.getMinutes(); // 0 ~ 59
  const seconds = now.getSeconds(); // 0 ~ 59

  // 두 자리로 맞춘 뒤 "시:분:초" 모양의 한 문장으로 합칩니다.
  const timeText =
    twoDigits(hours) + ":" + twoDigits(minutes) + ":" + twoDigits(seconds);

  // textContent로 화면의 글자를 방금 만든 시각으로 갈아끼웁니다.
  clockBox.textContent = timeText;

  // (보너스) 오늘 날짜도 한국식으로 보기 좋게 만들어 보여줍니다.
  const year = now.getFullYear();
  const month = now.getMonth() + 1; // 주의: 월은 0부터 시작하므로 +1을 해줍니다 (0=1월)
  const day = now.getDate();
  // 요일 이름표. getDay()는 0(일)~6(토)을 돌려주므로 그 번호로 글자를 골라 씁니다.
  const weekdayNames = ["일", "월", "화", "수", "목", "금", "토"];
  const weekday = weekdayNames[now.getDay()];

  dateBox.textContent =
    year + "년 " + month + "월 " + day + "일 (" + weekday + ")";
}

// 4) 페이지가 열리자마자 한 번 먼저 그려 줍니다.
//    이게 없으면 첫 1초 동안 "--:--:--"가 보였다가 1초 뒤에야 바뀌어 어색합니다.
showTime();

// 5) setInterval은 "정해진 간격마다 이 함수를 반복 실행해줘"라는 명령입니다.
//    1000은 1000밀리초(ms) = 1초를 뜻합니다.
//    => 1초마다 showTime()이 다시 실행되어 시계가 살아 움직입니다.
setInterval(showTime, 1000);
