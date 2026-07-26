import { NativeTabs } from 'expo-router/unstable-native-tabs';

import { Brand } from '@/lib/brand';

/**
 * 하단 5탭 — 홈(Today)·크루·러닝·랭킹·마이. 아이콘은 Material 심볼(md=)로 지정(별도 PNG 에셋 불필요).
 * name은 라우트 파일명과 1:1: index=홈, crew, explore(폴더/Stack), ranking, my.
 *
 * 선택 탭은 **브랜드 블루**(당근 하단바처럼 — 회색만 있으면 밋밋하다).
 * tintColor = 선택 라벨색, iconColor = {default 회색, selected 브랜드}.
 *
 * ⚠️ 배경은 **라이트 고정**(app.json `userInterfaceStyle: "light"`와 한 쌍).
 * 시스템 다크모드를 따라가게 뒀더니 탭바만 검게 떠서, 그 아래 제스처바와 색이 갈라져
 * 화면 하단에 검은 띠가 두 번 생겼다(디자인 감사 지적). 앱은 라이트 전용 디자인이다.
 */
export default function AppTabs() {
  return (
    <NativeTabs
      backgroundColor={Brand.card}
      tintColor={Brand.brand}
      iconColor={{ default: Brand.faint, selected: Brand.brand }}
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
