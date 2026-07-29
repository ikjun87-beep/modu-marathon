/** 5키로(구 모두의 마라톤) 색 토큰 — docs/DESIGN.md 기준 (웹 index.html의 CSS 변수와 정렬).
 *  웹·앱이 같은 팔레트를 쓰도록 유지(에디토리얼 프리미엄).
 *  메인 = Azure Blue #2563c9 (2026-07-12 확정 · 당근 오렌지와 분리 · 블루+골드 = 프리미엄 메달 감성). */
export const Brand = {
  brand: "#2563c9",
  brandDeep: "#1b4ea3",
  brandSoft: "#eaf1fd",
  brandLine: "#c5d8f6",
  accent: "#c0841a",
  accentSoft: "#f6efdd",
  gold: "#c0841a",
  ink: "#161a22",
  ink2: "#363d49",
  soft: "#5f6773",
  faint: "#98a1ae",
  /** 입력칸 placeholder 전용 — 실제 입력값(ink)과 확실히 갈라야 "내가 뭘 넣었는지"가 보인다.
   *  예전엔 soft(#5f6773)·faint가 섞여 쓰여, 예시값이 입력값처럼 읽혔다(감사 지적). */
  placeholder: "#aab3c0",
  line: "#e8ecf2",
  line2: "#dde3ec",
  bg: "#f5f7fb",
  warm: "#eef2f8",
  card: "#ffffff",
  dark: "#141a2b",
  /** 표면 4단계의 3번째 — 브랜드 4% 틴트. (2026-07-28 R12)
   *  독립 채점 R11의 결론: "블루+화이트+그레이뿐이라 화면마다 정체성이 없다"가
   *  AI스러움의 근본 원인. 색을 **늘리지 않고** 표면 단계를 늘려 공기를 바꾼다.
   *  bg(전체배경) < tint(섹션·헤더) < card(흰 카드) < dark(시그니처) 순으로 쓸 것. */
  tint: "#eef3fc",
  /** **다크 면 위 전용 블루.** (2026-07-29 R14 · 실측으로 확정)
   *
   *  브랜드 블루(#2563c9)를 다크 네이비(#141a2b) 위에 그대로 쓰면 대비가 **3.06:1**로
   *  WCAG AA(본문 4.5:1)에 미달한다 — 단위(km)처럼 11~13px 작은 글자라 "큰 텍스트 3:1"
   *  완화도 못 받는다. 밝기만 올린 같은 계열 파랑으로 **5.02:1**을 확보한다.
   *  ⚠️ 라이트 배경에는 쓰지 말 것 — 흰 카드 위에서는 오히려 흐려진다. */
  brandOnDark: "#4a8ae8",
} as const;

/** 팀색 — 마스코트 레드/그린 팀. **아바타 링에만** 쓴다. (2026-07-28 R12)
 *
 *  브랜드 팔레트를 건드리지 않고 화면에 색 다양성을 얻는 방법이다: 사람마다 링 색이
 *  달라지므로 크루·랭킹·타임라인처럼 여러 명이 나오는 화면이 자동으로 다채로워진다.
 *  ⚠️ 링(테두리) 외의 용도로 확장하지 말 것 — 강조색 2개 혼용은 NRC가 실패한 길이다
 *  (네온그린+오렌지를 섞어 "브랜드색이 뭔지 모르겠다"는 비판을 받았다). */
export const Team = {
  red: "#d9484b",
  green: "#2f8f5b",
} as const;

/**
 * 폰트 — LINE Seed Sans KR (SIL OFL 1.1, 한글 11,172자 완전지원. assets/fonts/README.md 참조)
 *
 * ⚠️ **굵기는 Regular(400)·Bold(700) 두 벌뿐이다.** app.json의 expo-font 플러그인이
 * 이 둘을 "LINESeed" 한 family로 묶어서 fontWeight가 네이티브로 동작한다.
 * 그래서 **600·800·900을 써봐야 400 아니면 700으로 반올림**된다 — 아래 Weight를 쓸 것.
 */
