/**
 * 마스코트 배경 파내기 — 솔리드 마젠타(#ff00ff) 배경을 투명화한다.
 *
 * gpt-image-1에 "solid flat magenta background"를 명시적으로 요청해 크로마키 색상으로 쓴다
 * (build-mascot.mjs와 같은 기법 — AI에게 직접 투명/정확한 색을 요구하면 실패하니, 진하고
 * 캐릭터에 절대 안 쓰는 색을 배경으로 받아 코드로 오려낸다).
 *
 * 가장자리(4변)에서 flood fill로 배경만 골라낸다 — 캐릭터 안쪽에 우연히 비슷한 톤이 있어도
 * 테두리(검정 아웃라인)에 막혀 안으로 못 들어온다.
 *
 * 실행: node scripts/cutout-mascot-bg.mjs <in.png> <out.png>
 */
import { PNG } from "pngjs";
import { readFileSync, writeFileSync } from "node:fs";

const [, , inPath, outPath] = process.argv;
const png = PNG.sync.read(readFileSync(inPath));
const { width: W, height: H, data: D } = png;

// gpt-image-1이 실제로 뽑아준 마젠타는 순정 #ff00ff가 아니라 살짝 다른 톤으로 나온다
// (실측: rgb(240,30,142) 근방) — 하드코딩 대신 **이미지 좌상단 코너에서 실제 배경색을 샘플**한다.
const MAGENTA = [D[0], D[1], D[2]];
// 실측 결과 가장자리 마젠타에도 미세한 디더링/노이즈가 있어(B채널 ±90 변동) 60으로는 못 잡는 픽셀이
// 남았다 — 캐릭터 색(빨강 조끼·크림 울·남색 하의)과는 충분히 멀어서 100까지 올려도 안전하다.
const TOL = 100;
const near = (i, c, tol) =>
  Math.abs(D[i] - c[0]) < tol && Math.abs(D[i + 1] - c[1]) < tol && Math.abs(D[i + 2] - c[2]) < tol;

const seen = new Uint8Array(W * H);
const stack = [];
for (let x = 0; x < W; x++) stack.push(x, (H - 1) * W + x);
for (let y = 0; y < H; y++) stack.push(y * W, y * W + W - 1);

let cut = 0;
while (stack.length) {
  const p = stack.pop();
  if (seen[p]) continue;
  const i = p * 4;
  if (!near(i, MAGENTA, TOL)) continue;
  seen[p] = 1;
  D[i + 3] = 0;
  cut++;
  const x = p % W, y = (p / W) | 0;
  if (x > 0) stack.push(p - 1);
  if (x < W - 1) stack.push(p + 1);
  if (y > 0) stack.push(p - W);
  if (y < H - 1) stack.push(p + W);
}

// 경계 후광(반투명 마젠타 안티에일리어싱) 한 겹 더 제거
let halo = 0;
for (let p = 0; p < W * H; p++) {
  const i = p * 4;
  if (D[i + 3] === 0) continue;
  const x = p % W, y = (p / W) | 0;
  const edge = [p - 1, p + 1, p - W, p + W].some(
    (q) => q >= 0 && q < W * H && D[q * 4 + 3] === 0
  );
  if (edge && near(i, MAGENTA, 150)) { D[i + 3] = 0; halo++; }
}

// 몸 안쪽에 완전히 둘러싸인 배경색 웅덩이(엄지↔몸통 사이 좁은 틈 등) — 테두리 flood fill로는
// 안 닿는다(캐릭터 외곽선에 막혀 경계 밖 배경과 연결이 끊겨 있음). 실측: 이 웅덩이는 G채널이
// 유독 낮다(17~30) — 조끼 빨강(G~70대)·블러셔(G~150대 이상)·크림 울과는 확실히 갈린다.
// 색상 자체(마젠타 계열: R↑ G↓↓ B중간↑)로 한 번 더 잡는다.
let pocket = 0;
for (let p = 0; p < W * H; p++) {
  const i = p * 4;
  if (D[i + 3] === 0) continue;
  if (D[i] > 150 && D[i + 1] < 70 && D[i + 2] > 90) {
    D[i + 3] = 0;
    pocket++;
  }
}

writeFileSync(outPath, PNG.sync.write(png));
console.log(`배경 ${cut}px 제거 · 후광 ${halo}px 제거 · 갇힌 웅덩이 ${pocket}px 제거 → ${outPath}`);
