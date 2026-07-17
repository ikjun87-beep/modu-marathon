# JN.md — 작업 진행노트

> 매 세션 여기부터 읽고 이어서 작업. 고정 정보는 [`CLAUDE.md`](CLAUDE.md).
> 최종 업데이트: 2026-07-17 **세션2** (**🔓 Auth 병목 해소 + 15차 APK 실기기 검증 + 👻 유령 참석자 버그 수정 + ⌚ 워치 결론 뒤집힘** — 브랜치 `feat/p7-2-shared-motion`. ①**Firebase Auth 활성화**(회장이 콘솔에서 익명+이메일 켬) → REST 프로브로 토큰 발급 실증 → **실기기서 게스트 로그인·재시작 후 유지까지 확인**(에이전트가 adb로 직접). ②**15차 로컬 APK 빌드·설치·검증**(07-15 수정분 전부 포함 확인: 러너네임·처방침링크·홍길동). **개명 전파 실증**(참석 1건 TESTRUN→TESTRUN2, 테스트데이터 삭제완료). ③**신규 버그 발견·수정**(커밋 `258b85d`): 개명이 다른 탭에 반영 안 돼 **유령 참석자** 발생 → `session.ts`를 구독형으로(`useMyName()`), 6개 화면 교체. **16차 APK 필요**. ④**⌚ 워치 = 우리 07-09 결론이 틀렸을 가능성 높음** — HC에 **"운동"·"총 칼로리" 항목이 생겨 있음**(07-09엔 없었음) + 삼성헬스가 **7.00.5.009 = 수정된 버전**. **회장이 워치로 걷기 1회 완료·종료함 → 검증 직전에 adb 끊겨 미확인.** ⑤ **회장 대형 비전 제시**(당근 모임식 채팅·챌린지·투표·모임운영+웹연동, 아기자기함/게임화, 케이던스) → 아래 `📋 다음 세션` 참조.<br>이전(2026-07-17 세션1): (**🚀 XSS 수정 라이브 배포 완료** — 회장 승인 후 `deploy --only hosting,firestore:rules` 실행, 라이브 스모크 8항목 통과(악성 gallery·필드주입·거리파괴 전부 DENIED / 정상 쓰기 전부 통과). **갤러리 저장형 XSS 라이브 차단 완료.** ⚠️ **남은 병목 = 회장 물리작업 2건**: ①Firebase 콘솔 → Authentication 시작하기(REST 프로브 07-17 재확인 = 여전히 `CONFIGURATION_NOT_FOUND`, **재빌드 불필요**) ②14차 APK 실기기 확인.<br>이전(2026-07-15): (**🛡️ 적대적 코드검토 4병렬 → 실사용 결함 개선 + 🔐 온보딩 처리방침·웹 익명로그인 기반** — 브랜치 `feat/p7-2-shared-motion`. 이번 세션: ①**회장 물리병목 재확인** — Firebase Auth 콘솔이 여전히 안 켜짐(REST 프로브 `CONFIGURATION_NOT_FOUND`). 켜면 **재빌드 없이** 앱·웹 로그인 동작. ②**온보딩 첫화면 처리방침 고지·링크**(openBrowserAsync, 후행TODO 해소) ③**웹 익명로그인 기반**(각 브라우저 uid 부여·`withUid`로 4개 쓰기에 곁들임, **규칙 무변경·100% 뒤로호환**, 소유기반 규칙의 발판, **배포 보류**) ④**적대적 검토 4렌즈 병렬**(보안규칙·앱크래시·GPS통계·웹퍼널) → 실사용 결함만 개선: **[치명] 갤러리 저장형 XSS**(`g.image`만 미이스케이프 → 누구나 문서 하나로 방문자 전원 코드실행 → **이중차단**: 렌더단 esc+data:image/게이트 + 규칙단 `matches('data:image/.*')`), **GPS 거리정확성 3건**(속도게이트 dt≤0 → 전구간 0km·유령거리 / 고정60m상한이 신호끊긴 뒤 정상구간 폐기 → 속도기준 대체 / 저장실패 후 트래킹 사망한 채 '계속' 노출 → `armTracking()` 추출해 되살림), **수동입력 더블탭 이중집계**(in-flight 락+disabled), **데모 이름충돌 통계오염**(개인집계서 `demo_` 제외 `mineOf`, 플레이스홀더 "김캡틴"→"홍길동"), **규칙 개방축소**(guestbook/runs update — 남의 러닝 0으로 지워 리더보드 파괴·필드주입 차단), **웹 쓰기 try/catch**. **일부러 안고침(의도적)**: delete개방·작성자명 사칭(Auth전 규칙만으론 불가) / 워치HC dedup 엣지(삼성한계로 휴면). tsc·export·웹문법 그린. 커밋 `82c3fd5`·`68bdfd9`·`4cbd9f2`·`3e1c97f`(+마감). **미머지**(브랜치). ⚠️ **XSS 수정은 라이브 반영에 배포 필요**(`firebase deploy --only hosting` + `--only firestore:rules`) — **회장 배포 승인 대기**. 앱 변경분은 다음 로컬 APK 빌드에 반영. 워치=삼성 플랫폼한계 재확인(우리 코드 정상).<br>이전(2026-07-13): (**🌊 블루 앱아이콘 + 🔐 Firebase Auth + 💥 앱 즉사 크래시 근본수정 + 🏷️ 러너 네임 개명 전파 + 🔨 로컬 APK 빌드 전환** — 브랜치 `feat/p7-2-shared-motion`. 이번 세션: ①**앱 아이콘 Azure Blue**(AI 재디자인 실패 → 기존 흰 러너 알파 역산 재합성 + 골드 스피드라인 = **D안**) ②**Firebase Auth**(게스트·이메일, RN 영속성) ③**12차 APK 실기기 즉사** → adb logcat으로 **`Component auth has not been registered yet`** 확정 → 원인=**firebase v10 × Metro package exports(dual-package hazard)** → `metro.config.js`로 해석 교정 + 초기화 페일세이프 → **13차에서 실행 검증**(에이전트가 adb로 직접 설치·기동) ④**러너 네임 개명 전파**(과거 글·참석·러닝·댓글 이름까지 batch 갱신, `identity.saveRunnerName` 단일 경로, rules `isRenameOnly()` 배포) + "내 이름"→**"러너 네임"** ⑤**웹 공개사이트 블루 재배포**(로고 SVG도 오렌지→블루) ⑥**EAS 무료 빌드 소진(8/1 리셋) → 로컬 빌드 환경 구축**(JDK17+SDK+NDK, `scripts/build-local-apk.sh`, **첫 빌드 성공** → 14차 APK). tsc 0에러 + export 그린. **⚠️ 남은 병목 1건: Firebase 콘솔 → Authentication 시작하기(이메일/비밀번호·익명) — 서버 설정, 재빌드 불필요.** 다음: 14차 실기기 → DEMO=false → main 머지. **미머지**(브랜치).<br>이전(2026-07-12): **🎨 P7-2~6 완성(5탭 IA·검색·데모·댓글·글수정) + 🌊 Azure Blue 리브랜딩 확정** — 브랜치 `feat/p7-2-shared-motion`, HEAD은 커밋 후 갱신. 이번 세션 순서: ①9차 APK 실기기 확인→`feat/p7-map-style-run-detail`→main 머지 완료 ②**P7-2** 스켈레톤·터치애니 전역 공통(`ui/skeleton`·`ui/pressable-scale`, reanimated) ③**P7-3/4/5** 2탭→**5탭 IA**(홈 Today 큐레이션·크루·러닝·랭킹·마이, Material `md=` 탭아이콘, `lib/stats`·`lib/events`) ④**P7-6** 홈 통합검색(`lib/search`) ⑤**검토용 데모데이터**(`lib/demo.ts` 6명 크루, `DEMO` 플래그 — **실배포 전 false**) + **러닝 댓글**(`comments` 컬렉션·`CommentThread`) + **방명록 글수정**(`update`, firestore.rules 배포) ⑥**메인컬러 리브랜딩**: 회장 "오렌지=당근 유사" → 파인그린 1차 적용 후 **비교 HTML 시안**(크롬) 검토 → **Azure Blue `#2563c9` 최종 확정**(accent 골드 `#c0841a`). brand.ts·웹 CSS·스플래시·DESIGN.md 전량 블루. **10·11차 APK는 그린 버전**(11차 `mEyhA2el…`). **다음 세션 최우선: ①달리는 아이콘 재디자인+배경 블루로(OpenAI/flaticon 시안) ②Firebase Auth 회원/로그인 ③블루 반영 12차 APK 빌드 → 실기기 → main 머지(DEMO=false 체크).** tsc 0에러. **미머지**(브랜치).<br>이전(2026-07-12 오전): P7 지도/상세/아이콘 → `feat/p7-map-style-run-detail`→main 머지.<br>이전: **🎨 P7 UX 폴리시 다수 완료 + 앱 아이콘 브랜드 교체 + OpenAI 이미지생성 이식** — `feat/p7-map-style-run-detail` 브랜치, HEAD=`90e16e4`. 이번 세션: ①구글맵 `customMapStyle`(파스텔·POI숨김·오렌지경로강조, 0원) ②러닝 상세 push 페이지(P7-1, NativeTabs 안 Stack 중첩 v57표준; 거리히어로·경로지도·스탯타일·삭제) ③GPS 경로 온디바이스 저장(run-path.ts, 서버 미저장 유지) ④**iOS식 슬라이드 전환**(ios_from_right·450ms·스와이프뒤로 — 회장 "아이폰 창 넘기듯" 반영) ⑤**OpenAI gpt-image-1 이식**(generate-image.mjs·`.env`·docs/OPENAI_IMAGE_GEN.md) ⑥**앱 런처 아이콘 교체**(Expo 기본 파란아이콘 → 브랜드 오렌지+흰 러너, gpt-image-1+pngjs flood-fill 합성). 8차 APK(①②③④) 실기기 확인 완료·회장 만족. **9차 APK(⑥아이콘 추가) 빌드 IN_QUEUE** — 다음 세션 첫 액션=완료 확인. tsc 0에러 + export 그린 유지. **미머지**(브랜치, 실기기 최종확인 후 main 머지 예정).<br>이전: **🏁 완성 사이클 종료 — feat/m3 → main 머지 🏁** — 성공기준 ①GPS+구글맵 라이브 ②Firebase 실시간공유 ③웹공개·처리방침 검증완료. **워치=삼성 플랫폼버그 확정**(삼성헬스가 운동·거리를 HC에 안 씀, 우리 코드 정상). main HEAD=`2964257`.)

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

### 📋 ★★★★ 워치 러닝 미로드 = 삼성헬스 플랫폼 한계 확정 (2026-07-09 · adb 실증)

> **무선 adb logcat + Health Connect 데이터 브라우저 실증으로 근본원인 최종 확정 — 우리 앱·코드 문제 아님.**
> 회장 워치로 실제 달리기(삼성헬스 기록됨: 0.37km/2:11/5'53"), [워치 불러오기] → "오늘 워치에 기록된 러닝 없어요". adb로 정밀 진단:
> - **기기**: 갤럭시 S25+ (SM-S942N), **Android 16(SDK 36)**, One UI 8.
> - **권한 전부 정상**: 우리 앱 READ_EXERCISE·DISTANCE·HEART_RATE granted=true / **삼성헬스 WRITE_EXERCISE·DISTANCE granted=true**. 앱은 HC에 읽기요청 3회 정상 전송(`HealthConnectRecordHelper requestSize=1000`), 크래시·SecurityException 없음.
> - **결정적 증거 — HC 데이터 브라우저(`MANAGE_HEALTH_DATA`)에 실제 존재 데이터**: 활동=**걸음 수만**, 활력징후=**심박수만**. **운동(Exercise)·거리(Distance) 자체가 HC에 없음.**
> - **확정 결론**: **삼성헬스가 걸음수·심박수는 HC에 쓰지만, 러닝 운동세션·거리는 HC에 안 쓴다**(WRITE 권한은 보유하나 실제 미기록). 잘 알려진 삼성헬스 한계(Strava 등도 동일 이유로 삼성 운동을 HC로 못 받아 삼성 직접연동 사용). **우리 코드는 정상** — HC에 러닝세션이 없어 0건이 맞음. 코드 수정으로 해결 불가.
> - **회장 결정**: **삼성헬스 SDK 직접 연동으로 워치 러닝을 제대로 읽는 방향**(HC 우회). 단 Garmin급 난이도(개발자 승인·네이티브 모듈) → **이번 완성 사이클 밖, 별도 과제**로. 실현가능성 조사 = 아래 `docs/WATCH_SAMSUNG_SDK.md`.
> - **adb 재사용 정보**: 페어링→접속 성공. platform-tools/adb = `171a91eb…/scratchpad/platform-tools/adb`. 접속포트는 무선디버깅 **메인화면** IP:포트(페어링 팝업 포트와 다름). `MANAGE_HEALTH_DATA` 인텐트로 HC 데이터 브라우저 직접 확인 가능.

### 📋 ★★★ 워치 연동 실기기 확정 (2026-07-09 · 6차 APK)

> **6차 APK 설치 후 [워치 불러오기] 실기기 결과 = 근본원인 수정 성공 확정.** 스크린샷 3장으로 실증:
> 1. **HC 권한창 정상 표시** — "모두의 마라톤에서 피트니스·웰니스 데이터 액세스 허용?" (활동=거리·운동, 활력징후=심박) → 지금까지 이 창 자체가 안 떴음. 이제 정상.
> 2. **Health Connect "내 건강 앱" 목록에 "모두의 마라톤"이 "연결됨" 상태로 등장** — 삼성헬스와 나란히(나이키런·Claude·삼성화재는 "연결되지 않음"). **그간 "나이키런·신한쏠은 있는데 모두의마라톤만 없음"이던 미등록 문제 완전 종결.** Android 14+ `VIEW_PERMISSION_USAGE` activity-alias 수정이 정확히 원인을 잡았음을 실기기로 확인.
> 3. **"워치 동기화 완료 — 오늘 워치에 기록된 러닝이 없어요"** 다이얼로그 정상 반환 — 크래시·SecurityException 없이 HC 읽기 성공(정상 경로). 오늘 워치 러닝이 0건이라 빈 결과일 뿐, 버그 아님.
> - **파이프라인 전 구간(워치→삼성헬스→HC→앱) 개통 확인.** 남은 실증 1건 = 워치에서 달리기 모드로 오늘 러닝 1건 기록 → 삼성헬스 동기화 → [워치 불러오기]로 `source:'healthconnect'` 세션 로드(성공기준 ① 워치 항목). 회장이 워치로 뛰고 확인 예정.
> - **워치 vs GPS 경로 구분(회장 안내)**: [워치 불러오기]=워치 달리기모드 기록을 HC 통해 읽음 / [러닝 시작]=폰 GPS 실시간. 별개 경로.

### 📋 ★ P7 UX 폴리시 착수 — 지도 커스텀 + 러닝 상세 페이지 (2026-07-09 · `feat/p7-map-style-run-detail`)

> 회장 결정: **"둘 다 묶어서(지도 스타일 + P7-1)"** → 다음 7차 빌드에 함께 굽도록 한 브랜치에 구현. 신규 의존성·키 추가 0.

- **① 구글맵 커스텀 스타일**(`app/src/lib/map-style.ts` 신규): `react-native-maps`의 `customMapStyle`에 주입할 JSON. 따뜻한 종이 배경·POI/교통 잡음 제거·흰 도로·연한 파스텔 물/공원 → 브랜드오렌지 경로가 도드라짐("아기자기·에디토리얼"). `run-map.native.tsx`에서 `<MapView customMapStyle={MAP_STYLE}>`로 적용. **0원**(의존성·키 없음, 코드만). 카카오맵은 국내전용이라 해외확장 위해 구글 유지, 맵박스는 후순위(새 SDK·키·요금).
- **② 러닝 상세 페이지(P7-1, push)**(`app/src/app/explore/run/[id].tsx` 신규): 러닝 목록에서 기록 탭 → **슬라이드 push 상세**. 거리 히어로(다크카드) + **GPS 경로 지도**(있을 때) + 시간·평균페이스·평균심박·기록방식 타일 2×2 + 삭제. 로딩 스켈레톤·터치 피드백 포함("부드러움" 4종 중 push·스켈레톤·터치애니 착수).
- **라우팅 재편**(v57 표준 — 네이티브 탭 안에 Stack 중첩): `explore.tsx` → `explore/index.tsx`(이동), `explore/_layout.tsx`(Stack, 헤더숨김) 신규, `explore/run/[id].tsx` 신규. NativeTabs 트리거 `name="explore"`는 폴더로 그대로 매핑. 목록 아이템을 `Pressable`+`router.push('/explore/run/'+id)`로, 인라인 삭제는 상세로 이관(목록 깔끔 + chevron 어포던스).
- **③ GPS 경로 온디바이스 저장**(`app/src/lib/run-path.ts` 신규): 처리방침 "좌표 서버 미저장" 유지 → **이 기기(AsyncStorage)에만** 표시용 보관(키=runs 문서 id `gps_<startedAt>`와 일치, 2000점 상한 균등 솎기). `live-run.tsx` 종료 시 `saveRunPath` 호출 → 상세 페이지가 `loadRunPath`로 읽어 완주 경로를 커스텀 지도에 그림. 삭제 시 `removeRunPath`. **과거(업데이트 전) GPS 기록엔 경로 없음 → 안내문구 표시, 새 러닝부터 지도.**
- **RunMap 확장**: `follow?: boolean` prop 추가. `true`(기본)=라이브 카메라 추적 / `false`=상세용(경로 전체 `fitToCoordinates` + 시작·도착 마커). 웹 플레이스홀더·`run-map.d.ts` 타입 동기화. 아이콘 `chevron-left` 추가(뒤로가기).
- **검증**: `npx tsc --noEmit` **0에러** + `npx expo export --platform web` **그린**(`/explore/run/[id]` 라우트 정상 번들·프리렌더). 타입드라우트 재생성(`expo start` 부팅으로 `.expo/types` 갱신). **실기기 시각검증은 7차 APK 빌드 후**(이 프로젝트 표준 게이트=tsc+export 그린 → 디바이스 확인).
- **다음**: 7차 빌드(회장 트리거 `cd app && npx eas-cli build -p android --profile preview`) → 기존앱 삭제·재설치 → ①러닝 기록 탭→상세 슬라이드 ②새 GPS 러닝→상세 지도에 오렌지 경로 ③지도 파스텔 스타일 확인. 이후 7-2(스켈레톤·터치애니 전역 공통화)·7-3(홈 탭) 진행. **push 대기**(브랜치 로컬 커밋).

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

### ★ 다음 세션 최우선 (완성 사이클 종료 → P7 UX 폴리시 진입)

> **완성 사이클 끝. 이제 리텐션·완성도 개선(P7).** 회장 결정 "지도+P7-1 둘 다 묶어서" → 구현 완료:
- [x] **구글맵 커스텀 스타일** 구현(`map-style.ts` + `run-map.native.tsx`) — 파스텔·POI숨김·오렌지경로강조, 0원. (실기기 시각확인=7차 APK)
- [x] **P7-1 러닝 상세 페이지** 구현(`explore/run/[id].tsx` + 라우팅 재편 + GPS경로 온디바이스 저장). push 슬라이드·경로지도·스탯타일·스켈레톤·터치피드백. tsc+export 그린. (실기기=7차 APK)
- [x] **7차 APK 빌드 완료 ✅**(빌드 ID `4b45f719-decb-474e-9291-6623bf50dca3`, FINISHED). **최신 APK: `https://expo.dev/artifacts/eas/Nhpu0Vso9T34KfWGrxxRxaZitBdcBm0nhGyaigTlb7s.apk`** (6차 `R0NVwmt7…` 폐기). Firebase env 6값 + keystore 재사용. P7은 매니페스트 권한 변경 없어 덮어설치 가능(깔끔히 하려면 삭제 후 재설치).
- [x] **7차 APK 실기기 확인**: ①지도 파스텔 스타일 적용 ✅ ②GPS 페이스 표시 정상 ✅ ③목록 chevron·탭 정상 ✅. 회장 피드백=**상세 전환이 너무 빨라 슬라이드 느낌 약함 → 아이폰 창 넘기듯 가로로 조금 더 천천히**.
- [x] **전환 애니 개선 + 8차 빌드**: `explore/_layout.tsx` Stack에 `animation:"ios_from_right"`(아이폰 카드 push — 밑 화면 시차) + `animationDuration:450`(천천히) + `gestureEnabled`(왼쪽 스와이프 뒤로). tsc+export 그린. **8차 APK: `https://expo.dev/artifacts/eas/mlH2CFa_RcIg5mtD8_8AcQuV--ZNftLLHMieTr5K2uo.apk`**(빌드 `2b8d3d7a`, 7차 폐기).
- [x] **9차 APK 빌드 완료**(`ae199551…`, FINISHED, 2026-07-10) — 아이콘+ios_from_right+지도스타일+러닝상세 통합. 8차 대체. APK `https://expo.dev/artifacts/eas/8aosG7r678nXnNRufikCN1cePL8ZlmXOS-A7whIYufw.apk`.
- [x] **9차 실기기 확인 완료**(회장, 2026-07-12): 새 아이콘·스플래시·상세 슬라이드 전환·지도 파스텔 모두 만족.
- [x] **★ `feat/p7-map-style-run-detail` → `main` 머지 완료**(2026-07-12, fast-forward). P7 UX 폴리시(파스텔 지도·러닝 상세 push·iOS 슬라이드·GPS경로 저장·앱 아이콘·OpenAI 이미지생성 이식) 전량 main 반영. origin push + 윈도우 미러 동기화.
- [x] **P7-2 스켈레톤·터치애니 전역 공통화 완료**(2026-07-12, `feat/p7-2-shared-motion` HEAD=`1017fe8`): ①`ui/skeleton.tsx`(reanimated 펄스 로딩 자리표시자) ②`ui/pressable-scale.tsx`(누르면 스프링 축소되는 촉각 피드백, `pressed && styles.x` opacity 훅 대체). 러닝 상세(인라인 skel→Skeleton, 아이콘버튼→PressableScale)·러닝 목록(리스트아이템·CTA·기록추가 버튼→PressableScale) 적용. reanimated 4.5+worklets는 기존 배선(collapsible)으로 web export 검증됨. tsc 0에러 + expo export web 그린. **미머지·미빌드**(다음 10차 APK에 함께 굽거나, 홈 탭 등 더 묶어서 빌드).
- [x] **P7-3/4/5 5탭 IA 완성**(2026-07-12, `feat/p7-2-shared-motion` HEAD=`8932615`): **2탭→5탭**(홈·크루·러닝·랭킹·마이). NativeTabs 아이콘은 **Material `md=` 심볼**(home·groups·directions_run·leaderboard·person)로 지정 → PNG 에셋 생성 불필요(에셋 병목 회피). ①**홈(index.tsx 재작성)**=Today 큐레이션(오늘/이번주 거리·크루 주간 합계·빠른실행→러닝탭·다가오는 모임→크루탭·방명록 수). ②**크루**=기존 index 콘텐츠를 `crew.tsx`로 이동(방명록·모임참석·갤러리). ③**랭킹(신설)**=이번주 크루 거리 랭킹(이름별 합산·메달)+이달의 챌린지(월100K 진행바). ④**마이(신설)**=프로필(이름 수정)·내 통계(총거리·러닝수·이번주·평균페이스)·성과 배지 5종(첫러닝·5K·10K·꾸준왕·월100K)·**처리방침 링크**(modu-marathon.web.app/privacy, 후행 TODO 흡수)·앱 정보. 공유 로직 `lib/events.ts`(모임 단일소스+nextEvent)·`lib/stats.ts`(주/월 집계·랭킹·배지 순수함수)·`run.ts toMs` 노출. 전역 `PressableScale`·`Skeleton` 확대 적용. tsc 0에러 + expo export web 그린(8라우트). 타입드라우트 재생성(expo start 부팅)로 신규 라우트 타입 반영. **미머지**(브랜치, 10차 APK 실기기 확인 후 main 머지).
- [x] **P7-6 통합 검색 완료**(2026-07-12, HEAD=`4afd9b7`): 홈 상단 검색바 → 크루 방명록·러닝 기록·모임을 한 질의로. `lib/search.ts`(순수 검색, 카테고리별 상위 8), 입력 시 큐레이션 대신 결과(러닝→상세 push·크루글/모임→크루탭), `icon.tsx`에 돋보기 글리프 추가. tsc 0에러 + export 그린.
- [x] **10차 APK 빌드 완료 ✅**(2026-07-12, ID `0234cf91-8d28-4b26-9a97-7d9a142107cd`, FINISHED) — **P7-2 부드러움 + 5탭 IA + 통합 검색 전부 포함**. (앞선 `978669c5`는 검색 전 빌드라 취소·대체.) **최신 APK: `https://expo.dev/artifacts/eas/0yU0M0Oz9xEVFp16RbejAOiGIMfvlNXzTlFCzcDZdmQ.apk`** (9차 `8aosG7r6…` 폐기). 매니페스트 권한 변경 없음(덮어설치 가능, 깔끔히 하려면 삭제 후 재설치).
- [x] **10차 APK 실기기 확인 완료**(회장): 5탭·홈·검색·랭킹·마이 정상. → 추가 피드백으로 아래 리브랜딩+검토기능 진행.
- [x] **★ Pine Green 리브랜딩**(2026-07-12, HEAD=`01a5c14`): 회장 피드백 "오렌지가 당근과 너무 비슷" → 시각디자이너 관점 파인/네이비 제시 → **파인 그린 `#0f7d61` 채택**(accent 골드 `#c0841a`). `brand.ts`+웹 CSS변수(index/privacy)+스플래시/링크 잔여블루+DESIGN.md 갱신. 색 중앙화(brand.ts·CSS var) 덕에 토큰만 교체. **웹 재배포는 아직**(index.html 커밋만, 필요 시 `firebase deploy --only hosting`).
- [x] **★ 검토용 데모 데이터 + 댓글 + 글수정**(2026-07-12, HEAD=`e35e1b4`): ①`lib/demo.ts`(6명 크루 러닝9·방명록5·참석·댓글, id=`demo_`, `DEMO` 플래그 — **실배포 전 false**) → `crew.ts subscribe`가 실데이터와 병합(createdAt desc) → 5탭이 여러 사람 쓴 것처럼 채워짐. ②`comments` 컬렉션 + `CommentThread`(러닝 상세에 댓글). ③방명록 본인 글 인라인 수정(`update`, 데모행 제외). **firestore.rules 배포 완료**(comments 규칙 + guestbook update 허용). tsc+export 그린.
- [x] **11차 APK 빌드 완료 ✅**(2026-07-12, ID `1129ba31-a1a4-4b89-9d8e-640819ecdc74`, FINISHED) — Pine Green + 데모데이터 + 댓글 + 글수정 포함. **최신 APK: `https://expo.dev/artifacts/eas/mEyhA2elbP1jXBAopA5ZeoqlUX_eeb_3dvi_Vkd7geY.apk`** (10차 `0yU0M0Oz…` 폐기).
- [x] **11차 실기기 확인**(회장): 5탭·데모·댓글·글수정 OK. 단 색은 아래 리브랜딩으로 블루 전환 진행.
- [x] **★ Azure Blue 리브랜딩 확정**(2026-07-12): 회장 "오렌지=당근 유사" → 시각디자이너 관점 파인그린/애저블루 제시 → 파인그린 1차 적용 → **비교 HTML 시안 크롬 검토**(`/mnt/c/Users/JUN/mm-color-compare.html`, 소스 scratchpad `color-compare.html`) → **블루 `#2563c9` 최종 확정**(accent 골드 `#c0841a`, dark 미드나잇 `#141a2b`). `brand.ts`·웹 CSS(index/privacy)·스플래시/링크·schedule 토글색(하드코딩 그린 제거→brandSoft/Deep)·DESIGN.md 전량 블루. tsc 0에러. **아직 블루 APK 미빌드**(10·11차는 그린).
- [x] **★ 앱 아이콘 Azure Blue 전환 완료**(2026-07-13, HEAD=`4c2c6d4`): **D안 채택**(회장 선택 — 블루 + 골드 스피드라인). **AI 재디자인은 실패**(gpt-image-1이 러너를 파랑 위 파랑=저대비로 그리고 발광 테두리 삽입 — JN에 기록된 실패모드 재현. 2안 모두 폐기). 대신 **기존 흰 러너의 알파를 오렌지 그라데에서 역산**(px = a·255 + (1-a)·bg → 파랑채널로 a 복원)해 **Azure Blue 그라데 위 재합성** → 오렌지 잔상 0, 벡터급 크리스프 유지. 스피드라인 3줄만 골드(`#e0a63c`)로 → 블루+골드 메달 감성. 교체: `icon.png`(풀블리드)·`android-icon-background.png`(그라데만)·`android-icon-foreground.png`·`splash-icon.png`(투명+흰러너+골드라인, 두 이미지 실루엣 bbox로 아핀매핑해 같은 3줄 검출 — 배율 하드코딩 안 함). `monochrome`은 시스템 틴팅 대상이라 흰색 유지. `app.json` adaptiveIcon/splash backgroundColor `#ff5a3c`→`#2563c9`. 온보딩 비활성버튼 잔여 오렌지(`#f0b6ab`)→`Brand.brandLine`. 어댑티브 원형크롭 합성 검증 완료(러너 세이프존 안). 재현 스크립트=scratchpad `apply-icons.mjs`, 비교페이지=`C:\Users\JUN\mm-icon-compare.html`.
- [x] **★ Firebase Auth 회원/로그인 완료**(2026-07-13, HEAD=`cba80e2`): **firebase 업그레이드 불필요**(v10.14.1 — Expo 공식 가이드 https://expo.fyi/firebase-js-auth-setup 상 v10.3.0+면 `getReactNativePersistence` 사용 가능. 단 Expo 문서엔 "SDK는 firebase@12+ 지원" 문구도 있으니 후행 업그레이드 시 주의).
  - `auth.ts` 전면 재작성: `initializeAuth`+영속성, **게스트(익명)·이메일 가입/로그인**, `displayName`↔내이름(session) 동기화, `uid()` 노출(후행 rules 소유검증 발판), Firebase 오류코드→**한국어 메시지**(`AuthError`).
  - `auth-persistence.native.ts`/`.web.ts`/`.d.ts` 신규(run-map과 같은 플랫폼분리 패턴): RN=AsyncStorage / 웹=localStorage. **핵심 함정**: `getReactNativePersistence`는 firebase v10의 **RN 번들 전용 export**라 `firebase/auth` 공개 타입(index.d.ts)에 없음 → 타입 좁혀 사용. 해석 경로 확인함(`firebase/auth`=`export * from '@firebase/auth'` → `@firebase/auth` exports에 **react-native 조건 존재** → `dist/rn/index.js`에 함수 있음 = 네이티브 정상). 그래도 해석 틀어지면 **크래시 대신 메모리 세션으로 강등**하도록 방어.
  - `account-sheet.tsx` 신규(모달 — 라우팅 무변경, live-run 패턴): 로그인/가입 세그먼트 + 게스트로 계속하기. `my.tsx`에 **계정 카드**(로그인 상태·게스트→가입 승격·로그아웃), 이름 수정 시 계정 표시이름도 함께 갱신.
  - **설계 원칙**: 웹(index.html)엔 아직 Auth가 없고 Firestore 소유식별자도 여전히 `name` → **firestore.rules 무변경**, 계정은 "신원 승격" 레이어로만. (delete 소유검증은 웹에도 Auth 붙인 뒤 후행.)
  - ⚠️ **회장 물리작업**: Firebase 콘솔 → **Authentication → 로그인 방법 → 익명·이메일/비밀번호 활성화**. 미활성 시 `auth/operation-not-allowed` → 한국어 안내만 뜸(크래시 없음).
  - tsc 0에러 + expo export web 그린(8라우트).
- [x] **★★ 12차 APK 빌드 완료 ✅**(2026-07-13, ID `0d74f500-6552-4a06-9be6-9956e4735e06`, preview, FINISHED) — **블루 아이콘(D안) + Firebase Auth 로그인 + 기존 P7 전량**. 회장 결정으로 **DEMO=true 유지**(채워진 화면에서 블루 색감·랭킹·검색 판단). **최신 APK: `https://expo.dev/artifacts/eas/188EsK5AFETExdSqVywHv6lDfxNcc2T04jTDfirgwkg.apk`** (11차 `mEyhA2el…` 그린버전 폐기). 매니페스트 권한 변경 없음(덮어설치 가능, 아이콘 캐시 때문에 깔끔히 하려면 삭제 후 재설치 권장).
- [x] **★★★ 12차 실기기 = 앱 시작 즉시 크래시 → 근본원인 확정·수정 → 13차 (2026-07-13, HEAD=`61836ef`)**
  > 회장 실기기: 아이콘은 **블루+골드 정상 적용 확인**(성공), 그러나 앱 실행 시 "모두의 마라톤이(가) 계속 중단됨"으로 즉사(2회 재현).
  - **adb logcat으로 원인 확정**(무선 디버깅 재사용 — 회장 IP `192.168.10.182:34111`, **패키지명=`com.modumarathon.app`**):
    ```
    FATAL: Error: Component auth has not been registered yet
      at initialize → initializeAuth → getAuth → createAuth  (모듈 로드 시점)
    ```
  - **근본원인 = firebase v10 × Metro package exports (dual-package hazard)**. Expo SDK 53+는 `unstable_enablePackageExports: true`가 기본인데, firebase v10의 exports 맵이 이와 맞지 않아 **`@firebase/app` 사본이 둘로 갈림** → auth는 A 사본에 등록되고 앱 인스턴스는 B 사본에서 조회 → "등록 안 됨". **모듈 로드 시점**이라 화면도 못 띄우고 즉사. Expo 문서의 "firebase 12 미만은 ES 모듈 해석 오류" 경고와 동일 지점. **Firestore는 이 문제 없이 동작**해서 11차까지 멀쩡했고, Auth를 붙이며 처음 드러남.
  - **수정 ①** `app/metro.config.js` **신규**: `resolver.unstable_enablePackageExports = false` → main-fields 해석 복귀 → `@firebase/auth`의 `react-native` 필드 → **RN 빌드(dist/rn) 단일 사본**. **검증: android 번들을 실제로 뽑아 `getReactNativePersistence` 포함 확인**(12차 번들엔 없었음 = 브라우저 빌드였다는 증거). ⚠️ **firebase 12+로 올릴 땐 이 플래그 지우고 재검증할 것**(이번엔 Firestore 영향 커서 메이저 업그레이드 보류).
  - **수정 ②** `auth.ts`·`auth-persistence.native.ts` **페일세이프**: 초기화·영속성 생성의 어떤 예외도 앱 부팅을 죽이지 않게 삼키고 `auth=null`로 강등(계정 기능만 숨김, 앱은 이름 기반 정상 동작). 기존 `catch`가 `getAuth()`를 재호출해 또 던지던 구멍도 막음.
  - **13차 APK 완료 ✅**(ID `0869210e-6618-4c54-a8b4-3310d8b6ef87`, FINISHED). **최신 APK: `https://expo.dev/artifacts/eas/FKtr9Iopyv_94UTIxlJSI3QTbKNDaFBVCFdFxs67MGE.apk`** (12차 `188EsK5A…` 폐기).
  - **에이전트가 adb로 직접 설치·실행 검증 완료**: `adb install -r` → Success → 앱 실행 → **프로세스 생존(PID) + 크래시 로그 0건**. 즉사 해소 확정. (UI 육안 확인은 회장 몫 — 스크린샷은 폰 화면이 꺼져 있어 검정으로 나옴.)
  - **교훈(재사용)**: 이 프로젝트의 앱 즉사 = 대개 **모듈 로드 시점 예외**. adb 절차 = `adb connect <메인화면 IP:포트>` → `adb logcat -b crash -c` → `adb shell monkey -p com.modumarathon.app -c android.intent.category.LAUNCHER 1` → `adb logcat -d -b crash`. **에이전트가 APK 다운로드→`adb install -r`→실행→생존 확인까지 직접 가능**(회장 손 안 빌려도 됨).
- [x] **★★ 13차 실기기 피드백 3건 대응 (2026-07-13, HEAD=`7990fef`)**
  1. **로그인·게스트 둘 다 실패 → 코드 버그 아님**. **Identity Toolkit REST로 직접 프로브**(`curl .../accounts:signUp?key=<웹apiKey>`)해서 서버 응답 확인 = **`CONFIGURATION_NOT_FOUND`** → **Firebase 콘솔에서 Authentication을 "시작하기"조차 안 한 상태**. ⚠️ **회장 물리작업(미완)**: 콘솔 → Authentication → 시작하기 → Sign-in method → **이메일/비밀번호 + 익명** 사용설정. (이건 서버 설정이라 **앱 재빌드 불필요** — 켜면 13차 APK에서도 바로 로그인됨.) 다만 앱이 "잠시 후 다시 시도"라고만 떠 원인을 못 알린 건 결함 → `auth/configuration-not-found`·`admin-restricted-operation` 메시지 추가(관리자 조치 안내 포함) + **모르는 코드는 코드까지 표시**(원인 추적 가능하게).
  2. **러너 네임을 바꿔도 기존 참석·글의 작성자명이 안 바뀜**(회장 지적). **원인**: 문서에 작성자가 `name` **문자열로 박제**(웹과 공유하는 스키마라 uid 키 불가) → 개명 시 과거 기록이 "남의 것"이 되고 통계·배지에서도 빠짐. **수정**: `crew.renameAuthor()` — guestbook·gallery·attendance·runs·comments에서 옛 이름 문서를 찾아 batch 갱신(데모 행 제외, Firestore/로컬 폴백 양쪽). `lib/identity.ts` 신규 = `saveRunnerName()`으로 **기기(session)+계정(displayName)+과거기록 전파를 단일 경로화**(진입점이 마이 탭·크루 NameField 둘이라 각자 저장하면 또 어긋남). **firestore.rules**: gallery·attendance·comments의 update를 **`isRenameOnly()`**(name 필드 하나만 바뀌는 수정)로 한정 개방 → 본문·거리·이미지 변조는 여전히 차단. **배포 완료**. **한계(명시)**: 동명이인 문서도 함께 바뀜 — 신원이 이름 기반이라 구분 불가. **웹까지 Auth 붙이고 문서에 uid 심으면 소유 기반으로 교체할 것.**
  3. **"내 이름" → "러너 네임"** 용어 통일(회장 선택). 온보딩·마이·크루·계정 시트 일괄. 마이 탭은 **명시적 [저장] 버튼**으로 변경(타이핑마다 개명 전파가 돌면 안 됨) + 변경 건수 안내.
  - tsc 0에러 + expo export web 그린.
- [x] **★★★ 적대적 검토 XSS 수정 배포 완료 ✅ (2026-07-17 · 회장 승인 후 즉시)**: `npx firebase-tools deploy --only hosting,firestore:rules` → Deploy complete(rules compiled·released, hosting release). **라이브 스모크 8항목 전부 통과**(Firestore REST로 실제 쓰기 시도해 검증):
  - 렌더단: 라이브 `index.html`에 `/^data:image\//.test(g.image||'')?esc(g.image):''` 반영 확인 — data URI 아니면 src 자체가 빈 문자열.
  - 규칙단 ①악성 gallery create(`x" onerror=alert(1)`) → **PERMISSION_DENIED** ✅ / ②정상 `data:image/png;base64,…` create → 통과 ✅(테스트 문서 삭제 완료)
  - ③방명록 create 통과 ✅ / ④`msg`만 수정 통과 ✅ / ⑤임의필드(`evil`) 주입 → **DENIED** ✅
  - ⑥runs 멱등 재저장(같은 distanceKm) 통과 ✅ / ⑦러너 네임 전파(name만) 통과 ✅ / ⑧남의 기록 거리 0으로 파괴 시도 → **DENIED** ✅
  - **결론: 저장형 XSS 라이브 차단 완료 + 정상 쓰기 경로 무손상.** (배포는 `feat/p7-2-shared-motion` 브랜치에서 수행 — 웹·규칙은 브랜치가 최신이라 무방, 코드 머지는 별건.)
- [x] **★★★ Firebase Auth 병목 해소 + 실기기 로그인 검증 완료 ✅ (2026-07-17)**
  1. **회장이 콘솔에서 Authentication 활성화** (익명 + 이메일/비밀번호). **REST 프로브로 실증**: 익명 → `provider_id:anonymous` 토큰 발급 ✅ / 이메일 가입·로그인 → 토큰 발급 ✅(`OPERATION_NOT_ALLOWED` 소멸). 프로브 이메일 계정은 삭제, **익명 계정 1개는 Auth→Users에 잔존**(무해, 지우려면 콘솔).
  2. **실기기 검증 = 에이전트가 무선 adb로 직접 수행**(회장 손 안 빌림): 앱 실행 → 생존·크래시 0 → 마이 탭 → 계정 카드 → **[게스트로 계속하기] → "게스트로 이용 중"으로 전환 ✅**(지난 세션 실패 지점) → **`am force-stop` 후 재실행해도 "게스트로 이용 중" 유지 ✅ = RN 영속성(`getReactNativePersistence`+AsyncStorage) 실기기 실증.** 12차 즉사의 `metro.config.js` dual-package 수정이 실기기서 유효함도 함께 확정.
  3. **발견**: 폰에 깔린 건 **14차가 아니라 13차 APK**였음(마이 탭이 "러너 네임"이 아니라 "내 이름" = `7990fef` 이전). 회장이 14차를 설치 안 하신 상태 → 15차로 덮으면 해소.
  - **adb 재사용**: 페어링 성공(`adb pair <팝업IP:포트> <6자리코드>` → `adb connect <메인화면 IP:포트>`).

### 📋 ★★ 15차 APK 실기기 검증 + 유령 참석자 버그 (2026-07-17 세션2)

- [x] **15차 로컬 APK 빌드·설치 완료**(`bash scripts/build-local-apk.sh`, 111MB, 캐시 덕에 짧음). **에이전트가 adb로 직접 uninstall→install→기동**. 07-15 수정분 실물 확인: 온보딩 **"러너 네임"** + **개인정보 처리방침 링크** + 플레이스홀더 **"홍길동"**(데모 이름충돌 수정). ⚠️ 서명 달라 기존앱 삭제 설치 → **AsyncStorage 초기화 = 회장 러너 네임 재입력 필요**(Firestore의 "쫀쫀샷" 기록은 무사).
- [x] **개명 전파 실기기 실증**: TESTRUN으로 참석 → 마이 탭 [저장]으로 TESTRUN2 → **"이미 남긴 기록 1건의 이름도 함께 바꿨어요"** + 참석자 목록 실제 반영 확인. **13차 회장 지적 #2 해결 확정.** 테스트 데이터 전 컬렉션 삭제 완료(잔여 0).
- [x] **★ 신규 버그 발견·수정 — 유령 참석자**(커밋 `258b85d`): 개명 후 크루 탭이 **옛 이름 유지 + [취소]가 [참석]으로 되돌아감** → 다시 누르면 **옛 이름으로 참석이 하나 더 생김**. 재시작하면 정상 = **저장은 정상, 화면 간 갱신만 실패**. 원인 = `session.ts`가 단순 AsyncStorage 읽기/쓰기라 **구독 개념 부재**인데 읽는 화면은 6곳(홈·크루·랭킹·댓글·마이·온보딩)이 각자 마운트 1회만 읽음. 로그인(`auth.ts`)도 이름을 바꿔 같은 문제.
  - **수정**: `session.ts`를 **구독형 단일 저장소**로(캐시+listeners, `subscribeMyName`, **`useMyName()` 훅**) → 6개 화면 교체. NameField/my.tsx는 **타이핑 중 값을 외부 변경이 덮지 않도록** editing/dirty 가드. NameField 빈 이름 커밋 시 되돌림. onboarding-gate `setMyName` **await**(저장 전 진입해 빈 이름 읽던 경합 제거). my.tsx의 계정명 동기화 useEffect 삭제(구독이 대신). tsc 0 + export 그린.
  - ⚠️ **16차 APK 빌드해야 폰에 반영됨.**
- [ ] **`demo.ts` DEMO=false → `feat/p7-2-shared-motion` → `main` 머지** ⚠️ **3세션치 미머지 누적 — 대형 기능 얹기 전 반드시 닫을 것.**

### 📋 ★★★★ 워치 연동 살아남 — 07-09 "삼성 플랫폼 한계" 결론 **폐기** (2026-07-17 세션3)

> **결론 정정**: 2026-07-09에 "삼성헬스가 운동·거리를 HC에 안 쓴다 → 플랫폼 한계 → 코드로 해결 불가"로 종결했으나 **틀렸다**. 그건 **삼성헬스 특정 버전의 회귀 버그**(깨진 건 7.00.0.107)였고 **7.00.5.009에서 고쳐졌다**. 실기기로 전 구간 실증 완료.

- **HC 데이터 브라우저 변화**(같은 폰·같은 화면): 07-09 = 걸음수·심박수 **뿐** → 07-17 = **거리·걸음수·속도·운동·총칼로리** + 심박수. **운동 세션 실물 확인**: `오전 7:12–7:14 · 삼성 헬스 · 걷기 · 1분`(회장이 워치로 기록).
- **1차 시도 = "오늘 워치에 기록된 러닝이 없어요"** → 크래시·권한오류 0, 즉 **읽기는 성공했고 우리가 필터로 버린 것**. 원인 = `healthconnect.ts`가 `RUNNING(56)·RUNNING_TREADMILL(57)`만 수용 → **걷기(WALKING 79)** 탈락. **버그가 아니라 의도대로 동작**했던 것.
- **★ 회장 결정: 걷기도 받는다** (크루 모임이 "걷기+뛰기 병행, 러닝 처음도 환영"이고 입문자가 가장 먼저 하는 게 걷기). 단 러닝과 섞으면 크루 평균 페이스·주간 랭킹이 붕괴 → **`kind`로 구분**.
- **구현 완료**(커밋 `ec11656`): `run.ts` `RunKind('run'|'walk')` + `isWalk/runsOnly/walksOnly`(**kind 없는 과거·웹 문서 = 'run'** 뒤로호환, 'run'은 저장 시 생략) / `healthconnect.ts` 걷기·하이킹 수용 + **라이브러리 상수 `ExerciseType` 사용 + 폴백**(상수 못 읽으면 **조용히 0건**이 되므로) / `stats.ts` 주간·월간·랭킹·배지·개인통계 전부 `runsOnly` / `explore` 상단카드=러닝기준·목록=걷기까지+**'걷기' 태그**·결과문구 "러닝 N개 · 걷기 M개".
- **★★ 16차 APK 실기기 = 프로젝트 최초로 워치 데이터가 앱에 들어옴 ✅**: [워치 불러오기] → **"오늘 걷기 1개 · 0.10km 불러왔어요"** → 목록에 **워치 아이콘 + '걷기' 태그 + 0.10km·1:46** 표시, **심박 없음**(심박 없이 불러오기 선택 = 최소수집 설계가 실기기서 작동). "오늘 뛴 거리"는 0.00km 유지(걷기 제외 정상).
- **★ 유령 참석자 수정(`258b85d`) 실기기 검증 ✅**: 마이 탭 개명 → **재시작 없이** 크루 탭 이름 즉시 반영(어제는 옛 이름 잔류 → 참석 재탭 시 유령 생성).
- **★ 보안 구멍 발견·차단·배포 ✅**(`ec11656` + rules 배포): `runs` update가 필드 제한이 없어 **남의 러닝에 `kind:'walk'`를 심으면 랭킹·배지에서 그 사람을 통째로 삭제** 가능(어제 막은 distanceKm 조작과 동종). → `request.resource.data.get('kind','run') == resource.data.get('kind','run')` 추가. **배포 후 라이브 스모크 5항목 통과**: 공격(kind 주입)=DENIED ✅ / 러닝생성·네임전파·걷기생성·걷기 멱등재저장=통과 ✅.
- ⚠️ **잔여**: 폰의 러너 네임이 **`TESTRUN2X`(에이전트 테스트값)** — 한글은 `adb shell input text`로 못 쳐서 못 되돌림. **회장이 마이 탭에서 "쫀쫀샷"으로 저장하면** 개명 전파가 그 걷기 기록(0.10km)도 회장 이름으로 바꿔 자동 정리됨.
- **남은 워치 검증 1건**: 워치로 **걷기 말고 달리기** 30초 → `kind:'run'`으로 들어오고 "오늘 뛴 거리"에 합산되는지(실내 달리기=RUNNING_TREADMILL도 수용).

### 📋 ★★★ 다음 세션 최우선 (2026-07-17 세션2 마감)

> **adb 재접속**: `adb connect 172.30.1.60:34727`(페어링 살아있음 — 포트만). ⚠️ **무선디버깅 보안 해제가 30분마다 풀려 포트가 새로 잡힌다**(회장 확인). `Connection refused`면 = 호스트는 살아있고 포트만 바뀐 것 → 회장께 새 포트 요청, 또는 **포트스캔**으로 자동 탐색: `for p in $(seq 30000 49999); do timeout 0.3 nc -z 172.30.1.60 $p && echo $p; done`(2000개씩 병렬 → 수십초). mDNS(`adb mdns services`)는 **WSL에선 안 잡힘**. 화면 켜고 잠금해제 상태여야 스크린샷이 검정 안 됨. **한글은 `adb shell input text`로 못 침(ASCII 전용)** → 한글 이름 입력은 회장 몫.

1. **⌚⌚ 워치 판정 — 최우선. 코드 0줄로 끝난다.** 회장이 **07-17 워치로 걷기 1회 기록·종료 완료**(검증 직전 adb 끊겨 미확인). adb 붙자마자:
   - `adb shell am start -a android.health.connect.action.MANAGE_HEALTH_DATA` → **활동 → 운동** → **ExerciseSession 있는지**.
   - **있으면** → 앱 [워치 불러오기]로 로드 확인 → **"삼성 플랫폼 한계" 결론 폐기·워치 연동 완성**(JN 07-09 기록 정정할 것).
   - **없으면** → ①삼성헬스 → 설정 → **Health Connect → "모두 허용"/운동 개별 토글**(**우리가 한 번도 안 본 지점**) ②설정 → Consents → 건강·웰니스 **동의 OFF→10초→ON** → 재부팅 → **새 러닝 다시**(HC는 **forward-looking** — 토글 이후 기록분만 올라옴. 07-09 실패 판정이 이 함정이었을 수 있음).
   - **근거(이 세션 조사)**: HC에 **"운동"·"총 칼로리" 항목이 새로 생김**(07-09엔 걸음수·심박만) + 삼성헬스 **7.00.5.009 = 커뮤니티가 지목한 수정 버전**(깨진 건 7.00.0.107). **우리 07-09 "플랫폼 한계 확정"은 버전 회귀 버그를 영구 한계로 오판했을 가능성 높음.**
   - **다른 경로 결론**: 삼성 Data SDK = **파트너 신규접수 여전히 중단 → dead end**(레거시 SDK도 2025-07-31 deprecated). 자체 WearOS 앱 = RN이 WearOS **공식 미지원**(Kotlin 별도 트랙) + **워치 사이드로드라 확산 불가** → 우리 목표와 상충, **비권장**. Strava가 갤워치를 읽는 건 **삼성 파트너 전용 직접연동**이라 우리는 못 씀.
2. **16차 APK 빌드**(~10분, 캐시 있음) — **유령 참석자 수정(`258b85d`) 반영**. 검증: 마이에서 개명 → **재시작 없이** 크루 탭 이름·참석버튼이 즉시 따라오는지.
3. **DEMO=false → main 머지** (위 참조).
4. **★ 회장 대형 비전 — 착수 전 기획서 필요**(당근 "모임" 벤치마크. 스크린샷 = `/mnt/c/Users/JUN/Downloads/새 폴더/KakaoTalk_20260717_*.jpg` 6장: 채팅목록·모임채팅방·투표·챌린지선택·모임챌린지·일정+후기):
   - **원하는 것**: 채팅 · 챌린지 · **채팅 내 투표** · **모임 생성 후 그 안에서 운영**(일정·후기) · **웹 연동**(폰 접속 어려운 사람도 웹에서 대화·참여). Firestore로 전부 가능하고 웹도 같은 SDK라 구조적으로 잘 맞음.
   - ⚠️ **선행 필수(순서 중요)**: 지금 신원 = **이름 문자열**이라 사칭 가능 + delete 전면개방. **이 위에 채팅을 얹으면 아무나 아무 이름으로 말하고 아무 메시지나 지우는 방이 된다.** → **웹 Auth 붙이기 → 문서에 `uid` 심기 → rules 소유기반 교체**가 먼저. 웹 `withUid` 기반은 07-15에 이미 깔림(=절반) + **07-17 Auth 활성화로 익명 uid 발급 가능해짐** → 지금이 적기. 동명이인 개명 문제도 함께 해소.
   - **아기자기함**(회장: "이런 아기자기함이 없는데"): 문제는 색이 아니라 **보상 루프 부재**. 당근 = 걸음 진행바 + **[받기]** + 보물상자 + 랭킹 + **마스코트 캐릭터** / 우리 = 마이 탭이 총거리 0.0km·러닝 0회·**배지 전부 회색 "미획득"** = 첫인상이 초라함. → ①배지를 회색 무덤 대신 **"다음 배지까지 1.2km" 진행바**로 ②획득 순간 **축하 애니**(reanimated 이미 있음 = 무의존성) ③**마스코트 캐릭터**(로고 러너 캐릭터화, gpt-image-1) — 이게 8할. 당근의 **광고·포인트 경제는 모방 불필요**(그건 당근이 돈 버는 방식).
   - **케이던스**(회장 질문 "레이턴스" = 케이던스로 확인됨): 거리·속도로는 못 구함, **걸음을 세야** 함. ①**폰** = `expo-sensors` Pedometer — **미설치 → 의존성 추가 + 재빌드 + `ACTIVITY_RECOGNITION` 권한** 필요(주머니에 넣으면 부정확) ②**워치** = **HC에 걸음수·심박은 이미 들어옴**(07-09 확인) → 러닝 시간대 걸음수÷시간으로 **코드만으로 산출 가능**. 아이러니: 정작 거리는 못 읽는데 케이던스는 읽힘.
- [ ] (후행) 웹에도 Auth 붙이고 문서에 `uid` 심기 → firestore.rules를 **소유 기반**(delete/update)으로 교체 + 개명 전파의 동명이인 문제 해소 + App Check 부담 경감.
- [x] **웹 공개사이트 블루 재배포 완료**(2026-07-13, HEAD=`9c88be4`): CSS 변수는 이미 블루였으나 **로고 자산이 오렌지로 남아 있던 것 발견** → `web/brand/{mark,favicon,og,logo-horizontal}.svg` 블루 전환(앱 아이콘과 동일 토큰: `#4c85e8`/`#2563c9`/`#1b4ea3`). 안내배너 앰버톤(#fff6ec)은 골드 계열이라 유지. `firebase deploy --only hosting` → **https://modu-marathon.web.app 라이브 블루 반영**(홈 200·/privacy 200·mark.svg 블루 서빙 검증).
- [ ] (후행) 웹에도 Firebase Auth 붙이면 → firestore.rules에 소유검증(delete/update) 도입 가능 → App Check 부담 경감.

### 📋 ★★ EAS 무료 빌드 소진 → **로컬 APK 빌드 환경 구축** (2026-07-13)

> **막힘**: 14차 APK 빌드 시도 → `This account has used its Android builds from the Free plan this month` — **EAS 무료 플랜 월 안드로이드 빌드 한도 소진**(오늘 12·13차 굽고 소진). **리셋 2026-08-01**.
> **회장 결정**: 돈 쓰거나 대기하지 말고 **PC에 로컬 빌드 환경 구축**(이후 횟수·대기열 제한 없이 무료).

- **툴체인(홈 디렉터리 설치 — sudo 불가 환경이라 시스템 오염 없이)**:
  - `~/android-dev/jdk17` — Temurin JDK 17 (adoptium API tarball)
  - `~/android-dev/sdk` — Android SDK: `platform-tools`·`platforms;android-36`·`build-tools;36.0.0`·`ndk;27.1.12297006`·`cmake;3.22.1` (cmdline-tools zip → `sdkmanager --licenses` 자동동의)
- **서명 키**: `app/credentials/local-release.jks`(alias/pw = `modumarathon`). `.gitignore`에 `*.jks`·`/android` 이미 있음 → **커밋 금지**. ⚠️ **EAS 키와 다름** → 기존(EAS) 앱을 **지우고 설치**해야 함(서명 불일치로 덮어쓰기 실패).
- **빌드 스크립트**: `app/scripts/build-local-apk.sh` — prebuild → **릴리스 서명 주입**(android/는 prebuild마다 재생성되므로 매번 python으로 패치; EAS 경로를 안 건드리려고 config 플러그인 대신 스크립트에서만 주입) → `./gradlew assembleRelease`. 산출물 `android/app/build/outputs/apk/release/app-release.apk`.
- **에이전트가 adb로 설치·실행까지 검증 가능**(13차에서 실증): `adb install -r <apk>` → `adb shell monkey -p com.modumarathon.app ...` → `adb shell pidof` + `adb logcat -b crash`.
- **★ 첫 로컬 빌드 성공 ✅**(2026-07-13): `BUILD SUCCESSFUL in 36m` (첫 빌드만 김 — gradle 의존성 최초 다운로드. **이후엔 캐시되어 인터넷 없이도 빌드 가능**). APK 111MB(EAS 산출물과 동일 규모), `apksigner verify` 통과(v2 서명), 패키지 `com.modumarathon.app` / compileSdk 36. **14차 APK = `C:\Users\JUN\modu-marathon-14.apk`** (회장 설치용 복사).
- ⚠️ **설치 시 기존 앱 삭제 필수**(EAS 서명 ≠ 로컬 서명 → 덮어쓰기 실패). 로컬 빌드끼리는 덮어쓰기 OK.

### 📋 ★ OpenAI 이미지 생성(gpt-image-1) 이식 완료 (2026-07-09)
> easypost-marketing의 이식 가이드로 이미지 생성 능력을 이 프로젝트에 붙임. **다음 작업 = 앱 아이콘 교체**(회장 요청).
- **가이드**: `docs/OPENAI_IMAGE_GEN.md`(원본 easypost 복사) — 엔진 gpt-image-1, generations(t2i)/edits(캐릭터고정), 파라미터, 오류표.
- **도구**: 루트 `generate-image.mjs`(복붙 최소 스크립트). 실행 `node --env-file=.env generate-image.mjs "프롬프트(영어)" out.png [ref.png]`. size/quality는 `OPENAI_IMAGE_SIZE`/`OPENAI_IMAGE_QUALITY` env(기본 1024x1536·medium).
- **키**: 루트 `.env`의 `OPENAI_API_KEY`(결제·조직인증 완료 실키). **`.gitignore`에 `.env`·`/out*.png` 추가 — 절대 커밋 금지**(검증됨). Node v24.18.0.
- **검증**: low·1024 1장 테스트 성공(오렌지 러닝화 아이콘, 글자없음). 파이프라인 전 구간 OK.
- **주의**: AI 이미지에 글자(한글) 금지 — 배경/그림만 AI, 글자는 코드 합성. 캐릭터/화풍 고정은 레퍼런스 PNG를 3번째 인자로.
- **다음**: 앱 아이콘 세트(어댑티브 아이콘·탭 아이콘) 브랜드톤으로 재생성 → `app/assets`·`app.json` 반영. 저비용 위해 low로 프롬프트 튜닝 후 medium/high 확정.

### 📋 ★ 앱 런처 아이콘 브랜드 교체 (2026-07-09 · gpt-image-1 + pngjs 합성)
> 기존 `icon.png`는 **Expo 기본 템플릿(파란 배경)** — 브랜드 미적용이었음. 브랜드 마크(오렌지+흰 러너+스피드라인) 톤으로 전면 교체.
- **생성 방식**: gpt-image-1로 "순백 러너+스피드라인" 시안 확보(투명배경 생성은 발광블롭으로 실패 → 오렌지 위 순백 크리스프 버전 채택). 캔버스 회색과 러너 흰색이 동색이라 색 키 불가 → **pngjs로 테두리 flood-fill(캔버스=테두리연결 밝은중성색 제외) + 4px 팽창(경계 아웃라인 제거)** 로 러너만 추출.
- **합성 산출**(`app/assets/images/` 제자리 교체, app.json 경로 불변): `icon.png`(오렌지 대각그라데 #ff7a4d→#e8401f 풀블리드 + 흰러너 63%), `android-icon-background.png`(그라데만), `android-icon-foreground.png`·`monochrome`·`splash-icon`(투명+흰러너, 어댑티브 세이프존 위해 49%로 축소·중앙정렬). 어댑티브 합성 미리보기 확인 완료.
- **app.json**: adaptiveIcon `backgroundColor` #fff0ec→**#ff5a3c**(폴백 브랜드), 스플래시 `imageWidth` 76→**200**(새 패딩 러너에 맞춤).
- **주의(재현)**: 합성 스크립트는 scratchpad(`compose-icons.mjs`), AI 소스(`icon-final2.png`)는 미커밋(스크래치패드). 재생성 시 gpt-image-1로 순백러너 시안 재확보 후 flood-fill 합성. 인앱 벡터 아이콘(`icon.tsx`)은 AI 래스터보다 벡터 유지가 나아 **미변경**.
- **9차 APK 빌드 완료 ✅**(ID `ae199551-eb2e-4438-b0f1-237284c3dab5`, preview) — **아이콘 + 전환애니(ios_from_right) + 지도스타일 + 러닝상세 전부 포함**. 8차를 대체. 세션 마감 시점 IN_QUEUE였으나 백그라운드 폴링으로 **FINISHED 확인**(2026-07-10). **최신 APK: `https://expo.dev/artifacts/eas/8aosG7r678nXnNRufikCN1cePL8ZlmXOS-A7whIYufw.apk`** (8차 `mlH2CFa_…` 폐기). 회장 재설치(기존앱 삭제) → ①홈런처 새 오렌지 러너 아이콘 ②스플래시 ③상세 슬라이드 전환 ④지도 파스텔 확인 → 만족 시 `feat/p7-map-style-run-detail`→main 머지.
- [ ] (후행) 삼성헬스 업데이트 후 워치 재테스트, 삼성 파트너 재개 시 Data SDK.

### (완료) 완성 사이클 — 회장 물리작업 위주
- [x] **5차 APK 빌드 완료**(`bPjayGBY…`) — 지도 + 워치 권한안내 반영.
- [ ] **GPS+지도 검증**(5차 APK 설치 후): [러닝 시작] → 지도에 경로 실시간 오렌지선 표시, 거리 ±5%·드리프트·페이스 (`docs/QA_M3_DEVICE.md ②`). 구글맵 회색이면 Maps SDK 사용설정/결제/키 제한 확인.
- [x] **★ 워치 근본원인 확정 + 수정**(adb 불필요 — 매니페스트 분석): Android 14+ 필수 `VIEW_PERMISSION_USAGE` activity-alias 누락이 "HC 미등록" 원인. 커스텀 플러그인 `withHealthConnectAndroid14.js` 주입, prebuild로 매니페스트 검증·tsc·export 그린.
- [x] **★ 6차 빌드 트리거 완료**(`bb8e0a00…`, FINISHED) — 지도+워치수정 묶인 APK. **최신 APK: `https://expo.dev/artifacts/eas/R0NVwmt7ZL4sXp2mHj2pdbTie7YcWKxehUc_Z9w38y4.apk`**. 빌드 전 tsc·매니페스트 7항목 실검증 통과.
- [x] **6차 APK 실기기 확인(워치)**: [워치 불러오기] → HC 권한창 표시 ✅ + **HC 앱목록에 "모두의 마라톤" 연결됨 등장 ✅** + 크래시 없이 동기화 완료 ✅. (오늘 워치 러닝 0건이라 세션 로드 실증만 남음 — 회장 워치 러닝 대기.)
- [x] **워치 세션 로드 실증 시도 → 삼성 플랫폼 한계 확정**: adb 실증으로 삼성헬스가 운동·거리를 HC에 안 씀(삼성 알려진 회귀버그) 확인. 우리 코드 정상. **코드로 해결 불가.** → 검토서 `docs/WATCH_SAMSUNG_SDK.md`.
- [ ] **워치 러닝 연동 = HC 유지 + 삼성 수정 대기(기본값)**. 삼성헬스가 HC 쓰기 버그 고치면 무빌드로 자동 동작. 삼성헬스 업데이트 후 재테스트만.
- [ ] **(후행 별도과제) 삼성헬스 Data SDK 직접연동** — 파트너 프로그램 재개 시 착수(현재 삼성이 신규접수 중단). Garmin급 벤더연동 묶음.
- [x] **GPS+지도 실기기 검증 완료**(2026-07-09 · adb screencap): [러닝 시작] → **구글맵 정상 렌더(회색 아님=Maps키 정상)** + 실제위치 추적(서울시청→코엑스 실위치 이동, 파란 현재위치점) + 거리누적(0.02km) + 시간(0:33) + 페이스(28'07"/km) + **종료·저장 → 오늘거리 0.02km 반영·기록 1→2개·`source:'gps'`**. 전 구간 동작 확인. (±5% 정밀도는 후일 야외 1km+ 최종확인, 기능 자체는 완결.)
- [x] **★ `feat/m3-live-run-watch` → `main` 머지 완료**(2026-07-09, fast-forward 32커밋, origin push, 미러 동기화). `main` HEAD=`b3e2305`. **완성 사이클 종료** — 워치 제외 성공기준 ①②③ 전부 실기기 검증완료. 워치=삼성 플랫폼버그로 HC경로 유지·삼성수정 대기(`docs/WATCH_SAMSUNG_SDK.md`).
- [ ] **(회장 관심) 앱 부드러움·다중 페이지 UX 개선** → **제안서 `docs/UX_APP_NAV.md` 작성 완료**. 현재 2탭(크루·러닝)→5탭(홈·크루·러닝·랭킹·마이)+하위 push 페이지. "부드러움"=push 상세페이지+스켈레톤+터치애니+홈 큐레이션 4종. 레퍼런스: 러닝상세=NRC, 홈큐레이션=스마트스코어, 전환결=토스. **머지 후 P7-1(러닝 상세 페이지)부터 착수 권장.** 회장 검토·승인 대기.

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
