/**
 * 크루 모임 일정 — **Firestore `events` 컬렉션**(웹과 공유). 참석은 attendance(eventId).
 *
 * 왜 서버로 옮겼나: 예전엔 앱·웹 양쪽에 하드코딩이라 ①회장이 모임 하나 추가하려면 코드를 고치고
 * APK를 다시 구워야 했고 ②마지막 모임(8/2)이 지나면 홈에 낡은 일정이 영원히 떴다. 이제 앱에서
 * 직접 만들고, 지난 모임은 자동으로 정리된다. (커뮤니티의 첫 벽돌 — docs/COMMUNITY_PLAN.md)
 *
 * ⚠️ 날짜: 예전 id(ev-MMDD)엔 **연도가 없어** 내년 7/5도 올해로 오해했다. 이제 `startAt`(epoch ms)를
 * 진실의 소스로 쓴다. 시딩 문서만 id를 `ev-0705`로 유지 → 옛 attendance 기록이 그대로 붙는다.
 */
import { add, subscribe, type Row } from "./crew";
import { COLLECTIONS } from "./firebase";

export type EventDef = {
  id: string;
  title: string;
  desc: string;
  startAt: number; // epoch ms — 모임 시작 시각(진실의 소스)
  m?: string; // 표시용 "7월" — startAt에서 파생
  d?: string; // 표시용 "05"
  name?: string; // 만든 사람
};

/* 🗑 자동 시딩(SEED) 제거 — 2026-08-01
 *
 * 2026-07-18 하드코딩→Firestore 이관 때, 기존 모임 3건을 잃지 않으려고 "컬렉션이 비어 있으면
 * 심는다"를 넣었다. **일회성 이관 장치였는데 영구 코드로 남았다.**
 *
 * 왜 지우나:
 *  ① **날짜가 하드코딩(2026-07-05·07-19·08-02)이라 이미 전부 지난 모임이다.** 지금 이게 발동하면
 *     신규 사용자는 첫 화면에서 "지난 모임 3개"부터 보게 된다.
 *  ② 크루 격리(docs/BRIEF.md)를 적용하면 events가 크루별로 갈리므로, 이 코드는 **새 크루가
 *     생길 때마다 남의 동네 지난 모임을 영구히 재생성**한다. 크루 30개면 90건이다.
 *  ③ 컬렉션을 통째로 비우는 관리 동작을 되돌릴 수 없다 — 지우면 앱이 다시 심는다.
 *
 * 이관은 끝났고(기존 3건은 서버에 있다), 이제 모임은 앱의 [모임 만들기]로만 생긴다.
 * 비어 있으면 빈 목록이 정답이다 — schedule-section에 "첫 모임을 만들어 보세요" 안내가 있다.
 */

function toDef(row: Row): EventDef {
  const startAt = Number(row.startAt) || 0;
  const dt = startAt ? new Date(startAt) : null;
  return {
    id: row.id,
    title: String(row.title ?? "모임"),
    desc: String(row.desc ?? ""),
    startAt,
    m: dt ? `${dt.getMonth() + 1}월` : undefined,
    d: dt ? String(dt.getDate()).padStart(2, "0") : undefined,
    name: row.name ? String(row.name) : undefined,
  };
}

/** 구독. startAt 오름차순. 비어 있으면 **빈 배열을 그대로 넘긴다**(자동 시딩 없음 — 위 주석). */
export function subscribeEvents(cb: (events: EventDef[]) => void): () => void {
  return subscribe(COLLECTIONS.events, (rows) => {
    cb(rows.map(toDef).sort((a, b) => a.startAt - b.startAt));
  });
}

/** 모임 만들기 — 아무나(친목 수준). uid는 crew.add가 곁들인다(소유기반 이행 발판). */
export function createEvent(input: { title: string; desc: string; startAt: number; name: string }) {
  return add(COLLECTIONS.events, {
    title: input.title.trim(),
    desc: input.desc.trim(),
    startAt: input.startAt,
    name: input.name.trim(),
  });
}

/** 오늘 이후(당일 포함) 가장 가까운 모임. 없으면 null(지난 모임을 억지로 안 보여준다). */
export function nextEvent(events: EventDef[], now: number = Date.now()): EventDef | null {
  const start = new Date(now);
  start.setHours(0, 0, 0, 0);
  const todayMs = start.getTime();
  const upcoming = events.filter((e) => e.startAt >= todayMs).sort((a, b) => a.startAt - b.startAt);
  return upcoming[0] ?? null;
}

/** 지난 모임인가 — 참석 버튼 비활성·"지난 모임" 라벨용(당일은 아직 안 지난 것). */
export function isPast(e: EventDef, now: number = Date.now()): boolean {
  const end = new Date(e.startAt);
  end.setHours(23, 59, 59, 999);
  return end.getTime() < now;
}

export type EventInfo = { place?: string; time?: string; distance?: string; extra?: string };

/** 안내 문자열을 **장소·시간·거리 + 나머지**로 쪼갠다(카드 가독성용).
 *  기존 안내가 " · "로 이어붙인 한 덩어리라 빽빽했다 → 핵심 3개를 칩으로 크게 뽑는다.
 *  분리자는 **공백 있는 " · "만** — "6′00·6′30" 같은 붙은 가운뎃점은 안 건드린다.
 *  첫 조각=장소, 나머지 중 km 포함=거리·시각(시/오전/:) 포함=시간, 남은 건 extra. */
export function parseEventInfo(desc: string): EventInfo {
  const parts = desc.split(/\s+·\s+/).map((s) => s.trim()).filter(Boolean);
  if (!parts.length) return {};
  const [place, ...rest] = parts;
  let time: string | undefined, distance: string | undefined;
  const extras: string[] = [];
  for (const p of rest) {
    if (!distance && /\d\s*(km|킬로)/i.test(p)) distance = p;
    else if (!time && /(\d{1,2}\s*:\s*\d{2}|오전|오후|\d+\s*시)/.test(p)) time = p;
    else extras.push(p);
  }
  return { place, time, distance, extra: extras.join(" · ") || undefined };
}
