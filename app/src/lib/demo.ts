/**
 * 검토용 데모 데이터 — 여러 크루원이 실제로 쓴 것처럼 보이게 채운다.
 * subscribe()가 이 행들을 실제 데이터와 함께 표시(id가 demo_로 시작). 삭제·수정은 실데이터에만.
 * ⚠️ 실서비스 배포 전 DEMO=false 로 끌 것.
 */
import type { Row } from "./crew";

export const DEMO = true;

const H = 3600_000;
const D = 86400_000;
const now = Date.now();
const ago = (ms: number) => now - ms;

// 여러 크루원
const NAMES = ["김캡틴", "이보라", "박준서", "정하늘", "최유진", "강도현"];

type RunSeed = {
  id: string;
  name: string;
  source: string;
  distanceKm: number;
  durationSec: number;
  startedAt: number;
  avgHr?: number;
};

const RUNS: RunSeed[] = [
  { id: "demo_run_1", name: "김캡틴", source: "gps", distanceKm: 10.2, durationSec: 3312, startedAt: ago(4 * H), avgHr: 152 },
  { id: "demo_run_2", name: "이보라", source: "healthconnect", distanceKm: 5.4, durationSec: 1998, startedAt: ago(6 * H), avgHr: 146 },
  { id: "demo_run_3", name: "박준서", source: "gps", distanceKm: 7.1, durationSec: 2460, startedAt: ago(1 * D + 2 * H), avgHr: 158 },
  { id: "demo_run_4", name: "정하늘", source: "manual", distanceKm: 3.2, durationSec: 1290, startedAt: ago(1 * D + 5 * H) },
  { id: "demo_run_5", name: "김캡틴", source: "gps", distanceKm: 5.0, durationSec: 1650, startedAt: ago(2 * D), avgHr: 149 },
  { id: "demo_run_6", name: "최유진", source: "healthconnect", distanceKm: 12.5, durationSec: 4200, startedAt: ago(2 * D + 3 * H), avgHr: 161 },
  { id: "demo_run_7", name: "강도현", source: "gps", distanceKm: 6.3, durationSec: 2205, startedAt: ago(3 * D), avgHr: 154 },
  { id: "demo_run_8", name: "이보라", source: "manual", distanceKm: 4.8, durationSec: 1740, startedAt: ago(3 * D + 4 * H) },
  { id: "demo_run_9", name: "박준서", source: "gps", distanceKm: 8.0, durationSec: 2760, startedAt: ago(5 * D), avgHr: 156 },
];

const GUESTS: { id: string; name: string; msg: string; createdAt: number }[] = [
  { id: "demo_gb_1", name: "이보라", msg: "오늘 한강 야간런 진짜 좋았어요! 다음에도 같이 뛰어요 🌙", createdAt: ago(5 * H) },
  { id: "demo_gb_2", name: "박준서", msg: "10K 챌린지 신청했습니다. 페이스 6분조로 갈게요 💪", createdAt: ago(1 * D + 1 * H) },
  { id: "demo_gb_3", name: "정하늘", msg: "러닝 처음인데 걷기+뛰기 병행 모임 있어서 용기냈어요!", createdAt: ago(2 * D) },
  { id: "demo_gb_4", name: "최유진", msg: "이번 주 벌써 20km 넘었네요. 무릎 조심들 하세요~", createdAt: ago(2 * D + 6 * H) },
  { id: "demo_gb_5", name: "강도현", msg: "새 러닝화 신고 나가니 발이 편하네요 👟 추천 감사합니다", createdAt: ago(4 * D) },
];

const ATTEND: { id: string; eventId: string; name: string; createdAt: number }[] = [
  { id: "demo_at_1", eventId: "ev-0719", name: "김캡틴", createdAt: ago(1 * D) },
  { id: "demo_at_2", eventId: "ev-0719", name: "이보라", createdAt: ago(1 * D) },
  { id: "demo_at_3", eventId: "ev-0719", name: "정하늘", createdAt: ago(20 * H) },
  { id: "demo_at_4", eventId: "ev-0802", name: "박준서", createdAt: ago(2 * D) },
  { id: "demo_at_5", eventId: "ev-0802", name: "최유진", createdAt: ago(2 * D) },
  { id: "demo_at_6", eventId: "ev-0802", name: "강도현", createdAt: ago(1 * D) },
];

const COMMENTS: { id: string; parentId: string; name: string; msg: string; createdAt: number }[] = [
  { id: "demo_cm_1", parentId: "demo_run_1", name: "이보라", msg: "10K 페이스 미쳤다 👏", createdAt: ago(3 * H) },
  { id: "demo_cm_2", parentId: "demo_run_1", name: "박준서", msg: "다음엔 같이 뛰어요!", createdAt: ago(2 * H) },
  { id: "demo_cm_3", parentId: "demo_run_6", name: "김캡틴", msg: "12.5km 대박… 존경합니다", createdAt: ago(1 * D) },
  { id: "demo_cm_4", parentId: "demo_run_3", name: "정하늘", msg: "폼 좋아보여요 :)", createdAt: ago(1 * D) },
];

function runRows(): Row[] {
  return RUNS.map((r) => ({
    id: r.id,
    demo: true,
    source: r.source,
    name: r.name,
    distanceKm: r.distanceKm,
    durationSec: r.durationSec,
    durationMin: Math.round(r.durationSec / 60),
    paceSecPerKm: Math.round(r.durationSec / r.distanceKm),
    startedAt: r.startedAt,
    ...(r.avgHr ? { avgHr: r.avgHr } : {}),
    createdAt: r.startedAt,
  }));
}

/** 컬렉션별 데모 행. DEMO=false면 빈 배열. */
export function demoRows(col: string): Row[] {
  if (!DEMO) return [];
  switch (col) {
    case "runs":
      return runRows();
    case "guestbook":
      return GUESTS.map((g) => ({ ...g, demo: true }));
    case "attendance":
      return ATTEND.map((a) => ({ ...a, demo: true }));
    case "comments":
      return COMMENTS.map((c) => ({ ...c, demo: true }));
    default:
      return [];
  }
}

// 사용 안 해도 이름 목록은 문서화 겸 노출
export const DEMO_NAMES = NAMES;
