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
import { add, put, subscribe, type Row } from "./crew";
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

/** 첫 이관용 시드 — Firestore가 비어 있을 때만 심는다. id는 기존 하드코딩과 동일(참석 무손실). */
const SEED: { id: string; title: string; desc: string; y: number; mo: number; d: number }[] = [
  { id: "ev-0705", y: 2026, mo: 7, d: 5, title: "한강 야간 이지런",
    desc: "여의나루역 2번 출구 → 물빛광장 시계탑 · 6:50 모여 7:00 출발 · 5km · 대화 가능한 7′00~7′30/km · 안전: 밝은 옷·점멸등" },
  { id: "ev-0719", y: 2026, mo: 7, d: 19, title: "아침 이지런",
    desc: "올림픽공원 평화의문 앞 · 오전 8시 · 3km · 걷기+뛰기 병행, 러닝 처음도 환영" },
  { id: "ev-0802", y: 2026, mo: 8, d: 2, title: "모두의 10K 챌린지",
    desc: "학여울역 1번 출구(탄천) · 오전 9시 · 10km · 페이스 조 6′00·6′30·7′00 · 완주 메달" },
];

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

let seeding = false;
/** 구독. 비어 있으면 SEED를 한 번 심는다. startAt 오름차순.
 *  ⚠️ 시딩 가드는 **쓰기 성공 후에만 내린다.** 예전처럼 시도 즉시 seeded=true로 막으면,
 *  첫 시딩이 오프라인으로 실패했을 때 앱 재시작 전까지 재시도를 못 해 빈 컬렉션에 갇힌다. */
export function subscribeEvents(cb: (events: EventDef[]) => void): () => void {
  return subscribe(COLLECTIONS.events, (rows) => {
    if (!rows.length && !seeding) {
      seeding = true; // 동시 스냅샷 중복 시딩만 막는다(성공/실패로 아래서 해제)
      Promise.all(
        SEED.map((s) => {
          const startAt = new Date(s.y, s.mo - 1, s.d, 0, 0, 0, 0).getTime();
          return put(COLLECTIONS.events, s.id, { title: s.title, desc: s.desc, startAt }, startAt);
        })
      )
        .catch(() => {
          seeding = false; // 실패 → 다음 스냅샷에서 재시도 가능
        });
      return; // 심으면(또는 실패하면) 스냅샷이 다시 온다
    }
    if (rows.length) seeding = false; // 데이터가 왔으면 시딩 종료
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
