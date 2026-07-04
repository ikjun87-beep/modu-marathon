# JN.md — 작업 진행노트

> 매 세션 여기부터 읽고 이어서 작업. 고정 정보는 [`CLAUDE.md`](CLAUDE.md).
> 최종 업데이트: 2026-07-04 (홈페이지 아이콘 시스템 통일 + 교보·영풍식 정제 → 부장 감수 95/100 통과)

## 🎯 현재 GOAL
PRD를 5대 목표(①안드로이드 앱 ②홈페이지 완성·디자인 ③앱↔웹 연동 ④앱↔워치 ⑤향후 서비스)로 확장하고, **"일단 디자인부터 완성"**.
캐치테이블처럼 앱+홈피가 연결된 서비스를 레퍼런스로. → 리서치 3건(레퍼런스 서비스·러닝앱 UX·워치 기술) 완료·PRD/DESIGN 반영. 홈페이지 리디자인 1차 완료.

## 현재 상태 (어디까지 했나)
**PRD/전략 — 5대 목표로 전면 확장(리서치 3건 반영)**
- `docs/PRD.md` 재작성: 전략적 쐐기(*"한국 오프라인 크루 운영을 잡은 앱이 없다"*), 경쟁 포지셔닝(Strava/NRC/런데이/Garmin/adidas), 5대 목표 섹션화, 워치 통합 아키텍처+통합 `Run` 스키마, 향후 서비스(캐치테이블 모델), 갱신 로드맵.
- 리서치 근거: ①레퍼런스 서비스(캐치테이블·오늘의집·무신사·토스·당근·야놀자) ②러닝앱 UX(Strava·NRC·런데이·Garmin·adidas) ③워치 기술(HealthKit·Health Connect·Garmin). 요약은 PRD 본문에 반영됨.

**웹 홈페이지 — 아이콘 통일 + 교보·영풍식 정제 (부장 감수 95/100 통과)**
- `web/index.html` 2차 리디자인: **이모지 UI 아이콘 → 통일 SVG 스프라이트 20종**(24그리드·stroke 1.75·currentColor, `<use href="#i-*">`). AI스러움 제거가 핵심. `i-run`은 `brand/mark.svg` 러너 실루엣 재현 → 앱 탭·목업·아바타 동일 러너로 묶음.
- **교보·영풍식 에디토리얼 정제**: 신뢰밴드 다크→라이트(헤어라인+잉크 숫자, 오렌지는 단위만), 섹션 h2 Black Han Sans→Pretendard 800, 아바타 4색→뉴트럴 1색, 히어로 래디얼 1개로, 멤버 아바타·목업 갤러리 토널화.
- 마감: `body{overflow-x:hidden}`+430px 브레이크(폰 오버플로 제거), 삭제버튼 44px, 신뢰숫자 시드+`setStat` 실데이터 우선, 미완 링크 `data-todo` 안내 토스트, 폰트 논블로킹 로드, 풋터 대비 AA.
- **기존 크루 기능(참석·갤러리·방명록·합류)+Firebase/localStorage 로직 100% 보존**(JS 구문 `node --check` 통과, 셀렉터 정합 확인). HTTP 200 렌더 확인.
- 감수 이력: `homepage-expert`(10년차 부장) 3회 채점 80 → 92 → **95/100 OK**. 감점 사유별 수정 반영.
- `docs/DESIGN.md`에 **아이콘 시스템·디스플레이 폰트 위계** 섹션 추가. 브랜드 로고 자산·전문가 감수 유지.

**앱 — M3 실시간 러닝 + 워치 연동 배선 완료 (홈페이지와 같은 형태로 통일)**
- **UI 통일**: 웹 스프라이트와 1:1인 `src/components/icon.tsx`(react-native-svg, 24종). 이모지 UI 전부 아이콘화(크루·러닝·온보딩·모임·갤러리). `i-run`=brand/mark.svg 러너. 팔레트 `brand.ts`를 웹 CSS 변수와 정렬.
- **통합 Run 스키마**(`firebase.ts` runs + `src/lib/run.ts`): `source`(manual/gps/healthconnect/garmin)·`sourceId`·`distanceKm`·`durationSec`·`paceSecPerKm`·`startedAt`·`avgHr`. haversine 거리·페이스·오늘거리 집계·멱등 `saveRun`. `crew.ts`에 결정적 id `put()` 추가(워치 중복 방지).
- **실시간 GPS**(`src/components/live-run.tsx`): expo-location 라이브 트래킹 모달 — 시작/일시정지/종료, 실시간 거리·페이스·시간, 종료 시 `source:'gps'` 저장. 포그라운드는 Expo Go/웹 OK, 백그라운드는 dev build.
- **갤럭시워치**(`src/lib/healthconnect.ts`): react-native-health-connect로 오늘 러닝 세션·거리·심박 읽어 `source:'healthconnect'` 멱등 저장(Android/dev build 전용, 안전 가드).
- **러닝 화면**(`explore.tsx`): 오늘 뛴 거리 카드(실시간) + [러닝 시작]/[워치 불러오기] + 수동입력 + 소스별 히스토리.
- 의존성 추가: `react-native-svg`·`expo-location`·`react-native-health-connect`. app.json에 위치 권한·플러그인 구성.
- 검증: **`npx tsc --noEmit` 통과(0 에러)** + `npx expo export --platform web` 성공. 데이터 레이어·화면 로직 유지.

**Git**: M2까지는 push 완료. **M3 앱 작업·홈페이지 2차는 아직 미커밋**(빌드/검증 후 커밋 예정).

## 다음 할 일 (TODO)
- [x] 홈페이지 아이콘 시스템 통일 + 교보·영풍식 정제 → 부장 감수 95/100 통과.
- [ ] **홈페이지 사용자 최종 검토** → 실사진·실통계 반영. 현재 폰목업은 토널 플레이스홀더.
- [ ] 목표① **안드로이드 APK**: `cd app && npx eas-cli login && build -p android --profile preview` (사용자 EAS 로그인 필요).
- [x] 목표④ 워치 Phase 1: `expo-location` 인앱 러닝 추적 + 통합 `Run` 스키마 완료. Phase 2 Health Connect 배선까지 완료(코드) — **실기기 dev build 검증만 남음**.
- [ ] **★ 다음 액션 — EAS dev build & 실기기 검증**: 사용자 `npx eas-cli login` → `eas build -p android --profile development`(또는 preview APK) → 폰 설치. 검증: ①GPS 라이브 트래킹 거리 정확도 ②Health Connect 설치+삼성헬스 동기화 → [워치 불러오기]로 갤럭시워치 오늘 러닝 저장 확인.
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
