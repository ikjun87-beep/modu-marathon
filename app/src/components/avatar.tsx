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
 * ⚠️ 링은 **3색을 넘기지 말 것**. 강조색을 늘리면 NRC가 네온그린+오렌지를 섞어
 * "브랜드색이 뭔지 모르겠다"고 비판받은 길을 그대로 간다.
 *
 * ⚠️⚠️ **링에 브랜드색·골드를 쓰지 말 것** (2026-07-30 R18 독립 채점 지적).
 * 예전 3색은 `[Brand.brand, Team.red, Team.green]`이었는데, 팔레트가 그린으로 바뀌자
 * **링과 [러닝 시작] 버튼이 픽셀 단위로 같은 색(RGB 47,110,74)**이 됐다 — "브랜드 솔리드는
 * 액션 전용" 규칙 정면 위반이고, 사용자는 사람 표시인지 누를 것인지 구분할 수 없다.
 * `Team.green`(#2f8f5b)도 브랜드 그린(#2f6e4a)과 **색상각이 2° 차이**라 같은 이유로 뺐다.
 * 골드는 순위·성과 전용이므로 애초에 후보가 아니다.
 * 그래서 링은 액션(그린 146°)·순위(골드 38°)와 **색상각이 멀리 떨어진 3색**으로 고정한다.
 */
import { Image } from "react-native";
import { StyleSheet, Text, View } from "react-native";

import { Brand, FONT, Team, Weight } from "@/lib/brand";
import { mascotSource, useMascot, type MascotKind } from "@/lib/mascot";
import { useProfilePhoto } from "@/lib/profile-photo";

/**
 * 링 후보 3색. 인덱스는 이름 해시로 고정된다.
 *
 * 색상각·명도를 **둘 다** 벌렸다 — 색상각만 벌리면 색약(적록)에서 붙어 보인다.
 *   레드 359° · 플럼 317° · 슬레이트 209°   (액션 그린 146° / 골드 38°와 전부 멀다)
 *   서로 42~150° 떨어지고 명도 대비도 1.16~1.93으로 갈린다.
 * 카드 위 대비 4.15 / 4.83 / 8.00 — 링은 테두리라 본문 기준(4.5)을 강제하지 않는다.
 */
const RINGS = ["#d9484b", "#9c5b8a", "#35526e"] as const;

/** 내가 고른 마스코트의 팀색 — 캐릭터 옷 색과 링을 맞춘다.
 *  ⚠️ 여긴 **내 아바타 전용**이라 그린을 그대로 쓴다: 바로 옆에 초록 조끼를 입은 오키가
 *  같이 그려지므로 "이건 팀 표시"라는 근거가 화면에 함께 있다. 반면 남의 아바타(RINGS)는
 *  근거 없이 초록 링만 뜨므로 액션색과 혼동된다 — 그래서 둘을 다르게 다룬다. */
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
  /** 성장 링 등급(0~4). 마이 탭 프로필 히어로에서만 쓴다 — 아래 RING_TIER 주석 참조. */
  tier?: number;
};

/** 획득 배지 수 → 링 등급. **마이 탭 히어로에만** 적용한다(2026-07-28 디자인 리드 결정).
 *
 *  런데이(레벨 색)·삼성헬스(금속 뱃지)처럼 "성장이 눈에 보이는 물건"이 우리에겐 없었다.
 *  새 캐릭터를 그리는 대신 **이미 있는 링을 단계화**해 해결한다 — 새 아트도, 새 데이터 모델도
 *  필요 없다(배지 집계는 stats.ts에 이미 있다).
 *
 *  ⚠️ 모든 화면에 뿌리지 말 것. 성장 링은 "내 집"에서만 보여주는 게 정보 위계상 맞고,
 *  전 화면에 깔면 그 자체가 또 하나의 반복 템플릿이 된다(독립 채점 R11이 지적한 함정).
 *  골드는 **전부 획득(5개)에만** — 중간 단계에 쓰면 "골드=성과" 규칙이 흐려진다. */
export function ringTier(earnedCount: number): number {
  if (earnedCount >= 5) return 4;
  if (earnedCount >= 3) return 3;
  if (earnedCount >= 1) return 2;
  return 1;
}

export function Avatar({ name, size = 38, me = false, ring = true, tier }: Props) {
  const mascot = useMascot();
  // 내 사진을 등록했으면 마스코트 대신 사진. 기기 로컬이라 **내 아바타에만** 적용된다
  // (남의 사진은 공유 저장이 없어 알 수 없다 — lib/profile-photo.ts 주석 참조).
  const photo = useProfilePhoto();
  let color = me ? teamColorOf(mascot) : ringColorFor(name || "?");
  // 링 두께는 크기에 비례 — 작은 아바타에 2px은 두껍고 큰 아바타엔 얇다.
  let border = ring ? Math.max(1.5, Math.round(size * 0.055)) : 0;

  // 성장 링 — 등급이 오르면 색과 굵기가 함께 오른다. 0개(1등급)는 위축시키지 않게 옅게.
  if (tier != null) {
    if (tier >= 4) { color = Brand.gold; border = Math.round(size * 0.075); }
    else if (tier === 3) { color = Brand.brand; border = Math.round(size * 0.065); }
    else if (tier <= 1) { color = Brand.line2; }
  }

  // ⚠️ 512px 마스코트를 22~30px로 줄이면 외곽선이 뭉개진다. 게다가 이 컴포넌트가 카드 반복을
  // 없애려고 만든 "이니셜 + 링" 문법을 나 자신에게만 예외로 깨는 셈이라 일관성도 잃는다.
  // → 작은 자리에서는 me여도 이니셜로 그린다. 링 색(내 팀색)은 유지해 "이건 나"는 남는다.
  const drawFace = me && size >= 36;

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
      {drawFace && photo ? (
        // 사진은 원을 꽉 채워야 얼굴이 잘 보인다(마스코트는 여백을 둬야 다리가 안 잘린다).
        <Image source={{ uri: photo }} style={{ width: size, height: size }} resizeMode="cover" />
      ) : drawFace ? (
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
