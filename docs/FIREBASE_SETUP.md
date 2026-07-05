# 🔧 Firebase 연결 가이드 (방명록·갤러리·참석 공유하기)

이 단계를 마치면 **모든 사람이 같은 방명록·사진·참석 현황**을 보게 됩니다.
(설정 전에는 각자 기기에만 저장돼요.)

---

## 1. Firebase 프로젝트 만들기 (약 5분, 무료)

1. https://console.firebase.google.com 접속 → 구글 계정 로그인
2. **프로젝트 추가** → 이름: `dallyeora-daetosin` (아무거나) → 만들기
   - Google 애널리틱스는 꺼도 됩니다.

## 2. 웹앱 등록하고 설정값 복사

1. 프로젝트 홈에서 **`</>` (웹)** 아이콘 클릭
2. 앱 닉네임: `dallyeora` 입력 → **앱 등록**
3. 화면에 나오는 `firebaseConfig` 블록을 복사:
   ```js
   const firebaseConfig = {
     apiKey: "AIza...",
     authDomain: "dallyeora-xxxx.firebaseapp.com",
     projectId: "dallyeora-xxxx",
     storageBucket: "dallyeora-xxxx.appspot.com",
     messagingSenderId: "1234567890",
     appId: "1:1234:web:abcd"
   };
   ```
4. **`index.html`** 을 열고, 하단 `<script type="module">` 안의
   `🔧 여기에 Firebase 설정을 붙여넣으세요` 부분의 빈 `firebaseConfig`를 **위 값으로 교체**.

## 3. Firestore 데이터베이스 켜기

1. 왼쪽 메뉴 **빌드 → Firestore Database** → **데이터베이스 만들기**
2. 위치: `asia-northeast3 (서울)` 권장 → 다음
3. 보안 규칙: 일단 **테스트 모드로 시작** 선택 → 사용 설정
   - (테스트 모드는 30일 뒤 막히니, 아래 4번 규칙으로 바꿔두면 좋아요.)

## 4. 보안 규칙 설정 (권장)

Firestore Database → **규칙** 탭 → 아래 내용으로 교체 → **게시**:

저장소 루트 [`firestore.rules`](../firestore.rules)를 그대로 쓰세요(콘솔 붙여넣기 또는 아래 6번 CLI 배포).
현재 규칙 요지:
- 방명록·갤러리·참석·러닝: 누구나 읽기 + 생성(타입·크기 검증) + 삭제(친목용 삭제/토글 버튼).
- `runs`: `distanceKm` 0~500 범위 검증으로 통계 오염 방지. 무관한 `update`는 봉쇄.
- **`waitlist`(이메일): 읽기 차단** — 대기자 이메일은 관리자만 Firebase 콘솔에서 조회(하베스팅 방지).

> ⚠️ 이 규칙은 "아는 사람들끼리 카톡으로 링크 공유"하는 친목용입니다. **인증(Auth)이 없어 삭제(delete)를
> 소유자만으로 제한할 수 없으므로**, 외부 확산 시 비정상 클라이언트의 대량삭제·봇도배를 막으려면
> **App Check를 활성화**하세요(아래 7번). 규모가 더 커지면 Firebase Auth 로그인 도입을 권합니다.

## 5. 앱(Expo)에도 같은 값 넣기 — 웹·앱 실시간 공유의 핵심

앱은 코드가 아니라 **`app/.env`** 파일에서 값을 읽습니다(같은 프로젝트 값이어야 웹·앱이 한 데이터로 붙습니다).

```bash
cd app
cp .env.example .env      # 최초 1회
```

`app/.env`를 열고 2번에서 복사한 값을 채웁니다(6줄, 따옴표 없이 `=` 뒤에 그대로):

```
EXPO_PUBLIC_FIREBASE_API_KEY=AIza...
EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN=dallyeora-xxxx.firebaseapp.com
EXPO_PUBLIC_FIREBASE_PROJECT_ID=dallyeora-xxxx
EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET=dallyeora-xxxx.appspot.com
EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=1234567890
EXPO_PUBLIC_FIREBASE_APP_ID=1:1234:web:abcd
```

> `.env`는 커밋 금지(이미 `.gitignore`에 있음). `projectId`만 채워지면 앱이 자동으로
> 로컬 저장 → Firestore 실시간 공유로 전환됩니다(`HAS_FIREBASE` 가드). 값 저장 후 `npm run web` 재시작.

## 6. 보안 규칙 배포 + 끝!

콘솔에 붙여넣는 대신 CLI로 배포하려면(저장소 `firestore.rules`를 그대로 올림):

```bash
# 최초 1회: 로그인 + 프로젝트 연결
npx firebase-tools login
npx firebase-tools use --add        # 2번에서 만든 projectId 선택
# 규칙 배포
npx firebase-tools deploy --only firestore:rules
```

`index.html`을 커밋·푸시하고 GitHub Pages로 열면, 폰·카톡·다른 컴퓨터 어디서든
**같은 방명록·사진·참석 현황·러닝 기록**이 보입니다. 🎉

## 7. (확산 전) App Check로 남용 차단 — delete·이메일수거·봇도배 방어

인증이 없는 친목 모델에서 **비정상 클라이언트(projectId만 알면 되는 REST 스크립트 등)**의 대량삭제·데이터 오염·쿼터 소진을 막는 실효 수단입니다. **monitor(관찰) → enforce(강제)** 순서로 안전하게 켭니다.

**① 웹(reCAPTCHA v3)**
1. Firebase 콘솔 → **빌드 → App Check** → 웹앱 선택 → **reCAPTCHA v3** 공급자 등록 → **site key** 발급
2. `web/index.html`의 `const APPCHECK_SITE_KEY = "";` 에 site key 붙여넣기 (비워두면 비활성)

**② 앱(Android · Play Integrity)** — ⚠️ **native 모듈 필요(추가 확인 후 진행)**
- Expo 앱은 현재 Firebase **JS SDK**를 쓰는데, JS SDK의 App Check(reCAPTCHA)는 웹 전용이라 RN에서 토큰을 못 만듭니다.
- 앱쪽 App Check는 `@react-native-firebase/app-check`(native, config 플러그인 + **dev/preview build 재빌드**) 도입이 필요 → **큰 의존성이라 도입 전 회장 확인**.
- 도입 전까지는 앱이 App Check 토큰을 못 내므로 **enforce를 켜면 앱이 차단**됩니다.

**③ 롤아웃 순서 (앱 차단 없이)**
1. 웹 site key 배선 + 콘솔 App Check를 **monitor 모드**로 시작 (아무것도 차단 안 함, 트래픽만 관찰)
2. 앱쪽 native App Check 도입 후 앱도 토큰 정상 발급 확인
3. 콘솔에서 Firestore를 **enforce**로 전환 → 이제 정품 웹·앱만 접근, REST 남용 차단
> 앱 App Check 없이 당장 웹만 보호하려면 web/app을 **별도 Firebase 프로젝트로 분리**하는 방법도 있으나, "웹·앱 단일 데이터" 원칙과 충돌하므로 비권장.

---

### 자주 묻는 것
- **돈 드나요?** 친목 규모(수십 명)면 무료 한도(하루 읽기 5만/쓰기 2만, 저장 1GB) 안에서 충분합니다.
- **사진은 어디 저장되나요?** 자동으로 작게 줄여(가로 900px) Firestore에 저장됩니다. 별도 Storage·결제 설정이 필요 없어요.
- **설정 안 하면?** 페이지는 정상 작동하지만, 데이터가 각자 브라우저에만 저장됩니다(공유 안 됨).
