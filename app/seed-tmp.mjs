/**
 * 디자인 캡처용 임시 데이터 시딩/정리.
 *
 * 왜: 독립 채점 R13이 "차별화 주장의 절반이 화면에 나타나지 않아 증명되지 않았다"고 지적.
 * 크루원 1명·러닝 0건이라 시상대·2열 그리드·아바타 3색이 한 번도 안 보였다.
 *
 * ⚠️ 캡처가 끝나면 반드시 `node seed.mjs clean`으로 지운다. 실서비스 컬렉션이다.
 * 모든 문서 id에 접두사 `zzdemo_`를 붙여 정리 때 확실히 골라낼 수 있게 한다.
 */
import { initializeApp } from "firebase/app";
import {
  collection,
  deleteDoc,
  doc,
  getDocs,
  getFirestore,
  setDoc,
} from "firebase/firestore";
import { readFileSync } from "node:fs";

const env = Object.fromEntries(
  readFileSync(process.argv[3] ?? "app/.env", "utf8")
    .split("\n")
    .filter((l) => l.includes("="))
    .map((l) => {
      const i = l.indexOf("=");
      return [l.slice(0, i).trim(), l.slice(i + 1).trim()];
    })
);

const app = initializeApp({
  apiKey: env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: env.EXPO_PUBLIC_FIREBASE_APP_ID,
});
const db = getFirestore(app);

const PREFIX = "zzdemo_";
// 이름은 한눈에 임시임을 알 수 있게 — 실제 크루원 이름과 겹치면 안 된다.
const PEOPLE = ["민지(테스트)", "준호(테스트)", "하늘(테스트)", "유진(테스트)"];
const DAY = 24 * 60 * 60 * 1000;

async function seed() {
  const now = Date.now();
  let n = 0;
  // 러닝 12건 — 사람마다 거리·횟수를 다르게 둬야 시상대 순위가 생긴다.
  const plan = [
    [0, 8.2, 1], [0, 5.1, 2], [0, 6.4, 3],
    [1, 10.5, 1], [1, 4.2, 2],
    [2, 3.1, 1], [2, 7.7, 2], [2, 5.5, 4],
    [3, 12.1, 1], [3, 6.0, 2], [3, 4.4, 3], [3, 9.3, 5],
  ];
  for (const [pi, km, daysAgo] of plan) {
    const startedAt = now - daysAgo * DAY - 3 * 60 * 60 * 1000;
    const id = `${PREFIX}run_${pi}_${daysAgo}_${String(km).replace(".", "")}`;
    await setDoc(doc(db, "runs", id), {
      source: "manual",
      name: PEOPLE[pi],
      distanceKm: km,
      durationSec: Math.round(km * 340),
      startedAt: new Date(startedAt),
      createdAt: new Date(startedAt),
    });
    n++;
  }
  // 방명록 2건 — 타임라인에 러닝 말고 다른 종류도 섞여야 흐름이 보인다.
  for (const [i, msg] of [
    [0, "오늘 탄천 좋았어요!"],
    [2, "다음 모임 참석합니다"],
  ]) {
    const at = now - (i === 0 ? 2 : 4) * 60 * 60 * 1000;
    await setDoc(doc(db, "guestbook", `${PREFIX}gb_${i}`), {
      name: PEOPLE[i],
      msg,
      createdAt: new Date(at),
    });
    n++;
  }
  console.log(`seeded ${n} docs`);
}

async function clean() {
  let n = 0;
  for (const col of ["runs", "guestbook", "attendance", "claps", "gallery"]) {
    // 규칙이 배포되지 않은 컬렉션(claps)은 읽기부터 막힌다 — 한 곳이 막혔다고
    // 나머지 정리를 포기하면 임시 데이터가 남는다. 컬렉션 단위로 실패를 넘긴다.
    let snap;
    try {
      snap = await getDocs(collection(db, col));
    } catch (e) {
      console.log(`skip ${col}: ${e.code ?? e}`);
      continue;
    }
    for (const d of snap.docs) {
      if (d.id.startsWith(PREFIX)) {
        await deleteDoc(d.ref);
        n++;
      }
    }
  }
  console.log(`deleted ${n} docs`);
}

const mode = process.argv[2];
if (mode === "seed") await seed();
else if (mode === "clean") await clean();
else console.log("usage: node seed.mjs seed|clean [envPath]");
process.exit(0);
