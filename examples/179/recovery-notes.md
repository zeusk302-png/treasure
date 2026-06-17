# 복구 절차 메모 (Rollback Runbook)

> 이 파일이 이번 실습의 두 번째 결과물입니다. 장애가 났을 때 **당황하지 않고 그대로 따라 읽으면 되는 절차서**입니다.
> 실제 사고가 났을 때를 대비해, 본인 프로젝트 값으로 아래 빈칸을 미리 채워 저장해 두세요.

## 한 줄 원칙

> **사이트부터 살리고(롤백), 원인은 그다음에 고친다.** 장애 중에 코드를 급하게 고쳐 다시 배포하면 더 깨지기 쉽습니다. 먼저 직전 정상 버전으로 되돌려 손님 화면을 정상화한 뒤, 여유 있게 원인을 고쳐 다시 배포합니다.

## 내 프로젝트 정보 (미리 채워두기)

- 프로젝트 이름: `<your-project-name>`
- Production 주소: `https://<your-project-name>.vercel.app`
- Vercel Deployments 페이지: `https://vercel.com/<your-team>/<your-project-name>/deployments`
- 연결된 GitHub 저장소: `https://github.com/<your-id>/<your-repo>`

## 장애 발생 시 즉시 실행 (Instant Rollback)

1. **증상 확인**: Production 주소를 열어 화면이 깨졌는지 확인한다. (흰 화면 / 에러 / 멈춤)
2. **Vercel Deployments 페이지**로 들어간다. 맨 위가 방금 올린(깨진) 배포다.
3. **직전의 멀쩡했던 배포**를 찾는다 — 상태가 `Ready`이고, 그 시점엔 사이트가 정상이었던 버전.
4. 그 배포 줄 오른쪽 **`⋯`(더보기) → `Instant Rollback`(또는 `Promote to Production`)** 을 누른다.
5. 확인 창에서 승인하면, **재빌드 없이** 그 배포가 즉시 다시 라이브가 된다. (수 초)
6. **Production 주소를 새로고침**(Ctrl+Shift+R)해 정상 화면이 돌아왔는지 확인한다.
7. (선택) CLI를 쓴다면 동일 동작: `vercel rollback`(직전으로) 또는 `vercel rollback <배포URL>`(특정 버전으로).

## 정상화 이후 (원인 고치기)

8. 깨진 원인을 코드에서 찾는다. (이번 예시의 원인: `getElementById`를 `getElementByID`로 잘못 적은 오타)
9. 로컬에서 고친 뒤, **바로 main에 올리지 말고** 새 브랜치 → Preview에서 확인 → PR 검토 후 Merge(실습 176·177)로 안전하게 다시 배포한다.
10. 새 정상 배포가 라이브가 되면 마무리.

## 사고 기록 (이번 실습 예시 — 본인 사고로 바꿔 적기)

| 항목 | 내용 |
| --- | --- |
| 발생 시각 | 2026-06-18 14:30 (예시) |
| 증상 | 신청 페이지가 흰 화면, 콘솔에 `TypeError: document.getElementByID is not a function` |
| 깨진 배포 | v4 (commit `f00dbad`, "환영 문구 수정") |
| 원인 | 오타: `getElementById` → `getElementByID` (대소문자) |
| 복구 방법 | Vercel Instant Rollback으로 직전 정상 배포 v3(commit `a1b2c3d`)로 되돌림 |
| 복구 소요 | 약 1분 (코드 수정 없이 클릭만) |
| 재발 방지 | 다음부터 main 직접 배포 금지, Preview/PR 검토 후 Merge |

## 헷갈리기 쉬운 점 (메모)

- **롤백은 코드를 되돌리지 않는다.** GitHub의 코드는 그대로(여전히 오타 있음)이고, "라이브로 보여줄 배포"만 과거 것으로 바꾼 것이다. 그래서 원인은 따로 고쳐 다시 배포해야 한다. (안 그러면 다음 배포 때 또 깨진다.)
- **빌드 성공 ≠ 정상 작동.** 이번 오타처럼 빌드는 통과해도 실행 중 깨질 수 있다. 그래서 `Ready` 배포라도 롤백이 필요한 상황이 생긴다.
- **비밀값 주의.** 롤백은 코드 배포 버전만 되돌린다. 환경변수(Supabase 키 등)는 보통 별도로 관리되므로, 비밀값(`service_role`)이 깨진 배포에 들어 있었는지는 별개로 점검한다. 비밀값은 코드/diff에 두지 않고 Vercel 환경변수에만 둔다(견본은 `.env.example`의 자리표시자).
