/**
 * 마스코트 PNG에서 캐릭터 본체만 남긴다 — gpt-image-1이 프롬프트를 무시하고 넣는
 * 발밑 타원 그림자를 제거하기 위한 것. 그림자는 캐릭터와 **떨어진 별도 덩어리**라
 * 알파>임계 픽셀의 연결 컴포넌트를 구해 가장 큰 것(=캐릭터)만 남기면 깔끔하게 사라진다.
 *
 * 실행: node strip-shadow.mjs <in.png> <out.png>
 */
import { PNG } from "pngjs";
import { readFileSync, writeFileSync } from "node:fs";

const [, , inPath, outPath] = process.argv;
const A_MIN = 8; // 이보다 옅으면 배경으로 취급

const img = PNG.sync.read(readFileSync(inPath));
const { width: W, height: H, data: D } = img;
const N = W * H;

const label = new Int32Array(N).fill(-1);
const stack = new Int32Array(N);
let best = -1, bestSize = 0, cur = 0;

for (let start = 0; start < N; start++) {
  if (label[start] !== -1 || D[start * 4 + 3] < A_MIN) continue;
  let sp = 0, size = 0;
  stack[sp++] = start;
  label[start] = cur;
  while (sp > 0) {
    const p = stack[--sp];
    size++;
    const x = p % W, y = (p / W) | 0;
    // 8-이웃 — 얇은 외곽선이 대각으로만 이어지는 경우까지 한 덩어리로 본다
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const nx = x + dx, ny = y + dy;
        if (nx < 0 || ny < 0 || nx >= W || ny >= H) continue;
        const q = ny * W + nx;
        if (label[q] !== -1 || D[q * 4 + 3] < A_MIN) continue;
        label[q] = cur;
        stack[sp++] = q;
      }
    }
  }
  if (size > bestSize) { bestSize = size; best = cur; }
  cur++;
}

let cleared = 0;
for (let p = 0; p < N; p++) {
  if (label[p] !== -1 && label[p] !== best) {
    D[p * 4 + 3] = 0; // 캐릭터가 아닌 덩어리 → 투명
    cleared++;
  }
}

writeFileSync(outPath, PNG.sync.write(img));
console.log(`✓ ${outPath} — 덩어리 ${cur}개 중 본체(${bestSize}px) 유지, ${cleared}px 제거`);
