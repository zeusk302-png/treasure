# Supabase 프로젝트 만들고 newsletter 테이블 생성하기

뉴스레터 구독 이메일을 담아 둘 클라우드 데이터베이스(DB) 테이블을 직접 만들어 봅니다.
이 실습은 "한 단계짜리 미니 결과물"입니다. 코드를 많이 짜지 않아도 됩니다. Supabase라는 무료 클라우드 DB 서비스에 가입하고, 표 하나를 만드는 것이 전부입니다.

## 목표

- Supabase에 회원가입해서 내 첫 프로젝트(=내 전용 클라우드 DB)를 만든다.
- 이메일을 보관할 `newsletter` **테이블(표)** 을 만든다.
- "테이블 = 표, 컬럼 = 표의 칸(열), 행(row) = 한 줄의 데이터"라는 DB 기본 개념을 몸으로 익힌다.
- 보안 장치(RLS)를 켜서 "누구나 구독은 되지만, 남의 이메일 명단은 함부로 못 보게" 만든다.

> 용어 미리보기
> - **테이블(table)**: 데이터를 담는 표. 우리는 `newsletter`라는 표를 만듭니다.
> - **컬럼(column)**: 표의 칸(열). 예) `email`, `created_at`.
> - **행(row)**: 표의 한 줄. 구독자 한 명 = 한 줄.
> - **anon 키 (공개 키)**: 웹페이지에 넣어도 되는 열쇠. 노출돼도 괜찮습니다.
> - **service_role 키 (비밀 키)**: 모든 권한을 가진 마스터 열쇠. 절대 외부에 노출하면 안 됩니다.

## 따라하는 단계

1. **Supabase 가입하기**
   브라우저에서 `https://supabase.com` 에 접속 → 오른쪽 위 **Start your project** 클릭 → GitHub 계정 또는 이메일로 회원가입합니다. (무료 요금제로 충분합니다.)

2. **새 프로젝트 만들기**
   로그인 후 **New project** 클릭 → 아래 항목을 입력합니다.
   - Name: `my-newsletter` (아무 이름이나 가능)
   - Database Password: 강한 비밀번호 입력 후 **꼭 따로 메모**해 둡니다. (자리표시자 예시: `여기에_내가_정한_DB_비밀번호`)
   - Region: `Northeast Asia (Seoul)` 처럼 가까운 지역 선택
   - **Create new project** 클릭 → 1~2분 정도 DB가 준비되길 기다립니다.

3. **SQL 편집기 열기**
   프로젝트가 준비되면, 왼쪽 메뉴에서 **SQL Editor**(종이에 `</>` 모양 아이콘)를 클릭 → 오른쪽 위 **New query** 를 누릅니다.

4. **테이블 만드는 코드 붙여넣기**
   같은 폴더에 있는 `schema.sql` 파일을 열어 **전체 내용을 복사**한 뒤, SQL 편집기 빈칸에 붙여넣습니다.

5. **실행하기**
   오른쪽 아래 **Run** 버튼(또는 키보드 `Ctrl/Cmd + Enter`)을 누릅니다. 화면 하단에 "Success. No rows returned" 같은 초록색 메시지가 나오면 성공입니다.

6. **결과 눈으로 확인하기**
   왼쪽 메뉴 **Table Editor** 클릭 → 목록에 `newsletter` 표가 보이는지 확인합니다. 표를 누르면 `id`, `email`, `created_at` 세 칸(컬럼)이 있는 빈 표가 보입니다.

7. **(선택) 한 줄 직접 넣어보기**
   Table Editor에서 **Insert → Insert row** → `email` 칸에 `test@example.com` 입력 → Save. 표에 한 줄이 추가되고 `id`와 `created_at`이 자동으로 채워지는지 봅니다. (자동으로 채워지는 걸 보면 컬럼 설정이 잘 된 것입니다.)

## 검증법

- **테이블이 보이나요?** Table Editor 목록에 `newsletter`가 있으면 통과.
- **컬럼 3개가 맞나요?** `id`(번호), `email`(이메일), `created_at`(시각) 3개 칸이 있으면 통과.
- **중복 방지가 되나요?** 7번에서 넣은 `test@example.com`을 한 번 더 Insert 해보세요. `duplicate key value violates unique constraint` 같은 빨간 에러가 뜨면 정상입니다. (같은 이메일 두 번 저장을 막는 `unique` 설정이 작동한다는 뜻)
- **보안(RLS)이 켜졌나요?** Table Editor에서 `newsletter` 선택 → 표 이름 옆에 자물쇠/`RLS enabled` 표시가 보이거나, **Authentication → Policies** 화면에서 `newsletter` 테이블에 `anyone can subscribe` 정책 한 개가 보이면 통과.
- **자동 입력이 되나요?** 7번에서 `id`와 `created_at`을 직접 안 적었는데도 값이 채워졌다면 통과.

> 잘 안 될 때
> - "relation already exists" 에러: 이미 테이블이 있다는 뜻이라 무시해도 됩니다. (코드에 `if not exists`가 있어 다시 실행해도 안전)
> - 권한/정책 에러로 헷갈리면 Table Editor의 자물쇠 표시와 Policies 화면만 확인하면 됩니다.

## 다음 단계 & 관련 가이드

- **다음 실습 (247)**: 랜딩페이지에 구독 폼을 붙여, 입력한 이메일을 방금 만든 이 `newsletter` 테이블에 실제로 저장합니다. (이때 브라우저에는 **anon(공개) 키**만 사용합니다.)
- **그다음 (248)**: n8n으로 새 구독자가 생기면 자동으로 환영 메일을 보냅니다. (이때는 서버 쪽에서 동작하므로 비밀 키 사용 가능)
- 공식 문서: [Supabase 시작하기](https://supabase.com/docs/guides/getting-started) / [테이블 만들기](https://supabase.com/docs/guides/database/tables) / [Row Level Security(RLS)](https://supabase.com/docs/guides/database/postgres/row-level-security)

> 보안 한 줄 요약: **anon 키는 공개해도 되는 열쇠(웹페이지에 사용)**, **service_role 키는 절대 공개 금지인 마스터 열쇠(서버/n8n에서만)**. RLS를 켜 두면 anon 키로는 "구독 신청"만 되고 "남의 명단 조회"는 막혀서 안전합니다.
