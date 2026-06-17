# AGENTS.md — AI 에이전트 작업 가이드 (샘플)

> `AGENTS.md`는 특정 도구에 묶이지 않는 '에이전트 공통 지침' 표준입니다.
> OpenAI Codex 등 여러 AI 코딩 에이전트가 프로젝트 루트의 이 파일을 읽습니다.
> Claude Code는 `CLAUDE.md`를 읽습니다 — 내용이 같다면 CLAUDE.md에 "AGENTS.md를 따르라"고 한 줄 적어 한 곳만 관리해도 됩니다.

## 프로젝트
- 무엇: (한 줄 설명)
- 스택: (예) Next.js + Supabase + GitHub Pages

## 개발 환경
- 설치: `npm install`
- 개발 서버: `npm run dev`
- 빌드: `npm run build`
- (있다면) 린트: `npm run lint`

## 코드 스타일
- 한국어 주석. 의미가 드러나는 이름.
- 포매터/린터 규칙을 따른다. 커밋 전 린트를 통과시킨다.
- 한 함수는 한 가지 일. 중복·거대 함수 금지.

## 커밋·PR 규칙
- Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:` ...).
- main 브랜치에 직접 푸시 금지 → 브랜치 생성 후 PR.
- PR 제목은 변경 요약, 본문에 '무엇을 / 왜 / 어떻게 검증했는지'.

## 보안
- 비밀키는 `.env`에 두고 커밋하지 않는다. 프론트엔드에는 공개 키만.
- Supabase 테이블에는 RLS를 켠다.
- 빌드 산출물에 비밀키가 들어갔는지 확인한다.

## 하지 말 것
- 비밀키 하드코딩
- 무관한 대규모 리팩터링을 한 PR에 섞기
- 테스트·빌드를 깨뜨린 채 커밋
