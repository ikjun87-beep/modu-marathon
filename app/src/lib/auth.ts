/** Firebase Auth 배선(foundation) — 웹·앱 공통 계정의 토대.
 *
 *  현재: Firebase 설정(.env)이 있으면 auth 사용 가능, 없으면 null(앱은 이름 기반 신원으로 동작).
 *  다음 단계(실기기 + 실제 Firebase 연결 후):
 *   - 네이티브 세션 영속성: initializeAuth + getReactNativePersistence(AsyncStorage)
 *     (firebase RN 빌드 전용 API라 실기기 검증과 함께 도입)
 *   - 로그인 화면/게이팅, 이메일·게스트(익명) 로그인, 프로필(displayName) 연동.
 */
import {
  getAuth,
  onAuthStateChanged,
  signInAnonymously,
  signOut,
  type User,
} from "firebase/auth";

import { app, HAS_FIREBASE } from "./firebase";

export const auth = HAS_FIREBASE ? getAuth(app) : null;

/** 게스트(익명) 로그인 — Firebase 연결 시 사용. */
export async function signInGuest(): Promise<User | null> {
  if (!auth) return null;
  const cred = await signInAnonymously(auth);
  return cred.user;
}

/** 로그인 상태 구독. Firebase 미설정 시 즉시 null. */
export function watchAuth(cb: (user: User | null) => void): () => void {
  if (!auth) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, cb);
}

export function signOutUser(): Promise<void> {
  return auth ? signOut(auth) : Promise.resolve();
}
