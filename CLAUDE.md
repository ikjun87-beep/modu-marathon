# CLAUDE.md — 모두의 마라톤

> 프로젝트의 **고정 정보**만. 진행 상황·TODO는 [`JN.md`](JN.md), 상세 기획은 [`docs/PRD.md`](docs/PRD.md).

## 프로젝트 목적

> ### 「5키로 — 러닝 크루의 출석부」
> **누가 나왔고 얼마나 뛰었는지가, 어떤 앱으로 뛰든 저절로 남는다.**
> (2026-08-14 세션13 오너 확정. 이 정의가 이후 모든 제품 판단의 기준선이다.)

러닝·마라톤 크루 + 기록 앱. 웹·모바일(Expo)·스마트워치가 **하나의 Firebase 데이터**로 연동. 최우선 목표는 **실제 폰에 설치·확산**. (전신: 달려라 대토신)

- **근거**: 골프의 스코어카드 = 러닝의 **출석부**. 골프존이 플랫폼이 된 첫 벽돌은 "스코어를 안 적으면 게임이 성립 안 한다"는 **사용 강제력**인데 러닝엔 그게 없다. 러닝에서 유일하게 "안 하면 곤란한 것"이 **모임에 나왔는지 확인되는 일**이다. 이 정의로 가면 **스트라바와 겹치는 면적이 0**이 된다(스트라바는 출석부가 아니다).
- **진짜 고객은 크루장 한 명**이다. 크루원은 부산물, 미가입 러너는 아직 고객이 아니다. **크루원에게 최고의 UX는 "아무것도 안 하는 것"** — 그래서 Health Connect 집계가 필요하다.
- ⚠️ **집계자(Health Connect)는 해자가 아니라 출석부를 저절로 채우는 엔진이다.** 개인에겐 "기록이 모인다"가 아무 이득이 아니고(이미 스트라바에 있다), 이득은 "그 기록이 우리 크루 출석부에 자동 반영될 때"뿐이다. **크루 없이는 가치가 0.**
- ⚠️ **이름 `5키로`는 이 정의와 어긋난다**(개인의 오늘 목표 ≠ 크루의 장부). 재브랜딩 적기는 두 번째 크루가 들어올 때. 지금은 **이름 유지, 정의만 교체.**
- **1년간 만들지 않을 것**: 친구·팔로우 · DM·채팅 · **크루 대항전**(크루마다 규모·수준이 달라 비교가 불공정) · 마켓·쇼핑·**예약**(러닝엔 예약할 유료 슬롯이 없다 — 골프존 유추의 최대 함정) · 코칭·훈련계획 · **트래킹 정밀도 경쟁** · Garmin · 광고.

