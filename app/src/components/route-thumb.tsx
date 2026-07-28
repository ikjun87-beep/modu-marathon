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
import type { LatLng } from "@/lib/run";

type Props = { path: LatLng[]; size?: number };

export function RouteThumb({ path, size = 44 }: Props) {
  const pad = size * 0.16; // 선이 모서리에 붙지 않게
  const box = size - pad * 2;

  // 위경도를 정사각 박스에 맞춘다. 위도/경도 스케일이 달라 그대로 쓰면 경로가 찌그러지므로
  // **가로세로 중 큰 쪽에 맞춰 등비 축소**하고 남는 축은 가운데 정렬한다.
  const lats = path.map((p) => p.lat);
  const lngs = path.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  // 경도 1도는 위도에 따라 짧아진다 — cos 보정을 넣어야 실제 모양이 나온다.
  const cos = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180)) || 1;
  const spanLat = Math.max(maxLat - minLat, 1e-6);
  const spanLng = Math.max((maxLng - minLng) * cos, 1e-6);
  const scale = box / Math.max(spanLat, spanLng);
  const offX = (box - spanLng * scale) / 2;
  const offY = (box - spanLat * scale) / 2;

  const pts = path
    .map((p) => {
      const x = pad + offX + (p.lng - minLng) * cos * scale;
      // SVG는 y가 아래로 증가 — 북쪽이 위로 가도록 뒤집는다.
      const y = pad + offY + (maxLat - p.lat) * scale;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(" ");

  const start = path[0];
  const sx = pad + offX + (start.lng - minLng) * cos * scale;
  const sy = pad + offY + (maxLat - start.lat) * scale;

  return (
    <View style={[styles.wrap, { width: size, height: size }]}>
      <Svg width={size} height={size}>
        <Polyline
          points={pts}
          fill="none"
          stroke={Brand.brand}
          strokeWidth={2}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {/* 출발점 — 어디서 시작했는지가 경로를 읽는 기준점이 된다 */}
        <Circle cx={sx} cy={sy} r={2.6} fill={Brand.gold} />
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
