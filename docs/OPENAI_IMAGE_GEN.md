# OpenAI 이미지 생성(gpt-image-1) 이식 가이드

> 다른 프로젝트에 **OpenAI 이미지 생성 부분만** 떼어 쓰기 위한 자립형 문서.
> 계정 발급 → 키 설정 → 이미지 요청까지 이 문서 하나로 끝난다.
> 검증 환경: Node.js v24 · 외부 npm 패키지 거의 불필요(내장 `fetch`/`FormData` 사용).

핵심 요약
- 엔진: **OpenAI `gpt-image-1`** (DALL·E 아님. 젠스파크 Image Studio와 동일 엔진).
- 두 가지 요청:
  1. **text-to-image** = `POST /v1/images/generations` (프롬프트만으로 새 이미지)
  2. **image-to-image / 캐릭터 고정** = `POST /v1/images/edits` (레퍼런스 이미지 첨부 → 같은 인물/화풍 유지)
- 응답은 **base64(`b64_json`)** 로 옴 → 그대로 파일로 저장.
- ⚠️ **AI 이미지에 글자(특히 한글) 넣지 말 것** — 깨진다. 배경/그림만 AI로 만들고, 글자는 코드로 따로 합성.

---

## 1) 계정·키 발급 (최초 1회)

1. **OpenAI 플랫폼 로그인** — https://platform.openai.com
2. **결제수단 등록(필수)** — 이미지 API는 유료. `Settings → Billing`에서 카드 등록 후 크레딧 충전(선불). 최소 $5~10이면 수백 장 생성 가능.
3. **(중요) 조직 인증** — `gpt-image-1`은 조직(Organization) **본인 인증**이 필요할 수 있음. `Settings → Organization → General`에서 "Verify Organization" 요구가 뜨면 신분 인증을 마쳐야 이 모델이 열린다. (인증 없으면 아래 403 `must be verified` 오류)
4. **API 키 발급** — https://platform.openai.com/api-keys → `Create new secret key` → **키는 이때 한 번만 보임**, 복사해서 안전하게 보관.
5. 발급한 키를 프로젝트 `.env`에 저장:
   ```
   OPENAI_API_KEY=sk-...(발급받은키)
   ```
   `.env`는 **절대 git에 커밋 금지**(`.gitignore`에 `.env` 추가).

> 네트워크 메모: `api.openai.com`은 대부분의 회사망에서도 열린다(인스타 API처럼 SNI 차단되는 경우와 다름).

---

## 2) 프로젝트 준비

Node.js **18 이상**이면 `fetch`·`FormData`·`Blob`이 내장이라 별도 HTTP 라이브러리가 필요 없다.

`.env` 로딩 방법(둘 중 하나):
- **Node 20.6+**: 패키지 없이 실행 시 `node --env-file=.env script.mjs`
- **또는 dotenv 사용**: `npm i dotenv` 후 스크립트 맨 위에 `import "dotenv/config";`

`package.json`에 `"type": "module"` 을 넣으면 아래 `.mjs`/`import` 문법이 그대로 동작한다(또는 파일 확장자를 `.mjs`로).

---

## 3) API 파라미터 (gpt-image-1 기준)

| 파라미터 | 값 | 설명 |
|---|---|---|
| `model` | `"gpt-image-1"` | 고정 |
| `prompt` | 문자열 | 영어로 쓰면 품질이 안정적. 원하는 장면·화풍을 구체적으로. |
| `size` | `1024x1024`(정사각) · `1024x1536`(세로 2:3) · `1536x1024`(가로) · `auto` | |
| `quality` | `low` · `medium` · `high` · `auto` | 높을수록 장당 비용↑ |
| `n` | 정수 | 한 번에 받을 장수(보통 1) |

- **응답 형식**: gpt-image-1은 항상 base64로 반환 → `json.data[0].b64_json` 를 디코드해 저장. (`response_format` 지정 불필요)
- **비용(실측 참고)**: `medium` · `1024x1536` 기준 대략 **장당 $0.04~0.06**(9장 ≈ $0.45로 확인됨). 가격은 바뀌므로 https://openai.com/api/pricing 확인.

---

## 4) 복붙용 최소 스크립트

