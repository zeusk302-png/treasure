# npm audit 결과 요약표 + 취약점 1건 해결 전후 비교 (이번 실습의 결과물)

`npm audit`로 뽑은 알려진 취약점 목록을, 심각도 높은 항목 1건을 골라
버전 갱신으로 해결하고 **고치기 전/후를 비교**해 정리한 표입니다.

> 아래 숫자·패키지 이름은 이 실습용 견본(`package.json`의 `axios 1.6.7`) 기준 예시입니다.
> 여러분 컴퓨터에서 `npm install` → `npm audit`를 실제로 돌리면, 그때의 데이터베이스 상태에 따라
> 권고 버전(예: 1.7.4)이나 추가 항목이 조금 다를 수 있습니다. **여러분이 본 실제 출력으로 이 표를 채우세요.**

---

## 1) audit 결과 요약표 (고치기 전)

`npm audit` 한 줄 요약을 표로 옮긴 것입니다.

| 패키지 | 현재 설치 버전 | 심각도 | 취약점 유형 | 권고(GHSA) | 안전한 버전 |
|---|---|---|---|---|---|
| axios | 1.6.7 | High(높음) | SSRF & 자격증명 누출 (요청이 의도치 않은 주소로 새어 인증정보가 노출될 수 있음) | GHSA-8hc4-vh64-cxmj | `>=1.7.4` |

전체 카운트(요약):

| severity(심각도) | 건수(고치기 전) |
|---|---|
| critical(치명적) | 0 |
| high(높음) | 1 |
| moderate(보통) | 0 |
| low(낮음) | 0 |
| **합계** | **1** |

> `npm audit` 마지막 줄 예시: `1 high severity vulnerability`
> 그리고 `To address all issues, run: npm audit fix` 라고 해결법까지 알려줍니다.

---

## 2) 취약점 1건 — 해결 전 / 후 비교

심각도가 가장 높은 **axios High 취약점 1건**을 골라 해결했습니다.

| 비교 항목 | 해결 전 (Before) | 해결 후 (After) |
|---|---|---|
| `package.json`의 axios 버전 | `"axios": "1.6.7"` | `"axios": "1.7.4"` |
| `npm audit` 결과 | `1 high severity vulnerability` | `found 0 vulnerabilities` |
| high 건수 | 1 | 0 |
| 해결 방법 | — | 버전 갱신(`npm install axios@1.7.4`) |
| 바뀌는 파일 | — | `package.json`, **`package-lock.json`** |

> 핵심: 취약점은 **버전 숫자를 올리는 것**으로 사라집니다. 그리고 그 결과는
> `package-lock.json`에 "정확히 어떤 버전이 깔렸는지"로 기록됩니다. 그래서 **이 파일을 꼭 커밋**해야
> 다음에 누가 `npm install` 해도 똑같이 안전한 버전이 깔립니다.

---

## 3) 어떻게 고쳤나 (실제 한 일)

1. `npm install`로 의존성을 받고 `npm audit`로 취약점을 확인했다. → **axios High 1건** 발견.
2. 권고 버전(`>=1.7.4`)을 확인하고 `npm install axios@1.7.4`로 한 단계 올렸다.
   - (또는 `npm audit fix`로 자동 해결 — 단, 메이저 버전이 바뀌는 큰 변경은 `npm audit fix --force`를 함부로 쓰지 않고 직접 확인했다.)
3. `npm audit`를 다시 돌려 **`found 0 vulnerabilities`** 를 확인했다.
4. `package.json`과 `package-lock.json`을 함께 `git commit` 했다.

---

## 4) 왜 `package-lock.json`을 커밋해야 하나 (한 줄 정리)

- `package.json`은 "axios 1.7.x 쯤"이라는 **희망 범위**만 적습니다.
- `package-lock.json`은 "정확히 1.7.4가, 이 해시(무결성 값)로 깔렸다"는 **확정 사실**을 적습니다.
- 이 파일을 커밋해야 → 내 PC, 동료 PC, 배포 서버가 **전부 같은(안전한) 버전**을 씁니다. 공급망 사고를 막는 자물쇠입니다.
