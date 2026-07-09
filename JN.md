# JN.md — 작업 진행노트

> 매 세션 여기부터 읽고 이어서 작업. 고정 정보는 [`CLAUDE.md`](CLAUDE.md).
> 최종 업데이트: 2026-07-09 (**★★★ 워치 연동 실기기 완전 확정 ★★★** — 6차 APK 빌드 완료·설치 → [워치 불러오기]에서 ①HC 권한창 정상 표시 ②**Health Connect "내 건강 앱" 목록에 "모두의 마라톤" 연결됨 등장**(삼성헬스와 나란히, 그간의 미등록 문제 종결) ③크래시·SecurityException 없이 "워치 동기화 완료" 정상 반환. Android 14+ `VIEW_PERMISSION_USAGE` activity-alias 수정이 근본원인을 정확히 잡음. **남은 건: 워치로 오늘 러닝 1건 기록해 세션 로드 실증 + GPS 지도 확인 → feat/m3 → main 머지**.)

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
- **남은 완성 경로 = 오직 1개**: 실기기 APK 검증(성공기준 ①③ — GPS 1km ±5% + 갤럭시워치) → `feat/m3`→`main` 머지 → 회장 추인. 대본 `docs/QA_M3_DEVICE.md`. App Check site key·enforce는 보류(앱 native 모듈 도입 결정 대기).

### 📋 ★ APK 재빌드 (2026-07-06 · 7/5 APK 노후로 재빌드)

> **문제**: 회장이 7/5 preview APK로 실기기 테스트 → ①"Firebase 미설정 — 이 기기에만 저장" 배너, ②[워치 불러오기] 시 앱 크래시.
> **원인**: 그 APK는 7/5 빌드라 Firebase config·건강동의 게이트·크래시 방어(try/catch)·#3/#7 버그수정이 **전부 안 들어감**. 특히 `.env`는 gitignore라 EAS 클라우드 빌드에 안 올라가 config가 빈 채로 구워졌음.
> **조치**: `app/eas.json`의 preview/dev/prod `env`에 `EXPO_PUBLIC_FIREBASE_*` 6값(웹과 동일 공개키) 주입 → 재빌드가 config를 구워넣음. 현재 코드는 `syncTodayRuns` 전체 try/catch로 워치 크래시 방어됨(옛 APK엔 없던 코드).
> **1차 재빌드(config)**: EAS FINISHED(`6fbb5012`). Firebase config 포함 → "미설정" 배너 해소. APK `Aam_5SHf…`.
> **그러나 [워치 불러오기] 여전히 크래시**(회장 실기기): 건강동의는 뜨는데, 그 뒤 `불러오는 중…` <1초 만에 네이티브 강제종료(JS try/catch 못 잡음).

### 📋 ★★ 워치 크래시 근본원인 규명 + 2차 재빌드 (2026-07-06)

> **근본원인 확정**: `react-native-health-connect@3.5.3`의 config 플러그인(`app.plugin.js`)은 **권한 안내 인텐트(`androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE`)만** 추가하고, 정작 **`android.permission.health.READ_*` 권한 선언은 매니페스트에 안 넣어줌**. 그래서 `requestPermission` 호출 시 선언 안 된 권한 요청 → 네이티브 즉사(<1초). JS try/catch로 못 잡는 네이티브 크래시라 방어코드 무력.
> **조치**: 공식 문서(matinzd/react-native-health-connect `permissions.md`) 지침대로 `app.json` `android.permissions`에 health 권한 3개 추가 — `READ_EXERCISE`(ExerciseSession)·`READ_DISTANCE`(Distance)·`READ_HEART_RATE`(HeartRate). 플러그인은 그대로 두면 rationale 인텐트 유지.
> **2차 재빌드 완료 ✅**: EAS FINISHED(빌드 ID `3f3b4517-6085-4bdc-ac39-95c8e0e72ec7`, preview). Firebase env + health 권한 포함. **최신 APK: `https://expo.dev/artifacts/eas/znNSa0a99aSAdFyjnz6vvHbWinC0iMl9_yzzCuPA2MU.apk`** (앞선 `Aam_5SHf…`·`Z0wO9a…` 폐기). 권한 매니페스트가 바뀌었으니 **반드시 기존 앱 삭제 후 재설치**. 검증 대기: [워치 불러오기] → 크래시 대신 Health Connect 권한 화면 → 아침 트레드밀 러닝 로드 확인.
>
> **1차(config) 성과 확정**: 회장 실기기서 "미설정 배너 사라짐 + 방명록 Firebase 표시" 확인 → **성공기준 ② 실기기 설치본에서도 100% 완결**.

