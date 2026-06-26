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

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // 친목용: 누구나 읽고/쓰기 가능. 단, 글자수·이미지 크기 제한으로 도배 방지
    match /guestbook/{id} {
      allow read: if true;
      allow create: if request.resource.data.name.size() <= 20
                    && request.resource.data.msg.size() <= 200;
      allow delete: if true;
    }
    match /gallery/{id} {
      allow read: if true;
      allow create: if request.resource.data.image.size() < 1000000; // 1MB 미만
      allow delete: if true;
    }
    match /attendance/{id} {
      allow read, create, delete: if true;
    }
  }
}
```

> ⚠️ 이 규칙은 "아는 사람들끼리 카톡으로 링크 공유"하는 친목용입니다.
> 누구나 쓸 수 있으니, 외부에 널리 퍼뜨릴 거면 나중에 로그인(Auth)을 붙이는 걸 권합니다.

## 5. 끝! 배포

`index.html`을 커밋·푸시하고 GitHub Pages로 열면, 폰·카톡·다른 컴퓨터 어디서든
**같은 방명록·사진·참석 현황**이 보입니다. 🎉

---

### 자주 묻는 것
- **돈 드나요?** 친목 규모(수십 명)면 무료 한도(하루 읽기 5만/쓰기 2만, 저장 1GB) 안에서 충분합니다.
- **사진은 어디 저장되나요?** 자동으로 작게 줄여(가로 900px) Firestore에 저장됩니다. 별도 Storage·결제 설정이 필요 없어요.
- **설정 안 하면?** 페이지는 정상 작동하지만, 데이터가 각자 브라우저에만 저장됩니다(공유 안 됨).
