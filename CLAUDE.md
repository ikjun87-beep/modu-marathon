# CLAUDE.md — 모두의 마라톤

> 프로젝트의 **고정 정보**만. 진행 상황·TODO는 [`JN.md`](JN.md), 상세 기획은 [`docs/PRD.md`](docs/PRD.md).

## 프로젝트 목적
러닝·마라톤 크루 + 기록 앱. 웹·모바일(Expo)·스마트워치가 **하나의 Firebase 데이터**로 연동되는 종합 러닝 앱을 지향. 최우선 목표는 **실제 폰에 설치·확산**. (전신: 달려라 대토신)

## 폴더 구조
```
web/                  홈페이지(정적 HTML 단일 파일)
  index.html          랜딩 + 크루 커뮤니티(참석·갤러리·방명록·합류) — Firebase 또는 localStorage 폴백
  brand/              로고 자산(mark/mark-white/favicon/logo-horizontal/og .svg)
app/                  Expo(React Native) 앱 — iOS+Android+web 한 코드베이스
  src/app/            화면(Expo Router 파일 라우팅): index=크루, explore=러닝
  src/lib/            firebase.ts·crew.ts(데이터)·session.ts·auth.ts·brand.ts
  src/components/      name-field·schedule-section·gallery-section 등
  eas.json            EAS 빌드 프로필(preview=APK / development=dev client / production)
docs/                 PRD·DESIGN(디자인 시스템)·BUILD(설치 빌드)·FIREBASE_SETUP
firestore.rules       Firestore 보안 규칙
.claude/agents/       재사용 서브에이전트(homepage-expert·marathon-expert)
```

## 기술 스택
- 백엔드: **Firebase**(Auth·Firestore·Storage) — 웹·앱·워치 공용 단일 소스
- 웹: 정적 HTML/CSS/JS (빌드 없음), Firebase JS SDK(CDN)
- 앱: **Expo SDK 57 · React Native · TypeScript · Expo Router**, firebase npm, AsyncStorage
- 워치(2단계): HealthKit(iOS) / Health Connect(Android)로 기록 읽기

## 주요 명령어
```bash
# 웹 (빌드 불필요, 정적 서빙)
cd web && python3 -m http.server 8080 --bind 0.0.0.0   # http://localhost:8080

# 앱
cd app && npm install
npm run web                         # 브라우저 미리보기(가장 빠른 확인)
npm run ios / npm run android       # 실기기·에뮬레이터
npx tsc --noEmit                    # 타입체크
npx expo export --platform web      # 번들 검증(정적 렌더)

# 앱 실제 설치 빌드 (docs/BUILD.md)
cd app && npx eas-cli login && npx eas-cli build -p android --profile preview
```

## 지켜야 할 규칙
- 웹·앱이 **같은 Firebase 프로젝트/스키마**를 쓰도록 유지 — 컬렉션: `guestbook`·`gallery`·`attendance`·`runs`·`waitlist`. 스키마 단일 소스는 `app/src/lib/firebase.ts`의 `COLLECTIONS`.
- 색·타이포는 `docs/DESIGN.md` 기준(Brand Orange `#ff5a3c`). 앱은 `src/lib/brand.ts`.
- **큰 의존성 추가·배포·push는 실행 전 확인**. 커밋은 작은 단위, main 직접 커밋 시 브랜치 먼저.
- 앱 코드 작성 전 Expo v57 문서 확인(`app/AGENTS.md`). 워치·네이티브 모듈은 Expo Go/웹 불가 → EAS dev build 필요.
- 비밀값(.env·Firebase 키)은 커밋 금지. `web/index.html`의 `firebaseConfig`와 `app/.env`는 같은 프로젝트 값.

## 저장소
github.com/ikjun87-beep/modu-marathon

---
**세션 시작 시 [`JN.md`](JN.md)를 먼저 읽고 이어서 작업할 것.**
