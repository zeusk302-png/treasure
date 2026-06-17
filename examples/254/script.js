// ============================================================
// 예약 시스템 - 날짜·시간 선택 UI
// 이 실습은 "화면(UI)"만 다룹니다. 실제 저장(Supabase)은 다음 실습(255)에서 합니다.
// ============================================================

// 화면에서 다룰 요소들을 미리 찾아 둡니다.
const dateInput = document.getElementById("reserve-date");   // 날짜 입력칸
const timeSlots = document.getElementById("time-slots");      // 시간 버튼이 들어갈 자리
const summaryBox = document.getElementById("summary");        // 선택 요약 박스
const summaryText = document.getElementById("summary-text");  // 요약 문장
const reserveBtn = document.getElementById("reserve-btn");    // 예약하기 버튼
const doneMessage = document.getElementById("done-message");  // 완료 메시지

// 보여줄 시간대 목록 (가게 영업시간이라고 생각하세요)
const TIME_OPTIONS = [
  "10:00", "11:00", "12:00",
  "13:00", "14:00", "15:00",
  "16:00", "17:00", "18:00",
];

// 이미 예약이 찬 시간대 (지금은 예시로 고정해 둡니다)
// 실제로는 다음 실습에서 Supabase에 저장된 예약을 읽어와 채우게 됩니다.
const BOOKED_TIMES = ["12:00", "15:00"];

// 현재 사용자가 고른 값을 기억하는 변수들
let selectedDate = "";  // 예: "2026-06-20"
let selectedTime = "";  // 예: "14:00"

// ------------------------------------------------------------
// 1) 날짜 입력칸의 최소값을 "오늘"로 설정 → 과거 날짜 선택 차단
// ------------------------------------------------------------
function getTodayString() {
  const today = new Date();
  const year = today.getFullYear();
  // 월·일은 한 자리면 앞에 0을 붙여 두 자리로 맞춥니다. (예: 6월 → "06")
  const month = String(today.getMonth() + 1).padStart(2, "0");
  const day = String(today.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}
dateInput.min = getTodayString();

// ------------------------------------------------------------
// 2) 날짜를 고르면 시간 버튼들을 새로 그립니다.
// ------------------------------------------------------------
dateInput.addEventListener("change", function () {
  selectedDate = dateInput.value;
  selectedTime = "";          // 날짜가 바뀌면 시간 선택은 초기화
  doneMessage.hidden = true;  // 이전 완료 메시지 숨기기
  renderTimeSlots();
  updateSummary();
});

// 시간 버튼들을 만들어 화면에 그리는 함수
function renderTimeSlots() {
  // 기존에 있던 내용(안내문이나 이전 버튼들)을 모두 비웁니다.
  timeSlots.innerHTML = "";

  TIME_OPTIONS.forEach(function (time) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "slot";
    btn.textContent = time;

    // 이미 찬 시간이면 버튼을 비활성화(못 누르게)합니다.
    if (BOOKED_TIMES.includes(time)) {
      btn.disabled = true;
      btn.title = "이미 예약이 찼습니다";
    } else {
      // 누를 수 있는 시간이면 클릭 동작을 연결합니다.
      btn.addEventListener("click", function () {
        selectTime(time, btn);
      });
    }

    timeSlots.appendChild(btn);
  });
}

// ------------------------------------------------------------
// 3) 시간 버튼을 누르면 그 버튼만 '선택됨' 상태로 만듭니다.
// ------------------------------------------------------------
function selectTime(time, clickedBtn) {
  selectedTime = time;

  // 모든 시간 버튼에서 'selected' 표시를 지웁니다. (한 번에 하나만 선택)
  const allSlots = timeSlots.querySelectorAll(".slot");
  allSlots.forEach(function (slot) {
    slot.classList.remove("selected");
  });

  // 방금 누른 버튼에만 'selected' 표시를 붙입니다.
  clickedBtn.classList.add("selected");

  doneMessage.hidden = true;
  updateSummary();
}

// ------------------------------------------------------------
// 4) 선택 상태에 따라 요약 박스와 예약 버튼을 갱신합니다.
// ------------------------------------------------------------
function updateSummary() {
  if (selectedDate && selectedTime) {
    // 날짜와 시간을 둘 다 골랐을 때
    summaryText.textContent = `${selectedDate} ${selectedTime}`;
    summaryBox.hidden = false;
    reserveBtn.disabled = false;   // 버튼 활성화
  } else {
    // 아직 둘 중 하나라도 안 골랐을 때
    summaryBox.hidden = true;
    reserveBtn.disabled = true;    // 버튼 비활성화
  }
}

// ------------------------------------------------------------
// 5) 예약하기 버튼을 누르면 완료 메시지를 보여 줍니다.
//    (이번 실습은 화면 확인까지. 실제 저장은 다음 실습에서!)
// ------------------------------------------------------------
reserveBtn.addEventListener("click", function () {
  doneMessage.textContent =
    `예약 신청 완료: ${selectedDate} ${selectedTime} (화면 확인용 메시지입니다)`;
  doneMessage.hidden = false;
});
