# CLAUDE.md — 모두의 마라톤 앱 (Expo)

> 상위 기획: 루트 [`../CLAUDE.md`](../CLAUDE.md) · [`../docs/PRD.md`](../docs/PRD.md) · 디자인: [`../docs/DESIGN.md`](../docs/DESIGN.md)

## 스택
- **Expo (React Native) + TypeScript + Expo Router** (파일 기반 라우팅, `src/app/`)
- Expo SDK 57 · React 19 · react-native-web (웹 미리보기 가능)
- 백엔드: **Firebase**(웹과 동일 프로젝트/스키마) — `src/lib/firebase.ts`

## 핵심 규칙
- 웹(`../web/index.html`)과 **같은 Firebase 컬렉션**(`guestbook`·`gallery`·`attendance`)을 공유한다 — `src/lib/firebase.ts`의 `COLLECTIONS`.
- 색·타이포는 `../docs/DESIGN.md` 기준(Brand Orange `#ff5a3c`, Teal, Gold).

## 현재 상태 (M2 진행중)
- [x] `create-expo-app` 스캐폴드(기본 탭 템플릿) + 리브랜딩(app.json)
- [x] Firebase 배선(`src/lib/firebase.ts`) + `.env.example`
- [ ] **의존성 설치**: `npm install` (아직 안 함 — node_modules 미설치)
- [ ] 로그인(Firebase Auth) / 러닝 기록(수동) / 크루 피드 화면
- [ ] 예제 화면(`src/app/index.tsx`,`explore.tsx`) → 실제 화면으로 교체

## 시작하기
```bash
cd app
npm install                  # (최초 1회) 의존성 설치
cp .env.example .env          # Firebase 값 입력 (docs/FIREBASE_SETUP.md)
npm run web                   # 브라우저 미리보기 (가장 빠른 확인)
# npm run ios / npm run android — 실기기·에뮬레이터
```

@AGENTS.md
