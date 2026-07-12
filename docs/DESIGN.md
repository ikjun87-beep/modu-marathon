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

> **⚠️ 2026-07-12 리브랜딩 — Brand Orange → Pine Green.** 메인 강조색을 당근/Strava와 겹치는 오렌지에서 **Pine Green `#0f7d61`**으로 교체(러닝·아웃도어·건강 정체성 + 파인·골드 = 완주 메달 감성). 아래 토큰 표가 현재 단일 기준(값의 실소스는 `app/src/lib/brand.ts` + `web/index.html` CSS 변수). **본문 아래쪽 산문에 남은 "오렌지" 표현은 색상 역할(히어로·CTA·강조)을 뜻하며, 실제 색은 파인 그린으로 읽을 것.**

### Brand & Accent
- **Pine Green** (`--brand` `#0f7d61`): 브랜드. 모든 primary CTA·활성·포커스 링·강조 링크·경로 stroke. 아껴 쓴다.
- **Pine Deep** (`--brand-deep` `#0a5f4a`): CTA hover/pressed, 헤드라인 강조, 진한 강조.
- **Pine Soft** (`--brand-soft` `#e5f3ee`): 옅은 강조 배경·info 배경. 크롬에는 안 씀.
- **Gold Accent** (`--accent` / `--gold` `#c0841a`): 페이스·완주·메달·랭킹 하이라이트(파인+골드 = 프리미엄 메달감).

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
- 위 색 토큰·타이포 위계·컴포넌트 규약은 Expo 앱에서도 동일 적용(브랜드 일관성). 색은 앱 테마 상수(`brand.ts`)로 이관.

---

## 홈페이지 리디자인 패턴 (2026-07-03 · 캐치테이블 모델 반영)
> 근거: 레퍼런스 리서치(캐치테이블·오늘의집·무신사·토스 / Strava·NRC·런데이·Garmin·adidas). PRD §5·§9 참조.
> 원칙: 웹 = **감정 → 신뢰 → 행동** 순서의 "설득·앱 유도 깔때기". 실제 행위는 앱, 단 앱 전용 가치(기록·워치)는 남긴다.

### 새 토큰
- **`--warm` `#faf7f5`**: 오렌지 기미가 도는 따뜻한 중립 배경(무채색 대신 '선택된' 회색). 히어로·교차 섹션 바탕.
- **`--dark` `#191d23`**: 신뢰 숫자 밴드·푸터·토스트.
- **그림자 토큰**: `--sh-1`(카드 기본, 아주 옅게 상시), `--sh-2`(hover), `--sh-phone`(폰 목업 대형).
- **`--wrap` 1120px**: 컨테이너 확대(기존 1000 → 1120)로 2열 히어로 여유 확보.

### 섹션 순서 (고정)
히어로(비대칭 2열) → **신뢰 숫자 밴드**(다크) → **앱 미리보기**(폰 목업 2대) → 소개(4카드) → **3스텝 흐름** → 모임·참석 → 갤러리(UGC) → 멤버 → 방명록 → 합류(오픈채팅+출시알림) → 푸터. + 모바일 **스티키 다운로드 바**.

### 새 컴포넌트
- **히어로(비대칭 2열)**: 좌측 카피(eyebrow pill → 임팩트 h1 → lede → 1·2차 CTA → trust-line 아바타), 우측 **폰 목업**. 900px↓ 1열, 폰이 위로(`order:-1`). 중앙 정렬 그라데이션 히어로 폐기.
- **폰 목업(`.phone`/`.screen`)**: 재사용 프레임(노치·상태바·본문·탭바). 앱 화면을 축소 렌더 — "설치하면 이런 걸 쓴다"(토스). 히어로=크루 탭, 미리보기=크루+러닝 2대(겹침).
- **stat 타일(`.s-stat`)**: 거리·시간·페이스 우선(3-up), 큰 숫자(Black Han Sans)+작은 라벨. **기록 화면·공유 카드에 동일 컴포넌트 재사용**(Strava Stats-Sticker).
- **route map 카드(`.s-map`)**: 경로 stroke = **Brand Orange**. ⚠️ 구간 하이라이트는 **대비 블루/그레이**로(브랜드색으로 하이라이트하면 사라짐 — Strava 규약).
- **신뢰 숫자 밴드(`.trust`)**: 다크 배경 4-up, 큰 숫자 + 오렌지 단위. 크루원·참석·사진·방명록을 Firebase 실데이터로(캐치테이블 규모 노출).
- **CTA 위계**: 1차 = 앱 설치/출시알림(solid brand), 2차 = **카톡 오픈채팅**(노랑 `#fee500`, 마찰 낮은 즉시 전환). 한 fold에 solid CTA는 원칙 1개나, 오픈채팅은 러닝 크루 특성상 병기 허용.
- **스티키 다운로드 바(`.dlbar`)**: 모바일 하단 고정(앱+오픈채팅), `env(safe-area-inset-bottom)` 대응. PC는 헤더 우측 `.nav-cta`.
- **3스텝(`.steps`)**: `counter-reset`로 번호 뱃지. 실제 순서(합류→참석→완주)라 번호가 정보를 담을 때만 사용.
- **`.only-badge`("앱 전용"/"준비 중")**: 앱 설치 이유를 명시(기록·워치는 앱에서만).

