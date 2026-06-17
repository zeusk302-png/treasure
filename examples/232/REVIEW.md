# PR #REPLACE_WITH_PR_NUMBER 코드리뷰 결과 + 반영 커밋 (결과물)

> 이 파일이 **이 실습의 결과물**입니다.
> "AI가 GitHub MCP로 내 PR에 남긴 리뷰 코멘트"와, "그걸 내가 결정해서 반영한 커밋"을 한곳에 정리합니다.
> 아래는 **형식 예시**입니다. **여러분의 진짜 PR 번호·파일·줄·결정**으로 바꿔 채우세요.
> ( `REPLACE_WITH_...` 자리표시자는 모두 본인 값으로 교체하세요. )

---

## 0. 리뷰 대상

| 항목 | 값 |
|---|---|
| 저장소 | `REPLACE_WITH_OWNER/REPLACE_WITH_REPO` |
| PR 번호 | `#REPLACE_WITH_PR_NUMBER` |
| PR 제목 | 방명록에 Supabase 저장 기능 추가 (예시) |
| 리뷰어 | AI(Claude) via GitHub MCP |
| 공식 리뷰 상태 | 변경 요청(request changes) |

---

## 1. AI가 PR에 남긴 인라인 리뷰 코멘트

> 실제로는 PR의 "Files changed" 탭에서 각 줄 아래에 달립니다. 아래는 그 내용을 옮긴 기록입니다.

### 코멘트 1 — `app.js:4` · [보안] · 심각도 높음
- **무엇이:** 변수명·주석상 service_role(비밀) 키를 프론트엔드 `app.js`에 직접 넣음.
- **왜:** service_role 키는 RLS를 무시하고 테이블 전체를 읽고 지울 수 있는 마스터 키. 프론트에 두면 누구나 꺼내 데이터를 삭제·도용 가능.
- **제안 수정:** 프론트엔는 anon(공개) 키만. `const SUPABASE_KEY = "REPLACE_WITH_ANON_PUBLIC_KEY"`. 이미 노출된 비밀 키는 폐기·재발급(rotation).

### 코멘트 2 — `guestbook` 테이블 정책 · [보안] · 심각도 높음
- **무엇이:** 이 PR에 RLS(행 단위 출입 통제)가 켜졌다는 근거 없음.
- **왜:** RLS가 꺼져 있으면 anon 키만으로도 누구나 전체 행을 읽거나 지울 수 있음.
- **제안 수정:** `alter table guestbook enable row level security;` + 익명 INSERT/SELECT 정책 확인. 없으면 별도 PR로 추가.

### 코멘트 3 — `app.js:21` · [보안] · 심각도 높음
- **무엇이:** 사용자 입력을 `li.innerHTML = row.message` 로 출력(HTML로 해석).
- **왜:** `<img src=x onerror=...>` 같은 입력이 다른 방문자 브라우저에서 실행됨(XSS).
- **제안 수정:** `li.textContent = row.message` 로 변경.

### 코멘트 4 — `app.js:13` · [버그] · 심각도 중간
- **무엇이:** `insert(...)` 의 반환값 중 `error`를 확인하지 않음.
- **왜:** 저장 실패해도 "등록됨"으로 보여 글이 사라진 줄 모름.
- **제안 수정:** `const { error } = await ...; if (error) { /* 사용자에게 실패 안내 */ }`

### (코멘트 미부착) 개선 제안 — `index.html:12` · [개선]
- **무엇이:** 입력칸에 `required` 없음(빈 글 저장 가능).
- **제안:** `<input ... required>`. → 첫 버전엔 선택. 코멘트로는 달지 않고 목록으로만 보관.

---

## 2. 내 결정 (사람이 직접 채우는 칸)

> AI 리뷰는 초안입니다. 무엇을 반영할지는 **내가** 정합니다.

| # | 파일:줄 | 분류 | AI 제안 | **내 결정** | 메모 |
|---|---|---|---|---|---|
| 1 | app.js:4 | 보안 | service_role → anon, 키 재발급 | 고친다 | 가장 급함. 키도 재발급 |
| 2 | 정책 | 보안 | RLS 활성화 확인 | 고친다 | Supabase에서 RLS ON 확인 |
| 3 | app.js:21 | 보안 | innerHTML → textContent | 고친다 | 한 줄이면 됨 |
| 4 | app.js:13 | 버그 | insert error 확인 | 고친다 | 실패 알림 추가 |
| 5 | index.html:12 | 개선 | required 추가 | 다음에 | 과한 지적은 아니나 후순위 |

> **AI가 자진 신고한 과잉 비판:** 5번(required)은 첫 버전엔 후순위 → 그래서 "다음에"로 보류.
> 1·2·3은 합치기 전 필수라 모두 "고친다".

---

## 3. 반영 커밋 (내가 고친 결과)

> "고친다"로 정한 것을 실제 코드에서 고치고 만든 커밋입니다. 커밋 해시·메시지를 본인 것으로 바꾸세요.

- **커밋:** `REPLACE_WITH_COMMIT_HASH`
- **메시지:**
  ```
  fix: 코드리뷰 반영 - 비밀 키 제거, XSS·저장 오류 처리

  - app.js: service_role 키 삭제 → anon(공개) 키로 교체 (노출 키는 재발급함)
  - app.js: 출력 innerHTML → textContent 로 변경 (XSS 차단)
  - app.js: insert error 확인 후 실패 시 사용자 안내 추가
  - guestbook 테이블 RLS 활성화 확인
  (리뷰 코멘트: PR #REPLACE_WITH_PR_NUMBER 참고)
  ```
- **보류:** index.html `required` 추가는 다음 PR로 미룸.

---

## 4. 마무리 체크 (사람이 직접 확인)

- [ ] AI가 짚은 **줄 번호가 실제와 맞는지** PR에서 한 번 눈으로 확인했다.
- [ ] **보안 지적(비밀 키 노출·RLS·XSS)** 은 미루지 않고 이번에 다 막았다.
- [ ] 노출됐던 비밀 키는 **재발급(rotation)** 했다. (한 번 깃허브에 올라간 키는 지워도 위험)
- [ ] 반영 커밋을 PR에 push 해서, **리뷰 코멘트 + 반영 커밋**이 한 PR 안에 함께 남았다.
