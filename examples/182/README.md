# 실습 182 — lang·charset·viewport 기본 메타 3종 세트 채우기

웹페이지의 `<head>`에 꼭 들어가야 하는 "기본기 메타" 세 가지를 직접 채워, **한글 깨짐**과 **모바일 확대** 문제를 없애는 실습입니다. (난이도 1, 카테고리: SEO·성능·접근성)

## 목표
- `<html lang="ko">` 가 왜 필요한지 안다 — 이 페이지가 한국어임을 브라우저·번역기·스크린리더에게 알려준다.
- `<meta charset="utf-8">` 로 한글이 `???` 처럼 깨지지 않게 한다.
- `<meta name="viewport" ...>` 로 휴대폰에서 화면 너비에 딱 맞게 보이게 한다.
- 이 세 줄이 빠지면 어떤 문제가 생기는지 깨진 예시(`broken.html`)로 눈으로 확인한다.

## 따라하는 단계
1. 이 폴더의 `broken.html`을 더블클릭해 브라우저로 연다. 그리고 휴대폰처럼 보려면 브라우저 창을 아주 좁게 줄여 본다. (글자가 작거나 한글이 깨질 수 있다.)
2. `index.html`도 같은 방법으로 열어 본다. 휴대폰 너비로 줄여도 글자가 화면에 맞게 보이는지 비교한다.
3. `broken.html`을 직접 고쳐 본다. 아래 세 가지를 추가/수정한다.
   - `<html>` → `<html lang="ko">` 로 바꾼다.
   - `<head>` 맨 위에 `<meta charset="utf-8" />` 한 줄을 넣는다. (charset은 head에서 가장 위에 와야 한다.)
   - 그 아래에 `<meta name="viewport" content="width=device-width, initial-scale=1.0" />` 를 넣는다.
4. 고친 `broken.html`을 새로고침해 `index.html`과 똑같이 잘 보이는지 확인한다.
5. AI에게 시켜 보기:
   > "이 HTML의 `<head>`에 lang, charset, viewport 기본 메타 3종이 올바르게 들어갔는지 점검하고, 빠졌거나 순서가 틀린 게 있으면 고쳐줘."

## 무엇이 틀렸나 / 어떻게 고치나 (broken.html)
| 문제 | 증상 | 고치는 법 |
| --- | --- | --- |
| `lang` 속성 없음 | 번역기·스크린리더가 언어를 못 알아챔 | `<html>` → `<html lang="ko">` |
| `charset` 메타 없음 | 환경에 따라 한글이 `???`/`�`로 깨짐 | `<head>` 맨 위에 `<meta charset="utf-8" />` |
| `viewport` 메타 없음 | 휴대폰에서 PC 화면을 축소한 듯 작게 열림 | `<meta name="viewport" content="width=device-width, initial-scale=1.0" />` |

> 고친 결과가 헷갈리면 `index.html`(정답 예시)과 한 줄씩 비교해 보세요.

## 검증법
- `index.html`을 휴대폰 또는 브라우저 창을 아주 좁게 줄여서 열었을 때, 글자가 화면 너비에 맞게 보이고 옆으로 잘리지 않는다.
- 한글(예: "한글이 안 깨집니다")이 `???`나 `�` 없이 정상으로 보인다.
- 브라우저 개발자도구(F12) → Elements에서 `<html lang="ko">`, `<meta charset="utf-8">`, viewport 메타가 모두 보인다.
- (선택) 크롬 Lighthouse를 돌리면 "Document has a valid `lang` attribute", "Has a `<meta name=viewport>`" 항목이 통과로 표시된다.

## 관련 가이드
- [검색에 잡히게 하기 1 — 메타태그, sitemap.xml, robots.txt, 캐노니컬](../../docs/05-deploy-ops-seo/03.md)
- 다음 단계: [실습 183 — 모든 이미지에 의미 있는 alt 텍스트 붙이기] (alt 텍스트로 접근성·SEO 챙기기)
