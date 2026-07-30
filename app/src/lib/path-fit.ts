/**
 * GPS 경로를 정사각/직사각 박스에 맞춰 그리기 위한 좌표 변환.
 *
 * `RouteThumb`(러닝 목록 44px 썸네일)와 공유 카드(1080px)가 **같은 그림**을 그려야 한다.
 * 같은 러닝인데 목록과 공유 이미지에서 경로 모양이 다르면 그건 버그로 읽힌다 —
 * 그래서 축척·cos 보정·중앙정렬을 한 곳에 모았다.
 *
 * 위경도를 그대로 쓰면 경로가 찌그러진다: 경도 1도의 실제 길이는 위도에 따라 짧아지고
 * (고위도일수록 더), y축은 SVG에서 아래로 증가하므로 북쪽이 위로 가도록 뒤집어야 한다.
 */
import type { LatLng } from "./run";

export type FitResult = {
  /** `<Polyline points>` 에 그대로 넣는 문자열 */
  points: string;
  /** 출발점 좌표 — 경로를 읽는 기준점으로 점을 찍는다 */
  start: { x: number; y: number };
  /** 도착점 좌표 — 큰 캔버스에서는 시작/끝을 구분해줘야 방향이 읽힌다 */
  end: { x: number; y: number };
};

/**
 * 점을 솎아낸다 — GPS는 1초 간격이라 1시간 러닝이면 3,600점이다.
 * 44px 썸네일에서도 1080px 카드에서도 그 해상도는 **눈에 보이지 않는데** 폴리라인
 * 문자열만 수십 KB가 되고 렌더가 무거워진다(목록은 행마다 그린다). 첫·끝은 반드시 남긴다 —
 * 출발점·도착점 표시가 거기 붙기 때문이다.
 */
function downsample(path: LatLng[], max: number): LatLng[] {
  if (path.length <= max) return path;
  const step = (path.length - 1) / (max - 1);
  const out: LatLng[] = [];
  for (let i = 0; i < max - 1; i++) out.push(path[Math.round(i * step)]);
  out.push(path[path.length - 1]);
  return out;
}

/**
 * @param path  GPS 좌표 배열(2점 이상)
 * @param size  그릴 정사각 박스 한 변(px)
 * @param pad   박스 안쪽 여백(px) — 선이 모서리에 붙지 않게. **선 굵기의 절반 이상**을 줄 것
 *              (폴리라인은 좌표를 중심으로 그려져 굵기의 절반이 박스 밖으로 나간다)
 * @param ox,oy 박스의 좌상단 오프셋(캔버스 안에 배치할 때)
 * @param maxPoints 그릴 점의 상한
 */
export function fitPath(
  path: LatLng[],
  size: number,
  pad: number,
  ox = 0,
  oy = 0,
  maxPoints = 400,
): FitResult {
  const box = size - pad * 2;
  const pts = downsample(path, maxPoints);

  const lats = pts.map((p) => p.lat);
  const lngs = pts.map((p) => p.lng);
  const minLat = Math.min(...lats), maxLat = Math.max(...lats);
  const minLng = Math.min(...lngs), maxLng = Math.max(...lngs);
  const cos = Math.cos(((minLat + maxLat) / 2) * (Math.PI / 180)) || 1;
  const spanLat = Math.max(maxLat - minLat, 1e-6);
  const spanLng = Math.max((maxLng - minLng) * cos, 1e-6);
  // 가로세로 중 큰 쪽에 맞춰 **등비 축소** — 축마다 다르게 늘리면 실제 코스 모양이 아니게 된다.
  const scale = box / Math.max(spanLat, spanLng);
  const offX = (box - spanLng * scale) / 2;
  const offY = (box - spanLat * scale) / 2;

  const px = (p: LatLng) => ox + pad + offX + (p.lng - minLng) * cos * scale;
  const py = (p: LatLng) => oy + pad + offY + (maxLat - p.lat) * scale;

  const points = pts.map((p) => `${px(p).toFixed(1)},${py(p).toFixed(1)}`).join(" ");
  const first = pts[0];
  const last = pts[pts.length - 1];

  return {
    points,
    start: { x: px(first), y: py(first) },
    end: { x: px(last), y: py(last) },
  };
}
