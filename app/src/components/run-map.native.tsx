/**
 * RunMap (네이티브) — 실시간 GPS 경로를 구글맵 위에 폴리라인으로 그린다.
 * 좌표는 온디바이스 표시용(서버 미저장 — 처리방침의 "좌표 서버 미저장" 유지).
 */
import { useEffect, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

import { Brand } from "@/lib/brand";
import type { LatLng } from "@/lib/run";

type Props = { path: LatLng[] };

export function RunMap({ path }: Props) {
  const mapRef = useRef<MapView>(null);
  const coords = path.map((p) => ({ latitude: p.lat, longitude: p.lng }));
  const cur = coords.length ? coords[coords.length - 1] : null;

  // 현재 위치로 카메라 부드럽게 따라가기
  useEffect(() => {
    if (cur && mapRef.current) {
      mapRef.current.animateCamera({ center: cur, zoom: 16 }, { duration: 600 });
    }
  }, [cur?.latitude, cur?.longitude]);

  return (
    <View style={styles.wrap}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        showsUserLocation
        showsMyLocationButton={false}
        toolbarEnabled={false}
        initialRegion={{
          latitude: cur?.latitude ?? 37.5665, // 경로 전엔 서울 기본(showsUserLocation이 곧 실위치로 이동)
          longitude: cur?.longitude ?? 126.978,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
        }}>
        {coords.length > 1 && (
          <Polyline coordinates={coords} strokeColor={Brand.brand} strokeWidth={6} />
        )}
        {coords.length > 0 && (
          <Marker coordinate={coords[0]} anchor={{ x: 0.5, y: 0.5 }}>
            <View style={styles.startDot} />
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
});