## 폴더 구조
```
web/                  홈페이지(정적 HTML) — 공개배포 https://modu-marathon.web.app (Firebase Hosting)
  index.html          랜딩 + 크루 커뮤니티(참석·갤러리·방명록·합류) — Firebase 또는 localStorage 폴백
  privacy.html        개인정보 처리방침 공개 페이지(/privacy) — 웹 푸터·(후행)앱 온보딩에서 링크
  brand/              로고 자산(mark/mark-white/favicon/logo-horizontal/og .svg)
app/                  Expo(React Native) 앱 — iOS+Android+web 한 코드베이스
  src/app/            화면(Expo Router 파일 라우팅, 하단 5탭 NativeTabs): index=홈(Today 큐레이션·통합검색) / crew=크루 / explore/=러닝(explore/_layout=Stack, index=목록, run/[id]=상세 push+댓글, ios_from_right) / ranking=랭킹 / my=마이. 탭아이콘=Material `md=`
  src/lib/            firebase.ts·crew.ts(데이터,put멱등)·run.ts(통합Run·헬퍼)·run-path.ts(GPS경로 온디바이스 저장,서버미저장)·path-fit.ts(경로→박스 좌표변환, 썸네일·공유카드 공용)·map-style.ts(구글맵 스타일 — **파스텔 커스텀은 폐기**, 거의 기본지도. 지명·도로·물길을 지우면 "어디를 달리는지"가 안 보인다)·profile-photo.ts(프로필 사진, **서버 공유**)·healthconnect.ts(갤럭시워치)·health-consent.ts(심박 별도동의)·share-layout.ts(공유카드 좌표표)·text-metrics.ts(폰트 실측 글자폭)·share-image.ts(PNG저장·공유시트)·session·auth·brand
  src/components/      icon.tsx(웹과1:1 SVG아이콘)·live-run.tsx(GPS트래킹모달)·run-map.native/web.tsx(구글맵 경로,플랫폼분리)·share-card.tsx(공유카드 1080px SVG)·share-sheet.tsx(공유 미리보기 모달)·name-field·schedule-section·gallery-section 등
  plugins/            커스텀 Expo config 플러그인(withHealthConnectPermissionDelegate=워치 권한런처 등록)
  scripts/serve-web.py 앱 웹 미리보기 서버(클린 URL 매핑; python http.server는 /explore 404)
  scripts/build-local-apk.sh  로컬 APK 빌드(prebuild→릴리스 서명 주입→gradlew assembleRelease)
  scripts/check-share-card.ts  공유카드 레이아웃 산술 검산(실기기 빌드 없이 넘침·겹침 확인) `node --experimental-strip-types`
  scripts/font-advance.py  TTF hmtx에서 글자 advance width 실측(공유카드 폭 계산의 근거)
  scripts/strip-mascot-shadow.mjs  마스코트 PNG에서 발밑 그림자 제거(가장 큰 연결 덩어리만 남김)
  scripts/crop-mascot-face.mjs 앱아이콘용 얼굴만 추출(부위별 씨앗점 flood-fill — 사각 크롭은 엄지척 손이 딸려오고 위로 자르면 턱이 잘린다)
  scripts/build-local-aab.sh  플레이스토어 제출용 AAB(APK와 달리 **4개 ABI 전부** 포함)
  scripts/optimize-mascot.mjs  마스코트 여백 잘라 512px 축소·압축
  metro.config.js     package exports 끔 — firebase v10의 dual-package hazard 회피(끄지 않으면 앱 즉사)
  eas.json            EAS 빌드 프로필(preview=APK / development=dev client / production) — env에 Firebase 공개키 주입
docs/                 PRD·DESIGN(디자인 시스템)·**TIERS(가시성 3층 = 격리 설계 정본)**·CREW-GATE(초대코드·AppCheck·상한)·BRIEF(2층 전제 적대회의 기록, 결론은 TIERS가 대체)·BUILD(설치 빌드)·FIREBASE_SETUP·PRIVACY·QA_M3_DEVICE(실기기 대본)·UX_APP_NAV(P7 다중페이지 제안)·WATCH_SAMSUNG_SDK(워치 삼성헬스 한계·SDK 검토)·OPENAI_IMAGE_GEN(이미지 생성 이식 가이드)
generate-image.mjs    OpenAI gpt-image-1 이미지 생성 CLI(배너·아이콘·마스코트). 실행 `node --env-file=.env generate-image.mjs "영어프롬프트" out.png [ref.png]`. 키=루트 `.env`의 `OPENAI_API_KEY`(gitignore). AI엔 글자 금지→글자는 코드 합성.
tests/                **`firestore.rules` 검증 하네스**(`@firebase/rules-unit-testing`, 33건). `cd tests && npm test`.
                      ⚠️ **앱과 분리된 별도 패키지** — peer가 firebase^12인데 앱은 v10에 묶여 있다(아래 metro 규칙).
                      rules 파일만 읽고 앱 코드는 import 하지 않는다. 자세한 이유·테스트 추가법은 `tests/README.md`
firestore.rules       Firestore 보안 규칙
firebase.json·.firebaserc  Firebase 배포 설정(hosting=web/ · firestore rules · 프로젝트 modu-marathon)
.claude/agents/       재사용 서브에이전트(homepage-expert·marathon-expert)
```

## 기술 스택
- 백엔드: **Firebase**(Auth·Firestore·Storage) — 웹·앱·워치 공용 단일 소스
- 웹: 정적 HTML/CSS/JS (빌드 없음), Firebase JS SDK(CDN)
- 앱: **Expo SDK 57 · React Native · TypeScript · Expo Router**, firebase npm, AsyncStorage, react-native-svg, expo-location(실시간 GPS), react-native-maps(구글맵 경로표시), react-native-health-connect(갤럭시워치), expo-file-system·expo-sharing(공유 카드 PNG 저장·공유 시트)
- 워치: Health Connect(Android/갤럭시) — **minSdk 26 필수**(`expo-build-properties`로 지정, dev/preview build 전용). HealthKit(iOS)은 후행

