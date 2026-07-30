/**
 * 경로 썸네일 — 러닝 목록 행 왼쪽에 "내가 그린 그림"으로서의 경로를 보여준다.
 *
 * ## 왜 지도가 아니라 SVG인가 (2026-07-28 R12)
 * 상위 앱(Strava·NRC)은 경로를 성취의 1급 증거로 쓴다. 우리도 `run-map`이 있지만 **GPS 상세
 * 화면에서만** 뜨고, 목록은 원형 소프트블루 아이콘이 반복될 뿐이었다 — 독립 채점 R11이
 * "AI스럽다"의 원인으로 지목한 바로 그 반복이다.
 *
 * 그렇다고 행마다 MapView를 띄우면 안 된다. 네이티브 지도 뷰는 행 수만큼 인스턴스가 생겨
 * 스크롤이 무너지고, 지도 API 쿼터도 먹는다. 저장된 좌표만으로 **폴리라인을 직접 그리면**
 * 오프라인에서도 즉시 그려지고 비용이 0이며, 지도 타일보다 오히려 더 브랜드다운 그림이 된다.
 *
 * 경로가 없는 기록(직접 입력·워치)은 이 컴포넌트를 쓰지 않는다 — 호출부에서 대체 타일을 그린다.
 */
import { StyleSheet, View } from "react-native";
import Svg, { Circle, Polyline } from "react-native-svg";

import { Brand, Radius } from "@/lib/brand";
import { fitPath } from "@/lib/path-fit";
import type { LatLng } from "@/lib/run";

type Props = { path: LatLng[]; size?: number };

export function RouteThumb({ path, size = 44 }: Props) {
  // 좌표 변환은 `lib/path-fit`에 공용화했다 — 공유 카드(1080px)가 같은 러닝을
  // 같은 모양으로 그려야 하기 때문이다(목록과 공유 이미지의 경로가 다르면 버그로 읽힌다).
  const { points, start } = fitPath(path, size, size * 0.16);

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Polyline
          points={points}
          fill="none"
          stroke={Brand.brand}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 출발점 — 어디서 시작했는지가 경로를 읽는 기준점이 된다 */}
        <Circle cx={start.x} cy={start.y} r={2.6} fill={Brand.gold} />
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    borderRadius: Radius.chip,
    backgroundColor: Brand.tint,
    overflow: "hidden",
  },
});
