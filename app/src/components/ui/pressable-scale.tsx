/**
 * PressableScale — 누르면 살짝 줄었다 스프링으로 튀어오르는 촉각 피드백(iOS식 "부드러움").
 * 전역 공통(P7-2): 카드·리스트 아이템·버튼 등 탭 가능한 표면을 이걸로 감싼다.
 * 기존 `pressed && styles.x` opacity 훅을 대체 — 정적 style만 넘기면 된다.
 */
import { forwardRef } from "react";
import {
  Pressable,
  type PressableProps,
  type PressableStateCallbackType,
  type View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

type Props = PressableProps & {
  /** 눌렀을 때 축소 배율 (기본 0.97) */
  scaleTo?: number;
  /** 눌렀을 때 살짝 흐려짐 (기본 true) */
  dim?: boolean;
};

export const PressableScale = forwardRef<View, Props>(function PressableScale(
  { scaleTo = 0.97, dim = true, style, onPressIn, onPressOut, ...rest },
  ref
) {
  const scale = useSharedValue(1);
  const opacity = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <AnimatedPressable
      ref={ref}
      style={
        typeof style === "function"
          ? (state: PressableStateCallbackType) => [style(state), animatedStyle]
          : [style, animatedStyle]
      }
      onPressIn={(e) => {
        scale.value = withSpring(scaleTo, { damping: 18, stiffness: 260, mass: 0.6 });
        if (dim) opacity.value = withTiming(0.9, { duration: 90 });
        onPressIn?.(e);
      }}
      onPressOut={(e) => {
        scale.value = withSpring(1, { damping: 15, stiffness: 240, mass: 0.6 });
        if (dim) opacity.value = withTiming(1, { duration: 140 });
        onPressOut?.(e);
      }}
      {...rest}
    />
  );
});
