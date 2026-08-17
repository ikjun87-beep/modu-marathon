/**
 * Firebase — 웹(web/index.html)·앱·워치가 공유하는 단일 소스.
 * 컬렉션 스키마는 웹과 동일하게 유지한다(연동이 프로젝트 핵심 목표).
 *
 * 설정: `.env`(EXPO_PUBLIC_FIREBASE_*)에 Firebase 콘솔 값을 넣는다.
 *       (docs/FIREBASE_SETUP.md 참고 · 웹의 firebaseConfig와 같은 프로젝트를 쓸 것)
 */
import { initializeApp, getApps, getApp, type FirebaseOptions } from "firebase/app";
import { getFirestore } from "firebase/firestore";

const firebaseConfig: FirebaseOptions = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
};

export const HAS_FIREBASE = !!firebaseConfig.projectId;

if (!HAS_FIREBASE && __DEV__) {
  console.warn(
    "[firebase] EXPO_PUBLIC_FIREBASE_* 환경변수가 없습니다. .env를 채워주세요 (docs/FIREBASE_SETUP.md)."
  );
}

// Fast Refresh에서 중복 초기화 방지
export const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);

/**
 * 현재 크루의 id — **PHASE 2 MVP는 1인 1크루**(다중 크루 동시 소속·전환 UI는 후순위).
 *
 * 세션19~21에서 docs/TIERS.md B안(서브컬렉션)으로 크루 격리를 실제로 구현했다. `CREW_ID`가
 * 여전히 **정적 상수**인 동안은(=사용자가 크루를 고르거나 전환하지 않는 동안은) 이 값 하나만
 * 바뀌면 `COLLECTIONS`가 가리키는 경로가 통째로 갈리고, `crew.ts`의 `subscribe`/`add`/`remove`/
 * `update`/`put`는 문자열 경로를 그대로 SDK에 넘기므로(다중 세그먼트도 그대로 받는다) **호출부
 * 13곳은 단 한 줄도 안 바뀐다** — 이게 이 상수를 여전히 정적으로 남겨두는 이유다. 다중 크루
 * 전환 UI가 생기는 시점에만 이 값이 세션별로 동적이어야 한다.
 *
 * ⚠️ **값을 바꾸지 말 것.** 바꾸는 순간 그 이전 문서들이 "다른 크루의 것"이 된다.
 * ⚠️ `web/index.html`은 이 값을 쓰지 않는다 — 세션21 결정으로 웹이 만지는 4개 컬렉션
 *    (guestbook·gallery·attendance·events)은 root 그대로라 크루 스코프와 무관하다.
 */
export const CREW_ID = "modu";

/** 웹과 공유하는 Firestore 컬렉션 이름 (스키마 단일 소스).
 *
 * ⚠️ **세션21로 8개가 두 그룹으로 갈렸다** — TIERS.md B안 적용 범위를 컬렉션별로 확정한 결정.
 * `web/index.html`이 실제로 구독·작성하는 4개(guestbook·gallery·attendance·events, 전수 grep
 * 확인)는 **root 그대로** 둔다 — 크루로 격리하면 웹·앱 실시간 동기화가 끊긴다. 웹이 한 번도
 * 안 건드리는 앱 전용 4개(claps·profiles·runs·comments)만 `crews/{CREW_ID}/...`로 옮긴다 —
 * 원래 이 4개가 "랭킹·통계 오염 방지" 목적이었으니 크루 격리가 오히려 기존 결함(생판 남이
 * 크루 랭킹 1등)을 고친다. 다중 크루(PHASE 4)가 실제로 붙어 "웹이 크루를 골라서 본다" UX가
 * 생기기 전까진 이 경계를 유지한다(`docs/TIERS.md` §11 참조). */
export const COLLECTIONS = {
  guestbook: "guestbook", // { name, msg, createdAt } — root(웹 공유)
  gallery: "gallery", // { name, caption, image, createdAt } — root(웹 공유)
  attendance: "attendance", // { eventId, name, createdAt } — root(웹 공유)
  // 러닝 기록 — 통합 Run 스키마(수동·GPS·워치 공용, 앱 M3). crews/{CREW_ID}/runs — 앱 전용, 크루 격리.
  // { source: 'manual'|'gps'|'healthconnect'|'garmin', sourceId?, name,
  //   distanceKm, durationSec, durationMin(호환), paceSecPerKm?, startedAt?,
  //   avgHr?, cadence?, createdAt }
  // 워치/외부 소스는 문서 id를 `${source}_${sourceId}`로 두어 멱등 upsert(중복 방지).
  runs: `crews/${CREW_ID}/runs`,
  // 댓글 — 러닝 기록·방명록 등에 달리는 코멘트. { parentId, name, msg, createdAt } — crews/{CREW_ID}/comments, 앱 전용.
  comments: `crews/${CREW_ID}/comments`,
  // 크루 모임 일정. { title, desc, startAt(ms), name, uid?, createdAt } — root(웹 공유, 이관 예정).
  // 문서 id는 기존 하드코딩과 동일(ev-0705 등) 유지 → 옛 attendance(eventId) 기록 무손실.
  events: "events",
  // 👏 박수 — 러닝·사진 등 어디에나 붙는 응원. { targetId, name, createdAt } — crews/{CREW_ID}/claps, 앱 전용.
  // 참석(attendance)과 같은 토글 구조(문서 있으면 박수함 / 지우면 취소).
  // 경쟁이 아니라 응원이라는 우리 방향의 핵심 장치(docs/DESIGN_R12_PLAN.md).
  claps: `crews/${CREW_ID}/claps`,
  // 프로필 사진 — { name, photo(data:image base64), createdAt } — crews/{CREW_ID}/profiles, 앱 전용.
  // 문서 id = encodeURIComponent(러너 네임).
  // ⚠️ 크루 스코프로 좁혀서 "얼굴 사진 공개 읽기"(2026-07-31 회장 결정 · L3)의 공개 범위가
  // "앱을 깐 전원"에서 "크루 멤버"로 좁혀졌다 — 완화이지 규정 변경이 아니다.
  profiles: `crews/${CREW_ID}/profiles`,
} as const;
