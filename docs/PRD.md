# 모두의 마라톤 — PRD (제품 기획)

> 전신: **달려라 대토신**(친목 러닝 크루 Firebase 웹앱) → **모두의 마라톤**으로 리브랜딩·확장.
> 작성 2026-06-26.

## 1. 한 줄 정의
러닝·마라톤을 함께하는 사람들을 위한 **크루 + 기록 앱** — 웹·모바일·스마트워치가 한 데이터로 연동.

## 2. 플랫폼 / 기술 스택 (확정)
- **백엔드: Firebase**(Auth · Firestore · Storage) — 웹·앱·워치 데이터의 **단일 소스**(연동 핵심). 기존 달려라 대토신에서 이어옴.
- **웹(홈페이지)**: `web/` — 리브랜딩. (현재 단일 `index.html`+Firebase. 확장 시 Next.js 검토)
- **모바일 앱: Expo (React Native)** — `app/`. **한 코드베이스로 iOS+Android**, 웹 React와 로직 공유, Firebase JS SDK 사용.
- **스마트워치(2단계)**: **HealthKit**(애플워치) + **Health Connect / Google Fit**(갤럭시·기타 Wear OS)에서 러닝 기록(거리·심박·페이스) **읽기**. 풀 커스텀 워치앱은 추후.

## 3. 핵심 기능
**크루·소셜 (기존 자산 계승)**
- 모임 참석 체크 / 러닝 갤러리(사진) / 방명록 / 크루 통계

**러닝·마라톤 (신규)**
- 러닝 기록(수동 입력 → 2단계에서 워치 자동 가져오기): 거리·시간·페이스
- 크루 랭킹·누적 거리 / 마라톤·모임 일정

**계정**
- Firebase Auth(로그인) — 웹·앱 공통 계정

## 4. 로드맵 (단계적: 웹+앱 MVP 먼저, 워치 2단계)
| 단계 | 내용 | 상태 |
|---|---|---|
| **M0** | 프로젝트 셋업(폴더·repo·기획·Firebase 프로젝트) | 진행중 |
| **M1** | 웹 리브랜딩 (달려라 대토신 → 모두의 마라톤) | ☐ |
| **M2** | Expo 앱 스캐폴드 + Firebase 연결 + 로그인 + 러닝 기록(수동) + 크루 피드 | ☐ |
| **M3** | 스마트워치 연동(HealthKit / Health Connect로 기록 가져오기) | ☐ |
| **M4** | 배포 — 웹(호스팅) · 앱(TestFlight / Play 내부테스트) | ☐ |

## 5. 비용·계정(미리 알아둘 것)
- Firebase: 무료 Spark로 시작 가능
- iOS 실기기·배포: **Apple Developer $99/년** · Android: **Google Play $25(1회)**
- 워치: Health API 읽기는 무료(앱 권한). 풀 워치앱은 네이티브 추가작업.

## 6. 폴더 구조
```
modu-marathon/
├─ web/        # 홈페이지(리브랜딩 대상, 기존 index.html 이관됨)
├─ app/        # Expo(React Native) 앱 — M2에서 스캐폴드
├─ docs/       # 기획·세팅(PRD, FIREBASE_SETUP)
└─ firestore.rules
```

## 7. 다음 액션
1. Firebase 프로젝트 생성/확인(기존 것 재활용 가능) → `docs/FIREBASE_SETUP.md`
2. M1 웹 리브랜딩 텍스트·브랜딩 교체
3. M2 `npx create-expo-app app` 스캐폴드 + Firebase 연결
