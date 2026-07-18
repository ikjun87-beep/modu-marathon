/**
 * 러닝 집계 — 홈 큐레이션·랭킹·마이 통계가 공유하는 순수 계산 헬퍼.
 * 데이터 소스는 runs 컬렉션(Row[]). 모든 시각은 startedAt 우선, 없으면 createdAt.
 *
 * ⚠️ **여기는 전부 "러닝" 기준이다.** runs 컬렉션엔 걷기(kind:'walk')도 들어오지만
 *    (워치 걷기 — 크루가 "걷기+뛰기 병행"이라 받기로 함), 걷기를 러닝과 합치면
 *    크루 평균 페이스가 무너지고 주간 랭킹이 뒤집힌다. 그래서 각 집계 입구에서 runsOnly로 거른다.
 *    걷기를 따로 보여줘야 하면 run.ts의 walksOnly를 쓸 것.
 */
import type { Row } from "./crew";
import { paceLabel, runsOnly, toMs } from "./run";

function runMs(r: Row): number {
  return toMs(r.startedAt ?? r.createdAt);
}
function km(r: Row): number {
  return Number(r.distanceKm) || 0;
}
function sec(r: Row): number {
  return Number(r.durationSec) || (Number(r.durationMin) || 0) * 60;
}

/** 이번 주 시작(월요일 00:00) ms. */
export function startOfWeek(now: number = Date.now()): number {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  const day = (d.getDay() + 6) % 7; // 월=0 … 일=6
  d.setDate(d.getDate() - day);
  return d.getTime();
}
/** 이번 달 시작(1일 00:00) ms. */
export function startOfMonth(now: number = Date.now()): number {
  const d = new Date(now);
  return new Date(d.getFullYear(), d.getMonth(), 1).getTime();
}

function inRange(r: Row, from: number): boolean {
  const t = runMs(r);
  return t >= from;
}

/** 데모 행 여부(id가 demo_ 접두). */
function isDemo(r: Row): boolean {
  return String(r.id ?? "").startsWith("demo_");
}
/**
 * 이 행이 name의 것인지 판정.
 * - name 없음(전체 크루 기준·랭킹): 모두 포함(데모 포함 → populated 화면 유지).
 * - name 있음(특정 개인 통계·배지): 그 이름 + **데모 제외**.
 *   데모 러너와 이름이 겹쳐도(예: 실제 회원이 '박준서') 데모 러닝이 내 통계·배지로 새지 않게 한다.
 */
function mineOf(r: Row, name?: string): boolean {
  return !name ? true : r.name === name && !isDemo(r);
}

/** 이번 주 거리 합계(km). name 주면 그 사람만. */
export function weekKm(rows: Row[], name?: string, now: number = Date.now()): number {
  const from = startOfWeek(now);
  return runsOnly(rows)
    .filter((r) => inRange(r, from) && mineOf(r, name))
    .reduce((a, r) => a + km(r), 0);
}

/** 이번 주 러닝 횟수. name 주면 그 사람만. */
export function weekRuns(rows: Row[], name?: string, now: number = Date.now()): number {
  const from = startOfWeek(now);
  return runsOnly(rows).filter((r) => inRange(r, from) && mineOf(r, name)).length;
}

/** 이번 달 거리 합계(km). name 주면 그 사람만. */
export function monthKm(rows: Row[], name?: string, now: number = Date.now()): number {
  const from = startOfMonth(now);
  return runsOnly(rows)
    .filter((r) => inRange(r, from) && mineOf(r, name))
    .reduce((a, r) => a + km(r), 0);
}

export type PersonalStats = {
  totalKm: number;
  totalRuns: number;
  weekKm: number;
  avgPace: string; // "5'30"/km" 또는 "-"
  longestKm: number;
};

/** 한 사람의 누적/이번주 통계. name 비면 전체 기준. */
export function personalStats(rows: Row[], name?: string, now: number = Date.now()): PersonalStats {
  const mine = runsOnly(rows).filter((r) => mineOf(r, name));
  const totalKm = mine.reduce((a, r) => a + km(r), 0);
  const totalSec = mine.reduce((a, r) => a + sec(r), 0);
  const longestKm = mine.reduce((a, r) => Math.max(a, km(r)), 0);
  return {
    totalKm,
    totalRuns: mine.length,
    weekKm: weekKm(rows, name, now),
    avgPace: totalKm > 0 ? paceLabel(totalKm, totalSec) : "-",
    longestKm,
  };
}

export type RankRow = { name: string; km: number; runs: number };

