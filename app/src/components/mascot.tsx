/**
 * Mascot — 마스코트 이미지 한 장. 크기만 주면 된다.
 *
 * 원본은 512px 정사각에 여백이 잘려 있어(scripts/optimize-mascot.mjs) 어느 크기로 놔도
 * 캐릭터가 박스를 꽉 채운다 — 화면마다 여백을 다시 계산할 필요가 없다.
 */
import { Image, type ImageStyle, type StyleProp } from "react-native";

import { mascotSource, useMascot, type MascotKind } from "@/lib/mascot";

type Props = {
  size: number;
  /** 지정하면 그 캐릭터로 고정(마이 탭 선택지처럼). 생략하면 사용자가 고른 것. */
  kind?: MascotKind;
  style?: StyleProp<ImageStyle>;
};

export function Mascot({ size, kind, style }: Props) {
  const picked = useMascot();
  return (
    <Image
      source={mascotSource(kind ?? picked)}
      style={[{ width: size, height: size }, style]}
      resizeMode="contain"
      // 장식이라 스크린리더가 읽을 필요 없다(옆에 항상 진짜 문구가 있다)
      accessibilityElementsHidden
      importantForAccessibility="no"
    />
  );
}
