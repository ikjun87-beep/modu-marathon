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
const app = getApps().length ? getApp() : initializeApp(firebaseConfig);

export const db = getFirestore(app);

/** 웹과 공유하는 Firestore 컬렉션 이름 (스키마 단일 소스) */
export const COLLECTIONS = {
  guestbook: "guestbook", // { name, msg, createdAt }
  gallery: "gallery", // { name, caption, image, createdAt }
  attendance: "attendance", // { eventId, name, createdAt }
} as const;
