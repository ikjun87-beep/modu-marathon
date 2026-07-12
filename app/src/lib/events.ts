/**
 * 크루 모임 일정 — 웹(web/index.html)의 EVENTS와 동일 소스. 같은 attendance 컬렉션·eventId 공유.
 * 크루 화면(참석체크)과 홈 큐레이션(다가오는 모임)이 이 단일 소스를 함께 쓴다.
 */
export type EventDef = { id: string; m: string; d: string; title: string; desc: string };

export const EVENTS: EventDef[] = [
  {
    id: "ev-0705",
    m: "7월",
    d: "05",
    title: "한강 야간 이지런",
    desc: "여의나루역 2번 출구 → 물빛광장 시계탑 · 6:50 모여 7:00 출발 · 5km · 대화 가능한 7′00~7′30/km · 안전: 밝은 옷·점멸등",
  },
  {
    id: "ev-0719",
    m: "7월",
    d: "19",
    title: "아침 이지런",
    desc: "올림픽공원 평화의문 앞 · 오전 8시 · 3km · 걷기+뛰기 병행, 러닝 처음도 환영",
  },
  {
    id: "ev-0802",
    m: "8월",
    d: "02",
    title: "모두의 10K 챌린지",
    desc: "학여울역 1번 출구(탄천) · 오전 9시 · 10km · 페이스 조 6′00·6′30·7′00 · 완주 메달",
  },
];

/** id(ev-MMDD)에서 올해 기준 날짜(ms) 파싱. 파싱 실패 시 0. */
function eventMs(ev: EventDef): number {
  const mmdd = ev.id.replace("ev-", "");
  const mm = Number(mmdd.slice(0, 2));
  const dd = Number(mmdd.slice(2, 4));
  if (!mm || !dd) return 0;
  const now = new Date();
  return new Date(now.getFullYear(), mm - 1, dd).getTime();
}

/**
 * 오늘 이후(당일 포함) 가장 가까운 모임. 없으면 마지막 모임(지난 시즌이어도 안내용).
 * now 인자는 테스트/결정성용 — 기본은 실행 시각.
 */
export function nextEvent(now: number = Date.now()): EventDef {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const todayMs = start.getTime();
  const upcoming = EVENTS.map((e) => ({ e, t: eventMs(e) }))
    .filter((x) => x.t >= todayMs)
    .sort((a, b) => a.t - b.t);
  return upcoming.length ? upcoming[0].e : EVENTS[EVENTS.length - 1];
}
