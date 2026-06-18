// =====================================================================
// 실습 269 — 5초 클릭 게임 점수를 Supabase 리더보드에 저장하고 순위로 보여주기
// =====================================================================
// 큰 그림 (딱 3단계):
//   1) 게임:   5초 동안 버튼을 누른 횟수를 센다 → 그게 '점수'.
//   2) 저장:   끝나면 '닉네임 + 점수'를 Supabase scores 표에 한 줄 insert.
//   3) 순위:   scores를 점수 높은 순(desc)으로 정렬해 위에서 10개만 가져와 그린다.
// =====================================================================


// --- 0) Supabase 연결 만들기 -------------------------------------------
// SUPABASE_URL / SUPABASE_ANON_KEY 는 index.html 위쪽 <script>에 적어 둔 값입니다.
// ★ 여기 들어가는 키는 anon(공개) 키여야 합니다. service_role(비밀) 키는 절대 X.
const db = supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

const GAME_SECONDS = 5;   // 게임 시간(초)
const TOP_N = 10;         // 리더보드에 보여 줄 인원 수


// --- 화면 요소 모아두기 ------------------------------------------------
const timeEl   = document.getElementById("time");
const countEl  = document.getElementById("count");
const tapBtn   = document.getElementById("tapBtn");
const saveArea = document.getElementById("saveArea");
const finalEl  = document.getElementById("finalScore");
const saveForm = document.getElementById("saveForm");
const nameEl   = document.getElementById("playerName");
const boardEl  = document.getElementById("board");
const statusEl = document.getElementById("status");


// --- 게임 상태(변수) ---------------------------------------------------
let score = 0;          // 누른 횟수(= 점수)
let playing = false;    // 게임 중인지
let timerId = null;     // 타이머 멈출 때 쓰려고 기억해 둠


// --- 상태 메시지 도우미 -------------------------------------------------
function showStatus(text, type) {
  statusEl.textContent = text;
  statusEl.className = "status " + type;   // info / ok / fail
  statusEl.hidden = false;
}


// --- 1) 게임 로직 ------------------------------------------------------
tapBtn.addEventListener("click", () => {
  if (!playing) {
    startGame();   // 첫 클릭 = 게임 시작
  } else {
    score += 1;    // 게임 중 클릭 = 점수 +1
    countEl.textContent = score;
  }
});

function startGame() {
  playing = true;
  score = 0;
  countEl.textContent = "0";
  saveArea.hidden = true;
  statusEl.hidden = true;
  tapBtn.textContent = "마구 누르세요!";

  let remain = GAME_SECONDS;
  timeEl.textContent = remain.toFixed(1);

  // 0.1초마다 시간을 줄이고, 0이 되면 게임 종료
  timerId = setInterval(() => {
    remain -= 0.1;
    if (remain <= 0) {
      remain = 0;
      endGame();
    }
    timeEl.textContent = remain.toFixed(1);
  }, 100);
}

function endGame() {
  clearInterval(timerId);
  playing = false;
  tapBtn.textContent = "다시 시작";
  // 점수 저장 영역 열기
  finalEl.textContent = score;
  saveArea.hidden = false;
}


// --- 2) 점수 저장(insert) ----------------------------------------------
saveForm.addEventListener("submit", async (e) => {
  e.preventDefault();                       // 폼 제출로 새로고침되는 것 막기
  const player = nameEl.value.trim();
  if (!player) return;

  showStatus("저장 중…", "info");

  // scores 표에 '닉네임 + 점수' 한 줄 넣기
  const { error } = await db
    .from("scores")
    .insert({ player: player, score: score });

  if (error) {
    showStatus("저장 실패: " + error.message, "fail");
    return;
  }

  showStatus(player + "님, " + score + "점 저장 완료! 🎉", "ok");
  nameEl.value = "";
  saveArea.hidden = true;
  loadBoard();    // 저장했으니 순위표를 새로 그림
});


// --- 3) 리더보드 불러오기(정렬 조회) -----------------------------------
async function loadBoard() {
  // ★ 이번 실습의 핵심: '정렬 조회'
  //   order("score", { ascending: false }) = 점수 높은 순(desc)으로 정렬
  //   limit(TOP_N)                          = 위에서 10명만 가져오기
  const { data, error } = await db
    .from("scores")
    .select("player, score")
    .order("score", { ascending: false })
    .limit(TOP_N);

  if (error) {
    boardEl.innerHTML = "";
    showStatus("순위 불러오기 실패: " + error.message, "fail");
    return;
  }

  if (!data || data.length === 0) {
    boardEl.innerHTML = "<li>아직 점수가 없어요. 첫 기록의 주인공이 되어 보세요!</li>";
    return;
  }

  // 화면 다시 그리기
  boardEl.innerHTML = "";
  data.forEach((row, i) => {
    const li = document.createElement("li");
    li.innerHTML =
      '<span class="rank">' + (i + 1) + '</span>' +
      '<span class="who"></span>' +
      '<span class="pts"></span>';
    // textContent로 넣어 이름에 이상한 글자가 들어가도 안전하게 표시
    li.querySelector(".who").textContent = row.player;
    li.querySelector(".pts").textContent = row.score + "점";
    boardEl.appendChild(li);
  });
}


// --- 페이지가 열리면 곧바로 순위표부터 보여 주기 -----------------------
loadBoard();
