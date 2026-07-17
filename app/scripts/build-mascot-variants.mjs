/**
 * 머리띠 마스코트 4종 생성 — 하나의 원본(base-hi.png)에서 코드로 파생.
 *
 * 원본 = 파란 몸 + 흰 머리띠 + 빨강 상의 + 초록 하의 + 주황 신발(gpt-image-1, 확정본 hi1).
 * 여기서:
 *  ① 배경(마젠타) 파냄 + 발밑 그림자 제거
 *  ② 몸(밝은 시안) → 브랜드 블루 #2563c9 (앱 톤 일치)
 *  ③ 상의/하의/신발을 스킴별 색으로 갈아입힘(머리띠는 흰색 유지 — 운동회 정체성)
 *  ④ 남/여 = 볼터치 유무
 *
 * 부위 분리(측정 기반):
 *  - 상의: 빨강 hue 중 **가장 큰 연결덩어리**(입·볼터치도 빨강이지만 작다)
 *  - 하의: 초록 hue (y상대 0.67~0.80, 딱 분리)
 *  - 신발: 주황 hue (y상대 0.71~0.95)
 *  - 몸: 시안 hue  / 머리띠: 흰(위쪽)  / 외곽선: 어두움 → 안 건드림
 *
 * 실행: node scripts/build-mascot-variants.mjs
 */
import { PNG } from "pngjs";
import { readFileSync, writeFileSync } from "node:fs";

const SP = process.env.MM_SP || "/tmp/claude-1000/-home-jun-projects-modu-marathon/7e5897a7-28f7-495b-8ad2-9f71d0990d9a/scratchpad";
const IN = `${SP}/base-hi.png`;

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const lum = (r, g, b) => 0.2126 * r + 0.7152 * g + 0.0722 * b;
function hsv(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
  return [h, mx ? d / mx : 0, mx];
}

const BRAND_BLUE = hex("#2563c9");

// 스킴: 상의/하의/신발 색(머리띠는 흰 유지)
const SCHEMES = {
  red:   { shirt: hex("#e5484d"), shorts: hex("#2c3a5e"), shoes: hex("#d9a02c") },  // 레드팀
  green: { shirt: hex("#2e9e5b"), shorts: hex("#2c3a5e"), shoes: hex("#e07a2a") },  // 그린팀
};

function load() { return PNG.sync.read(readFileSync(IN)); }

/** 목표색으로 갈되 원본 밝기비 유지 → 음영·하이라이트 보존 */
function paint(D, i, target, refLum) {
  const k = Math.min(1.7, lum(D[i], D[i + 1], D[i + 2]) / refLum);
  for (let c = 0; c < 3; c++) D[i + c] = Math.max(0, Math.min(255, Math.round(target[c] * k)));
}

/** 조건을 만족하는 픽셀 인덱스 집합 */
function maskWhere(D, W, H, pred) {
  const out = [];
  for (let p = 0; p < W * H; p++) {
    const i = p * 4;
    if (D[i + 3] === 0) continue;
    const [h, s, v] = hsv(D[i], D[i + 1], D[i + 2]);
    if (pred(h, s, v, p % W, (p / W) | 0)) out.push(p);
  }
  return out;
}

/** 가장 큰 연결덩어리만 남긴다(상의: 입·볼터치 제외용) */
function largestComponent(pixels, W, H) {
  const set = new Set(pixels);
  const seen = new Set();
  let best = [];
  for (const p0 of pixels) {
    if (seen.has(p0)) continue;
    const comp = [], st = [p0]; seen.add(p0);
    while (st.length) {
      const p = st.pop(); comp.push(p);
      const x = p % W;
      for (const q of [p - 1, p + 1, p - W, p + W]) {
        if (q < 0 || q >= W * H || Math.abs((q % W) - x) > 1) continue;
        if (set.has(q) && !seen.has(q)) { seen.add(q); st.push(q); }
      }
    }
    if (comp.length > best.length) best = comp;
  }
  return best;
}

