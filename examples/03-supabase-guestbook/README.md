# 실습 03 — Supabase 방명록 (진짜 저장)

새로고침해도 글이 남습니다. **데이터베이스(Supabase)** 에 진짜로 저장되니까요. 서버 코드 없이, 브라우저에서 Supabase를 직접 부릅니다(부트캠프에서 한 방식 그대로).

## 목표
- "저장된다 = 데이터베이스에 한 줄 쌓인다"를 눈으로 본다.
- **anon 키는 공개돼도 되는 출입증**이고, 안전한 진짜 이유는 **RLS**라는 걸 체험한다.

## 따라하는 단계
1. [supabase.com](https://supabase.com)에서 프로젝트를 만든다(부트캠프에서 한 것).
2. **SQL Editor**에 이 폴더의 `schema.sql`을 붙여넣고 실행 → `guestbook` 테이블과 RLS 정책이 생긴다.
3. **Settings → API**에서 `Project URL`과 `anon`(publishable) 키를 복사한다.
4. `index.html` 위쪽의 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 두 값을 내 값으로 바꾼다.
5. `index.html`을 브라우저로 열고, 글을 남겨 본다.
6. **새로고침** → 글이 그대로 남아 있다. Supabase 대시보드 → Table Editor에서도 같은 줄이 보인다.

## 🤖 바이브코딩 프롬프트
이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 비전공자도 따라 할 수 있게 설명하는 웹개발 멘토야.
  목표: Supabase에 진짜로 저장되는 "방명록" 페이지를 만들어줘.
  제약:
  - 서버 코드 없이 하나의 index.html(HTML+CSS+JS)로만 동작.
  - Supabase는 CDN(@supabase/supabase-js@2)으로 브라우저에서 직접 호출.
  - 입력 폼은 이름(input)과 메시지(textarea), '남기기' 버튼.
  - 저장은 guestbook 테이블에 insert, 목록은 created_at 최신순으로 select.
  - SUPABASE_URL, SUPABASE_ANON_KEY는 파일 위쪽에 상수로 분리하고
    "이건 공개돼도 되는 anon 키"라고 주석으로 설명.
  산출물: index.html 전체 코드 + guestbook 테이블을 만드는 schema.sql(RLS 포함).
  각 핵심 줄에 "무엇을 하는지 + 왜 그렇게 했는지"를 한국어 주석으로 달아줘.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  방금 만든 방명록을 개선해줘. 기존 동작은 그대로 두고:
  - 사용자가 넣은 글에 <script> 같은 태그가 끼어들어 실행되지 않도록
    화면 출력은 안전하게 처리(escape 또는 textContent).
  - 글이 없을 때 "아직 글이 없어요." 안내 문구 표시.
  - 저장 실패/불러오기 실패 시 에러 메시지를 사용자에게 보여주기.
  - 모바일에서도 보기 좋게 반응형으로 다듬기.
  바꾼 부분마다 "왜 이렇게 고쳤는지"를 한국어 주석으로 설명해줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  방명록이 동작을 안 해. 아래 정보를 보고 단계별로 원인을 짚어줘.
  - 증상: (예) 글을 남겨도 목록에 안 나타난다 / 새로고침하면 사라진다.
  - 브라우저 콘솔(F12) 에러 메시지: (여기에 그대로 붙여넣기)
  - 의심되는 것: SUPABASE_URL/ANON_KEY 오타? RLS 정책 누락? 테이블 이름?
  먼저 가장 가능성 높은 원인부터, 비전공자가 확인할 수 있는
  점검 순서(1, 2, 3…)로 알려줘. 고치는 코드도 함께.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다.

## 검증법
- 글을 남기고 새로고침해도 사라지지 않는가?
- Supabase 대시보드의 `guestbook` 표에 내가 쓴 줄이 보이는가?
- (보안 체험) `schema.sql`에서 `enable row level security` 줄을 빼고 만들면 Supabase가 "RLS 꺼짐" 경고를 준다 — 왜 위험한지 [4. 안전(보안)](https://zeusk302-png.github.io/treasure/04-security/) 참고.

!!! danger "절대 하지 말 것"
    여기 넣는 건 **anon(publishable) 키**입니다. `service_role`(secret) 키는 RLS를 통째로 우회하므로 **브라우저·GitHub에 절대 두면 안 됩니다.** 두 키를 헷갈리는 게 가장 흔한 사고예요.

## 더 배우기
- 개념: [4. 안전(보안) — 키와 RLS](https://zeusk302-png.github.io/treasure/04-security/)
