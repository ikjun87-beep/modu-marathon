/**
 * Skeleton — 로딩 중 콘텐츠 자리표시자. 은은한 펄스(opacity)로 "곧 채워짐"을 알린다.
 * 전역 공통(P7-2): 러닝 상세·홈 큐레이션 등 어디서나 `<Skeleton height={220} />`.
 */
import { useEffect } from "react";
import type { DimensionValue, ViewStyle } from "react-native";
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from "react-native-reanimated";

import { Brand } from "@/lib/brand";

type Props = {
  height: number;
  width?: DimensionValue;
  radius?: number;
  style?: ViewStyle;
};

export function Skeleton({ height, width = "100%", radius = 16, style }: Props) {
  const pulse = useSharedValue(0.5);

  useEffect(() => {
    pulse.value = withRepeat(
      withTiming(1, { duration: 750, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, [pulse]);

  const animatedStyle = useAnimatedStyle(() => ({ opacity: pulse.value }));

  return (
    <Animated.View
      style={[
        { height, width, borderRadius: radius, backgroundColor: Brand.line },
        animatedStyle,
        style,
      ]}
    />
  );
}
