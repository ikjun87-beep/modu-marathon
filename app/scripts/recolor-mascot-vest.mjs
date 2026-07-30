/**
 * 마스코트 조끼 색 갈아입히기 — 레드팀 원본에서 **그린팀을 코드로 파생**한다.
 *
 * AI로 두 번 그리면 실루엣·비율이 미묘하게 달라져 "같은 캐릭터의 다른 팀"이 아니라
 * 다른 캐릭터가 된다(build-mascot-pair.mjs와 같은 이유). 조끼 hue만 골라 밝기비를 유지한 채
 * 목표색으로 갈아끼우면 형태·음영이 100% 보존된다.
 *
 * 타깃 그린 = brand.ts의 Team.green(#2f8f5b) — 아바타 링과 같은 "그린팀" 색으로 맞춘다
 * (마스코트 조끼와 아바타 링이 같은 팀 정체성을 가리켜야 하므로).
 *
 * 입력은 cutout-mascot-bg.mjs를 통과한(배경 투명) PNG.
 * 실행: node scripts/recolor-mascot-vest.mjs <in.png> <out.png>
 */
import { PNG } from "pngjs";
import { readFileSync, writeFileSync } from "node:fs";

const [, , inPath, outPath] = process.argv;
const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const TARGET = hex("#2f8f5b"); // Team.green
const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;

function hsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) {
    if (mx === r) h = ((g - b) / d) % 6;
    else if (mx === g) h = (b - r) / d + 2;
    else h = (r - g) / d + 4;
    h *= 60; if (h < 0) h += 360;
  }
  return [h, mx ? d / mx : 0, mx];
}

const png = PNG.sync.read(readFileSync(inPath));
const { width: W, height: H, data: D } = png;

// 레드 조끼 hue만 후보로(볼터치는 hue~20, 조끼는 hue~350~10이라 겹치지 않는다 — 실측 확인됨)
const isVestRed = (r, g, b, a) => {
  if (a === 0) return false;
  const [h, s, v] = hsv(r, g, b);
  return (h >= 345 || h <= 12) && s > 0.5 && v > 0.3;
};

const seen = new Int32Array(W * H).fill(-1);
const comps = [];
for (let p0 = 0; p0 < W * H; p0++) {
  const i0 = p0 * 4;
  if (!isVestRed(D[i0], D[i0 + 1], D[i0 + 2], D[i0 + 3]) || seen[p0] >= 0) continue;
  const id = comps.length;
  const px = [];
  const st = [p0];
  seen[p0] = id;
  while (st.length) {
    const p = st.pop();
    px.push(p);
    const x = p % W;
    for (const q of [p - 1, p + 1, p - W, p + W]) {
      if (q < 0 || q >= W * H || Math.abs((q % W) - x) > 1) continue;
      const qi = q * 4;
      if (seen[q] >= 0 || !isVestRed(D[qi], D[qi + 1], D[qi + 2], D[qi + 3])) continue;
      seen[q] = id;
      st.push(q);
    }
  }
  comps.push(px);
}
// 가장 큰 덩어리 = 조끼(다른 작은 빨강 잔점은 안티에일리어싱 노이즈)
comps.sort((a, b) => b.length - a.length);
const vest = comps[0] ?? [];

const REF = lum(...hex("#e5484d")); // 원본 레드 기준 밝기
for (const p of vest) {
  const i = p * 4;
  const k = Math.min(1.7, lum(D[i], D[i + 1], D[i + 2]) / REF);
  for (let c = 0; c < 3; c++) D[i + c] = Math.max(0, Math.min(255, Math.round(TARGET[c] * k)));
}

writeFileSync(outPath, PNG.sync.write(png));
console.log(`조끼 ${vest.length}px → 그린 → ${outPath} (덩어리 총 ${comps.length}개 중 최대만 적용)`);
