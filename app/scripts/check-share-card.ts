/**
 * 공유 카드 레이아웃 검산 — 실기기 빌드(20분) 없이 "글자가 넘치거나 겹치나"를 산술로 본다.
 *
 * SVG는 레이아웃 엔진이 없어 모든 좌표가 절대값이고, **넘친 글자는 조용히 잘린다**.
 * 그래서 최악 케이스(마라톤 거리 · 20자 러너 네임 · 6시간 러닝 · 느린 걷기 페이스)를
 * 넣고 좌우 여백과 세로 겹침을 계산으로 확인한다. 이게 통과해도 폰트가 실제로 적용됐는지는
 * 실기기 캡처로만 알 수 있다 — 이 스크립트는 **좌표 문제만** 잡는다.
 *
 * 실행: `node --experimental-strip-types scripts/check-share-card.ts`
 */
import {
  CARD_W,
  cardHeight,
  layoutFor,
  SLOGAN,
  type CardRatio,
} from "../src/lib/share-layout.ts";
import { ellipsize, textWidth } from "../src/lib/text-metrics.ts";

/** 대문자 높이 ≈ 0.73em, 디센더 ≈ 0.24em — 겹침 판정에 쓰는 근사값(둘 다 넉넉한 쪽으로 잡았다). */
const CAP = 0.73;
const DESC = 0.24;

type Box = { name: string; x: number; right: number; top: number; bottom: number };

let fails = 0;
function fail(msg: string) {
  console.log(`  ❌ ${msg}`);
  fails++;
}

/** 최악 케이스 — 실제로 나올 수 있는 값 중 가장 넓은 것들 */
const WORST = {
  km: "42.19", // 마라톤 완주
  time: "5:59:59", // 6시간 러닝
  pace: "20'00", // 느린 걷기
  hr: "189",
  name: "가".repeat(20), // 러너 네임 한계 20자
  date: "2026. 12. 31.", // ko-KR toLocaleDateString
};

