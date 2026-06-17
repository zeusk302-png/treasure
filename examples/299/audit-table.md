# 키 사용처 점검 표 (이번 실습의 결과물)

`prompt.md`의 프롬프트로 AI에게 시킨 조사 결과를, 직접 파일을 열어 검증한 뒤 정리한 표입니다.
판정은 **🟢 안전 / 🔴 위험** 두 가지로만 매깁니다.

## 1) 키별 사용처 표

| 키 종류 | 환경변수 이름 | 발견 위치 (파일:줄) | 실행 환경 | 판정 |
|---|---|---|---|---|
| anon (publishable) | `VITE_SUPABASE_URL` | `src/supabaseClient.js:13` | 브라우저(프론트) | 🟢 |
| anon (publishable) | `VITE_SUPABASE_ANON_KEY` | `src/supabaseClient.js:14` | 브라우저(프론트) | 🟢 |
| anon 클라이언트 사용 | (위 클라이언트 import) | `src/App.jsx:9` | 브라우저(프론트) | 🟢 |
| service_role (secret) | `SUPABASE_URL` | `api/admin-cleanup.js:15` | 서버 전용 | 🟢 |
| service_role (secret) | `SUPABASE_SERVICE_ROLE_KEY` | `api/admin-cleanup.js:16` | 서버 전용 | 🟢 |

## 2) 핵심 판정 — service_role 키가 브라우저로 새는가?

| 점검 항목 | 결과 | 판정 |
|---|---|---|
| `src/` 안의 어떤 파일이든 `SUPABASE_SERVICE_ROLE_KEY`를 import/사용하는 곳 | 0건 | 🟢 |
| 비밀 키에 `VITE_` 접두가 붙은 곳 | 0건 | 🟢 |
| 코드에 진짜 키 값이 직접 박힌 곳(하드코딩) | 0건 (모두 `.env`에서 읽음) | 🟢 |
| `.env.example`에 진짜 값이 남아 있는가 | 모두 빈 자리표시자 | 🟢 |

> 최종 결론: **service_role(secret) 키가 브라우저로 가는 코드에 등장하는 곳 = 0건. 전체 🟢.**

## 3) 판정 기준 (왜 🟢/🔴인가)

- **🟢 anon (publishable)**: `VITE_` 접두가 붙어 일부러 브라우저로 내보내는 "공개 출입증". 화면·깃허브에 있어도 됩니다. 진짜 보안은 RLS가 책임집니다.
- **🟢 service_role (서버 전용)**: `api/` 폴더의 서버 코드에서 `process.env`로만 읽고, `VITE_` 접두가 없어 브라우저로 번들되지 않습니다.
- **🔴 가 되는 경우(이 프로젝트엔 없음)**: 만약 `src/`(브라우저) 코드에서 service_role 키를 import 하거나, 비밀 키에 `VITE_` 접두를 붙이거나, 키 값을 코드에 직접 적어 두면 즉시 🔴 입니다.
