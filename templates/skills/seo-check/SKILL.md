---
name: seo-check
description: 페이지·사이트의 검색엔진 노출(SEO) 준비 상태를 점검할 때 사용. 구글·네이버 노출, 메타태그·사이트맵 점검 요청 시.
---

# SEO 점검 (seo-check)

아래 항목을 점검하고, 빠진 것을 고친 뒤 각 항목을 ✅/⚠️/❌로 보고한다. ❌는 수정안을 함께 제시.

- [ ] 페이지별 `<title>`과 meta description (고유하고 핵심 키워드 포함)
- [ ] canonical 링크 (중복 URL 정리)
- [ ] Open Graph / 트위터 카드 (제목·설명·대표 이미지) — 카톡·SNS 공유 미리보기
- [ ] 구조화 데이터 JSON-LD (Article / Organization / WebSite)
      ※ FAQ 리치결과는 2026년 폐지되었으므로 FAQPage 스키마는 넣지 않는다
- [ ] `sitemap.xml` 자동 생성 및 최신 여부
- [ ] `robots.txt` (production에 `noindex`가 남아있지 않은지)
- [ ] 모든 이미지에 alt 텍스트
- [ ] **구글 서치콘솔** 등록 + 사이트맵 제출
- [ ] **네이버 서치어드바이저** 등록 + 사이트 소유확인 + 사이트맵 제출  ← 한국 노출 필수
- [ ] 모바일 친화성 / Core Web Vitals (LCP·INP·CLS) 양호 여부

> 시점성 정보(리치결과 정책, CWV 합격선 등)는 변할 수 있으니, 중요하면 web.dev·구글/네이버 공식 문서로 마지막 확인 날짜와 함께 검증한다.
