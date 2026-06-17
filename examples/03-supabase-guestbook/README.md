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

## 검증법
- 글을 남기고 새로고침해도 사라지지 않는가?
- Supabase 대시보드의 `guestbook` 표에 내가 쓴 줄이 보이는가?
- (보안 체험) `schema.sql`에서 `enable row level security` 줄을 빼고 만들면 Supabase가 "RLS 꺼짐" 경고를 준다 — 왜 위험한지 [4. 안전(보안)](https://zeusk302-png.github.io/treasure/04-security/) 참고.

!!! danger "절대 하지 말 것"
    여기 넣는 건 **anon(publishable) 키**입니다. `service_role`(secret) 키는 RLS를 통째로 우회하므로 **브라우저·GitHub에 절대 두면 안 됩니다.** 두 키를 헷갈리는 게 가장 흔한 사고예요.

## 더 배우기
- 개념: [4. 안전(보안) — 키와 RLS](https://zeusk302-png.github.io/treasure/04-security/)
