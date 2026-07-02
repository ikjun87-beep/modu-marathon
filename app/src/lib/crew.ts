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
} from "firebase/firestore";
import { db, HAS_FIREBASE } from "./firebase";

export type Row = Record<string, any> & { id: string; createdAt?: any };

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

// ── 통합 API ──
export function subscribe(col: string, cb: (rows: Row[]) => void): () => void {
  return HAS_FIREBASE ? fbSubscribe(col, cb) : localSubscribe(col, cb);
}
export function add(col: string, item: Record<string, any>): Promise<unknown> {
  return HAS_FIREBASE ? fbAdd(col, item) : localAdd(col, item);
}
export function remove(col: string, id: string): Promise<unknown> {
  return HAS_FIREBASE ? fbRemove(col, id) : localRemove(col, id);
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
