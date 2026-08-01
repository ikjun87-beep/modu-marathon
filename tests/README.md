# tests — `firestore.rules` 검증 하네스

```bash
cd tests
npm install     # 최초 1회
npm test        # 에뮬레이터를 띄우고 → 33개 테스트 → 반드시 내린다
```

## 왜 만들었나

크루 격리 적대회의(`docs/BRIEF.md` R3)가 **A안/B안 결정보다 선행하는 조건**으로 지목했다:

> "자동 테스트 0개, `@firebase/rules-unit-testing` 미배선. '격리가 됐다'를 기계적으로 증명할
> 방법이 없다. 어느 안이든 **틀렸다는 걸 12명이 먼저 발견하게 된다**."

지금까지 rules 검증은 **전부 손 스모크**였다. 손 스모크는 다음 사람에게 물려줄 수 없고,
"이번에도 확인했다"는 기록만 남지 무엇을 확인했는지는 남지 않는다.

## 이 하네스가 하는 두 가지 일

### ① 회귀 방어 — 여러 세션에 걸쳐 쌓은 방어가 살아 있는지

| 방어 | 언제 만들었나 | 테스트 |
|---|---|---|
| 갤러리 저장형 XSS (`data:image` 게이트) | 2026-07-15 적대검토 | 3건 |
| 러닝 거리·시간·종목 불변 | 2026-07-15 / 07-17 | 5건 |
| 필드 주입 차단 (`diff().hasOnly`) | 2026-07-15 | 4건 |
| 프로필 사진 200KB·이미지 게이트 | 2026-07-31 | 3건 |
| 이메일 하베스팅 차단 (`waitlist`) | P5 자문 게이트 | 2건 |
| 모임 제목·날짜 변조 차단 | 2026-07-18 | 3건 |

### ② 격리 전 기준선 박제 — **실패해야 정상인 테스트들**

이게 이 하네스의 핵심이다. `describe('격리 전 기준선 …')` 블록은 **지금 8개 컬렉션의 read가
전부 열려 있다는 사실 자체**를 테스트로 고정한다.

- 크루 격리를 적용하면 **이 블록이 실패하는 것이 정상**이고, 그 실패 목록이 곧
  "격리가 실제로 닫은 문"의 증거가 된다.
- 적용했는데 **그대로 통과하면 격리가 안 된 것이다.**

같은 방식으로 "지금 뚫려 있다"를 박제한 테스트가 둘 더 있다:

- `run.ts:141~` **delete → 재생성 우회 경로** — `BRIEF.md` R2. 컷오버 중 루트 delete가
  열린 중간 상태에서는 이 경로가 delete만 성공시키고 **문서를 순삭**시킨다.
- `profiles` **동명이인이 남의 사진을 덮어쓰고 지운다** — `BRIEF.md` 4-3. 문서 id가
  uid가 아니라 이름이라서. **id를 uid로 바꾸면 이 테스트가 실패해야 정상.**

## 왜 `app/`이 아니라 별도 패키지인가

`@firebase/rules-unit-testing@5`의 peer dependency가 **firebase ^12**인데, 앱은 **firebase v10**에
묶여 있다(`app/metro.config.js` — v10과 Metro package exports의 dual-package hazard 때문에
`unstable_enablePackageExports = false`. 이걸 건드리면 앱이 시작과 동시에 죽는다).

이 하네스는 앱 코드를 전혀 import 하지 않고 **`firestore.rules` 파일만** 읽어 검증하므로,
버전을 분리해도 잃는 것이 없다. 앱의 firebase를 12로 올릴 때 합치는 것을 검토한다.

## 자바 (걸려 넘어지기 쉬운 지점)

이 PC의 자바가 두 갈래다 — **run.sh가 알아서 고르지만 이유는 알아 둘 것**:

| 용도 | 필요 버전 | 위치 |
|---|---|---|
| 안드로이드 APK/AAB 빌드 (`gradlew`) | **JDK 17** | `~/android-dev/jdk17` |
| Firestore 에뮬레이터 (`firebase-tools`) | **JDK 21+** | `~/android-dev/jre21` |

firebase-tools는 21 미만이면 `no longer supports Java version before 21`로 **거부한다.**
`run.sh`는 21을 **자기 프로세스 안에서만** 앞에 세운다 — 시스템 java나 PATH를 21로 올리면
APK 빌드가 조용히 깨진다.

JDK 21이 없으면(새 PC 등) sudo 없이:

```bash
mkdir -p ~/android-dev/jre21
curl -sSL 'https://api.adoptium.net/v3/binary/latest/21/ga/linux/x64/jre/hotspot/normal/eclipse' \
  | tar -xz -C ~/android-dev/jre21 --strip-components=1
```

## 테스트를 추가할 때

- `env.clearFirestore()`를 **각 `it` 앞에서** 부른다. 안 부르면 앞 테스트가 남긴 문서 때문에
  create가 update로 평가돼 엉뚱한 규칙을 타고, 통과/실패가 실행 순서에 의존하게 된다.
- 이미 있는 문서를 전제로 하는 update·read 테스트는 `seed()`로 심는다
  (`withSecurityRulesDisabled` — 규칙을 우회해 준비물만 넣는다).
- `assertFails`는 **거부됐다**만 확인한다. 어떤 이유로 거부됐는지는 확인하지 않으므로,
  규칙을 통째로 `if false`로 바꿔도 전부 통과한다. **거부 테스트를 넣을 때는 반대편(정상 경로가
  통과한다)도 같이 넣을 것** — 이 파일이 각 컬렉션마다 "통과" 케이스를 함께 두는 이유다.
