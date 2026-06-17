---
name: deploy
description: 변경사항을 커밋하고 GitHub에 푸시해 사이트를 배포할 때 사용. "배포해줘", "올려줘" 요청 시 호출.
---

# 배포 (deploy)

다음 순서로 진행하고, 각 단계 결과를 사용자에게 한국어로 보고한다.

1. `git status`로 변경 파일을 확인하고 무엇이 바뀌었는지 요약 보고.
2. 빌드가 깨지지 않는지 먼저 확인: `npm run build`. 실패하면 **멈추고** 원인을 쉽게 설명한다.
3. **푸시 전 비밀키 점검**: `.env`, `sb_secret_`, API 키가 커밋에 포함되지 않았는지 확인.
4. 변경을 의미 단위로 커밋. 메시지는 Conventional Commits 규칙(`feat:`, `fix:`, `docs:` 등).
5. `git push`로 원격에 올린다. (main에 바로 올리기 전, 큰 변경은 별도 브랜치를 제안)
6. 배포 트리거(GitHub Actions/Pages 또는 Vercel)가 시작됐는지 확인하고 **배포 URL**을 알려준다.
