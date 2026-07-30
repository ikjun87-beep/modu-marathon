import { Image } from 'expo-image';
import { StyleSheet, View } from 'react-native';
import Animated, { Keyframe, Easing } from 'react-native-reanimated';

const DURATION = 300;

/** 웹 프리뷰용 스플래시 오버레이. 네이티브(animated-icon.tsx)와 짝 — 자세한 설명은 그쪽 참조.
 *  실제로 마운트되는 건 이 `AnimatedSplashOverlay`뿐이다(`_layout.tsx` 확인, 웹에서는 no-op).
 *
 *  2026-07-30: Expo 기본 로고(expo-logo.png)를 한 번도 안 바꾸고 방치했던 걸 발견 — 이 파일
 *  전체가 여기서만 쓰던 죽은 코드(`AnimatedIcon`, `glowKeyframe`, `animated-icon.module.css`)를
 *  정리하고, 혹시 나중에 웹 전용 전환 연출이 필요할 때를 위해 `AnimatedIcon`만 마스코트로
 *  갱신해 남겨뒀다(어차피 안 쓰이던 Expo 로고를 그대로 두는 것보다는 낫다). */
export function AnimatedSplashOverlay() {
  return null;
}

const keyframe = new Keyframe({
  0: {
    transform: [{ scale: 0 }],
  },
  60: {
    transform: [{ scale: 1.2 }],
    easing: Easing.elastic(1.2),
  },
  100: {
    transform: [{ scale: 1 }],
    easing: Easing.elastic(1.2),
  },
});

const logoKeyframe = new Keyframe({
  0: {
    opacity: 0,
  },
  60: {
    transform: [{ scale: 1.2 }],
    opacity: 0,
    easing: Easing.elastic(1.2),
  },
  100: {
    transform: [{ scale: 1 }],
    opacity: 1,
    easing: Easing.elastic(1.2),
  },
});

export function AnimatedIcon() {
  return (
    <View style={styles.iconContainer}>
      <Animated.View style={styles.background} entering={keyframe.duration(DURATION)} />

      <Animated.View style={styles.imageContainer} entering={logoKeyframe.duration(DURATION)}>
        <Image style={styles.image} source={require('@/assets/images/mascot-m-red.png')} />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    width: '100%',
    zIndex: 1000,
    position: 'absolute',
    top: 128 / 2 + 138,
  },
  imageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 128,
    height: 128,
  },
  image: {
    position: 'absolute',
    width: 108,
    height: 108,
  },
  background: {
    borderRadius: 40,
    // 파일럿 팔레트(안 A, 2026-07-30) — 네이티브(animated-icon.tsx)와 짝 맞춤.
    backgroundColor: '#2f6e4a',
    width: 128,
    height: 128,
    position: 'absolute',
  },
});
