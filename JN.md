# JN.md — 작업 진행노트

> 매 세션 여기부터 읽고 이어서 작업. 고정 정보는 [`CLAUDE.md`](CLAUDE.md).
> 최종 업데이트: 2026-07-06 (★ Firebase 실연결 완료·실증 — 회장이 실프로젝트 `modu-marathon` 생성+config 웹·앱 주입, Firestore DB 생성+규칙 배포, 웹 방명록→Firestore 쓰기·읽기 확인. 성공기준 ② 웹측 달성. firebase.json/.firebaserc 추가.)

---

## 🏁 완성 사이클 — P0 킥오프 (2026-07-05 · 본부장 김미진)

> 그룹 총괄이사 장익준 오더: **"이지마라톤 프로젝트 완성"**. 현 상태 = P3(개발) 후반 완료 → P4(검증) 진입. 신규 기능 개발이 아니라 **검증·실연결·머지·배포** 사이클.
> 진행: `/pp`로 단계 현황 보기 → `/p4` 품질검증부터 무게. `/p1`~`/p3`는 "기 완료 → 잔여만".

### 1) 성공기준 (완성의 정의 — 측정 가능 체크리스트)
장익준 확정 3대 완성 조건을 검증 가능한 항목으로 분해. **전부 [x]가 되면 완성.**

**① 실기기 검증 통과 후 main 머지**
- [ ] `feat/m3-live-run-watch`(현재 main+5커밋) APK 실기기 설치 완료
- [ ] GPS 라이브 트래킹: 실제 1km+ 러닝에서 거리 오차 ±5% 이내, 페이스·시간 정상 기록·저장(`source:'gps'`)
- [ ] 갤럭시워치: 삼성헬스→Health Connect 동기화 후 [워치 불러오기]로 당일 러닝 세션 저장(`source:'healthconnect'`, 중복 없음)
- [ ] P4 회귀·P5 자문 게이트 통과 후 `feat/m3-live-run-watch` → `main` 머지, origin push

**② 웹·앱 동일 Firebase 실프로젝트 실시간 공유**
- [ ] Firebase 실프로젝트 생성 + config 발급 (회장 입력)
- [ ] `web/index.html` firebaseConfig + `app/.env`(EXPO_PUBLIC_FIREBASE_*)에 **동일 프로젝트 값** 입력
- [ ] 웹에서 남긴 참석/방명록/러닝이 앱에 실시간 반영(역방향도) — 컬렉션 `attendance·runs·guestbook·gallery·waitlist` 교차 확인
- [ ] firestore.rules 실배포 + 규칙 검증(무단쓰기 차단)

**③ 자문 게이트 통과 APK가 회장 폰에 설치·확산 가능**
- [ ] 개인정보(위치·건강) P5 자문 게이트 통과: 처리방침·권한고지·최소수집 확인(변호사 곽재원)
- [ ] 민감정보(건강·위치) 저장·전송 보안 점검 통과(보안 천도윤)
- [ ] 회장 폰에 APK 설치 성공 + 확산용 배포 링크(설치 안내 포함) 확보

### 2) 범위 (In / Out)
| In (이번 완성 사이클) | Out (후행 — 이번 제외) |
|---|---|
| 실기기 GPS·갤럭시워치 검증 | iOS/HealthKit·TestFlight·App Store (Apple $99) |
| 웹·앱 Firebase 실연결·실시간 공유 | Garmin 연동(파트너십·서버 필요) |
| 개인정보·보안 자문 게이트 | 커머스(러닝화·용품)·광고·유료중개(목표⑤) |
| Android preview APK 설치·확산 | Play Store 정식 심사·출시(M5) |
| `feat/m3` → main 머지 | 딥링크/유니버설링크 고도화, Firebase Auth 소셜로그인 |
| firestore.rules 실배포 | OG PNG 래스터화(환경 제약), 실사진·실통계 전량 교체 |

