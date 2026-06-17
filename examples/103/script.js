// ===== 화면 요소 잡아두기 =====
const dropZone = document.getElementById("dropZone");   // 점선 드롭 영역
const fileInput = document.getElementById("fileInput"); // 숨겨둔 진짜 파일 입력칸
const fileList = document.getElementById("fileList");    // 첨부 파일이 쌓이는 목록
const emptyMsg = document.getElementById("emptyMsg");    // "아직 없음" 안내문

// 고른 파일을 여기에 모아둔다. (삭제도 이 배열에서 빼면 된다)
let files = [];

// ===== 1) 드롭존을 클릭하면 숨겨둔 파일 선택창 열기 =====
dropZone.addEventListener("click", () => {
  fileInput.click(); // 코드로 input 을 눌러 준다 = 파일 선택창이 뜸
});

// 키보드(Enter / Space)로도 열 수 있게 (접근성)
dropZone.addEventListener("keydown", (e) => {
  if (e.key === "Enter" || e.key === " ") {
    e.preventDefault();
    fileInput.click();
  }
});

// ===== 2) 파일 선택창에서 파일을 고르면 =====
fileInput.addEventListener("change", () => {
  addFiles(fileInput.files); // 고른 파일들을 처리
  fileInput.value = "";      // 같은 파일을 다시 골라도 인식되게 입력칸 비우기
});

// ===== 3) 드래그앤드롭 =====
// 브라우저는 파일을 페이지 위로 끌어다 놓으면 "그 파일을 그냥 열어버리는" 기본 동작이 있다.
// dragover / drop 에서 preventDefault() 를 해 줘야 그 기본 동작을 막고 우리가 직접 처리할 수 있다.

dropZone.addEventListener("dragover", (e) => {
  e.preventDefault();                    // 기본 "파일 열기" 막기 (필수!)
  dropZone.classList.add("dragover");    // 테두리 파랗게 강조
});

dropZone.addEventListener("dragleave", () => {
  dropZone.classList.remove("dragover"); // 영역 밖으로 나가면 강조 해제
});

dropZone.addEventListener("drop", (e) => {
  e.preventDefault();                    // 기본 "파일 열기" 막기 (필수!)
  dropZone.classList.remove("dragover");
  // 끌어다 놓은 파일들은 e.dataTransfer.files 에 들어 있다
  addFiles(e.dataTransfer.files);
});

// ===== 파일들을 배열에 추가하고 화면을 다시 그리기 =====
function addFiles(fileObjects) {
  // fileObjects 는 배열처럼 생겼지만 진짜 배열은 아니라서 ...로 펼쳐서 합친다
  for (const file of fileObjects) {
    files.push(file);
  }
  render();
}

// ===== 파일 1개 삭제 =====
function removeFile(index) {
  files.splice(index, 1); // 배열에서 그 자리 1개 빼기
  render();
}

// ===== 목록을 화면에 다시 그리기 =====
function render() {
  fileList.innerHTML = ""; // 기존 목록 비우고 처음부터 다시 그림

  // 첨부가 하나도 없으면 안내문 보이고 끝
  if (files.length === 0) {
    emptyMsg.hidden = false;
    return;
  }
  emptyMsg.hidden = true;

  files.forEach((file, index) => {
    const li = document.createElement("li");
    li.className = "file-item";

    // --- 썸네일 / 아이콘 자리 ---
    if (file.type.startsWith("image/")) {
      // 이미지 파일이면 FileReader 로 읽어 미리보기 만들기
      const img = document.createElement("img");
      img.className = "thumb";
      img.alt = file.name;

      const reader = new FileReader();
      reader.onload = (e) => {
        // 다 읽으면 결과(데이터 URL)를 img 의 src 로 넣는다
        img.src = e.target.result;
      };
      reader.readAsDataURL(file); // 파일을 화면에 띄울 수 있는 형태로 읽기 시작

      li.appendChild(img);
    } else {
      // 이미지가 아니면 종류에 맞는 간단한 아이콘만 표시
      const icon = document.createElement("div");
      icon.className = "thumb";
      icon.textContent = pickIcon(file);
      li.appendChild(icon);
    }

    // --- 파일명 + 크기 ---
    const info = document.createElement("div");
    info.className = "file-info";
    info.innerHTML =
      '<span class="file-name"></span><span class="file-size"></span>';
    info.querySelector(".file-name").textContent = file.name;     // 안전하게 텍스트로
    info.querySelector(".file-size").textContent = formatSize(file.size);
    li.appendChild(info);

    // --- 삭제 버튼 ---
    const btn = document.createElement("button");
    btn.className = "remove-btn";
    btn.type = "button";
    btn.textContent = "✕";
    btn.setAttribute("aria-label", file.name + " 삭제");
    btn.addEventListener("click", () => removeFile(index));
    li.appendChild(btn);

    fileList.appendChild(li);
  });
}

// ===== 도우미: 파일 크기를 읽기 좋은 단위로 =====
function formatSize(bytes) {
  if (bytes < 1024) return bytes + " B";
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + " KB";
  return (bytes / (1024 * 1024)).toFixed(1) + " MB";
}

// ===== 도우미: 이미지가 아닌 파일의 아이콘 고르기 =====
function pickIcon(file) {
  const name = file.name.toLowerCase();
  if (file.type === "application/pdf" || name.endsWith(".pdf")) return "📕";
  if (file.type.startsWith("text/") || name.endsWith(".txt")) return "📄";
  if (name.endsWith(".zip")) return "🗜";
  return "📎";
}

// 처음 화면 상태 정리 (안내문 보이기)
render();
