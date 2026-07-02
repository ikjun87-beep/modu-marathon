# DESIGN.md — 모두의 마라톤 디자인 시스템

> 웹(`web/index.html`)·앱(`app/`)이 **같은 브랜드 언어**를 쓰도록 하는 단일 기준.
> 레퍼런스: `print-delivery-service`(EasyPost)의 디자인 시스템 구조를 계승 — 색 토큰·타이포 스케일·모션·접근성·컴포넌트 규약.

## Overview
모두의 마라톤은 **"혼자 뛰면 운동, 같이 뛰면 추억"**을 화면으로 옮긴다. 경쟁이 아니라 **함께 완주하는 따뜻함**이 톤이다.
- 하나의 강조색 **Brand Orange**(`#ff5a3c`)가 모든 주요 CTA·활성 상태·핵심 강조를 책임진다. 나머지는 잉크·회색·화이트의 모노톤.
- 보조 액센트 **Teal**(`#1e8b6f`, 참석/완료)과 **Gold**(`#f4b740`, 완주/메달)는 의미 있는 순간에만.
- 표면 리듬: **오렌지 그라데이션 히어로** → 화이트/그레이 본문 교차 → near-dark 푸터(`#222831`).
- 각진 정도: 인터랙티브 요소 `radius-md`(12px), 카드 `radius-lg`(18px) — 친근하고 부드럽게.

## Colors

### Brand & Accent
- **Brand Orange** (`--brand` `#ff5a3c`): 브랜드. 모든 primary CTA·활성·포커스 링·강조 링크. 아껴 쓴다.
- **Brand Deep** (`--brand-deep` `#e8401f`): CTA hover/pressed, 헤드라인 강조.
- **Brand Soft** (`--brand-soft` `#fff0ec`): 옅은 강조 배경·info 배경. 크롬에는 안 씀.
- **Teal Accent** (`--accent` `#1e8b6f`): 참석·완료·긍정 상태(참석 버튼 등).
- **Gold** (`--gold` `#f4b740`): 완주·메달·랭킹 하이라이트.

### Surface
- **Canvas** (`--card` `#ffffff`): 카드·본문 바탕. hairline 테두리로 얹는다.
- **Soft BG** (`--bg` `#f4f6f9`): 페이지 바탕·교차 섹션.
- **Dark** (`#222831`): 푸터·토스트.
- **Hairline** (`--line` `#e7eaee`): 1px 카드 테두리·구분선.

### Text
- **Ink** (`--ink` `#1d2228`): 헤드라인·강조.
- **Soft** (`--soft` `#5b636c`): 본문 보조·메타.
- **On Brand** (`#ffffff`): 오렌지/다크 면 위 텍스트.

> 대비: `--brand` 위 흰 텍스트, `--card` 위 `--ink`/`--soft`는 WCAG AA(≥4.5:1) 충족. `--soft`는 보조 라벨용, 긴 본문은 `--ink` 계열.

## Typography

### Font Family
- **Pretendard** — 한글·UI 기본. weight 400/500/700/900. fallback: `-apple-system, "Apple SD Gothic Neo", "Malgun Gothic", sans-serif`.
- **Black Han Sans** — 디스플레이(히어로 h1·숫자 카운터·섹션 타이틀) 전용. 임팩트 담당.
- 아이콘: 현재는 이모지(🏃📅📸). 앱 단계에서 라인 아이콘 세트로 통일 검토.

위계는 **weight와 size**로 세운다. 색은 강조·링크에만.

### Hierarchy
| 용도 | Size | Weight | Font |
|---|---|---|---|
| 히어로 헤드라인 | clamp(44–86px) | 400 | Black Han Sans |
| 섹션 타이틀(h2) | clamp(26–38px) | 400 | Black Han Sans |
| 통계 숫자 | 38px | 400 | Black Han Sans |
| 카드 제목(h3) | 19px | 700 | Pretendard |
| 본문 | 14.5–16px | 400 | Pretendard |
| 버튼 | 15px | 800 | Pretendard |
| eyebrow(라벨) | 12px / letter-spacing 3px | 800 | Pretendard, UPPERCASE |
| 메타·힌트 | 12.5–13px | 500 | Pretendard |

