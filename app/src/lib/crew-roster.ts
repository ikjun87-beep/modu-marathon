/** 크루 로스터 — PHASE 2-C 세션23. 크루장은 crews/{id}.ownerUid로 판정(crew-notice.ts),
 *  나머지 role(admin/member)은 members 서브컬렉션에서 읽는다.
 *
 *  ⚠️ members 문서엔 이름이 없을 수 있다(이 기능 이전에 만들어진 문서가 다수). 화면에 사람을
 *  보여주려면 이름이 필요해서, members.name이 비어 있으면 이미 존재하는 다른 컬렉션(러닝·댓글·
 *  박수·방명록 등)에서 uid로 이름을 역으로 찾는다(최신 글 기준). 새 컬렉션·스키마 변경 없이
 *  기존 데이터만으로 최선을 다해 채우는 것이고, 활동이 전혀 없는 신규 멤버는 이름 없이 남을 수
 *  있다(정직한 표시 — 지어내지 않는다).
 */
import { collection, doc, getDocs, onSnapshot, updateDoc } from "firebase/firestore";

import { uid } from "./auth";
import { COLLECTIONS, CREW_ID, db, HAS_FIREBASE } from "./firebase";

export type Role = "admin" | "member";
export type Member = { uid: string; role: Role; name?: string };

export function subscribeMembers(cb: (members: Member[]) => void): () => void {
  if (!HAS_FIREBASE) {
    cb([]);
    return () => {};
  }
  return onSnapshot(collection(db, "crews", CREW_ID, "members"), (snap) => {
    cb(
      snap.docs.map((d) => {
        const data = d.data() as { role?: string; name?: string };
        return { uid: d.id, role: data.role === "admin" ? "admin" : "member", name: data.name };
      })
    );
  });
}

const NAME_LOOKUP_COLLECTIONS = [
  COLLECTIONS.runs,
  COLLECTIONS.comments,
  COLLECTIONS.claps,
  COLLECTIONS.profiles,
  COLLECTIONS.guestbook,
  COLLECTIONS.gallery,
  COLLECTIONS.attendance,
];

function toMs(v: any): number {
  try {
    if (v?.toDate) return v.toDate().getTime();
    if (typeof v === "number") return v;
    return new Date(v).getTime();
  } catch {
    return 0;
  }
}

/** members.name이 없는 사람들의 이름을 다른 컬렉션에서 최선을 다해 채운다(위 주석 참고).
 *  로스터 화면을 열 때 한 번만 도는 일회성 조회 — 실시간 구독이 아니다. */
export async function resolveMissingNames(members: Member[]): Promise<Member[]> {
  const missing = new Set(members.filter((m) => !m.name).map((m) => m.uid));
  if (!HAS_FIREBASE || missing.size === 0) return members;

  const found = new Map<string, { name: string; at: number }>();
  await Promise.all(
    NAME_LOOKUP_COLLECTIONS.map(async (col) => {
      const snap = await getDocs(collection(db, col));
      snap.forEach((d) => {
        const data = d.data() as { uid?: string; name?: string; createdAt?: unknown };
        if (!data.uid || !data.name || !missing.has(data.uid)) return;
        const at = toMs(data.createdAt);
        const prev = found.get(data.uid);
        if (!prev || at > prev.at) found.set(data.uid, { name: data.name, at });
      });
    })
  );

  return members.map((m) => (m.name ? m : { ...m, name: found.get(m.uid)?.name }));
}

export function myRole(members: Member[]): Role | null {
  const u = uid();
  return members.find((m) => m.uid === u)?.role ?? null;
}

export async function promoteToAdmin(memberUid: string): Promise<void> {
  await updateDoc(doc(db, "crews", CREW_ID, "members", memberUid), { role: "admin" });
}
export async function demoteToMember(memberUid: string): Promise<void> {
  await updateDoc(doc(db, "crews", CREW_ID, "members", memberUid), { role: "member" });
}
