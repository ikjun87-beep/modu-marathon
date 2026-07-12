/**
 * 러닝 집계 — 홈 큐레이션·랭킹·마이 통계가 공유하는 순수 계산 헬퍼.
 * 데이터 소스는 runs 컬렉션(Row[]). 모든 시각은 startedAt 우선, 없으면 createdAt.
 */
import type { Row } from "./crew";
import { paceLabel, toMs } from "./run";

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

/** 이번 주 거리 합계(km). name 주면 그 사람만. */
export function weekKm(rows: Row[], name?: string, now: number = Date.now()): number {
  const from = startOfWeek(now);
  return rows
    .filter((r) => inRange(r, from) && (!name || r.name === name))
    .reduce((a, r) => a + km(r), 0);
}

/** 이번 주 러닝 횟수. name 주면 그 사람만. */
export function weekRuns(rows: Row[], name?: string, now: number = Date.now()): number {
  const from = startOfWeek(now);
  return rows.filter((r) => inRange(r, from) && (!name || r.name === name)).length;
}

/** 이번 달 거리 합계(km). name 주면 그 사람만. */
export function monthKm(rows: Row[], name?: string, now: number = Date.now()): number {
  const from = startOfMonth(now);
  return rows
    .filter((r) => inRange(r, from) && (!name || r.name === name))
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
  const mine = rows.filter((r) => !name || r.name === name);
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
  for (const r of rows) {
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

export type Badge = {
  id: string;
  icon: string; // Icon 컴포넌트 name
  label: string;
  desc: string;
};

/** 정의된 배지 카탈로그(획득 여부는 earnedBadgeIds로). */
export const BADGES: Badge[] = [
  { id: "first_run", icon: "run", label: "첫 러닝", desc: "첫 기록을 남겼어요" },
  { id: "five_k", icon: "flag", label: "5K 클럽", desc: "한 번에 5km 이상" },
  { id: "ten_k", icon: "award", label: "10K 러너", desc: "한 번에 10km 이상" },
  { id: "week_3", icon: "calendar", label: "꾸준왕", desc: "한 주에 3회 이상" },
  { id: "century", icon: "shield", label: "월 100K", desc: "이번 달 누적 100km" },
];

/** 한 사람이 획득한 배지 id 집합. */
export function earnedBadgeIds(rows: Row[], name?: string, now: number = Date.now()): Set<string> {
  const mine = rows.filter((r) => !name || r.name === name);
  const ids = new Set<string>();
  if (mine.length >= 1) ids.add("first_run");
  if (mine.some((r) => km(r) >= 5)) ids.add("five_k");
  if (mine.some((r) => km(r) >= 10)) ids.add("ten_k");
  if (weekRuns(rows, name, now) >= 3) ids.add("week_3");
  const monthFrom = startOfMonth(now);
  const monthKm = mine.filter((r) => runMs(r) >= monthFrom).reduce((a, r) => a + km(r), 0);
  if (monthKm >= 100) ids.add("century");
  return ids;
}
