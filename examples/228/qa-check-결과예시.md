# /qa-check 결과 — sample/index.html

> 이 파일은 같은 폴더 `sample/index.html`에 `/qa-check`를 돌렸을 때 **나와야 하는 결과의 예시**입니다.
> (실습에서는 여러분의 실제 파일을 점검한 결과를 이렇게 옮겨 두세요.)

| 항목 | 상태 | 근거 / 해야 할 일 |
|---|---|---|
| 1. 콘솔 에러 | ❌ | `getElementById("count")` 가 가리키는 `id="count"` 요소가 HTML에 없음(좋아요 수는 `<span>`에 id가 없음). 클릭하면 `null`에 `.textContent`를 쓰려다 콘솔 빨간 에러 발생. → `<span>`에 `id="count"`를 붙이거나, 코드의 `"count"`를 실제 id로 맞춘다. |
| 2. 비밀키 노출 | ❌ | `SUPABASE_SERVICE_ROLE` (= service_role **비밀키**, `eyJ...` JWT)가 프론트엔드 코드에 그대로 박혀 있음. service_role은 RLS를 무시하고 DB 전체를 만질 수 있어 **절대 공개 코드에 두면 안 됨**. → 이 값을 코드에서 즉시 빼고, Supabase에서 키를 **회전(재발급)** 한다. 프론트에는 anon(공개) 키만 둔다. (URL `https://...supabase.co` 는 공개돼도 정상) |
| 3. 모바일 화면 | ❌ | `<head>`에 `<meta name="viewport" content="width=device-width, initial-scale=1">` 가 없음. 모바일에서 데스크톱 화면을 축소해 보여 글자가 깨알같이 작아짐. → viewport 메타태그를 추가한다. |
| 4. 이미지 alt | ⚠️ | `<img src="tteokbokki.jpg">` 1개 중 1개에 `alt` 없음. 화면을 못 보는 사용자/이미지 로딩 실패 시 무슨 그림인지 알 수 없음. → `alt="떡볶이"` 처럼 설명을 넣는다. |

## 한 줄 결론

**고치고 다시 점검.** (❌가 3개 있으므로 배포 금지. 특히 비밀키 노출은 가장 먼저 처리)

---

## 참고: 비밀키 표기 규칙

이 결과 문서에 비밀값을 그대로 옮기지 않습니다. 위 표에서도 실제 토큰 대신 이름(`SUPABASE_SERVICE_ROLE`)만 적었습니다.
코드 예시에 키가 필요하면 항상 자리표시자로 가립니다.

```js
// 프론트엔드(공개)에 둬도 되는 값
const SUPABASE_URL = "https://YOUR_PROJECT.supabase.co"; // 공개 OK
const SUPABASE_ANON_KEY = "YOUR_ANON_PUBLIC_KEY";        // 공개 OK (RLS로 보호)

// 절대 프론트엔드/깃에 두면 안 되는 값 (서버에서만, .env로)
// const SUPABASE_SERVICE_ROLE = "YOUR_SERVICE_ROLE_KEY"; // ❌ 비밀 — 코드에 두지 말 것
```
