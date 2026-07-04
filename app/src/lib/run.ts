/**
 * 통합 Run — 수동 입력·GPS 실시간·워치(Health Connect/Garmin)가 공유하는 러닝 모델과 헬퍼.
 * 스키마 단일 소스는 firebase.ts COLLECTIONS.runs. 워치/외부 소스는 source+sourceId로 멱등 저장.
 */
import { add, put, type Row } from "./crew";
import { COLLECTIONS } from "./firebase";

export type RunSource = "manual" | "gps" | "healthconnect" | "garmin";

export type Run = {
  source: RunSource;
  sourceId?: string; // 멱등 upsert 키(워치/외부 소스 레코드 id)
  name: string;
  distanceKm: number;
  durationSec: number;
  paceSecPerKm?: number;
  startedAt?: number; // epoch ms
  avgHr?: number;
  cadence?: number;
};

export type LatLng = { lat: number; lng: number };

const EARTH_M = 6371000; // 지구 반지름(m)

/** 두 좌표 사이 거리(m) — Haversine */
export function haversine(a: LatLng, b: LatLng): number {
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const la1 = toRad(a.lat);
  const la2 = toRad(b.lat);
  const h =
    Math.sin(dLat / 2) ** 2 + Math.cos(la1) * Math.cos(la2) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_M * Math.asin(Math.min(1, Math.sqrt(h)));
}

export function paceSecPerKm(distanceKm: number, durationSec: number): number | undefined {
  if (!(distanceKm > 0)) return undefined;
  return durationSec / distanceKm;
}

/** 초/km → "5'30"/km" */
export function paceLabel(distanceKm: number, durationSec: number): string {
  const p = paceSecPerKm(distanceKm, durationSec);
  if (p === undefined || !isFinite(p)) return "-";
  const m = Math.floor(p / 60);
  const s = Math.round(p % 60);
  const ss = s === 60 ? "00" : String(s).padStart(2, "0");
  const mm = s === 60 ? m + 1 : m;
  return `${mm}'${ss}"/km`;
}

/** 초 → "M:SS" 또는 "H:MM:SS" */
export function fmtDuration(sec: number): string {
  const s = Math.max(0, Math.round(sec));
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  const ss = s % 60;
  const p = (n: number) => String(n).padStart(2, "0");
  return h > 0 ? `${h}:${p(m)}:${p(ss)}` : `${m}:${p(ss)}`;
}

function toMs(v: any): number {
  try {
    if (v?.toDate) return v.toDate().getTime();
    if (typeof v === "number") return v;
    return new Date(v).getTime();
  } catch {
    return 0;
  }
}

export function isToday(v: any): boolean {
  const t = toMs(v);
  if (!t) return false;
  const d = new Date(t);
  const n = new Date();
  return (
    d.getFullYear() === n.getFullYear() &&
    d.getMonth() === n.getMonth() &&
    d.getDate() === n.getDate()
  );
}

/** 오늘 뛴 거리 합계(km). name 주면 그 사람만. startedAt 우선, 없으면 createdAt 기준. */
export function todayKm(rows: Row[], name?: string): number {
  return rows
    .filter((r) => isToday(r.startedAt ?? r.createdAt) && (!name || r.name === name))
    .reduce((a, r) => a + (Number(r.distanceKm) || 0), 0);
}

/** Run 저장. sourceId 있으면 `${source}_${sourceId}` id로 멱등 upsert, 없으면 신규 add. */
export async function saveRun(run: Run): Promise<void> {
  const paceSec = run.paceSecPerKm ?? paceSecPerKm(run.distanceKm, run.durationSec);
  const item: Record<string, any> = {
    source: run.source,
    name: run.name,
    distanceKm: Number(run.distanceKm.toFixed(3)),
    durationSec: Math.round(run.durationSec),
    durationMin: Math.round(run.durationSec / 60), // 기존 화면·웹 호환
  };
  if (paceSec !== undefined) item.paceSecPerKm = Math.round(paceSec);
  if (run.startedAt) item.startedAt = run.startedAt;
  if (run.avgHr) item.avgHr = Math.round(run.avgHr);
  if (run.cadence) item.cadence = Math.round(run.cadence);

  if (run.sourceId) {
    item.sourceId = run.sourceId;
    await put(COLLECTIONS.runs, `${run.source}_${run.sourceId}`, item, run.startedAt);
  } else {
    await add(COLLECTIONS.runs, item);
  }
}
