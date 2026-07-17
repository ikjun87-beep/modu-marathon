/**
 * 마스코트 남녀 2종 — **하나의 원본에서 코드로** 파생시킨다.
 *
 * 왜 AI로 두 번 안 그리나: 따로 그리면 실루엣·비율·표정이 미묘하게 달라져서 "같은 캐릭터의
 * 남녀 버전"이 아니라 남남처럼 보인다. 같은 픽셀에서 색만 갈아끼우면 형태가 100% 같다.
 *
 *  - 남성: 볼터치 제거(머리 색으로 덮음) + 신발 골드(원본 유지)
 *  - 여성: 볼터치 유지 + 신발 핑크
 *
 * 입력은 build-mascot.mjs를 이미 통과한 PNG(브랜드색 교정 + 배경 파냄 + 그림자 제거).
 * 실행: node scripts/build-mascot-pair.mjs <in.png> <남성out.png> <여성out.png>
 */
import { PNG } from "pngjs";
import { readFileSync, writeFileSync } from "node:fs";

const [, , inPath, maleOut, femaleOut] = process.argv;

const hex = (h) => [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
const PINK = hex("#e8608a"); // 여성 신발 — 애저 블루와 붙여도 탁하지 않은 로즈
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

const load = () => PNG.sync.read(readFileSync(inPath));

/** 분홍 계열(볼터치 + 입) 픽셀. 실측: 둘 다 #ff5070 부근이라 **색으로는 못 가른다.** */
function isPink(r, g, b, a) {
  if (a === 0) return false;
  const [h, s, v] = hsv(r, g, b);
  return (h >= 330 || h <= 25) && s > 0.4 && v > 0.6;
}

/** 분홍 덩어리를 찾아 **볼터치만** 골라낸다.
 *  실측(1024px 기준): 볼터치 82x84·74x76(동그람) / 입 89x50(가로로 넓음).
 *  → 판정 = ①가로세로비가 1에 가깝고(동그람) ②얼굴 가로 중앙에서 멀다(입은 정중앙).
 *  색만으로 지우면 웃는 입까지 지워져 무표정이 된다. */
function findBlushPixels(png) {
  const { width: W, height: H, data: D } = png;
  const seen = new Int32Array(W * H).fill(-1);
  const comps = [];
  const pink = (p) => isPink(D[p * 4], D[p * 4 + 1], D[p * 4 + 2], D[p * 4 + 3]);
  for (let p0 = 0; p0 < W * H; p0++) {
    if (!pink(p0) || seen[p0] >= 0) continue;
    const id = comps.length;
    const px = [];
    const st = [p0];
    seen[p0] = id;
    while (st.length) {
      const q = st.pop();
      px.push(q);
      const x = q % W;
      for (const r of [q - 1, q + 1, q - W, q + W]) {
        if (r < 0 || r >= W * H) continue;
        if (Math.abs((r % W) - x) > 1) continue;
        if (!pink(r) || seen[r] >= 0) continue;
        seen[r] = id;
        st.push(r);
      }
    }
    comps.push(px);
  }
  if (comps.length < 2) return []; // 볼터치가 없는 원본 — 그냥 둔다

  const info = comps.map((px) => {
    let minx = 1e9, maxx = -1, miny = 1e9, maxy = -1, sx = 0;
    for (const q of px) {
      const x = q % W, y = (q / W) | 0;
      sx += x;
      if (x < minx) minx = x; if (x > maxx) maxx = x;
      if (y < miny) miny = y; if (y > maxy) maxy = y;
    }
    return { px, cx: sx / px.length, aspect: (maxx - minx + 1) / (maxy - miny + 1) };
  });
  const meanCx = info.reduce((a, c) => a + c.cx, 0) / info.length;

  const picked = [];
  for (const c of info) {
    const round = c.aspect > 0.7 && c.aspect < 1.4; // 동그람
    const offCenter = Math.abs(c.cx - meanCx) > W * 0.08; // 정중앙(입)이 아님
    if (round && offCenter) picked.push(...c.px);
  }
  if (!picked.length) return [];

  // 가장자리 **안티에일리어싱 고리**까지 부풀린다.
  // 볼터치 경계는 분홍과 머리색이 섞여 있어 분홍 판정을 통과 못 한다 →
  // 안 부풀리면 지운 자리에 희미한 점선 테두리가 남는다(실제로 남았음).
  // 단 **입 쪽으로 번지면 안 되므로** 원래 분홍이 아니었던 픽셀만, 그리고 어두운 선(눈·입 외곽)은 건드리지 않는다.
  const mask = new Set(picked);
  const grown = new Set(picked);
  const R = 3;
  for (const p of picked) {
    const x0 = p % W, y0 = (p / W) | 0;
    for (let dy = -R; dy <= R; dy++) {
      for (let dx = -R; dx <= R; dx++) {
        const x = x0 + dx, y = y0 + dy;
        if (x < 0 || x >= W || y < 0 || y >= H) continue;
        const q = y * W + x;
        if (grown.has(q) || D[q * 4 + 3] === 0) continue;
        const [, , v] = hsv(D[q * 4], D[q * 4 + 1], D[q * 4 + 2]);
        if (v < 0.45) continue; // 어두운 외곽선(눈·입)은 보존
        if (mask.has(q)) continue;
        grown.add(q);
      }
    }
  }
  return [...grown];
}

/** 골드 신발 픽셀인가(원본은 build-mascot이 #c0841a 계열로 칠해둠). */
function isGold(r, g, b) {
  const [h, s, v] = hsv(r, g, b);
  return h >= 25 && h <= 55 && s > 0.35 && v > 0.2;
}

// ── 남성: 볼터치 제거 ─────────────────────────────────────────
{
  const png = load();
  const { width: W, data: D } = png;
  const blush = findBlushPixels(png);

  // 덮을 머리색은 **볼터치 바로 바깥 고리**에서 뜬다.
  // ⚠️ 화면을 위에서부터 훑어 첫 파랑을 집으면 안 된다 — 머리 **외곽선과 섞인 안티에일리어싱**
  //    픽셀이 잡혀서 진한 파란 동그라미로 덮인다(실제로 그렇게 나왔음). 최빈값으로 뽑는다.
  const set = new Set(blush);
  const votes = new Map();
  for (const p of blush) {
    const x = p % W;
    for (const q of [p - 3, p + 3, p - 3 * W, p + 3 * W]) {
      if (q < 0 || q * 4 >= D.length) continue;
      if (Math.abs((q % W) - x) > 3) continue;
      if (set.has(q) || D[q * 4 + 3] === 0) continue;
      const [h, s, v] = hsv(D[q * 4], D[q * 4 + 1], D[q * 4 + 2]);
      if (h < 195 || h > 240 || s < 0.45 || v < 0.6) continue; // 밝은 파랑(머리 면)만
      const k = `${D[q * 4]},${D[q * 4 + 1]},${D[q * 4 + 2]}`;
      votes.set(k, (votes.get(k) ?? 0) + 1);
    }
  }
  const top = [...votes.entries()].sort((a, b) => b[1] - a[1])[0];
  const head = top ? top[0].split(",").map(Number) : hex("#3f7fe8");
  console.log(`  (머리색 최빈값 rgb(${head.join(",")}) — 볼터치 주변 ${votes.size}종에서)`);
  for (const p of blush) {
    D[p * 4] = head[0];
    D[p * 4 + 1] = head[1];
    D[p * 4 + 2] = head[2];
  }
  writeFileSync(maleOut, PNG.sync.write(png));
  console.log(`남성: 볼터치 ${blush.length}px 제거 → ${maleOut}`);
}

// ── 여성: 신발 골드 → 핑크 ────────────────────────────────────
{
  const png = load();
  const D = png.data;
  const REF = lum(...hex("#c0841a"));
  let n = 0;
  for (let i = 0; i < D.length; i += 4) {
    if (D[i + 3] === 0) continue;
    if (isGold(D[i], D[i + 1], D[i + 2])) {
      // 원본 밝기비를 유지해 신발의 음영·하이라이트가 살아남는다
      const k = Math.min(1.6, lum(D[i], D[i + 1], D[i + 2]) / REF);
      for (let c = 0; c < 3; c++) D[i + c] = Math.max(0, Math.min(255, Math.round(PINK[c] * k)));
      n++;
    }
  }
  writeFileSync(femaleOut, PNG.sync.write(png));
  console.log(`여성: 신발 ${n}px 핑크로 → ${femaleOut}`);
}
