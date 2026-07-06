/**
 * Health Connect — 갤럭시워치/삼성헬스가 Health Connect에 기록한 러닝을 앱으로 가져온다.
 * 오늘의 ExerciseSession(러닝) + Distance + HeartRate를 읽어 통합 Run(source:'healthconnect')으로 멱등 저장.
 *
 * ⚠️ Android 전용 · **EAS dev build에서만 동작**(Expo Go/웹 불가).
 *    폰에 "Health Connect" 앱 + 삼성헬스 → Health Connect 동기화가 켜져 있어야 데이터가 보인다.
 */
import { Platform } from "react-native";

import { saveRun } from "./run";

export const HC_SUPPORTED = Platform.OS === "android";

// Health Connect 러닝 계열 운동 타입
const RUNNING_TYPES = new Set<number>([56 /* RUNNING */, 57 /* RUNNING_TREADMILL */]);

export type SyncResult = {
  ok: boolean;
  synced: number; // 저장된 러닝 세션 수
  totalKm: number; // 오늘 러닝 총 거리
  reason?: string; // 실패/안내 사유
};

function startOfTodayISO(): string {
  const n = new Date();
  return new Date(n.getFullYear(), n.getMonth(), n.getDate(), 0, 0, 0, 0).toISOString();
}

function overlaps(aS: number, aE: number, bS: number, bE: number): boolean {
  return aS < bE && bS < aE;
}

/**
 * 오늘 러닝을 Health Connect에서 읽어 runs에 멱등 저장. name은 이 기기 사용자 이름.
 * readHeartRate=false면 심박(민감정보)을 읽지도·저장하지도 않는다 — 별도 동의 미승인 시 최소수집.
 */
export async function syncTodayRuns(
  name: string,
  opts: { readHeartRate?: boolean } = {}
): Promise<SyncResult> {
  const readHeartRate = opts.readHeartRate ?? false;
  if (!HC_SUPPORTED) {
    return { ok: false, synced: 0, totalKm: 0, reason: "안드로이드에서만 지원돼요." };
  }
  let HC: typeof import("react-native-health-connect");
  try {
    HC = await import("react-native-health-connect");
  } catch {
    return { ok: false, synced: 0, totalKm: 0, reason: "Health Connect 모듈을 불러오지 못했어요 (dev build 필요)." };
  }

  try {
    const status = await HC.getSdkStatus();
    if (status !== HC.SdkAvailabilityStatus.SDK_AVAILABLE) {
      return {
        ok: false,
        synced: 0,
        totalKm: 0,
        reason: "폰에 Health Connect가 필요해요. Play스토어에서 설치 후 삼성헬스 동기화를 켜주세요.",
      };
    }
    const inited = await HC.initialize();
    if (!inited) return { ok: false, synced: 0, totalKm: 0, reason: "Health Connect 초기화 실패." };

    // 심박(민감정보)은 별도 동의(readHeartRate)가 있을 때만 권한 요청 — 최소수집 원칙
    const perms: any[] = [
      { accessType: "read", recordType: "ExerciseSession" },
      { accessType: "read", recordType: "Distance" },
    ];
    if (readHeartRate) perms.push({ accessType: "read", recordType: "HeartRate" });
    await HC.requestPermission(perms);

    const timeRangeFilter = {
      operator: "between" as const,
      startTime: startOfTodayISO(),
      endTime: new Date().toISOString(),
    };

    const sessionsRes: any = await HC.readRecords("ExerciseSession", { timeRangeFilter });
    const distRes: any = await HC.readRecords("Distance", { timeRangeFilter });
    const sessions: any[] = sessionsRes?.records ?? sessionsRes ?? [];
    const dists: any[] = distRes?.records ?? distRes ?? [];
    let hrs: any[] = [];
    if (readHeartRate) {
      const hrRes: any = await HC.readRecords("HeartRate", { timeRangeFilter });
      hrs = hrRes?.records ?? hrRes ?? [];
    }

    let synced = 0;
    let totalKm = 0;

    for (const s of sessions) {
      if (!RUNNING_TYPES.has(Number(s.exerciseType))) continue;
      const sS = new Date(s.startTime).getTime();
      const sE = new Date(s.endTime).getTime();
      if (!(sE > sS)) continue;

      // 세션 구간과 겹치는 Distance를 출처(dataOrigin)별로 합산 → 최댓값만 채택.
      // 삼성헬스·구글핏·워치가 같은 러닝을 각자 기록하면 단순 합산 시 이중·삼중 계상됨(버그 #7).
      // 단일 출처만 쓰면 멀티앱 중복이 제거되고, 한 출처의 세분 레코드는 정상 합산된다.
      const byOrigin = new Map<string, number>();
      for (const d of dists) {
        const dS = new Date(d.startTime).getTime();
        const dE = new Date(d.endTime).getTime();
        if (!overlaps(sS, sE, dS, dE)) continue;
        const origin =
          d?.metadata?.dataOrigin?.packageName ?? d?.metadata?.dataOrigin ?? "unknown";
        byOrigin.set(origin, (byOrigin.get(origin) ?? 0) + (Number(d?.distance?.inMeters) || 0));
      }
      const meters = byOrigin.size ? Math.max(...byOrigin.values()) : 0;
      const km = meters / 1000;
      if (km < 0.01) continue;

      // 세션 구간 평균 심박
      let hrSum = 0;
      let hrN = 0;
      for (const h of hrs) {
        for (const smp of h?.samples ?? []) {
          const t = new Date(smp.time).getTime();
          if (t >= sS && t <= sE) {
            hrSum += Number(smp.beatsPerMinute) || 0;
            hrN++;
          }
        }
      }
      const avgHr = hrN > 0 ? hrSum / hrN : undefined;
      const sourceId = String(s?.metadata?.id ?? `${sS}`);

      await saveRun({
        source: "healthconnect",
        sourceId,
        name: name.trim() || "익명",
        distanceKm: km,
        durationSec: (sE - sS) / 1000,
        startedAt: sS,
        avgHr,
      });
      synced++;
      totalKm += km;
    }

    return {
      ok: true,
      synced,
      totalKm,
      reason: synced === 0 ? "오늘 워치에 기록된 러닝이 없어요." : undefined,
    };
  } catch (e: any) {
    return { ok: false, synced: 0, totalKm: 0, reason: e?.message ?? "동기화 중 오류가 발생했어요." };
  }
}
