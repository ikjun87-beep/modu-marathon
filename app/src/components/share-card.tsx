/**
 * 공유 카드 — 러닝 기록을 인스타·카톡에 올릴 이미지로 그린다.
 *
 * `docs/DESIGN.md` "앱 디자인 큐"에서 **최고 ROI**로 두 번 지목되고도 미구현이던 항목이다
 * (NRC·adidas가 확산의 주 동력으로 쓰는 것). 러닝은 혼자 하지만 자랑은 밖에서 한다 —
 * 앱 안에서만 예쁜 화면은 크루를 늘리지 못한다.
 *
 * ## 이 파일이 SVG인 이유
 * 화면 캡처가 아니라 **1080px 원본을 새로 그린다**. 캡처였다면 해상도가 기기 화면 밀도에
 * 묶여(테스트폰은 320dp 폭) 인스타에서 흐려진다. 자세한 근거는 `lib/share-image.ts` 주석.
 *
 * ## 레이아웃 규칙 (SVG엔 레이아웃 엔진이 없다)
 * 모든 좌표는 **1080 기준 절대값**이고, 텍스트를 나란히 놓을 때는 `textWidth()`로 폰트에서
 * 실측한 폭을 계산해 붙인다. 눈대중 상수를 쓰면 거리가 9.87 → 12.34로 바뀔 때 "km"이 겹친다.
 *
 * ## 두 가지 배경 모드
 * - **크림**(기본): 브랜드 팔레트 그대로. 인스타 피드에서 다크 카드는 흔하고 크림+그린은 드물다.
 * - **사진**: 크루 단체사진 위에 다크 그라디언트. 텍스트를 흰색으로 바꾸고 단위는 `brandOnDark`
 *   (라이트용 그린을 어두운 면에 얹으면 AA 미달 — 세션8·9에서 두 번 잡힌 함정이다).
 *
 * ⚠️ **다크 카드 = 랭킹 시상대 전용** 규칙은 앱 화면(탭) 이야기다. 공유 카드는 앱 밖으로
 * 나가는 이미지라 그 규칙의 대상이 아니다 — 대신 사진 모드에서만 어두워진다.
 */
import { forwardRef } from "react";
import Svg, {
  Circle,
  Defs,
  G,
  Image as SvgImage,
  LinearGradient,
  Polyline,
  Rect,
  Stop,
  Text as SvgText,
} from "react-native-svg";

import { Icon, type IconName } from "@/components/icon";
import { Brand, FONT, FONT_DISPLAY } from "@/lib/brand";
import { fmtDate, type Row } from "@/lib/crew";
import type { Badge } from "@/lib/stats";
import { fitPath } from "@/lib/path-fit";
import { fmtDuration, isWalk, paceLabel, type LatLng } from "@/lib/run";
import {
  CARD_W,
  cardHeight,
  layoutFor,
  RING_FULL_KM,
  SLOGAN,
  type CardRatio,
} from "@/lib/share-layout";
import { ellipsize, textWidth } from "@/lib/text-metrics";

export { CARD_W, cardHeight, type CardRatio };

type Palette = {
  bg: string;
  word: string;
  name: string;
  meta: string;
  label: string;
  num: string;
  unit: string;
  route: string;
  routeTrack: string;
  dot: string;
  slogan: string;
};

/** 사진을 깔면 배경 밝기를 우리가 통제할 수 없다 → 다크 그라디언트를 깔고 텍스트를 흰색으로 뒤집는다. */
function paletteFor(hasPhoto: boolean): Palette {
  if (!hasPhoto) {
    return {
      bg: Brand.bg,
      word: Brand.brand,
      // 러너 네임까지 브랜드색으로 두면 워드마크와 같은 무게가 돼 "누가 뛰었나"가 로고처럼 읽힌다.
      name: Brand.ink,
      meta: Brand.soft,
      label: Brand.soft,
      num: Brand.ink,
      unit: Brand.brand,
      route: Brand.brand,
      routeTrack: Brand.line2,
      dot: Brand.gold,
      slogan: Brand.soft,
    };
  }
  return {
    bg: Brand.dark,
    word: "#ffffff",
    name: "#ffffff",
    meta: "rgba(255,255,255,0.82)",
    label: "rgba(255,255,255,0.82)",
    num: "#ffffff",
    unit: Brand.brandOnDark, // ⚠️ 어두운 면 전용. Brand.brand를 여기 쓰면 AA 미달이다.
    route: "#ffffff",
    routeTrack: "rgba(255,255,255,0.28)",
    dot: Brand.gold,
    slogan: "rgba(255,255,255,0.72)",
  };
}

