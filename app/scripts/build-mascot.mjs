/** 마스코트 후처리 — ① 브랜드색으로 정확히 교정 ② 배경 파내 투명화.
 *  AI와 색 싸움을 하지 않는다(시도했다 실패). 평면 벡터라 색이 몇 개뿐이니 코드가 정확하다. */
import { PNG } from "pngjs";
import { readFileSync, writeFileSync } from "node:fs";

const [, , inPath, outPath] = process.argv;
const png = PNG.sync.read(readFileSync(inPath));
const { width: W, height: H, data: D } = png;

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const BLUE = hex("#2563c9");   // 브랜드 Azure Blue
const GOLD = hex("#c0841a");   // 브랜드 accent
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

/** 목표색으로 갈아끼우되 원본 밝기비를 유지 → 하이라이트·음영이 살아남는다. */
function recolor(i, target, refLum) {
  const k = Math.min(1.6, lum(D[i], D[i + 1], D[i + 2]) / refLum);
  for (let c = 0; c < 3; c++) D[i + c] = Math.max(0, Math.min(255, Math.round(target[c] * k)));
}

const REF_CYAN = lum(0, 176, 224);
const REF_YEL = lum(245, 215, 40);
let nCyan = 0, nYel = 0;
for (let i = 0; i < D.length; i += 4) {
  const [h, s, v] = hsv(D[i], D[i + 1], D[i + 2]);
  if (s < 0.35 || v < 0.25) continue;           // 무채색·검정 외곽선·크림 밑창은 건드리지 않음
  if (h >= 170 && h <= 215) { recolor(i, BLUE, REF_CYAN); nCyan++; }   // 시안 몸통 → 브랜드 블루
  else if (h >= 40 && h <= 70) { recolor(i, GOLD, REF_YEL); nYel++; }  // 노랑 번개 → 골드
}

// ── 배경 파내기: 테두리에서 flood fill(분홍만). 캐릭터 안쪽 분홍은 건드리지 않는다.
const bgIdx = 0;
const BG = [D[bgIdx], D[bgIdx + 1], D[bgIdx + 2]];
const near = (i, c, tol) =>
  Math.abs(D[i] - c[0]) < tol && Math.abs(D[i + 1] - c[1]) < tol && Math.abs(D[i + 2] - c[2]) < tol;

const seen = new Uint8Array(W * H);
const stack = [];
for (let x = 0; x < W; x++) { stack.push(x, (H - 1) * W + x); }
for (let y = 0; y < H; y++) { stack.push(y * W, y * W + W - 1); }
let cut = 0;
while (stack.length) {
  const p = stack.pop();
  if (seen[p]) continue;
  const i = p * 4;
  if (!near(i, BG, 60)) continue;   // 배경색이 아니면 여기서 멈춤 = 캐릭터 경계
  seen[p] = 1; D[i + 3] = 0; cut++;
  const x = p % W, y = (p / W) | 0;
  if (x > 0) stack.push(p - 1);
  if (x < W - 1) stack.push(p + 1);
  if (y > 0) stack.push(p - W);
  if (y < H - 1) stack.push(p + W);
}

// 경계에 남은 분홍 후광 제거 — 반투명 가장자리를 분홍 쪽으로 한 겹 더 깎는다
let halo = 0;
for (let p = 0; p < W * H; p++) {
  const i = p * 4;
  if (D[i + 3] === 0) continue;
  const x = p % W, y = (p / W) | 0;
  const edge = [p - 1, p + 1, p - W, p + W].some(
    (q) => q >= 0 && q < W * H && D[q * 4 + 3] === 0
  );
  if (edge && near(i, BG, 110)) { D[i + 3] = 0; halo++; }
  if (x === 0 || y === 0) continue;
}

// ── 발밑 그림자 제거
// 프롬프트에 "NO drop shadow"를 세 번 넣어도 모델이 계속 그린다.
// 연결요소로 못 지운다 — 실측해보니 **그림자 타원이 앞 신발 외곽선에 붙어** 본체와 한 덩어리다.
// → 위치로 자른다: 신발의 **밝은 부분**(골드 갑피·크림 밑창)이 끝나는 y보다 확실히 아래에 있는
//   어두운 픽셀 = 그림자. 신발 바로 밑 외곽선은 살리려고 여유(MARGIN)를 둔다.
const isBright = (i) => Math.max(D[i], D[i + 1], D[i + 2]) > 150;
const isDark = (i) => Math.max(D[i], D[i + 1], D[i + 2]) < 110;

let yBright = 0;
for (let p = 0; p < W * H; p++) {
  if (D[p * 4 + 3] === 0 || !isBright(p * 4)) continue;
  const y = (p / W) | 0;
  if (y > yBright) yBright = y;
}
const MARGIN = 6; // 신발 바닥 외곽선은 남기고 그 아래만
let shadow = 0;
for (let y = yBright + MARGIN; y < H; y++) {
  for (let x = 0; x < W; x++) {
    const i = (y * W + x) * 4;
    if (D[i + 3] === 0 || !isDark(i)) continue;
    D[i + 3] = 0;
    shadow++;
  }
}

writeFileSync(outPath, PNG.sync.write(png));
console.log(
  `시안→블루 ${nCyan}px · 노랑→골드 ${nYel}px · 배경 ${cut}px 제거 · 후광 ${halo}px · 그림자 ${shadow}px 제거`
);
console.log("→", outPath);
