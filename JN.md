# JN.md — 작업 진행노트

> 매 세션 여기부터 읽고 이어서 작업. 고정 정보는 [`CLAUDE.md`](CLAUDE.md).
> 최종 업데이트: 2026-07-03 (PRD 5대목표 확장 + 홈페이지 캐치테이블식 리디자인)

## 🎯 현재 GOAL
PRD를 5대 목표(①안드로이드 앱 ②홈페이지 완성·디자인 ③앱↔웹 연동 ④앱↔워치 ⑤향후 서비스)로 확장하고, **"일단 디자인부터 완성"**.
캐치테이블처럼 앱+홈피가 연결된 서비스를 레퍼런스로. → 리서치 3건(레퍼런스 서비스·러닝앱 UX·워치 기술) 완료·PRD/DESIGN 반영. 홈페이지 리디자인 1차 완료.

## 현재 상태 (어디까지 했나)
**PRD/전략 — 5대 목표로 전면 확장(리서치 3건 반영)**
- `docs/PRD.md` 재작성: 전략적 쐐기(*"한국 오프라인 크루 운영을 잡은 앱이 없다"*), 경쟁 포지셔닝(Strava/NRC/런데이/Garmin/adidas), 5대 목표 섹션화, 워치 통합 아키텍처+통합 `Run` 스키마, 향후 서비스(캐치테이블 모델), 갱신 로드맵.
- 리서치 근거: ①레퍼런스 서비스(캐치테이블·오늘의집·무신사·토스·당근·야놀자) ②러닝앱 UX(Strava·NRC·런데이·Garmin·adidas) ③워치 기술(HealthKit·Health Connect·Garmin). 요약은 PRD 본문에 반영됨.

**웹 홈페이지 — 캐치테이블식 리디자인 1차 완료**
- `web/index.html` 리디자인: 비대칭 히어로+폰목업 · 신뢰 숫자 밴드(다크) · 앱 미리보기(폰목업 2대) · 3스텝 흐름 · 모바일 스티키 다운로드 바. 감정→신뢰→행동 퍼널 구조.
- 기존 크루 기능(참석·갤러리·방명록·합류)+Firebase/localStorage 로직 100% 보존(JS ID·선택자 정합 확인). localhost 서버 HTTP 200 렌더 확인.
- `docs/DESIGN.md` 확장: 새 패턴(폰목업·stat타일·route map·신뢰밴드·CTA위계·스티키바) + M3~M4 앱 디자인 큐(공유카드·피드카드·페이스+고도 차트·축하 모멘트·다크모드). 파일 끝 잘못된 `</content>` 태그 정리.
- 브랜드 로고 자산(`web/brand/`) + 전문가 2인 감수(안전·진정성·접근성)는 유지.

**앱 — M2 핵심 화면 + M2.5 빌드 준비 완료**
- `app/`: Expo SDK 57 + TS + Expo Router 스캐폴드, 모두의 마라톤 리브랜딩.
- 화면: 크루(방명록+참석+갤러리, `src/app/index.tsx`) · 러닝 기록(거리·시간·페이스, `explore.tsx`).
- 데이터 레이어 `src/lib/crew.ts`: Firebase 있으면 실시간, 없으면 로컬 폴백(웹과 동일 패턴).
- Auth 배선(`src/lib/auth.ts`) — 현재는 이름 기반 신원(session).
- EAS 빌드 프로필(`app/eas.json`) + 식별자(`com.modumarathon.app`) 준비. `npm install` 완료.
- 검증: `npx expo export --platform web` 번들 성공.

**Git**: 모든 작업 main에 커밋·**push 완료**(origin 동기화). 워킹트리 clean.

