/**
 * 마스코트 — 앱의 얼굴. 온보딩·빈 화면·배지 축하·홈 인사말에 등장한다.
 *
 * 2026-07-30 전면교체: 파란 피부 러너 → **양(sheep)**. 회장 지시("동물 의인화로 아예 새로")
 * + 팔레트 안 A(크림 러너) 확정에 맞춰 재생성. 자문: docs/MASCOT_PALETTE_DIRECTION.md.
 *
 * 4종 = 울 모양(동글/땋은 스타일, 예전 라벨 "숏컷/포니테일"의 후속) × 팀 색(레드/그린 조끼).
 * 울 모양 2종은 gpt-image-1에 **레퍼런스 이미지로 캐릭터를 고정**시켜 따로 생성(같은 얼굴·비율
 * 유지, 울 모양만 다르게 — `docs/OPENAI_IMAGE_GEN.md` 5절 기법). 팀 색(레드→그린)은 그 위에서
 * **코드로 파생**(scripts/recolor-mascot-vest.mjs, 조끼 hue만 골라 밝기비 유지한 채 재도색) —
 * AI로 두 번 그리면 실루엣이 미묘하게 달라져 "같은 양의 다른 팀"이 아니라 다른 양이 된다.
 * 배경 제거는 scripts/cutout-mascot-bg.mjs(마젠타 크로마키) + strip-mascot-shadow.mjs.
 *
 * 러너 네임으로는 취향을 알 수 없어 **마이 탭에서 고르게** 한다. 취향 설정이라 이 기기(AsyncStorage)에만.
 * 부위별 개별 선택(상의만 따로 등)은 후행 큰 과제 — docs/AVATAR_PLAN.md.
 */
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useEffect, useState } from "react";

/**
 * 마스코트 이름 — **『오키』** (2026-07-30 회장 확정)
 *
 * 왜 오키인가: 슬로건이 이미 "오늘 5키로, **오키**?"이고 마스코트 포즈가 **엄지척**이다.
 * 엄지척이 곧 "오키" 제스처라, 이름·슬로건·포즈·앱이름(5키로)이 한 덩어리로 맞물린다.
 * 새로 지어 붙인 게 아니라 온보딩에 이미 있던 말을 이름으로 승격시킨 것.
 *
 * ⚠️ 카피에 **남용하지 말 것.** 마스코트가 실제로 그려진 자리에서만 이름을 부른다 —
 * 그림 없이 이름만 나오면 사용자는 그게 누군지 모르고, 화면마다 "오키가 …"를 붙이면
 * 유치해진다. 문자열을 흩뿌리지 않도록 이 상수 하나만 쓴다.
 */
export const MASCOT_NAME = "오키";

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
