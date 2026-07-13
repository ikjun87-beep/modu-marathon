/** 크루 데이터 레이어 — 웹(web/index.html)과 동일 패턴.
 *  Firebase 설정 있으면 Firestore 실시간 구독, 없으면 이 기기(AsyncStorage) 폴백. */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
  writeBatch,
} from "firebase/firestore";
import { demoRows } from "./demo";
import { COLLECTIONS, db, HAS_FIREBASE } from "./firebase";

export type Row = Record<string, any> & { id: string; createdAt?: any };

/** 데모 행 병합 — 검토용 가짜 데이터를 실데이터와 함께 표시(createdAt desc 정렬). demo.ts DEMO로 on/off. */
function toMsLocal(v: any): number {
  try {
    if (v?.toDate) return v.toDate().getTime();
    if (typeof v === "number") return v;
    return new Date(v).getTime();
  } catch {
    return 0;
  }
}
function mergeDemo(col: string, rows: Row[]): Row[] {
  const demo = demoRows(col);
  if (!demo.length) return rows;
  const ids = new Set(rows.map((r) => r.id));
  const merged = [...rows, ...demo.filter((d) => !ids.has(d.id))];
  return merged.sort((a, b) => toMsLocal(b.createdAt) - toMsLocal(a.createdAt));
}
/** demo_ 로 시작하는 검토용 행인지 — 편집·삭제 대상에서 제외. */
export function isDemo(id: string): boolean {
  return id.startsWith("demo_");
}