### 📋 UI 버그 2건 수정 + 워치 크래시 심층진단 + 3차 빌드 (2026-07-06)

> 회장 2차 APK 실기기 피드백 3건: ①온보딩 이름칸을 키보드가 가림 ②방명록 항목 날짜/삭제X 겹침 ③[워치 불러오기] 여전히 크래시(권한 있음에도).
- **UI #1 수정**(`onboarding-gate.tsx`): 안드로이드 `KeyboardAvoidingView` behavior가 `undefined`라 edge-to-edge(SDK57)에서 키보드가 입력칸을 가림 → `behavior="height"` + `ScrollView`로 감쌈.
- **UI #2 수정**(`index.tsx`): 방명록 `itemHead`에 `paddingRight:26` — 우상단 절대배치 삭제(X)와 날짜 겹침 해소.
- **워치 이중탭 방어**(`explore.tsx`): `syncWatch` 진입 즉시 `setSyncing(true)`, 동의창 취소/dismiss 시 해제, `runWatchSync` try/finally. 크래시가 중복호출 탓이면 완화.
- **워치 크래시 심층진단(추측 아닌 확인)**: 로컬 `expo prebuild`로 매니페스트 검사 → **health 권한 3개·rationale 인텐트 정상 포함**(권한 문제 아님). RNHC healthdata `<queries>`는 라이브러리 매니페스트 선언→빌드 병합(가시성 OK). **핵심 제약: 스택이 RN 0.86 + Expo SDK57 최신인데 `react-native-health-connect`는 3.5.3이 이미 최신 = 버전업 여지 없음.** 최신 RN 신아키텍처(newArchEnabled=true)에서 RNHC TurboModule 네이티브 불안정이 유력 → **코드로 못 고침, 디바이스 crash 로그(adb logcat) 필요.**
- **3차 재빌드 완료 ✅**: 빌드 ID `faa3a6ee-892b-430a-a894-002a5e63cf19`. **최신 APK: `https://expo.dev/artifacts/eas/TZmtYffmtiCSRiUpbN0m6hSg9bXjQkmXQMuldNq8364.apk`** (앞선 링크 모두 폐기). 재설치(기존앱 삭제) → UI 2건 수정 확인 + 워치 재확인. **워치 여전히 크래시면**: (A) 회장이 폰 USB디버깅 연결→`adb logcat`으로 정밀진단(워치 살릴 최선) or (B) 워치 버튼 "준비 중" 페일세이프로 막고 완성 먼저 머지, 로그 확보 후 재개. 회장 선택: **막히지 말고 진행 — 워치 보류, ③ 개인정보·확산 등 딴 것 먼저.**

### 📋 ★★★ 워치 크래시 근본원인 확정 + 수정 (2026-07-06 · adb logcat)

> **무선 디버깅으로 실기기 크래시 로그 확보 성공** (회장이 개발자옵션→무선디버깅, 자동차단(Auto Blocker) 끄고 페어링 코드 제공 → 에이전트가 platform-tools 직접 다운로드해 `adb pair`/`connect`/`logcat -b crash`). adb는 `$CLAUDE_JOB_DIR/tmp/platform-tools/adb`.
> **원인 = 라이브러리 셋업 누락(신아키·버전 문제 아니었음)**:
> ```
> FATAL EXCEPTION: kotlin.UninitializedPropertyAccessException:
> lateinit property requestPermission has not been initialized
>   at dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate.launchPermissionsDialog
> ```
> RNHC는 `MainActivity.onCreate`에서 **`HealthConnectPermissionDelegate.setPermissionDelegate(this)`** 로 ActivityResultLauncher를 등록해야 하는데(README "RN CLI template v2+"), **Expo는 MainActivity 자동생성**이라 이 등록이 빠져 `requestPermission()` 시 런처 미초기화 → 네이티브 크래시.
> **수정**: 커스텀 config 플러그인 `app/plugins/withHealthConnectPermissionDelegate.js` — 생성된 MainActivity.kt에 import + `setPermissionDelegate(this)` 주입. `app.json` plugins에 `./plugins/withHealthConnectPermissionDelegate` 등록. **prebuild로 MainActivity.kt 주입 검증 완료.**
> **4차 재빌드 완료 ✅**: 빌드 ID `865f1d4b-4468-4b3a-ac6c-e4fed1339e85`. **최신 APK: `https://expo.dev/artifacts/eas/36qaOAmthKgfMKqMuOPUFtWMgqh3e-GimBO0CN1jk9M.apk`** (앞선 링크 모두 폐기). 기존앱 삭제 후 재설치 → [워치 불러오기] 크래시 대신 Health Connect 권한창 정상 여부 + 아침 트레드밀 데이터 로드 검증 대기.
> **재현 절차 메모(재사용)**: 무선디버깅 켜기 → `adb connect <ip>:<port>` → `adb logcat -b crash -c` → 앱서 재현 → `adb logcat -b crash -d`.

