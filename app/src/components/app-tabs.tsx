import { NativeTabs } from 'expo-router/unstable-native-tabs';
import { useColorScheme } from 'react-native';

import { Brand } from '@/lib/brand';
import { Colors } from '@/constants/theme';

/**
 * 하단 5탭 — 홈(Today)·크루·러닝·랭킹·마이. 아이콘은 Material 심볼(md=)로 지정(별도 PNG 에셋 불필요).
 * name은 라우트 파일명과 1:1: index=홈, crew, explore(폴더/Stack), ranking, my.
 *
 * 선택 탭은 **브랜드 블루**(당근 하단바처럼 — 회색만 있으면 밋밋하다).
 * tintColor = 선택 라벨색, iconColor = {default 회색, selected 브랜드}.
 */
export default function AppTabs() {
  const scheme = useColorScheme();
  const dark = scheme === 'dark';
  const colors = Colors[scheme === 'unspecified' ? 'light' : scheme];

  return (
    <NativeTabs
      backgroundColor={colors.background}
      tintColor={Brand.brand}
      iconColor={{ default: dark ? '#8a9099' : Brand.faint, selected: Brand.brand }}
      indicatorColor={Brand.brandSoft}
      labelStyle={{ selected: { color: Brand.brand } }}>
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
