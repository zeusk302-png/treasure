# 구조화 데이터 JSON-LD로 Article·Organization 표시하기

검색엔진이 내 글을 "더 잘 이해하게" 만드는 가장 쉬운 방법인 **구조화 데이터(JSON-LD)** 를 직접 넣어봅니다. 이번 실습에서는 글 정보(Article)와 운영주체 정보(Organization)를 넣고, 2026년에 효과가 사라진 FAQ 리치결과는 **일부러 넣지 않는 판단**까지 함께 배웁니다.

## 목표

- `<head>` 안에 `<script type="application/ld+json">` 형태로 구조화 데이터를 넣을 수 있다.
- 글에는 **Article**, 사이트 운영주체에는 **Organization** 스키마를 쓴다는 것을 안다.
- "넣을 수 있는 것"과 "넣어서 효과가 있는 것"은 다르다는 점을 이해한다. (FAQ를 안 넣는 판단)
- 구글 리치결과 테스트로 내가 넣은 데이터가 오류 없이 인식되는지 확인할 수 있다.

> 용어 한 줄 정리
> - **구조화 데이터**: 검색엔진(기계)이 페이지 내용을 정확히 알아듣게 정리한 "설명표".
> - **JSON-LD**: 그 설명표를 적는 형식. 본문과 분리돼 `<head>`에 들어가서 깔끔합니다.
> - **리치결과(Rich Result)**: 검색결과에서 별점·작성자·날짜처럼 평범한 파란 링크보다 풍부하게 보이는 형태.

## 따라하는 단계

1. 이 폴더의 `index.html`을 코드 에디터(예: VS Code)로 엽니다.
2. `<head>` 안에 JSON-LD 스크립트 블록이 **2개** 들어 있는 것을 확인합니다. 첫 번째는 `"@type": "Article"`, 두 번째는 `"@type": "Organization"` 입니다.
3. **Article 블록**에서 다음 값을 내 글에 맞게 바꿉니다.
   - `headline`: 글 제목
   - `description`: 글 한 줄 요약
   - `author.name`: 작성자 이름
   - `datePublished` / `dateModified`: 발행일 / 수정일 (ISO 형식, 예: `2026-06-18T09:00:00+09:00`)
4. **Organization 블록**에서 `name`(단체명)과, `https://YOUR_DOMAIN.com` 같은 **자리표시자**를 내 실제 도메인 주소로 바꿉니다. 이미지 주소(`logo`, `image`)도 실제 파일 주소로 교체합니다.
5. `sameAs`에는 운영하는 공식 SNS 주소를 넣고, 없으면 그 줄들을 지웁니다.
6. **FAQ는 넣지 않습니다.** 코드 안 주석에 적힌 대로, 2026년 기준 구글은 일반 사이트의 FAQ를 검색결과에 펼쳐 보여주지 않으므로 효과가 없습니다. "넣을 수 있다"고 다 넣지 않는 것이 좋은 판단입니다.
7. 저장한 뒤 `index.html`을 브라우저로 열어 화면이 잘 나오는지 확인합니다. (구조화 데이터는 눈에 안 보이는 게 정상입니다.)

## 검증법

- **브라우저 열기**: `index.html`을 더블클릭해 글이 정상 표시되는지 봅니다. JSON-LD는 화면에 보이지 않아야 정상입니다.
- **개발자 도구로 확인**: 브라우저에서 F12 → Elements 탭에서 `<head>` 안에 `application/ld+json` 스크립트가 2개 있는지 봅니다.
- **구글 리치결과 테스트** (핵심 검증):
  1. https://search.google.com/test/rich-results 에 접속합니다.
  2. 사이트를 배포했다면 **URL 입력**, 아직이라면 `index.html`의 코드를 통째로 복사해 **코드 입력** 탭에 붙여 넣습니다.
  3. "테스트" 버튼을 누릅니다.
  4. 결과에 **"Article"** 항목이 잡히고 오류(빨간색)가 없으면 성공입니다. 경고(노란색)는 선택 항목이 비어 있다는 안내일 뿐 통과로 봐도 됩니다.
  5. 결과 화면을 **캡처**해 둡니다. (제출물: 리치결과 테스트 통과 캡처)
- **스키마 문법 검사(보너스)**: https://validator.schema.org 에 코드를 붙여 넣으면 Article/Organization이 각각 인식되는지 더 자세히 볼 수 있습니다.

> 자주 하는 실수
> - JSON 안에서 쉼표(,)를 빠뜨리거나 마지막 항목 뒤에 쉼표를 더 붙이면 인식이 안 됩니다. 리치결과 테스트가 "구문 분석 오류"를 알려줍니다.
> - `https://YOUR_DOMAIN.com` 같은 자리표시자를 안 바꾸면 가짜 주소라 이미지/로고가 안 잡힙니다. 배포 전 꼭 교체하세요.

## 관련 가이드 링크

- Google 검색 센터 — 구조화 데이터 입문: https://developers.google.com/search/docs/appearance/structured-data/intro-structured-data?hl=ko
- Google — Article 구조화 데이터: https://developers.google.com/search/docs/appearance/structured-data/article?hl=ko
- Google — 로고/Organization 구조화 데이터: https://developers.google.com/search/docs/appearance/structured-data/logo?hl=ko
- 리치결과 테스트 도구: https://search.google.com/test/rich-results
- Schema.org 검증기: https://validator.schema.org
- 참고(FAQ 정책 변경 안내): https://developers.google.com/search/blog/2023/08/howto-faq-changes?hl=ko
