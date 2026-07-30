import { Image } from 'expo-image';
import * as SplashScreen from 'expo-splash-screen';
import { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Animated, { Easing, Keyframe } from 'react-native-reanimated';
import { scheduleOnRN } from 'react-native-worklets';

const DURATION = 600;

/**
 * 앱 내부 스플래시 오버레이 — 네이티브 스플래시(app.json expo-splash-screen)가 사라진 직후,
 * JS 번들이 아직 첫 화면을 그리기 전까지 잠깐 뜬다. _layout.tsx 최상단에 얹혀 항상 보인다.
 *
 * 2026-07-30 마스코트 교체: Expo 스캐폴드 기본값(expo-logo.png, "Expo" 로고)을 한 번도
 * 안 바꾸고 방치했던 걸 발견 — 팔레트만 파일럿에서 그린으로 바뀌고 로고는 그대로 Expo였다.
 * 네이티브 스플래시(splash-icon.png)와 같은 마스코트 원본(mascot-m-red)을 써서 "네이티브
 * 스플래시 → 이 오버레이 → 실제 화면"으로 넘어가는 동안 같은 캐릭터가 계속 보이게 했다.
 *
 * 원래 있던 `AnimatedIcon`(글로우+그라데이션 배경+로고, 128px 박스)은 이 파일 어디서도
 * import되지 않는 죽은 코드였다(export만 되고 미사용) — 정리 차원에서 제거했다.
 */
export function AnimatedSplashOverlay() {
  const [animate, setAnimate] = useState(false);
  const [visible, setVisible] = useState(true);

  if (!visible) return null;

  const splashKeyframe = new Keyframe({
    0: {
      transform: [{ scale: 1 }],
      opacity: 1,
    },
    20: {
      opacity: 1,
    },
    70: {
      opacity: 0,
      easing: Easing.elastic(0.7),
    },
    100: {
      opacity: 0,
      transform: [{ scale: 1 }],
      easing: Easing.elastic(0.7),
    },
  });

  const image = <Image style={styles.image} source={require('@/assets/images/mascot-m-red.png')} />;

  return animate ? (
    <Animated.View
      entering={splashKeyframe.duration(DURATION).withCallback((finished) => {
        'worklet';
        if (finished) {
          scheduleOnRN(setVisible, false);
        }
      })}
      style={styles.splashOverlay}>
      {image}
    </Animated.View>
  ) : (
    <View
      onLayout={() => {
        SplashScreen.hideAsync().finally(() => {
          setAnimate(true);
        });
      }}
      style={styles.splashOverlay}>
      {image}
    </View>
  );
}

const styles = StyleSheet.create({
  // 마스코트 원본(mascot-m-red.png)이 이미 512×512 정사각(여백 포함)이라 width=height만 주면 된다.
  image: {
    width: 176,
    height: 176,
  },
  splashOverlay: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#2f6e4a', // 파일럿 팔레트 — app.json splash의 backgroundColor와 동일
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000,
  },
});
