# JN.md — 작업 진행노트

> 매 세션 여기부터 읽고 이어서 작업. 고정 정보는 [`CLAUDE.md`](CLAUDE.md).
> 최종 업데이트: 2026-07-03

## 현재 상태 (어디까지 했나)
**웹 홈페이지 — M1 완료 + 완벽화 1차 끝, 모바일 실렌더 검증 완료**
- `web/index.html`: 랜딩 + 크루 커뮤니티(참석·갤러리·방명록·합류·앱 알림). Firebase 미설정 시 localStorage 폴백.
- 디자인 시스템(`docs/DESIGN.md`) + 브랜드 로고 자산(`web/brand/`) 구축.
- 전문가 2인(홈페이지+마라톤) 감수 반영: 페이스·집합지점·안전, 진정성 카피, 크루 합류/앱 알림 섹션, 삭제 권한(작성자만), 모바일 44px·iOS 16px, 접근성(label·aria).
- 실제 브라우저 스크린샷으로 모바일(390px)·데스크톱·햄버거 검증 완료.

**앱 — M2 핵심 화면 + M2.5 빌드 준비 완료**
- `app/`: Expo SDK 57 + TS + Expo Router 스캐폴드, 모두의 마라톤 리브랜딩.
- 화면: 크루(방명록+참석+갤러리, `src/app/index.tsx`) · 러닝 기록(거리·시간·페이스, `explore.tsx`).
- 데이터 레이어 `src/lib/crew.ts`: Firebase 있으면 실시간, 없으면 로컬 폴백(웹과 동일 패턴).
- Auth 배선(`src/lib/auth.ts`) — 현재는 이름 기반 신원(session).
- EAS 빌드 프로필(`app/eas.json`) + 식별자(`com.modumarathon.app`) 준비. `npm install` 완료.
- 검증: `npx expo export --platform web` 번들 성공.

**Git**: 모든 작업 main에 커밋·**push 완료**(origin 동기화). 워킹트리 clean.

## 다음 할 일 (TODO)
- [ ] 홈페이지 실제 값 채우기: 카카오 오픈채팅·인스타 **실제 링크**(현재 `href="#"`), 실제 멤버 사진·통계, `data-n` 크루 인원.
- [ ] **OG 이미지 PNG(1200×630)** 제작 → `og:image`를 절대 URL로 교체(SVG는 카톡/페북 썸네일 안 뜸).
- [ ] **Firebase 실연결**: 콘솔에서 firebaseConfig 발급 → `web/index.html`의 `firebaseConfig` + `app/.env`(EXPO_PUBLIC_FIREBASE_*)에 동일 프로젝트 값 입력 → 웹·앱 실시간 공유 확인.
- [ ] **앱 실기기 설치**: `cd app && npx eas-cli login && ... build -p android --profile preview` → APK 폰 설치(docs/BUILD.md).
- [ ] 앱 로그인 화면/게이팅 완성(Firebase Auth + RN 영속성 `getReactNativePersistence`) — 실기기 테스트와 함께.
- [ ] **M3 워치 연동**: HealthKit(iOS)·Health Connect(Android/갤럭시워치)로 거리·심박·페이스 읽어 `runs`/피드에 통합 → dev build 필요.
- [ ] (후행) M4 스토어 배포, M5 커머스(러닝화·용품)·광고.

## 주요 결정사항
- **웹은 정적 HTML 유지**(Next.js 마이그레이션 보류) — 큰 의존성 회피, 정적으로 충분.
- 앱 스택: **TypeScript + Expo Router**(권장 기본값).
- 신원: 지금은 **이름 기반**(웹 localStorage / 앱 AsyncStorage). Firebase Auth는 실연결·실기기 후 도입.
- Firestore 컬렉션 스키마를 웹·앱이 공유(단일 소스=`app/src/lib/firebase.ts` COLLECTIONS).
- 우선순위 원칙: ① 설치 가능한 앱 → ② 워치 통합 → ③ 사용자 확보 → ④ 수익화(PRD §1-2).
- 재사용 서브에이전트 `homepage-expert`·`marathon-expert` 생성(`.claude/agents/`).

## 막힌 것 / 이슈
- **Firebase 실연결은 사용자 제공 필요** — 저장소에 실제 키 없음(예시값만). 값 입력 전까지 웹·앱 모두 로컬 폴백으로만 동작.
- **iOS 실기기/TestFlight·App Store**: Apple Developer $99/년 필요. Android는 APK 무료.
- **OG 이미지 PNG 미제작**: 이 환경에 SVG 래스터라이저 없음 → 소셜 공유 썸네일 개선 보류.
- 개발 환경 한계: 헤드리스 크로미움 실행에 시스템 라이브러리(libnspr4 등) 수동 확보 필요(이번엔 apt-get download로 우회해 스크린샷 검증 성공).
- 앱 Auth 세션 영속성(`getReactNativePersistence`)은 firebase RN 빌드 전용 API라 실기기 검증과 함께 도입 예정.
