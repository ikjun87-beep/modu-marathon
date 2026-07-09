/**
 * 러닝 탭의 네이티브 스택 — 목록(index)에서 러닝 상세(run/[id])로 push 전환.
 * 네이티브 탭 안에 Stack을 중첩하는 Expo Router v57 표준 패턴(부드러운 push 전환).
 * 헤더는 각 화면이 SafeAreaView로 자체 구성하므로 스택 헤더는 숨김.
 */
import { Stack } from "expo-router";

export default function ExploreStackLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        // 아이폰 창 넘기듯 가로 슬라이드(밑 화면이 살짝 시차로 밀림) + 조금 더 천천히
        animation: "ios_from_right",
        animationDuration: 450,
        gestureEnabled: true, // 왼쪽 끝에서 밀어 뒤로가기
      }}
    />
  );
}