/**
 * 카드가 무엇을 자랑하는가.
 *
 * 러닝만 공유할 수 있으면 자랑 동기가 가장 큰 순간 — **배지를 딴 그 순간** — 을 놓친다.
 * 두 종류가 프레임(워드마크·이름·날짜·슬로건·사진 배경)을 공유하고 가운데 내용만 갈린다.
 */
export type ShareSubject =
  | {
      kind: "run";
      run: Row;
      /** 이 기기에 저장된 GPS 경로. 있으면 경로를, 없으면 거리 링을 그린다. */
      path?: LatLng[] | null;
    }
  | {
      kind: "badge";
      badge: Badge;
      name: string;
      /** 획득 시각(epoch ms). 매 렌더 `Date.now()`를 부르면 날짜가 흔들려 호출부에서 고정해 넘긴다. */
      earnedAt: number;
    };

export type ShareCardProps = {
  subject: ShareSubject;
  /** 배경 사진 — `data:image/...;base64,...` 형태. 갤러리 업로드와 같은 방식. */
  photo?: string | null;
  ratio: CardRatio;
  /** 화면 미리보기 폭(px). 파일은 항상 1080으로 뽑히므로 여기 값은 화질과 무관하다. */
  previewWidth: number;
};

export const ShareCard = forwardRef<Svg, ShareCardProps>(function ShareCard(
  { subject, photo, ratio, previewWidth },
  ref,
) {
  const H = cardHeight(ratio);
  const L = layoutFor(ratio);
  const P = paletteFor(!!photo);
  const right = CARD_W - L.pad;
  const isBadge = subject.kind === "badge";

  const run = subject.kind === "run" ? subject.run : null;
  const path = subject.kind === "run" ? subject.path : null;

  const km = Number(run?.distanceKm) || 0;
  const sec = Number(run?.durationSec) || (Number(run?.durationMin) || 0) * 60;
  const hr = run?.avgHr ? Math.round(Number(run.avgHr)) : null;
  const gain = run?.elevationGainM ? Math.round(Number(run.elevationGainM)) : null;
  const walk = !!run && isWalk(run);

  // 개별 러닝 기록이므로 **소수점 2자리**(집계·요약은 1자리) — lib/run.ts의 표기 규칙.
  const kmText = km.toFixed(2);
  const pace = paceLabel(km, sec);
  const hasPaceUnit = pace.endsWith("/km");

  // 숫자=본문색 + 단위=브랜드색. 앱 전 화면과 같은 문법이라 카드가 앱의 연장으로 읽힌다.
  const stats: { label: string; value: string; unit?: string }[] = [
    { label: "시간", value: fmtDuration(sec) },
    {
      label: "평균 페이스",
      value: hasPaceUnit ? pace.slice(0, -3) : pace,
      unit: hasPaceUnit ? "/km" : undefined,
    },
  ];
  if (hr) stats.push({ label: "평균 심박", value: String(hr), unit: "bpm" });
  else if (gain) stats.push({ label: "상승고도", value: String(gain), unit: "m" });

  // 헤더 우측 = 이름(1줄) + 날짜(2줄). 한 줄에 "이름 · 날짜"로 이어붙였더니 20자 러너 네임이
  // 헤더를 통째로 먹고 워드마크에 붙었다(scripts/check-share-card.ts가 잡음).
  const dateText = fmtDate(isBadge ? subject.earnedAt : run!.startedAt ?? run!.createdAt);
  const wordW = textWidth("5키로", L.wordSize, "display");
  const nameBudget = CARD_W - L.pad * 2 - wordW - 40;
  const nameText = ellipsize(
    String((isBadge ? subject.name : run!.name) ?? ""),
    nameBudget,
    L.nameSize,
    "bold",
  );

  const hasPath = !isBadge && !!path && path.length > 1;
  // 여백 = 선 굵기 + 끝점 원 반지름. 폴리라인은 좌표를 중심으로 그려지므로 0을 주면
  // 코스가 박스에 딱 붙는 러닝에서 선 절반과 출발점 원이 밖으로 삐져나간다.
  const fit = hasPath
    ? fitPath(
        path!,
        L.visualR * 2,
        L.strokeW * 2,
        CARD_W / 2 - L.visualR,
        L.visualCy - L.visualR,
      )
    : null;

  // 거리 링 — 경로가 없는 기록(직접 입력·워치)도 카드가 허전하지 않아야 한다.
  const ringFrac = Math.min(km / RING_FULL_KM, 1);
  const circ = 2 * Math.PI * L.visualR;

  return (
    <Svg
      ref={ref}
      width={previewWidth}
      height={(previewWidth * H) / CARD_W}
      viewBox={`0 0 ${CARD_W} ${H}`}
    >
      <Defs>
        {/* 스크림 — 텍스트 블록(라벨은 캔버스 높이의 약 55% 지점에서 시작)부터 확실히 어두워야
            한다. 사진이 하늘처럼 밝으면 흰 글자가 그대로 날아간다. 상단도 헤더 가독을 위해
            완전 투명으로 두지 않는다. */}
        <LinearGradient id="scrim" x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor="#171c12" stopOpacity="0.3" />
          <Stop offset="0.35" stopColor="#171c12" stopOpacity="0.34" />
          <Stop offset="0.55" stopColor="#171c12" stopOpacity="0.72" />
          <Stop offset="1" stopColor="#171c12" stopOpacity="0.95" />
        </LinearGradient>
      </Defs>

      <Rect x={0} y={0} width={CARD_W} height={H} fill={P.bg} />
      {photo ? (
        <>
          {/* slice = 비율 유지하며 꽉 채우기(잘림 허용). 세로 카드에 가로 사진을 넣어도 여백이 안 생긴다. */}
          <SvgImage
            x={0} y={0} width={CARD_W} height={H}
            href={{ uri: photo }}
            preserveAspectRatio="xMidYMid slice"
          />
          <Rect x={0} y={0} width={CARD_W} height={H} fill="url(#scrim)" />
        </>
      ) : null}

      {/* 헤더 — 워드마크는 웹·앱과 같은 Black Han Sans라 시각 DNA가 이어진다 */}
      <SvgText
        x={L.pad} y={L.headY}
        fontFamily={FONT_DISPLAY} fontSize={L.wordSize} fill={P.word}
      >
        5키로
      </SvgText>
      <SvgText
        x={right} y={L.headY} textAnchor="end"
        fontFamily={FONT} fontWeight="700" fontSize={L.nameSize} fill={P.name}
      >
        {nameText}
      </SvgText>
      <SvgText
        x={right} y={L.dateY} textAnchor="end"
        fontFamily={FONT} fontSize={L.metaSize} fill={P.meta}
      >
        {dateText}
      </SvgText>

      {/* 비주얼 — 경로가 있으면 "내가 그린 그림", 없으면 10km 기준 거리 링 */}
      {fit ? (
        <G>
          <Polyline
            points={fit.points}
            fill="none"
            stroke={P.route}
            strokeWidth={L.strokeW}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          {/* 시작=골드 채움 / 도착=속 빈 원. 큰 캔버스에서는 방향이 읽혀야 코스가 이해된다. */}
          <Circle cx={fit.start.x} cy={fit.start.y} r={L.strokeW * 1.5} fill={P.dot} />
          <Circle
            cx={fit.end.x} cy={fit.end.y} r={L.strokeW * 1.5}
            fill={P.bg} stroke={P.route} strokeWidth={L.strokeW * 0.7}
          />
        </G>
      ) : isBadge ? (
        // 배지는 성취라 **골드가 규칙상 허용되는 자리**(골드 = 순위·챌린지·성과 전용).
        // 거리 링과 달리 진행률이 없으므로 원을 꽉 채워 그린다.
        <G>
          <Circle
            cx={CARD_W / 2} cy={L.visualCy} r={L.visualR}
            fill="none" stroke={Brand.gold} strokeWidth={L.strokeW * 1.6}
          />
          {/* 배지 아이콘 — 앱에서 쓰는 것과 같은 라인 아이콘을 그대로 얹는다(중첩 Svg). */}
          <G
            transform={`translate(${CARD_W / 2 - L.visualR * 0.62}, ${L.visualCy - L.visualR * 0.62})`}
          >
            <Icon
              name={subject.badge.icon as IconName}
              size={L.visualR * 1.24}
              color={Brand.gold}
              strokeWidth={1.4}
            />
          </G>
        </G>
      ) : photo ? null : ( // 사진이 있으면 링을 그리지 않는다 — 실기기에서 링이 피사체 얼굴을
        // 가로질렀다. 사진을 넣었다는 건 "이 순간을 보여주겠다"는 뜻이라 그래픽이 주인공을
        // 가리면 안 된다. (경로는 정보 가치가 있어 사진 위에도 그대로 그린다.)
        <G>
          <Circle
            cx={CARD_W / 2} cy={L.visualCy} r={L.visualR}
            fill="none" stroke={P.routeTrack} strokeWidth={L.strokeW * 1.6}
          />
          <Circle
            cx={CARD_W / 2} cy={L.visualCy} r={L.visualR}
            fill="none" stroke={P.route} strokeWidth={L.strokeW * 1.6}
            strokeLinecap="round"
            strokeDasharray={`${circ * ringFrac} ${circ}`}
            // 12시에서 시작해 시계방향으로 채운다(기본은 3시 시작).
            transform={`rotate(-90 ${CARD_W / 2} ${L.visualCy})`}
          />
          {/* 아직 안 뛴 거리가 있어도 링이 "비어 보이지" 않도록 출발점을 찍는다 */}
          <Circle cx={CARD_W / 2} cy={L.visualCy - L.visualR} r={L.strokeW * 1.1} fill={P.dot} />
        </G>
      )}

      {isBadge ? (
        <>
          {/* 배지 — 주인공은 배지 이름. "무엇을 해냈나"가 한 줄로 읽혀야 공유가 의미를 가진다. */}
          <SvgText
            x={L.pad} y={L.labelY}
            fontFamily={FONT} fontWeight="700" fontSize={L.labelSize * 0.78}
            letterSpacing={4} fill={Brand.gold}
          >
            배지 획득
          </SvgText>
          <SvgText
            x={L.pad} y={L.numY}
            fontFamily={FONT_DISPLAY} fontSize={L.badgeNameSize} fill={P.num}
          >
            {subject.badge.label}
          </SvgText>
          <SvgText
            x={L.pad} y={L.statLabelY + L.statLabelSize * 0.4}
            fontFamily={FONT} fontSize={L.labelSize} fill={P.label}
          >
            {subject.badge.desc}
          </SvgText>
        </>
      ) : (
        <>
          {/* 거리 — 카드의 주인공. 목록에서 회색 링·태그로 구분하던 걷기를 여기서도 라벨로 잇는다. */}
          <SvgText
            x={L.pad} y={L.labelY}
            fontFamily={FONT} fontSize={L.labelSize} fill={P.label}
          >
            {walk ? "이번 걷기 거리" : "이번 러닝 거리"}
          </SvgText>
          <SvgText
            x={L.pad} y={L.numY}
            fontFamily={FONT_DISPLAY} fontSize={L.numSize} fill={P.num}
          >
            {kmText}
          </SvgText>
          <SvgText
            x={L.pad + textWidth(kmText, L.numSize, "display") + L.numSize * 0.09}
            y={L.numY}
            fontFamily={FONT} fontWeight="700" fontSize={L.unitSize} fill={P.unit}
          >
            km
          </SvgText>
        </>
      )}

      {/* 스탯 3칸 — 좌측정렬 균등 분할 (배지 카드는 설명이 그 자리를 쓴다) */}
      {!isBadge && stats.map((s, i) => {
        const colW = (CARD_W - L.pad * 2) / stats.length;
        const x = L.pad + colW * i;
        return (
          <G key={s.label}>
            <SvgText x={x} y={L.statLabelY} fontFamily={FONT} fontSize={L.statLabelSize} fill={P.label}>
              {s.label}
            </SvgText>
            <SvgText
              x={x} y={L.statValY}
              fontFamily={FONT} fontWeight="700" fontSize={L.statValSize} fill={P.num}
            >
              {s.value}
            </SvgText>
            {s.unit ? (
              <SvgText
                x={x + textWidth(s.value, L.statValSize, "bold") + 8}
                y={L.statValY}
                fontFamily={FONT} fontWeight="700" fontSize={L.statUnitSize} fill={P.unit}
              >
                {s.unit}
              </SvgText>
            ) : null}
          </G>
        );
      })}

      <SvgText x={L.pad} y={L.sloganY} fontFamily={FONT} fontSize={L.sloganSize} fill={P.slogan}>
        {SLOGAN}
      </SvgText>
    </Svg>
  );
});
