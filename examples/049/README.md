# 마우스 올리면 떠오르는 hover 카드 효과

마우스 커서를 카드 위에 올리면 카드가 살짝 위로 떠오르면서 그림자가 진해지는 효과를 만듭니다. 쇼핑몰 상품 카드, 블로그 글 목록, 메뉴 카드 등에서 아주 흔하게 쓰이는 인터랙션입니다.

## 목표

- `:hover`(마우스를 올린 상태)일 때만 적용되는 스타일을 작성한다.
- `transform: translateY(-8px)`로 카드를 위쪽으로 살짝 이동시킨다.
- `box-shadow`를 더 크게 바꿔 "공중에 떠 있는" 느낌을 준다.
- `transition`으로 이 변화가 갑자기가 아니라 부드럽게(0.3초에 걸쳐) 일어나게 한다.

핵심 개념 3가지: **`:hover`**(언제 바뀔지) · **`transform`**(무엇이 바뀔지) · **`transition`**(어떻게 바뀔지).

## 따라하는 단계

1. 이 폴더(`049`)에 들어 있는 `index.html`과 `style.css` 두 파일을 같은 폴더에 둡니다. (`index.html`이 `<link>` 태그로 `style.css`를 불러오고 있습니다.)
2. `index.html`을 더블클릭해 브라우저(크롬 등)로 엽니다. 카드 3개가 가로로 나란히 보입니다.
3. `style.css`를 열어 `.card` 규칙을 봅니다. 여기에 평소(마우스를 올리지 않은) 상태의 모습이 정의되어 있습니다. 특히 아래 한 줄이 효과의 "부드러움"을 담당합니다.
   ```css
   transition: transform 0.3s ease, box-shadow 0.3s ease;
   ```
   → "transform과 box-shadow 값이 바뀌면 0.3초 동안 천천히 바꿔라"라는 뜻입니다.
4. `.card:hover` 규칙을 봅니다. `:hover`는 "마우스를 올렸을 때만"이라는 조건입니다. 여기서 두 값을 바꿉니다.
   ```css
   .card:hover {
     transform: translateY(-8px);              /* 위로 8px 이동 */
     box-shadow: 0 16px 30px rgba(0,0,0,0.15); /* 그림자 크게 */
   }
   ```
5. 브라우저로 돌아가 카드 위에 마우스를 올렸다 내렸다 해봅니다. 카드가 부드럽게 떠올랐다 제자리로 돌아오는지 확인합니다.
6. 직접 값을 바꿔봅니다. `translateY(-8px)`를 `-16px`로 키우면 더 많이 떠오르고, `0.3s`를 `0.1s`로 줄이면 더 빠르게, `0.6s`로 늘리면 더 느리게 움직입니다. 저장 후 브라우저를 새로고침(F5)하며 차이를 느껴보세요.

## 검증법

- 마우스를 올리지 않은 평소 상태에서는 카드가 옅은 그림자만 가진 채 가만히 있다.
- 카드 위에 마우스를 올리면 카드가 위로 살짝 이동하고 그림자가 진해진다.
- 그 변화가 "툭" 끊기지 않고 약 0.3초에 걸쳐 부드럽게 일어난다.
- 마우스를 다른 곳으로 치우면 카드가 다시 부드럽게 원래 위치로 돌아온다.
- (자가 점검) `style.css`에서 `transition:` 줄을 잠시 지우고 새로고침하면 효과가 즉시(딱딱하게) 바뀝니다. 이를 통해 `transition`의 역할을 눈으로 확인할 수 있습니다. 확인 후 다시 되돌려 두세요.

## 관련 가이드 링크

- 같은 커리큘럼 안의 이전/다음 실습
  - `../048/` — 햄버거 버튼으로 열리는 모바일 슬라이드 메뉴 (transform·transition 활용)
  - `../050/` — `@keyframes`로 빙글 도는 로딩 스피너 (애니메이션으로 한 단계 더)
- MDN 공식 문서 (한국어)
  - `:hover` 의사 클래스: https://developer.mozilla.org/ko/docs/Web/CSS/:hover
  - `transform`: https://developer.mozilla.org/ko/docs/Web/CSS/transform
  - `transition`: https://developer.mozilla.org/ko/docs/Web/CSS/transition
  - `box-shadow`: https://developer.mozilla.org/ko/docs/Web/CSS/box-shadow
