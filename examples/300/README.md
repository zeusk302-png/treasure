# 실습 300 — Supabase 테이블에 RLS 켜기 (끄면 어떻게 새는지 먼저 확인)

"공개 키(publishable/anon)는 노출돼도 안전하다"는 말을 머리로만 외우지 말고, **직접 새는 걸 본 다음 → RLS로 막는 걸** 눈으로 확인하는 실습입니다. 결론은 한 문장입니다.

> 공개 키가 안전한 진짜 이유는 **"키를 숨겨서"가 아니라 "RLS(행 수준 보안)가 막아줘서"** 입니다.

같은 공개 키로 같은 테이블을 조회하는데, RLS를 켜기 **전에는 전화번호 3줄이 다 새고**, 켠 **후에는 0줄**이 됩니다. 키는 그대로인데 결과가 달라지는 그 순간이 이 실습의 핵심입니다.

## 목표
- RLS가 **꺼진** 테이블은 공개 키만으로 통째로 읽힌다는 것을 직접 본다(= 새는 증거).
- `enable row level security` 한 줄로 같은 키 조회 결과가 **3줄 → 0줄**로 바뀌는 것을 확인한다(= 막힌 증거).
- RLS는 "전부 잠그기"가 아니라 **"필요한 행만 정책으로 여는"** 잠금장치임을 공개 게시판 예시로 익힌다.
- `service_role`(secret) 키는 RLS를 통째로 우회하므로 **브라우저에 절대 두면 안 된다**는 원칙을 굳힌다.

## 따라하는 단계
1. [supabase.com](https://supabase.com)에서 프로젝트를 하나 만든다(부트캠프에서 한 방식 그대로).
2. **Settings → API**에서 `Project URL`과 **publishable(anon) 키**를 복사해, 이 폴더 `index.html` 위쪽의 `SUPABASE_URL` / `SUPABASE_ANON_KEY` 두 줄을 내 값으로 바꾼다. (절대 `service_role`/secret 키를 넣지 말 것 — 자리표시자 그대로 두면 동작 안 함)
3. **SQL Editor**를 열고 `schema.sql`의 **1단계 블록만** 잘라서 실행한다. → `secret_notes` 테이블과 샘플 3줄이 생기고, RLS는 **꺼진 채로** 남는다.
4. `index.html`을 브라우저로 열고 **[secret_notes 조회]** 를 누른다. → 전화번호 3줄이 그대로 다 보인다. **이 화면을 캡처한다(1번: RLS 끔 = 3줄, 새는 증거).**
5. SQL Editor로 돌아가 `schema.sql`의 **2단계 블록**(`alter table secret_notes enable row level security;`)을 실행한다.
6. `index.html`에서 다시 **[secret_notes 조회]** 를 누른다. → 이번엔 **0줄 / 빈 목록**이다. **이 화면을 캡처한다(2번: RLS 켬 = 0줄, 막힌 증거).** 키를 바꾼 적이 없다는 점을 스스로 확인한다.
7. SQL Editor에서 `schema.sql`의 **3단계 블록**을 실행한다. → `public_posts`(공개 게시판) 테이블이 생기고 RLS를 켠 뒤 **"읽기 누구나 허용" 정책**이 붙는다.
8. `index.html`에서 **[public_posts 조회]** 를 누른다. → 2줄이 보인다. 같은 공개 키인데 `secret_notes`(정책 없음)=0줄, `public_posts`(읽기 정책)=2줄인 것을 비교한다.

## 검증법
- 4번과 6번 캡처를 나란히 두었을 때, **같은 버튼·같은 키인데 "3줄 → 0줄"** 로 달라졌는가? (이게 제출물의 핵심 비교 캡처입니다.)
- Supabase 대시보드 **Table Editor**에서 `secret_notes` 옆의 빨간 **"RLS Disabled"** 경고가 2단계 실행 후 사라졌는가?
- `public_posts`는 RLS가 **켜져 있는데도** 조회 시 2줄이 나오는가? (정책이 "읽기"를 명시적으로 열었기 때문 — RLS = 행 단위로 열고 닫기라는 증거.)
- `index.html` 코드 어디에도 `service_role` / `sb_secret_` 문자열이 없는가? (F12 → Sources에서 검색해 **0건**이어야 정상.)

!!! danger "절대 하지 말 것"
    이 페이지에 넣는 건 **publishable(anon) 키**입니다. `service_role`(secret) 키는 RLS를 통째로 우회하는 "마스터키"라, 브라우저나 GitHub에 두면 RLS를 켜놨어도 누구나 모든 데이터를 가져갑니다. 비밀값은 항상 자리표시자로만 두고, 실제 secret 키는 서버 전용 환경변수에만 보관하세요.

!!! tip "왜 RLS만 켜도 0줄이 되나요?"
    RLS를 켜면 "허용 정책(policy)"이 따로 없는 한 기본값이 **전부 차단**입니다. 그래서 `secret_notes`는 정책을 안 만들었으니 공개 키로 0줄이 되고, `public_posts`는 "읽기 허용" 정책을 줬으니 2줄이 보입니다.

## 관련 가이드
- 키 두 종류 정정 → [공개해도 되는 키 vs 절대 숨길 키 (anon/publishable vs service_role/secret)](../../docs/04-security/01.md)
- 이 실습의 개념 본문 → [RLS(행 수준 보안) — 출입증을 공개해도 안전한 진짜 이유](../../docs/04-security/02.md)
- 보안 권 전체 보기 → [4. 안전(보안)](https://zeusk302-png.github.io/treasure/04-security/)
- 먼저 해보면 좋은 실습 → 실습 03 "Supabase 방명록 (진짜 저장)" (`examples/03-supabase-guestbook`)
