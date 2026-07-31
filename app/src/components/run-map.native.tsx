/**
 * RunMap (네이티브) — GPS 경로를 구글맵(커스텀 스타일) 위에 폴리라인으로 그린다.
 * follow=true(기본): 라이브 트래킹 — 현재 위치를 카메라가 따라감.
 * follow=false: 상세 페이지 — 완주 경로 전체가 보이도록 맞추고 시작·도착 마커 표시.
 * 좌표는 표시용(서버 미저장 — 처리방침의 "좌표 서버 미저장" 유지).
 */
import { forwardRef, useEffect, useImperativeHandle, useRef } from "react";
import { StyleSheet, View } from "react-native";
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from "react-native-maps";

import { Brand, Radius } from "@/lib/brand";
import { MAP_STYLE } from "@/lib/map-style";
import type { LatLng } from "@/lib/run";
import type { RunMapHandle } from "./run-map";

type Props = {
  path: LatLng[];
  follow?: boolean;
  /** 아직 경로가 없을 때 지도를 놓을 위치(러닝 시작 전 "지금 여기"). 없으면 서울 기본값. */
  center?: LatLng | null;
};

export const RunMap = forwardRef<RunMapHandle, Props>(function RunMap(
  { path, follow = true, center },
  ref,
) {
  const mapRef = useRef<MapView>(null);

  /** 공유 카드용 스냅샷 — 카드의 비주얼 영역이 정사각이라 1:1로 뜬다.
   *  실패(권한·렌더 미완·플랫폼)해도 카드는 벡터 폴리라인으로 폴백하므로 null만 돌려준다. */
  useImperativeHandle(ref, () => ({
    async snapshot() {
      try {
        const base64 = await mapRef.current?.takeSnapshot({
          width: 720,
          height: 720,
          format: "jpg",
          quality: 0.85,
          result: "base64",
        });
        return base64 ? `data:image/jpeg;base64,${base64}` : null;
      } catch {
        return null;
      }
    },
  }));
  const coords = path.map((p) => ({ latitude: p.lat, longitude: p.lng }));
  const cur = coords.length ? coords[coords.length - 1] : null;
  const first = coords.length ? coords[0] : null;

  // 라이브: 현재 위치로 카메라 부드럽게 따라가기
  useEffect(() => {
    if (follow && cur && mapRef.current) {
      mapRef.current.animateCamera({ center: cur, zoom: 16 }, { duration: 600 });
    }
  }, [follow, cur?.latitude, cur?.longitude]);

  // 아직 안 뛴 상태(경로 0개) — 시작 전에도 **지금 여기**를 보여준다.
  // 이게 없으면 모달을 열었을 때 지도가 서울 기본값에 머물러, 내가 어디서 출발하는지 안 보인다.
  useEffect(() => {
    if (follow && !cur && center && mapRef.current) {
      mapRef.current.animateCamera(
        { center: { latitude: center.lat, longitude: center.lng }, zoom: 16 },
        { duration: 500 },
      );
    }
  }, [follow, cur, center?.lat, center?.lng]);

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
        // 라이브 중엔 카메라가 따라가지만, 사용자가 지도를 밀어 옮겼을 때 **돌아올 방법**이 있어야 한다.
        showsMyLocationButton={follow}
        // 안드로이드 줌 버튼 — 손가락 핀치만으로는 달리면서 조작하기 어렵다(티맵·카카오네비도 둔다).
        zoomControlEnabled={follow}
        showsCompass={false}
        toolbarEnabled={false}
        scrollEnabled={follow}
        zoomEnabled
        rotateEnabled={false}
        pitchEnabled={false}
        onMapReady={handleReady}
        initialRegion={{
          // 경로 > 시작 전 현재위치 > 서울 기본값 순으로 고른다.
          latitude: (follow ? cur : first)?.latitude ?? center?.lat ?? 37.5665,
          longitude: (follow ? cur : first)?.longitude ?? center?.lng ?? 126.978,
          latitudeDelta: 0.004,
          longitudeDelta: 0.004,
        }}>
        {/* 경로선은 **두 겹**으로 그린다 — 흰 테두리를 깔고 그 위에 브랜드 그린.
            기본 지도는 도로가 흰색·노란색이고 공원이 초록이라, 한 겹짜리 그린 선은 배경에 따라
            묻힌다. 흰 테두리를 두르면 어떤 바닥 위에서도 경로가 또렷하게 뜬다
            (티맵·카카오네비가 파란 경로선에 쓰는 것과 같은 기법). */}
        {coords.length > 1 && (
          <>
            <Polyline coordinates={coords} strokeColor="#ffffff" strokeWidth={11} />
            <Polyline coordinates={coords} strokeColor={Brand.brand} strokeWidth={6.5} />
          </>
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
});

const styles = StyleSheet.create({
  wrap: { flex: 1, borderRadius: Radius.card, overflow: "hidden", backgroundColor: Brand.warm },
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
    borderRadius: Radius.chip,
    backgroundColor: Brand.brand,
    borderWidth: 3,
    borderColor: "#fff",
  },
});
