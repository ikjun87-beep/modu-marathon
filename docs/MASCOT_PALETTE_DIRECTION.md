# MASCOT_PALETTE_DIRECTION.md — 마스코트·팔레트 전면 교체 방향 자문

> 회장 지시(2026-07-30): "너무 파란색이 위주. 새로 만들자. 아예." — 마스코트를 동물 의인화 캐릭터로 전면 교체하고, 블루 중심 팔레트를 탈피한다.
> 이 문서는 **방향 결정용**이다. 구현은 회장 승인 후 별도 착수.
> 작성: 황태경(디자인 리드) · IP 스팟체크: 방수민(변리사) 협업.

## 0. 이 결정이 왜 지금 중요한가

세션8 독립 채점(79→94점)이 지목한 "AI스럽다"의 3대 원인 중 ③번은 **"블루+화이트+그레이뿐인 팔레트 = v0/Bolt류 AI 스캐폴딩 문법"**이었다. 그 세션은 색을 늘리지 않고 표면 단계(`tint`)와 아바타 링 색 분기로 우회했다 — 원인을 없앤 게 아니라 증상을 가렸다. 이번 지시는 그 원인을 정면으로 없애라는 것이고, 옳은 방향이다.

단, 정면 돌파는 되돌릴 수 없는 지점들(앱 아이콘, 스토어 자산, 이미 라이브 배포 중인 웹)을 건드린다. 아래에서 범위를 명시한다.

---

## 1. 팔레트 방향 3안

공통 전제: **골드(`#c0841a`)는 순위·챌린지·성과 전용 시그널로 3안 모두 그대로 유지**한다. 이 의미 체계를 깨는 안은 제시하지 않았다.

### 안 A — 크림 러너 (레퍼런스 충실도 최고 · 탈블루 100%)

| 토큰 | 값 | 용도 |
|---|---|---|
| brand (주색) | `#2f6e4a` 포레스트 그린 | primary 액션(솔리드 버튼) |
| brandDeep | `#204d34` | pressed/hover |
| brandSoft | `#e6f0e8` | 옅은 강조 배경 |
| bg | `#f9f1e4` 크림 | 전체 배경 (레퍼런스의 `#f9ecdf`에 가장 가까움) |
| card | `#fffdf8` 웜 오프화이트 | 카드 |
| ink | `#2c2416` 웜 브라운블랙 | 본문 텍스트 |
| dark(시그니처) | `#26301f` 딥 올리브 | 랭킹 시상대 전용 다크 면 |
| gold | `#c0841a` (불변) | 순위·성과 |

**대비 실측** (WCAG AA 기준 본문 4.5:1 / 큰글자 3:1):
- ink(`#2c2416`) on bg(`#f9f1e4`) = **13.66:1** — AA 본문 통과
- white on brand(`#2f6e4a`) = **6.09:1** — AA 본문 통과 (버튼 텍스트)
- brand-light(`#5fbf85`, 다크면 텍스트/단위 전용) on dark(`#26301f`) = **6.08:1** — AA 본문 통과 (현행 `brandOnDark` 공식의 후속작)
- gold on dark(`#26301f`) = **4.30:1** — 큰 글자(배지 숫자)만 AA, 본문 크기엔 미달 → 골드를 다크 면 위 **작은 텍스트**에 쓸 땐 지금처럼 여전히 피해야 함(기존 규칙과 동일 결론)
- Team.red(`#d9484b`) on card = **4.15:1** — 큰 글자만 통과(현행과 동급, 회귀 아님)

**왜 AI스럽지 않은가**: 블루+화이트+그레이 3색 스캐폴딩 문법에서 완전히 벗어난다. 웜톤 배경 자체가 "누가 골라도 나오는 기본값"이 아니라 의도된 선택으로 읽힌다. 레퍼런스의 크림+초록 인상을 가장 정확히 계승.

**충돌 경고(중요)**: 현재 `Team.green`(`#2f8f5b`, 아바타 링 전용)과 이 안의 brand green(`#2f6e4a`)이 **1.51:1**로 사실상 같은 색 가족이다. 브랜드 액션 버튼과 그린팀 링이 화면에 같이 뜨면 "이 초록이 액션인지 팀 표시인지" 구분이 안 된다. **이 안을 채택하면 `Team.green`을 다른 색(예: 머스터드 `#c78a2e`나 틸 `#2f8f8a`)으로 교체해야 한다** — 이건 회장이 결정할 항목으로 아래 질문 목록에 넣었다.

