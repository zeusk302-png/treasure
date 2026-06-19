// ──────────────────────────────────────────────────────────────
// 이 파일은 무엇인가:
//   아주 단순한 '빌드' 흉내 스크립트입니다. src 의 코드를 한 번 불러와
//   문제없이 실행되는지 확인하고, dist/ 폴더에 결과물을 만들어 둡니다.
// 왜 있는가:
//   진짜 프로젝트의 'npm run build'(번들링/컴파일)를 대신해, CI 마지막 단계에서
//   "빌드 자체가 깨지지 않는지"를 보여 주려는 최소 예시입니다.
//   실제 프로젝트라면 이 자리에 vite/next build 같은 진짜 빌드 명령이 들어갑니다.
// ──────────────────────────────────────────────────────────────

import { mkdir, writeFile } from "node:fs/promises"; // 폴더 생성/파일 쓰기 (Node 기본 제공)
import { add, slugify } from "../src/math.js"; // 빌드 중 코드가 실제로 동작하는지 한 번 호출해 봄

// import 자체가 실패하거나(문법 오류 등) 함수 호출이 터지면, 이 스크립트가 0이 아닌 종료코드로
// 끝나고 → CI의 '빌드' 단계가 실패로 표시됩니다. 그래서 빌드도 하나의 검사가 됩니다.
const result = {
  builtAt: new Date().toISOString(),
  sample: { sum: add(2, 3), slug: slugify("Hello CI World") },
};

await mkdir("dist", { recursive: true }); // dist 폴더가 없으면 만들고, 있으면 그냥 통과(recursive)
await writeFile("dist/output.json", JSON.stringify(result, null, 2)); // 빌드 산출물 기록

console.log("빌드 완료 → dist/output.json"); // 로그로 성공을 알려, Actions 화면에서 눈으로 확인 가능
