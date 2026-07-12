import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Colors } from '@/constants/theme';

/**
 * 하단 5탭 — 홈(Today)·크루·러닝·랭킹·마이. 아이콘은 Material 심볼(md=)로 지정(별도 PNG 에셋 불필요).
 * name은 라우트 파일명과 1:1: index=홈, crew, explore(폴더/Stack), ranking, my.
 */
export default function AppTabs() {
  const scheme = useColorScheme();
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      indicatorColor={colors.backgroundElement}
      labelStyle={{ selected: { color: colors.text } }}>
      <NativeTabs.Trigger name="index">
        <NativeTabs.Trigger.Label>홈</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="home" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="crew">
        <NativeTabs.Trigger.Label>크루</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="groups" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="explore">
        <NativeTabs.Trigger.Label>러닝</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="directions_run" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="ranking">
        <NativeTabs.Trigger.Label>랭킹</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="leaderboard" />
      </NativeTabs.Trigger>

      <NativeTabs.Trigger name="my">
        <NativeTabs.Trigger.Label>마이</NativeTabs.Trigger.Label>
        <NativeTabs.Trigger.Icon md="person" />
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}
