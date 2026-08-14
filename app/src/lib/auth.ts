/** Firebase Auth — 계정(회원/로그인) 레이어.
 *
 *  설계 원칙: **이름 기반 신원(session.ts)을 깨지 않고 그 위에 계정을 얹는다.**
 *  - 웹(web/index.html)은 아직 Auth가 없고 이름만 쓴다. Firestore 문서의 소유 식별자도
 *    여전히 `name`이라, 규칙(firestore.rules)은 그대로 두고 계정은 "신원 승격" 용도로만 쓴다.
 *  - 로그인하면 displayName ↔ 내 이름(session)을 동기화해 둘이 어긋나지 않게 한다.
 *  - 계정 uid는 `uid()`로 노출 — 이후 규칙에 소유검증(delete)을 넣을 때의 발판.
 *
 *  세션 영속성: initializeAuth + AsyncStorage(RN) / localStorage(웹).
 *  → auth-persistence.native.ts / .web.ts (플랫폼 분리, https://expo.fyi/firebase-js-auth-setup)
 *
 *  ⚠️ Firebase 콘솔 → Authentication → Sign-in method 에서
 *     **익명(Anonymous)**·**이메일/비밀번호**를 활성화해야 동작한다.
 *     (미활성 시 auth/operation-not-allowed → 아래에서 한국어로 안내)
 */
import {
  createUserWithEmailAndPassword,
  EmailAuthProvider,
  getAuth,
  initializeAuth,
  linkWithCredential,
  onAuthStateChanged,
  signInAnonymously,
  signInWithEmailAndPassword,
  signOut,
  updateProfile,
  type Auth,
  type User,
} from "firebase/auth";

import { authPersistence } from "./auth-persistence";
import { app, HAS_FIREBASE } from "./firebase";
import { setMyName } from "./session";

/** Auth 초기화는 **앱 시작을 절대 막지 않는다**.
 *  이 모듈은 마이 탭 등에서 import되어 앱 부팅 경로에 올라가므로,
 *  여기서 예외가 새어나가면 JS 번들 로드가 실패해 앱이 즉사한다(=런처에서 바로 "중단됨").
 *  → 어떤 실패든 삼키고 auth=null(계정 기능만 숨김, 앱은 이름 기반으로 정상 동작). */
function createAuth(): Auth | null {
  if (!HAS_FIREBASE) return null;
  try {
    return authPersistence
      ? initializeAuth(app, { persistence: authPersistence })
      : initializeAuth(app);
  } catch {
    // 이미 초기화됨(Fast Refresh) 또는 initializeAuth 실패 → 기존 인스턴스 시도
    try {
      return getAuth(app);
    } catch (e) {
      console.warn("[auth] 초기화 실패 — 계정 기능 없이 계속합니다.", e);
      return null;
    }
  }
}

export const auth = createAuth();

/** Auth 사용 가능 여부(=Firebase 설정됨). 미설정이면 앱은 이름 기반으로만 동작. */
export const HAS_AUTH = !!auth;

export type Account = {
  uid: string;
  email: string | null;
  name: string;
  /** 익명(게스트) 로그인 여부 */
  guest: boolean;
};

export function toAccount(user: User | null): Account | null {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    name: user.displayName ?? "",
    guest: user.isAnonymous,
  };
}

/** 현재 로그인한 계정의 uid (미로그인·미설정 시 null). */
export function uid(): string | null {
  return auth?.currentUser?.uid ?? null;
}

/** 로그인 상태 구독. Firebase 미설정 시 즉시 null. */
export function watchAccount(cb: (account: Account | null) => void): () => void {
  if (!auth) {
    cb(null);
    return () => {};
  }
  return onAuthStateChanged(auth, (user) => cb(toAccount(user)));
}

/** 게스트(익명) 로그인 — 이름만 쓰던 사용자를 계정으로 승격(기록 이전 없이 신원만). */
export async function signInGuest(name?: string): Promise<Account> {
  const a = requireAuth();
  const cred = await run(() => signInAnonymously(a));
  if (name?.trim()) await updateProfile(cred.user, { displayName: name.trim() });
  return toAccount(cred.user)!;
}