## 주요 명령어
```bash
# 웹 (빌드 불필요, 정적 서빙)
cd web && python3 -m http.server 8080 --bind 0.0.0.0   # http://localhost:8080
npx firebase-tools deploy --only hosting               # 공개배포(로그인 캐시됨) → modu-marathon.web.app
npx firebase-tools deploy --only firestore:rules       # 보안규칙 배포

# 보안규칙 검증 (배포 전에 돌린다 — 33건)
cd tests && npm install && npm test
# ⚠️ 자바가 두 갈래다: 안드로이드 빌드=JDK17(~/android-dev/jdk17) / 에뮬레이터=JDK21+(~/android-dev/jre21).
#    firebase-tools는 21 미만이면 실행을 거부한다. run.sh가 자기 프로세스 안에서만 21을 앞세우므로
#    **시스템 java나 PATH를 21로 올리지 말 것** — 올리면 APK 빌드가 조용히 깨진다.

# 앱
cd app && npm install
npm run web                         # 브라우저 미리보기(가장 빠른 확인)
npm run ios / npm run android       # 실기기·에뮬레이터
npx tsc --noEmit                    # 타입체크
npx expo export --platform web      # 번들 검증(정적 렌더)

# 앱 실제 설치 빌드 — 로컬(권장, 무제한·무료. EAS 무료플랜은 월 빌드 한도 있음)
cd app && bash scripts/build-local-apk.sh   # → android/app/build/outputs/apk/release/app-release.apk
# 툴체인=~/android-dev(JDK17·Android SDK/NDK), 서명키=app/credentials/local-release.jks(커밋금지)
# ⚠️ EAS 서명과 달라 기존(EAS) 앱은 삭제 후 설치. 로컬끼리는 덮어쓰기 OK.

# 앱 실제 설치 빌드 — EAS 클라우드 (docs/BUILD.md · 월 무료 한도 소진 시 실패)
cd app && npx eas-cli build -p android --profile preview

# 실기기 연결 — ✅ **Windows adb가 정답**(2026-07-30 확정). WSL adb를 쓰지 말 것.
#   WSL에서 폰에 닿는 두 방법(usbipd 터널 / 무선 adb) 다 **50MB 설치가 깨진다**:
#     usbipd = 작은 명령은 되는데 대용량 전송에서 6실패/3성공(유휴 타임아웃 + 프로세스 2개 충돌)
#     무선   = 3~6분마다 끊기고 포트가 매번 바뀜
#   Windows adb는 USB에 **직접** 붙어 터널 구간이 없다 → **설치 4초**.
A='C:\adb\platform-tools\adb.exe'                                        # (설치 완료돼 있음)
cp <apk> /mnt/c/adb/app-release.apk                                      # Windows 쪽으로 복사 후
powershell.exe -NoProfile -Command "& '$A' install -r 'C:\adb\app-release.apk'"
# 스크린샷 = shell screencap → pull 로 C:\에 받아 WSL에서 읽는다(exec-out 리다이렉트는 PowerShell에서 깨짐)
powershell.exe -NoProfile -Command "& '$A' shell screencap -p /sdcard/x.png; & '$A' pull /sdcard/x.png 'C:\adb\shots\a.png'"
# 탭/스와이프도 같은 방식. 입력칸 이동은 좌표 탭보다 keyevent 61(TAB)이 확실(키보드가 다음 칸을 가림)
# ⚠️ 폰이 `unauthorized`면 WSL adb와 다른 키라 폰에서 "항상 허용"을 한 번 눌러야 한다.
# 폴백(권장 안 함): usbipd bind/attach + udev 규칙 `/etc/udev/rules.d/51-android.rules`
#   (SUBSYSTEM=="usb", ATTR{idVendor}=="04e8", MODE="0664", GROUP="plugdev") — 둘 다 설정돼 있음.
#   시작폴더 `5키로-폰USB연결.bat`도 남겨둠. attach 후엔 반드시 `adb kill-server`(옛 상태를 붙들고 있다).

# 실기기 디버깅(앱 즉사·크래시)
powershell.exe -NoProfile -Command "& '$A' logcat -b crash -c"
powershell.exe -NoProfile -Command "& '$A' shell monkey -p com.modumarathon.app -c android.intent.category.LAUNCHER 1"
powershell.exe -NoProfile -Command "& '$A' logcat -d -b crash"   # 패키지명=com.modumarathon.app
```

