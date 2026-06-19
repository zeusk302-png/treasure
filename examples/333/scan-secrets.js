/*
  이 파일은 무엇인가:
  "혹시 비밀값(키)을 실수로 깃에 올렸거나 코드에 박아 두지 않았나?"를 자동으로 찾아 주는
  점검 스크립트(Node 버전)입니다. 윈도우·맥·리눅스 어디서나 돌아갑니다.
  왜 있는가:
  사람이 매번 눈으로 확인하면 반드시 빠뜨립니다. 커밋 전(또는 CI에서) 이 스크립트를 돌려
  ① .env 류 파일이 깃에 추적되고 있는지 ② 코드에 진짜 키 패턴이 박혔는지를 기계적으로 잡습니다.
  문제가 있으면 빨간 경고 + 종료 코드 1 로 끝나, CI 가 빌드를 막을 수 있습니다.
  실행: node scan-secrets.js
*/

const { execSync } = require("child_process"); // git 명령을 호출하기 위해
const fs = require("fs"); // 파일 읽기
const path = require("path"); // 경로 다루기

// 터미널 색상 코드. 무엇: 경고를 빨갛게/통과를 초록으로 보이게.
// 왜: 비전공자가 결과를 한눈에 구분하도록(빨강=문제, 초록=정상).
const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

let problems = 0; // 발견한 문제 수. 0보다 크면 마지막에 실패(종료 코드 1)로 끝낸다.

/*
  검사 1: .env 류 파일이 깃에 '추적'되고 있는가.
  무엇: git 이 관리 중인 파일 목록(git ls-files)에서 .env / .env.local 등을 찾는다.
  왜: .gitignore 에 적어도, 과거에 한 번 add 된 파일은 계속 추적된다(흔한 함정).
      추적 중이면 그 파일은 깃에 올라가고 있다는 뜻이라 즉시 막아야 한다.
  주의: .env.example 은 '견본(자리표시자만)'이라 추적돼도 정상 → 탐지에서 제외한다.
*/
function checkEnvTracked() {
  let tracked = "";
  try {
    // git 이 추적하는 모든 파일 목록을 가져온다.
    tracked = execSync("git ls-files", { encoding: "utf8" });
  } catch (e) {
    // 깃 저장소가 아니면 이 검사만 건너뛴다(검사 2는 계속 진행).
    console.log(`${YELLOW}(안내) 여기는 git 저장소가 아니라 .env 추적 검사는 건너뜁니다.${RESET}`);
    return;
  }

  // 추적 목록을 줄 단위로 보며 .env 류만 거르고, .env.example 은 허용한다.
  const bad = tracked
    .split("\n")
    .map((s) => s.trim())
    .filter((f) => {
      if (!f) return false;
      const base = path.basename(f); // 경로 끝 파일명만
      if (base === ".env.example") return false; // 견본은 정상이라 통과
      // .env, .env.local, .env.production 등 'env'로 시작하는 비밀 파일을 잡는다.
      return base === ".env" || base.startsWith(".env.");
    });

  if (bad.length > 0) {
    problems++;
    console.log(`${RED}[위험] .env 류 파일이 깃에 추적되고 있습니다:${RESET}`);
    bad.forEach((f) => console.log(`   - ${f}`));
    console.log(
      `   해결: 추적만 풀려면  git rm --cached ${bad[0]}  후 커밋. ` +
        `이미 커밋 히스토리에 키가 올라갔다면 그 키를 '폐기·재발급(회전)' 하세요.\n`
    );
  } else {
    console.log(`${GREEN}[통과] .env 류 비밀 파일이 깃에 추적되고 있지 않습니다.${RESET}`);
  }
}

/*
  검사 2: 코드 파일에 '진짜 키처럼 보이는 문자열'이 박혀 있는가.
  무엇: 잘 알려진 비밀 키 패턴들을 정규식으로 만들어, 소스 파일을 훑는다.
  왜: 키를 코드에 직접 적는 실수가 가장 흔하고 가장 위험하다. 패턴으로 미리 잡아 준다.
*/
const SECRET_PATTERNS = [
  // Anthropic(Claude) API 키: sk-ant-... 로 시작.
  { name: "Claude(Anthropic) API 키", re: /sk-ant-[A-Za-z0-9_\-]{8,}/ },
  // Stripe 라이브/테스트 시크릿 키: sk_live_ / sk_test_ + 긴 영숫자.
  { name: "Stripe 시크릿 키", re: /sk_(live|test)_[A-Za-z0-9]{10,}/ },
  // OpenAI 류 키: sk- + 긴 영숫자 (sk-ant 는 위에서 별도 처리하므로 ant 제외).
  { name: "OpenAI 류 API 키", re: /sk-(?!ant-)[A-Za-z0-9]{20,}/ },
  // AWS 액세스 키 ID: AKIA + 16자 대문자/숫자.
  { name: "AWS 액세스 키", re: /AKIA[0-9A-Z]{16}/ },
  // GitHub 개인 액세스 토큰: ghp_ + 36자.
  { name: "GitHub 토큰", re: /ghp_[A-Za-z0-9]{36}/ },
  // Slack 토큰: xox + 종류 + 긴 토큰.
  { name: "Slack 토큰", re: /xox[abprs]-[A-Za-z0-9-]{10,}/ },
];

