/**
 * firestore.rules 검증 하네스 — 2026-08-01 신설
 *
 * 왜 만들었나 (docs/BRIEF.md R3):
 *   크루 격리 적대회의가 "**검증 수단 0**. '격리가 됐다'를 기계적으로 증명할 방법이 없다.
 *   어느 안이든 틀렸다는 걸 12명이 먼저 발견하게 된다"를 A/B안 결정보다 **선행 조건**으로 지목했다.
 *
 * 이 파일이 하는 두 가지 일:
 *   ① **회귀 방어** — 여러 세션에 걸쳐 쌓은 rules 방어(저장형 XSS 게이트·거리/시간/종목 불변·
 *      필드 주입 차단·이메일 하베스팅 차단)가 살아 있는지 기계로 확인한다. 지금까지는 전부
 *      손으로 스모크했고, 손 스모크는 다음 사람이 물려받지 못한다.
 *   ② **격리 전 기준선 박제** — 지금 8개 컬렉션의 read가 전부 열려 있다는 사실 자체를 테스트로
 *      고정한다. 크루 격리를 적용하면 `describe('격리 전 기준선')` 블록이 **실패하는 것이 정상**이고,
 *      그 실패 목록이 곧 "격리가 실제로 닫은 문"의 증거가 된다. 통과하면 격리가 안 된 것이다.
 *
 * 실행: cd tests && npm test   (에뮬레이터를 띄우고 이 파일을 돌린다 — run.sh 참조)
 */
import { readFileSync } from "node:fs";
import { after, before, describe, it } from "node:test";
import {
  assertFails,
  assertSucceeds,
  initializeTestEnvironment,
} from "@firebase/rules-unit-testing";
import { doc, getDoc, setDoc, deleteDoc, updateDoc } from "firebase/firestore";

const PORT = Number(process.env.FIRESTORE_EMULATOR_PORT ?? 8085);

/** 유효한 1×1 투명 PNG data URI — gallery·profiles의 `matches('data:image/.*')` 게이트 통과용. */
const PNG =
  "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAAC0lEQVR42mNkYAAAAAYAAjCB0C8AAAAASUVORK5CYII=";

let env;

/** 규칙을 우회해 문서를 심는다 — "이미 있는 문서"를 전제로 하는 update·read 테스트의 준비물. */
async function seed(path, data) {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), path), data);
  });
}

/** 규칙이 적용되는 일반 클라이언트(우리 앱·웹과 같은 조건 = 미인증). */
function db() {
  return env.unauthenticatedContext().firestore();
}

before(async () => {
  env = await initializeTestEnvironment({
    projectId: "modu-marathon-rules-test",
    firestore: {
      rules: readFileSync(new URL("../firestore.rules", import.meta.url), "utf8"),
      host: "127.0.0.1",
      port: PORT,
    },
  });
});

after(async () => {
  await env?.cleanup();
});

