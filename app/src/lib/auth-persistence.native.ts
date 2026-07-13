/** RN(iOS·Android) 세션 영속성 — AsyncStorage.
 *
 *  `getReactNativePersistence`는 firebase v10의 **RN 번들 전용** export라
 *  `firebase/auth`의 공개 타입(index.d.ts)에는 노출되지 않는다(런타임엔 존재).
 *  → 타입만 좁혀서 꺼내 쓴다. 웹은 auth-persistence.web.ts가 대신 로드된다.
 *  참고: https://expo.fyi/firebase-js-auth-setup (v10.3.0+)
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as firebaseAuth from "firebase/auth";
import type { Persistence } from "firebase/auth";

type ReactNativeAuth = {
  getReactNativePersistence?: (storage: unknown) => Persistence;
};

const rn = firebaseAuth as unknown as ReactNativeAuth;

/** 번들 해석이 틀어져(웹 빌드로 잡히는 등) 함수가 없으면 크래시 대신 메모리 세션으로 강등한다.
 *  → 앱은 정상 동작하고, 재시작 시 로그인만 풀린다. */
export const authPersistence: Persistence | undefined = rn.getReactNativePersistence
  ? rn.getReactNativePersistence(AsyncStorage)
  : (console.warn("[auth] RN 영속성 API 없음 — 메모리 세션으로 동작합니다."), undefined);
