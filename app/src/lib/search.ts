/**
 * 통합 검색 — 러닝 기록·크루 방명록·모임을 한 질의로 훑는다(P7-6).
 * 순수 함수: 구독 데이터(runs·guestbook·events)를 받아 카테고리별 결과 반환.
 */
import { runSourceLabel } from "./run";

import type { Row } from "./crew";
import type { EventDef } from "./events";

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

/** 검색용 출처 토큰 — **화면에 보이는 라벨**(`runSourceLabel`)을 그대로 넣는다.
 *
 *  사용자는 목록에서 읽은 단어로 검색한다. 화면은 "삼성 헬스"라고 쓰는데 검색만 "갤럭시워치"로
 *  걸리면 찾지 못한다. 여기에 라벨에 안 드러나는 동의어("수동")와 패키지명을 덧붙인다.
 *  ⚠️ 예전엔 healthconnect에 "워치"를 무조건 붙였는데, 이제 붙이지 않는다 — 스트라바 폰 기록이
 *  "워치"로 검색되면 그것도 거짓이다. 옛 문서는 라벨 자체가 "갤럭시워치"라 부분일치로 계속 걸린다. */
function sourceHay(r: Row): string {
  const extra = r.source === "gps" || r.source === "healthconnect" || r.source === "garmin" ? "" : " 수동";
  return `${norm(runSourceLabel(r.source, r.sourceApp))}${extra} ${norm(r.sourceApp)}`;
}

/** 러닝: 이름·기록방식·거리 텍스트로 매칭. */
function matchRun(r: Row, q: string): boolean {
  const km = Number(r.distanceKm) || 0;
  const hay = `${norm(r.name)} ${sourceHay(r)} ${km.toFixed(2)}km`;
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

export function searchAll(query: string, runs: Row[], posts: Row[], events: EventDef[] = []): SearchResults {
  const q = query.trim().toLowerCase();
  if (!q) return { runs: [], posts: [], events: [], total: 0 };
  const r = runs.filter((x) => matchRun(x, q)).slice(0, LIMIT);
  const p = posts.filter((x) => matchPost(x, q)).slice(0, LIMIT);
  const e = events.filter((x) => matchEvent(x, q)).slice(0, LIMIT);
  return { runs: r, posts: p, events: e, total: r.length + p.length + e.length };
}