/** 저장된 세션 복원을 기다리는 상한(ms). 이 안에 첫 통지가 안 오면 uid 없이 진행한다 — 쓰기를 막지 않는다. */
const AUTH_WAIT_MS = 5000;

/** ensureSignedIn은 앱 수명 동안 **한 번만** 실행된다(결과를 재사용). */
let signInOnce: Promise<Account | null> | null = null;

/**
 * 로그인 상태를 확정하고, 아무 계정도 없으면 **게스트(익명)로 만든다.**
 *
 * ## 왜 필요한가
 * 문서에 소유자를 남기려면(`crew.ts` withOwner) 먼저 uid가 있어야 한다. 그런데 지금까지 앱은
 * 사용자가 마이 탭 계정 시트에서 직접 누른 경우에만 로그인했고, 로그인은 완전 선택이었다.
 * → **실데이터의 문서 대부분에 주인이 없다**(2026-08-14 확인: `runs` 3건 전부 uid 없음).
 * 웹(`web/index.html`)은 이미 자동 익명 로그인을 하고 있었다 — **앱만 빠져 있었다.**
 *
 * ## ⚠️ 저장된 세션을 기다린 뒤에 판단한다
 * `auth.currentUser`를 즉시 읽으면 **영속 세션이 복원되기 전이라 null일 수 있다.** 그 상태로
 * `signInAnonymously`를 부르면 **새 uid가 발급되어 기존 계정과 갈리고**, 그 사람이 지금까지
 * 남긴 글·러닝의 소유권을 잃는다(게스트→가입에서 `linkWithCredential`로 막았던 것과 같은 함정).
 * 그래서 `onAuthStateChanged`의 **첫 통지**를 기다린 뒤에만 게스트를 만든다.
 *
 * ## 실패는 삼킨다
 * 콘솔에서 익명 로그인이 꺼져 있거나 네트워크가 죽어도 앱은 이름 기반으로 그대로 동작해야 한다.
 * 이 함수는 어떤 경우에도 throw하지 않고 null을 돌려준다.
 */
export function ensureSignedIn(): Promise<Account | null> {
  if (signInOnce) return signInOnce;

  const a = auth;
  if (!a) {
    signInOnce = Promise.resolve(null);
    return signInOnce;
  }

  signInOnce = new Promise<Account | null>((resolve) => {
    let settled = false;
    let unsub: (() => void) | null = null;
    let timer: ReturnType<typeof setTimeout> | null = null;

    const finish = (account: Account | null) => {
      if (settled) return;
      settled = true;
      if (timer) clearTimeout(timer);
      unsub?.();
      resolve(account);
    };

    timer = setTimeout(() => finish(null), AUTH_WAIT_MS);

    unsub = onAuthStateChanged(a, (user) => {
      if (settled) return;
      if (user) {
        finish(toAccount(user)); // 이미 로그인돼 있다(영속 세션 복원 포함) → 그대로 쓴다
        return;
      }
      signInAnonymously(a)
        .then((cred) => finish(toAccount(cred.user)))
        .catch((e) => {
          // 콘솔에서 '익명'이 꺼져 있으면 auth/admin-restricted-operation 등이 온다.
          console.warn(
            "[auth] 게스트 로그인 보류 — 이름 기반으로 계속합니다.",
            (e as { code?: string })?.code ?? e
          );
          finish(null);
        });
    });
  });

  return signInOnce;
}

/** 이메일 가입 — 가입과 동시에 표시이름(=크루에서 보이는 내 이름)을 심는다.
 *
 *  ⚠️ **게스트가 가입하면 uid를 유지해야 한다.** 계정 카드는 "이메일로 가입하면 기기를 바꿔도
 *  이어집니다"라고 약속하는데, 그냥 createUser를 부르면 **새 uid가 발급되어 익명 계정과 갈린다**.
 *  지금은 신원이 이름 문자열이라 증상이 없지만, 문서에 uid를 심어 소유 기반으로 가는 순간
 *  게스트로 쓴 글·러닝·참석의 소유권을 가입하면서 통째로 잃는다(= 약속이 거짓말이 됨).
 *  → 익명 세션이 있으면 **linkWithCredential으로 그 계정을 승격**해 uid를 그대로 가져간다.
 *  (docs/COMMUNITY_PLAN.md §2-2 함정 ①)
 */