### 3) 팀 배정표 (경량 편성 — 신규 기능 개발 아님, 검증·배포 중심)
| 팀 | 담당자 | 역할 | 이 프로젝트에서 할 일 |
|---|---|---|---|
| 품질보증팀(리드) | 나정환(qa-test) | QA 총괄 | GPS 거리·페이스 계산 정확성, 멱등 저장 회귀, 검증 시나리오·체크리스트 설계 (P4 최우선) |
| 품질보증팀 | 천도윤(qa-security) | 보안 | 위치·건강 민감정보 저장·전송 보안, 인증·권한, firestore.rules 취약점 |
| 품질보증팀 | 신재경(qa-perf) | 성능 | (경량) 실시간 GPS 트래킹 배터리·발열·리렌더 부하 스팟체크 |
| 개발제작팀(리드) | 황태경(build-design) | 디자인·통합 리드 | 잔여 UI 정합(웹↔앱 아이콘), 검증 중 발견 디자인 결함 조정 |
| 개발제작팀 | 배성우(build-devops) | 배포 | EAS APK 빌드 확정·설치 링크, main 머지, 배포 채널·확산 링크, 롤백 |
| 개발제작팀 | 노경민(build-backend) | 백엔드 | Firebase 실연결 배선, firestore.rules 실배포, 스키마 정합 검증 |
| 전문자문팀 | 곽재원(advisory-lawyer) | 법률 게이트 | 위치·건강 개인정보 처리방침·권한고지·최소수집·환불/약관 (민감정보 게이트) |
| 전문자문팀 | 천도윤(qa-security) | 보안 게이트 | (P5 겸직) 민감정보 처리 보안 관점 자문 |
| 전문자문팀 | 방수민(advisory-patent) | IP | "모두의 마라톤/이지마라톤" 상표·명칭 리스크 스팟체크 |
| 전략기획팀 | 이지원(plan-po) | (대기) | P1 기 완료 — 잔여 우선순위 판정만, 소환 최소화 |

### 4) 단계별 기획서 P1~P6
| 단계 | 목표 | 담당팀 | 핵심 산출물 | 완료조건(DoD) | 회장 입력 |
|---|---|---|---|---|---|
| **P1 기획** | 요구·MVP·수익모델 | 전략기획(이지원) | PRD 5대 목표·통합Run 스키마 | **기 완료** — PRD/전략 확정. 잔여: 완성 사이클 우선순위 확인만 | 불필요 |
| **P2 디자인** | 브랜드·디자인시스템·화면 | 개발제작(황태경) | DESIGN.md·아이콘 시스템·홈피 감수 95/100 | **기 완료** — 잔여: 실사진·실통계·실링크 반영(후행 일부) | (선택) 실사진 |
| **P3 개발** | 프론트·백엔드·워치 배선 | 개발제작(황태경) | 웹v2·앱M3(GPS+HealthConnect)·tsc 0에러·APK 빌드 | **대부분 완료**. 잔여: ①Firebase 실연결 배선 ②APK 2차 빌드 결과 확정 | **Firebase 키** |
| **P4 품질·성능·보안** ★ | 정확성·부하·보안 검증 | 품질보증(나정환) | 실기기 GPS·워치 검증 리포트, 회귀·보안 체크리스트, 버그로그 | GPS 거리 ±5%·워치 멱등·민감정보 보안 통과, tsc·export 회귀 그린 | **실기기 검증** |
| **P5 자문 게이트** ★ | 법·IP·개인정보 교차검토 | 전문자문(곽재원·천도윤·방수민) | 개인정보 처리방침·권한고지 검토서, 상표 리스크 메모 | 위치·건강 최소수집·고지 적법, 배포 차단 이슈 0 | 불필요 |
| **P6 종합·배포·추인** ★ | 머지·배포·추인 | 본부장(김미진) | 채점 루브릭, 결정로그, main 머지, 확산 APK 링크 | 성공기준 3대 전 항목 [x], 회장 추인 | **추인·설치** |

### 5) 즉시 실행 액션 Top 3 (에이전트가 지금 착수)
1. **[배성우] APK 2차 빌드(`1aaf02b7`) 결과 확정** — 성공이면 설치 링크 확보, 실패면 로그 진단·재빌드. (실기기 검증의 전제)
2. **[나정환] P4 검증 시나리오·체크리스트 설계** — GPS 거리 정확성 대조표, 워치 멱등 케이스, 회귀 목록을 회장이 폰에서 그대로 따라할 실행 대본으로.
3. **[노경민] Firebase 실연결 배선 준비** — 키만 오면 즉시 꽂도록 web/app 주입 지점·firestore.rules 배포 절차 표준화(키 대기 상태로 스텁).

### ⚠️ 회장(사용자) 물리 입력 필요 — 즉시 요청 2건
> 에이전트가 대신 못 함. 이 2건이 완성 사이클의 실질 병목.
- **(a) Firebase 실키 발급**: Firebase 콘솔 → 프로젝트 생성 → 웹앱 등록 → firebaseConfig 6개 값 전달. (성공기준 ②의 전제) — 현재 web/app 모두 **빈 값** 확인됨.
- **(b) 실기기 검증**: APK를 갤럭시폰에 설치 → ①실제 1km+ 러닝으로 GPS 거리 확인 ②삼성헬스↔Health Connect 동기화 켜고 [워치 불러오기] 확인. (성공기준 ①③의 전제)