## 지켜야 할 규칙
- 웹·앱이 **같은 Firebase 프로젝트/스키마**를 쓰도록 유지 — 컬렉션: `guestbook`·`gallery`·`attendance`·`runs`·`comments`·`events`·`claps`·`profiles`·`waitlist`. 스키마 단일 소스는 `app/src/lib/firebase.ts`의 `COLLECTIONS`. (`events`=모임 일정, 2026-07-18 하드코딩→Firestore 이관. **웹은 아직 하드코딩 EVENTS** — 후속 이관 필요.)
- ✅ **크루 데이터 격리 — PHASE 2 운영 컷오버 완료(2026-08-17 세션19~22).** 세션13의 "격리보다 소유 먼저" 방향(uid 소유 + 유예 조항 선행)을 거쳐, 세션19 조사로 **B안(서브컬렉션) 채택**을 확정하고 세션21~22에서 실제 배포·마이그레이션·실기기 서버 확정까지 끝냈다. 8개 컬렉션이 더 이상 전부 `read: if true`가 아니다 — 아래 최종 구조 참고.
  - **최종 구조 = "웹이 실제로 만지는 4개는 root, 앱 전용 4개는 크루 서브컬렉션"**(`docs/TIERS.md` §11이 정본). `guestbook`·`gallery`·`attendance`·`events`는 **root 그대로**(웹·앱 공유, `read: if true` 유지) — TIERS.md가 원래 그리던 "나만/크루/전체공개" 3층이 아니라 **web-shared root / app-only crew-scope 2분할**로 실제 구현됐다(세션21 조사: web은 이 4개만 구독·작성, 나머지 4개는 웹 코드에 아예 없음). `claps`·`profiles`·`runs`·`comments`는 **`crews/{CREW_ID}/{col}` 서브컬렉션으로 이동**(`isMember(crewId)` 가드) — `firebase.ts`의 `COLLECTIONS`가 이 4개만 `` `crews/${CREW_ID}/...` `` 템플릿 문자열로 정의하고, `crew.ts`의 `fbSubscribe`/`fbAdd`/`fbRemove`/`fbUpdate`/`fbPut`는 경로 문자열을 그대로 SDK에 넘기므로 **코드 변경 없이** 컷오버됐다.
  - **`CREW_ID = "modu"`는 이제 실제로 읽힌다** — 위 4개 컬렉션 경로에 매 요청 쓰인다(과거 노트의 "지금은 적기만 하고 아무 데서도 읽지 않는다"는 컷오버 전 상태였고 더 이상 사실이 아니다). 여전히 정적 상수이고 두 번째 크루가 생기기 전까진 값을 바꾸지 말 것 — 값이 바뀌면 이전 문서가 다른 크루로 갈린다.
  - **로그인 직후 자동 크루 가입**: `crew.ts`의 `ensureCrewMembership()`이 `_layout.tsx`에서 `ensureSignedIn()` 직후 호출돼 `crews/modu/members/{uid}`를 자동 생성한다(1인 1크루 MVP 전제 — 두 번째 크루가 생기면 "유일한 크루로의 자동가입" 의미로만 남는다). **`AppTabs`는 이 멤버십 확보 전엔 마운트되지 않는다** — 먼저 마운트해 화면들이 멤버십 확보 전에 `onSnapshot`을 열면 permission-denied로 리스너가 영구히 죽는다(Firestore JS SDK는 리스너 에러를 자동 재시도하지 않음, 세션22에서 실기기로 발견).
  - **기존 데이터는 `app/scripts/migrate-crew-modu.mjs`로 사본 이관 완료**(root의 4개 컬렉션 → `crews/modu/{col}`, idempotent `setDoc(...,{merge:true})`, root 원본은 절대 안 건드림). runs 7건 복사, 나머지 3개는 이관 시점 기준 0건.
  - **선행조건 재정리**: ✅ rules 검증 하네스(`tests/`, 97건) · ✅ 초대 코드·크루 상한 설계(`docs/CREW-GATE.md`, 아직 미구현 — 크루가 하나뿐이라 급하지 않음) · ✅ `events.ts` SEED 제거 · ✅ 크루 서브컬렉션 rules 배포+실기기 서버 확정(세션22) · ⬜ **App Check 콘솔 등록(오너 물리작업 — 남은 유일한 오너 작업)**. `run.ts:141~`의 delete→재생성 우회는 **소유권 delete와 정상 공존**해 컷오버와 별개로 유예 중(같은 uid 세션의 재동기화는 그대로 통과, uid가 바뀌는 경우만 그 세션 동기화가 거부됨 — 앱 전체는 안 죽음).
  - `tests/`의 `describe('격리 전 기준선 …')` 13건은 **이제 실패하는 게 정상 상태다**(격리가 실제로 적용됐으므로) — 통과하면 오히려 격리가 풀린 것이니 회귀 신호로 볼 것.
  - **다음 단계는 크루 객체·초대·권한 UI 자체**(공지·역할·출석이력 조회·초대코드 가입 화면) — 데이터 레이어 격리는 끝났지만 이 운영 MVP 화면들은 아직 미구현.
- ✅ **자동 감지 산책의 크루 피드 자동 게시 — S2에서 수정 완료(2026-08-15).** 삼성헬스가 **사용자가 버튼을 안 눌러도** 걷기를 자동 감지해 Health Connect에 쓰는 것(2026-08-14 실기기 확인) 자체는 삼성헬스 쪽 동작이라 못 막지만, 처방 둘 다 적용했다 — ⓐ`healthconnect.ts`의 `silent` 경로(자동 동기화)에서 `kind==='walk'`를 제외(= 고지 없는 자동 수집 차단) ⓑ`feed.ts`의 `buildFeed()`에서 walk를 홈 타임라인에서 제외(= 출석부 노이즈 차단). 동의 문구(`explore/index.tsx`)도 "자동은 달리기만·수동은 달리기+걷기"로 실제 동작과 일치하도록 정정. **걷기 기록 자체는 지우지 않는다** — 러닝 탭 걷기 세그먼트·개인 집계엔 그대로 남고, 사용자가 [워치 불러오기]를 직접 누르면 그대로 들어온다.
  - ⚠️ **`recordingMethod`(자동감지/사용자시작 구분 필드)로 더 정교하게 가릴 수 없다** — 삼성헬스가 이 필드를 항상 UNKNOWN(0)으로 채운다(S3 조사 실증). 그래서 필터 기준은 `kind==='walk'`(거친 기준)로 남아 있다. 8'03"/km 같은 빠른 "걷기"가 실은 오분류된 러닝이어도 임의 거리·페이스 임계값은 **의도적으로 만들지 않았다**(어디에 선을 긋든 틀린다).