### 앱 디자인 큐 (M3~M4에서 구현 — 리서치)
- **공유 카드**(최고 ROI): 단체사진 배경 + **거대한 거리·페이스 숫자**(heavy weight) + 오렌지 + 크루명·날짜, 1:1/9:16, 원탭 인스타/카톡(NRC·adidas).
- **크루 피드 카드**: 사진 우선 + 아바타·이름·한 줄 요약 + **👏 박수**(Strava kudos의 따뜻한 대안, 런데이) + 지도 썸네일. 함께 뛴 러닝은 하나로 묶기(Strava Group Activities).
- **페이스+고도 결합 차트**: 고도=회색 면, 페이스=그 위 라인 오버레이(초보도 지형↔노력 한눈에).
- **축하 모멘트**: 스트릭/PB → confetti+haptic(NRC) + **한국어 칭찬 한 줄**(런데이) — 속도가 아니라 "나온 것"을 칭찬.
- **다크 모드**: 앱은 라이트+다크 동시(Strava·NRC·adidas 기본). 홈페이지는 프리미엄 라이트로 의도적 단일 커밋.
- **색·사진**: 단일 Brand Orange 유지(Garmin 무지개 지양), 실제 크루원의 따뜻한 러닝 실사진(엘리트 아님).

### 아이콘 시스템 (교보·영풍식 정제 + 캐치테이블식 통일 — 이모지 추방)
- **원칙: UI 아이콘에 이모지 금지.** AI스러움의 최대 원인. 대신 **단일 라인 SVG 스프라이트**로 통일.
- 스펙: **24 그리드 · `stroke-width` 1.75 · `currentColor` · round cap/join**. `web/index.html` `<svg><defs><symbol id="i-*">` 20종, 본문에서 `<svg class="ic"><use href="#i-*"/></svg>`로 참조. 크기는 부모 `font-size`로 제어(`.ic{width:1em;height:1em}`).
- 세트: `i-arrow·calendar·camera·activity·watch·run·flag·gauge·shield·coffee·users·bell·chat·instagram·award·pin·check·heart·menu·close·user·edit·signal`.
- **브랜드 정합**: `i-run`은 `brand/mark.svg` 러너 실루엣을 24그리드로 재현 → 앱 탭(크루)·웹 목업·멤버 아바타가 동일 러너로 묶임. 러닝 탭은 `i-activity`(맥박) — 앱 2탭(크루/러닝)과 일치.
- 이모지는 **동적 마이크로카피(토스트)에만** 잔존 허용(사람 냄새). 이벤트 카드·기능·멤버 등 **정적 UI는 전부 스프라이트**.

### 디스플레이 폰트 위계 (교보식 절제)
- **Black Han Sans는 로고·수치·히어로 h1·`.s-title`에만** 한정. 섹션 헤드(`.sec-head h2`)는 **Pretendard 800 + `letter-spacing:-1.1px`**로 차분하게(디스플레이 과부하 방지).
- 신뢰 밴드(`.trust`)는 **라이트(`--warm`)+헤어라인 구분선+잉크 숫자**, 오렌지는 단위(`small`)에만. 아바타는 뉴트럴 1색+대표만 오렌지. → "웜 스타트업"이 아니라 "에디토리얼 프리미엄".

### 자산 TODO
- 히어로/갤러리 **실제 크루 러닝 사진** 확보 → 폰 목업 옆·UGC 그리드에 투입(현재는 목업·토널 플레이스홀더).
- **OG PNG(1200×630)**, 앱 스토어 배지, 카톡 오픈채팅·인스타 실제 링크(현재 `data-todo`로 안내 토스트 처리).
</invoke>
