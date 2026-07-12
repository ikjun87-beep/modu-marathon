/**
 * 통합 검색 — 러닝 기록·크루 방명록·모임을 한 질의로 훑는다(P7-6).
 * 순수 함수: 구독 데이터(runs·guestbook)와 정적 EVENTS를 받아 카테고리별 결과 반환.
 */
import type { Row } from "./crew";
import { EVENTS, type EventDef } from "./events";

export type SearchResults = {
  runs: Row[];
  posts: Row[];
  events: EventDef[];
  total: number;
};

const LIMIT = 8; // 카테고리별 최대 노출

function norm(v: any): string {
  return String(v ?? "").toLowerCase();
}

function sourceLabel(src?: string): string {
  if (src === "gps") return "gps 러닝";
  if (src === "healthconnect") return "갤럭시워치 워치";
  if (src === "garmin") return "가민";
  return "직접 입력 수동";
}

/** 러닝: 이름·기록방식·거리 텍스트로 매칭. */
function matchRun(r: Row, q: string): boolean {
  const km = Number(r.distanceKm) || 0;
  const hay = `${norm(r.name)} ${sourceLabel(r.source)} ${km.toFixed(2)}km`;
  return hay.includes(q);
}

/** 방명록: 이름·내용으로 매칭. */
function matchPost(p: Row, q: string): boolean {
  return `${norm(p.name)} ${norm(p.msg)}`.includes(q);
}

/** 모임: 제목·설명·날짜로 매칭. */
function matchEvent(e: EventDef, q: string): boolean {
  return `${norm(e.title)} ${norm(e.desc)} ${norm(e.m)} ${norm(e.d)}`.includes(q);
}

export function searchAll(query: string, runs: Row[], posts: Row[]): SearchResults {
  const q = query.trim().toLowerCase();
  if (!q) return { runs: [], posts: [], events: [], total: 0 };
  const r = runs.filter((x) => matchRun(x, q)).slice(0, LIMIT);
  const p = posts.filter((x) => matchPost(x, q)).slice(0, LIMIT);
  const e = EVENTS.filter((x) => matchEvent(x, q)).slice(0, LIMIT);
  return { runs: r, posts: p, events: e, total: r.length + p.length + e.length };
}
