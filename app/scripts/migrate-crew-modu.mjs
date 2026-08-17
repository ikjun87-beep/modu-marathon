#!/usr/bin/env node
/**
 * PHASE 2 크루 서브컬렉션 사본 마이그레이션 — 세션20~21.
 *
 * root 8개 컬렉션 중 **앱 전용 4개**(claps·profiles·runs·comments)만 대상이다.
 * guestbook·gallery·attendance·events는 web/index.html이 직접 구독·작성해서(전수 grep 확인)
 * 격리하면 웹·앱 동기화가 끊긴다 — 세션21 결정으로 이 4개는 root에 그대로 두고 옮기지 않는다.
 * 대상 4개의 기존 문서를 `crews/modu/{col}/{id}`로 **복사**한다. TIERS.md §4-2 "사본 원칙" —
 * root 문서는 절대 건드리지 않는다(삭제·수정 0건). 실패해도 root는 항상 안전하다.
 *
 * idempotent — 같은 문서 id로 setDoc(merge:true)만 쓰므로 몇 번을 다시 돌려도 root·
 * 이미 만든 사본 어느 쪽도 망가지지 않는다. 단, 크루 멤버십(owner) 생성만은 매 실행마다
 * **새 익명 uid**로 이뤄져 재실행 시 유령 member 문서가 하나씩 늘어난다(이 스크립트가
 * Node 단발 실행이라 로그인 세션을 로컬에 지속하지 않기 때문) — 데이터 정합성엔 영향 없고
 * Firebase 콘솔에서 수동 정리 가능. 한 번만 실행하는 걸 전제로 한다.
 *
 * ⚠️ 실행 전 조건: firestore.rules에 PHASE 2 크루 구조(crews/*, isMember 등)가 **배포**돼
 * 있어야 한다. 배포 안 된 상태에서 돌리면 모든 crews/* 쓰기가 permission-denied로 실패하고,
 * root는 안 건드렸으니 그대로 안전하게 종료된다(즉, 실패해도 무해하다).
 *
 * 사용:
 *   cd app
 *   node --env-file=.env scripts/migrate-crew-modu.mjs --dry-run   # 쓰기 없이 무엇을 할지만 출력
 *   node --env-file=.env scripts/migrate-crew-modu.mjs             # 실제 복사 + 검증
 */
import { initializeApp } from "firebase/app";
import { getAuth, signInAnonymously } from "firebase/auth";
import { collection, doc, getDoc, getDocs, getFirestore, setDoc } from "firebase/firestore";

const DRY_RUN = process.argv.includes("--dry-run");
const CREW_ID = "modu";
// 앱 전용 4개만 — guestbook·gallery·attendance·events는 웹 공유라 옮기지 않는다(세션21).
const COLLECTIONS = ["claps", "profiles", "runs", "comments"];

const app = initializeApp({
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
});
const db = getFirestore(app);
const auth = getAuth(app);

/** demo_ 접두 행은 client가 즉석에서 합성하는 가짜 데이터라 Firestore에 실존하지 않는다 — 대상 아님. */
function isDemo(id) {
  return id.startsWith("demo_");
}

/**
 * 순서가 중요하다 — rules의 `crews/{crewId} allow get: if isMember(crewId)`라 크루 문서
 * 존재 여부를 확인하려면 **먼저 내 멤버십부터 있어야** get()이 통과한다(닭이 먼저냐 달걀이
 * 먼저냐 문제). members 서브컬렉션 create는 상위 crews 문서 존재와 무관하게 항상 허용되므로
 * 멤버십을 먼저 만들고, 그다음에야 crews 문서를 안전하게 읽고/필요하면 만든다.
 */