## Layout
- **Base unit:** 8px 배수 기준.
- **Container:** `.wrap` max-width 1000px, 좌우 패딩 18px.
- **섹션 리듬:** `section` 상하 60px. 카드 그리드 거터 18px, 카드 내부 패딩 26px.
- **그리드:** 통계 4-up → 모바일 2-up. 카드 3-up → 모바일 1-up. 멤버·갤러리 4·3-up → 모바일 2-up.
- **여백은 구조다:** 장식 디바이더 대신 화이트 본문이 오렌지 히어로·다크 푸터 사이에 끼는 교차 리듬으로 공기감을 만든다.

## Elevation & Depth
| Level | Treatment | Use |
|---|---|---|
| 0 — Flat | 테두리·그림자 없음 | 히어로/푸터 텍스트 |
| 1 — Hairline | 1px `--line` | 모든 카드·입력 |
| 2 — Hover lift | `translateY(-4px)` + `0 16px 34px rgba(0,0,0,.08)` | 카드 hover |
| 3 — Float | `0 8px 22px rgba(0,0,0,.16)` | 히어로 흰 CTA·토스트 |

카드는 기본적으로 뜨지 않는다 — hairline으로 구분, hover에서만 살짝 뜬다.

## Shapes
| Token | Value | Use |
|---|---|---|
| radius-sm | 9–10px | 입력·작은 배지 |
| radius-md | 12px | 버튼 |
| radius-lg | 14–18px | 카드·패널 |
| radius-full | 50% / 30px | 아바타·pill 배지·att 버튼 |

## Motion & Scroll
- **Tokens:** transition `.15s`(누름)·`.2s`(hover)·`.25s`(토스트). ease 기본.
- **Patterns:** 카드 hover lift, 버튼 press(`translateY(1px)`), 통계 숫자 카운트업(IntersectionObserver), 토스트 슬라이드업.
- **Reduced Motion (필수):** `@media (prefers-reduced-motion: reduce)`에서 transform/transition/스크롤 애니메이션을 제거하고 카운트업은 최종값 즉시 표시. 접근성 기본값으로 반드시 존중한다.

## Components
- **Buttons:** `.btn-w`(흰 배경/오렌지 글씨, 히어로 primary) · `.btn-o`(투명/테두리, secondary). 앱 공통 규약: primary=solid brand. 한 fold에 solid CTA는 원칙적으로 하나.
- **Cards:** hairline + radius-lg, hover lift. 아이콘(이모지) → 제목 → 설명 순.
- **Stat:** Black Han Sans 숫자 + 소형 라벨. 숫자는 브랜드 오렌지.
- **Schedule row(참석):** 날짜 뱃지(그라데이션) + 정보 + 참석 토글. 참석중=teal soft.
- **Nav/Footer:** sticky glass 헤더(blur), 다크 푸터. 모바일 햄버거 토글(`aria-expanded` 필수).
- **Toast:** 하단 중앙 pill, 2.2s 자동 소멸.
- **Logo:** 이모지 금지 → `web/brand/mark.svg`(밝은 배경)·`mark-white.svg`(다크 배경) 사용. 워드마크는 "모두의 **마라톤**"(마라톤=brand 색).

## Do's and Don'ts
### Do
- 강조색은 오렌지 하나로 아껴 쓴다. 참석=teal, 완주/메달=gold의 의미를 지킨다.
- 모든 인터랙티브 요소에 포커스 링(`:focus-visible`)과 44px 이상 터치 타깃.
- 이미지 `alt`, 버튼 `type`, 폼 `label` 연결, 아이콘 이모지엔 `aria-hidden` 또는 라벨.
- 숫자·통계는 Black Han Sans로 임팩트.

### Don't
- 로고를 이모지로 두지 않는다(브랜드 마크 사용).
- 오렌지를 배경 크롬에 남발하지 않는다.
- reduced-motion 무시 금지.
- 저대비 회색(`--soft`)을 긴 본문에 쓰지 않는다.

## Responsive Behavior
- Breakpoint: 760px. 이하에서 nav→햄버거, 그리드 축소(위 Layout 참조).
- **터치 타깃:** 버튼·링크·토글 최소 44×44px.

## 앱(app/)과의 공유
- 위 색 토큰·타이포 위계·컴포넌트 규약은 M2 Expo 앱에서도 동일 적용(브랜드 일관성). 색은 앱 테마 상수로 이관.
</content>
</invoke>