### 안 B — 코랄 러너 (탈블루 100% · 완전히 다른 방향)

| 토큰 | 값 | 용도 |
|---|---|---|
| brand | `#c9542f` 테라코타 | primary 액션 |
| brandDeep | `#9c3f22` | pressed/hover |
| bg | `#faf6f0` | 전체 배경 |
| card | `#ffffff` | 카드 |
| ink | `#241f1c` | 본문 |
| dark(시그니처) | `#2a1c16` 에스프레소 브라운 | 랭킹 시상대 |

**대비 실측**: ink on bg = **15.15:1**(통과) · white on brand = **4.38:1**(큰글자만! 버튼 텍스트가 18px 이상 굵게가 아니면 미달 위험 — brandDeep 사용 권장, 6.67:1) · gold on dark(에스프레소) = **5.14:1**(본문 통과, 안A보다 낫다) · coral-light on dark = **6.66:1**.

**왜 AI스럽지 않은가**: 러닝의 "땀·에너지·열정"을 직관적으로 표현. 다만 **골드(#c0841a)와 브랜드 코랄(#c9542f)이 둘 다 웜톤 계열**이라 나란히 있을 때 "이게 순위 강조인지 그냥 브랜드색인지" 구분력이 안A보다 약하다 — 골드의 특별함이 희석된다는 게 이 안의 구조적 약점.

**리스크(반드시 방수민 재확인)**: 당근마켓(Karrot)의 브랜드 오렌지와 같은 계열이다. `#c9542f`는 당근의 순수 오렌지(`#ff8300` 계열)보다 채도를 낮추고 빨강 쪽으로 기울여 구분은 되지만, "한국 로컬 서비스=오렌지" 연상이 이미 강한 시장이라 첫인상에서 오해 소지가 있다.

### 안 C — 딥틸 브릿지 (절충 · 블루 계열 최소 변경)

| 토큰 | 값 | 용도 |
|---|---|---|
| brand | `#1f6d6b` 딥틸 | primary 액션 |
| brandDeep | `#154e4c` | pressed |
| bg | `#eef5f2` | 배경 |
| ink | `#1b2320` | 본문 |
| dark | 기존 `#141a2b` 유지 가능 | 시상대 |

**대비 실측**: ink on bg = **14.51:1** · white on brand = **6.07:1** · 새 `brandOnDark` 격(`#4fb8b0`) on 기존 dark = **7.27:1**(현행 `#4a8ae8`의 5.02:1보다 여유 있음).

**왜 이걸 넣었나(그리고 왜 추천하지 않는가)**: 앱 아이콘·스플래시·로고 SVG를 손대지 않고도 "파랑 느낌"은 줄일 수 있다는 **하지 않을 이유를 만드는 안**이다. 색상환에서 틸은 청록이라 "탈블루"를 부분적으로만 만족시킨다. 회장이 "아예"라고 명시했으므로, 이 안은 **리스크 최소화가 필요할 때의 대안**으로만 남겨둔다 — 1순위 추천은 아니다.

---

## 2. 마스코트 컨셉 3안

공통 원칙(현재 시스템에서 검증된 것 계승):
- **팀 구분(레드/그린)은 색으로**(조끼·스카프) — 이건 지금도 색만으로 잘 작동한다.
- **스타일 구분(현 "숏컷/포니테일")은 반드시 실루엣 형태로** — 색만 다르면 36~54px 썸네일에서 4종이 2종으로 보인다(과거 실패 이력, 포니테일의 검정 덩어리가 정답이었다). 아래 3안 모두 이 원칙을 그대로 적용했다.

### 안 1 — 양 (Sheep) · IP 리스크: 낮음~중하 [1순위 추천]
곱슬곱슬한 울 텍스처 몸통, 순하고 포근한 인상. "무리 지어 함께 뛰는 양떼"로 크루를 은유 — "혼자 뛰면 운동, 같이 뛰면 추억"이라는 기존 앱 톤과 정확히 맞는다. 회장이 보여준 레퍼런스 자체가 양에 가까운 실루엣이라 이질감이 없다.
- 스타일 A: 짧고 둥근 곱슬 앞머리 뭉치
- 스타일 B: 한쪽으로 땋아 늘어뜨린 울 다발(어깨 아래로 내려오는 형태 — 실루엣에서 확실히 튀어나옴)
- 한국 사용자 감정: 순함·평온·"양처럼 무던하게 완주" — 공격적이지 않은 성취감. 지친 포즈(레퍼런스의 엎어진 자세)와 잘 어울리는 동물.

### 안 2 — 수달 (Otter) · IP 리스크: 중 [2순위 추천]
둥근 머리 + 넓적한 꼬리, 수염. 수달은 실제로 무리 지어 다니는 습성(raft)이 있어 "함께"라는 크루 컨셉과 생물학적으로도 맞는다. 최근 한국에서 트렌디한 캐릭터 소재.
- 스타일 A: 짧은 수염만
- 스타일 B: 머리 위 작은 리본 + 약간 더 긴 수염
- 감정: 발랄함·사교성·물가의 자유로움. 양보다 조금 더 "액티브"한 인상이라 러닝의 스피드감을 원하면 이쪽.

### 안 3 — 진돗개 (Jindo dog) · IP 리스크: 높음 [보류 권고]
쫑긋 선 삼각 귀 + 등 위로 말린 꼬리(진돗개 특유 실루엣), "국민견·신뢰·완주 파트너" 서사는 매력적이다. 그러나 **방수민 자문 결과, 카카오프렌즈의 "프로도"가 이미 진돗개(백구) 모티브 캐릭터로 존재**한다. 선 귀+말린 꼬리 자체는 견종의 생물학적 특징이라 보호 대상이 아니지만, 여기에 "통통·점눈·두꺼운 검정 아웃라인·플랫 셰이딩"까지 겹치면 결합 인상이 실질적으로 유사해질 소지가 크다는 게 결론이다. 특히 스타일 A(귀만 있는 기본형)가 위험하고, 진행한다면 스타일 B의 리본·꼬리 장식을 전 스타일 공통 필수 요소로 올리고 몸통 비율·색조합을 프로도와 뚜렷이 갈라야 한다. **지금 단계에서는 후보에서 제외하고, 양/수달로 방향을 잡은 뒤에도 진돗개를 꼭 쓰고 싶다면 그때 별도로 디자인 등록 조사부터 선행할 것을 권고.**

### 스타일 자체의 안전성
"점눈+두꺼운 검정 아웃라인+플랫 셰이딩"은 카카오·라인프렌즈만의 것이 아니라 이모티콘 업계 전반의 관용적 화풍이며, 저작권법상 **스타일 자체는 보호 대상이 아니고 구체적 캐릭터의 실루엣·비율·소품 조합(표현)만 보호**된다는 게 방수민의 확인이다. 즉 이 화풍을 계속 쓰는 것 자체는 문제없고, 문제는 "어떤 동물+어떤 실루엣 조합이냐"에서만 생긴다.

> **한계 고지**: 방수민의 검토는 KIPRIS·디자인등록 DB 실검색이 아니라 공개적으로 알려진 캐릭터 특징에 대한 판단이다. 최종 생성물 확정 전(특히 진돗개를 쓰기로 할 경우) 실제 디자인등록 조사를 별도로 거칠 것을 권고한다.

---

## 3. gpt-image-1 프롬프트 초안 (영어 · 글자 금지)

`docs/OPENAI_IMAGE_GEN.md` 파이프라인 기준. 1장을 레퍼런스로 확정한 뒤 `/v1/images/edits`로 팀색·스타일 변형을 파생시키는 기존 4종 워크플로를 그대로 쓴다. 배경색은 §1에서 최종 채택한 팔레트에 맞춰 조정.

**안 1 — 양(기본형, 스타일 A · 레드팀)**
```
Cute chubby sheep character in a Korean emoticon/mascot illustration style (Kakao Friends /
LINE Friends style), running pose with one arm swinging forward and legs mid-stride, thumbs-up
with the other hand. Round fluffy woolly body texture on the head and body outline, simple dot
eyes, small pink cheek blush, warm friendly smile. Wearing a red running vest and navy shorts,
yellow running shoes. Thick black outline, flat cell-shaded coloring, no gradients. Warm cream
beige background (#f9f1e4). Short round curly wool tuft on top of the head (style A). Single
character, centered, no text, no letters, no logo, no watermark anywhere.
```

**안 1 — 양(스타일 B · 그린팀 변형, `image[]`에 위 결과물 첨부해 실행)**
```
Keep the EXACT same sheep character from the reference image — identical face, body shape,
proportions, and illustration style. Change: wool tuft on head is now braided to one side,
hanging past the shoulder (style B, must read as a distinct silhouette shape, not just a color
change). Change vest color to green. Everything else identical. No text, no letters, no logo.
```

**안 2 — 수달(기본형, 스타일 A · 레드팀)**
```
Cute chubby otter character in a Korean emoticon/mascot illustration style, running pose with
one arm swinging forward, thumbs-up with the other hand, flat wide tail visible behind. Round
head, simple dot eyes, short whiskers on cheeks, warm friendly smile, small pink cheek blush.
Wearing a red running vest and navy shorts, yellow running shoes. Thick black outline, flat
cell-shaded coloring, no gradients. Warm cream beige background. Single character, centered,
no text, no letters, no logo, no watermark anywhere.
```

**안 2 — 수달(스타일 B 변형)**
```
Keep the EXACT same otter character from the reference image — identical face, body shape,
proportions, and illustration style. Change: add a small ribbon accessory on top of the head,
whiskers slightly longer and more prominent (style B, distinct silhouette from style A). Change
vest color to green. Everything else identical. No text, no letters, no logo.
```

**안 3 — 진돗개(보류 중이나 참고용 초안)**
```
Cute chubby Korean Jindo dog character in an emoticon/mascot illustration style, running pose,
thumbs-up. Erect triangular ears, tail curled tightly over the back (Jindo breed silhouette).
Round head, simple dot eyes, warm smile. Wearing a red running vest, navy shorts, yellow shoes.
Thick black outline, flat cell-shaded coloring. Warm cream background. IMPORTANT: keep body
proportions and facial features clearly distinct from generic round-head dog mascots — slightly
longer snout, leaner body ratio than a typical chibi puppy. Single character, no text, no logo.
```
(진돗개는 §2 결론에 따라 생성 전 디자인등록 조사 선행 권고.)

---

## 4. 교체 범위 · 순서 · 리스크

### 범위 (블루가 박혀 있는 전체 목록)
| 위치 | 파일 | 현재 상태 |
|---|---|---|
| 앱 색 토큰 | `app/src/lib/brand.ts` | 단일 소스, 교체 시 여기부터 |
| 앱 아이콘/스플래시 | `app/app.json` (`adaptiveIcon.backgroundColor`, `splash.backgroundColor` = `#2563c9`) | 빌드 재생성 필요 |
| 앱 마스코트 자산 | `app/assets/images/mascot-*.png` 4종 | 재생성 대상 그 자체 |
| 웹 | `web/index.html` CSS 변수, `web/brand/*.svg`(mark·mark-white·favicon·logo-horizontal·og) | **이미 라이브 배포 중**(modu-marathon.web.app) |
| 문서 | `docs/DESIGN.md`, `CLAUDE.md` | 사후 갱신 |

### 순서 제안
1. **앱에서 먼저 파일럿한다.** 웹은 이미 공개 서비스이고 앱은 아직 스토어 미출시(회장 방침: "급하지 않음, 준비 트랙")라 실패 비용이 훨씬 낮다.
2. 팔레트 1안 확정 → `brand.ts` 갱신 → 실기기 캡처로 세션8과 동일한 독립 채점 재실행(회귀 확인 — 특히 대비·시그니처 카드 규칙이 새 팔레트에서도 성립하는지).
3. 마스코트 4종 재생성(레퍼런스 1장 확정 → edits로 3종 파생) → `strip-mascot-shadow.mjs` → `optimize-mascot.mjs` 기존 파이프라인 그대로 재사용.
4. `app/src/lib/mascot.ts`의 `MascotKind`를 새 키(예: `"sheep-red"` 등)로 교체 — **이미 v1→v2 마이그레이션 전례가 있어(코드에 `normalize()` 함수로 옛 키를 새 키로 이관하는 패턴이 이미 구현돼 있음) 기술 리스크는 낮다.** 기기 로컬 저장(AsyncStorage)이라 서버 마이그레이션도 불필요.
5. 앱에서 확정되면 그때 웹 반영 여부를 별도 승인받는다 — 웹은 배포가 곧 실사용자 노출이라, 이번 건과 별개로 "배포 승인" 게이트를 하나 더 거치는 게 맞다(현재도 "배포 일절 안 함, 완성 후에" 방침이 살아있음).

### 되돌릴 수 없는 지점
- **앱 아이콘/스플래시 재빌드 후 배포**: 스토어 출시 전이라 지금은 리스크 낮음. 스토어 심사 제출 이후엔 아이콘 변경이 재심사를 유발하므로, **아이콘은 스토어 출시 직전에 최종 확정**하는 편이 안전 — 지금 단계에서 확정해도 되지만 "이게 마지막"이라는 전제로 정할 것.
- **웹 브랜드 SVG 교체 후 배포**: 이미 검색엔진에 인덱싱되고 카톡 등에 공유된 OG 이미지가 존재할 수 있다 → 배포 즉시 소급 적용은 안 되니, 배포 타이밍은 회장 승인 별도.
- **마스코트 동물 확정 후 4종 세트 완성**: 레퍼런스 1장을 컨펌하는 순간부터 나머지 3종이 그 얼굴에 종속된다(캐릭터 고정 워크플로 특성상). 동물 자체를 바꾸는 재작업은 처음부터 다시 — 그래서 §2 결론(양 1순위, 진돗개 보류)을 먼저 확정하는 게 비용을 아낀다.

---

## 5. 추천 1안

**팔레트: 안 A(크림 러너, 포레스트 그린+크림) / 마스코트: 안 1(양)**

이유:
1. 회장의 지시가 "아예"였다 — 안 C(딥틸 브릿지)처럼 절반만 바꾸는 선택지는 지시의 정신을 충족하지 못한다.
2. 안 A는 골드와 브랜드색이 확실히 다른 온도(그린=차분한 자연톤, 골드=따뜻한 금속톤)라 "골드=특별한 순간"이라는 기존 의미 체계가 안 B보다 선명하게 유지된다. 안 B(코랄)는 브랜드색과 골드가 둘 다 웜톤이라 이 신호가 흐려진다.
3. 마스코트 안 1(양)은 IP 리스크가 가장 낮고, 회장이 보여준 레퍼런스 실루엣과 가장 가깝다 — "이것처럼"이라는 지시를 가장 직접적으로 만족시킨다.
4. 단, 이 조합을 채택하면 **`Team.green`(아바타 링)을 반드시 다른 색으로 옮겨야 한다** — 이건 부가 비용이 아니라 필수 후속 작업이며, 아래 질문 1번으로 확인받는다.

---

## 회장이 결정할 항목

1. **팔레트 3안 중 확정**: 안 A(크림+그린) / 안 B(코랄) / 안 C(딥틸 브릿지) 중 선택. (추천: 안 A)
2. **안 A 채택 시**: `Team.green`(현 `#2f8f5b`, 아바타 링 전용)을 다른 색(예: 머스터드 `#c78a2e` 또는 틸 `#2f8f8a`)으로 옮기는 것에 동의하는지 — 브랜드 그린과 충돌하기 때문.
3. **마스코트 동물 확정**: 양(1순위) / 수달(2순위) / 진돗개(IP 리스크로 보류 권고, 그래도 진행 원하면 디자인등록 조사 선행).
4. **범위**: 이번 교체를 **앱만** 먼저 할지, **웹까지** 함께 갈지. (추천: 앱 파일럿 → 검증 후 웹은 별도 배포 승인)
5. **앱 아이콘/스플래시(`app.json`)도 이번에 같이 바꿀지**, 아니면 스토어 출시 시점까지 미룰지.
6. **레퍼런스 이미지 1장 확정 방식**: gpt-image-1로 여러 장 뽑아 회장이 픽업할지, 황태경이 1차 압축해서 3~5장만 올릴지.

---

**참고 파일**: `app/src/lib/brand.ts`(현 토큰) · `app/src/lib/mascot.ts`(선택 저장 구조) · `docs/DESIGN.md` · `docs/OPENAI_IMAGE_GEN.md` · `app/assets/images/mascot-*.png`(현재 자산) · `app/scripts/strip-mascot-shadow.mjs` · `app/scripts/optimize-mascot.mjs`
