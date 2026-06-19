// ──────────────────────────────────────────────────────────────
// 이 파일은 무엇인가:
//   src/math.js 의 함수들이 '기대대로' 동작하는지 자동으로 확인하는 테스트입니다.
//   Node.js에 기본 내장된 테스트 도구(node:test)와 검증 도구(node:assert)만 써서,
//   추가 설치 없이 'npm test'(= node --test) 로 바로 돌아갑니다.
// 왜 있는가:
//   CI의 핵심 안전망입니다. 누군가 math.js 를 잘못 고치면 이 테스트가 실패하고,
//   CI가 빨간불을 띄워 그 코드가 합쳐지는 걸 막습니다.
// 직접 해보기:
//   src/math.js 의 add 를 일부러 'a - b' 로 바꾸고 push 해 보세요.
//   GitHub Actions 탭에 빨간 X 가 뜨면, CI가 제대로 지키고 있다는 증거입니다.
// ──────────────────────────────────────────────────────────────

import { test } from "node:test"; // 'test()' 로 테스트 한 칸을 정의하는 도구(Node 기본 제공)
import assert from "node:assert/strict"; // 'strict' 는 ===(엄격 비교)로 검사 — 느슨한 비교의 함정을 피함
import { add, slugify } from "./math.js"; // 검사할 진짜 함수들을 가져옵니다

// add 함수가 두 수를 제대로 더하는지 확인합니다.
test("add: 두 양수를 더한다", () => {
  assert.equal(add(2, 3), 5); // 2+3 의 결과가 정확히 5가 아니면 이 테스트는 실패합니다
});

test("add: 음수도 처리한다", () => {
  assert.equal(add(-4, 1), -3);
});

// slugify 가 제목을 URL용 문자열로 잘 바꾸는지 확인합니다.
test("slugify: 공백을 하이픈으로 바꾼다", () => {
  assert.equal(slugify("Hello World"), "hello-world");
});

test("slugify: 특수문자를 제거하고 연속 하이픈을 정리한다", () => {
  assert.equal(slugify("  My!! First   Post  "), "my-first-post");
});