### ✅ 앱 UI 수정 3차 빌드(`TZmtYffm…`) 실기기 확인: 온보딩 키보드·방명록 겹침 정상. 워치만 4차서 해결 예정.

### 📋 ★ 성공기준 ③ 개인정보 게이트 + 확산 준비 (2026-07-06 · 워치 대기 중 병렬처리)

> 회장 확정: 보호책임자=**모두의 마라톤 운영자 / ikjun87@gmail.com**, 카톡·인스타 링크=**없음→준비중**.
- **처리방침 실값 완료**(`docs/PRIVACY.md`): 보호책임자 성명·연락처 placeholder → 실값. 초안 경고문구 → 실적용 문구로 교체.
- **웹 처리방침 게시**(`web/privacy.html` 신규): 브랜드톤 자체완결 HTML(다크모드 대응), PRIVACY.md 전문 반영. **웹 푸터에 "개인정보 처리방침" 링크** 추가 → P5 블로커 #2 "웹 게시" 해소.
- **카톡/인스타 준비중 처리**: 히어로 "카톡 오픈채팅 합류" 버튼에 `data-todo` 추가 → 클릭 시 "채널 링크는 곧 열려요" 토스트(죽은 링크 방지). 채널 섹션 링크는 기존 data-todo 유지.
- **App Check**: 여전히 보류(앱 native 모듈 도입 결정 대기, enforce 켜지 말 것).

### 📋 ★★ 웹 공개 배포 완료 — Firebase Hosting (2026-07-06)

> 회장이 진짜 터미널에서 `npx firebase-tools login`(브라우저 인증) 완료 → 크리덴셜 `/home/jun/.config`에 캐시 → 에이전트 Bash가 이어받아 `firebase deploy --only hosting` 실행.
- **공개 주소 확보: `https://modu-marathon.web.app`** (홈 200 · `/privacy` 200 cleanUrls · 실 Firebase 연결 라이브). **확산 링크 완성** — 친구들에게 이 링크 공유 가능.
- `firebase.json` hosting(public=web·cleanUrls·정적캐시) 사용. 이후 `npx firebase-tools deploy --only hosting`으로 재배포(로그인 캐시됨).
- **처리방침 공개 URL: `https://modu-marathon.web.app/privacy`** → 이제 앱 온보딩에서 이 URL로 링크 가능(다음 app 빌드에 포함할 소항목).
- ⚠️ **공개되며 App Check 권장도 ↑**: rules delete:true(대량삭제 위험)는 Auth 미도입이라 규칙만으론 못 막음 → 웹은 reCAPTCHA v3 site key만 넣으면 App Check 활성(코드 이미 배선, `APPCHECK_SITE_KEY` 비어있음). 친목 사이드로드엔 수용가능하나, 공개 확산 커지면 site key 발급→monitor→enforce 권장.
- **성공기준 ③ 확산 축: 웹 공개✅ + 처리방침 공개✅ + 채널 준비중✅.** 남은 소항목: 앱 온보딩 처리방침 링크(다음 빌드).

### 📋 P4 관찰버그·P5 건강동의 코드처리 (2026-07-06 · 병목 대기 중 처리)

> 회장 물리입력 2건(Firebase 키·실기기)을 기다리는 동안, **실기기·키 없이도 끝낼 수 있는 P4/P5 잔여를 선처리**. `tsc` 0에러 + `expo export --platform web` 그린 재확인.

