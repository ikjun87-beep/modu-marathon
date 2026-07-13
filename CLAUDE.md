# CLAUDE.md — 모두의 마라톤

> 프로젝트의 **고정 정보**만. 진행 상황·TODO는 [`JN.md`](JN.md), 상세 기획은 [`docs/PRD.md`](docs/PRD.md).

## 프로젝트 목적
러닝·마라톤 크루 + 기록 앱. 웹·모바일(Expo)·스마트워치가 **하나의 Firebase 데이터**로 연동되는 종합 러닝 앱을 지향. 최우선 목표는 **실제 폰에 설치·확산**. (전신: 달려라 대토신)

## 폴더 구조
```
web/                  홈페이지(정적 HTML) — 공개배포 https://modu-marathon.web.app (Firebase Hosting)
  index.html          랜딩 + 크루 커뮤니티(참석·갤러리·방명록·합류) — Firebase 또는 localStorage 폴백
  privacy.html        개인정보 처리방침 공개 페이지(/privacy) — 웹 푸터·(후행)앱 온보딩에서 링크
  brand/              로고 자산(mark/mark-white/favicon/logo-horizontal/og .svg)
app/                  Expo(React Native) 앱 — iOS+Android+web 한 코드베이스
  src/app/            화면(Expo Router 파일 라우팅, 하단 5탭 NativeTabs): index=홈(Today 큐레이션·통합검색) / crew=크루 / explore/=러닝(explore/_layout=Stack, index=목록, run/[id]=상세 push+댓글, ios_from_right) / ranking=랭킹 / my=마이. 탭아이콘=Material `md=`
  src/lib/            firebase.ts·crew.ts(데이터,put멱등)·run.ts(통합Run·헬퍼)·run-path.ts(GPS경로 온디바이스 저장,서버미저장)·map-style.ts(구글맵 커스텀 파스텔)·healthconnect.ts(갤럭시워치)·health-consent.ts(심박 별도동의)·session·auth·brand
  src/components/      icon.tsx(웹과1:1 SVG아이콘)·live-run.tsx(GPS트래킹모달)·run-map.native/web.tsx(구글맵 경로,플랫폼분리)·name-field·schedule-section·gallery-section 등
  plugins/            커스텀 Expo config 플러그인(withHealthConnectPermissionDelegate=워치 권한런처 등록)
  scripts/serve-web.py 앱 웹 미리보기 서버(클린 URL 매핑; python http.server는 /explore 404)
  scripts/build-local-apk.sh  로컬 APK 빌드(prebuild→릴리스 서명 주입→gradlew assembleRelease)
  metro.config.js     package exports 끔 — firebase v10의 dual-package hazard 회피(끄지 않으면 앱 즉사)
  eas.json            EAS 빌드 프로필(preview=APK / development=dev client / production) — env에 Firebase 공개키 주입
docs/                 PRD·DESIGN(디자인 시스템)·BUILD(설치 빌드)·FIREBASE_SETUP·PRIVACY·QA_M3_DEVICE(실기기 대본)·UX_APP_NAV(P7 다중페이지 제안)·WATCH_SAMSUNG_SDK(워치 삼성헬스 한계·SDK 검토)·OPENAI_IMAGE_GEN(이미지 생성 이식 가이드)
generate-image.mjs    OpenAI gpt-image-1 이미지 생성 CLI(배너·아이콘·마스코트). 실행 `node --env-file=.env generate-image.mjs "영어프롬프트" out.png [ref.png]`. 키=루트 `.env`의 `OPENAI_API_KEY`(gitignore). AI엔 글자 금지→글자는 코드 합성.
firestore.rules       Firestore 보안 규칙
firebase.json·.firebaserc  Firebase 배포 설정(hosting=web/ · firestore rules · 프로젝트 modu-marathon)
.claude/agents/       재사용 서브에이전트(homepage-expert·marathon-expert)
```

## 기술 스택
- 백엔드: **Firebase**(Auth·Firestore·Storage) — 웹·앱·워치 공용 단일 소스
- 웹: 정적 HTML/CSS/JS (빌드 없음), Firebase JS SDK(CDN)
- 앱: **Expo SDK 57 · React Native · TypeScript · Expo Router**, firebase npm, AsyncStorage, react-native-svg, expo-location(실시간 GPS), react-native-maps(구글맵 경로표시), react-native-health-connect(갤럭시워치)
- 워치: Health Connect(Android/갤럭시) — **minSdk 26 필수**(`expo-build-properties`로 지정, dev/preview build 전용). HealthKit(iOS)은 후행

## 주요 명령어
```bash
# 웹 (빌드 불필요, 정적 서빙)
cd web && python3 -m http.server 8080 --bind 0.0.0.0   # http://localhost:8080
npx firebase-tools deploy --only hosting               # 공개배포(로그인 캐시됨) → modu-marathon.web.app
npx firebase-tools deploy --only firestore:rules       # 보안규칙 배포

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

# 실기기 디버깅(앱 즉사·크래시): 무선 adb
adb connect <폰 무선디버깅 메인화면 IP:포트>
adb logcat -b crash -c && adb shell monkey -p com.modumarathon.app -c android.intent.category.LAUNCHER 1
adb logcat -d -b crash        # 패키지명=com.modumarathon.app
```

## 지켜야 할 규칙
- 웹·앱이 **같은 Firebase 프로젝트/스키마**를 쓰도록 유지 — 컬렉션: `guestbook`·`gallery`·`attendance`·`runs`·`comments`·`waitlist`. 스키마 단일 소스는 `app/src/lib/firebase.ts`의 `COLLECTIONS`.
- 색·타이포는 `docs/DESIGN.md` 기준(**Brand = Azure Blue `#2563c9`**, accent 골드 `#c0841a` — 2026-07-12 오렌지→블루 리브랜딩). 앱은 `src/lib/brand.ts`, 웹은 `index.html` CSS 변수(단일 소스).
- **큰 의존성 추가·배포·push는 실행 전 확인**. 커밋은 작은 단위, main 직접 커밋 시 브랜치 먼저.
- 앱 코드 작성 전 Expo v57 문서 확인(`app/AGENTS.md`). 워치·네이티브 모듈은 Expo Go/웹 불가 → dev/preview build 필요.
- **`app/metro.config.js`의 `unstable_enablePackageExports = false`를 지우지 말 것** — firebase v10이 Metro의 package exports 해석과 충돌해 `@firebase/app` 사본이 갈리고, 앱이 시작과 동시에 `Component auth has not been registered yet`으로 즉사한다. firebase 12+로 올릴 때만 제거하고 실기기 재검증.
- **신원**: 문서 작성자는 `name` 문자열로 박제된다(웹·앱 공유 스키마). 러너 네임 변경은 반드시 `lib/identity.ts`의 `saveRunnerName()` 단일 경로로 — 과거 글·참석·러닝·댓글의 이름까지 함께 갱신해야 기록이 유실되지 않는다.
- 비밀값(.env·Firebase 키)은 커밋 금지. `web/index.html`의 `firebaseConfig`와 `app/.env`는 같은 프로젝트 값.

## 저장소
github.com/ikjun87-beep/modu-marathon

---
**세션 시작 시 [`JN.md`](JN.md)를 먼저 읽고 이어서 작업할 것.**