async function ensureCrewAndMembership(uid) {
  // ① crewOwners 먼저 — crews 생성 규칙이 get(crewOwners/{uid}).data.count<3을 요구한다.
  const ownersRef = doc(db, "crewOwners", uid);
  console.log(`[crewOwners/${uid}] count:1 등록${DRY_RUN ? "(dry-run)" : ""}`);
  if (!DRY_RUN) await setDoc(ownersRef, { count: 1 });

  // ② 내 멤버십 먼저 — crews 문서가 아직 없어도 서브컬렉션 create는 항상 허용된다.
  const memberRef = doc(db, "crews", CREW_ID, "members", uid);
  console.log(`[crews/${CREW_ID}/members/${uid}] 이번 실행 세션 멤버십 등록${DRY_RUN ? "(dry-run)" : ""}`);
  if (!DRY_RUN) await setDoc(memberRef, { role: "owner" }, { merge: true });

  // ③ 이제 isMember(crewId)가 참이니 crews 문서를 안전하게 읽을 수 있다.
  if (DRY_RUN) {
    console.log(`[crews/${CREW_ID}] 존재 확인은 dry-run에서 생략(멤버십을 안 만들어 get이 막힘)`);
    return;
  }
  const crewRef = doc(db, "crews", CREW_ID);
  const crewSnap = await getDoc(crewRef);
  if (!crewSnap.exists()) {
    console.log(`[crews/${CREW_ID}] 신규 생성`);
    await setDoc(crewRef, { ownerUid: uid, name: "모두" });
  } else {
    console.log(`[crews/${CREW_ID}] 이미 존재 — 크루 문서는 안 건드림`);
  }
}

async function copyCollection(col) {
  const rootSnap = await getDocs(collection(db, col));
  let copied = 0;
  let skipped = 0;
  for (const d of rootSnap.docs) {
    if (isDemo(d.id)) {
      skipped++;
      continue;
    }
    if (!DRY_RUN) {
      await setDoc(doc(db, "crews", CREW_ID, col, d.id), d.data(), { merge: true });
    }
    copied++;
  }
  console.log(
    `[${col}] root ${rootSnap.size}건 중 ${copied}건 → crews/${CREW_ID}/${col}${
      skipped ? ` (데모행 ${skipped}건 스킵)` : ""
    }${DRY_RUN ? " (dry-run, 실제 쓰기 없음)" : ""}`
  );
  return { total: rootSnap.size, copied, skipped };
}

/** 복사 후 검증: root의 실문서(비데모) id가 전부 crews/{CREW_ID} 쪽에도 있는지 확인. */
async function verify(col) {
  const rootSnap = await getDocs(collection(db, col));
  const crewSnap = await getDocs(collection(db, "crews", CREW_ID, col));
  const rootIds = new Set(rootSnap.docs.filter((d) => !isDemo(d.id)).map((d) => d.id));
  const crewIds = new Set(crewSnap.docs.map((d) => d.id));
  const missing = [...rootIds].filter((id) => !crewIds.has(id));
  if (missing.length) {
    console.error(`[${col}] ⚠ 검증 실패 — root에는 있는데 crews/${CREW_ID}엔 없음: ${missing.join(", ")}`);
    return false;
  }
  console.log(`[${col}] 검증 통과 — root ${rootIds.size}건 전부 crews/${CREW_ID}에도 존재`);
  return true;
}

async function main() {
  console.log(DRY_RUN ? "=== DRY RUN — 실제 쓰기 없음 ===" : "=== 실제 마이그레이션 실행 ===");
  const cred = await signInAnonymously(auth);
  console.log(`인증 uid: ${cred.user.uid}`);

  await ensureCrewAndMembership(cred.user.uid);

  for (const col of COLLECTIONS) {
    await copyCollection(col);
  }

  if (DRY_RUN) {
    console.log("\ndry-run 종료 — 실제 반영은 --dry-run 없이 다시 실행.");
    return;
  }

  let allOk = true;
  for (const col of COLLECTIONS) {
    const ok = await verify(col);
    allOk = allOk && ok;
  }
  console.log(allOk ? "\n✅ 마이그레이션 + 검증 완료. root 문서는 그대로 보존됐다." : "\n❌ 검증 실패 — 위 목록을 확인할 것.");
  process.exitCode = allOk ? 0 : 1;
}

main().catch((e) => {
  console.error("마이그레이션 실패(root는 안 건드렸으므로 안전):", e);
  process.exitCode = 1;
});