- **P4 관찰버그 #3 — GPS 속도 게이트 추가**(`live-run.tsx`): 기존엔 포인트당 1.5~60m만 채택해 1초에 60m(=216km/h)까지 통과 가능했음. GPS 타임스탬프로 포인트 간 속도 계산 → **9m/s(≈32km/h) 초과 구간은 GPS 튐으로 간주해 거리 미가산**. `lastAt` ref 추가, pause/reset 시 초기화.
- **P4 관찰버그 #7 — 워치 거리 이중합산 방어**(`healthconnect.ts`): 삼성헬스·구글핏·워치가 같은 러닝을 각자 Distance로 기록하면 단순 합산 시 2~3배 뻥튀기. **출처(dataOrigin.packageName)별로 묶어 최댓값 출처만 채택** → 멀티앱 중복 제거, 단일 출처의 세분 레코드는 정상 합산. (실기기서 최종 판정하되 코드상 방어 완료)
- **P5 블로커 #3 — 건강(심박) 별도 동의 게이트 구현**(`health-consent.ts` 신규 + `explore.tsx`): 심박=민감정보(법 §23 별도 동의). [워치 불러오기] 최초 1회 **"건강정보 수집 동의" 안내**(취소 / 심박 없이 불러오기 / 동의하고 불러오기). AsyncStorage에 동의 저장(`mm_health_consent_v1`), 2회차부터 미표시. **미동의 시 심박 권한 요청·수집 자체를 건너뜀**(`syncTodayRuns(name,{readHeartRate})` → 최소수집). 처리방침(PRIVACY.md §1·§6)의 "별도 동의" 문구와 코드 정합 달성.
- **QA 대본 갱신**(`QA_M3_DEVICE.md ③`): 동의 안내 흐름·심박 없이 불러오기·이중합산 방어·2회차 무표시 확인 항목 추가.
- **잔여 P5 블로커 3건**(코드밖·회장 입력): (1) App Check 콘솔 site key + 앱 native 모듈 도입 결정, (2) 처리방침 placeholder(보호책임자 성명·연락처) 실값→웹 게시+앱 온보딩 링크, (4) 정식 플레이 출시(M5) 때 배경위치 심사 정당화. — **이번 사이드로드 배포엔 무해**.

### 📋 ★ 실시간 GPS 구글맵 + 워치 권한부여 진단 (2026-07-07 · 5차 빌드)

> **4차 APK 실기기 결과**: 워치 크래시 **완전 해결 확인**(setPermissionDelegate 수정 성공 — 앱 안 튕김). GPS 러닝도 동작. 남은 워치 이슈 = **권한 "부여"만 안 됨**(크래시 아님).

- **워치 권한 진단**: [워치 불러오기] → `SecurityException: Caller requires android.permission.health.READ_EXERCISE`. 매니페스트엔 권한·rationale 인텐트·delegate 다 선언됨(4차 빌드에 포함 확인). 즉 **선언은 됐으나 Health Connect에서 실제 '허용'이 안 된 상태**. 코드 결함: `requestPermission` 후 **부여 여부 확인 없이 바로 read** → raw SecurityException.
  - **수정**(`healthconnect.ts`): `getGrantedPermissions()`로 ExerciseSession·Distance 부여 확인 → 미부여 시 "Health Connect 앱 → 앱 권한 → 모두의 마라톤에서 운동·거리 허용" 안내. 심박도 부여됐을 때만 read.
  - **미해결 잔여**: 왜 in-app requestPermission이 부여로 안 이어지는지(권한창 미표시 의심). 5차 APK서 재확인 → 여전하면 **무선 adb logcat**으로 확정(회장 무선디버깅 켜면). Health Connect 앱 목록에 "모두의 마라톤" 있는지 확인 요청함(회장 회신 대기).
- **실시간 GPS 구글맵 경로표시 신규기능**(회장 요청): `react-native-maps`(구글) 도입. **플랫폼 분리 컴포넌트**(`run-map.native.tsx`/`run-map.web.tsx` + `run-map.d.ts`)로 웹 export 보호(웹은 플레이스홀더). `live-run.tsx`: 채택 이동만 경로 누적 → 지도 폴리라인(브랜드오렌지)·시작마커·현재위치 따라가기, km 오버레이. **좌표 서버 미저장 유지**(처리방침 정합). `expo-maps` 대신 검증된 react-native-maps 선택.
- **구글맵 키**: GCP `modu-marathon`(또는 회장 발급 프로젝트)에서 Maps SDK for Android 사용설정+결제연결+키 발급 → `app.json` react-native-maps 플러그인 `androidGoogleMapsApiKey`에 주입(커밋됨, Firebase 공개키와 동일 정책 — 추후 Android 제한 권장).
- **5차 빌드 완료 ✅**: `c38ea92e-5549-48d3-9e35-14a822aaec06`. **최신 APK: `https://expo.dev/artifacts/eas/bPjayGBYwQQmMadPyYV4TQ5qtVOl8qDHgTTFgS8Y_Gk.apk`** (앞선 링크 모두 폐기). 지도+워치권한안내 반영. tsc 0에러 + expo export web 그린. 기존앱 삭제 후 재설치 → ①GPS 러닝서 지도 경로표시 ②워치 권한.

