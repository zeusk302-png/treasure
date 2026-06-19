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

## 🤖 바이브코딩 프롬프트
이 실습을 AI에게 시켜 만들 때 그대로 복사해 쓸 수 있는 프롬프트입니다.

- **1단계(뼈대 만들기)** 프롬프트:
  ```text
  너는 HTML 기초를 가르치는 멘토야. 비전공자가 따라할 간단한 한국어 안내 페이지 index.html을 만들어줘.
  요구사항:
  - <!doctype html>로 시작하는 최소한의 HTML 문서
  - <head>에 "기본 메타 3종 세트"를 올바른 순서로 넣어줘:
    1) <html lang="ko">  (이 페이지가 한국어임을 알림)
    2) <meta charset="utf-8" />  (head 안에서 가장 위에 위치)
    3) <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  - <title>은 한국어로, <body>에는 한글이 들어간 <h1>과 <p> 한두 줄
  제약: 외부 CSS/JS 없이 단일 파일. 각 메타 줄 위에 "무엇을 하고 왜 필요한지" 한국어 주석을 달아줘.
  ```
- **2단계(기능 추가/개선)** 프롬프트:
  ```text
  방금 만든 index.html을 복사해서, 일부러 틀리게 만든 broken.html을 만들어줘.
  - lang 속성을 빼고, charset 메타를 빼고, viewport 메타를 빼줘 (세 가지 모두 제거)
  - 어디가 왜 틀렸는지 each 위치에 (문제 1)(문제 2)(문제 3) 같은 한국어 주석을 남겨줘
  - 본문에는 "이 줄들이 빠지면 어떤 증상이 생기는지"를 설명하는 한국어 문장을 넣어줘
  목적: 학습자가 broken.html과 index.html을 나란히 비교하며 차이를 눈으로 확인하게 하려는 거야.
  ```
- **막혔을 때(디버깅)** 프롬프트:
  ```text
  내 HTML을 브라우저에서 열었더니 한글이 ???나 �로 깨지고, 휴대폰에서는 화면이 확대된 채로 작게 열려.
  아래 <head> 코드를 붙여넣을게. lang·charset·viewport 3종이 올바르게/올바른 순서로 들어갔는지 점검하고,
  빠졌거나 순서가 틀린 게 있으면 고친 뒤, 왜 그 증상이 났는지 한 줄씩 풀어서 설명해줘.
  [여기에 내 <head> 코드 붙여넣기]
  ```
> 프롬프트 팁: "코드만 주지 말고 왜 그렇게 했는지 주석으로 설명해줘", "비전공자가 이해하게 한 줄씩 풀어줘"를 덧붙이면 학습에 훨씬 좋습니다.

## 검증법
- `index.html`을 휴대폰 또는 브라우저 창을 아주 좁게 줄여서 열었을 때, 글자가 화면 너비에 맞게 보이고 옆으로 잘리지 않는다.
- 한글(예: "한글이 안 깨집니다")이 `???`나 `�` 없이 정상으로 보인다.
- 브라우저 개발자도구(F12) → Elements에서 `<html lang="ko">`, `<meta charset="utf-8">`, viewport 메타가 모두 보인다.
- (선택) 크롬 Lighthouse를 돌리면 "Document has a valid `lang` attribute", "Has a `<meta name=viewport>`" 항목이 통과로 표시된다.

## 관련 가이드
- [검색에 잡히게 하기 1 — 메타태그, sitemap.xml, robots.txt, 캐노니컬](../../docs/05-deploy-ops-seo/03.md)
- 다음 단계: [실습 183 — 모든 이미지에 의미 있는 alt 텍스트 붙이기] (alt 텍스트로 접근성·SEO 챙기기)
