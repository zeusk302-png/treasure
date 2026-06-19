/*
  이 파일은 무엇인가:
    RAG 챗봇의 서버입니다. 브라우저에서 질문이 오면
    "질문 임베딩 → pgvector로 가까운 조각 검색 → 그 조각 + 질문을 Claude에게 → 답변"
    을 수행하고 결과를 돌려줍니다. 채팅 화면(public/index.html)도 여기서 서빙합니다.
  왜 있는가:
    임베딩·DB 검색·Claude 호출은 모두 "비밀 키"가 필요한 일이라 반드시 서버에서 해야 합니다.
    (브라우저에 키를 두면 F12로 훔쳐 갑니다.) 그래서 이 한 서버가 모든 비밀 작업을 대신합니다.
*/

require("dotenv").config(); // .env의 비밀값을 process.env로 로드 (맨 위에서)

const express = require("express");
const path = require("path");
const { createClient } = require("@supabase/supabase-js");
const OpenAI = require("openai");
const Anthropic = require("@anthropic-ai/sdk");

const app = express();

// 들어오는 JSON 본문을 자동으로 파싱(req.body로 읽기 위함).
app.use(express.json());

// public/ 폴더의 정적 파일(index.html 등)을 그대로 제공.
app.use(express.static(path.join(__dirname, "public")));

// --- 비밀 키들은 전부 .env에서 읽습니다 (코드/깃/브라우저에 노출 금지) ---
// service_role = DB 마스터 키, ANTHROPIC/OPENAI 키 = 내 요금이 나가는 키. 서버에서만 사용.
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
// Anthropic 클라이언트는 인자를 안 주면 환경변수 ANTHROPIC_API_KEY를 자동으로 읽습니다.
const anthropic = new Anthropic();

// 임베딩 모델: 질문도 문서와 "같은 모델·같은 차원(1536)"으로 임베딩해야 비교가 됩니다.
const EMBEDDING_MODEL = "text-embedding-3-small";
// 답변 생성 모델: Claude 최신 모델. (모델 ID는 정확히 이 문자열을 씁니다.)
const CHAT_MODEL = "claude-opus-4-8";

// 유사도가 이 값보다 낮은 조각은 "관련 없음"으로 봅니다.
// 왜: 질문과 동떨어진 조각까지 Claude에게 주면 오히려 헷갈려 환각이 늘기 때문.
const MIN_SIMILARITY = 0.3;

/*
  채팅 API. 브라우저가 { question: "..." } 를 POST로 보냅니다.
  단계: 질문 임베딩 → match_chunks로 검색 → 컨텍스트 구성 → Claude 호출 → 답변 + 근거 반환.
*/
app.post("/api/chat", async (req, res) => {
  try {
    const question = (req.body.question || "").trim();
    if (!question) {
      return res.status(400).json({ error: "질문이 비어 있습니다." });
    }

    // 1) 질문을 임베딩(숫자 벡터)으로.
    const embRes = await openai.embeddings.create({
      model: EMBEDDING_MODEL,
      input: question,
    });
    const queryEmbedding = embRes.data[0].embedding;

    // 2) pgvector 검색: schema.sql에서 만든 match_chunks 함수를 호출.
    //    rpc = Remote Procedure Call. SQL 함수를 코드에서 한 줄로 부르는 방법.
    const { data: matches, error: searchError } = await supabase.rpc(
      "match_chunks",
      { query_embedding: queryEmbedding, match_count: 5 }
    );
    if (searchError) throw searchError;

    // 유사도가 너무 낮은 조각은 버립니다(관련 없는 것 제거 → 환각 방지).
    const relevant = (matches || []).filter(
      (m) => m.similarity >= MIN_SIMILARITY
    );

    // 관련 자료가 하나도 없으면, Claude를 부르지 않고 정직하게 모른다고 답합니다.
    // 왜: 근거가 없는데 LLM에게 답을 시키면 지어낼(환각) 위험이 큽니다.
    if (relevant.length === 0) {
      return res.json({
        answer: "제공된 자료에는 그 질문에 대한 내용이 없습니다.",
        sources: [],
      });
    }

    // 3) 검색된 조각들을 하나의 "자료" 텍스트로 묶습니다(컨텍스트 구성).
    const context = relevant
      .map((m, i) => `[자료 ${i + 1} | 출처: ${m.source}]\n${m.content}`)
      .join("\n\n");

    // 4) Claude에게 "이 자료 안에서만 답하라"는 규칙(system)과 함께 질문을 보냅니다.
    //    이 system 프롬프트가 환각을 줄이는 핵심입니다: 자료 밖 추측을 금지합니다.
    const system =
      "너는 사내 문서 도우미다. 반드시 아래 <자료> 안에 있는 내용만 근거로 답하라. " +
      "자료에 없는 내용은 추측하지 말고 '제공된 자료에는 없습니다'라고 답하라. " +
      "답은 한국어로, 간결하고 친절하게.";

    const message = await anthropic.messages.create({
      model: CHAT_MODEL,
      max_tokens: 1024,
      // 적응형 사고: 복잡한 질문이면 Claude가 알아서 더 깊이 생각합니다(권장 설정).
      thinking: { type: "adaptive" },
      system,
      messages: [
        {
          role: "user",
          content: `<자료>\n${context}\n</자료>\n\n질문: ${question}`,
        },
      ],
    });

    // 응답은 여러 블록(생각/텍스트)로 올 수 있으니, 텍스트 블록만 골라 합칩니다.
    // 왜 type === "text"만: thinking 블록은 사용자에게 보여줄 최종 답이 아니기 때문.
    const answer = message.content
      .filter((b) => b.type === "text")
      .map((b) => b.text)
      .join("")
      .trim();

    // 답변과 함께 "근거"(어느 조각에서 나왔는지)도 돌려줍니다 → 사용자가 신뢰·검증 가능.
    res.json({
      answer,
      sources: relevant.map((m) => ({
        source: m.source,
        similarity: Number(m.similarity.toFixed(3)),
        snippet: m.content.slice(0, 160),
      })),
    });
  } catch (err) {
    // 에러 메시지는 서버 로그에만 자세히, 브라우저엔 짧게(키 등 내부정보 노출 방지).
    console.error("/api/chat 오류:", err);
    res.status(500).json({ error: "답변 생성 중 오류가 발생했습니다." });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`RAG 챗봇 서버 실행 중: http://localhost:${PORT}`);
});