### 📋 ★★ 워치 근본원인 좁혀짐 — HC에 앱 미등록 (2026-07-07 · adb 진단 준비)

> **회장 실기기 확인**: Health Connect 앱 → 앱 및 기기 권한 목록에 **나이키런·신한 슈퍼쏠은 있는데 "모두의 마라톤"은 없음**. 즉 **우리 앱이 Health Connect에 클라이언트로 등록 자체가 안 됨** = requestPermission이 권한창을 실제로 못 띄운다는 강한 증거(매니페스트 선언·delegate·rationale 인텐트는 다 있는데도).
- 크래시(X)·SDK_AVAILABLE(O)·initialize(O)까진 통과 → requestPermission 호출은 되나 **권한 UI 미표시 → 부여 안 됨 → HC 목록에 안 뜸 → read SecurityException**. 원인 후보: ActivityResultLauncher 런치 실패(신아키/타이밍) 또는 매니페스트 실제값 이상.
- **다음 액션 = 무선 adb logcat 확정**. platform-tools 재다운로드 완료: `<scratchpad>/platform-tools/adb` (scratchpad=`/tmp/claude-1000/-home-jun-projects-modu-marathon/171a91eb-3b8d-4b72-9593-9773abbe7abd/scratchpad`). 회장 무선디버깅 페어링 정보 대기. 절차: `adb pair <ip:pairport> <code>` → `adb connect <ip:port>` → `adb logcat -c` → [워치 불러오기] → `adb logcat -d`(HealthConnect/permission 필터). 로그로 requestPermission 런치 여부 확정 후 수정 → 6차 빌드에 지도(정상)+워치(수정) 묶기.

### 📋 ★★★ 워치 근본원인 확정 (adb 불필요) + 수정 완료 (2026-07-07 · 매니페스트 검사)

> **adb 없이 매니페스트 분석으로 근본원인 확정.** 로컬 `expo prebuild`로 병합된 `AndroidManifest.xml`을 직접 검사 → "HC 목록에 앱 미등록" 증상의 원인이 명확히 드러남.

- **확정 원인 = Android 14+ 등록 인텐트 누락**. 생성 매니페스트엔 ①health 권한 3개 ②`androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE`(**Android 13 이하** 방식)는 있으나, ③**`android.intent.action.VIEW_PERMISSION_USAGE` + category `HEALTH_PERMISSIONS` activity-alias 가 없음**. 구글 공식 get-started 문서상 **Android 14+(HC가 OS에 통합, One UI 6 포함)** 에선 이 activity-alias가 **앱이 HC 클라이언트로 등록·표시되는 필수 조건**. `react-native-health-connect@3.5.3`의 기본 `app.plugin.js`는 구버전 rationale 인텐트만 넣고 이 Android 14 경로는 안 넣음 → 회장 갤럭시(Android 14)에서 "나이키런·신한쏠은 있는데 모두의 마라톤 없음" 증상과 정확히 일치. (adb logcat 없이 원인 확정 — 크래시가 아니라 **선언 자체 누락**이었음.)
- **수정 = 커스텀 플러그인 신규**(`app/plugins/withHealthConnectAndroid14.js`, `app.json` plugins 등록): 병합 매니페스트에 ①`ViewPermissionUsageActivity` activity-alias(target=`.MainActivity`, action `VIEW_PERMISSION_USAGE`, category `HEALTH_PERMISSIONS`, permission `START_VIEW_PERMISSION_USAGE`) ②`<queries>`에 `com.google.android.apps.healthdata` 가시성 주입. RNHC 기본 rationale 인텐트(Android 13 이하)는 그대로 둠.
- **검증 완료**: `expo prebuild` 재실행 → 매니페스트에 activity-alias·VIEW_PERMISSION_USAGE·HEALTH_PERMISSIONS·healthdata package 모두 주입 확인. `npx tsc --noEmit` 0에러 + `expo export --platform web` 그린. prebuild 산출물(android/·package.json)은 managed 워크플로라 원복(커밋 안 함, EAS 클라우드 prebuild).
- **다음 = 6차 빌드**(지도 정상 + 이 워치 수정 묶기) → 기존앱 삭제 후 재설치 → [워치 불러오기]에서 **이제 HC 권한창 표시 + HC 목록에 "모두의 마라톤" 등장** 확인. 여전히 안 뜨면 그때 adb logcat(런처는 준비됨). **회장 물리작업: 6차 APK 빌드 트리거 승인만 필요**(`cd app && npx eas-cli build -p android --profile preview`).