- **워치 집계 = "쓰던 앱 그대로"가 카피의 정본.** 앱 이름을 나열하지 말 것 → **「쓰던 러닝앱 그대로 쓰세요. 한 번만 연결하면 기록은 여기로 모입니다.」**
  - **실증 범위**(2026-08-14 갤럭시 S26 SM-S942N · Android 16): 삼성헬스 `WRITE_EXERCISE` granted=true **완전 실증** / **나이키런 4.79.0이 `WRITE_EXERCISE` 포함 쓰기 6종을 선언**(권한 켬 완료, 데이터 유입 미검증) / **Strava 미설치·미검증**.
  - ⛔ **Strava가 `ExerciseSession`을 쓰는지는 확인되지 않았다 — 카피에 확정 사실로 쓰지 말 것.** 공식 문서는 "시간·거리·칼로리"라고만 하고 레코드 타입을 밝히지 않는다. 우리 코드는 `ExerciseSession`이 없으면 **0건 동기화**다(`healthconnect.ts:147` 루프의 출발점).
  - **진짜 병목은 기술이 아니라 스위치**다. NRC가 권한을 선언하고도 `granted=false`였다 — **온보딩에 「쓰던 러닝앱 연결하기」 스텝이 없으면 출석부는 비어 있게 된다.**
  - ✅ **`sourceApp` 저장·표시 — S3에서 정정 완료(2026-08-15).** `healthconnect.ts`가 `dataOrigin.packageName`을 더 이상 버리지 않고 `saveRun()`까지 전달해 `runs.sourceApp`에 저장한다. `lib/run.ts`의 `runSourceLabel()` 하나로 목록·상세·검색 3곳(`explore/index.tsx`·`[id].tsx`·`search.ts`) 라벨을 통일 — 실기기 실증(2026-08-15)으로 `com.sec.android.app.shealth`가 **"삼성 헬스"**로 정확히 뜸을 확인. `sourceApp`이 없는 **레거시 문서만** 옛 폴백("갤럭시워치")을 유지한다(백필 안 함 — 실제로 워치였는지 알 방법이 없어 값을 지어내지 않는다).
- **앱 폰트 = LINE Seed Sans KR**(SIL OFL, `app/assets/fonts/`). expo-font 플러그인이 Rg(400)·Bd(700)을 `LINESeed` family로 묶어 `fontWeight` 네이티브 동작 — **600/800/900은 반올림**되니 `brand.ts`의 `Weight`(regular/bold)·`Radius` 토큰만 쓸 것. 한글 완전지원 검증 스크립트 `app/scripts/check-font-hangul.py`. **교체 금지**(2026-07-27 디자인 자문): Pretendard는 국내 AI 스캐폴딩 기본값이라 역효과, 스포카 한 산스는 한글 2350자만 커버(러너 네임 깨짐), 나눔스퀘어는 톤 불일치. 큰 **숫자만** `FONT_DISPLAY`(Black Han Sans, OFL) — 웹과 시각 DNA 일치.
- 색·타이포는 `docs/DESIGN.md` 기준. **Brand = 포레스트 그린 `#2f6e4a` · 배경 = 크림 `#f9f1e4` · 골드 `#c0841a`(불변)** — 2026-07-30 오렌지→블루→**크림+그린** 재리브랜딩(회장 "너무 파란색이 위주, 아예 새로"). 앱은 `src/lib/brand.ts`, 웹은 `index.html` CSS 변수(단일 소스, 서로 1:1 대응).
  - **시상대 다크는 `#171c12`**(딥 올리브). 자문안 `#26301f`를 쓰면 **골드가 4.30:1로 AA 미달**이다 — 다크 면을 새로 정할 땐 그 위의 골드·텍스트 대비를 반드시 실측할 것.
  - **아바타 링에 브랜드색·골드를 쓰지 말 것**(`components/avatar.tsx`). 링 3색 = 레드 `#d9484b` 359° · 플럼 `#9c5b8a` 317° · 슬레이트 `#35526e` 209°. 액션 그린 146°·골드 38°와 멀고, **색상각만 벌리면 색약(적록)에서 붙어 보이므로 명도까지** 벌렸다. 과거 `RINGS`가 브랜드색을 써서 링과 [러닝 시작] 버튼이 **같은 RGB**였고, 6라운드를 통과해 살아남았다(독립 채점이 픽셀 실측으로 잡음).
- **한글은 `lineHeight`를 반드시 명시**(`brand.ts`의 `leading()`). 안드로이드 기본 1.2배는 라틴엔 충분하지만 한글은 **받침이 내려와** 줄이 붙어 보인다. 본문·라벨(≤17) 1.55 / 제목(18~28) 1.35 / 큰숫자(29+) 1.1.
  - ⚠️ **`TextInput`엔 주지 말 것** — 안드로이드에서 글자 잘림·수직정렬 깨짐. **단위·배지·칩·버튼라벨**도 제외(단일행이라 효과 없이 박스만 커지고, 단위는 숫자 Text 안의 **중첩 inline Text**라 베이스라인 정렬이 흔들린다).
  - 두 문장이면 **줄도 둘로**, 한 문장이면 `{"\n"}`으로 끊기는 자리를 **어절 경계에 고정**. 그냥 두면 320dp에서 `바꿀 수 / 있어요`처럼 구 중간에서 갈린다.
