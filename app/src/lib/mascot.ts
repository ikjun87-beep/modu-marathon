/**
 * 마스코트 — 앱의 얼굴. 온보딩·빈 화면·배지 축하·홈 인사말에 등장한다.
 *
 * 남녀 2종은 **하나의 원본에서 코드로 파생**했다(scripts/build-mascot-pair.mjs) — 형태가 100% 같고
 * 볼터치·신발색만 다르다. AI로 따로 그리면 남매가 아니라 남남처럼 보인다.
 *
 * 러너 네임으로는 성별을 알 수 없어 **마이 탭에서 고르게** 한다(회장 결정). 기본은 남성.
 * 이건 취향 설정이지 신원이 아니므로 이 기기(AsyncStorage)에만 둔다 — 서버에 올릴 이유가 없다.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export type MascotKind = "male" | "female";

const KEY = "mm_mascot_v1";

// require는 정적 분석 대상이라 변수로 못 뺀다 — 맵으로 고정한다.
const SOURCES = {
  male: require("../../assets/images/mascot-male.png"),
  female: require("../../assets/images/mascot-female.png"),
} as const;

export function mascotSource(kind: MascotKind) {
  return SOURCES[kind];
}

let cached: MascotKind | undefined;
const listeners = new Set<(k: MascotKind) => void>();

export async function getMascot(): Promise<MascotKind> {
  if (cached === undefined) {
    const raw = await AsyncStorage.getItem(KEY);
    cached = raw === "female" ? "female" : "male";
  }
  return cached;
}

export async function setMascot(kind: MascotKind): Promise<void> {
  await AsyncStorage.setItem(KEY, kind);
  if (kind === cached) return;
  cached = kind;
  listeners.forEach((fn) => fn(kind));
}

/** 화면용 훅 — 마이 탭에서 바꾸면 다른 화면도 즉시 따라온다(러너 네임과 같은 이유). */
export function useMascot(): MascotKind {
  const [kind, setKind] = useState<MascotKind>(cached ?? "male");

  useEffect(() => {
    let alive = true;
    void getMascot().then((k) => alive && setKind(k));
    const fn = (k: MascotKind) => alive && setKind(k);
    listeners.add(fn);
    return () => {
      alive = false;
      listeners.delete(fn);
    };
  }, []);

  return kind;
}
