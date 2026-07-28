/**
 * 아바타 — 크루·랭킹·타임라인·댓글 어디서나 "사람"을 그리는 단 하나의 컴포넌트.
 *
 * ## 왜 만들었나 (2026-07-28 R12)
 * 독립 채점 R11이 짚은 "AI스럽다"의 원인 중 하나가 **원형 소프트블루 아이콘의 무한 반복**이었다.
 * 크루 참석자·랭킹 행·댓글이 전부 같은 연하늘 원에 이니셜만 달랐다.
 *
 * 처방은 색을 늘리는 게 아니라 **사람마다 링 색을 다르게** 하는 것이다. 여러 명이 나오는
 * 화면(크루·랭킹·타임라인)이 자동으로 다채로워지는데, 팔레트는 3색을 넘지 않는다.
 *
 * ## 링 색을 이름에서 뽑는 이유
 * 마스코트 선택은 **기기 로컬**(AsyncStorage)이라 남의 캐릭터를 알 수 없다. 그래서 이름 해시로
 * 결정적으로 고른다 — 같은 사람은 어느 기기에서나 같은 색, 개명하면 색도 따라 바뀐다.
 * 내 아바타만은 내가 고른 마스코트의 팀색을 그대로 쓴다(캐릭터와 링이 어긋나면 어색하다).
 *
 * ⚠️ 링 3색(브랜드·레드·그린)을 넘기지 말 것. 강조색을 늘리면 NRC가 네온그린+오렌지를 섞어
 * "브랜드색이 뭔지 모르겠다"고 비판받은 길을 그대로 간다.
 */
import { Image } from "react-native";
import { StyleSheet, Text, View } from "react-native";

import { Brand, FONT, Team, Weight } from "@/lib/brand";
import { mascotSource, useMascot, type MascotKind } from "@/lib/mascot";

/** 링 후보 3색. 인덱스는 이름 해시로 고정된다. */
const RINGS = [Brand.brand, Team.red, Team.green] as const;

/** 내가 고른 마스코트의 팀색 — 캐릭터 옷 색과 링을 맞춘다. */
export function teamColorOf(kind: MascotKind): string {
  return kind.endsWith("-green") ? Team.green : Team.red;
}

/** 이름 → 링 색. 결정적이라 같은 사람은 어느 화면·어느 기기에서나 같은 색. */
export function ringColorFor(name: string): string {
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return RINGS[h % RINGS.length];
}

type Props = {
  /** 표시할 사람 이름. 이니셜과 링 색의 근거가 된다. */
  name: string;
  size?: number;
  /** true면 내 마스코트 그림을 쓴다(링도 내 팀색). 홈 인사·마이 프로필·내 순위 등. */
  me?: boolean;
  /** 링을 끄고 싶을 때(겹쳐 쌓는 참석자 얼굴 등에서 흰 테두리가 필요한 경우). */
  ring?: boolean;
};

export function Avatar({ name, size = 38, me = false, ring = true }: Props) {
  const mascot = useMascot();
  const color = me ? teamColorOf(mascot) : ringColorFor(name || "?");
  // 링 두께는 크기에 비례 — 작은 아바타에 2px은 두껍고 큰 아바타엔 얇다.
  const border = ring ? Math.max(1.5, Math.round(size * 0.055)) : 0;

  return (
    <View
      style={[
        styles.wrap,
        {
          width: size,
          height: size,
          borderRadius: size / 2,
          borderWidth: border,
          borderColor: ring ? color : "transparent",
        },
      ]}>
      {me ? (
        <Image
          source={mascotSource(mascot)}
          style={{ width: size * 0.82, height: size * 0.82 }}
          resizeMode="contain"
        />
      ) : (
        <Text style={[styles.initial, { fontSize: size * 0.42, color }]}>
          {(name.trim()[0] || "?").toUpperCase()}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: Brand.brandSoft,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  initial: { fontFamily: FONT, fontWeight: Weight.bold },
});
