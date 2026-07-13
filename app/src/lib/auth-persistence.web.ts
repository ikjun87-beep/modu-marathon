/** 웹 세션 영속성 — localStorage(브라우저 기본). */
import { browserLocalPersistence, type Persistence } from "firebase/auth";

export const authPersistence: Persistence = browserLocalPersistence;
