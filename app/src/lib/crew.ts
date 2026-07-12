/** 크루 데이터 레이어 — 웹(web/index.html)과 동일 패턴.
 *  Firebase 설정 있으면 Firestore 실시간 구독, 없으면 이 기기(AsyncStorage) 폴백. */
import AsyncStorage from "@react-native-async-storage/async-storage";
import {
  addDoc,
  collection,
  deleteDoc,
  doc,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
} from "firebase/firestore";
import { demoRows } from "./demo";
import { db, HAS_FIREBASE } from "./firebase";

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

/** createdAt(Firestore Timestamp | number)을 ko 날짜 문자열로 */
export function fmtDate(createdAt: any): string {
  try {
    const d = createdAt?.toDate ? createdAt.toDate() : new Date(createdAt);
    return d.toLocaleDateString("ko-KR");
  } catch {
    return "";
  }
}