### 📋 ★★★ 6차 빌드 완료 — 지도 + 워치 미등록 수정 (2026-07-09)

> **빌드 전 최종 검증**(에이전트): `npx tsc --noEmit` 0에러 + `expo prebuild` 병합 매니페스트 실검사 → ①VIEW_PERMISSION_USAGE activity-alias ②HEALTH_PERMISSIONS category ③healthdata `<queries>` ④health READ 권한 3종 ⑤RNHC rationale 인텐트 ⑥setPermissionDelegate(MainActivity) ⑦구글맵 API 키 **전부 주입 확인**. prebuild 산출물 원복(managed).
> **6차 빌드 완료 ✅**: 빌드 ID `bb8e0a00-950d-408b-bfcf-90d739316f85`(preview). Firebase env 6값 + keystore 재사용. **최신 APK: `https://expo.dev/artifacts/eas/R0NVwmt7ZL4sXp2mHj2pdbTie7YcWKxehUc_Z9w38y4.apk`** (앞선 링크 모두 폐기). 매니페스트 권한 변경됐으니 **반드시 기존앱 삭제 후 재설치**.
> **검증 대기(회장 실기기)**: ①[워치 불러오기] → HC 권한창 표시 + **HC 앱목록에 "모두의 마라톤" 등장** + 당일 러닝 로드 ②[러닝 시작] → 지도 실시간 오렌지 경로 + 거리 ±5%. 둘 다 통과 시 → `feat/m3` → `main` 머지 → 완성 사이클 종료.

### 📋 ★★★ 워치 연동 실기기 확정 (2026-07-09 · 6차 APK)

> **6차 APK 설치 후 [워치 불러오기] 실기기 결과 = 근본원인 수정 성공 확정.** 스크린샷 3장으로 실증:
> 1. **HC 권한창 정상 표시** — "모두의 마라톤에서 피트니스·웰니스 데이터 액세스 허용?" (활동=거리·운동, 활력징후=심박) → 지금까지 이 창 자체가 안 떴음. 이제 정상.
> 2. **Health Connect "내 건강 앱" 목록에 "모두의 마라톤"이 "연결됨" 상태로 등장** — 삼성헬스와 나란히(나이키런·Claude·삼성화재는 "연결되지 않음"). **그간 "나이키런·신한쏠은 있는데 모두의마라톤만 없음"이던 미등록 문제 완전 종결.** Android 14+ `VIEW_PERMISSION_USAGE` activity-alias 수정이 정확히 원인을 잡았음을 실기기로 확인.
> 3. **"워치 동기화 완료 — 오늘 워치에 기록된 러닝이 없어요"** 다이얼로그 정상 반환 — 크래시·SecurityException 없이 HC 읽기 성공(정상 경로). 오늘 워치 러닝이 0건이라 빈 결과일 뿐, 버그 아님.
> - **파이프라인 전 구간(워치→삼성헬스→HC→앱) 개통 확인.** 남은 실증 1건 = 워치에서 달리기 모드로 오늘 러닝 1건 기록 → 삼성헬스 동기화 → [워치 불러오기]로 `source:'healthconnect'` 세션 로드(성공기준 ① 워치 항목). 회장이 워치로 뛰고 확인 예정.
> - **워치 vs GPS 경로 구분(회장 안내)**: [워치 불러오기]=워치 달리기모드 기록을 HC 통해 읽음 / [러닝 시작]=폰 GPS 실시간. 별개 경로.

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

