# 크루의 문 — 초대 코드 · App Check · 생성 상한

> 크루 격리(`BRIEF.md`)의 **착수 전 선행조건 3건**을 확정한 문서. A안/B안 어느 쪽을 골라도
> 그대로 쓰인다. 2026-08-01 작성.

적대회의가 남긴 지적이 출발점이다:

> **4-4 【R3·중대】 격리의 유일한 문에 자물쇠가 없다.**
> 초대 코드가 6자리 숫자면 경우의 수 10⁶, App Check 꺼짐, 레이트 리밋 0. 코드 하나를 맞히면
> 8개 서브컬렉션에 read·write·**delete**가 전부 열린다.
> — *문이 열려 있는 집에 벽을 두껍게 쌓는 선택이다.*

> **R4 크루 생성에 상한·인증이 없다.** 무제한 생성 + 크루당 자동 5 writes + Spark 2만/일 = $0 DoS.

---

## 1. 초대 코드

### 확정안

| 항목 | 값 | 왜 |
|---|---|---|
| 문자셋 | **Crockford Base32** — `0123456789ABCDEFGHJKMNPQRSTVWXYZ` (I·L·O·U 제외) | 카톡·구두로 불러줄 수 있어야 한다. `0/O`·`1/I/L`을 빼면 받아적기 사고가 사라진다. U는 욕설 조합 방지용으로 Crockford가 원래 뺀 것 |
| 길이 | **8자** | 32⁸ ≈ **1.1조** (40비트). 6자리 숫자(10⁶)의 **100만 배** |
| 표기 | `ABCD-EFGH` (4자씩, 하이픈은 표시용 — 입력 시 제거) | 8자를 한 덩어리로 주면 읽다가 자리를 놓친다 |
| 입력 정규화 | 대문자 변환 + 하이픈·공백 제거 + `I→1`, `L→1`, `O→0` 치환 | 사람이 헷갈려 쓴 것을 받아 주되, **저장은 정규화된 형태 하나만** |
| 생성 | `crypto.getRandomValues` (`expo-crypto`) | `Math.random()`은 예측 가능하다. 초대 코드는 사실상 비밀번호다 |

### 엔트로피만으로는 부족하다 — 열거를 구조로 막는다

40비트는 무차별 대입을 **비싸게** 만들 뿐 불가능하게 하지 않는다. Firestore 규칙엔 레이트
리밋이 없으므로, **열거 자체가 불가능한 모양**으로 데이터를 놓는다.

```
invites/{code}   →  { crewId, createdAt, revoked }
```

```javascript
match /invites/{code} {
  // get = 코드를 이미 아는 사람이 "이 코드가 유효한가"를 묻는 것 → 허용
  allow get: if true;
  // list = "코드 목록을 내놔" → 이게 열리면 8자든 80자든 의미가 없다
  allow list: if false;
  allow create: if request.auth != null && ...;
  allow update: if ... revoked 토글만;
  allow delete: if false;   // 지우지 않고 revoked로 표시(누가 언제 발급했는지 남긴다)
}
```

**`read`를 `get`·`list`로 쪼개는 것이 이 설계의 핵심이다.** `allow read: if true`로 두면
쿼리 한 번에 전체 코드가 쏟아진다 — 지금 8개 컬렉션이 전부 그 상태다.

> ✅ **에뮬레이터로 실증했다**(2026-08-01, `tests/` 하네스). 코드를 아는 단건 `get`은 통과하고,
> 컬렉션 통째 조회도 `where('crewId','==',…)`로 역추적하는 쿼리도 **둘 다 거부**된다.
> 앱 코드를 한 줄도 쓰기 전에 설계를 검증했다 — 하네스를 먼저 깐 이유가 이것이다.
코드를 크루 문서(`crews/{id}.inviteCode`) 안에 넣지 **않는** 이유도 같다. 크루 목록을
읽을 수 있는 순간 코드가 딸려 나온다.

### 코드는 회수할 수 있어야 한다

- 크루장이 [코드 재발급]을 누르면 옛 `invites/{code}`는 `revoked: true`, 새 코드를 만든다.
- 단톡방에 붙인 링크는 **영원히 남는다.** 크루를 나간 사람도 옛 링크를 계속 갖고 있다.
  회수가 없으면 초대 코드는 한 번 유출되면 끝인 영구 열쇠가 된다.
- 참여는 **`members` 문서를 만드는 시점에만** 코드를 본다. 이후 접근은 `members` 소유로 판정 —
  코드가 유출돼도 **이미 들어온 사람**의 자격에는 영향이 없다(반대로, 코드를 폐기해도
  기존 크루원이 쫓겨나지 않는다).

### 링크

`5kilo://join?code=ABCDEFGH` (앱 scheme은 `app.json` 유지 — 바꾸면 새 앱이 된다).
웹 폴백은 `https://modu-marathon.web.app/join?code=…`.
⚠️ **코드가 URL에 실리면 카톡 미리보기·브라우저 히스토리·리퍼러에 남는다.** 친목 크루 수준에서
감수하는 트레이드오프이며, 그래서 회수 경로를 필수로 둔다.

---

## 2. App Check — 유일하게 레이트 리밋 비슷한 것

Firestore 규칙은 "이 사람이 오늘 몇 번 시도했나"를 볼 수 없다. 초대 코드 무차별 대입도,
`$0 DoS`도, 규칙만으로는 못 막는다. **App Check가 그 층이다** — 정품 앱·정상 브라우저에서
온 요청이 아니면 서버가 거절한다(REST 스크립트·에뮬레이터 봇 차단).

### 현재 상태