export const FONT = "LINESeed";

/** 디스플레이(숫자) 서체 — Black Han Sans(OFL). **큰 숫자에만** 쓴다.
 *
 *  본문까지 이걸로 덮으면 답답해진다. 거리·기록처럼 "이 앱의 주인공 숫자"만 이 서체로 뽑아
 *  카드가 똑같이 반복되는 인상을 깬다(디자인 감사: "AI스럽다"의 원인은 폰트가 아니라
 *  컴포넌트 반복의 단조로움 — 처방은 폰트 교체가 아니라 **시그니처 요소 만들기**).
 *  웹(index.html)이 이미 같은 서체를 쓰고 있어 웹·앱의 시각 DNA도 맞는다.
 *  굵기는 1종(400)뿐이라 fontWeight를 줘도 변하지 않는다. */
export const FONT_DISPLAY = "BlackHanSans";

/** 굵기 — 실제 파일이 있는 값만 쓴다(그래야 의도한 대로 보인다).
 *  이전엔 800이 60곳·900이 22곳이라 화면 전체가 초굵게 = "강하다·스포티하다"였다.
 *  귀여운 톤은 굵기 대비를 낮추고 여백으로 위계를 만든다. */
export const Weight = {
  /** 본문·라벨·설명 — 화면의 기본값 */
  regular: "400",
  /** 제목·버튼·숫자 — 강조가 필요한 곳만 */
  bold: "700",
} as const;

/** 모서리 — 이전엔 6·9·10·11·12·14·16·18·20·22가 뒤섞여 통일도 안 되고 각졌다.
 *  둥글수록 부드럽다. 작은 칩부터 큰 카드까지 이 계단만 쓸 것. */
export const Radius = {
  chip: 10, // 태그·작은 배지
  input: 14, // 입력칸·작은 버튼
  card: 20, // 일반 카드·리스트 아이템
  hero: 26, // 히어로·모달·큰 카드
  pill: 999, // 완전 둥근 버튼
} as const;

/** 성장·성공을 나타내는 의미색(월간 리포트 등). 골드와 함께 성취 신호로 쓴다. */
export const Semantic = {
  good: "#16a34a",
  goodSoft: "#e7f6ec",
  bad: "#dc2626",
} as const;

/** 그림자 — 카드에 부드러운 입체감. 1px 테두리만 쓰면 와이어프레임처럼 납작하다.
 *  iOS=shadow* / Android=elevation 병행. 흰 카드를 옅게 띄워 프리미엄 톤을 만든다.
 *  색은 **브랜드 블루 계열**로 — 순검정·회색 그림자는 탁하고 싸 보인다.
 *  (RN은 그림자를 한 겹만 지원해 CSS식 2단 그림자는 못 쓴다. 대신 색조로 프리미엄감을 낸다.) */
export const Shadow = {
  /** 일반 카드·리스트 아이템 — 살짝 뜬 느낌.
   *  ⚠️ opacity를 0.07까지 낮췄더니 카드가 배경에 붙어 보여 elevation 위계가 사라졌다(감사 지적).
   *  흰 카드 위 옅은 배경(#f5f7fb)에서는 0.15 정도는 돼야 "떠 있다"가 읽힌다. */
  soft: {
    shadowColor: "#2563c9",
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 3,
  },
  /** 강조 카드·히어로 — 확실히 떠 있는 느낌 */
  card: {
    shadowColor: "#1b3a6b",
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.14,
    shadowRadius: 24,
    elevation: 5,
  },
} as const;

/** 카드 상단 헤어라인 — 흰 카드가 흰 배경 위에서 밋밋할 때 경계를 은은하게 세운다.
 *  테두리를 두르면 와이어프레임이 되므로 **위쪽 1px만** 브랜드 톤으로. */
export const Hairline = {
  borderTopWidth: 1,
  borderTopColor: "#e3ecfa",
} as const;