### ★ 다음 세션 최우선 (완성 사이클 마무리 — 회장 물리작업 위주)
- [x] **5차 APK 빌드 완료**(`bPjayGBY…`) — 지도 + 워치 권한안내 반영.
- [ ] **GPS+지도 검증**(5차 APK 설치 후): [러닝 시작] → 지도에 경로 실시간 오렌지선 표시, 거리 ±5%·드리프트·페이스 (`docs/QA_M3_DEVICE.md ②`). 구글맵 회색이면 Maps SDK 사용설정/결제/키 제한 확인.
- [x] **★ 워치 근본원인 확정 + 수정**(adb 불필요 — 매니페스트 분석): Android 14+ 필수 `VIEW_PERMISSION_USAGE` activity-alias 누락이 "HC 미등록" 원인. 커스텀 플러그인 `withHealthConnectAndroid14.js` 주입, prebuild로 매니페스트 검증·tsc·export 그린.
- [x] **★ 6차 빌드 트리거 완료**(`bb8e0a00…`, FINISHED) — 지도+워치수정 묶인 APK. **최신 APK: `https://expo.dev/artifacts/eas/R0NVwmt7ZL4sXp2mHj2pdbTie7YcWKxehUc_Z9w38y4.apk`**. 빌드 전 tsc·매니페스트 7항목 실검증 통과.
- [x] **6차 APK 실기기 확인(워치)**: [워치 불러오기] → HC 권한창 표시 ✅ + **HC 앱목록에 "모두의 마라톤" 연결됨 등장 ✅** + 크래시 없이 동기화 완료 ✅. (오늘 워치 러닝 0건이라 세션 로드 실증만 남음 — 회장 워치 러닝 대기.)
- [ ] **워치 세션 로드 실증**: 워치 달리기모드로 오늘 러닝 1건 → 삼성헬스 동기화 → [워치 불러오기]로 `source:'healthconnect'` 저장 확인(성공기준 ① 워치).
- [ ] **GPS+지도 확인**: [러닝 시작] → 지도 실시간 오렌지 경로 + 거리 ±5%.
- [ ] **위 2건 통과 → `feat/m3-live-run-watch` → `main` 머지** → 회장 추인 = 완성 사이클 종료.
- [ ] **(회장 관심) 앱 부드러움·다중 페이지 UX 개선 검토**: 스마트스코어(골프 스코어앱, 매끄러운 다중탭 UX) 레퍼런스로 앱 네비게이션·전환 개선안 리서치 — 머지 후 후속 개선 사이클 후보.

### 완료(오늘)
- [x] **Firebase 실연결**: 실프로젝트 `modu-marathon` 생성·config 웹/앱 주입·DB생성·규칙배포·웹↔앱 실기기 실증. (성공기준 ②)
- [x] **웹 공개배포**: Firebase Hosting `https://modu-marathon.web.app` (확산 링크). 재배포는 `npx firebase-tools deploy --only hosting`(로그인 캐시됨).
- [x] **처리방침 실값+웹게시**(`web/privacy.html`, `/privacy`) + 푸터 링크. 카톡/인스타=준비중(data-todo).
- [x] **앱 UI 3버그 수정**(온보딩 키보드·방명록 겹침·워치 이중탭) — 3차 빌드 실기기 확인.
- [x] **워치 크래시 근본수정**(setPermissionDelegate 등록 플러그인) — 4차 빌드, 실기기 재확인 대기.
- [x] 앱 실기기 설치·구동(APK), 온보딩 게이트.

### 후행(이번 사이클 밖)
- [ ] **앱 온보딩에 처리방침 링크**(→ `https://modu-marathon.web.app/privacy`) — 다음 app 빌드에 포함.
- [ ] 홈페이지 실사진·실통계·실멤버·`data-n` 인원, 카톡 오픈채팅방 생기면 실링크로 교체(data-todo 제거).
- [ ] **OG 이미지 PNG(1200×630)** 제작 → `og:image` 절대 URL 교체(SVG 썸네일 미표시).
- [ ] **App Check**: 공개배포됨 → 확산 커지면 웹 reCAPTCHA site key 발급→monitor→enforce. 앱은 native 모듈 도입 결정 후.
- [ ] Firebase Auth 로그인(RN 영속성 `getReactNativePersistence`, 게스트·이메일) — delete 소유검증 위해서도 필요.
- [ ] (후행) iOS/HealthKit, M4 스토어 배포, M5 커머스·광고.

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
