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
- [x] 의존성 설치(`npm install`) + firebase·AsyncStorage
- [x] 크루 피드(방명록, `src/app/index.tsx`) — 웹과 guestbook 공유
- [x] 러닝 기록(거리·시간·페이스, `src/app/explore.tsx`) — runs 컬렉션
- [x] 데이터 레이어(`src/lib/crew.ts`): Firebase 있으면 실시간, 없으면 로컬 폴백
- [x] 검증: `npx expo export --platform web` 번들 성공(정적 렌더 통과)
- [ ] **로그인(Firebase Auth)** — 현재는 이름 기반 신원(session). 다음 슬라이스
- [ ] 갤러리(사진 업로드)·모임 참석 체크 화면 (웹 gallery/attendance 대응)
- [ ] 실기기/에뮬레이터 확인(`npm run ios`/`android`), `.env`에 Firebase 값 입력

## 시작하기
```bash
cd app
npm install                  # (최초 1회) 의존성 설치
cp .env.example .env          # Firebase 값 입력 (docs/FIREBASE_SETUP.md)
npm run web                   # 브라우저 미리보기 (가장 빠른 확인)
# npm run ios / npm run android — 실기기·에뮬레이터
```

@AGENTS.md
