/*
  ============================================================
  script.js — 테마 전환 + 선택 기억 + 현재 토큰 값 미리보기
  ------------------------------------------------------------
  이 파일은 무엇? : 화면의 "동작"만 담당합니다. (1) 테마 칩을 누르면 테마를 바꾸고,
                    (2) 그 선택을 localStorage에 기억하고, (3) 지금 적용된 색 토큰을
                    실제 값으로 읽어와 미리보기 칩으로 보여 줍니다.
  중요한 원칙     : 색·간격 같은 '값'은 절대 이 JS에 두지 않습니다.
                    값은 CSS 토큰(style.css)이 단일 진실의 원천이고, JS는 "어떤 테마를
                    켤지(data-theme)"만 바꿉니다. 그래야 디자인 변경이 CSS 한 곳에서 끝납니다.
  보안 메모       : 사용자 입력을 화면에 넣을 땐 textContent를 씁니다(innerHTML 아님).
                    innerHTML로 넣으면 값에 섞인 <script>가 실행될 수 있어 XSS 위험이라,
                    글자는 항상 textContent로 안전하게 출력합니다.
  ============================================================
*/

// localStorage에 테마를 저장할 때 쓸 key. 한 곳에 상수로 둬서 오타로 어긋나는 걸 막습니다.
const THEME_KEY = "practice315-theme";

// 미리보기에 보여 줄 색 토큰 목록. '이름'만 적어 두고 값은 실시간으로 읽어 옵니다(=항상 최신).
const PREVIEW_TOKENS = [
  "--color-brand",
  "--color-brand-strong",
  "--color-bg",
  "--color-surface",
  "--color-text",
  "--color-muted",
];

/**
 * 테마를 적용하는 함수.
 * 하는 일: body의 data-theme 속성만 바꿉니다. 그러면 CSS의 [data-theme="..."] 규칙이
 *          알아서 토큰 세트를 교체해 화면 전체 색이 바뀝니다. (JS는 색을 직접 안 만짐)
 * @param {string} theme - "indigo" | "emerald" | "rose" | "dark"
 */
function applyTheme(theme) {
  document.body.setAttribute("data-theme", theme);

  // 어떤 칩이 켜졌는지 표시. aria-pressed는 스크린리더에도 "지금 눌린 버튼"임을 알려 줍니다(접근성).
  document.querySelectorAll(".chip").forEach((chip) => {
    const isOn = chip.dataset.setTheme === theme;
    chip.setAttribute("aria-pressed", isOn ? "true" : "false");
  });

  // 선택을 기억합니다. 다음에 페이지를 다시 열어도 같은 테마가 유지되도록(사용자 경험).
  localStorage.setItem(THEME_KEY, theme);

  // 테마가 바뀌면 미리보기 색 칩도 새 값으로 다시 그립니다.
  renderTokenPreview();
}

/**
 * 지금 화면에 실제로 적용된 토큰 값을 읽어와 미리보기 칩을 그립니다.
 * 하는 일: getComputedStyle로 'CSS가 최종 계산한 변수 값'을 읽습니다.
 *          (CSS 파일을 다시 파싱하지 않고, 브라우저가 적용 중인 진짜 값을 가져오는 방법)
 */
function renderTokenPreview() {
  const list = document.getElementById("swatchList");
  const rootStyle = getComputedStyle(document.body);

  // 다시 그리기 전에 기존 칩을 비웁니다(중복 방지).
  list.textContent = "";

  PREVIEW_TOKENS.forEach((tokenName) => {
    // 토큰의 현재 값(예: "#4f46e5")을 읽습니다. 앞뒤 공백은 trim으로 정리.
    const value = rootStyle.getPropertyValue(tokenName).trim();

    const li = document.createElement("li");
    li.className = "swatch";

    // 색을 보여 주는 네모. 배경색만 인라인 style로 넣습니다(읽어 온 토큰 값 그대로).
    const dot = document.createElement("span");
    dot.className = "dot";
    dot.style.background = value;

    // 토큰 이름과 값을 글자로. textContent라 어떤 값이 와도 코드로 실행되지 않습니다(XSS 안전).
    const label = document.createElement("span");
    label.className = "name";
    label.textContent = `${tokenName} = ${value}`;

    li.appendChild(dot);
    li.appendChild(label);
    list.appendChild(li);
  });
}

// 테마 칩 클릭 처리. 버튼마다 따로 핸들러를 달지 않고, 부모에서 한 번에 받는 '이벤트 위임' 방식 —
// 나중에 칩을 더 추가해도 이 코드를 안 고쳐도 됩니다.
document.querySelector(".theme-switch").addEventListener("click", (e) => {
  const btn = e.target.closest(".chip");
  if (!btn) return; // 칩이 아닌 빈 곳을 누르면 무시
  applyTheme(btn.dataset.setTheme); // 버튼에 적힌 data-set-theme 값으로 전환
});

// 페이지가 처음 열릴 때: 저장된 테마가 있으면 그걸, 없으면 HTML 기본값(indigo)을 적용합니다.
const saved = localStorage.getItem(THEME_KEY);
applyTheme(saved || document.body.getAttribute("data-theme") || "indigo");
