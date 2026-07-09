// OpenAI 이미지 생성(gpt-image-1) — 이식 가이드: docs 참고(easypost-marketing/OPENAI_IMAGE_GEN.md)
// 실행:
//   node --env-file=.env generate-image.mjs "a cozy Korean room at night, warm lamp light" out.png
//   node --env-file=.env generate-image.mjs "same character, now smiling" out2.png ref.png
//   (세 번째 인자로 레퍼런스 이미지를 주면 그 인물/화풍을 유지한 채 새 장면 생성)
// ⚠️ AI 이미지엔 글자(특히 한글) 넣지 말 것 — 배경/그림만 AI로, 글자는 코드로 합성.
import { writeFile, readFile } from "node:fs/promises";

const MODEL = "gpt-image-1";
const SIZE = process.env.OPENAI_IMAGE_SIZE || "1024x1536"; // 세로 2:3
const QUALITY = process.env.OPENAI_IMAGE_QUALITY || "medium"; // low|medium|high

const [, , prompt, outPath = "out.png", refPath] = process.argv;
const key = process.env.OPENAI_API_KEY;

if (!key) { console.error("❌ OPENAI_API_KEY 없음 (.env 확인)"); process.exit(1); }
if (!prompt) { console.error('❌ 사용법: node generate-image.mjs "프롬프트" out.png [ref.png]'); process.exit(1); }

async function textToImage() {
  return fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: MODEL, prompt, size: SIZE, quality: QUALITY, n: 1 }),
  });
}

async function imageWithReference(refBuffer) {
  const form = new FormData();
  form.append("model", MODEL);
  form.append("prompt", prompt);
  form.append("size", SIZE);
  form.append("quality", QUALITY);
  form.append("n", "1");
  // 레퍼런스는 여러 장도 가능: image[] 를 여러 번 append
  form.append("image[]", new Blob([refBuffer], { type: "image/png" }), "ref.png");
  return fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}` }, // ⚠️ Content-Type 직접 지정 금지(fetch가 multipart 경계 자동 설정)
    body: form,
  });
}

const res = refPath
  ? await imageWithReference(await readFile(refPath))
  : await textToImage();

if (!res.ok) {
  console.error(`실패 HTTP ${res.status}:`, (await res.text()).slice(0, 500));
  process.exit(1);
}
const json = await res.json();
const b64 = json?.data?.[0]?.b64_json;
if (!b64) { console.error("이미지 미반환:", JSON.stringify(json).slice(0, 300)); process.exit(1); }
await writeFile(outPath, Buffer.from(b64, "base64"));
console.log(`✓ 저장: ${outPath}`);
