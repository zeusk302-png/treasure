// 1) 화면에서 다룰 요소들을 미리 찾아 둡니다.
//    - body    : 색을 바꿀 화면 전체 (여기에 dark 클래스를 붙였다 뗍니다)
//    - themeBtn: 누를 때마다 다크모드를 켜고 끄는 버튼
var body = document.body;
var themeBtn = document.getElementById("themeBtn");

// 2) 버튼에 "클릭하면 실행할 동작"을 연결합니다.
themeBtn.addEventListener("click", function () {
  // ★ 핵심 ★ classList.toggle("dark")
  //  - body에 dark 클래스가 없으면 → 붙입니다(다크모드 켜기)
  //  - body에 dark 클래스가 있으면  → 뗍니다(다크모드 끄기)
  //  즉, 누를 때마다 "있다/없다"를 자동으로 뒤집어 줍니다.
  //  반환값(isDark)은 토글 후 클래스가 "붙어 있으면 true, 없으면 false"입니다.
  var isDark = body.classList.toggle("dark");

  if (isDark) {
    // 지금은 다크모드가 켜진 상태 → 버튼 글자를 "밝은 모드로"로 바꿉니다.
    themeBtn.textContent = "☀️ 밝은 모드로 바꾸기";
    // 접근성 표시: 지금은 눌린(켜진) 상태라고 알려줍니다.
    themeBtn.setAttribute("aria-pressed", "true");
  } else {
    // 지금은 다크모드가 꺼진 상태 → 버튼 글자를 "어두운 모드로"로 되돌립니다.
    themeBtn.textContent = "🌙 어두운 모드로 바꾸기";
    themeBtn.setAttribute("aria-pressed", "false");
  }
});

// (참고) classList에는 add(추가) / remove(제거) / contains(있는지 확인)도 있습니다.
//   body.classList.add("dark");      // 무조건 켜기
//   body.classList.remove("dark");   // 무조건 끄기
//   body.classList.contains("dark"); // 켜져 있는지 true/false로 확인
// toggle은 이 "확인 후 켜거나 끄기"를 한 줄로 처리해 주는 편리한 도구입니다.