/** 볼터치 픽셀(얼굴 영역의 둥근·중앙에서 벗어난 분홍 덩어리). build-mascot-pair와 같은 판정. */
function blushPixels(D, W, H) {
  // 얼굴 영역(위 절반)의 분홍만 후보 → 상의(아래)와 안 섞임
  const cand = maskWhere(D, W, H, (h, s, v, x, y) => (h >= 330 || h <= 25) && s > 0.35 && v > 0.6 && y < H * 0.42);
  const set = new Set(cand), seen = new Set(), comps = [];
  for (const p0 of cand) {
    if (seen.has(p0)) continue;
    const comp = [], st = [p0]; seen.add(p0);
    while (st.length) { const p = st.pop(); comp.push(p); const x = p % W;
      for (const q of [p - 1, p + 1, p - W, p + W]) { if (q < 0 || q >= W * H || Math.abs((q % W) - x) > 1) continue; if (set.has(q) && !seen.has(q)) { seen.add(q); st.push(q); } } }
    comps.push(comp);
  }
  if (comps.length < 2) return [];
  const info = comps.map((px) => { let minx = 1e9, maxx = -1, miny = 1e9, maxy = -1, sx = 0;
    for (const q of px) { const x = q % W, y = (q / W) | 0; sx += x; if (x < minx) minx = x; if (x > maxx) maxx = x; if (y < miny) miny = y; if (y > maxy) maxy = y; }
    return { px, cx: sx / px.length, aspect: (maxx - minx + 1) / (maxy - miny + 1) }; });
  const meanCx = info.reduce((a, c) => a + c.cx, 0) / info.length;
  const out = [];
  for (const c of info) if (c.aspect > 0.6 && c.aspect < 1.5 && Math.abs(c.cx - meanCx) > W * 0.08) out.push(...c.px);
  return out;
}

function cutBackground(png) {
  const { width: W, height: H, data: D } = png;
  const BG = [D[0], D[1], D[2]];
  const near = (i, c, t) => Math.abs(D[i] - c[0]) < t && Math.abs(D[i + 1] - c[1]) < t && Math.abs(D[i + 2] - c[2]) < t;
  const seen = new Uint8Array(W * H), st = [];
  for (let x = 0; x < W; x++) { st.push(x, (H - 1) * W + x); }
  for (let y = 0; y < H; y++) { st.push(y * W, y * W + W - 1); }
  while (st.length) { const p = st.pop(); if (seen[p]) continue; const i = p * 4; if (!near(i, BG, 60)) continue;
    seen[p] = 1; D[i + 3] = 0; const x = p % W, y = (p / W) | 0;
    if (x > 0) st.push(p - 1); if (x < W - 1) st.push(p + 1); if (y > 0) st.push(p - W); if (y < H - 1) st.push(p + W); }
  // 후광
  for (let p = 0; p < W * H; p++) { const i = p * 4; if (D[i + 3] === 0) continue;
    const edge = [p - 1, p + 1, p - W, p + W].some((q) => q >= 0 && q < W * H && D[q * 4 + 3] === 0);
    if (edge && near(i, BG, 110)) D[i + 3] = 0; }
  // 발밑 그림자: 밝은 부분이 끝나는 y 아래의 어두운 픽셀
  let yBright = 0;
  for (let p = 0; p < W * H; p++) { if (D[p * 4 + 3] === 0) continue; if (Math.max(D[p * 4], D[p * 4 + 1], D[p * 4 + 2]) > 150) { const y = (p / W) | 0; if (y > yBright) yBright = y; } }
  for (let y = yBright + 6; y < H; y++) for (let x = 0; x < W; x++) { const i = (y * W + x) * 4; if (D[i + 3] && Math.max(D[i], D[i + 1], D[i + 2]) < 110) D[i + 3] = 0; }
}

const REF = { blue: lum(90, 190, 230), red: lum(0xe5, 0x48, 0x4d), green: lum(0x2e, 0x9e, 0x5b), orange: lum(0xe8, 0x7a, 0x2a) };