// 자리표시자/설명용 예시는 진짜 키가 아니므로 오탐으로 처리한다.
// 왜: .env.example 의 REPLACE_ME, 문서·주석 속 'sk-ant-...' 같은 잘린 예시(...)는 경고하면 안 된다.
//     '...'(말줄임)이 들어간 줄은 설명용 예시로 간주해 건너뛴다.
const ALLOWLIST = /REPLACE_ME|PLACEHOLDER|EXAMPLE|YOUR[_-]|xxxx|0000|aaaa|\.\.\./i;

// 검사할 파일 확장자(코드/설정 위주). 왜: 이미지·바이너리까지 훑을 필요는 없다.
const SCAN_EXT = new Set([".js", ".ts", ".jsx", ".tsx", ".json", ".html", ".css", ".env.example", ".sh", ".yml", ".yaml", ".md"]);
// 검사에서 건너뛸 폴더. 왜: 남이 만든 코드(node_modules)·깃 내부는 점검 대상이 아니다.
const SKIP_DIRS = new Set(["node_modules", ".git", ".vercel", "dist", "build"]);

// 현재 폴더부터 하위 폴더까지 검사 대상 파일을 모은다(재귀 탐색).
function collectFiles(dir, acc = []) {
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    if (entry.isDirectory()) {
      if (SKIP_DIRS.has(entry.name)) continue; // 건너뛸 폴더는 통째로 제외
      collectFiles(path.join(dir, entry.name), acc);
    } else {
      const ext = path.extname(entry.name);
      // 확장자가 검사 대상이거나, .env.example 같은 특수 이름이면 포함.
      if (SCAN_EXT.has(ext) || entry.name === ".env.example") acc.push(path.join(dir, entry.name));
    }
  }
  return acc;
}

function checkHardcodedSecrets() {
  const files = collectFiles(process.cwd());
  let found = 0;

  for (const file of files) {
    const lines = fs.readFileSync(file, "utf8").split("\n");
    lines.forEach((line, i) => {
      // 자리표시자가 들어간 줄은 오탐이니 건너뛴다.
      if (ALLOWLIST.test(line)) return;
      for (const { name, re } of SECRET_PATTERNS) {
        if (re.test(line)) {
          found++;
          // 줄 전체를 그대로 찍으면 또 유출이므로, 어디에 무엇이 있는지만 알려 준다.
          console.log(`${RED}[위험] ${name} 패턴이 박혀 있는 듯합니다:${RESET}`);
          console.log(`   - ${path.relative(process.cwd(), file)}:${i + 1} 줄`);
        }
      }
    });
  }

  if (found > 0) {
    problems++;
    console.log(
      `   해결: 그 값을 코드에서 지우고 process.env.X 로 바꾼 뒤 .env 에만 적으세요. ` +
        `이미 커밋됐다면 그 키를 발급사에서 '폐기·재발급(회전)' 하세요.\n`
    );
  } else {
    console.log(`${GREEN}[통과] 코드에 박힌 진짜 키 패턴이 발견되지 않았습니다.${RESET}`);
  }
}

// ── 실행 ──────────────────────────────────────────────
console.log("시크릿 점검 시작 (.env 추적 + 코드에 박힌 키)\n");
checkEnvTracked();
checkHardcodedSecrets();

// 문제가 하나라도 있으면 종료 코드 1 로 끝낸다.
// 왜: CI(예: GitHub Actions)는 종료 코드 1을 '실패'로 보고 빌드를 막는다 → 키 박힌 커밋이 합쳐지지 않는다.
if (problems > 0) {
  console.log(`\n${RED}점검 실패: 문제 ${problems}건. 위 안내대로 고친 뒤 다시 커밋하세요.${RESET}`);
  process.exit(1);
} else {
  console.log(`\n${GREEN}점검 통과: 비밀값 노출 위험이 발견되지 않았습니다.${RESET}`);
  process.exit(0);
}
