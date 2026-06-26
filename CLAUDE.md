# CLAUDE.md — 모두의 마라톤

> 다음에 이걸 읽고 이어가면 됨. 상세 기획은 [`docs/PRD.md`](docs/PRD.md).

## 프로젝트 한 줄
러닝·마라톤 크루 + 기록 앱. 웹·모바일(Expo)·스마트워치가 **Firebase 한 데이터**로 연동. (전신: 달려라 대토신)

## 스택 (확정)
- 백엔드: **Firebase**(Auth/Firestore/Storage) — 단일 소스
- 웹: `web/` (리브랜딩 대상)
- 앱: **Expo(React Native)** `app/` — iOS+Android 한 코드베이스
- 워치(2단계): HealthKit / Health Connect 로 기록 읽기

## 현재 단계
**M0 셋업** 완료 후 → **M1 웹 리브랜딩** → **M2 Expo 앱 + Firebase + 로그인 + 러닝기록 + 크루피드** → M3 워치 → M4 배포. (로드맵: PRD §4)

## 작업 규칙
- 웹·앱이 **같은 Firebase 프로젝트/스키마**를 쓰도록 유지(연동이 핵심 목표).
- 원본 데이터·기존 자산 보존(달려라 대토신 repo는 그대로 둠).
- 큰 의존성 추가/배포 전 확인. 커밋·push는 작은 단위로.

## 플러그인 활용 (moai)
- 앱·웹 출시 단계에서 마케팅/콘텐츠 플러그인 활용:
  - 랜딩/소개: `moai-content:landing-page` · 카드뉴스/SNS: `moai-marketing:sns-content`
  - 제품 기획·로드맵: `moai-product:*`
- 필요 시 `moai-core:project`로 워크플로(CLAUDE.md 체이닝) 재정비 가능.

## 저장소
github.com/ikjun87-beep/modu-marathon
