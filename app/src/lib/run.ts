/**
 * 통합 Run — 수동 입력·GPS 실시간·워치(Health Connect/Garmin)가 공유하는 러닝 모델과 헬퍼.
 * 스키마 단일 소스는 firebase.ts COLLECTIONS.runs. 워치/외부 소스는 source+sourceId로 멱등 저장.
 */
import { add, put, remove, type Row } from "./crew";
import { COLLECTIONS } from "./firebase";

export type RunSource = "manual" | "gps" | "healthconnect" | "garmin";

/** 기록 종류. 걷기도 받되(입문자·"걷기+뛰기 병행" 모임) 러닝과 섞으면 페이스·랭킹이 왜곡되므로 구분한다.
 *  **없으면 'run'** — 이 필드가 생기기 전 기록(웹·기존 문서)은 전부 러닝이었다(뒤로호환). */
export type RunKind = "run" | "walk";

/** Health Connect에 기록을 쓰는 앱들의 패키지명 → 사람이 읽는 이름.
 *
 *  ⚠️ **모르는 패키지를 추측해서 이름 붙이지 않는다.** 여기 없는 앱은 `null`을 돌려주고,
 *  화면은 "연결된 앱"이라는 중립 라벨을 쓴다 — 지금 고치는 문제가 바로 **모르면서 단정한 라벨**
 *  ("전부 갤럭시워치")이었으니, 같은 실수를 새 이름으로 반복하면 안 된다.
 *  실기기에서 새 패키지를 확인할 때마다 여기에 한 줄씩 늘린다. */
const SOURCE_APPS: Record<string, string> = {
  "com.sec.android.app.shealth": "삼성 헬스",
  "com.google.android.apps.fitness": "Google 피트니스",
  "com.strava": "스트라바",
  "com.nike.plusone": "나이키 런 클럽",
  "com.garmin.android.apps.connectmobile": "가민 커넥트",
};

/** 패키지명 → 표시용 앱 이름. 모르는 패키지면 null(호출부가 중립 라벨로 폴백). */
export function sourceAppName(pkg?: string): string | null {
  if (!pkg) return null;
  return SOURCE_APPS[pkg] ?? null;
}

/**
 * 기록 출처 라벨 — **화면 세 곳(목록·상세·검색)이 같은 문자열을 쓰게 하는 단일 소스.**
 *
 * 우선순위: ①아는 앱 이름 → ②출처는 있는데 모르는 앱이면 "연결된 앱" → ③출처 자체가 없으면 옛 폴백.
 * ③은 **sourceApp이 생기기 전(2026-08-14 이전) 문서 전용**이다. 그 시절 기록은 실제로 갤럭시워치로
 * 들어왔을 가능성이 높지만 확인할 방법이 없어 값을 지어내지 않고 표시만 유지한다(백필 안 함).
 */
export function runSourceLabel(source?: string, sourceApp?: string): string {
  if (source === "gps") return "GPS 러닝";
  if (source === "garmin") return "가민";
  if (source === "healthconnect") {
    return sourceAppName(sourceApp) ?? (sourceApp ? "연결된 앱" : "갤럭시워치");
  }
  return "직접 입력";
}