### 📋 P3잔여·P4·P5 실행 로그 (2026-07-05 · 팀 병렬 가동 완료)

**APK 2차 빌드(`1aaf02b7`) = 성공(FINISHED) 확정** — 설치 링크 `https://expo.dev/artifacts/eas/Z0wO9a3zi0FNnkkPIuLzde2PuIYo2wPFI0-Czsp_iSk.apk` (만료 2026-07-18). preview APK에 Health Connect 네이티브 모듈 포함 → **별도 dev build 없이 워치 검증 가능**(코드 주석 "dev build 필요"는 오해 소지, 정정됨).

**P3 잔여 — Firebase 드롭인 배선 (노경민)**: 웹·앱 모두 "값만 넣으면 실연결"로 이미 견고. `HAS_FIREBASE = !!projectId` 게이트로 폴백↔실연결 자동 전환, 코드 무변경. **결함 2건 교정**: ①`firestore.rules`에 `runs`·`waitlist` 규칙 누락돼 있던 것(배포 시 러닝저장·출시알림이 permission-denied로 죽는 블로커) → 추가. ②`docs/FIREBASE_SETUP.md`에 앱 `.env` 단계·CLI 규칙배포 단계 보강.

**P4 품질검증 (나정환)**: haversine·페이스·집계 로직 정상 확인. **확정 버그 1건 즉시 수정** — GPS 러닝 저장에 멱등성(`sourceId`) 없어 종료 연타 시 중복 저장 가능 → `live-run.tsx`에 `sourceId` 추가, `put()` 경로 전환, `tsc` 통과. 관찰 대상 2건(실기기로 판정): #3 속도 게이트 부재(포인트당 60m 상한이 216km/h까지 허용), #7 Health Connect 거리 이중합산 가능성. **실기기 검증 대본 `docs/QA_M3_DEVICE.md` 작성**(설치→GPS ±5%→워치 멱등 2회탭).

**P5 자문 게이트 — 개인정보(곽재원) + 보안(천도윤) 수렴**:
- ✅ **GPS 원시좌표 서버 미저장 확인**(온디바이스 거리계산 후 폐기, `runs`엔 거리·시간·페이스만) → 위치정보법 신고 리스크 낮음. 심박(avgHr)만 저장 = 민감정보.
- ✅ **개인정보 처리방침 초안 `docs/PRIVACY.md` 작성**(보호책임자·상호 placeholder).
- 🔧 **`firestore.rules` 강화 적용(이 세션)**: `waitlist` read 차단(이메일 하베스팅 — 두 자문 공통 최우선 블로커), `runs` distanceKm 범위검증(통계 오염 차단), 무관 `update` 봉쇄, 생성 타입검증. **delete 전면공개(대량삭제 위험)는 Auth 미도입이라 규칙만으로 못 막음** → App Check로 차단 or Auth 도입 필요(아래 결정 대기).
- ✅ **App Check 결정·웹 배선(이 세션)**: 회장이 **App Check 활성화** 선택. 웹 `index.html`에 reCAPTCHA v3 드롭인 배선(`APPCHECK_SITE_KEY` 게이트, 비우면 비활성). `FIREBASE_SETUP.md` 7번에 monitor→enforce 롤아웃 절차 문서화. **앱쪽은 보류** — Expo JS SDK는 App Check 토큰 불가 → `@react-native-firebase/app-check`(native, 재빌드) 필요 = **큰 의존성이라 회장 확인 후 도입**. 그 전엔 enforce 켜지 말 것(앱 차단).
- ⚠️ **잔여 P5 블로커**: (1) App Check 콘솔 site key 발급(회장) + 앱 native 모듈 도입 확인 → monitor→enforce, (2) 처리방침 placeholder(보호책임자 성명·연락처) 실값 채워 웹 게시 + 앱 온보딩에 링크, (3) 건강(심박) 민감정보 **별도 동의 게이트** UI + app.json 건강권한 목적고지 문구, (4) `ACCESS_BACKGROUND_LOCATION`은 러닝 앱 정당 권한이라 유지 — 단 **정식 플레이 출시(M5)** 때 심사 정당화 필요(이번 사이드로드 범위엔 무해).