function build(scheme, female) {
  const png = load();
  const { width: W, height: H, data: D } = png;
  cutBackground(png);

  // 머리띠 = 위쪽(y<0.25)의 밝은 픽셀 → 순백으로 확실히(파란 기 제거).
  //   흰띠에 살짝 밴 파란색까지 흰색으로 눌러 "운동회 흰 띠"를 또렷하게.
  //   s<0.35 필수 — 안 그러면 밝은 시안 머리 꼭대기(고채도)까지 흰색이 된다.
  const bandM = maskWhere(D, W, H, (h, s, v, x, y) => v > 0.6 && s < 0.35 && y < H * 0.26);
  for (const p of bandM) { D[p * 4] = 248; D[p * 4 + 1] = 249; D[p * 4 + 2] = 250; }

  // 부위 마스크(원본 색 기준)
  const bodyM = maskWhere(D, W, H, (h, s, v) => h >= 185 && h <= 225 && s > 0.35 && v > 0.4);
  const shortsM = maskWhere(D, W, H, (h, s, v, x, y) => h >= 90 && h <= 160 && s > 0.35 && y > H * 0.55);
  const shoesM = maskWhere(D, W, H, (h, s, v, x, y) => h >= 18 && h <= 45 && s > 0.45 && y > H * 0.6);
  const redAll = maskWhere(D, W, H, (h, s, v, x, y) => (h >= 345 || h <= 15) && s > 0.45 && y > H * 0.42); // 얼굴 아래 빨강
  const shirtM = largestComponent(redAll, W, H); // 그중 가장 큰 = 상의

  // 볼터치는 색을 갈기 전에 추출(빨강 상의와 안 섞이게 얼굴영역 한정)
  const blush = female ? [] : blushPixels(D, W, H);

  // 칠하기 — 몸은 항상 브랜드 블루, 옷은 스킴색
  for (const p of bodyM) paint(D, p * 4, BRAND_BLUE, REF.blue);
  for (const p of shirtM) paint(D, p * 4, scheme.shirt, REF.red);
  for (const p of shortsM) paint(D, p * 4, scheme.shorts, REF.green);
  for (const p of shoesM) paint(D, p * 4, scheme.shoes, REF.orange);

  // 남성: 볼터치를 머리색(브랜드 블루)으로 덮음.
  //   가장자리 안티에일리어싱 고리까지 부풀려 덮는다(안 그러면 옅은 자국이 남음).
  //   단 어두운 선(눈)·입은 보존.
  if (blush.length) {
    const bset = new Set(blush);
    const grown = new Set(blush);
    for (const p of blush) {
      const x0 = p % W, y0 = (p / W) | 0;
      for (let dy = -3; dy <= 3; dy++) for (let dx = -3; dx <= 3; dx++) {
        const x = x0 + dx, y = y0 + dy;
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const q = y * W + x;
        if (grown.has(q) || bset.has(q) || D[q * 4 + 3] === 0) continue;
        const [, , v] = hsv(D[q * 4], D[q * 4 + 1], D[q * 4 + 2]);
        if (v < 0.45) continue; // 어두운 눈·외곽선 보존
        // 분홍기가 있는 픽셀만(파란 볼 본색은 이미 body 리컬러됨) → 자국만 정확히
        const [h, s] = hsv(D[q * 4], D[q * 4 + 1], D[q * 4 + 2]);
        if ((h >= 320 || h <= 30) && s > 0.12) grown.add(q);
      }
    }
    for (const p of grown) { D[p * 4] = BRAND_BLUE[0]; D[p * 4 + 1] = BRAND_BLUE[1]; D[p * 4 + 2] = BRAND_BLUE[2]; }
  }

  return png;
}

for (const [name, scheme] of Object.entries(SCHEMES)) {
  for (const female of [false, true]) {
    const png = build(scheme, female);
    const out = `${SP}/variant-${female ? "f" : "m"}-${name}.png`;
    writeFileSync(out, PNG.sync.write(png));
    console.log(`${female ? "여" : "남"}-${name} → ${out}`);
  }
}