아래 한 파일이면 **text-to-image**와 **레퍼런스 기반(캐릭터 고정)** 둘 다 된다. 프로젝트 특화 로직(장면 목록·경로)은 다 걷어낸 범용 버전.

`generate-image.mjs`:
```js
// 실행:
//   node --env-file=.env generate-image.mjs "a cozy Korean room at night, warm lamp light" out.png
//   node --env-file=.env generate-image.mjs "same woman, now smiling on a sofa" out2.png ref.png
//   (세 번째 인자로 레퍼런스 이미지를 주면 그 인물/화풍을 유지한 채 새 장면 생성)
import { writeFile, readFile } from "node:fs/promises";

const MODEL = "gpt-image-1";
const SIZE = process.env.OPENAI_IMAGE_SIZE || "1024x1536";   // 세로 2:3
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
```

`dotenv`를 쓰는 경우는 맨 위에 `import "dotenv/config";` 한 줄만 추가하고 `--env-file` 없이 `node generate-image.mjs ...` 로 실행.

---

## 5) 캐릭터·화풍 고정하는 법 (핵심 노하우)

같은 인물/마스코트를 여러 장에 걸쳐 **동일하게** 유지하려면 `text-to-image`(generations)로는 안 된다(매번 얼굴이 달라짐). 대신:

1. **레퍼런스 원본 1장**을 확보(잘 나온 캐릭터 이미지 PNG).
2. 위 스크립트의 **레퍼런스 경로 인자**로 그 파일을 넘긴다 → 내부적으로 `/v1/images/edits`에 `image[]`로 첨부됨.
3. 프롬프트에 **"똑같은 인물을 유지하라"**를 명시:
   ```
   Keep the EXACT same character from the reference image — identical face, hair, and
   illustration style. New scene: <원하는 장면 묘사>. One main character. NO text, no letters,
   no logo, no watermark anywhere.
   ```
4. 화풍(예: 웹툰풍, 셀 셰이딩), 색 팔레트, 구도(예: 상단 35%는 비워 헤드라인 자리 확보)까지 프롬프트에 고정하면 톤이 일관됨.

> 여러 각도가 필요하면 레퍼런스를 2~3장 첨부(`image[]` 여러 번 append)하면 일관성이 더 올라간다.

---

## 6) 자주 나는 오류 → 해결

| HTTP/코드 | 뜻 | 해결 |
|---|---|---|
| `401` invalid_api_key | 키 오타/폐기 | `.env`의 `OPENAI_API_KEY` 재확인·재발급 |
| `403` "organization must be verified" | 조직 인증 필요 | 플랫폼 `Settings → Organization`에서 본인 인증(1단계 3번) |
| `400` billing_hard_limit / insufficient_quota | 크레딧 없음 | Billing에서 크레딧 충전 |
| `429` rate limit | 요청 과다 | 잠시 후 재시도·간격 두기 |
| `400` moderation_blocked | 프롬프트가 정책 위반 감지 | 표현 순화(폭력·성적·실존인물 등 회피) |
| 이미지에 글자가 깨져 나옴 | 정상(모델 한계) | 프롬프트에 "NO text" 넣고, 글자는 코드로 따로 합성 |

---

## 7) 이식 체크리스트

- [ ] OpenAI 결제수단 등록 + (필요 시) 조직 인증 완료
- [ ] `OPENAI_API_KEY`를 새 프로젝트 `.env`에 넣고 `.gitignore`에 `.env` 추가
- [ ] Node 18+ 확인 (`node -v`)
- [ ] `generate-image.mjs` 복사 → `node --env-file=.env generate-image.mjs "..." out.png` 로 1장 테스트(비용 소액)
- [ ] 캐릭터 고정 필요하면 레퍼런스 PNG 1장 준비 후 세 번째 인자로 전달
- [ ] 실사용 전 `low` 품질로 프롬프트 튜닝 → 확정되면 `medium`/`high`로 최종 생성(비용 절약)

---

### 원본 위치(참고)
이 가이드는 `easypost-marketing/automation/src/openai-image.mjs`를 범용화한 것. 원본은 장면 목록(`SCENES`)·이지원 캐릭터 레퍼런스·저장 경로가 프로젝트에 맞춰 하드코딩돼 있으니, 그 구조가 필요하면 원본도 함께 참고.
