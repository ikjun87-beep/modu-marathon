/**
 * 백그라운드 GPS 러닝 트래킹 — S5(2026-08-15).
 *
 * 왜 별도 모듈인가: `expo-task-manager`의 `TaskManager.defineTask()`는 **모듈 스코프**에서
 * 등록돼야 화면이 꺼지거나 앱이 background로 밀려도 네이티브가 그 콜백을 찾아 실행할 수 있다.
 * 이 콜백은 React 컴포넌트가 이미 언마운트됐거나 애초에 렌더되지 않은 상태에서도 불릴 수 있어서,
 * `live-run.tsx`의 `useState`에 직접 접근할 방법이 없다 — 그래서 거리·경로·상승고도 계산을
 * 여기 모듈 레벨 상태로 옮기고, 화면은 `subscribe()`로 구독해 값을 받아간다.
 *
 * 계산 로직(속도 게이트·상승고도 EMA)은 예전 `live-run.tsx`의 `armTracking()` 콜백과
 * **동일하다** — 화면이 꺼져 있든 켜져 있든 같은 러닝이 같은 거리로 계산돼야 하므로 로직을
 * 하나로 합쳤다(중복 유지하면 언젠가 둘이 갈린다).
 *
 * ⚠️ **`ACCESS_BACKGROUND_LOCATION`을 쓰지 않는다.** Android는 Foreground Service를 통해서만
 * 위치에 접근하는 앱에는 그 권한을 요구하지 않는다(공식 문서 — 포그라운드 서비스는 사용자가
 * 인지하는 상태라 "진짜 백그라운드"로 취급하지 않음). `armTracking()`이 넘기는
 * `foregroundService` 옵션이 그 알림을 띄우는 자리이고, 그 알림이 떠 있는 동안만 화면 OFF에서도
 * 위치가 들어온다. 앱을 완전히 스와이프해서 끄거나 OS가 프로세스를 회수하면(제조사 배터리
 * 최적화) 이 메커니즘 자체가 죽는다 — 코드로 막을 수 없는 OS 한계(2026-08-15 S5 조사).
 */
import * as Location from "expo-location";
import * as TaskManager from "expo-task-manager";

import { haversine, type LatLng } from "./run";

export const LOCATION_TASK_NAME = "modu-marathon-live-run";

// live-run.tsx의 상수와 동일 — 하나가 바뀌면 다른 쪽도 맞춰야 같은 러닝이 같은 거리로 나온다.
const MAX_SPEED_MS = 9;
const ALT_ACC_MAX_M = 8;
const ALT_EMA_ALPHA = 0.12;
const ALT_REVERSAL_M = 4;

type AltState = { ema: number; valley: number; peak: number; rising: boolean };

type TrackState = {
  running: boolean;
  distanceM: number;
  path: LatLng[];
  last: LatLng | null;
  lastAt: number;
  alt: AltState | null;
  gainM: number;
};

function freshState(): TrackState {
  return { running: false, distanceM: 0, path: [], last: null, lastAt: 0, alt: null, gainM: 0 };
}

let state: TrackState = freshState();
const listeners = new Set<() => void>();
function notify() {
  listeners.forEach((l) => l());
}

/** 화면(live-run.tsx)이 값이 바뀔 때마다 콜백을 받는다. 반환값으로 구독 해제. */
export function subscribe(cb: () => void): () => void {
  listeners.add(cb);
  return () => listeners.delete(cb);
}

export function getSnapshot(): TrackState {
  return state;
}

/** 새 러닝을 시작하기 전 상태를 비운다. `running=true`부터 들어오는 위치를 채택한다. */
export function resetTracking(): void {
  state = freshState();
  state.running = true;
}

export function pauseTracking(): void {
  // 아직 확정 안 된 오르막(봉우리에서 멈춘 경우)까지 합쳐 잃지 않는다 — settleGain과 동일 이유.
  const a = state.alt;
  const gainM = a?.rising ? state.gainM + Math.max(0, a.peak - a.valley) : state.gainM;
  state = { ...state, running: false, last: null, lastAt: 0, alt: null, gainM };
}

export function resumeTracking(): void {
  state = { ...state, running: true };
}

export function stopTracking(): void {
  state = { ...state, running: false };
}

/** 일시정지 중 봉우리에서 멈췄을 때의 미확정 상승분까지 합친 최종값. */
export function settleGain(): number {
  const a = state.alt;
  if (a?.rising) return state.gainM + Math.max(0, a.peak - a.valley);
  return state.gainM;
}

