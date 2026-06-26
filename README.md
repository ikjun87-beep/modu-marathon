# 모두의 마라톤 🏃‍♂️🏃‍♀️

러닝·마라톤을 함께하는 사람들을 위한 **크루 + 기록 앱**.
웹·모바일(Expo)·스마트워치가 **Firebase 한 데이터**로 연동됩니다. (전신: 달려라 대토신)

## 구성
- `web/` — 홈페이지 (리브랜딩 대상, 기존 Firebase 웹앱 이관)
- `app/` — Expo(React Native) 모바일 앱 (iOS+Android, M2에서 스캐폴드)
- `docs/` — [`PRD.md`](docs/PRD.md) 기획 · [`FIREBASE_SETUP.md`](docs/FIREBASE_SETUP.md)
- `firestore.rules` — Firestore 보안 규칙

## 스택
Firebase(Auth/Firestore/Storage) · Expo(React Native) · 웹 · HealthKit/Health Connect(2단계)

## 로드맵
M0 셋업 → M1 웹 리브랜딩 → M2 앱(로그인·러닝기록·크루피드) → M3 워치 연동 → M4 배포.
자세히는 [`docs/PRD.md`](docs/PRD.md).

## 시작
1. Firebase 설정 → [`docs/FIREBASE_SETUP.md`](docs/FIREBASE_SETUP.md)
2. 웹 미리보기: `web/index.html` 브라우저로 열기
3. 앱(M2 이후): `cd app && npx expo start`