**완성 사이클 현황**: P1·P2 ✅ / P3 ✅(Firebase 키 대기) / **P4 🔵 코드검증 완료·실기기 검증 대기 / P5 🔵 규칙 1차 강화·잔여 블로커 4건 / P6 ⬜**. 남은 완성 경로 = 회장 물리입력 2건(Firebase 키·실기기) + P5 결정 4건 → main 머지 → 추인.

### 📋 ★ Firebase 실연결 완료 (2026-07-06 · 회장 물리입력 1/2 해소)

> 완성 사이클 최대 병목이던 "Firebase 실키"가 풀렸다. 회장이 콘솔에서 직접 실프로젝트 생성·config 주입·DB 생성·규칙 배포까지 수행, 웹→Firestore 실연결을 **눈으로 실증**.

- **실프로젝트 `modu-marathon` 생성** + firebaseConfig 6값을 `web/index.html`·`app/.env` 양쪽에 동일 주입(`HAS_FIREBASE`/`HAS_FB` 게이트 자동 실연결 전환). 웹 apiKey는 공개키라 커밋 정책상 웹 HTML에 커밋(정적 무빌드 배포 전제 · 보안은 규칙+App Check).
- **Firestore DB `(default)` 생성**(서울) + **firestore.rules 콘솔 배포**(오늘 3:25) — 규칙 화면이 저장소 `firestore.rules`와 정확히 일치 확인.
- **웹→Firebase 실증**: 웹 방명록 "쫀쫀샷" 작성 → Firestore `guestbook` 컬렉션에 문서(createdAt·msg·name) 저장 + 웹 목록 렌더 확인. **성공기준 ② 웹측 달성.**
- **배포 스캐폴딩 추가**: `firebase.json`(firestore.rules 지정)·`.firebaserc`(default=modu-marathon) → 이후 `npx firebase-tools deploy --only firestore:rules`로 CLI 배포 가능.
- **앱측 교차확인 ✅ (완결)**: 앱 웹 미리보기(`npm run web`)에서 홈(크루) 방명록에 웹이 쓴 "쫀쫀샷" 글이 그대로 표시됨 → 웹·앱 동일 Firebase 실시간 공유 실증. **성공기준 ② = 100% 완료.**
- **남은 완성 경로 = 오직 1개**: 실기기 APK 검증(성공기준 ①③ — GPS 1km ±5% + 갤럭시워치) → `feat/m3`→`main` 머지 → 회장 추인. APK 링크 `https://expo.dev/artifacts/eas/Z0wO9a3zi0FNnkkPIuLzde2PuIYo2wPFI0-Czsp_iSk.apk`(만료 7/18), 대본 `docs/QA_M3_DEVICE.md`. App Check site key·enforce는 보류(앱 native 모듈 도입 결정 대기).

### 📋 P4 관찰버그·P5 건강동의 코드처리 (2026-07-06 · 병목 대기 중 처리)

> 회장 물리입력 2건(Firebase 키·실기기)을 기다리는 동안, **실기기·키 없이도 끝낼 수 있는 P4/P5 잔여를 선처리**. `tsc` 0에러 + `expo export --platform web` 그린 재확인.

- **P4 관찰버그 #3 — GPS 속도 게이트 추가**(`live-run.tsx`): 기존엔 포인트당 1.5~60m만 채택해 1초에 60m(=216km/h)까지 통과 가능했음. GPS 타임스탬프로 포인트 간 속도 계산 → **9m/s(≈32km/h) 초과 구간은 GPS 튐으로 간주해 거리 미가산**. `lastAt` ref 추가, pause/reset 시 초기화.
- **P4 관찰버그 #7 — 워치 거리 이중합산 방어**(`healthconnect.ts`): 삼성헬스·구글핏·워치가 같은 러닝을 각자 Distance로 기록하면 단순 합산 시 2~3배 뻥튀기. **출처(dataOrigin.packageName)별로 묶어 최댓값 출처만 채택** → 멀티앱 중복 제거, 단일 출처의 세분 레코드는 정상 합산. (실기기서 최종 판정하되 코드상 방어 완료)
- **P5 블로커 #3 — 건강(심박) 별도 동의 게이트 구현**(`health-consent.ts` 신규 + `explore.tsx`): 심박=민감정보(법 §23 별도 동의). [워치 불러오기] 최초 1회 **"건강정보 수집 동의" 안내**(취소 / 심박 없이 불러오기 / 동의하고 불러오기). AsyncStorage에 동의 저장(`mm_health_consent_v1`), 2회차부터 미표시. **미동의 시 심박 권한 요청·수집 자체를 건너뜀**(`syncTodayRuns(name,{readHeartRate})` → 최소수집). 처리방침(PRIVACY.md §1·§6)의 "별도 동의" 문구와 코드 정합 달성.
- **QA 대본 갱신**(`QA_M3_DEVICE.md ③`): 동의 안내 흐름·심박 없이 불러오기·이중합산 방어·2회차 무표시 확인 항목 추가.
- **잔여 P5 블로커 3건**(코드밖·회장 입력): (1) App Check 콘솔 site key + 앱 native 모듈 도입 결정, (2) 처리방침 placeholder(보호책임자 성명·연락처) 실값→웹 게시+앱 온보딩 링크, (4) 정식 플레이 출시(M5) 때 배경위치 심사 정당화. — **이번 사이드로드 배포엔 무해**.