- **디자인 전역 규칙**(2026-07-27 감사로 확립 — 어기면 화면마다 규칙이 갈려 신뢰도가 깎인다):
  - 거리 소수점 = **집계·요약 1자리 / 개별 러닝 기록 2자리**(`lib/run.ts` 주석에 명문화)
  - 숫자 표기 = **숫자(본문색·흰색) + 단위(브랜드 블루)** — 홈·러닝·랭킹·마이·상세 전부.
    **예외 없음**: `km`뿐 아니라 `회`·`/km`·`bpm`·`m`·`일`도 단위다(2026-07-27 R10 감사 — "회는 카운트라 대상 아님" 같은 예외를 두면 같은 값이 화면마다 다르게 보인다). `paceLabel()`처럼 `5'46"/km` 통짜로 오는 값은 뒤 3글자를 떼어 색을 입힐 것
  - **골드는 순위·챌린지·성과 전용** 시그널. 페이스·참석·본문 숫자엔 쓰지 않는다
  - **블루 솔리드 = 액션 전용**, 날짜뱃지 같은 정보 블록은 다크 네이비(`Brand.dark`).
    한 화면의 솔리드 블루는 **주 액션 1개**만 — 보조 액션은 톤온톤(`brandSoft` + `brandDeep`). 되돌릴 수 없는 쪽(종료·삭제)을 더 눈에 띄게 두지 않는다
  - **탭마다 지배적 레이아웃을 다르게**(2026-07-29 R12 전면개편 — "AI스럽다"의 원인이 단일 카드 템플릿 반복이었다): 홈=크루 타임라인(아바타가 레일 노드) / 크루=사진 우선 2열 / 러닝=경로썸네일+가로 스트립 / 랭킹=가로 시상대 / 마이=프로필 히어로. **다크 네이비 카드는 랭킹 시상대 전용** — 두 곳 이상에서 쓰면 "시그니처"가 아니라 두 번째 템플릿이 된다
  - **다크 면 위 텍스트엔 `Brand.brandOnDark`**(`#4a8ae8`, 5.02:1). 라이트용 `Brand.brand`를 다크(`#141a2b`) 위에 얹으면 **3.06:1로 AA 미달**이다(단위는 11~13px라 "큰 텍스트 3:1" 완화도 못 받는다). `backgroundColor: Brand.dark`를 새로 쓸 때마다 **그 위 텍스트색을 전수 확인**할 것
  - **긴 텍스트 처방은 화면마다 다르다**(러너 네임 한계 20자): 폭이 넉넉한 목록 행은 `numberOfLines={3}`으로 풀네임을 책임지고, **시상대처럼 좁은 칸(~81dp)은 한 줄 고정 + 말줄임**. 시상대에 2줄을 허용하면 1위 칸만 길어져 2·3위와 정렬이 무너진다. ⚠️ `adjustsFontSizeToFit`은 **안드로이드에서 `minimumFontScale`을 제대로 지키지 않아** 글자가 과하게 작아진다 — 쓰지 말 것
  - **세그먼트 컨트롤 = 트랙(`Brand.warm`) + 선택된 흰 pill(`Shadow.soft`) + `brandDeep` 텍스트** — 선택 상태는 액션이 아니라 정보라 솔리드 블루도, 다크도 쓰지 않는다. 러닝 탭(달리기/걷기/전체)과 계정 시트(로그인/가입)가 같은 문법이어야 한다
  - 카드는 `Shadow.soft/card`로 띄운다(1px 테두리만 쓰면 와이어프레임처럼 납작). 단 **탭당 1곳은 이 문법을 깨는 시그니처**를 둔다 — 카드가 전 화면 똑같이 반복되는 게 "AI스럽다"의 원인(랭킹 1위 레이아웃이 그 예)
  - 스크롤은 허용하되 **첫 뷰포트 = 상태요약1 + CTA1 + 최근항목1**. 기준 360×800dp(실사용 550dp), 잘리면 폰트가 아니라 콘텐츠를 줄인다.
    ⚠️ **검증 기준기(테스트 갤럭시S21)는 디스플레이 배율이 올라가 있어 실제 320×711dp**(density 480→540). 기준보다 12.5% 좁으니 여기서 안 잘리면 대부분의 폰에서 안전하다 — 긴 한글 카피는 13자 안쪽으로
  - 보조 기능이 첫 뷰포트를 먹지 않게 한다: 러닝 탭 '직접 입력'은 목록 **아래**(FlatList footer), 마이 탭 캐릭터 4종은 **접어두고** [바꾸기]로 펼친다
