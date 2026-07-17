import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { BadgeCelebration } from '@/components/badge-celebration';
import { OnboardingGate } from '@/components/onboarding-gate';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
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
