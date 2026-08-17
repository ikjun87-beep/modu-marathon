/**
 * 크루 탭의 네이티브 스택 — 목록(index)에서 출석 이력·초대 화면으로 push 전환.
 * explore/_layout.tsx와 같은 패턴(Expo Router v57 네이티브 탭 안 Stack 중첩).
 */
import { Stack } from "expo-router";

export default function CrewStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        animation: "ios_from_right",
        animationDuration: 450,
        gestureEnabled: true,
      }}
    />
  );
}
