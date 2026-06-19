/*
  이 파일은 무엇인가:
    docs/ 폴더의 문서(.md/.txt)를 읽어, 조각(청크)으로 나누고,
    각 조각을 임베딩(숫자 벡터)으로 바꿔 Supabase의 documents 테이블에 저장하는
    "1회성" 스크립트입니다. ( npm run ingest 로 실행 )
  왜 있는가:
    RAG는 "미리 내 문서를 벡터로 저장해 두는 준비 단계"가 필요합니다.
    이 준비를 해 둬야 나중에 질문이 들어왔을 때 "가까운 조각"을 찾을 수 있습니다.
*/

// .env 파일의 값을 process.env로 불러옵니다.
// 왜 맨 위에서: 아래 코드가 process.env.* 를 읽기 전에 값이 채워져 있어야 하므로.
require("dotenv").config();

const fs = require("fs");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const OpenAI = require("openai");

// --- 비밀값은 코드가 아니라 .env에서 읽습니다 (노출 방지) ---
// SERVICE_ROLE 키는 DB를 통째로 읽고 쓰는 "마스터 키"라 절대 브라우저로 나가면 안 됩니다.
// 이 스크립트는 서버(내 컴퓨터)에서만 도니까 여기서 쓰는 건 안전합니다.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// 임베딩(글→벡터) 전용 클라이언트. 키 역시 .env에서.
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// 임베딩 모델 이름을 한 곳에 둡니다.
// 주의: 이 모델의 출력 차원(1536)은 schema.sql의 vector(1536)과 "반드시" 같아야 합니다.
const EMBEDDING_MODEL = "text-embedding-3-small";

/*
  문서를 조각(청크)으로 나누는 함수.
  왜 나누나: 문서 전체를 통째로 임베딩하면 "어느 부분이 질문과 관련 있는지"가 흐려집니다.
  문단 단위로 쪼개야 질문에 딱 맞는 조각만 골라 Claude에게 줄 수 있어 환각이 줄고 비용도 아낍니다.
  여기서는 "빈 줄 2개(문단 구분)"로 나누고, 너무 짧은 조각은 버립니다.
*/
function splitIntoChunks(text) {
  return text
    .split(/\n\s*\n/) // 빈 줄을 기준으로 문단 분리
    .map((s) => s.trim()) // 앞뒤 공백 제거
    .filter((s) => s.length > 30); // 너무 짧은(의미 없는) 조각은 제외
}

async function main() {
  const docsDir = path.join(__dirname, "docs");

  // docs/ 폴더의 .md / .txt 파일만 골라 읽습니다.
  const files = fs
    .readdirSync(docsDir)
    .filter((f) => f.endsWith(".md") || f.endsWith(".txt"));

  if (files.length === 0) {
    console.log("docs/ 폴더에 .md 또는 .txt 문서가 없습니다. 문서를 넣고 다시 실행하세요.");
    return;
  }

  // 다시 넣을 때 중복이 쌓이지 않도록, 기존 데이터를 먼저 비웁니다.
  // 왜: 이 스크립트를 여러 번 돌려도 결과가 깔끔하게 "현재 docs/ 내용"과 일치하도록.
  // (neq 0 = 모든 행 삭제. id는 항상 0보다 크므로 전체가 지워집니다.)
  await supabase.from("documents").delete().neq("id", 0);

  let totalSaved = 0;

  for (const file of files) {
    const fullPath = path.join(docsDir, file);
    const text = fs.readFileSync(fullPath, "utf-8");
    const chunks = splitIntoChunks(text);

    for (const chunk of chunks) {
      // 1) 조각을 임베딩(숫자 벡터)으로 변환.
      const res = await openai.embeddings.create({
        model: EMBEDDING_MODEL,
        input: chunk,
      });
      const embedding = res.data[0].embedding; // 길이 1536짜리 숫자 배열

      // 2) 본문 + 출처(파일명) + 벡터를 DB에 저장.
      //    출처를 함께 저장하는 이유: 나중에 답변에 "이 조각에서 나온 답"이라고 근거를 보여주려고.
      const { error } = await supabase.from("documents").insert({
        source: file,
        content: chunk,
        embedding,
      });

      if (error) {
        console.error("저장 실패:", error.message);
      } else {
        totalSaved++;
      }
    }
    console.log(`- ${file}: ${chunks.length}개 조각 처리`);
  }

  console.log(`\n총 ${totalSaved}개 조각 저장 완료. 이제 npm start 로 챗봇을 켜세요.`);
}

// 스크립트 실행. 오류가 나면 메시지를 보여주고 종료 코드를 1로(=실패) 둡니다.
main().catch((err) => {
  console.error("ingest 중 오류:", err.message);
  process.exit(1);
});
