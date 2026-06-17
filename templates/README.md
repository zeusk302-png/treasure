# templates — 재사용 샘플 모음

이 가이드 독자가 자기 프로젝트에 **그대로 복사해 쓰는** 본보기 파일들입니다.
각 파일은 이 교보재가 가르치는 규칙(anon/RLS 보안, Conventional Commits, 검증 습관)을 직접 담고 있습니다.

| 파일 | 무엇 | 어디에 두나 |
|---|---|---|
| `CLAUDE.md` | Claude Code가 매 대화마다 읽는 프로젝트 작업 매뉴얼 | 프로젝트 루트 `CLAUDE.md` |
| `AGENTS.md` | 도구 공통(OpenAI Codex 등) 에이전트 지침 표준 | 프로젝트 루트 `AGENTS.md` |
| `skills/deploy/SKILL.md` | `/deploy` — 커밋·푸시·배포 자동화 | `.claude/skills/deploy/SKILL.md` |
| `skills/seo-check/SKILL.md` | `/seo-check` — 검색노출(구글·네이버) 점검 | `.claude/skills/seo-check/SKILL.md` |
| `skills/qa-check/SKILL.md` | `/qa-check` — 배포 전 마무리 점검 | `.claude/skills/qa-check/SKILL.md` |

> Claude 스킬은 `.claude/skills/<이름>/SKILL.md` 형식이며, 파일 맨 위 frontmatter의 `name`·`description`으로 언제 쓸 스킬인지 Claude가 판단합니다.