export async function signUpEmail(
  email: string,
  password: string,
  name: string
): Promise<Account> {
  const a = requireAuth();
  const guest = a.currentUser?.isAnonymous ? a.currentUser : null;
  const cred = await run(async () => {
    if (guest) {
      try {
        // 게스트 승격 — uid 유지. 이 계정의 기존 글·기록 소유권이 그대로 따라온다.
        return await linkWithCredential(guest, EmailAuthProvider.credential(email.trim(), password));
      } catch (e: any) {
        // 이미 가입된 이메일이거나 링크가 불가능한 상태면 일반 가입으로 물러선다.
        // (이 경우 uid가 갈리는 건 불가피 — 그 이메일은 이미 다른 신원이다.)
        if (e?.code !== "auth/credential-already-in-use" && e?.code !== "auth/email-already-in-use") {
          throw e;
        }
      }
    }
    return createUserWithEmailAndPassword(a, email.trim(), password);
  });
  const display = name.trim();
  if (display) {
    await updateProfile(cred.user, { displayName: display });
    await setMyName(display);
  }
  return { ...toAccount(cred.user)!, name: display };
}

/** 이메일 로그인 — 계정의 표시이름을 이 기기의 "내 이름"으로 되돌려 맞춘다. */
export async function signInEmail(email: string, password: string): Promise<Account> {
  const a = requireAuth();
  const cred = await run(() => signInWithEmailAndPassword(a, email.trim(), password));
  const display = cred.user.displayName?.trim();
  if (display) await setMyName(display);
  return toAccount(cred.user)!;
}

/** 표시이름 변경 — 마이 탭에서 이름을 고치면 계정에도 반영. */
export async function updateAccountName(name: string): Promise<void> {
  const user = auth?.currentUser;
  if (!user) return;
  await updateProfile(user, { displayName: name.trim() });
}

export function signOutUser(): Promise<void> {
  return auth ? signOut(auth) : Promise.resolve();
}

// ── 내부 ────────────────────────────────────────────────────────────

function requireAuth(): Auth {
  if (!auth) throw new AuthError("Firebase가 설정되지 않아 로그인할 수 없어요.");
  return auth;
}

/** Firebase 오류코드를 사람 말로. 사용자에게 raw 코드가 보이지 않게 한다. */
export class AuthError extends Error {}

const MESSAGES: Record<string, string> = {
  // Firebase 콘솔에서 Authentication을 아직 "시작하기" 하지 않은 상태(서버가 CONFIGURATION_NOT_FOUND).
  "auth/configuration-not-found":
    "로그인 기능이 아직 준비되지 않았어요. (관리자: Firebase 콘솔 → Authentication → 시작하기 → 이메일/비밀번호·익명 사용설정)",
  "auth/operation-not-allowed":
    "이 로그인 방식이 아직 켜져 있지 않아요. (관리자: Firebase 콘솔 → Authentication → 로그인 방법에서 활성화)",
  "auth/admin-restricted-operation":
    "게스트 로그인이 꺼져 있어요. (관리자: Firebase 콘솔 → Authentication → 익명 사용설정)",
  "auth/email-already-in-use": "이미 가입된 이메일이에요. 로그인해 주세요.",
  "auth/invalid-email": "이메일 형식이 올바르지 않아요.",
  "auth/weak-password": "비밀번호는 6자 이상이어야 해요.",
  "auth/invalid-credential": "이메일 또는 비밀번호가 맞지 않아요.",
  "auth/wrong-password": "이메일 또는 비밀번호가 맞지 않아요.",
  "auth/user-not-found": "가입되지 않은 이메일이에요.",
  "auth/too-many-requests": "시도가 너무 잦아요. 잠시 후 다시 해주세요.",
  "auth/network-request-failed": "네트워크 연결을 확인해 주세요.",
};

async function run<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch (e) {
    const code = (e as { code?: string }).code ?? "";
    // 모르는 코드는 코드까지 같이 보여준다 — 안 그러면 원인을 못 찾는다(12차 교훈).
    throw new AuthError(
      MESSAGES[code] ?? `로그인 중 문제가 생겼어요. 잠시 후 다시 시도해 주세요.${code ? `\n(${code})` : ""}`
    );
  }
}
