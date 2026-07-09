/**
 * Icon — 웹(web/index.html)의 SVG 스프라이트와 1:1로 맞춘 통일 라인 아이콘.
 * 24 그리드 · stroke 1.75 · round cap/join · currentColor. 이모지 대신 이걸 쓴다.
 * i-run은 brand/mark.svg 러너 실루엣을 재현 → 앱·웹·워치 아이덴티티 일치.
 */
import Svg, { Circle, Path } from "react-native-svg";

import { Brand } from "@/lib/brand";

export type IconName =
  | "run"
  | "activity"
  | "calendar"
  | "camera"
  | "watch"
  | "users"
  | "flag"
  | "gauge"
  | "shield"
  | "check"
  | "bell"
  | "pin"
  | "heart"
  | "chat"
  | "award"
  | "close"
  | "trash"
  | "plus"
  | "play"
  | "pause"
  | "stop"
  | "user"
  | "chevron-right"
  | "chevron-left";

type Props = {
  name: IconName;
  size?: number;
  color?: string;
  strokeWidth?: number;
};

export function Icon({ name, size = 24, color = Brand.ink, strokeWidth = 1.75 }: Props) {
  const s = {
    stroke: color,
    strokeWidth,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
    fill: "none" as const,
  };
  const filled = { fill: color, stroke: "none" as const };

  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      {name === "run" && (
        <>
          <Circle cx={16.1} cy={4.9} r={2} {...filled} />
          <Path
            {...s}
            d="M15 7.1 10.1 11.6M14.6 7.9 18 8.25M14.6 7.9 11.6 5.6M10.1 11.6 13.1 13.9 14.6 18M10.1 11.6 8.6 15.75 6 17.25"
          />
        </>
      )}
      {name === "activity" && <Path {...s} d="M3 12h4l2.5-7 4 14 2.5-7h5" />}
      {name === "calendar" && (
        <>
          <Path {...s} d="M3 8a3 3 0 013-3h12a3 3 0 013 3v10a3 3 0 01-3 3H6a3 3 0 01-3-3V8z" />
          <Path {...s} d="M3 10h18M8 3v4M16 3v4" />
        </>
      )}
      {name === "camera" && (
        <>
          <Path
            {...s}
            d="M3 8a1 1 0 011-1h2.5l1.2-1.8A1 1 0 019 4.7h6a1 1 0 01.8.5L17 7h3a1 1 0 011 1v11a1 1 0 01-1 1H4a1 1 0 01-1-1V8z"
          />
          <Circle {...s} cx={12} cy={13} r={3.4} />
        </>
      )}
      {name === "watch" && (
        <>
          <Path {...s} d="M7 10a3 3 0 013-3h4a3 3 0 013 3v4a3 3 0 01-3 3h-4a3 3 0 01-3-3v-4z" />
          <Path {...s} d="M9.5 7l.7-3h3.6l.7 3M9.5 17l.7 3h3.6l.7-3M12 10.2v2.3l1.6 1" />
        </>
      )}
      {name === "users" && (
        <>
          <Circle {...s} cx={9} cy={8} r={3.2} />
          <Path {...s} d="M3.4 20a5.6 5.6 0 0111.2 0" />
          <Path {...s} d="M16 5.2a3.2 3.2 0 010 5.7M17.6 14.3A5.6 5.6 0 0121 20" />
        </>
      )}
      {name === "flag" && <Path {...s} d="M6 21V4M6 4h11l-2.2 3.2L17 10.5H6" />}
      {name === "gauge" && (
        <>
          <Path {...s} d="M4.5 17a7.5 7.5 0 0115 0" />
          <Path {...s} d="M12 17l3.6-3.4" />
          <Circle cx={12} cy={17} r={1.3} {...filled} />
        </>
      )}
      {name === "shield" && (
        <>
          <Path {...s} d="M12 3l7 2.5v5.6c0 4.4-3 7.4-7 8.4-4-1-7-4-7-8.4V5.5L12 3z" />
          <Path {...s} d="M9 11.5l2 2 4-4" />
        </>
      )}
      {name === "check" && <Path {...s} d="M20 6L9 17l-5-5" />}
      {name === "bell" && (
        <>
          <Path {...s} d="M18 9a6 6 0 10-12 0c0 6.5-2.5 8-2.5 8h17S18 15.5 18 9z" />
          <Path {...s} d="M13.7 21a2 2 0 01-3.4 0" />
        </>
      )}
      {name === "pin" && (
        <>
          <Path {...s} d="M20 10c0 5.5-8 12-8 12s-8-6.5-8-12a8 8 0 1116 0z" />
          <Circle {...s} cx={12} cy={10} r={2.6} />
        </>
      )}
      {name === "heart" && (
        <Path
          {...s}
          d="M20.8 6.6a4.6 4.6 0 00-7.7-2L12 5.7l-1.1-1.1a4.6 4.6 0 10-6.5 6.5L12 21l7.6-8a4.6 4.6 0 001.2-6.4z"
        />
      )}
      {name === "chat" && (
        <Path {...s} d="M21 11.5A8 8 0 019.5 18.7L4 20l1.3-4.5A8 8 0 1121 11.5z" />
      )}
      {name === "award" && (
        <>
          <Circle {...s} cx={12} cy={8} r={5} />
          <Path {...s} d="M8.4 12.3 7 21l5-2.8L17 21l-1.4-8.7" />
        </>
      )}
      {name === "close" && <Path {...s} d="M6 6l12 12M18 6L6 18" />}
      {name === "trash" && (
        <Path {...s} d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2M6 7l1 13h10l1-13M10 11v6M14 11v6" />
      )}
      {name === "plus" && <Path {...s} d="M12 5v14M5 12h14" />}
      {name === "play" && <Path {...filled} d="M7 5l12 7-12 7z" />}
      {name === "pause" && <Path {...s} strokeWidth={3} d="M9 5v14M15 5v14" />}
      {name === "stop" && (
        <Path {...filled} d="M7 7a1 1 0 011-1h8a1 1 0 011 1v8a1 1 0 01-1 1H8a1 1 0 01-1-1V7z" />
      )}
      {name === "user" && (
        <>
          <Circle {...s} cx={12} cy={8} r={4} />
          <Path {...s} d="M4.5 20a7.5 7.5 0 0115 0" />
        </>
      )}
      {name === "chevron-right" && <Path {...s} d="M9 6l6 6-6 6" />}
      {name === "chevron-left" && <Path {...s} d="M15 6l-6 6 6 6" />}
    </Svg>
  );
}
