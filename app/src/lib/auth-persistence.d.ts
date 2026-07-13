/** 플랫폼 분리 모듈(auth-persistence.native.ts / auth-persistence.web.ts)의 공용 타입 선언. */
import type { Persistence } from "firebase/auth";

/** 네이티브에서 RN 영속성 API 해석이 실패하면 undefined(메모리 세션 폴백). */
export declare const authPersistence: Persistence | undefined;
