# F12 키 점검 메모 (1장)

> 이 사이트(`index.html`)를 브라우저로 열고 F12로 찾은 값을 여기에 적습니다.
> 스크린샷을 찍었다면 이 파일과 같은 폴더(`296/`)에 넣고 아래에 파일명을 적어 주세요.

- 점검한 페이지: `examples/296/index.html`
- 점검한 날짜: 2026-__-__
- 점검한 사람: ____

## 1) 찾은 키 분류

| 발견한 값(앞부분만 적어도 됨) | 어디서 봤나 (Sources/Network/Console) | 판정 |
|---|---|---|
| `sb_publishable_…` | Sources 탭 `<script>` 안 | 🟢 보여도 OK (공개 출입증, anon/publishable) |
| `sb_secret_…` | Sources 탭 `<script>` 안 | 🔴 절대 안 됨 (마스터키, service_role/secret) |

> 비밀키 값은 메모에 통째로 붙여넣지 말고, **`sb_secret_…` 처럼 앞부분만** 적습니다.
> (진짜 사이트였다면 이 값은 즉시 회전(재발급)해야 하는 사고입니다.)

## 2) 스크린샷 (있으면)

- Sources 탭 스크린샷: `screenshot-sources.png`
  - 화살표/표시: 🟢 `sb_publishable_`(보여도 OK), 🔴 `sb_secret_`(절대 안 됨)
- Network 탭 스크린샷(새로고침 후): `screenshot-network.png`
  - 요청 헤더에 키가 실려 가는 것을 보고 "브라우저는 키를 이미 다 받았다"를 표시

## 3) 한 줄 결론

- 화면에 보여도 되는 값: __________ (왜? RLS가 권한을 막아주니까)
- 절대 보이면 안 되는 값: __________ (왜? RLS를 통째로 우회하는 마스터키라서)
- 이 사이트의 문제점: 비밀키(`sb_secret_`)가 프론트 코드에 박혀 있다 → 다음 실습 297에서 `.env.local`로 분리한다.
