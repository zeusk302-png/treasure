// ============================================
// 비밀번호 강도 막대 (약함 · 보통 · 강함)
// 핵심 개념: 조건 점수화 + 정규식 여러 개 + 동적 클래스 교체
// ============================================

// 1) 화면 요소들을 미리 골라 변수에 담아둔다.
const password = document.getElementById("password");       // 비밀번호 입력칸
const meterBar = document.getElementById("meterBar");        // 채워지는 막대
const strengthText = document.getElementById("strengthText"); // 강도 글자
const ruleLength = document.getElementById("ruleLength");    // 8자 이상 항목
const ruleNumber = document.getElementById("ruleNumber");    // 숫자 포함 항목
const ruleSpecial = document.getElementById("ruleSpecial");  // 특수문자 포함 항목
const ruleUpper = document.getElementById("ruleUpper");      // 대문자 포함 항목

// 2) 비밀번호를 검사해 점수를 매기고 화면을 갱신하는 함수.
//    이 함수 하나가 "조건 검사 → 점수 → 막대 → 글자 → 체크리스트" 를 책임진다.
function checkStrength() {
  const value = password.value; // 입력칸에 적힌 글자

  // (1) 각 조건을 정규식(test)으로 검사한다. 결과는 true / false.
  //     정규식이란 "이런 글자가 들어 있는가?" 를 검사하는 패턴이다.
  const hasLength = value.length >= 8;  // 길이 8자 이상인가?
  const hasNumber = /[0-9]/.test(value);          // 숫자가 하나라도 있는가?
  const hasSpecial = /[^A-Za-z0-9]/.test(value);  // 영문·숫자가 아닌 글자(특수문자)가 있는가?
  const hasUpper = /[A-Z]/.test(value);           // 영어 대문자가 있는가?

  // (2) 조건을 점수화한다: 만족한 조건 1개당 1점 (최대 4점).
  //     true 는 1, false 는 0 으로 더해진다.
  let score = 0;
  if (hasLength) score++;
  if (hasNumber) score++;
  if (hasSpecial) score++;
  if (hasUpper) score++;

  // (3) 체크리스트 항목에 동적 클래스를 붙였다 뗐다 한다.
  //     toggle(클래스, 조건) : 조건이 true 면 붙이고 false 면 뗀다.
  ruleLength.classList.toggle("done", hasLength);
  ruleNumber.classList.toggle("done", hasNumber);
  ruleSpecial.classList.toggle("done", hasSpecial);
  ruleUpper.classList.toggle("done", hasUpper);

  // (4) 비어 있을 때는 막대를 비우고 안내 문구로 되돌린다.
  if (value === "") {
    meterBar.style.width = "0%";
    meterBar.className = "meter-bar";          // 색깔 클래스 모두 제거
    strengthText.textContent = "비밀번호를 입력하세요";
    strengthText.className = "strength-text";  // 색깔 클래스 모두 제거
    return; // 여기서 함수 끝
  }

  // (5) 점수에 따라 단계(레벨)·막대 너비·글자·색을 정한다.
  let level;   // 동적 클래스 이름 (weak / medium / strong)
  let label;   // 화면에 보여줄 글자
  let width;   // 막대를 채울 비율

  if (score <= 1) {
    level = "weak";
    label = "약함";
    width = "33%";
  } else if (score <= 3) {
    level = "medium";
    label = "보통";
    width = "66%";
  } else {
    level = "strong";
    label = "강함";
    width = "100%";
  }

  // (6) 막대: 너비를 바꾸고, 색깔 클래스를 단계에 맞게 교체한다.
  meterBar.style.width = width;
  meterBar.className = "meter-bar " + level;       // 예: "meter-bar medium"

  // (7) 글자: 강도 이름을 쓰고, 색깔 클래스를 교체한다.
  strengthText.textContent = "강도: " + label;
  strengthText.className = "strength-text " + level;
}

// 3) "타이핑할 때마다" 검사하도록 input 이벤트에 연결한다.
//    input 이벤트는 글자 한 자가 바뀔 때마다 즉시 발생한다(= 실시간 검증).
password.addEventListener("input", checkStrength);
