/**
 * 마스코트 자산 최적화 — 투명 여백 잘라내고 축소 + 최대 압축.
 *
 * 원본은 1024×1024에 대부분이 빈 여백이라 1.7MB다. 앱에서 제일 크게 쓰는 자리가 120dp이고
 * 3배 밀도에서도 360px이라 512면 차고 넘친다. 여백을 자르면 캐릭터가 같은 박스에서 더 크게 보이는
 * 부수 효과도 있다(화면마다 여백을 다시 계산할 필요가 없어짐).
 *
 * 실행: node scripts/optimize-mascot.mjs <in.png> <out.png> [목표변 512]
 */
import { PNG } from "pngjs";
import { readFileSync, writeFileSync } from "node:fs";
import zlib from "node:zlib";

const [, , inPath, outPath, sizeArg] = process.argv;
const TARGET = Number(sizeArg ?? 512);

const src = PNG.sync.read(readFileSync(inPath));
const { width: W, height: H, data: D } = src;

// ── 투명 여백 잘라내기(내용 bbox)
let minx = W, maxx = -1, miny = H, maxy = -1;
for (let y = 0; y < H; y++) {
  for (let x = 0; x < W; x++) {
    if (D[(y * W + x) * 4 + 3] < 8) continue;
    if (x < minx) minx = x;
    if (x > maxx) maxx = x;
    if (y < miny) miny = y;
    if (y > maxy) maxy = y;
  }
}
const cw = maxx - minx + 1;
const ch = maxy - miny + 1;

// 정사각 캔버스로 맞춘다 — 화면마다 가로세로비를 따로 신경 안 쓰게
const side = Math.max(cw, ch);
const padX = ((side - cw) / 2) | 0;
const padY = ((side - ch) / 2) | 0;

const sq = new PNG({ width: side, height: side });
sq.data.fill(0);
for (let y = 0; y < ch; y++) {
  for (let x = 0; x < cw; x++) {
    const si = ((y + miny) * W + (x + minx)) * 4;
    const di = ((y + padY) * side + (x + padX)) * 4;
    for (let c = 0; c < 4; c++) sq.data[di + c] = D[si + c];
  }
}

// ── 축소(박스 필터 — 알파를 곱해 평균내야 가장자리에 검은 테가 안 생긴다)
const out = new PNG({ width: TARGET, height: TARGET });
const scale = side / TARGET;
for (let y = 0; y < TARGET; y++) {
  for (let x = 0; x < TARGET; x++) {
    const x0 = Math.floor(x * scale), x1 = Math.min(side, Math.ceil((x + 1) * scale));
    const y0 = Math.floor(y * scale), y1 = Math.min(side, Math.ceil((y + 1) * scale));
    let r = 0, g = 0, b = 0, a = 0, n = 0;
    for (let sy = y0; sy < y1; sy++) {
      for (let sx = x0; sx < x1; sx++) {
        const i = (sy * side + sx) * 4;
        const al = sq.data[i + 3] / 255;
        r += sq.data[i] * al; g += sq.data[i + 1] * al; b += sq.data[i + 2] * al;
        a += sq.data[i + 3];
        n++;
      }
    }
    const di = (y * TARGET + x) * 4;
    const A = a / n;
    // premultiplied 평균을 되돌린다(A=0이면 색은 의미 없음)
    const k = A > 0 ? 255 / A : 0;
    out.data[di] = Math.min(255, Math.round((r / n) * k));
    out.data[di + 1] = Math.min(255, Math.round((g / n) * k));
    out.data[di + 2] = Math.min(255, Math.round((b / n) * k));
    out.data[di + 3] = Math.round(A);
  }
}

const buf = PNG.sync.write(out, { deflateLevel: 9, deflateStrategy: zlib.constants.Z_DEFAULT_STRATEGY });
writeFileSync(outPath, buf);
const before = readFileSync(inPath).length;
console.log(
  `${inPath.split("/").pop()} → ${outPath.split("/").pop()}  ` +
    `여백 잘라 ${cw}x${ch} → ${side}정사각 → ${TARGET}px · ` +
    `${(before / 1024).toFixed(0)}KB → ${(buf.length / 1024).toFixed(0)}KB`
);
