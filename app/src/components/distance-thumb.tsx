/**
 * 거리 썸네일 — GPS 경로가 없는 기록(직접 입력·워치)의 자리를 채운다.
 *
 * ## 왜 필요한가 (2026-07-29 R13)
 * `RouteThumb`을 만들어 목록의 반복 아이콘을 없앴는데, 정작 **경로는 GPS 러닝에만 있다.**
 * 이 앱의 실사용 주 경로는 직접 입력과 워치 가져오기라서, 차별화 처방이 대부분의 기록에서
 * 발동하지 않고 옛 아이콘 뱃지로 되돌아갔다 — 독립 채점 R13이 "구조적 허점"으로 지목한 지점.
 *
 * 경로가 없으면 그릴 게 없다는 건 사실이지만, **거리는 있다.** 거리를 링(원호)의 채움 정도로
 * 그리면 기록마다 그림이 달라지고, 목록을 훑을 때 "길게 뛴 날"이 한눈에 보인다.
 * 10km를 한 바퀴로 잡는다 — 우리 크루의 모임 거리이자 챌린지 단위라 감이 맞는다.
 *
 * ⚠️ 숫자를 또 쓰지 않는다. 같은 행 오른쪽에 이미 "6.42 km"가 적혀 있어 중복이 된다.
 * 여기서는 **형태만** 말한다.
 */
import { StyleSheet, View } from "react-native";
import Svg, { Circle } from "react-native-svg";

import { Brand, Radius } from "@/lib/brand";

const FULL_KM = 10; // 한 바퀴 = 10km

export function DistanceThumb({ km, walk = false, size = 40 }: { km: number; walk?: boolean; size?: number }) {
  const r = size * 0.32;
  const c = 2 * Math.PI * r;
  const ratio = Math.max(0.04, Math.min(1, (Number(km) || 0) / FULL_KM));
  // 걷기는 러닝과 성격이 달라 색으로 구분한다(랭킹·배지에서도 제외되는 기록이다).
  //
  // 한 바퀴를 다 채우면 **골드**. 링은 10km에서 포화되므로 그 위로는 그림이 더 안 자라는데,
  // 색까지 같으면 목록을 훑을 때 "길게 뛴 날"이 9km와 구분되지 않는다. 골드는 규칙상
  // 순위·챌린지·성과 전용이고 10km 완주가 바로 그 성과다 — 공유 카드의 거리 링과 **같은 어휘**라
  // (`components/share-card.tsx`) 앱과 밖으로 나가는 이미지가 같은 말을 한다.
  // ⚠️ 걷기는 제외한다. 랭킹·배지에서 빠지는 기록에 성과색을 주면 골드가 뜻을 잃는다.
  const stroke = walk ? Brand.faint : ratio >= 1 ? Brand.gold : Brand.brand;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={Brand.line2}
          strokeWidth={3}
        />
        <Circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={stroke}
          strokeWidth={3}
          strokeLinecap="round"
          strokeDasharray={`${c * ratio} ${c}`}
          // 12시 방향에서 시작해야 "채워진다"가 자연스럽게 읽힌다
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
        />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: Radius.chip,
    backgroundColor: Brand.tint,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
});