// ── Firestore ──
function fbSubscribe(col: string, cb: (rows: Row[]) => void) {
  return onSnapshot(query(collection(db, col), orderBy("createdAt", "desc")), (s) =>
    cb(s.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}
function fbAdd(col: string, item: Record<string, any>) {
  return addDoc(collection(db, col), { ...item, createdAt: serverTimestamp() });
}
function fbRemove(col: string, id: string) {
  return deleteDoc(doc(db, col, id));
}
function fbUpdate(col: string, id: string, patch: Record<string, any>) {
  return updateDoc(doc(db, col, id), patch);
}
/** 결정적 문서 id로 upsert(멱등) — 워치/외부 소스 중복 방지. createdAtMs 있으면 그 시각으로 고정. */
function fbPut(col: string, id: string, item: Record<string, any>, createdAtMs?: number) {
  return setDoc(
    doc(db, col, id),
    { ...item, createdAt: createdAtMs ? new Date(createdAtMs) : serverTimestamp() },
    { merge: true }
  );
}

// ── 로컬 폴백 (AsyncStorage + 간단 pub/sub) ──
const lkey = (col: string) => `mm_${col}`;
const listeners: Record<string, Set<() => void>> = {};
function emit(col: string) {
  listeners[col]?.forEach((l) => l());
}
async function localGet(col: string): Promise<Row[]> {
  const raw = await AsyncStorage.getItem(lkey(col));
  return raw ? (JSON.parse(raw) as Row[]) : [];
}
function localSubscribe(col: string, cb: (rows: Row[]) => void) {
  (listeners[col] ??= new Set());
  const l = () => void localGet(col).then(cb);
  listeners[col].add(l);
  l();
  return () => {
    listeners[col].delete(l);
  };
}
async function localAdd(col: string, item: Record<string, any>) {
  const list = await localGet(col);
  list.unshift({ id: "l" + Date.now(), createdAt: Date.now(), ...item });
  await AsyncStorage.setItem(lkey(col), JSON.stringify(list.slice(0, 100)));
  emit(col);
}
async function localRemove(col: string, id: string) {
  const list = (await localGet(col)).filter((x) => x.id !== id);
  await AsyncStorage.setItem(lkey(col), JSON.stringify(list));
  emit(col);
}
async function localUpdate(col: string, id: string, patch: Record<string, any>) {
  const list = await localGet(col);
  const i = list.findIndex((x) => x.id === id);
  if (i >= 0) {
    list[i] = { ...list[i], ...patch };
    await AsyncStorage.setItem(lkey(col), JSON.stringify(list));
    emit(col);
  }
}
async function localPut(col: string, id: string, item: Record<string, any>, createdAtMs?: number) {
  const list = await localGet(col);
  const rec: Row = { id, createdAt: createdAtMs ?? Date.now(), ...item };
  const i = list.findIndex((x) => x.id === id);
  if (i >= 0) list[i] = { ...list[i], ...rec };
  else list.unshift(rec);
  await AsyncStorage.setItem(lkey(col), JSON.stringify(list.slice(0, 200)));
  emit(col);
}

// ── 통합 API ──
export function subscribe(col: string, cb: (rows: Row[]) => void): () => void {
  const wrapped = (rows: Row[]) => cb(mergeDemo(col, rows));
  return HAS_FIREBASE ? fbSubscribe(col, wrapped) : localSubscribe(col, wrapped);
}
export function add(col: string, item: Record<string, any>): Promise<unknown> {
  return HAS_FIREBASE ? fbAdd(col, item) : localAdd(col, item);
}
export function remove(col: string, id: string): Promise<unknown> {
  if (isDemo(id)) return Promise.resolve(); // 데모 행은 저장소에 없음 → no-op
  return HAS_FIREBASE ? fbRemove(col, id) : localRemove(col, id);
}
/** 문서 일부 필드 수정(글 수정 등). 데모 행은 편집 대상 아님 → no-op. */
export function update(col: string, id: string, patch: Record<string, any>): Promise<unknown> {
  if (isDemo(id)) return Promise.resolve();
  return HAS_FIREBASE ? fbUpdate(col, id, patch) : localUpdate(col, id, patch);
}
/** 결정적 id로 upsert(멱등). 워치/외부 소스 동기화의 중복 방지에 사용. */
export function put(
  col: string,
  id: string,
  item: Record<string, any>,
  createdAtMs?: number
): Promise<unknown> {
  return HAS_FIREBASE ? fbPut(col, id, item, createdAtMs) : localPut(col, id, item, createdAtMs);
}

/** 러너 네임을 바꿀 때 **이미 남긴 글·참석·러닝·댓글의 이름도 함께 갈아끼운다.**
 *
 *  왜: 문서에 작성자가 `name` 문자열로 박제돼 저장된다(웹과 공유하는 스키마라 uid 키로 못 바꿈).
 *  그래서 이름만 바꾸면 과거 기록은 옛 이름으로 남아 "내 것"으로 안 보인다(회장 지적).
 *  → 이름 변경 시 옛 이름으로 된 내 문서를 찾아 새 이름으로 일괄 수정한다.
 *
 *  한계(정직하게): 같은 이름을 쓰는 다른 사람의 문서도 함께 바뀐다. 지금 신원이 이름 기반이라
 *  구분할 방법이 없다. 웹까지 Auth를 붙이고 문서에 uid를 심으면 그때 소유 기반으로 교체할 것.
 *
 *  @returns 바뀐 문서 수
 */
const NAMED_COLLECTIONS = [
  COLLECTIONS.guestbook,
  COLLECTIONS.gallery,
  COLLECTIONS.attendance,
  COLLECTIONS.runs,
  COLLECTIONS.comments,
];

export async function renameAuthor(oldName: string, newName: string): Promise<number> {
  const from = oldName.trim();
  const to = newName.trim();
  if (!from || !to || from === to) return 0;

  if (!HAS_FIREBASE) {
    let n = 0;
    for (const col of NAMED_COLLECTIONS) {
      const list = await localGet(col);
      let touched = false;
      for (const row of list) {
        if (row.name === from) {
          row.name = to;
          touched = true;
          n++;
        }
      }
      if (touched) {
        await AsyncStorage.setItem(lkey(col), JSON.stringify(list));
        emit(col);
      }
    }
    return n;
  }

  let n = 0;
  for (const col of NAMED_COLLECTIONS) {
    const snap = await getDocs(query(collection(db, col), where("name", "==", from)));
    if (snap.empty) continue;
    // 데모 행은 저장소에 없는 가짜라 대상 아님(id가 demo_ 접두).
    const targets = snap.docs.filter((d) => !isDemo(d.id));
    for (let i = 0; i < targets.length; i += 400) {
      const batch = writeBatch(db);
      targets.slice(i, i + 400).forEach((d) => batch.update(d.ref, { name: to }));
      await batch.commit();
    }
    n += targets.length;
  }
  return n;
}

/** createdAt(Firestore Timestamp | number)을 ko 날짜 문자열로 */
export function fmtDate(createdAt: any): string {
  try {
    const d = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
    return d.toLocaleDateString("ko-KR");
  } catch {
    return "";
  }
}
