/**
 * 글자 폭 계측 — SVG로 그리는 화면(공유 카드)에는 레이아웃 엔진이 없다.
 *
 * RN은 텍스트를 나란히 놓으면 알아서 밀어주지만 SVG는 좌표를 직접 줘야 한다. 거리 숫자
 * 뒤에 "km"을 붙이려면 **숫자 블록의 실제 폭**을 알아야 하고, 그 값을 눈대중 상수로 두면
 * 9.87 → 12.34로 바뀔 때 글자가 겹친다. 그래서 폰트 파일에서 직접 실측한 값을 쓴다.
 *
 * 측정: `python3 scripts/font-advance.py assets/fonts/<폰트>.ttf "측정할글자들"`
 * (TTF의 `hmtx` 테이블에서 advance width를 읽어 em 비율로 출력한다)
 *
 * ⚠️ 이 파일은 **React Native에 의존하지 않는다** — `scripts/check-share-card.ts`가
 * node에서 그대로 불러 레이아웃을 검산할 수 있어야 하기 때문이다.
 */

const ADV = {
  /** Black Han Sans — **숫자가 전부 0.600em**(tabular). 한글은 0.819~0.840이라 평균으로 근사한다. */
  display: {
    hangul: 0.835,
    digit: 0.6,
    ".": 0.267, ":": 0.307, "'": 0.26, '"': 0.37, " ": 0.3, "/": 0.508,
    "…": 1.0, "·": 0.333,
    k: 0.672, m: 1.025, b: 0.714, p: 0.714,
    other: 0.72,
  } as Record<string, number>,
  /** LINESeed Bold — 한글은 전 음절이 0.883em로 같다(고정폭 한글). 숫자는 가변폭.
   *  Regular는 숫자가 0.01~0.02em 더 좁을 뿐이라 이 표로 함께 계산한다
   *  (**넓게 추정 = 안전한 방향** — 말줄임이 조금 일찍 걸릴 뿐 글자가 밀려나지 않는다). */
  bold: {
    hangul: 0.883,
    digits: [0.669, 0.43, 0.616, 0.618, 0.66, 0.618, 0.609, 0.581, 0.642, 0.608],
    ".": 0.27, ":": 0.27, "'": 0.27, '"': 0.461, " ": 0.22, "/": 0.438,
    "…": 1.0, "·": 0.333,
    k: 0.594, m: 0.942, b: 0.641, p: 0.641,
    other: 0.62,
  },
} as const;

export type TypeFace = "display" | "bold";

/** 문자열의 렌더 폭(px). 카드에서 쓰는 두 서체만 지원한다. */
export function textWidth(text: string, fontSize: number, face: TypeFace): number {
  let em = 0;
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    const isHangul = code >= 0xac00 && code <= 0xd7a3;
    const isDigit = ch >= "0" && ch <= "9";
    if (face === "display") {
      const t = ADV.display;
      em += isHangul ? t.hangul : isDigit ? t.digit : (t[ch] ?? t.other);
    } else {
      const t: Record<string, number> = ADV.bold as unknown as Record<string, number>;
      em += isHangul
        ? ADV.bold.hangul
        : isDigit
          ? ADV.bold.digits[code - 48]
          : (t[ch] ?? ADV.bold.other);
    }
  }
  return em * fontSize;
}

/** 폭 예산에 맞춰 자르고 말줄임 — 러너 네임은 20자까지 가능해 카드 헤더를 넘길 수 있다. */
export function ellipsize(text: string, maxWidth: number, fontSize: number, face: TypeFace): string {
  if (textWidth(text, fontSize, face) <= maxWidth) return text;
  const dots = textWidth("…", fontSize, face);
  let out = "";
  for (const ch of text) {
    if (textWidth(out + ch, fontSize, face) + dots > maxWidth) break;
    out += ch;
  }
  return out + "…";
}
