/**
 * RunMap (네이티브) — GPS 경로를 구글맵(커스텀 스타일) 위에 폴리라인으로 그린다.
 * follow=true(기본): 라이브 트래킹 — 현재 위치를 카메라가 따라감.
 * follow=false: 상세 페이지 — 완주 경로 전체가 보이도록 맞추고 시작·도착 마커 표시.
 * 좌표는 표시용(서버 미저장 — 처리방침의 "좌표 서버 미저장" 유지).
 */
import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

import { Brand } from "@/lib/brand";
import { MAP_STYLE } from "@/lib/map-style";
import type { LatLng } from "@/lib/run";

type Props = { path: LatLng[]; follow?: boolean };

export function RunMap({ path, follow = true }: Props) {
  const mapRef = useRef<MapView>(null);
  const coords = path.map((p) => ({ latitude: p.lat, longitude: p.lng }));
  const cur = coords.length ? coords[coords.length - 1] : null;
  const first = coords.length ? coords[0] : null;

  // 라이브: 현재 위치로 카메라 부드럽게 따라가기
  useEffect(() => {
    if (follow && cur && mapRef.current) {
      mapRef.current.animateCamera({ center: cur, zoom: 16 }, { duration: 600 });
    }
  }, [follow, cur?.latitude, cur?.longitude]);

  // 정적(상세): 지도 준비되면 경로 전체가 보이도록 맞춤
  function handleReady() {
    if (!follow && coords.length > 1) {
      mapRef.current?.fitToCoordinates(coords, {
        edgePadding: { top: 50, right: 50, bottom: 50, left: 50 },
        animated: false,
      });
    }
  }

  return (
    <View style={styles.wrap}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        customMapStyle={MAP_STYLE}
        showsUserLocation={follow}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        scrollEnabled={follow}
        zoomEnabled
        rotateEnabled={false}
        pitchEnabled={false}
        onMapReady={handleReady}
        initialRegion={{
          latitude: (follow ? cur : first)?.latitude ?? 37.5665, // 서울 기본(곧 실경로로 이동)
          longitude: (follow ? cur : first)?.longitude ?? 126.978,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
        }}>
        {coords.length > 1 && (
          <Polyline coordinates={coords} strokeColor={Brand.brand} strokeWidth={6} />
        )}
        {first && (
          <Marker coordinate={first} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.startDot} />
          </Marker>
        )}
        {!follow && cur && coords.length > 1 && (
          <Marker coordinate={cur} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.endDot} />
          </Marker>
        )}
      </MapView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { flex: 1, borderRadius: 20, overflow: "hidden", backgroundColor: Brand.warm },
  startDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: "#fff",
    borderWidth: 3,
    borderColor: Brand.brand,
  },
  endDot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: Brand.brand,
    borderWidth: 3,
    borderColor: "#fff",
  },
});
