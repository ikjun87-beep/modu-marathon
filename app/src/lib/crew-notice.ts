/** 크루 공지(crews/{CREW_ID}.notice) — PHASE 2-C 세션23.
 *  단일 문서 구독이라 `crew.ts`의 컬렉션 구독(subscribe)과는 다른 축이라 여기 따로 둔다. */
import { doc, onSnapshot, updateDoc } from "firebase/firestore";

import { uid } from "./auth";
import { CREW_ID, db, HAS_FIREBASE } from "./firebase";

export type CrewDoc = { name?: string; ownerUid?: string; notice?: string };

export function subscribeCrew(cb: (crew: CrewDoc | null) => void): () => void {
  if (!HAS_FIREBASE) {
    cb(null);
    return () => {};
  }
  return onSnapshot(doc(db, "crews", CREW_ID), (snap) => cb(snap.exists() ? (snap.data() as CrewDoc) : null));
}

/** 이 기기 사용자가 크루장인가 — `crews/{id}.ownerUid`가 유일한 진실의 소스다
 *  (`members/{uid}.role`엔 'owner'를 절대 쓰지 않는다, firestore.rules PHASE 2-C 참고). */
export function isCrewOwner(crew: CrewDoc | null): boolean {
  const u = uid();
  return !!u && !!crew?.ownerUid && crew.ownerUid === u;
}

export async function updateCrewNotice(notice: string): Promise<void> {
  await updateDoc(doc(db, "crews", CREW_ID), { notice: notice.trim() });
}