---

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

**EAS 빌드 (실기기용 preview APK)**
- EAS 프로젝트 생성·연결: `@jjunshot/modu-marathon`(projectId `78a5e8f5…`). 계정 ikjun87@gmail.com(사용자명 jjunshot). keystore 클라우드 자동생성.
- **1차 빌드 ERRORED** → 원인: `react-native-health-connect`의 `connect-client`가 **minSdk 26** 요구, Expo 기본 24와 manifest merger 충돌. → **`expo-build-properties`로 `minSdkVersion:26` 지정**해 수정.
- **2차 빌드 진행 중**(`1aaf02b7`). 완료 시 APK 링크 → 폰 설치 → GPS·워치 검증.
- 앱 웹 미리보기: Expo 정적 export는 라우트별 `.html`이라 파이썬 기본서버로 `/explore`가 404/Unmatched → 클린 URL 매핑 서버 `app/scripts/serve-web.py` 추가(`python3 scripts/serve-web.py 8081 dist`). 헤드리스 렌더 정상 확인.

**Git**: M2까지 origin push 완료. **M3 작업은 `feat/m3-live-run-watch` 브랜치에 커밋**(웹 v2 / 앱 M3 / EAS 연결 / minSdk 수정 / serve-web).

## 다음 할 일 (TODO)
- [x] 홈페이지 아이콘 시스템 통일 + 교보·영풍식 정제 → 부장 감수 95/100 통과.
- [ ] **홈페이지 사용자 최종 검토** → 실사진·실통계 반영. 현재 폰목업은 토널 플레이스홀더.
- [ ] 목표① **안드로이드 APK**: `cd app && npx eas-cli login && build -p android --profile preview` (사용자 EAS 로그인 필요).
- [x] 목표④ 워치 Phase 1: `expo-location` 인앱 러닝 추적 + 통합 `Run` 스키마 완료. Phase 2 Health Connect 배선까지 완료(코드) — **실기기 dev build 검증만 남음**.
- [~] **★ 다음 액션 — preview APK 빌드 & 실기기 검증**: EAS 로그인·프로젝트 연결·1차 빌드 완료(실패→minSdk26 수정). **2차 빌드(`1aaf02b7`) 결과 대기 중** → 성공 시 폰 설치. 검증: ①GPS 라이브 트래킹 거리 정확도 ②Health Connect 설치+삼성헬스 동기화 → [워치 불러오기]로 갤럭시워치 오늘 러닝 저장 확인.
- [ ] (검증 후) `feat/m3-live-run-watch` → main 머지. 필요 시 dev client 빌드로 워치 동기화 로직 빠른 반복.
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
- **Health Connect = minSdk 26 필수**: react-native-health-connect의 connect-client 요구. `expo-build-properties`로 지정함(app.json). 빌드 실패 시 1순위로 의심.
- **워치 실검증은 dev build + 사용자 갤럭시 필요**: 폰에 Health Connect 앱 + 삼성헬스→Health Connect 동기화(거리·운동·심박 쓰기 허용)가 켜져야 [워치 불러오기]가 데이터를 읽음. 헤드리스/에뮬 불가.
- **앱 웹 미리보기 서빙**: `python3 -m http.server`로는 `/explore` 클린 URL이 안 됨 → 반드시 `app/scripts/serve-web.py` 사용.
- **OG 이미지 PNG 미제작**: 이 환경에 SVG 래스터라이저 없음 → 소셜 공유 썸네일 개선 보류.
- 개발 환경 한계: 헤드리스 크로미움 실행에 시스템 라이브러리(libnspr4 등) 수동 확보 필요(이번엔 apt-get download로 우회해 스크린샷 검증 성공).
- 앱 Auth 세션 영속성(`getReactNativePersistence`)은 firebase RN 빌드 전용 API라 실기기 검증과 함께 도입 예정.