// ─────────────────────────────────────────────────────────────────────────────
// ① 격리 전 기준선 — **이 블록은 크루 격리가 적용되면 실패해야 정상이다.**
// ─────────────────────────────────────────────────────────────────────────────
describe("격리 전 기준선 (크루 격리 적용 시 이 블록은 실패해야 정상)", () => {
  const OPEN_READ = ["guestbook", "gallery", "attendance", "claps", "profiles", "runs", "comments", "events"];

  for (const col of OPEN_READ) {
    it(`${col} — 아무나 남의 문서를 읽는다`, async () => {
      await env.clearFirestore();
      await seed(`${col}/x`, { name: "홍길동" });
      await assertSucceeds(getDoc(doc(db(), `${col}/x`)));
    });
  }

  it("profiles — 얼굴 사진이 인증 없이 통째로 받아진다 (L3 결정으로 감수한 상태)", async () => {
    await env.clearFirestore();
    await seed("profiles/홍길동", { name: "홍길동", photo: PNG });
    const snap = await assertSucceeds(getDoc(doc(db(), "profiles/홍길동")));
    if (!String(snap.data().photo).startsWith("data:image/")) {
      throw new Error("사진 본문이 안 왔다 — 테스트 전제가 깨졌다");
    }
  });

  it("runs — 민감정보인 평균 심박(avgHr)이 인증 없이 읽힌다 (처리방침에 고지함)", async () => {
    await env.clearFirestore();
    await seed("runs/r1", { name: "홍길동", distanceKm: 5, durationSec: 1800, avgHr: 143 });
    const snap = await assertSucceeds(getDoc(doc(db(), "runs/r1")));
    if (snap.data().avgHr !== 143) throw new Error("avgHr가 안 왔다 — 테스트 전제가 깨졌다");
  });

  it("waitlist — 유일하게 닫혀 있는 컬렉션 (이메일 하베스팅 차단)", async () => {
    await env.clearFirestore();
    await seed("waitlist/w1", { email: "a@b.com" });
    await assertFails(getDoc(doc(db(), "waitlist/w1")));
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ② 쓰기 방어 회귀 — 지금까지 손으로만 스모크하던 것들
// ─────────────────────────────────────────────────────────────────────────────
describe("저장형 XSS 게이트 (2026-07-15 · gallery.image)", () => {
  it("data:image 가 아닌 문자열은 거부", async () => {
    await env.clearFirestore();
    await assertFails(
      setDoc(doc(db(), "gallery/evil"), { name: "공격자", image: "javascript:alert(1)" })
    );
  });

  it("data:text/html 도 거부", async () => {
    await env.clearFirestore();
    await assertFails(
      setDoc(doc(db(), "gallery/evil2"), { name: "공격자", image: "data:text/html,<script>x</script>" })
    );
  });

  it("정상 이미지는 통과", async () => {
    await env.clearFirestore();
    await assertSucceeds(setDoc(doc(db(), "gallery/ok"), { name: "홍길동", image: PNG }));
  });
});

describe("러닝 기록 조작 차단 (runs.update — 리더보드·통계 오염)", () => {
  const BASE = { name: "홍길동", distanceKm: 10, durationSec: 3600, kind: "run" };

  it("남의 거리를 0으로 지우기 — 거부", async () => {
    await env.clearFirestore();
    await seed("runs/r1", BASE);
    await assertFails(updateDoc(doc(db(), "runs/r1"), { ...BASE, distanceKm: 0 }));
  });

  it("남의 durationSec을 1로 바꿔 평균 페이스 파괴 — 거부", async () => {
    await env.clearFirestore();
    await seed("runs/r1", BASE);
    await assertFails(updateDoc(doc(db(), "runs/r1"), { ...BASE, durationSec: 1 }));
  });

  it("남의 러닝에 kind:'walk'를 심어 랭킹에서 지우기 — 거부", async () => {
    await env.clearFirestore();
    await seed("runs/r1", BASE);
    await assertFails(updateDoc(doc(db(), "runs/r1"), { ...BASE, kind: "walk" }));
  });

  it("거리 500km 초과 생성 — 거부 (합산·리더보드 오염)", async () => {
    await env.clearFirestore();
    await assertFails(setDoc(doc(db(), "runs/huge"), { name: "홍길동", distanceKm: 501 }));
  });

  it("러너 네임 전파(name만 변경)는 통과 — 정상 경로", async () => {
    await env.clearFirestore();
    await seed("runs/r1", BASE);
    await assertSucceeds(updateDoc(doc(db(), "runs/r1"), { name: "홍길동2" }));
  });
});

describe("⚠️ run.ts:141~ 우회 경로가 실재한다 (BRIEF R2)", () => {
  // 이 테스트는 "막혔다"가 아니라 "**지금 열려 있다**"를 박제한다.
  // 크루 격리 컷오버 중 루트 delete가 아직 열린 중간 상태에서는, 이 경로가
  // delete만 성공하고 재생성이 거부되어 **문서를 순삭**시킨다. 컷오버 순서를 설계할 때의 근거.
  it("delete → 재생성으로 거리·시간·종목을 실제로 바꿀 수 있다", async () => {
    await env.clearFirestore();
    await seed("runs/healthconnect_abc", { name: "홍길동", distanceKm: 5, durationSec: 1800 });
    // update로는 막힌다
    await assertFails(
      updateDoc(doc(db(), "runs/healthconnect_abc"), { name: "홍길동", distanceKm: 7, durationSec: 2400 })
    );
    // 그런데 delete는 열려 있고
    await assertSucceeds(deleteDoc(doc(db(), "runs/healthconnect_abc")));
    // 재생성이 통과한다 = 불변 강제가 사실상 우회된다
    await assertSucceeds(
      setDoc(doc(db(), "runs/healthconnect_abc"), { name: "홍길동", distanceKm: 7, durationSec: 2400 })
    );
  });
});

describe("필드 주입 차단 (isRenameOnly / hasOnly)", () => {
  it("방명록 수정에 임의 필드를 끼워 넣기 — 거부", async () => {
    await env.clearFirestore();
    await seed("guestbook/g1", { name: "홍길동", msg: "안녕" });
    await assertFails(updateDoc(doc(db(), "guestbook/g1"), { msg: "안녕", payload: "x".repeat(500) }));
  });

  it("개명 전파에 본문을 같이 바꾸기 — 거부", async () => {
    await env.clearFirestore();
    await seed("guestbook/g1", { name: "홍길동", msg: "안녕" });
    await assertFails(updateDoc(doc(db(), "guestbook/g1"), { name: "홍길동2", msg: "변조" }));
  });

  it("본문만 수정(msg) — 통과", async () => {
    await env.clearFirestore();
    await seed("guestbook/g1", { name: "홍길동", msg: "안녕" });
    await assertSucceeds(updateDoc(doc(db(), "guestbook/g1"), { msg: "고쳤어요" }));
  });

  it("40자 초과 러너 네임 — 거부", async () => {
    await env.clearFirestore();
    await seed("attendance/a1", { eventId: "ev-1", name: "홍길동" });
    await assertFails(updateDoc(doc(db(), "attendance/a1"), { name: "가".repeat(41) }));
  });
});

describe("프로필 사진 (profiles — 2026-07-31 L3)", () => {
  it("200KB 초과 — 거부 (컬렉션을 저장소로 쓰는 것 차단)", async () => {
    await env.clearFirestore();
    const big = "data:image/png;base64," + "A".repeat(200001);
    await assertFails(setDoc(doc(db(), "profiles/홍길동"), { name: "홍길동", photo: big }));
  });

  it("이미지가 아닌 data URI — 거부", async () => {
    await env.clearFirestore();
    await assertFails(
      setDoc(doc(db(), "profiles/홍길동"), { name: "홍길동", photo: "data:text/html,<script>x</script>" })
    );
  });

  it("정상 등록 — 통과", async () => {
    await env.clearFirestore();
    await assertSucceeds(setDoc(doc(db(), "profiles/홍길동"), { name: "홍길동", photo: PNG }));
  });

  it("⚠️ 동명이인이 남의 사진을 덮어쓴다 (BRIEF 4-3 · 문서 id가 uid가 아니라 이름)", async () => {
    // "막혔다"가 아니라 "**지금 뚫려 있다**"를 박제한다. id를 uid로 바꾸면 이 테스트가 실패해야 정상.
    await env.clearFirestore();
    await seed("profiles/민수", { name: "민수", photo: PNG });
    await assertSucceeds(setDoc(doc(db(), "profiles/민수"), { name: "민수", photo: PNG }));
    await assertSucceeds(deleteDoc(doc(db(), "profiles/민수"))); // 남의 사진을 지울 수도 있다
  });
});

describe("모임 일정 (events)", () => {
  it("startAt 없는 모임 — 거부", async () => {
    await env.clearFirestore();
    await assertFails(setDoc(doc(db(), "events/e1"), { title: "모임", desc: "설명" }));
  });

  it("제목·날짜 변조 — 거부 (update는 개명 전파만)", async () => {
    await env.clearFirestore();
    await seed("events/e1", { title: "모임", desc: "설명", startAt: 1_700_000_000_000 });
    await assertFails(updateDoc(doc(db(), "events/e1"), { title: "변조된 모임" }));
  });

  it("정상 생성 — 통과", async () => {
    await env.clearFirestore();
    await assertSucceeds(
      setDoc(doc(db(), "events/e1"), { title: "한강 이지런", desc: "5km", startAt: 1_800_000_000_000 })
    );
  });
});

describe("출시 알림 대기자 (waitlist — 이메일 하베스팅 차단)", () => {
  it("생성은 되고 읽기는 안 된다", async () => {
    await env.clearFirestore();
    await assertSucceeds(setDoc(doc(db(), "waitlist/w1"), { email: "a@b.com" }));
    await assertFails(getDoc(doc(db(), "waitlist/w1")));
  });

  it("수정·삭제 모두 거부", async () => {
    await env.clearFirestore();
    await seed("waitlist/w1", { email: "a@b.com" });
    await assertFails(updateDoc(doc(db(), "waitlist/w1"), { email: "c@d.com" }));
    await assertFails(deleteDoc(doc(db(), "waitlist/w1")));
  });
});
