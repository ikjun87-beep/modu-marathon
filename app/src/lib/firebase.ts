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
 * 현재 크루의 id — **지금은 크루가 하나뿐이다.**
 *
 * 이 앱은 "우리 크루 하나"를 암묵적 전제로 동작해 왔고(`crews` 컬렉션도 멤버십도 없다),
 * 그 전제를 **문서에 명시적으로 적어두기만** 한다. 크루 UI·권한·격리·초대는 만들지 않는다.
 *
 * 왜 지금 적나: 두 번째 크루가 생기는 시점에 이 필드가 없으면 **그동안 쌓인 전 문서를 백필**해야
 * 한다. 지금 상수 하나를 적어두는 비용은 0이고, 나중에 치를 비용은 전수 마이그레이션이다.
 * (2026-08-14 STEP 1 결정 — 단일 크루로 시작하되 다중 크루로 갈 문을 열어둔다)
 *
 * ⚠️ **값을 바꾸지 말 것.** 바꾸는 순간 그 이전 문서들이 "다른 크루의 것"이 된다.
 * ⚠️ `web/index.html`에도 같은 값이 복제돼 있다(정적 HTML이라 TS를 import 못 한다). 함께 고칠 것.
 */
export const CREW_ID = "modu";

/** 웹과 공유하는 Firestore 컬렉션 이름 (스키마 단일 소스) */
export const COLLECTIONS = {
  guestbook: "guestbook", // { name, msg, createdAt }
  gallery: "gallery", // { name, caption, image, createdAt }
  attendance: "attendance", // { eventId, name, createdAt }
  // 러닝 기록 — 통합 Run 스키마(수동·GPS·워치 공용, 앱 M3)
  // { source: 'manual'|'gps'|'healthconnect'|'garmin', sourceId?, name,
  //   distanceKm, durationSec, durationMin(호환), paceSecPerKm?, startedAt?,
  //   avgHr?, cadence?, createdAt }
  // 워치/외부 소스는 문서 id를 `${source}_${sourceId}`로 두어 멱등 upsert(중복 방지).
  runs: "runs",
  // 댓글 — 러닝 기록·방명록 등에 달리는 코멘트. { parentId, name, msg, createdAt }
  comments: "comments",
  // 크루 모임 일정. { title, desc, startAt(ms), name, uid?, createdAt }
  // 문서 id는 기존 하드코딩과 동일(ev-0705 등) 유지 → 옛 attendance(eventId) 기록 무손실.
  events: "events",
  // 👏 박수 — 러닝·사진 등 어디에나 붙는 응원. { targetId, name, createdAt }
  // 참석(attendance)과 같은 토글 구조(문서 있으면 박수함 / 지우면 취소).
  // 경쟁이 아니라 응원이라는 우리 방향의 핵심 장치(docs/DESIGN_R12_PLAN.md).
  claps: "claps",
  // 프로필 사진 — { name, photo(data:image base64), createdAt }. 문서 id = encodeURIComponent(러너 네임).
  // ⚠️ **얼굴 사진이 공개 읽기 컬렉션에 들어간다**(2026-07-31 회장 결정 · L3). 켜기 전에
  // 처리방침 개정·화면 고지·삭제 경로가 함께 있어야 한다 — lib/profile-photo.ts 주석 참조.
  profiles: "profiles",
} as const;
