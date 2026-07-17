/**
 * Health Connect — 갤럭시워치/삼성헬스가 Health Connect에 기록한 운동을 앱으로 가져온다.
 * 오늘의 ExerciseSession(달리기·걷기) + Distance + HeartRate를 읽어
 * 통합 Run(source:'healthconnect')으로 멱등 저장.
 *
 * ⚠️ Android 전용 · **dev/preview build에서만 동작**(Expo Go/웹 불가).
 *    폰에 "Health Connect"(Android 14+는 OS 내장) + 삼성헬스 → Health Connect 동기화가 켜져 있어야 한다.
 *
 * 📌 삼성헬스 이력(2026-07): 한때 운동·거리를 HC에 아예 안 써서 "플랫폼 한계"로 판단했으나,
 *    이는 **삼성헬스 특정 버전의 회귀 버그**였고 7.00.5.009에서 고쳐진 것을 실기기로 확인.
 *    (HC는 forward-looking — 연동이 켜진 **이후** 기록분만 올라온다. 과거 운동은 안 올라와도 정상.)
 */
import { Platform } from "react-native";

import { saveRun, type RunKind } from "./run";

export const HC_SUPPORTED = Platform.OS === "android";

/** Health Connect 운동 타입 상수. 라이브러리(ExerciseType)에서 읽되, 못 읽으면 이 값으로 폴백한다.
 *  폴백이 없으면 상수를 못 가져왔을 때 **조용히 0건 동기화**가 되어 원인 추적이 지옥이 된다. */
const FALLBACK_TYPES = { RUNNING: 56, RUNNING_TREADMILL: 57, WALKING: 79, HIKING: 37 } as const;

/** 우리가 받아들이는 운동 타입 → 우리 기록 종류.
 *  걷기도 받는다 — 크루 모임이 "걷기+뛰기 병행, 러닝 처음도 환영"이고, 입문자가 가장 먼저 하는 게 걷기다.
 *  다만 러닝과 섞이면 페이스·랭킹이 왜곡되므로 kind로 구분해 저장한다(집계 분리는 lib/stats).
 *  자전거·수영 등은 러닝 앱 범위 밖이라 안 받는다. */
function kindOf(exerciseType: number, T: Record<string, number>): RunKind | null {
  if (exerciseType === T.RUNNING || exerciseType === T.RUNNING_TREADMILL) return "run";
  if (exerciseType === T.WALKING || exerciseType === T.HIKING) return "walk";
  return null;
}

export type SyncResult = {
  ok: boolean;
  synced: number; // 저장된 세션 수(달리기+걷기)
  totalKm: number; // 오늘 불러온 총 거리
  walks: number; // 그중 걷기 수 — 안내 문구를 정확히 쓰려고 따로 센다
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
    return { ok: false, synced: 0, totalKm: 0, walks: 0, reason: "안드로이드에서만 지원돼요." };
  }
  let HC: typeof import("react-native-health-connect");
  try {
    HC = await import("react-native-health-connect");
  } catch {
    return { ok: false, synced: 0, totalKm: 0, walks: 0, reason: "Health Connect 모듈을 불러오지 못했어요 (dev build 필요)." };
  }

  try {
    const status = await HC.getSdkStatus();
    if (status !== HC.SdkAvailabilityStatus.SDK_AVAILABLE) {
      return {
        ok: false,
        synced: 0,
        totalKm: 0,
        walks: 0,
        reason: "폰에 Health Connect가 필요해요. Play스토어에서 설치 후 삼성헬스 동기화를 켜주세요.",
      };
    }
    const inited = await HC.initialize();
    if (!inited) return { ok: false, synced: 0, totalKm: 0, walks: 0, reason: "Health Connect 초기화 실패." };

    // 심박(민감정보)은 별도 동의(readHeartRate)가 있을 때만 권한 요청 — 최소수집 원칙
    const perms: any[] = [
      { accessType: "read", recordType: "ExerciseSession" },
      { accessType: "read", recordType: "Distance" },
    ];
    if (readHeartRate) perms.push({ accessType: "read", recordType: "HeartRate" });
    await HC.requestPermission(perms);

    // 실제 부여 여부 확인 — 미부여 시 raw SecurityException 대신 실행 가능한 안내.
    // (매니페스트 선언만으론 부족, Health Connect에서 사용자가 '허용'해야 read 가능)
    let granted: any[] = [];
    try {
      granted = (await HC.getGrantedPermissions()) ?? [];
    } catch {
      granted = [];
    }
    const hasRead = (rt: string) =>
      granted.some((g) => g?.accessType === "read" && g?.recordType === rt);
    if (!hasRead("ExerciseSession") || !hasRead("Distance")) {
      return {
        ok: false,
        synced: 0,
        totalKm: 0,
        walks: 0,
        reason:
          "Health Connect에서 '모두의 마라톤'에 운동·거리 읽기 권한을 허용해 주세요.\n(Health Connect 앱 → 앱 및 기기 권한 → 모두의 마라톤 → 운동·거리 켜기)",
      };
    }

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
    if (readHeartRate && hasRead("HeartRate")) {
      const hrRes: any = await HC.readRecords("HeartRate", { timeRangeFilter });
      hrs = hrRes?.records ?? hrRes ?? [];
    }

    let synced = 0;
    let totalKm = 0;
    let walks = 0;
    let failed = 0;

    // 라이브러리 상수 우선, 없으면 폴백(위 주석 참조).
    const lib = (HC as any).ExerciseType;
    const T: Record<string, number> =
      lib && typeof lib.RUNNING === "number" ? lib : FALLBACK_TYPES;
    for (const s of sessions) {
      const kind = kindOf(Number(s.exerciseType), T);
      if (!kind) continue; // 자전거·수영 등 러닝 앱 범위 밖
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

      // **세션별로 감싼다** — 한 세션 저장이 실패해도 나머지 세션은 계속 불러온다.
      // (예전엔 바깥 try 하나라, 세션 하나가 던지면 그날 동기화 전체가 멈췄다.)
      try {
        await saveRun({
          source: "healthconnect",
          sourceId,
          kind,
          name: name.trim() || "익명",
          distanceKm: km,
          durationSec: (sE - sS) / 1000,
          startedAt: sS,
          avgHr,
        });
        synced++;
        totalKm += km;
        if (kind === "walk") walks++;
      } catch {
        failed++;
      }
    }

    return {
      ok: true,
      synced,
      totalKm,
      walks,
      reason:
        synced === 0
          ? failed > 0
            ? "워치 기록을 불러오지 못했어요. 잠시 후 다시 시도해 주세요."
            : "오늘 워치에 기록된 러닝·걷기가 없어요."
          : undefined,
    };
  } catch (e: any) {
    return {
      ok: false,
      synced: 0,
      totalKm: 0,
      walks: 0,
      reason: e?.message ?? "동기화 중 오류가 발생했어요.",
    };
  }
}