export type Run = {
  source: RunSource;
  sourceId?: string; // 멱등 upsert 키(워치/외부 소스 레코드 id)
  /** 이 기록을 실제로 만든 앱의 패키지명(Health Connect `dataOrigin`). 예: `com.sec.android.app.shealth`.
   *
   *  ⚠️ **없으면 화면이 "갤럭시워치"로 폴백한다** — 그 폴백이 거짓말이 될 수 있어서 이 필드를 만들었다.
   *  Health Connect로 들어오는 기록은 삼성헬스뿐 아니라 스트라바·나이키런 등 무엇이든 될 수 있는데,
   *  지금까지 전부 "갤럭시워치"로 표시돼 왔다. **새 기록은 진짜 출처를 적는다.**
   *  기존 문서는 백필하지 않는다(값을 모르는 것을 지어낼 수 없다) → 폴백을 그대로 쓴다. */
  sourceApp?: string;
  kind?: RunKind; // 생략 = 'run'
  name: string;
  distanceKm: number;
  durationSec: number;
  paceSecPerKm?: number;
  startedAt?: number; // epoch ms
  avgHr?: number;
  cadence?: number;
  /** 누적 상승고도(m) — 오르막에서 올라간 높이의 합(내리막은 안 뺀다. 러닝계 표준 "gain").
   *  ⚠️ GPS 고도는 크게 흔들려서 **그냥 더하면 가만히 서 있어도 수백 m가 쌓인다.**
   *  산출은 live-run.tsx의 앵커 히스테리시스 참조(3m 넘게 오른 것만 인정). */
  elevationGainM?: number;
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

/** Firestore Timestamp | epoch ms | 날짜 문자열 → epoch ms (실패 시 0). */
export function toMs(v: any): number {
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

/** ⚠️ 거리 소수점 표기 규칙(화면마다 자릿수가 달라 데이터 신뢰도가 떨어졌던 것 — 디자인 감사 지적)
 *  - **집계·요약값 = 1자리** (`toFixed(1)`): 오늘·이번주·이달·누적·랭킹 거리
 *  - **개별 러닝 기록 = 2자리** (`toFixed(2)`): 러닝 상세 히어로·목록 항목·실시간 트래킹
 *  집계는 "대략 얼마나", 개별 기록은 "정확히 얼마" 라는 의미 차이를 자릿수로 드러낸다. */

/** 오늘 뛴 거리 합계(km). name 주면 그 사람만. startedAt 우선, 없으면 createdAt 기준. */
export function todayKm(rows: Row[], name?: string): number {
  return runsOnly(rows)
    .filter((r) => isToday(r.startedAt ?? r.createdAt) && (!name || r.name === name))
    .reduce((a, r) => a + (Number(r.distanceKm) || 0), 0);
}

/** 이 기록이 걷기인가. `kind` 없는 과거 문서는 러닝으로 본다(뒤로호환). */
export function isWalk(r: Row): boolean {
  return r.kind === "walk";
}

/** 러닝만 — 페이스·랭킹·배지처럼 **걷기가 섞이면 왜곡되는** 집계에 쓴다.
 *  (걷기 5km를 러닝과 합치면 크루 페이스가 무너지고 랭킹이 뒤집힌다.) */
export function runsOnly(rows: Row[]): Row[] {
  return rows.filter((r) => !isWalk(r));
}

/** 걷기만 — "오늘 걸은 거리"처럼 따로 보여줄 때. */
export function walksOnly(rows: Row[]): Row[] {
  return rows.filter(isWalk);
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
  if (run.kind && run.kind !== "run") item.kind = run.kind; // 'run'은 기본값이라 안 적는다(뒤로호환·문서 경량)
  if (run.startedAt) item.startedAt = run.startedAt;
  if (run.avgHr) item.avgHr = Math.round(run.avgHr);
  if (run.cadence) item.cadence = Math.round(run.cadence);
  if (run.elevationGainM) item.elevationGainM = Math.round(run.elevationGainM);
  if (run.sourceApp) item.sourceApp = run.sourceApp; // 없으면 아예 안 적는다(기존 문서와 같은 모양 유지)

  if (run.sourceId) {
    item.sourceId = run.sourceId;
    const id = `${run.source}_${run.sourceId}`;
    try {
      await put(COLLECTIONS.runs, id, item, run.startedAt);
    } catch (e) {
      // 멱등 재저장이 rules에 막히는 실경로가 있다: 같은 세션을 다시 불러올 때
      //  ① 워치 거리가 달라짐(출처 레코드가 뒤늦게 도착) ② 걷기→달리기 종목 정정
      //  ③ GPS 저장이 서버엔 됐는데 클라만 타임아웃 → 더 긴 거리로 재시도.
      // rules는 distanceKm·kind 불변을 강제(남의 기록 조작 차단)라 위 경우 update가 영구 거부된다.
      // → **내 것을 지우고 다시 만든다.** 최신 값이 정답이다.
      // ⚠️ S4(소유권 delete) 이후 이 delete도 무조건 통과하진 않는다 — uid 있는 문서는 소유자만
      //    지울 수 있다. 정상 경로(같은 게스트 세션이 자기 워치 기록을 재동기화)는 uid가 그대로라
      //    항상 통과한다. uid가 바뀌는 유일한 경우는 앱 재설치로 새 익명 계정이 발급될 때뿐이고,
      //    그때는 delete가 거부돼 이 함수가 throw한다 — 호출부(healthconnect.ts)가 세션 단위로
      //    감싸 조용히 실패 처리하므로 동기화 전체가 죽지는 않는다(2026-08-14 S4 조사).
      // (거부가 아닌 네트워크 오류면 delete도 실패할 테니 그대로 던져 상위에서 재시도된다.)
      if (isPermissionDenied(e)) {
        await remove(COLLECTIONS.runs, id);
        await put(COLLECTIONS.runs, id, item, run.startedAt);
      } else {
        throw e;
      }
    }
  } else {
    await add(COLLECTIONS.runs, item);
  }
}

function isPermissionDenied(e: unknown): boolean {
  const code = (e as { code?: string })?.code ?? "";
  const msg = (e as { message?: string })?.message ?? "";
  return code === "permission-denied" || /permission/i.test(msg);
}