- **공유 카드는 SVG 절대좌표**(`components/share-card.tsx` · 1080px 기준). RN과 달리 **레이아웃 엔진이 없어 넘친 글자가 조용히 잘린다** — 좌표·폰트크기를 만졌으면 반드시 `cd app && node --experimental-strip-types scripts/check-share-card.ts`로 최악 케이스(마라톤 거리·20자 이름·6시간 러닝)를 먼저 검산할 것. 글자 폭은 눈대중이 아니라 폰트 `hmtx` 실측값(`lib/text-metrics.ts`).
- **마스코트 = 양『오키』** 4종(`assets/images/mascot-{m,f}-{red,green}.png`, 2026-07-30 사람→양 전면교체). 4종 = **리본 유무** × 레드 / 그린(조끼). 파일명·내부 타입(`m-`/`f-`)은 유지 — 바꾸면 저장된 선택이 끊긴다.
  - **구분은 헤어스타일이 아니라 소품으로**(2026-07-31 회장 지시로 "땋은 울" 폐기). 양은 머리카락이 아니라 **울로 덮인 동물**이라 헤어스타일 구분은 형태와 싸운다 — 땋은 머리가 곱슬 울과 겹쳐 어색했다. 리본은 울 위에 얹히는 소품이라 충돌이 없고, **머리 윤곽 밖으로 삐져나와 36px 아바타에서도 실루엣이 갈린다**(목 리본은 정면에서 작아 그 크기에서 사라진다).
  - **이름은 남용 금지.** `MASCOT_NAME` 상수 하나로 정의하고 **마스코트가 실제로 그려진 자리 중 이름이 정보가 되는 곳**에만(마이 탭 캐릭터 섹션 · 배지 축하). 빈 상태·온보딩엔 넣지 않는다 — 반복 노출 지점에 1인칭을 쓰면 3050 남성에게 유치함이 누적된다.
  - **재생성 시 통과 조건**(시안 5컷을 버리며 얻은 것): **늘어진 귀 + 곱슬 울 + 짧고 뭉툭한 주둥이**(길면 말·당나귀로 읽힘) + **정면 3/4 상반신 중심**(측면 전신은 36px 아바타에서 얼굴이 사라진다) + **프레임 여백 명시**(안 하면 머리가 잘림). 얼굴을 살구색 사람 피부로 두면 "곱슬머리 아기"가 된다.
  - **변형은 AI 재생성이 아니라 코드로** — 4종 전부 한 장의 원본에서 파생한다: `scripts/recolor-mascot-vest.mjs`(조끼 hue만 밝기비 유지 재도색) · `scripts/add-mascot-ribbon.mjs`(머리 오른쪽 위에 조끼색 리본 합성, 512px 절대좌표) — AI로 두 번 그리면 실루엣이 미묘하게 달라져 "같은 양의 다른 팀"이 아니라 다른 양이 된다. 배경 제거는 `cutout-mascot-bg.mjs`(마젠타 크로마키)·`strip-mascot-shadow.mjs`(발밑 그림자) → `optimize-mascot.mjs`(512px).
  - **앱 아이콘은 얼굴 클로즈업, 스플래시만 전신**. 안드로이드 어댑티브는 108dp 중 **가운데 66dp만 보장**돼 전신을 넣으면 발·귀가 잘린다. ⚠️ `adaptiveIcon.backgroundImage`가 있으면 **`backgroundColor`보다 우선**한다(초록으로 바꿔도 소용없던 원인).
