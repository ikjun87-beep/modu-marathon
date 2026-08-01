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

/**
 * 마일스톤 — **링이 꽉 찬 뒤부터 자랑의 크기를 대신 싣는 눈금.**
 *
 * 링은 10km에서 포화되고 `Math.min(…,1)`로 잘리므로 10km·하프·풀코스가 **완전히 같은 그림**
 * 이 된다(꽉 찬 원 + 12시 점). 인스타에서 카드를 보는 사람은 밑의 숫자를 읽기 전에 그림부터
 * 보는데, 그 그림이 42km와 10km를 구분하지 못했다. 링 안쪽이 비어 있었으므로 거기에 넣는다.
 *
 * ⚠️ **10km 미만에는 라벨을 두지 않는다.** 링이 아직 차는 중이라 채움 정도만으로 거리가 이미
 * 구분되고(잃는 정보가 없다), 무엇보다 60%짜리 초록 링 안에 "5K"가 앉으면 카드 아래의
 * `6.42 km`와 어긋나 보인다 — **라벨이 이 러닝의 거리라고 오독된다.** 링이 꽉 찬 골드 원 안에
 * 들어갔을 때만 메달의 각인처럼 읽힌다. 5km 자랑은 배지 카드(5K 클럽)가 따로 맡고 있다.
 *
 * ⚠️ 기준 거리를 **공식 거리(42.195 / 21.0975) 정각으로 잡지 않는다.** 수동 입력은 보통
 * "42.19"·"21.09"로 들어오고 GPS도 코스 접선 오차로 흔들려서, 정각을 요구하면 **실제 완주자가
 * 라벨을 못 받는다.** 반대로 41km를 풀코스라 부르면 거짓이 되므로 공식 거리의 -0.5%인
 * 42.0 / 21.0에서 끊는다. 10은 앱 배지(`stats.ts`의 10K 러너)와 같은 값이다.
 */
export const MILESTONES: { km: number; label: string }[] = [
  { km: 42.0, label: "풀코스" },
  { km: 21.0, label: "하프" },
  { km: RING_FULL_KM, label: "10K" },
];

/** 이 거리가 도달한 마일스톤. 못 넘겼으면 null(=링의 진행률만으로 충분히 구분된다). */
export function milestoneFor(km: number): string | null {
  for (const m of MILESTONES) if (km >= m.km) return m.label;
  return null;
}

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
  /** 배지 카드에서 주인공이 되는 배지 이름("10K 러너") — 거리 숫자 자리를 그대로 쓴다.
   *  한글이라 숫자만큼 크게 뽑으면 답답해서 한 단계 줄인다. */
  badgeNameSize: number;
  /** 거리 링 안쪽의 마일스톤 라벨("풀코스"). 링 지름 - 선 굵기 안에 들어가야 한다. */
  milestoneSize: number;
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
      numY: 766, numSize: 160, unitSize: 58, badgeNameSize: 116, milestoneSize: 76,
      statLabelY: 856, statValY: 918, statLabelSize: 28, statValSize: 50, statUnitSize: 30,
      sloganY: 1000, sloganSize: 30,
      strokeW: 12,
    };
  }
  return {
    pad: 96, headY: 172, wordSize: 64, nameSize: 40, dateY: 226, metaSize: 34,
    visualCy: 660, visualR: 250,
    labelY: 1060, labelSize: 40,
    numY: 1252, numSize: 200, unitSize: 70, badgeNameSize: 146, milestoneSize: 126,
    statLabelY: 1364, statValY: 1440, statLabelSize: 32, statValSize: 60, statUnitSize: 36,
    // 슬로건은 푸터다. 1800에 두니 스탯과 360px이나 벌어져 카드 아래가 텅 비어 보였고
    // (실기기 캡처), 인스타 스토리는 **하단 250px가량이 답장창 UI에 가린다** — 둘 다 피한다.
    sloganY: 1640, sloganSize: 38,
    strokeW: 16,
  };
}
