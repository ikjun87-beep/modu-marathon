/**
 * 홈 타임라인 — 러닝·참석·방명록을 **하나의 시간순 흐름**으로 합친다.
 *
 * ## 왜 만들었나 (2026-07-28 R12)
 * 홈이 카드 스택이라 ①다른 탭과 똑같은 템플릿으로 보이고 ②크루가 핵심인데 "지금 살아있음"이
 * 안 보였다. 독립 채점 R11은 홈 하단이 화면 절반 비는 것도 지적했는데, 원인은 여백이 아니라
 * **보여줄 게 4개뿐**이라서였다. 타임라인은 데이터가 쌓이는 만큼 길어지므로 그 문제가 사라진다.
 *
 * 순수 함수로 둔 이유: 화면에서 정렬·병합을 하면 테스트가 안 되고, 나중에 크루 탭이나 위젯에서
 * 같은 흐름을 재사용할 수 없다.
 */
import { toMs } from "./run";

import type { Row } from "./crew";
import type { EventDef } from "./events";

export type FeedKind = "run" | "post" | "attend";

export type FeedItem = {
  id: string;
  kind: FeedKind;
  /** 정렬 기준 시각(ms). 0이면 목록 끝으로 밀린다. */
  at: number;
  /** 행위자 이름 — 아바타와 문장의 주어. */
  name: string;
  /** 본문 한 줄. 화면에서 그대로 렌더한다. */
  text: string;
  /** 러닝만: 거리(km). 우측 보조 숫자로 쓴다. */
  km?: number;
  /** 탭했을 때 갈 곳. */
  href?: string;
};

/** 며칠 치를 볼 것인가 — 너무 길면 홈이 아니라 아카이브가 된다. */
const WINDOW_MS = 7 * 24 * 60 * 60 * 1000;

/** "5.2km 뛰었어요" — 걷기까지 섞이면 문장이 거짓이 되니 kind로 갈라 쓴다. */
function runText(r: Row): string {
  const km = Number(r.distanceKm) || 0;
  const walk = r.kind === "walk";
  return `${km.toFixed(2)}km ${walk ? "걸었어요" : "뛰었어요"}`;
}

/**
 * 세 컬렉션 + 모임 정의를 합쳐 최근순 타임라인으로. 최근 1주만, 최대 `limit`개.
 *
 * @param events 참석 항목의 "무슨 모임인지"를 채우는 데만 쓴다. 모임 생성 자체는
 *   타임라인에 넣지 않는다 — 다가오는 모임은 성격이 "지난 일"이 아니라 "예정"이라
 *   흐름에 섞으면 시간 축이 뒤엉킨다.
 */
export function buildFeed(
  runs: Row[],
  posts: Row[],
  attend: Row[],
  events: EventDef[],
  limit = 20
): FeedItem[] {
  const since = Date.now() - WINDOW_MS;
  const titleOf = new Map(events.map((e) => [e.id, e.title]));
  const out: FeedItem[] = [];

  for (const r of runs) {
    const at = toMs(r.startedAt ?? r.createdAt);
    if (!at || at < since) continue;
    out.push({
      id: `run_${r.id}`,
      kind: "run",
      at,
      name: String(r.name ?? ""),
      text: runText(r),
      km: Number(r.distanceKm) || 0,
      href: `/explore/run/${r.id}`,
    });
  }

  for (const p of posts) {
    const at = toMs(p.createdAt);
    if (!at || at < since) continue;
    const msg = String(p.msg ?? "").trim();
    if (!msg) continue;
    out.push({
      id: `post_${p.id}`,
      kind: "post",
      at,
      name: String(p.name ?? ""),
      text: `「${msg}」`,
      href: "/crew",
    });
  }

  for (const a of attend) {
    const at = toMs(a.createdAt);
    if (!at || at < since) continue;
    const title = titleOf.get(String(a.eventId));
    // 모임이 지워졌거나 아직 안 붙은 참석은 문장이 성립하지 않으니 건너뛴다.
    if (!title) continue;
    out.push({
      id: `att_${a.id}`,
      kind: "attend",
      at,
      name: String(a.name ?? ""),
      text: `「${title}」에 참석해요`,
      href: "/crew",
    });
  }

  return out.sort((x, y) => y.at - x.at).slice(0, limit);
}

/** 타임라인 왼쪽에 붙는 시각 라벨. 오늘은 시:분, 어제는 "어제", 그 이전은 월/일. */
export function feedTime(at: number): string {
  const d = new Date(at);
  const now = new Date();
  const sameDay = (a: Date, b: Date) =>
    a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();

  if (sameDay(d, now)) {
    return `${d.getHours()}:${String(d.getMinutes()).padStart(2, "0")}`;
  }
  const y = new Date(now);
  y.setDate(now.getDate() - 1);
  if (sameDay(d, y)) return "어제";
  return `${d.getMonth() + 1}/${d.getDate()}`;
}

/** 오늘 크루에서 몇 명이 뛰었나 — 타임라인 머리의 "지금 살아있음" 신호. */
export function todayRunnerCount(runs: Row[]): number {
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const t0 = start.getTime();
  const names = new Set<string>();
  for (const r of runs) {
    const at = toMs(r.startedAt ?? r.createdAt);
    if (at >= t0) names.add(String(r.name ?? ""));
  }
  names.delete("");
  return names.size;
}
