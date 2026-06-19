# 실습 270 — 웹게임 리더보드를 Realtime으로 실시간 갱신하기

10초 클릭 게임으로 점수를 내고, 그 점수를 **모두가 함께 보는 리더보드**에 올립니다. 이번 실습의 진짜 주인공은 게임이 아니라 **Supabase Realtime**입니다. 친구가 다른 기기·다른 탭에서 점수를 올리면, **내가 새로고침을 하지 않아도** 내 화면의 순위가 스르륵 바뀝니다.

핵심 한 줄: 보통 웹은 "내가 요청해야 응답이 온다(pull)"지만, **Realtime은 DB가 바뀌면 DB 쪽에서 먼저 알려줍니다(push).** "테이블에 INSERT가 생겼어!"라는 신호를 받아 리더보드만 다시 그리면 끝입니다.

이 폴더의 결과물:
- `index.html` — 클릭 게임 + 실시간 리더보드 (브라우저에서 Supabase를 직접 부릅니다)
- `schema.sql` — `scores` 테이블 + RLS 정책 + **Realtime 켜기** 한 줄

## 목표
- `db.channel(...).on('postgres_changes', ...).subscribe()` 로 **테이블 변경을 구독**하는 법을 익힌다.
- 새 INSERT가 들어오면 콜백이 실행돼 **새로고침 없이** 화면이 갱신되는 흐름(push)을 눈으로 본다.
- Realtime은 테이블마다 **명시적으로 켜야** 동작한다는 것(`alter publication ... add table`)을 안다.
- **anon(공개) 키 하나로도 안전한 이유**가 키를 숨겨서가 아니라 **RLS** 때문임을 다시 확인한다.

## 따라하는 단계
1. [supabase.com](https://supabase.com)에서 프로젝트를 만든다. (이미 있으면 그대로 사용)
2. 대시보드 → **SQL Editor**에 이 폴더의 `schema.sql`을 통째로 붙여넣고 **[Run]** → `scores` 테이블, RLS 정책, 그리고 **Realtime 발행 등록(`alter publication ... add table scores`)** 까지 한 번에 만들어진다.
3. 대시보드 → **Settings → API**에서 `Project URL`과 `anon`(publishable) 키를 복사한다.
4. `index.html` 위쪽의 `SUPABASE_URL`, `SUPABASE_ANON_KEY` 두 값을 내 값으로 바꾼다. (코드의 `https://여기에-...`, `sb_publishable_...`는 **자리표시자**다.)
5. `index.html`을 브라우저로 연다. 제목 옆 배지가 **`● LIVE`** 로 바뀌면 실시간 연결 성공이다. (`연결 중…`에서 멈춰 있으면 2번에서 Realtime 켜기 줄이 실행됐는지 확인)
6. 버튼을 눌러 게임을 시작하고 10초 동안 마구 클릭 → 끝나면 닉네임을 적고 **[점수 올리기]** 를 누른다. 리더보드에 내 줄이 노란색으로 표시되며 올라간다.
7. **★ 실시간 확인:** `index.html`을 **새 탭(또는 다른 기기/휴대폰)** 에서 하나 더 연다. 한쪽 탭에서 점수를 올리면, **건드리지 않은 다른 탭의 리더보드가 저절로 갱신**되며 1등 줄이 잠깐 반짝인다.

## 🤖 바이브코딩 프롬프트
이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다. (Supabase 프로젝트는 미리 만들어 두고, `Project URL`과 `anon` 키를 준비해 두세요.)

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 바닐라 HTML/CSS/JS와 Supabase에 익숙한 웹 멘토야.
  목표: 단일 index.html 하나로 동작하는 "10초 클릭 게임 + 공개 리더보드"를 만들어줘.
  요구사항:
  - 버튼을 누르면 10초 카운트다운이 시작되고, 그 동안 버튼을 누른 횟수가 점수가 된다.
  - 끝나면 닉네임 입력칸과 [점수 올리기] 버튼이 나타난다.
  - 점수는 Supabase의 scores 테이블(id, nickname, score, created_at)에 INSERT한다.
  - 리더보드는 score 내림차순 TOP 10을 보여준다(동점이면 먼저 올린 사람이 위).
  - Supabase는 CDN(@supabase/supabase-js@2)으로 브라우저에서 직접 부른다.
  제약:
  - SUPABASE_URL, SUPABASE_ANON_KEY는 코드 위쪽에 '자리표시자'로 두고 주석으로 "anon 키는 공개돼도 되는 출입증"임을 설명한다.
  - 닉네임은 사용자 입력이므로 화면에 찍을 때 textContent 또는 HTML 이스케이프로 XSS를 막는다.
  같이 줘: scores 테이블을 만드는 schema.sql (RLS 켜기 + 누구나 읽기/쓰기 정책 포함).
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  이제 핵심 기능인 'Realtime 실시간 갱신'을 얹어줘.
  - schema.sql 끝에 'alter publication supabase_realtime add table scores;' 한 줄을 추가하고,
    왜 이 줄이 있어야 구독 알림이 오는지 주석으로 설명해줘.
  - index.html에서 db.channel(...).on('postgres_changes', {event:'INSERT', schema:'public', table:'scores'}, 콜백).subscribe()로 INSERT를 구독해서,
    다른 탭/다른 기기에서 점수가 올라오면 내가 새로고침하지 않아도 리더보드가 다시 그려지게 해줘.
  - 구독이 성공(SUBSCRIBED)하면 제목 옆 배지를 '● LIVE'(초록)로, 끊기면 '연결 끊김'(회색)으로 바꿔줘.
  - 방금 들어온 1등 줄은 잠깐 반짝이는 애니메이션(flash)을 줘.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  배지가 계속 '연결 중…'에서 멈추고, 다른 탭에서 점수를 올려도 자동 갱신이 안 돼.
  점수 저장(INSERT) 자체는 되고 새로고침하면 보이긴 해.
  아래를 단계별로 점검해줘:
  1) schema.sql의 'alter publication supabase_realtime add table scores;'가 실제로 실행됐는지 확인하는 법
  2) subscribe() 콜백에 들어오는 status 값을 console.log로 찍어보는 코드
  3) RLS select 정책(using true)이 없으면 구독 알림이 안 오는지 여부
  내 schema.sql과 index.html을 붙여넣을 테니 원인을 짚어주고, 왜 그게 원인인지도 설명해줘.
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 좋습니다. 특히 Realtime은 'DB가 먼저 알려준다(push)'는 개념이 핵심이니, AI에게 "pull과 push 차이를 주석으로 비교해줘"라고 시켜 보세요.

