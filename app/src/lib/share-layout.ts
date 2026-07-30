/**
 * 공유 카드의 좌표표 — 렌더(`components/share-card.tsx`)와 분리해 둔다.
 *
 * SVG에는 레이아웃 엔진이 없어 모든 위치가 **1080 기준 절대값**이다. 그래서 좌표가 코드에
 * 섞여 있으면 "글자가 겹치나?"를 눈으로만 확인하게 되고, 그건 실기기 빌드 20분을 태운 뒤에야
 * 알 수 있다. 상수를 여기 모아두면 `scripts/check-share-card.ts`가 node에서 최악 케이스
 * (마라톤 거리·20자 러너 네임·3시간 러닝)를 **산술로 검산**할 수 있다.
 *
 * ⚠️ React Native에 의존하지 않는다 — 검산 스크립트가 그대로 import 한다.
 */

/** 캔버스 — 인스타 기준. 정사각 1080, 스토리 1080×1920. */
export const CARD_W = 1080;

export type CardRatio = "1:1" | "9:16";

export function cardHeight(ratio: CardRatio): number {
  return ratio === "1:1" ? 1080 : 1920;
}

/** 온보딩에 있는 그 문장. 마스코트 이름(오키)이 여기서 나온 말이라 슬로건째로 쓴다. */
export const SLOGAN = "오늘 5키로, 오키?";

/** 링 한 바퀴 = 10km. 러닝 목록의 `DistanceThumb`과 같은 기준이라 앱과 카드가 같은 말을 한다. */
export const RING_FULL_KM = 10;

export type CardLayout = {
  pad: number;
  headY: number;
  wordSize: number;
  /** 러너 네임(1줄) / 날짜(2줄) — 한 줄에 이어붙이면 20자 이름이 헤더를 통째로 먹는다 */
  nameSize: number;
  dateY: number;
  metaSize: number;
  visualCy: number;
  visualR: number;
  labelY: number;
  labelSize: number;
  numY: number;
  numSize: number;
  unitSize: number;
  statLabelY: number;
  statValY: number;
  statLabelSize: number;
  statValSize: number;
  statUnitSize: number;
  sloganY: number;
  sloganSize: number;
  strokeW: number;
};

/** 비율별 좌표표. 9:16은 세로가 남으니 그래픽을 키우고 여백을 넓게 쓴다. */
export function layoutFor(ratio: CardRatio): CardLayout {
  if (ratio === "1:1") {
    return {
      pad: 88, headY: 104, wordSize: 54, nameSize: 34, dateY: 150, metaSize: 30,
      visualCy: 372, visualR: 150,
      labelY: 610, labelSize: 34,
      numY: 766, numSize: 160, unitSize: 58,
      statLabelY: 856, statValY: 918, statLabelSize: 28, statValSize: 50, statUnitSize: 30,
      sloganY: 1000, sloganSize: 30,
      strokeW: 12,
    };
  }
  return {
    pad: 96, headY: 172, wordSize: 64, nameSize: 40, dateY: 226, metaSize: 34,
    visualCy: 660, visualR: 250,
    labelY: 1060, labelSize: 40,
    numY: 1252, numSize: 200, unitSize: 70,
    statLabelY: 1364, statValY: 1440, statLabelSize: 32, statValSize: 60, statUnitSize: 36,
    // 슬로건은 푸터다. 1800에 두니 스탯과 360px이나 벌어져 카드 아래가 텅 비어 보였고
    // (실기기 캡처), 인스타 스토리는 **하단 250px가량이 답장창 UI에 가린다** — 둘 다 피한다.
    sloganY: 1640, sloganSize: 38,
    strokeW: 16,
  };
}