/** 위치 하나를 채택 여부 판정 후 반영 — foreground 구독과 TaskManager 콜백이 공유하는 단일 진입점. */
function ingestOne(coords: Location.LocationObjectCoords, timestamp: number): void {
  if (!state.running) return;
  const cur: LatLng = { lat: coords.latitude, lng: coords.longitude };
  const acc = coords.accuracy ?? 999;
  const t = timestamp || Date.now();

  let { distanceM, path, last, lastAt, alt, gainM } = state;

  if (last && lastAt && acc <= 30) {
    const d = haversine(last, cur);
    const dt = (t - lastAt) / 1000;
    if (dt > 0 && d >= 1.5 && d / dt <= MAX_SPEED_MS) {
      distanceM += d;
      path = [...path, cur];
    }
  }
  if (acc <= 30) {
    if (!last) path = path.length ? path : [cur];
    last = cur;
    lastAt = t;
  }

  const rawAlt = coords.altitude;
  const altAcc = coords.altitudeAccuracy ?? Infinity;
  if (rawAlt != null && altAcc <= ALT_ACC_MAX_M) {
    if (!alt) {
      alt = { ema: rawAlt, valley: rawAlt, peak: rawAlt, rising: true };
    } else {
      alt = { ...alt };
      alt.ema += ALT_EMA_ALPHA * (rawAlt - alt.ema);
      if (alt.rising) {
        if (alt.ema > alt.peak) alt.peak = alt.ema;
        else if (alt.ema < alt.peak - ALT_REVERSAL_M) {
          gainM += alt.peak - alt.valley;
          alt.rising = false;
          alt.valley = alt.ema;
        }
      } else {
        if (alt.ema < alt.valley) alt.valley = alt.ema;
        else if (alt.ema > alt.valley + ALT_REVERSAL_M) {
          alt.rising = true;
          alt.peak = alt.ema;
        }
      }
    }
  }

  state = { ...state, distanceM, path, last, lastAt, alt, gainM };
  notify();
}

/** 화면이 살아있는 동안 쓰는 foreground 구독 — TaskManager와 같은 `ingestOne`을 호출해
 *  화면 켜짐/꺼짐 사이에 계산이 갈리지 않는다. */
export async function startForegroundWatch(): Promise<Location.LocationSubscription | null> {
  try {
    return await Location.watchPositionAsync(
      { accuracy: Location.Accuracy.BestForNavigation, timeInterval: 1000, distanceInterval: 4 },
      (loc) => ingestOne(loc.coords, loc.timestamp || Date.now())
    );
  } catch {
    return null;
  }
}

// ⚠️ **모듈 스코프에서 정의** — React 컴포넌트 안에 두면 화면이 언마운트된 뒤(화면 OFF 등)
// 네이티브가 이 콜백을 못 찾는다. 화면(live-run.tsx)이 열려 있는지와 무관하게 항상 존재해야 한다.
TaskManager.defineTask(LOCATION_TASK_NAME, async ({ data, error }) => {
  if (error) return; // 배터리 최적화로 OS가 죽였을 때 등 — 조용히 무시(재시도는 사용자가 재시작)
  if (!data) return;
  const { locations } = data as { locations: Location.LocationObject[] };
  for (const loc of locations) ingestOne(loc.coords, loc.timestamp || Date.now());
});

/**
 * 백그라운드 위치 태스크 시작. Foreground Service 알림이 뜨는 동안만 화면 OFF에서도 위치가 들어온다
 * (`ACCESS_BACKGROUND_LOCATION` 없이 — 위 모듈 설명 참조).
 *
 * ⚠️ **2026-08-15 S5 실기기 확인 — 현재 위치 업데이트가 들어오는 순간 앱이 크래시한다.**
 * `startLocationUpdatesAsync` 자체는 성공하지만(이 함수는 true를 반환), 첫 위치가 도착하면
 * `expo-task-manager`의 `TaskManagerUtils.java`(`.setPersisted(true)`가 하드코딩)가
 * `RECEIVE_BOOT_COMPLETED` 권한을 요구하는 JobScheduler job을 등록하려다 죽는다 — 그 권한은
 * `app.json`의 `android.blockedPermissions`가 명시적으로 차단해둔 상태다. 코드 레벨로는 못 고치는
 * 라이브러리-정책 충돌이라 오너 판단 대기 중(`CLAUDE.md` "S5" 항목 참조). 이 함수 자체는 정상 동작.
 */
export async function startBackgroundTask(): Promise<boolean> {
  try {
    const already = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (already) await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
    await Location.startLocationUpdatesAsync(LOCATION_TASK_NAME, {
      accuracy: Location.Accuracy.BestForNavigation,
      timeInterval: 1000,
      distanceInterval: 4,
      foregroundService: {
        notificationTitle: "러닝 기록 중",
        notificationBody: "화면을 꺼도 거리·경로가 계속 기록돼요",
        notificationColor: "#2f6e4a", // Brand.brand — 이 파일은 네이티브 설정이라 brand.ts를 import 못 해 값만 복제
      },
      // pausesUpdatesAutomatically는 iOS 전용(정지 시 OS가 알아서 멈춤) — Android는 우리 pause()가 담당.
    });
    return true;
  } catch {
    return false; // 기기가 백그라운드 위치를 지원 안 하거나 권한 문제 — 화면 켜둔 채로도 러닝은 계속된다(foreground 구독이 별도로 돎)
  }
}

export async function stopBackgroundTask(): Promise<void> {
  try {
    const started = await Location.hasStartedLocationUpdatesAsync(LOCATION_TASK_NAME);
    if (started) await Location.stopLocationUpdatesAsync(LOCATION_TASK_NAME);
  } catch {
    // 이미 안 돌고 있으면 무시 — 종료 경로에서 예외로 저장을 막으면 안 된다
  }
}
