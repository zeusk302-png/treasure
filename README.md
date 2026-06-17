# 여러분을 위한 웹개발 가이드 (treasure)

비전공자를 위한 상용 웹개발 길라잡이 — 바이브코딩 부트캠프 **그다음** 단계 가이드.
MkDocs Material로 만든 정적 문서 사이트이며, GitHub Pages로 배포됩니다. 콘텐츠는 전부 한국어, 코드는 전체 공개됩니다.

## 로컬에서 보기

```bash
pip install -r requirements.txt
mkdocs serve
# 브라우저에서 http://127.0.0.1:8000 접속
```

## 배포

`main` 브랜치에 push하면 GitHub Actions가 자동으로 빌드해 GitHub Pages에 배포합니다.
(수동 배포: `mkdocs gh-deploy`)

## 폴더 구조

- `docs/` — 문서 페이지(마크다운), 영역별 폴더
- `examples/` — 참고용 백엔드 예제 코드(방명록·댓글 등, Supabase)
- `templates/` — 복사해 쓰는 샘플(CLAUDE.md, AGENTS.md, Claude 스킬)
