/**
 * 구글맵 커스텀 스타일 — 밋밋한 기본 지도를 브랜드 톤의 "아기자기·에디토리얼" 지도로.
 * react-native-maps `<MapView customMapStyle={MAP_STYLE}>`에 주입(0원 — 의존성·키 추가 없음, 코드만).
 * 방향: 따뜻한 종이 배경 · POI/교통 잡음 제거 · 흰 도로 · 연한 파스텔 물/공원 → 오렌지 경로가 도드라짐.
 * 색은 docs/DESIGN.md 팔레트(Brand.bg/warm)와 정렬.
 */
export const MAP_STYLE = [
  { elementType: "geometry", stylers: [{ color: "#f6f2ec" }] }, // 종이 배경(Brand.bg 계열)
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9a9186" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f6f2ec" }] },

  // 행정경계·구획선 잡음 제거
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },

  // POI(상점·건물) 아이콘/라벨 전부 숨김 → 러닝에 집중되는 깔끔한 지도
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#dce9d2" }] }, // 공원은 연녹으로 살림
  { featureType: "poi.park", elementType: "labels.text", stylers: [{ visibility: "off" }] },

  // 도로: 흰 지오메트리 + 라벨 최소화(아기자기·미니멀)
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road.arterial", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#fce3d2" }] }, // 큰길은 연한 살구
  { featureType: "road.highway", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },

  { featureType: "transit", stylers: [{ visibility: "off" }] },

  // 물: 연한 파스텔 블루
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#bfe0ee" }] },
  { featureType: "water", elementType: "labels.text", stylers: [{ visibility: "off" }] },
];
