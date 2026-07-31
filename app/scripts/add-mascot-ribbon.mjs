/**
 * 마스코트에 리본 달기 — 두 번째 캐릭터를 **코드로 파생**한다.
 *
 * ## 왜 리본인가 (2026-07-31 회장 지시)
 * 이전 2종 구분은 "동글 울 / 땋은 울"이었는데, 땋은 머리가 **양의 곱슬 울과 겹쳐 어색했다**
 * ("머리가 있어 너무 어색하다"). 양은 머리카락이 아니라 울로 덮인 동물이라 헤어스타일로
 * 구분하려는 것 자체가 형태와 싸우는 일이었다. 리본은 울 위에 **얹히는 소품**이라 충돌이 없다.
 *
 * ## 왜 AI 재생성이 아니라 코드인가
 * `recolor-mascot-vest.mjs`와 같은 이유다: AI로 두 번 그리면 실루엣·비율이 미묘하게 달라져
 * "같은 양의 다른 모습"이 아니라 **다른 양**이 된다. 리본만 얹으면 나머지 픽셀이 100% 동일하다.
 * 덤으로 이미지 생성 API 비용도 들지 않는다.
 *
 * ## 왜 목이 아니라 머리인가
 * 목 리본(보타이)은 정면에서 작게 보여 **36px 아바타에서 사라진다**(마스코트 통과 조건과 같은
 * 제약 — 작아졌을 때 남는 게 실루엣뿐이다). 머리 오른쪽 위에 달면 머리 윤곽 밖으로 살짝
 * 튀어나와 실루엣 자체가 달라지므로 작은 크기에서도 두 종류가 구분된다.
 * 오른쪽인 이유는 왼쪽에 엄지척 손이 있어 그쪽이 이미 시각적으로 무겁기 때문.
 *
 * 실행: node scripts/add-mascot-ribbon.mjs <in.png> <out.png>
 *   (입력 = 배경 투명한 512px 마스코트. 조끼 색은 입력에서 자동 샘플링해 리본에 쓴다 —
 *    레드팀 원본을 넣으면 빨간 리본, 그린팀을 넣으면 초록 리본이 나온다.)
 */
import { PNG } from "pngjs";
import { readFileSync, writeFileSync } from "node:fs";

const [, , inPath, outPath] = process.argv;
if (!inPath || !outPath) {
  console.error("사용법: node scripts/add-mascot-ribbon.mjs <in.png> <out.png>");
  process.exit(1);
}

const png = PNG.sync.read(readFileSync(inPath));
const { width: W, height: H, data } = png;
if (W !== 512 || H !== 512) {
  // 좌표가 512 기준 절대값이라 다른 크기가 들어오면 리본이 엉뚱한 데 붙는다.
  console.error(`⚠️ 512×512 입력을 기대했는데 ${W}×${H} 입니다. 좌표를 다시 잡아야 합니다.`);
  process.exit(1);
}

const px = (x, y) => (W * y + x) << 2;
const sample = (x, y) => [data[px(x, y)], data[px(x, y) + 1], data[px(x, y) + 2]];

/** 조끼 한가운데 — 팀 색을 여기서 읽어 리본에 그대로 쓴다(리본과 조끼가 세트로 보이게). */
const FILL = sample(250, 350);
/** 매듭은 날개보다 한 톤 진하게 — 평면으로 두면 리본이 그냥 얼룩처럼 보인다. */
const KNOT = FILL.map((v) => Math.round(v * 0.84));
/** 아웃라인 — 마스코트 선화와 같은 먹색. 얇으면 이 캐릭터 톤에서 붕 뜬다. */
const LINE = [15, 8, 7];
const OUTLINE_W = 9;

// ── 리본 배치(512 기준) ────────────────────────────────────────────────
// y=100에서 머리 오른쪽 끝이 x≈387이다. 중심을 x=360에 두면 오른쪽 날개가 머리 밖으로
// 20px쯤 나가 실루엣이 바뀐다 — 36px로 줄였을 때 두 종류를 가르는 게 바로 이 삐죽함이다.
const CX = 360, CY = 104;
const TILT = -8 * (Math.PI / 180); // 살짝 기울여야 붙여놓은 스티커처럼 안 보인다
const WING = { a: 27, b: 21, dx: 28, spread: 22 * (Math.PI / 180) };
const KNOT_R = 13;