## 검증법
- 제목 옆 배지가 `● LIVE`(초록)인가? `연결 끊김`(회색)이면 구독이 안 된 것이다.
- **두 탭/두 기기로 열고**, A에서 점수를 올렸을 때 **B를 새로고침하지 않았는데도** B의 순위가 바뀌는가? (이게 이번 실습의 합격 기준이다.)
- 점수를 올린 직후 Supabase 대시보드 → **Table Editor → `scores`** 에 같은 줄이 실제로 쌓였는가?
- (Realtime이 꺼졌을 때 비교) `schema.sql`의 `alter publication supabase_realtime add table scores;` 줄을 빼고 만들면, 점수는 저장되지만 **다른 탭이 자동 갱신되지 않는다**(새로고침해야 보인다). 이 한 줄이 push의 스위치임을 체감할 수 있다.

!!! danger "절대 하지 말 것 — anon vs service_role"
    `index.html`에 넣는 건 **anon(publishable) 키**입니다. 공개돼도 되는 '출입증'이라 브라우저·GitHub에 둬도 됩니다. 반면 **`service_role`(secret) 키는 RLS를 통째로 우회**하는 마스터키라, 브라우저나 깃허브에 두면 누구나 점수를 지우고 조작할 수 있습니다. **절대 프론트엔드에 두지 마세요.** 코드의 `sb_publishable_...`는 진짜 키가 아닌 자리표시자이니 꼭 내 anon 키로 바꿔 쓰세요.

!!! tip "Realtime도 RLS를 따릅니다"
    구독으로 흘러오는 변경 알림 역시 **읽기 정책(select using true)** 을 통과해야 받습니다. 즉 "누구나 읽기"라서 모두에게 점수가 보이는 것이고, 비공개 데이터라면 RLS가 막아 구독자에게도 가지 않습니다. 실시간이라고 보안이 느슨해지는 게 아닙니다.

## 관련 가이드
- 정적 사이트에서 브라우저가 DB(Supabase)를 직접 부르는 구조 → [정적 사이트의 진실 — '프론트·백·DB' 비유 바로잡기](../../docs/02-web-basics/08.md)
- 공개해도 되는 키 vs 절대 숨길 키 → [공개해도 되는 키 vs 절대 숨길 키 — anon vs service_role 완전 정정](../../docs/04-security/01.md)
- anon 키를 공개해도 안전한 진짜 이유(RLS) → [RLS(행 수준 보안) — 출입증을 공개해도 안전한 진짜 이유](../../docs/04-security/02.md)
- 보안 권 전체 보기 → [4. 안전(보안)](https://zeusk302-png.github.io/treasure/04-security/)
- 함께 보면 좋은 실습 → 실습 269 "리더보드 연동 웹게임"(`examples/269`) — 먼저 점수 저장/순위 읽기를 만든 뒤, 이번 270에서 Realtime을 얹는 흐름입니다.