/** 이번 주 크루 거리 랭킹 — 이름별 합산, 내림차순. */
export function weeklyRanking(rows: Row[], now: number = Date.now()): RankRow[] {
  const from = startOfWeek(now);
  const byName = new Map<string, RankRow>();
  for (const r of runsOnly(rows)) {
    if (!inRange(r, from)) continue;
    const nm = String(r.name || "").trim();
    if (!nm) continue;
    const cur = byName.get(nm) ?? { name: nm, km: 0, runs: 0 };
    cur.km += km(r);
    cur.runs += 1;
    byName.set(nm, cur);
  }
  return [...byName.values()].sort((a, b) => b.km - a.km);
}

/** 배지가 무엇을 재는가. 진행도(얼마나 왔나) 계산의 근거. */
export type BadgeMetric =
  | "runs" // 총 러닝 횟수
  | "bestKm" // 한 번에 뛴 최고 거리
  | "weekRuns" // 이번 주 러닝 횟수
  | "monthKm"; // 이번 달 누적 거리

export type Badge = {
  id: string;
  icon: string; // Icon 컴포넌트 name
  label: string;
  desc: string;
  metric: BadgeMetric;
  goal: number;
};

/** 정의된 배지 카탈로그. 획득 여부·진행도 모두 여기 goal 기준으로 계산된다(badgeProgress). */
export const BADGES: Badge[] = [
  { id: "first_run", icon: "run", label: "첫 러닝", desc: "첫 기록을 남겼어요", metric: "runs", goal: 1 },
  { id: "five_k", icon: "flag", label: "5K 클럽", desc: "한 번에 5km 이상", metric: "bestKm", goal: 5 },
  { id: "ten_k", icon: "award", label: "10K 러너", desc: "한 번에 10km 이상", metric: "bestKm", goal: 10 },
  { id: "week_3", icon: "calendar", label: "꾸준왕", desc: "한 주에 3회 이상", metric: "weekRuns", goal: 3 },
  { id: "century", icon: "shield", label: "월 100K", desc: "이번 달 누적 100km", metric: "monthKm", goal: 100 },
];

export type BadgeProgress = {
  badge: Badge;
  earned: boolean;
  ratio: number; // 0..1 — 진행바 길이
  /** 못 딴 배지에 보여줄 한 마디("1.8km 남았어요"). 딴 배지는 badge.desc를 쓴다. */
  hint: string;
};

/**
 * 배지별 진행도.
 *
 * 왜 있나: 예전엔 획득/미획득 이분법이라 **새 사용자에게 회색 "미획득" 다섯 개**가 첫인상이었다.
 * ("너는 아직 아무것도 아니야") 얼마나 왔는지를 숫자로 주면 사람은 그걸 채우고 싶어한다.
 */
export function badgeProgress(
  rows: Row[],
  name?: string,
  now: number = Date.now()
): BadgeProgress[] {
  const mine = runsOnly(rows).filter((r) => mineOf(r, name));
  const monthFrom = startOfMonth(now);

  const cur: Record<BadgeMetric, number> = {
    runs: mine.length,
    bestKm: mine.reduce((mx, r) => Math.max(mx, km(r)), 0),
    weekRuns: weekRuns(rows, name, now),
    monthKm: mine.filter((r) => runMs(r) >= monthFrom).reduce((a, r) => a + km(r), 0),
  };

  return BADGES.map((badge) => {
    const c = cur[badge.metric];
    const earned = c >= badge.goal;
    const left = badge.goal - c;
    return {
      badge,
      earned,
      ratio: badge.goal > 0 ? Math.min(1, Math.max(0, c / badge.goal)) : 0,
      hint: earned ? badge.desc : hintFor(badge, left),
    };
  });
}

function hintFor(badge: Badge, left: number): string {
  if (badge.id === "first_run") return "첫 기록을 남겨보세요";
  // 거리형은 소수 한 자리(1.8km 남았어요), 횟수형은 정수(1회 더!)
  if (badge.metric === "bestKm" || badge.metric === "monthKm") {
    return `${left.toFixed(1)}km 남았어요`;
  }
  return `${Math.ceil(left)}회 더!`;
}

/** 한 사람이 획득한 배지 id 집합. (진행도는 badgeProgress) */
export function earnedBadgeIds(rows: Row[], name?: string, now: number = Date.now()): Set<string> {
  return new Set(
    badgeProgress(rows, name, now)
      .filter((p) => p.earned)
      .map((p) => p.badge.id)
  );
}

// ── 월간 리포트(골프 앱 "종합레벨+클럽별 분석"의 러닝판) ──────────────
// 폰 GPS라 볼스피드·백스핀 같은 센서값은 없다. 대신 우리가 실제로 가진 것으로 성장 서사를 만든다:
//   거리·러닝수·평균페이스·최장거리·꾸준함(뛴 날 수)·상승고도 — 전부 이번달 vs 지난달.
// runs만·걷기 제외·데모 제외(mineOf 재사용). name 없으면 크루 전체.