- 웹(`web/index.html:701`)에 **배선은 돼 있고 키가 비어 있다** (`APPCHECK_SITE_KEY = ""`).
  키가 빈 문자열이면 `initializeAppCheck`를 아예 건너뛰도록 짜여 있어 지금은 꺼진 상태다.
- **앱(Expo)에는 배선이 없다.** Android는 Play Integrity 공급자가 필요하다.

### 켜는 순서 (⚠️ 순서를 지키지 않으면 앱이 통째로 죽는다)

1. Firebase 콘솔 → App Check → 웹앱에 **reCAPTCHA v3** 등록 → 사이트 키를
   `web/index.html`의 `APPCHECK_SITE_KEY`에 넣는다.
2. Android 앱에 **Play Integrity** 등록. ⚠️ Play Integrity는 **플레이스토어를 통해 설치된
   앱에서만** 통과한다 — 지금처럼 로컬 APK를 사이드로드해 테스트하면 전부 거부된다.
   개발 중에는 콘솔에서 **디버그 토큰**을 발급해 등록해야 한다.
3. Firestore에서 **"미적용(unenforced) 모드"로 최소 1주 관찰.** 콘솔에 "확인되지 않은 요청"
   비율이 뜬다. 이 비율이 충분히 떨어지기 전에 강제로 넘기면 **정상 사용자가 앱을 못 쓴다.**
4. 그 다음에 적용(enforce).

> **비공개 테스트(12명×14일)는 3번 관찰 구간과 겹쳐도 된다.** 오히려 실사용 트래픽이 있어야
> 비율이 의미가 있다. 적용은 정식 출시 직전에 넘긴다.

**이건 JJUN님 물리작업이다** — 콘솔 등록·키 발급은 대신 할 수 없다.

---

## 3. 크루 생성 상한 (R4)

### 규칙으로 할 수 있는 것 / 없는 것

**할 수 있는 것**

```javascript
match /crews/{crewId} {
  allow create: if request.auth != null                              // ① 익명이라도 uid는 찍힌다
                && request.resource.data.ownerUid == request.auth.uid // ② 남의 이름으로 못 만든다
                && request.resource.data.name is string
                && request.resource.data.name.size() <= 20
                && get(/databases/$(database)/documents/crewOwners/$(request.auth.uid))
                     .data.count < 3;                                 // ③ uid당 3개
}
match /crewOwners/{uid} {
  allow get: if true;
  allow create: if request.auth.uid == uid && request.resource.data.count == 1;
  allow update: if request.auth.uid == uid
                && request.resource.data.count == resource.data.count + 1
                && request.resource.data.count <= 3;
  allow delete: if false;
}
```

**할 수 없는 것 — 정직하게 적어 둔다**

- `crews` 생성과 `crewOwners` 증가는 **원자적이지 않다.** 규칙은 배치를 한 덩어리로 보지 않고
  write 하나하나를 따로 평가하므로, 카운터를 안 올리고 crews만 반복 생성하는 경합 우회가 가능하다.
- 익명 Auth는 **uid를 무한히 새로 딸 수 있다.** uid당 3개는 "실수·장난"을 막지 악의를 못 막는다.
- **악의를 막는 층은 App Check다.** 이 상한은 그 아래에 까는 보조선이다.
- `get()`은 **규칙 호출 10회 상한**을 먹는다. crews 생성 경로에만 쓰고, 읽기가 잦은 경로엔
  절대 넣지 않는다. (A안이 무너진 이유 중 하나가 `exists()` 10회 상한이었다 — 같은 함정.)

### Spark 한도가 실질 방어선이라는 점

Spark 무료 플랜은 쓰기 2만/일에서 **앱이 멈춘다.** 나쁘게 들리지만, Blaze로 올리는 순간
같은 공격이 "앱 정지"가 아니라 **청구서**로 바뀐다(`BRIEF.md` G2). Blaze 전환은
App Check 적용 이후로 미룬다.

---

## 4. 체크리스트

착수 전:

- [x] `@firebase/rules-unit-testing` 배선 — `tests/` (2026-08-01, 33건 통과)
- [x] 초대 코드 문자셋·길이 확정 — Crockford Base32 8자, `invites/{code}`에 `get`만 허용
- [x] 크루 생성 상한 정책 확정 — uid당 3개 + App Check가 본 방어선
- [x] `events.ts` SEED 제거 (2026-08-01)
- [ ] **App Check 콘솔 등록** — JJUN님 물리작업 (reCAPTCHA v3 + Play Integrity + 디버그 토큰)
- [ ] `run.ts:141~155` 우회 경로 차단 — **컷오버와 같이 한다**(아래)

### `run.ts` 우회 경로를 지금 지우지 않는 이유

이 경로는 실제 기능을 살리고 있다: 워치가 거리를 뒤늦게 정정하거나 걷기→달리기를 고칠 때,
규칙이 `distanceKm`·`durationSec`·`kind` 불변을 강제해 update가 **영구 거부**된다. 그래서
코드가 delete 후 재생성으로 우회한다. 지금 막으면 워치 재동기화가 조용히 실패한다.

위험은 **컷오버 중간 상태에서만** 발생한다 — 루트 delete는 아직 열렸는데 재생성이 이미
막힌 순간, delete만 성공하고 **문서가 순삭된다**(`BRIEF.md` R2). 따라서 컷오버 순서를
**①루트 write·delete를 동시에 막고 → ②앱을 새 경로로 올린다**로 잡고, 이 경로 차단은
그 안에 넣는다. `tests/rules.test.mjs`에 이 우회가 **지금 실재한다**는 테스트가 박혀 있다.