## 다음 할 일 (TODO)
- [ ] **홈페이지 리디자인 사용자 검토** → 피드백 반영(실사진·문구·색). 현재 목업·그라데이션 플레이스홀더.
- [ ] 목표① **안드로이드 APK**: `cd app && npx eas-cli login && build -p android --profile preview` (사용자 EAS 로그인 필요).
- [ ] 목표④ 워치 Phase 1: `expo-location` 인앱 러닝 추적 + 통합 `Run` 스키마 `firebase.ts` 선반영 → Phase 2(HealthKit·Health Connect, dev build).
- [ ] 홈페이지 실제 값 채우기: 카카오 오픈채팅·인스타 **실제 링크**(현재 `href="#"`), 실제 멤버 사진·통계, `data-n` 크루 인원.
- [ ] **OG 이미지 PNG(1200×630)** 제작 → `og:image`를 절대 URL로 교체(SVG는 카톡/페북 썸네일 안 뜸).
- [ ] **Firebase 실연결**: 콘솔에서 firebaseConfig 발급 → `web/index.html`의 `firebaseConfig` + `app/.env`(EXPO_PUBLIC_FIREBASE_*)에 동일 프로젝트 값 입력 → 웹·앱 실시간 공유 확인.
- [ ] **앱 실기기 설치**: `cd app && npx eas-cli login && ... build -p android --profile preview` → APK 폰 설치(docs/BUILD.md).
- [x] 앱 첫 실행 온보딩 게이트 완료(`app/src/components/onboarding-gate.tsx`, `_layout.tsx` 래핑) — 이름 없으면 환영 화면으로 맞이 → 저장 후 진입. 이름 기반 신원 유지, Firebase Auth 확장 지점 마련.
- [ ] Firebase Auth 로그인 완성(RN 영속성 `getReactNativePersistence`, 게스트·이메일) — 실기기 테스트와 함께.
- [ ] **M3 워치 연동**: HealthKit(iOS)·Health Connect(Android/갤럭시워치)로 거리·심박·페이스 읽어 `runs`/피드에 통합 → dev build 필요.
- [ ] (후행) M4 스토어 배포, M5 커머스(러닝화·용품)·광고.

## 워크플로 메모
- **윈도우 미러**: GitHub push 직후 `bash scripts/sync-win-mirror.sh` 실행 → `C:\Users\JUN\Claude\Projects\modu-marathon`에 동일 파일 저장(추적 파일만, node_modules·.env 제외).

## 주요 결정사항
- **웹은 정적 HTML 유지**(Next.js 마이그레이션 보류) — 큰 의존성 회피, 정적으로 충분.
- 앱 스택: **TypeScript + Expo Router**(권장 기본값).
- 신원: 지금은 **이름 기반**(웹 localStorage / 앱 AsyncStorage). Firebase Auth는 실연결·실기기 후 도입.
- Firestore 컬렉션 스키마를 웹·앱이 공유(단일 소스=`app/src/lib/firebase.ts` COLLECTIONS).
- 우선순위 원칙: ① 설치 가능한 앱 → ② 워치 통합 → ③ 사용자 확보 → ④ 수익화(PRD §1-2).
- 재사용 서브에이전트 `homepage-expert`·`marathon-expert` 생성(`.claude/agents/`).
- **홈페이지 = 캐치테이블식 "설득·앱 유도 깔때기"**(감정→신뢰→행동). 실제 행위는 앱, 앱 전용 가치(기록·워치)는 웹에 남기지 않고 앱으로. 웹은 프리미엄 라이트 단일 커밋, 다크모드는 앱 우선.
- **워치**: Apple·Galaxy는 온디바이스 무료(EAS dev build 필수), **Garmin은 파트너십·서버 필요라 후행**. 소스별 어댑터→통합 `Run` 스키마→`source+sourceId` 멱등 upsert.

## 막힌 것 / 이슈
- **Firebase 실연결은 사용자 제공 필요** — 저장소에 실제 키 없음(예시값만). 값 입력 전까지 웹·앱 모두 로컬 폴백으로만 동작.
- **iOS 실기기/TestFlight·App Store**: Apple Developer $99/년 필요. Android는 APK 무료.
- **OG 이미지 PNG 미제작**: 이 환경에 SVG 래스터라이저 없음 → 소셜 공유 썸네일 개선 보류.
- 개발 환경 한계: 헤드리스 크로미움 실행에 시스템 라이브러리(libnspr4 등) 수동 확보 필요(이번엔 apt-get download로 우회해 스크린샷 검증 성공).
- 앱 Auth 세션 영속성(`getReactNativePersistence`)은 firebase RN 빌드 전용 API라 실기기 검증과 함께 도입 예정.
