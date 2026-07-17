/** 모두의 마라톤 색 토큰 — docs/DESIGN.md 기준 (웹 index.html의 CSS 변수와 정렬).
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
  line: "#e8ecf2",
  line2: "#dde3ec",
  bg: "#f5f7fb",
  warm: "#eef2f8",
  card: "#ffffff",
  dark: "#141a2b",
} as const;

/**
 * 폰트 — LINE Seed Sans KR (SIL OFL 1.1, 한글 11,172자 완전지원. assets/fonts/README.md 참조)
 *
 * ⚠️ **굵기는 Regular(400)·Bold(700) 두 벌뿐이다.** app.json의 expo-font 플러그인이
 * 이 둘을 "LINESeed" 한 family로 묶어서 fontWeight가 네이티브로 동작한다.
 * 그래서 **600·800·900을 써봐야 400 아니면 700으로 반올림**된다 — 아래 Weight를 쓸 것.
 */
export const FONT = "LINESeed";

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
