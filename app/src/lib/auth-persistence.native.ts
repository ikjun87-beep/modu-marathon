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

/** 이 모듈은 앱 부팅 경로에서 평가된다 → **여기서 던지면 앱이 즉사한다.**
 *  번들 해석이 틀어져 함수가 없거나(웹 빌드로 잡히는 등) 생성이 실패하면
 *  크래시 대신 undefined(메모리 세션)로 강등한다. 앱은 정상 동작하고 로그인만 재시작 시 풀린다. */
function createPersistence(): Persistence | undefined {
  try {
    if (typeof rn.getReactNativePersistence !== "function") {
      console.warn("[auth] RN 영속성 API 없음 — 메모리 세션으로 동작합니다.");
      return undefined;
    }
    return rn.getReactNativePersistence(AsyncStorage);
  } catch (e) {
    console.warn("[auth] RN 영속성 생성 실패 — 메모리 세션으로 동작합니다.", e);
    return undefined;
  }
}

export const authPersistence: Persistence | undefined = createPersistence();
