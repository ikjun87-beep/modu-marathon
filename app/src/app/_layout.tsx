import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { BadgeCelebration } from '@/components/badge-celebration';
import { OnboardingGate } from '@/components/onboarding-gate';
import { ensureSignedIn } from '@/lib/auth';
import { useWatchAutoSync } from '@/lib/watch-autosync';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  // 워치 기록 자동 불러오기 — 이름이 정해진 뒤(구독형 useMyName) 조용히 돈다. UI 없음.
  useWatchAutoSync();
  // 게스트(익명) 로그인 확보 — 새 문서에 주인(uid)을 남기기 위한 전제. UI 없음, 실패해도 무해.
  // 저장 경로(crew.ts fbAdd/fbPut)도 각자 기다리지만, 여기서 미리 데워 첫 저장이 늦지 않게 한다.
  useEffect(() => {
    void ensureSignedIn();
  }, []);
  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      <OnboardingGate>
        <AppTabs />
        {/* 배지 축하 — 러닝 저장·워치 불러오기 어디서 따든 그 자리에서 뜬다(탭 위에 덮임) */}
        <BadgeCelebration />
      </OnboardingGate>
    </ThemeProvider>
  );
}