/** 회전한 타원의 정규화 거리. <=1 이면 내부. */
function ellipse(x, y, cx, cy, a, b, rot) {
  const c = Math.cos(-rot), s = Math.sin(-rot);
  const dx = x - cx, dy = y - cy;
  const u = dx * c - dy * s, v = dx * s + dy * c;
  return (u * u) / (a * a) + (v * v) / (b * b);
}

/** 리본을 이루는 도형들. 바깥(pad)만큼 부풀린 판정도 같이 낸다 — 아웃라인 두께를 균일하게. */
function wingsHit(x, y, pad) {
  // 좌우 날개를 각각 바깥쪽으로 벌려 나비 모양을 만든다.
  const lx = CX - WING.dx * Math.cos(TILT), ly = CY - WING.dx * Math.sin(TILT);
  const rx = CX + WING.dx * Math.cos(TILT), ry = CY + WING.dx * Math.sin(TILT);
  return (
    ellipse(x, y, lx, ly, WING.a + pad, WING.b + pad, TILT - WING.spread) <= 1 ||
    ellipse(x, y, rx, ry, WING.a + pad, WING.b + pad, TILT + WING.spread) <= 1
  );
}
function knotHit(x, y, pad) {
  const r = KNOT_R + pad;
  const dx = x - CX, dy = y - CY;
  return dx * dx + dy * dy <= r * r;
}

/**
 * 4×4 슈퍼샘플링 — 한 픽셀 안에서 몇 개의 서브픽셀이 도형에 들어가는지로 커버리지를 낸다.
 * 이걸 안 하면 두꺼운 검정 아웃라인의 계단이 그대로 보인다(512px에서 특히 눈에 띈다).
 */
const SS = 4;
function coverage(x, y, hit, pad) {
  let n = 0;
  for (let sy = 0; sy < SS; sy++) {
    for (let sx = 0; sx < SS; sx++) {
      if (hit(x + (sx + 0.5) / SS, y + (sy + 0.5) / SS, pad)) n++;
    }
  }
  return n / (SS * SS);
}

/** src를 dst 위에 alpha만큼 올린다(일반 알파 합성). */
function blend(i, rgb, alpha) {
  if (alpha <= 0) return;
  const dstA = data[i + 3] / 255;
  const outA = alpha + dstA * (1 - alpha);
  for (let k = 0; k < 3; k++) {
    const dst = data[i + k] * dstA;
    data[i + k] = Math.round((rgb[k] * alpha + dst * (1 - alpha)) / (outA || 1));
  }
  data[i + 3] = Math.round(outA * 255);
}

// 그리는 순서 = 날개 아웃라인 → 날개 채움 → 매듭 아웃라인 → 매듭 채움.
// 합집합으로 한 번에 그리면 날개 사이 매듭 경계가 사라져 그냥 타원 두 개로 읽힌다.
const x0 = Math.max(0, CX - 120), x1 = Math.min(W - 1, CX + 120);
const y0 = Math.max(0, CY - 90), y1 = Math.min(H - 1, CY + 90);

for (let y = y0; y <= y1; y++) {
  for (let x = x0; x <= x1; x++) {
    const i = px(x, y);

    const wOut = coverage(x, y, wingsHit, OUTLINE_W);
    if (wOut > 0) blend(i, LINE, wOut);
    const wIn = coverage(x, y, wingsHit, 0);
    if (wIn > 0) blend(i, FILL, wIn);

    const kOut = coverage(x, y, knotHit, OUTLINE_W * 0.7);
    if (kOut > 0) blend(i, LINE, kOut);
    const kIn = coverage(x, y, knotHit, 0);
    if (kIn > 0) blend(i, KNOT, kIn);
  }
}

writeFileSync(outPath, PNG.sync.write(png));
console.log(`✅ 리본 합성: ${outPath}`);
console.log(`   리본색 rgb(${FILL}) · 매듭 rgb(${KNOT}) · 중심 (${CX},${CY})`);
