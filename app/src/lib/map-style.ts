/**
 * 구글맵 스타일 — **지도는 장식이 아니라 정보**다.
 *
 * ## 2026-07-31 전면 재작업 (회장 지시)
 * 이전엔 브랜드 톤에 맞춘 "파스텔 종이 지도"였다. 그런데 실기기에서 보니 배경(크림 #f6f2ec)과
 * 도로(흰색)의 밝기 차이가 거의 없고, **도로·지명 라벨을 전부 꺼놔서** 내가 어디를 달리는지
 * 알 수 없는 지도가 됐다. 회장이 통근버스 앱(구글 기본 지도)을 보여주며 "저기는 또렷한데
 * 여기도 그렇게 하자"고 지적한 게 정확히 이 지점이다.
 *
 * 러닝 중에 지도가 답해야 하는 질문은 하나다 — **"내가 지금 어디쯤인가."**
 * 그 답을 주는 건 지명·도로·하천·공원이지 파스텔 색조가 아니다. Strava·NRC가 표준 지도를
 * 쓰는 이유도 같다. 브랜드 톤은 지도 위에 얹히는 UI(버튼·카드·경로선)가 담당하면 된다.
 *
 * 그래서 **거의 기본 지도**로 두고, 러닝에 방해되는 잡음만 걷어낸다:
 *  - 상점·회사 아이콘 → 끔(카페 로고가 경로를 가린다)
 *  - 땅 경계선(land_parcel) → 끔(줌인하면 격자가 지저분하다)
 *  - 대중교통 아이콘 → 끔(단 역 이름은 남긴다 — 위치를 가늠하는 좋은 랜드마크다)
 * **지명·도로 라벨·하천·공원은 전부 살린다.**
 *
 * 되돌리려면 아래 `MAP_STYLE_PASTEL`을 `MAP_STYLE` 자리에 넣으면 된다.
 */
export const MAP_STYLE = [
  // 상점·회사 로고는 러닝 중엔 잡음이고 경로선을 가린다. 관광지·공원 같은 큰 지점은 남긴다.
  { featureType: "poi.business", stylers: [{ visibility: "off" }] },
  { featureType: "poi.attraction", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  // 대중교통은 아이콘만 끄고 **이름은 남긴다** — "○○역 근처"가 위치 감각에 크게 도움이 된다.
  { featureType: "transit", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  // 지적선(땅 경계)은 줌인할수록 격자처럼 깔려 지저분하다. 동네 이름은 그대로 둔다.
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
];

/**
 * 이전 파스텔 스타일 — 보관용. 브랜드 톤은 예뻤지만 **정보가 사라져** 폐기했다(위 주석 참조).
 * 지도를 다시 브랜드 톤으로 만들고 싶어지면, 최소한 아래는 지키고 손볼 것:
 *  ① 배경과 도로의 명도 차이를 확보할 것(둘 다 밝으면 도로가 안 보인다)
 *  ② 도로·지명 라벨을 끄지 말 것(끄는 순간 지도가 아니라 무늬가 된다)
 */
export const MAP_STYLE_PASTEL = [
  { elementType: "geometry", stylers: [{ color: "#f6f2ec" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#9a9186" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#f6f2ec" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.neighborhood", stylers: [{ visibility: "off" }] },
  { featureType: "poi", stylers: [{ visibility: "off" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#dce9d2" }] },
  { featureType: "poi.park", elementType: "labels.text", stylers: [{ visibility: "off" }] },
  { featureType: "road", elementType: "geometry", stylers: [{ color: "#ffffff" }] },
  { featureType: "road", elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { featureType: "road.arterial", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#fce3d2" }] },
  { featureType: "road.highway", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "road.local", elementType: "labels", stylers: [{ visibility: "off" }] },
  { featureType: "transit", stylers: [{ visibility: "off" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#bfe0ee" }] },
  { featureType: "water", elementType: "labels.text", stylers: [{ visibility: "off" }] },
];
