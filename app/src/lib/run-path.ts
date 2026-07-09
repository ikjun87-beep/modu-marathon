/**
 * GPS 러닝 경로의 온디바이스 저장 — 상세 페이지에서 완주한 경로를 지도에 그리기 위함.
 * 처리방침 정합: 좌표는 **서버(Firestore) 미저장** 원칙 유지 → 이 기기(AsyncStorage)에만 표시용으로 보관.
 * 키는 runs 문서 id와 동일(gps_<startedAt>)로 맞춰 상세 페이지가 곧바로 조회한다.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";

import type { LatLng } from "./run";

const key = (runId: string) => `mm_run_path_${runId}`;
const MAX_POINTS = 2000; // 장거리 러닝도 저장 부담 없게 상한(초과 시 균등 솎기)

/** 균등 간격으로 솎아 최대 max개로(끝점은 항상 포함). */
function decimate(path: LatLng[], max: number): LatLng[] {
  if (path.length <= max) return path;
  const step = Math.ceil(path.length / max);
  const out = path.filter((_, i) => i % step === 0);
  const last = path[path.length - 1];
  if (out[out.length - 1] !== last) out.push(last);
  return out;
}

export async function saveRunPath(runId: string, path: LatLng[]): Promise<void> {
  if (!runId || path.length < 2) return;
  try {
    await AsyncStorage.setItem(key(runId), JSON.stringify(decimate(path, MAX_POINTS)));
  } catch {
    // 표시용 데이터라 실패해도 러닝 저장엔 영향 없음(무시)
  }
}

export async function loadRunPath(runId: string): Promise<LatLng[] | null> {
  if (!runId) return null;
  try {
    const raw = await AsyncStorage.getItem(key(runId));
    return raw ? (JSON.parse(raw) as LatLng[]) : null;
  } catch {
    return null;
  }
}

export async function removeRunPath(runId: string): Promise<void> {
  if (!runId) return;
  try {
    await AsyncStorage.removeItem(key(runId));
  } catch {
    // 무시
  }
}
