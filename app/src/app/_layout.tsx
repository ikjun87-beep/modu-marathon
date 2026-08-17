import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { useEffect, useState } from 'react';
import { useColorScheme } from 'react-native';

import { AnimatedSplashOverlay } from '@/components/animated-icon';
import AppTabs from '@/components/app-tabs';
import { BadgeCelebration } from '@/components/badge-celebration';
import { OnboardingGate } from '@/components/onboarding-gate';
import { ensureSignedIn } from '@/lib/auth';
import { ensureCrewMembership } from '@/lib/crew';
import { useWatchAutoSync } from '@/lib/watch-autosync';

SplashScreen.preventAutoHideAsync();

export default function TabLayout() {
  const colorScheme = useColorScheme();
  // 워치 기록 자동 불러오기 — 이름이 정해진 뒤(구독형 useMyName) 조용히 돈다. UI 없음.
  useWatchAutoSync();

  // 로그인 + 크루 멤버십을 **탭이 뜨기 전에** 끝낸다(PHASE 2, 세션22 실기기로 발견한 버그 수정).
  // ⚠️ AppTabs를 먼저 그리면 각 탭의 useEffect가 곧바로 crews/{CREW_ID}/{runs,...}를
  // 구독하기 시작하는데, 그 시점에 멤버십이 아직 없으면 onSnapshot이 permission-denied로
  // 한 번 죽고 **다시 살아나지 않는다**(Firestore JS SDK는 리스너 에러를 자동 재시도하지
  // 않는다) — 그 결과 멤버십이 나중에 생겨도 화면이 로딩 스켈레톤에 영원히 멈춰 있었다.
  // 그래서 멤버십 확보 전엔 AppTabs 자체를 마운트하지 않는다(먼저 mount된 뒤 구독을 여는
  // 화면이 하나도 없게).  실패해도 무한 대기하지 않는다 — ensureCrewMembership()은 실패를
  // 삼키고 항상 resolve한다.
  const [ready, setReady] = useState(false);
  useEffect(() => {
    let alive = true;
    void ensureSignedIn()
      .then(() => ensureCrewMembership())
      .finally(() => {
        if (alive) setReady(true);
      });
    return () => {
      alive = false;
    };
  }, []);

  return (
    <ThemeProvider value={colorScheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AnimatedSplashOverlay />
      {ready && (
        <OnboardingGate>
          <AppTabs />
          {/* 배지 축하 — 러닝 저장·워치 불러오기 어디서 따든 그 자리에서 뜬다(탭 위에 덮임) */}
          <BadgeCelebration />
        </OnboardingGate>
      )}
    </ThemeProvider>
  );
}