- **큰 의존성 추가·배포·push는 실행 전 확인**. 커밋은 작은 단위, main 직접 커밋 시 브랜치 먼저.
- **배포 방향(2026-07-18 결정) = 구글 플레이스토어 정식출시.** GitHub/APK 사이드로드는 접음(카톡 .apk 차단·Auto Blocker 마찰). 준비물: 개발자등록 $25(1회)·AAB 빌드·심사(위치/건강 권한). **급하지 않음 → 차분히 준비 트랙, 현재는 앱 기능 집중.** 실기기 테스트는 로컬 APK 빌드 유지. ⚠️ **혼동주의**: Firebase(구글)=데이터DB(회원·글·이미지, 무료로 용량충분) ↔ APK=앱 설치파일. 둘은 별개.
- 앱 코드 작성 전 Expo v57 문서 확인(`app/AGENTS.md`). 워치·네이티브 모듈은 Expo Go/웹 불가 → dev/preview build 필요.
- **`app/metro.config.js`의 `unstable_enablePackageExports = false`를 지우지 말 것** — firebase v10이 Metro의 package exports 해석과 충돌해 `@firebase/app` 사본이 갈리고, 앱이 시작과 동시에 `Component auth has not been registered yet`으로 즉사한다. firebase 12+로 올릴 때만 제거하고 실기기 재검증.
- **신원**: 문서 작성자는 `name` 문자열로 박제된다(웹·앱 공유 스키마). 러너 네임 변경은 반드시 `lib/identity.ts`의 `saveRunnerName()` 단일 경로로 — 과거 글·참석·러닝·댓글의 이름까지 함께 갱신해야 기록이 유실되지 않는다.
  - **모든 신규 Firestore 쓰기에 `uid`·`crewId`가 붙는다**(2026-08-14 S1). `crew.ts`의 **`withOwner()` 한 곳**이 `fbAdd`/`fbPut`을 통해 8개 컬렉션 전부를 덮는다 — **여기 말고 다른 데서 소유 필드를 심지 말 것.** `fbUpdate`·`renameAuthor`엔 **일부러 안 넣었다**(남의 문서를 수정하는 경로라 소유자를 심으면 사칭이 된다).
  - **앱 시작 시 익명 로그인이 자동으로 걸린다** — `auth.ts`의 `ensureSignedIn()`(`_layout.tsx`에서 1회 + `fbAdd`/`fbPut`이 각자 await). ⚠️ **`onAuthStateChanged` 첫 통지를 기다린 뒤에만 게스트를 만든다** — `auth.currentUser`를 즉시 읽으면 영속 세션 복원 전이라 null이고, 그대로 `signInAnonymously`를 부르면 **새 uid가 발급돼 기존 계정과 갈린다**(게스트→가입에서 `linkWithCredential`로 막았던 것과 같은 함정). 실패는 삼켜 앱을 막지 않는다.
  - **`CREW_ID = "modu"`**(`lib/firebase.ts`) — 지금은 **적기만 하고 아무 데서도 읽지 않는다.** 두 번째 크루 때의 전수 백필을 피하려는 자리 예약. ⚠️**값을 바꾸지 말 것**(이전 문서가 다른 크루가 된다). ⚠️`web/index.html`에 **같은 값이 복제**돼 있다(정적 HTML이라 TS import 불가) — 함께 고칠 것.
  - ⚠️ **기존 `runs` 3건은 `uid`·`sourceApp`이 없다**(2026-08-14 확인). 소유 규칙을 걸 때 **유예 조항**이 필요하다. 백필하지 않고 자연 소멸시킨다.
  - ✅ **소유권 delete — S4(2026-08-15) 3곳 → 세션16(2026-08-15)에 8곳 전체로 확장.** `firestore.rules`의 `isOwnerOrLegacy()`(`!('uid' in resource.data) || resource.data.uid == request.auth.uid`)를 **8개 컬렉션 전부**(`runs`·`guestbook`·`gallery`·`attendance`·`claps`·`comments`·`events`·`profiles`)의 `delete`에 적용했다. `uid` 없는 레거시 문서는 여전히 누구나 지울 수 있다(자연 소멸 대상이라 그대로 둠). `runs`·`guestbook`·`gallery`는 `crew.ts`의 `isMine(row, myName)` UI 가드가 이미 짝을 이루고 있었고(S4), `attendance`·`claps`·`profiles`는 애초부터 UI가 "내 것만" 지우는 self-scope 구조라 UI 변경 없이 rules만 좁혀도 회귀가 없다(세션16 조사로 확인). `comments`·`events`는 앱에 삭제 UI 자체가 없어(전수 grep 확인) rules를 좁혀도 영향받는 화면이 0개다. rules 테스트 20건 추가(45→65/65 그린).
  - ⚠️ `run.ts`의 delete→재생성 우회(위 항목)는 **소유권 delete와 정상 공존한다** — 같은 게스트 세션이 자기 워치 기록을 재동기화하면 uid가 그대로라 delete가 통과한다. uid가 바뀌는 유일한 경우(앱 재설치로 새 익명 계정 발급)엔 delete가 거부돼 그 세션만 동기화 실패로 끝난다(앱 전체는 안 죽음) — 의도된 보안 강화다.
- ✅ **S5(백그라운드 GPS 러닝) — 크래시 원인 해소(2026-08-15 세션15).** 오너가 ①안(`blockedPermissions`에서 `RECEIVE_BOOT_COMPLETED` 제거)을 승인. `ACCESS_BACKGROUND_LOCATION`은 여전히 추가하지 않았고 `patch-package`도 도입하지 않았다 — Foreground Service만으로 화면 OFF 추적을 유지한다. 실기기(SM-G991N·갤럭시 S21·Android 15)에서 [러닝 시작] → 화면 OFF → **5시간 9분 59초** 경과까지 `logcat -b crash` 0건·프로세스 재시작 0회로 예전 크래시 지점(첫 위치 이벤트 도착)을 완전히 통과했다. `blockedPermissions`가 남긴 나머지 3개(RECORD_AUDIO·SYSTEM_ALERT_WINDOW·CAMERA)는 그대로 유지.
  - **미완료로 남은 것** — ⓐ 실제 옥외 500m+ 이동 중 거리·경로 누적의 실측(세션15에서 사용자 이동 불가로 미수행, 화면 OFF 생존 자체는 검증됨) ⓑ GPS 종료 시 Firestore **서버 확정** 저장 확인(세션15 시점 기기가 캡티브 포털 공용 WiFi라 인터넷이 끊겨 있어 `저장 중…`에서 멈춤 — 코드 문제 아니라 네트워크 환경 문제로 판정, 정상 네트워크에서 재확인 필요). 둘 다 일반 네트워크에서 5~10분짜리 실측 1회면 닫힌다.
  - 코드(`live-tracking.ts`의 거리·경로·상승고도 계산, `live-run.tsx`의 armTracking 재구성)는 이번 크래시 수정과 무관하게 그대로 유효.
- 비밀값(.env·Firebase 키)은 커밋 금지. `web/index.html`의 `firebaseConfig`와 `app/.env`는 같은 프로젝트 값.

## 저장소
github.com/ikjun87-beep/modu-marathon

---
**세션 시작 시 [`JN.md`](JN.md)를 먼저 읽고 이어서 작업할 것.**
