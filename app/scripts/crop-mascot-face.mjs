/**
 * 마스코트에서 **얼굴만** 잘라낸다 — 앱 아이콘용.
 *
 * ## 왜 사각형 크롭으로는 안 되나
 * 오키는 얼굴 왼쪽 아래에서 **엄지척 손·팔**이 올라온다. 사각형으로 자르면 손이 같이 들어오고,
 * 손을 피해 자르면 이번엔 **턱이 직선으로 잘려** 깨져 보인다(둘 다 실제로 겪었다).
 * 손과 귀는 세로로도 겹쳐 있어 "y 몇 위에서 자르기"로는 절대 분리되지 않는다.
 *
 * ## 그래서 형태로 고른다
 * 얼굴·울·귀 내부에 시드를 찍고 **밝은 픽셀만 flood fill** 하면, 검은 윤곽선이 경계가 되어
 * 각 부위가 정확히 채워진다. 그 다음 **어두운 픽셀 방향으로만** 확장해 윤곽선까지 포함시킨다
 * (밝은 픽셀은 건너뛰므로 옆 부위로 새지 않는다). 마스크 밖은 전부 투명 → 손·팔·조끼가 사라진다.
 *
 * 실행: node scripts/crop-mascot-face.mjs <in.png> <out.png>
 *   입력은 512px 마스코트(배경 투명). 시드 좌표가 512 기준 절대값이라 다른 크기는 지원하지 않는다.
 */
import { PNG } from "pngjs";
import { readFileSync, writeFileSync } from "node:fs";

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error("사용법: node scripts/crop-mascot-face.mjs <in.png> <out.png>");
  process.exit(1);
}

const png = PNG.sync.read(readFileSync(inPath));
const { width: W, height: H, data: D } = png;
if (W !== 512 || H !== 512) {
  console.error(`⚠️ 512×512 입력을 기대했는데 ${W}×${H} 입니다. 시드 좌표를 다시 잡아야 합니다.`);
  process.exit(1);
}

const at = (x, y) => (W * y + x) << 2;
const lum = (i) => 0.2126 * D[i] + 0.7152 * D[i + 1] + 0.0722 * D[i + 2];
const LIGHT = 105; // 이보다 밝으면 '내부', 어두우면 '윤곽선'

/** 얼굴을 이루는 부위들의 내부 좌표(512 기준). 울은 곱슬이라 여러 점을 찍어야 다 채워진다. */
const SEEDS = [
  [256, 240], // 얼굴 한가운데
  [200, 210], [310, 210], // 좌우 볼
  [256, 120], [180, 110], [330, 115], [140, 150], [370, 150], // 머리 울
  [95, 200], [420, 200], // 좌우 귀
];

const mask = new Uint8Array(W * H);
const stack = [];
for (const [sx, sy] of SEEDS) stack.push([sx, sy]);

while (stack.length) {
  const [x, y] = stack.pop();
  if (x < 0 || y < 0 || x >= W || y >= H) continue;
  const k = W * y + x;
  if (mask[k]) continue;
  const i = at(x, y);
  if (D[i + 3] < 40 || lum(i) < LIGHT) continue; // 투명·윤곽선이면 경계
  mask[k] = 1;
  stack.push([x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]);
}

// 윤곽선 흡수 — 어두운 픽셀 방향으로만 넓힌다. 선 두께가 약 9px이라 넉넉히 돈다.
for (let pass = 0; pass < 14; pass++) {
  const add = [];
  for (let y = 1; y < H - 1; y++) {
    for (let x = 1; x < W - 1; x++) {
      const k = W * y + x;
      if (mask[k]) continue;
      const i = at(x, y);
      if (D[i + 3] < 40) continue;
      if (lum(i) >= LIGHT) continue; // 밝은 픽셀(다른 부위 내부)로는 번지지 않는다
      if (mask[k - 1] || mask[k + 1] || mask[k - W] || mask[k + W]) add.push(k);
    }
  }
  if (!add.length) break;
  for (const k of add) mask[k] = 1;
}

// 마스크 밖은 전부 투명 — 손·팔·조끼·다리가 여기서 사라진다.
for (let k = 0; k < mask.length; k++) {
  if (!mask[k]) D[at(k % W, (k / W) | 0) + 3] = 0;
}