function check(ratio: CardRatio, mode: "path" | "ring") {
  console.log(`\n[${ratio} · ${mode === "path" ? "경로" : "거리 링"}]`);
  const L = layoutFor(ratio);
  const H = cardHeight(ratio);
  const right = CARD_W - L.pad;
  const boxes: Box[] = [];

  const box = (name: string, x: number, w: number, baseline: number, size: number): Box => ({
    name, x, right: x + w, top: baseline - size * CAP, bottom: baseline + size * DESC,
  });

  // ── 헤더: 워드마크(좌) + 이름·날짜(우)
  const wordW = textWidth("5키로", L.wordSize, "display");
  boxes.push(box("워드마크", L.pad, wordW, L.headY, L.wordSize));

  const nameBudget = CARD_W - L.pad * 2 - wordW - 40;
  const nameText = ellipsize(WORST.name, nameBudget, L.nameSize, "bold");
  const nameW = textWidth(nameText, L.nameSize, "bold");
  const dateW = textWidth(WORST.date, L.metaSize, "bold");
  boxes.push(box("러너 네임", right - nameW, nameW, L.headY, L.nameSize));
  boxes.push(box("날짜", right - dateW, dateW, L.dateY, L.metaSize));
  if (L.pad + wordW + 24 > right - nameW) {
    fail(`워드마크(끝 ${(L.pad + wordW).toFixed(0)})와 러너 네임(시작 ${(right - nameW).toFixed(0)})이 붙는다`);
  }

  // ── 비주얼(경로/링) — 원형 기준. 경로도 같은 정사각 박스에 들어간다.
  const visTop = L.visualCy - L.visualR - L.strokeW;
  const visBottom = L.visualCy + L.visualR + L.strokeW;
  boxes.push({ name: "비주얼", x: CARD_W / 2 - L.visualR, right: CARD_W / 2 + L.visualR, top: visTop, bottom: visBottom });

  // ── 거리 라벨 + 거대 숫자 + 단위
  boxes.push(box("거리 라벨", L.pad, textWidth("이번 걷기 거리", L.labelSize, "bold"), L.labelY, L.labelSize));
  const numW = textWidth(WORST.km, L.numSize, "display");
  const unitX = L.pad + numW + L.numSize * 0.09;
  const unitW = textWidth("km", L.unitSize, "bold");
  boxes.push(box("거리 숫자", L.pad, numW + L.numSize * 0.09 + unitW, L.numY, L.numSize));
  if (unitX + unitW > right) fail(`거리 단위가 우측 여백을 넘는다 (${(unitX + unitW).toFixed(0)} > ${right})`);

  // ── 스탯 3칸
  const stats = [
    { label: "시간", value: WORST.time, unit: undefined as string | undefined },
    { label: "평균 페이스", value: WORST.pace, unit: "/km" },
    { label: "평균 심박", value: WORST.hr, unit: "bpm" },
  ];
  const colW = (CARD_W - L.pad * 2) / stats.length;
  stats.forEach((s, i) => {
    const x = L.pad + colW * i;
    const labelW = textWidth(s.label, L.statLabelSize, "bold");
    const valW = textWidth(s.value, L.statValSize, "bold");
    const unitW2 = s.unit ? textWidth(s.unit, L.statUnitSize, "bold") + 8 : 0;
    if (labelW > colW - 8) fail(`스탯 라벨 "${s.label}"이 칸(${colW.toFixed(0)})을 넘는다 (${labelW.toFixed(0)})`);
    if (valW + unitW2 > colW - 8) {
      fail(`스탯 값 "${s.value}${s.unit ?? ""}"이 칸(${colW.toFixed(0)})을 넘는다 (${(valW + unitW2).toFixed(0)})`);
    }
    if (i === stats.length - 1 && x + valW + unitW2 > right) fail("마지막 스탯이 우측 여백을 넘는다");
    boxes.push(box(`스탯${i}라벨`, x, labelW, L.statLabelY, L.statLabelSize));
    boxes.push(box(`스탯${i}값`, x, valW + unitW2, L.statValY, L.statValSize));
  });

  // ── 슬로건
  const slW = textWidth(SLOGAN, L.sloganSize, "bold");
  boxes.push(box("슬로건", L.pad, slW, L.sloganY, L.sloganSize));
  if (L.pad + slW > right) fail("슬로건이 우측 여백을 넘는다");

  // ── 캔버스 밖으로 나가는 것
  for (const b of boxes) {
    if (b.top < 0) fail(`${b.name}이 위로 넘친다 (top ${b.top.toFixed(0)})`);
    if (b.bottom > H) fail(`${b.name}이 아래로 넘친다 (bottom ${b.bottom.toFixed(0)} > ${H})`);
    if (b.x < 0 || b.right > CARD_W) fail(`${b.name}이 좌우로 넘친다 (${b.x.toFixed(0)}~${b.right.toFixed(0)})`);
  }

  // ── 세로 겹침 (같은 행인 스탯끼리는 x가 다르므로 제외)
  const rows = boxes.filter((b) => !b.name.startsWith("스탯"));
  for (let i = 0; i < rows.length; i++) {
    for (let j = i + 1; j < rows.length; j++) {
      const a = rows[i], b = rows[j];
      const vOverlap = a.top < b.bottom && b.top < a.bottom;
      const hOverlap = a.x < b.right && b.x < a.right;
      if (vOverlap && hOverlap) {
        fail(`${a.name} ↔ ${b.name} 겹침 (y ${a.top.toFixed(0)}~${a.bottom.toFixed(0)} vs ${b.top.toFixed(0)}~${b.bottom.toFixed(0)})`);
      }
    }
  }

  // 참고용 여백 출력 — 통과해도 너무 빡빡하면 디자인상 답답하다.
  const lastBottom = Math.max(...boxes.map((b) => b.bottom));
  console.log(`  하단 여백 ${(H - lastBottom).toFixed(0)}px · 러너 네임 "${nameText}"`);
}

for (const ratio of ["1:1", "9:16"] as CardRatio[]) {
  for (const mode of ["path", "ring"] as const) check(ratio, mode);
}

console.log(fails === 0 ? "\n✅ 레이아웃 검산 통과" : `\n❌ ${fails}건 — 좌표 수정 필요`);
process.exit(fails === 0 ? 0 : 1);
