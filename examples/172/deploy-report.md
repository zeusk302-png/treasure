# 배포 보고서 (deploy report)

이 파일은 두 부분입니다.
1. **예시** — AI가 프롬프트대로 수행했을 때 나오는 보고의 모습(샘플)
2. **내 보고서(빈칸)** — 실제 내가 한 커밋·배포 결과를 직접 채우는 칸

> 실제 비밀키·토큰은 적지 마세요. URL/해시 같은 공개해도 되는 값만 채웁니다.

---

## 1) 예시 — AI가 수행한 보고 (샘플)

### [1] 비밀키 점검 결과

| 파일 | 의심 구간 | 위험도 | 권장 조치 |
| --- | --- | --- | --- |
| `index.html` | 변경분에 비밀값 없음 | 안전 | 그대로 진행 |
| `app.js` | `<YOUR_SUPABASE_ANON_KEY>` 사용 | 안전(공개 키) | 그대로 진행 — anon은 노출돼도 됨 |
| (없음) | service_role / .env 노출 | 없음 | — |

→ **비밀키 점검 통과.** 변경분에 service_role(비밀) 키나 `.env`가 섞이지 않았습니다.

### [2] 커밋 메시지 (Conventional Commits)

```
feat(hero): 첫 화면 소개 문구를 '집밥 반찬 배송'으로 교체

방문자가 처음 보는 한 줄 소개를 더 구체적으로 바꿈.
구조·스타일 변경 없이 텍스트 한 줄만 수정.
```

### [4] 실행한 git 명령

```bash
git add index.html
git commit -m "feat(hero): 첫 화면 소개 문구를 '집밥 반찬 배송'으로 교체"
git push
```

### [5] 배포 보고

- 커밋 메시지: `feat(hero): 첫 화면 소개 문구를 '집밥 반찬 배송'으로 교체`
- 커밋 해시(짧은): `a1b2c3d`
- push 대상 브랜치: `main`
- Vercel Production URL: `<YOUR_PROJECT.vercel.app>`
- 배포 상태 확인 위치: Vercel → 프로젝트 → **Deployments** 맨 윗줄 (Ready / Building / Error)
- 만약 Error면: 그 배포 줄을 클릭 → **Build Logs**에서 빨간 에러 줄을 확인

---

## 2) 내 보고서 (직접 채우기)

### [1] 비밀키 점검 결과

| 파일 | 의심 구간 | 위험도 | 권장 조치 |
| --- | --- | --- | --- |
|  |  |  |  |

- 점검 결론: ( 통과 / 멈춤 ) — 

### [2] 내가 승인한 커밋 메시지

```
type(scope): 한 줄 요약(50자 이내, 한국어)

(선택) 무엇을 왜 바꿨는지 1~2줄
```

### [5] 내 배포 보고

- 커밋 메시지: 
- 커밋 해시(짧은): 
- push 대상 브랜치: 
- Vercel Production URL: `<YOUR_PROJECT.vercel.app>`
- Deployments 맨 윗줄 상태: ( Ready / Building / Error )
- (Error였다면) Build Logs에서 본 에러 한 줄: 

> 제출 팁: Vercel **Deployments** 화면에서 방금 커밋 해시가 맨 윗줄에 **Ready**로 떠 있는 모습을
> 캡처해 두면, 이 실습의 핵심 증거가 됩니다.
