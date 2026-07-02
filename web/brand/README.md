# 모두의 마라톤 로고 세트

> 웹·앱·SNS 공용 브랜드 마크. 색: 잉크 `#1d2228` · Brand Orange `#ff5a3c`(그라데이션 `#ff7a4d→#e8401f`) · 폰트 Pretendard(워드마크)·Black Han Sans(디스플레이).
> 마크 = **앞으로 달리는 러너 + 스피드 라인**을 라운드 스퀘어 배지에 담은 심볼. 글자 없는 심볼이라 재사용 자유.

| 파일 | 용도 |
|---|---|
| `mark.svg` | 마크(오렌지 배지) — **사이트 헤더**, 밝은 배경. 연동됨 |
| `mark-white.svg` | 마크(흰색, 배지 없음) — 푸터 등 어두운 배경. 연동됨 |
| `logo-horizontal.svg` | 가로 락업(마크+워드마크 "모두의 **마라톤**") — 문서·명함·OG, 밝은 배경 |
| `favicon.svg` | 파비콘(스피드 라인 생략·러너 굵게, 작은 크기 최적화). `index.html`에 연동됨 |
| `og.svg` | OG/공유 카드(1200×630). 배포 시 PNG 변환 권장 |

## 연동 현황
- 헤더: `mark.svg` + 텍스트 로고 (`web/index.html`) ✅
- 푸터: `mark-white.svg` + 텍스트 로고 ✅
- 파비콘: `favicon.svg` (`<link rel="icon">`) ✅
- OG/트위터 카드: `og.svg` (배포 도메인 확정 시 절대 URL·PNG로 교체) ⚠

## 비고
- 워드마크·OG의 텍스트는 Pretendard/Black Han Sans 사용(없으면 시스템 대체). 완전 호환이 필요하면 글자를 path로 아웃라인.
- OG 이미지는 SNS 호환성을 위해 배포 시 **PNG(1200×630)로 렌더 + 절대 URL** 권장. 지금은 SVG 소스만 보관.
- 색·타이포 기준은 `docs/DESIGN.md` 참조.
