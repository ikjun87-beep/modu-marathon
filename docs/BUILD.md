# BUILD.md — 앱을 실제 폰에 설치하기 (M2.5)

> 목표: **사람들이 폰에 깔아서 쓰는 앱** (North Star, `PRD.md §1-2`).
> 핵심: 워치 데이터(HealthKit·Health Connect)는 **Expo Go·웹에서 불가** → 반드시 아래 실제 빌드가 필요.

## 준비물
- **Expo 계정**(무료) — https://expo.dev 가입
- Android: 추가 비용 없음(APK 바로 설치)
- iOS 실기기/TestFlight: **Apple Developer $99/년**
- 스토어 정식 출시: Google Play **$25(1회)** / Apple(위 $99에 포함)

## 1) 가장 빠른 길 — Android APK (무료)
```bash
cd app
npx eas-cli login                 # Expo 계정 로그인 (최초 1회)
npx eas-cli build:configure       # eas 프로젝트 연결(자동으로 app.json에 projectId 추가)
npx eas-cli build -p android --profile preview
```
- 빌드는 Expo 클라우드에서 진행(수~십수 분). 끝나면 **APK 다운로드 링크** 제공.
- 그 링크를 안드로이드 폰에서 열어 설치 → **끝. 폰에 깔림.**

## 2) iOS (Apple Developer 필요)
```bash
cd app
npx eas-cli build -p ios --profile preview   # 또는 production → TestFlight
```
- Apple 계정 로그인 흐름을 따라감. TestFlight로 지인 배포 가능.

## 3) 워치 연동용 개발 빌드 (M3 준비)
HealthKit/Health Connect 네이티브 모듈은 **development 빌드(dev client)**에서 동작:
```bash
cd app
npx eas-cli build -p android --profile development   # Health Connect(갤럭시워치)
npx eas-cli build -p ios --profile development       # HealthKit(애플워치)  ※ Apple $99
npx expo start --dev-client                           # 설치된 dev client에 연결
```

## 빌드 프로필 (`app/eas.json`)
- **preview** — 내부배포 APK/IPA(설치용, 가장 빠른 확인)
- **development** — dev client(네이티브 모듈·워치 연동 개발)
- **production** — 스토어 제출용

## 식별자 (`app/app.json`)
- `android.package` / `ios.bundleIdentifier` = `com.modumarathon.app` (변경 시 스토어 등록 전에 확정할 것)

## 다음(연동 후보 라이브러리 — M3)
- iOS: `react-native-health`(HealthKit) 또는 Expo 호환 HealthKit 플러그인
- Android: `react-native-health-connect`(Health Connect / 갤럭시워치·Google Fit)
- 읽는 데이터: 거리·심박·페이스·러닝 세션 → 앱 `runs`/피드로 통합
