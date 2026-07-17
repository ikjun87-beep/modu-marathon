/**
 * 마스코트 — 앱의 얼굴. 온보딩·빈 화면·배지 축하·홈 인사말에 등장한다.
 *
 * 4종 = 성별(남/여, 볼터치 유무) × 팀 색(레드/그린 — 운동회 흰 머리띠 + 상의 색).
 * 하나의 원본에서 **코드로 파생**(scripts/build-mascot-variants.mjs) — 형태·비율 100% 동일,
 * 머리띠·볼터치·옷 색만 다르다. AI로 따로 그리면 남매가 아니라 남남처럼 보인다.
 *
 * 러너 네임으로는 성별을 알 수 없어 **마이 탭에서 고르게** 한다. 취향 설정이라 이 기기(AsyncStorage)에만.
 * 부위별 개별 선택(상의만 따로 등)은 후행 큰 과제 — docs/AVATAR_PLAN.md.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

export type MascotKind = "m-red" | "m-green" | "f-red" | "f-green";

export const MASCOTS: MascotKind[] = ["m-red", "m-green", "f-red", "f-green"];

const KEY = "mm_mascot_v2"; // v1은 'male'|'female' — 아래 migrate에서 이관

// require는 정적 분석 대상이라 변수로 못 뺀다 — 맵으로 고정한다.
const SOURCES: Record<MascotKind, number> = {
  "m-red": require("../../assets/images/mascot-m-red.png"),
  "m-green": require("../../assets/images/mascot-m-green.png"),
  "f-red": require("../../assets/images/mascot-f-red.png"),
  "f-green": require("../../assets/images/mascot-f-green.png"),
};

export function mascotSource(kind: MascotKind) {
  return SOURCES[kind] ?? SOURCES["m-red"];
}

function normalize(raw: string | null): MascotKind {
  if (raw && (MASCOTS as string[]).includes(raw)) return raw as MascotKind;
  // v1 이관: 예전 남/여 선택을 레드팀 기본으로 살린다.
  if (raw === "female") return "f-red";
  if (raw === "male") return "m-red";
  return "m-red";
}

let cached: MascotKind | undefined;
const listeners = new Set<(k: MascotKind) => void>();

export async function getMascot(): Promise<MascotKind> {
  if (cached === undefined) {
    let raw = await AsyncStorage.getItem(KEY);
    if (raw == null) raw = await AsyncStorage.getItem("mm_mascot_v1"); // 옛 키에서 이관
    cached = normalize(raw);
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
  const [kind, setKind] = useState<MascotKind>(cached ?? "m-red");

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