export type MonthMetric = {
  key: string;
  label: string;
  unit: string;
  cur: number;
  prev: number;
  /** true면 클수록 좋음(거리·수). false면 작을수록 좋음(페이스 초). */
  higherBetter: boolean;
  /** 표시 포맷터(페이스는 "5'30"", 거리는 "12.3") */
  fmt: (v: number) => string;
};

export type MonthReport = {
  monthLabel: string; // "7월"
  hasData: boolean; // 이번달 러닝이 하나라도 있나
  metrics: MonthMetric[];
  /** 주별 평균 페이스 추이(이번달, 데이터 있는 주만). null=그 주 러닝 없음 */
  paceTrend: { weekLabel: string; paceSec: number | null }[];
};

function monthRange(now: number, back: number): [number, number] {
  const d = new Date(now);
  const start = new Date(d.getFullYear(), d.getMonth() - back, 1).getTime();
  const end = new Date(d.getFullYear(), d.getMonth() - back + 1, 1).getTime();
  return [start, end];
}

function fmtKm(v: number): string {
  return v.toFixed(1);
}
function fmtInt(v: number): string {
  return String(Math.round(v));
}
function fmtPaceSec(v: number): string {
  if (!v || !isFinite(v)) return "-";
  const m = Math.floor(v / 60);
  const s = Math.round(v % 60);
  return `${m}'${String(s === 60 ? 0 : s).padStart(2, "0")}"`;
}

/** 한 달 구간의 집계값 묶음. */
function aggregate(rows: Row[], from: number, to: number) {
  const inRange = rows.filter((r) => {
    const t = runMs(r);
    return t >= from && t < to;
  });
  const totalKm = inRange.reduce((a, r) => a + km(r), 0);
  const totalSec = inRange.reduce((a, r) => a + sec(r), 0);
  const longest = inRange.reduce((mx, r) => Math.max(mx, km(r)), 0);
  const elevation = inRange.reduce((a, r) => a + (Number(r.elevationGainM) || 0), 0);
  const days = new Set(inRange.map((r) => new Date(runMs(r)).toDateString())).size;
  // 평균 페이스 = 전체시간/전체거리(가중). 거리 0이면 0.
  const avgPaceSec = totalKm > 0 ? totalSec / totalKm : 0;
  return { runs: inRange.length, totalKm, longest, elevation, days, avgPaceSec };
}

export function monthReport(rows: Row[], name?: string, now: number = Date.now()): MonthReport {
  const mine = runsOnly(rows).filter((r) => mineOf(r, name));
  const [curFrom, curTo] = monthRange(now, 0);
  const [prevFrom, prevTo] = monthRange(now, 1);
  const cur = aggregate(mine, curFrom, curTo);
  const prev = aggregate(mine, prevFrom, prevTo);

  const metrics: MonthMetric[] = [
    { key: "km", label: "총 거리", unit: "km", cur: cur.totalKm, prev: prev.totalKm, higherBetter: true, fmt: fmtKm },
    { key: "runs", label: "러닝 수", unit: "회", cur: cur.runs, prev: prev.runs, higherBetter: true, fmt: fmtInt },
    { key: "days", label: "뛴 날", unit: "일", cur: cur.days, prev: prev.days, higherBetter: true, fmt: fmtInt },
    { key: "pace", label: "평균 페이스", unit: "/km", cur: cur.avgPaceSec, prev: prev.avgPaceSec, higherBetter: false, fmt: fmtPaceSec },
    { key: "longest", label: "최장 거리", unit: "km", cur: cur.longest, prev: prev.longest, higherBetter: true, fmt: fmtKm },
    { key: "elev", label: "상승 고도", unit: "m", cur: cur.elevation, prev: prev.elevation, higherBetter: true, fmt: fmtInt },
  ];

  // 이번달 주별 평균 페이스(주 시작 기준으로 버킷)
  const weeks: { weekLabel: string; from: number; to: number }[] = [];
  let ws = startOfWeek(curFrom);
  // curFrom이 주 중간이면 그 주부터. 이번달 안에서 진행.
  for (let i = 0; i < 6; i++) {
    const from = ws + i * 7 * 86400000;
    const to = from + 7 * 86400000;
    if (from >= curTo) break;
    const d = new Date(Math.max(from, curFrom));
    weeks.push({ weekLabel: `${d.getMonth() + 1}/${d.getDate()}`, from, to });
  }
  const paceTrend = weeks.map((w) => {
    const seg = aggregate(mine, Math.max(w.from, curFrom), Math.min(w.to, curTo));
    return { weekLabel: w.weekLabel, paceSec: seg.totalKm > 0 ? seg.avgPaceSec : null };
  });

  return {
    monthLabel: `${new Date(now).getMonth() + 1}월`,
    hasData: cur.runs > 0,
    metrics,
    paceTrend,
  };
}
