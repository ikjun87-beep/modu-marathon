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
import { collection, doc, getDoc, getDocs, setDoc, deleteDoc, updateDoc } from "firebase/firestore";

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

/** 인증된 클라이언트(S1의 익명 로그인과 같은 조건 — uid만 있고 그 외 특권 없음). */
function authDb(uid) {
  return env.authenticatedContext(uid).firestore();
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

// ─────────────────────────────────────────────────────────────────────────────
// ③ 소유권 delete (S4 2026-08-14 · runs/guestbook/gallery + 세션16 2026-08-15 확장 ·
//    attendance/claps/comments/profiles/events) — "격리보다 소유가 먼저다"의 delete 축.
//    8개 컬렉션 전부 uid 있으면 소유자만, 없으면(레거시) 유예. comments·events는 앱에
//    삭제 UI 자체가 없어 이 rules 변경의 UI 회귀 위험이 0이다(세션16 조사로 확인).
// ─────────────────────────────────────────────────────────────────────────────
describe("소유권 delete (uid 있으면 소유자만, 없으면 유예)", () => {
  const OWNED = ["runs", "guestbook", "gallery", "attendance", "claps", "comments", "events", "profiles"];

  for (const col of OWNED) {
    it(`${col} — uid 있는 남의 문서는 delete 거부`, async () => {
      await env.clearFirestore();
      await seed(`${col}/x`, { name: "홍길동", msg: "안녕", distanceKm: 5, uid: "owner-uid" });
      await assertFails(deleteDoc(doc(authDb("stranger-uid"), `${col}/x`)));
    });

    it(`${col} — uid 있는 내 문서는 delete 허용`, async () => {
      await env.clearFirestore();
      await seed(`${col}/x`, { name: "홍길동", msg: "안녕", distanceKm: 5, uid: "owner-uid" });
      await assertSucceeds(deleteDoc(doc(authDb("owner-uid"), `${col}/x`)));
    });

    it(`${col} — 미인증 사용자는 uid 있는 문서를 delete 못한다`, async () => {
      await env.clearFirestore();
      await seed(`${col}/x`, { name: "홍길동", msg: "안녕", distanceKm: 5, uid: "owner-uid" });
      await assertFails(deleteDoc(doc(db(), `${col}/x`)));
    });

    it(`${col} — uid 없는 레거시 문서는 유예로 계속 삭제된다`, async () => {
      await env.clearFirestore();
      await seed(`${col}/legacy`, { name: "홍길동", msg: "안녕", distanceKm: 5 }); // uid 필드 자체가 없음
      await assertSucceeds(deleteDoc(doc(authDb("anyone-uid"), `${col}/legacy`)));
    });
  }
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

// ─────────────────────────────────────────────────────────────────────────────
// ④ PHASE 2 — 크루 서브컬렉션 격리 (docs/TIERS.md B안). 세션19 조사로 A안 대신 확정.
//    crews/{crewId}, crews/{crewId}/members/{uid}, crews/{crewId}/{col}/{id}, invites/{code}.
//    아직 firestore.rules에 이 구조가 없다 — 이 블록은 RED로 시작해야 정상이다.
// ─────────────────────────────────────────────────────────────────────────────
describe("크루 생성 (crews/{crewId} — PHASE 2 · CREW-GATE §3)", () => {
  it("미인증 사용자는 크루를 못 만든다", async () => {
    await env.clearFirestore();
    await assertFails(setDoc(doc(db(), "crews/newcrew"), { ownerUid: "x", name: "새크루" }));
  });

  it("남의 uid를 ownerUid로 사칭 — 거부", async () => {
    await env.clearFirestore();
    await assertFails(
      setDoc(doc(authDb("owner-uid"), "crews/newcrew"), { ownerUid: "other-uid", name: "새크루" })
    );
  });

  it("crewOwners.count가 3 이상이면 생성 거부 (상한)", async () => {
    await env.clearFirestore();
    await seed("crewOwners/owner-uid", { count: 3 });
    await assertFails(
      setDoc(doc(authDb("owner-uid"), "crews/fourthcrew"), { ownerUid: "owner-uid", name: "네번째" })
    );
  });

  it("정상 생성 — 통과 (crewOwners count 1)", async () => {
    await env.clearFirestore();
    await seed("crewOwners/owner-uid", { count: 1 });
    await assertSucceeds(
      setDoc(doc(authDb("owner-uid"), "crews/newcrew"), { ownerUid: "owner-uid", name: "새크루" })
    );
  });

  it("20자 초과 크루 이름 — 거부", async () => {
    await env.clearFirestore();
    await seed("crewOwners/owner-uid", { count: 1 });
    await assertFails(
      setDoc(doc(authDb("owner-uid"), "crews/newcrew"), { ownerUid: "owner-uid", name: "가".repeat(21) })
    );
  });

  it("비회원은 크루 문서를 get 못한다", async () => {
    await env.clearFirestore();
    await seed("crews/modu", { ownerUid: "owner-uid", name: "모두" });
    await assertFails(getDoc(doc(authDb("stranger-uid"), "crews/modu")));
  });

  it("크루 목록 list는 항상 거부 (열거 금지)", async () => {
    await env.clearFirestore();
    await seed("crews/modu", { ownerUid: "owner-uid", name: "모두" });
    await assertFails(getDocs(collection(authDb("owner-uid"), "crews")));
  });
});

describe("크루 공지 수정 (crews/{crewId}.notice — PHASE 2-C 세션23)", () => {
  it("크루장의 공지 수정 — 통과", async () => {
    await env.clearFirestore();
    await seed("crews/modu", { ownerUid: "owner-uid", name: "모두" });
    await seed("crews/modu/members/owner-uid", { role: "member" });
    await assertSucceeds(
      updateDoc(doc(authDb("owner-uid"), "crews/modu"), { notice: "이번 주 토요일 8시 한강" })
    );
  });

  it("관리자(admin)의 공지 수정 — 통과", async () => {
    await env.clearFirestore();
    await seed("crews/modu", { ownerUid: "owner-uid", name: "모두" });
    await seed("crews/modu/members/admin-uid", { role: "admin" });
    await assertSucceeds(
      updateDoc(doc(authDb("admin-uid"), "crews/modu"), { notice: "공지" })
    );
  });

  it("일반 크루원의 공지 수정 — 거부", async () => {
    await env.clearFirestore();
    await seed("crews/modu", { ownerUid: "owner-uid", name: "모두" });
    await seed("crews/modu/members/member-uid", { role: "member" });
    await assertFails(
      updateDoc(doc(authDb("member-uid"), "crews/modu"), { notice: "제가 마음대로" })
    );
  });

  it("비회원의 공지 수정 — 거부", async () => {
    await env.clearFirestore();
    await seed("crews/modu", { ownerUid: "owner-uid", name: "모두" });
    await assertFails(
      updateDoc(doc(authDb("stranger-uid"), "crews/modu"), { notice: "침입" })
    );
  });

  it("공지 수정을 빙자한 ownerUid 재기입 — 거부 (소유권 이전은 이 경로로 불가)", async () => {
    await env.clearFirestore();
    await seed("crews/modu", { ownerUid: "owner-uid", name: "모두" });
    await seed("crews/modu/members/owner-uid", { role: "member" });
    await assertFails(
      updateDoc(doc(authDb("owner-uid"), "crews/modu"), { notice: "합법적", ownerUid: "someone-else" })
    );
  });
});

describe("크루 멤버십 (crews/{crewId}/members — PHASE 2)", () => {
  it("본인 uid로 멤버 문서 생성 — 통과", async () => {
    await env.clearFirestore();
    await assertSucceeds(
      setDoc(doc(authDb("my-uid"), "crews/modu/members/my-uid"), { role: "member" })
    );
  });

  it("본인 uid로 이름 포함 생성 — 통과 (PHASE 2-C: 역할 화면 표시용)", async () => {
    await env.clearFirestore();
    await assertSucceeds(
      setDoc(doc(authDb("my-uid"), "crews/modu/members/my-uid"), { role: "member", name: "쫀쫀샷" })
    );
  });

  it("자기 자신을 owner로 선언 — 거부 (PHASE 2-C: 진짜 크루장은 crews.ownerUid로만 판정)", async () => {
    await env.clearFirestore();
    await assertFails(
      setDoc(doc(authDb("my-uid"), "crews/modu/members/my-uid"), { role: "owner" })
    );
  });

  it("남의 uid로 멤버 문서 생성 — 거부 (초대코드 검증은 앱이 선행, rules는 uid 일치만 봄)", async () => {
    await env.clearFirestore();
    await assertFails(
      setDoc(doc(authDb("my-uid"), "crews/modu/members/other-uid"), { role: "member" })
    );
  });

  it("비회원은 멤버 목록을 read 못한다", async () => {
    await env.clearFirestore();
    await seed("crews/modu/members/owner-uid", { role: "owner" });
    await assertFails(getDoc(doc(authDb("stranger-uid"), "crews/modu/members/owner-uid")));
  });

  it("회원은 멤버 문서를 read할 수 있다", async () => {
    await env.clearFirestore();
    await seed("crews/modu/members/owner-uid", { role: "owner" });
    await seed("crews/modu/members/my-uid", { role: "member" });
    await assertSucceeds(getDoc(doc(authDb("my-uid"), "crews/modu/members/owner-uid")));
  });

  it("아직 멤버가 아니어도 자기 자신의 멤버십 문서는 get할 수 있다 (세션22 부트스트랩 버그 수정)", async () => {
    await env.clearFirestore();
    // 문서가 아직 없는 상태 — ensureCrewMembership()이 "내가 멤버인지" 확인하는 바로 그 시나리오.
    await assertSucceeds(getDoc(doc(authDb("new-uid"), "crews/modu/members/new-uid")));
  });

  it("남의(존재하지 않는) 멤버십 문서는 여전히 못 읽는다", async () => {
    await env.clearFirestore();
    await assertFails(getDoc(doc(authDb("stranger-uid"), "crews/modu/members/someone-else-uid")));
  });

  it("본인 탈퇴(delete) — 통과", async () => {
    await env.clearFirestore();
    await seed("crews/modu/members/my-uid", { role: "member" });
    await assertSucceeds(deleteDoc(doc(authDb("my-uid"), "crews/modu/members/my-uid")));
  });

  it("남의 멤버십 삭제(강퇴 흉내) — 거부", async () => {
    await env.clearFirestore();
    await seed("crews/modu/members/victim-uid", { role: "member" });
    await assertFails(deleteDoc(doc(authDb("attacker-uid"), "crews/modu/members/victim-uid")));
  });

  it("본인 이름만 바꾸는 수정 — 통과 (러너 네임 변경 전파, PHASE 2-C)", async () => {
    await env.clearFirestore();
    await seed("crews/modu/members/my-uid", { role: "member", name: "옛이름" });
    await assertSucceeds(
      updateDoc(doc(authDb("my-uid"), "crews/modu/members/my-uid"), { name: "새이름" })
    );
  });

  it("본인이 스스로 role을 바꾸려는 수정 — 거부", async () => {
    await env.clearFirestore();
    await seed("crews/modu/members/my-uid", { role: "member" });
    await assertFails(
      updateDoc(doc(authDb("my-uid"), "crews/modu/members/my-uid"), { role: "admin" })
    );
  });

  it("크루장이 다른 멤버를 관리자로 승격 — 통과", async () => {
    await env.clearFirestore();
    await seed("crews/modu", { ownerUid: "owner-uid", name: "모두" });
    await seed("crews/modu/members/owner-uid", { role: "member" });
    await seed("crews/modu/members/member-uid", { role: "member" });
    await assertSucceeds(
      updateDoc(doc(authDb("owner-uid"), "crews/modu/members/member-uid"), { role: "admin" })
    );
  });

  it("크루장이 관리자를 다시 일반 멤버로 강등 — 통과", async () => {
    await env.clearFirestore();
    await seed("crews/modu", { ownerUid: "owner-uid", name: "모두" });
    await seed("crews/modu/members/owner-uid", { role: "member" });
    await seed("crews/modu/members/admin-uid", { role: "admin" });
    await assertSucceeds(
      updateDoc(doc(authDb("owner-uid"), "crews/modu/members/admin-uid"), { role: "member" })
    );
  });

  it("크루장이 아닌 사람의 역할 승격 시도 — 거부", async () => {
    await env.clearFirestore();
    await seed("crews/modu", { ownerUid: "owner-uid", name: "모두" });
    await seed("crews/modu/members/attacker-uid", { role: "member" });
    await seed("crews/modu/members/member-uid", { role: "member" });
    await assertFails(
      updateDoc(doc(authDb("attacker-uid"), "crews/modu/members/member-uid"), { role: "admin" })
    );
  });

  it("크루장 자신의 role은 이 경로로 못 바꾼다 — 거부", async () => {
    await env.clearFirestore();
    await seed("crews/modu", { ownerUid: "owner-uid", name: "모두" });
    await seed("crews/modu/members/owner-uid", { role: "member" });
    await assertFails(
      updateDoc(doc(authDb("owner-uid"), "crews/modu/members/owner-uid"), { role: "admin" })
    );
  });

  it("role:owner인 레거시 문서는 크루장도 못 건드린다 — 거부 (마이그레이션 유령 문서 보호)", async () => {
    await env.clearFirestore();
    await seed("crews/modu", { ownerUid: "owner-uid", name: "모두" });
    await seed("crews/modu/members/owner-uid", { role: "member" });
    await seed("crews/modu/members/ghost-uid", { role: "owner" });
    await assertFails(
      updateDoc(doc(authDb("owner-uid"), "crews/modu/members/ghost-uid"), { role: "member" })
    );
  });
});

// 세션21 — 격리 대상은 앱 전용 4개(runs·comments·claps·profiles)뿐이다. guestbook·gallery·
// attendance·events는 웹이 직접 구독·작성해서(grep 전수 확인) root에 남겨뒀고, crews/{crewId}
// 아래엔 이 4개의 서브컬렉션 자체가 없다 — 그래서 이 describe는 runs·comments·claps·profiles로
// 대표 검증한다.
describe("크루 서브컬렉션 격리 (crews/{crewId}/{runs,comments,claps,profiles} — PHASE 2)", () => {
  it("비회원은 크루의 runs를 read 못한다", async () => {
    await env.clearFirestore();
    await seed("crews/modu/runs/r1", { name: "홍길동", distanceKm: 5, uid: "member-uid" });
    await assertFails(getDoc(doc(authDb("stranger-uid"), "crews/modu/runs/r1")));
  });

  it("크루 회원은 크루의 runs를 read할 수 있다", async () => {
    await env.clearFirestore();
    await seed("crews/modu/members/member-uid", { role: "member" });
    await seed("crews/modu/runs/r1", { name: "홍길동", distanceKm: 5, uid: "member-uid" });
    await assertSucceeds(getDoc(doc(authDb("member-uid"), "crews/modu/runs/r1")));
  });

  it("다른 크루 회원은 이 크루의 runs를 못 읽는다 (크루 간 격리)", async () => {
    await env.clearFirestore();
    await seed("crews/other/members/other-member-uid", { role: "member" });
    await seed("crews/modu/runs/r1", { name: "홍길동", distanceKm: 5, uid: "member-uid" });
    await assertFails(getDoc(doc(authDb("other-member-uid"), "crews/modu/runs/r1")));
  });

  it("비회원은 크루 runs에 쓰기 못한다", async () => {
    await env.clearFirestore();
    await assertFails(
      setDoc(doc(authDb("stranger-uid"), "crews/modu/runs/r2"), { name: "낯선이", distanceKm: 3 })
    );
  });

  it("회원 create — 기존 runs 검증 규칙(거리 범위)이 그대로 재사용된다", async () => {
    await env.clearFirestore();
    await seed("crews/modu/members/member-uid", { role: "member" });
    await assertFails(
      setDoc(doc(authDb("member-uid"), "crews/modu/runs/huge"), { name: "홍길동", distanceKm: 501 })
    );
    await assertSucceeds(
      setDoc(doc(authDb("member-uid"), "crews/modu/runs/ok"), { name: "홍길동", distanceKm: 5 })
    );
  });

  it("crews 서브컬렉션에서도 소유권 delete(isOwnerOrLegacy)가 유지된다 (profiles)", async () => {
    await env.clearFirestore();
    await seed("crews/modu/members/member-uid", { role: "member" });
    await seed("crews/modu/members/owner-of-doc", { role: "member" });
    await seed("crews/modu/profiles/홍길동", { name: "홍길동", photo: PNG, uid: "owner-of-doc" });
    await assertFails(deleteDoc(doc(authDb("member-uid"), "crews/modu/profiles/홍길동")));
    await assertSucceeds(deleteDoc(doc(authDb("owner-of-doc"), "crews/modu/profiles/홍길동")));
  });

  it("profiles 저장형 XSS 게이트도 크루 서브컬렉션에서 그대로 적용된다", async () => {
    await env.clearFirestore();
    await seed("crews/modu/members/member-uid", { role: "member" });
    await assertFails(
      setDoc(doc(authDb("member-uid"), "crews/modu/profiles/공격자"), {
        name: "공격자",
        photo: "data:text/html,<script>x</script>",
      })
    );
  });

  it("claps — 회원 create 통과, 비회원 거부", async () => {
    await env.clearFirestore();
    await seed("crews/modu/members/member-uid", { role: "member" });
    await assertSucceeds(
      setDoc(doc(authDb("member-uid"), "crews/modu/claps/c1"), { name: "홍길동", targetId: "r1" })
    );
    await assertFails(
      setDoc(doc(authDb("stranger-uid"), "crews/modu/claps/c2"), { name: "낯선이", targetId: "r1" })
    );
  });

  it("comments — parentId 없는 생성은 크루 서브컬렉션에서도 거부", async () => {
    await env.clearFirestore();
    await seed("crews/modu/members/member-uid", { role: "member" });
    await assertFails(
      setDoc(doc(authDb("member-uid"), "crews/modu/comments/cm1"), { name: "홍길동", msg: "축하해요" })
    );
    await assertSucceeds(
      setDoc(doc(authDb("member-uid"), "crews/modu/comments/cm2"), {
        parentId: "r1",
        name: "홍길동",
        msg: "축하해요",
      })
    );
  });

  it("guestbook·gallery·attendance·events는 crews/{crewId} 아래에 서브컬렉션이 없다 (root 전용 유지)", async () => {
    await env.clearFirestore();
    await seed("crews/modu/members/member-uid", { role: "member" });
    await assertFails(
      setDoc(doc(authDb("member-uid"), "crews/modu/guestbook/g1"), { name: "홍길동", msg: "안녕" })
    );
    await assertFails(
      setDoc(doc(authDb("member-uid"), "crews/modu/events/e1"), {
        title: "모임",
        desc: "설명",
        startAt: 1_800_000_000_000,
      })
    );
  });
});

describe("초대 코드 (invites/{code} — PHASE 2 · CREW-GATE.md §1)", () => {
  it("코드를 아는 사람의 get — 통과", async () => {
    await env.clearFirestore();
    await seed("invites/ABCD1234", { crewId: "modu", revoked: false });
    await assertSucceeds(getDoc(doc(db(), "invites/ABCD1234")));
  });

  it("코드 목록 list — 항상 거부 (열거 자체 차단)", async () => {
    await env.clearFirestore();
    await seed("invites/ABCD1234", { crewId: "modu", revoked: false });
    await assertFails(getDocs(collection(db(), "invites")));
  });

  it("미인증 사용자는 초대 코드를 못 만든다", async () => {
    await env.clearFirestore();
    await assertFails(setDoc(doc(db(), "invites/NEWCODE1"), { crewId: "modu", revoked: false }));
  });

  it("크루 멤버의 정상 생성 — 통과 (PHASE 2-C: 발급은 크루원 누구나)", async () => {
    await env.clearFirestore();
    await seed("crews/modu/members/owner-uid", { role: "member" });
    await assertSucceeds(
      setDoc(doc(authDb("owner-uid"), "invites/NEWCODE1"), { crewId: "modu", revoked: false })
    );
  });

  it("크루 멤버가 아니면 초대 코드 생성 거부 (PHASE 2-C: 남의 크루 코드를 못 판다)", async () => {
    await env.clearFirestore();
    await assertFails(
      setDoc(doc(authDb("outsider-uid"), "invites/NEWCODE1"), { crewId: "modu", revoked: false })
    );
  });

  it("revoked만 바꾸는 회수 — 통과", async () => {
    await env.clearFirestore();
    await seed("invites/ABCD1234", { crewId: "modu", revoked: false });
    await assertSucceeds(
      updateDoc(doc(authDb("owner-uid"), "invites/ABCD1234"), { revoked: true })
    );
  });

  it("crewId를 바꿔치기하는 수정 — 거부 (코드 탈취 방지)", async () => {
    await env.clearFirestore();
    await seed("invites/ABCD1234", { crewId: "modu", revoked: false });
    await assertFails(
      updateDoc(doc(authDb("attacker-uid"), "invites/ABCD1234"), { crewId: "other-crew" })
    );
  });

  it("삭제는 항상 거부 (회수는 revoked 플래그로만)", async () => {
    await env.clearFirestore();
    await seed("invites/ABCD1234", { crewId: "modu", revoked: false });
    await assertFails(deleteDoc(doc(authDb("owner-uid"), "invites/ABCD1234")));
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