// 턱 바로 아래에 조끼 윤곽선이 몇 픽셀 붙어 나온다(윤곽선 흡수가 그쪽으로 한 칸 넘어간 것).
// 조끼는 채도 높은 빨강/초록이라 색으로 골라낼 수 있다 — 볼터치(연한 살구)는 건드리지 않는다.
for (let k = 0; k < mask.length; k++) {
  const i = at(k % W, (k / W) | 0);
  if (D[i + 3] < 40) continue;
  const [r, g, b] = [D[i], D[i + 1], D[i + 2]];
  const isVestRed = r > 190 && g < 130 && b < 130;
  const isVestGreen = g > 100 && r < 120 && b < 130 && g - r > 30;
  if (isVestRed || isVestGreen) D[i + 3] = 0;
}

// 턱 **아래**로 삐져나온 선 조각을 자른다.
// 이 부스러기는 얼굴 윤곽선과 이어져 있어 "덩어리 분리"로는 안 떨어진다(실제로 시도해 보니
// 전체가 하나의 덩어리였다). 대신 **얼굴 안쪽(밝은 픽셀)의 최하단 + 윤곽선 두께**를 경계로
// 삼으면, 턱선은 온전히 남기고 그 아래 조각만 사라진다.
{
  let inner = -1;
  for (let y = 0; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = at(x, y);
      if (D[i + 3] > 40 && lum(i) >= LIGHT && y > inner) inner = y;
    }
  }
  const OUTLINE = 9; // 마스코트 선 두께
  let cut = 0;
  for (let y = inner + OUTLINE; y < H; y++) {
    for (let x = 0; x < W; x++) {
      const i = at(x, y);
      if (D[i + 3] > 40) { D[i + 3] = 0; cut++; }
    }
  }
  console.log(`   턱 아래 조각 ${cut}px 제거 (안쪽 최하단 y=${inner})`);
}

// 그래도 떨어져 나온 조각이 있으면 가장 큰 덩어리만 남긴다.
// **가장 큰 덩어리 하나만 남긴다** — 얼굴·울·귀는 윤곽선으로 이어져 한 덩어리이므로
// 통째로 살아남고, 떨어져 나온 점들만 사라진다(strip-mascot-shadow.mjs와 같은 원리).
{
  const label = new Int32Array(W * H).fill(-1);
  const sizes = [];
  for (let s = 0; s < W * H; s++) {
    if (label[s] !== -1) continue;
    if (D[at(s % W, (s / W) | 0) + 3] < 40) continue;
    const id = sizes.length;
    let count = 0;
    const q = [s];
    label[s] = id;
    while (q.length) {
      const c = q.pop();
      count++;
      const cx = c % W, cy = (c / W) | 0;
      for (const [dx, dy] of [[1, 0], [-1, 0], [0, 1], [0, -1]]) {
        const nx = cx + dx, ny = cy + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const n = W * ny + nx;
        if (label[n] !== -1) continue;
        if (D[at(nx, ny) + 3] < 40) continue;
        label[n] = id;
        q.push(n);
      }
    }
    sizes.push(count);
  }
  let best = 0;
  for (let i = 1; i < sizes.length; i++) if (sizes[i] > sizes[best]) best = i;
  let removed = 0;
  for (let s = 0; s < W * H; s++) {
    if (label[s] !== -1 && label[s] !== best) {
      D[at(s % W, (s / W) | 0) + 3] = 0;
      removed++;
    }
  }
  console.log(`   덩어리 ${sizes.length}개 중 가장 큰 것만 유지 — 부스러기 ${removed}px 제거`);
}

// 남은 픽셀의 바운딩 박스로 딱 맞게 자른다(여백은 아이콘 배치에서 준다).
let minX = W, minY = H, maxX = -1, maxY = -1;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (D[at(x, y) + 3] > 40) {
      if (x < minX) minX = x;
      if (x > maxX) maxX = x;
      if (y < minY) minY = y;
      if (y > maxY) maxY = y;
    }
  }
}
const CW = maxX - minX + 1;
const CH = maxY - minY + 1;
const out = new PNG({ width: CW, height: CH });
for (let y = 0; y < CH; y++) {
  for (let x = 0; x < CW; x++) {
    const si = at(minX + x, minY + y);
    const di = (CW * y + x) << 2;
    for (let c = 0; c < 4; c++) out.data[di + c] = D[si + c];
  }
}
writeFileSync(outPath, PNG.sync.write(out));
console.log(`✅ 얼굴만 추출: ${outPath} (${CW}×${CH}, 원본에서 ${minX},${minY} 기준)`);
