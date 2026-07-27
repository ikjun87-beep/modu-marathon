/**
 * Expo config plugin — 시스템 다이얼로그(Alert)를 브랜드 색으로.
 *
 * 문제(2026-07-27 실기기 발견): 워치 동의창 버튼이 **청록색**으로 나왔다. 앱 전체가
 * Azure Blue인데 다이얼로그만 청록이라 "다른 앱 같다"는 인상을 준다. Alert은 삭제 확인·
 * 로그아웃·이름 입력 등 여러 곳에 쓰이므로 한 화면 문제가 아니라 **앱 전역 일관성 문제**다.
 *
 * 원인: prebuild가 만드는 `AppTheme`에 **colorAccent가 없다.** 그러면 부모 테마
 * (Theme.AppCompat.DayNight.NoActionBar)의 기본값 = 머티리얼 청록(#009688)이 쓰인다.
 * 게다가 colorPrimary도 Expo 기본값 #023c69로, 브랜드 블루(#2563c9)가 아니다.
 *
 * 왜 플러그인이어야 하나: `scripts/build-local-apk.sh`가 `prebuild --clean`으로 android/를
 * 통째로 재생성한다 → res/values/*.xml을 직접 고쳐도 매 빌드마다 지워진다. 살아남는 건 플러그인뿐.
 *
 * 색 값은 docs/DESIGN.md·src/lib/brand.ts와 같은 Azure Blue를 쓴다(단일 소스 유지).
 */
const { withAndroidColors, withAndroidStyles, AndroidConfig } = require("@expo/config-plugins");

const BRAND = "#2563c9"; // = Brand.brand (src/lib/brand.ts)

const { assignColorValue } = AndroidConfig.Colors;
const { assignStylesValue, getAppThemeGroup } = AndroidConfig.Styles;

module.exports = function withBrandDialogTheme(config) {
  // 1) colors.xml — colorPrimary를 브랜드로 덮고, colorAccent를 새로 심는다.
  config = withAndroidColors(config, (config) => {
    config.modResults = assignColorValue(config.modResults, {
      name: "colorPrimary",
      value: BRAND,
    });
    config.modResults = assignColorValue(config.modResults, {
      name: "colorAccent",
      value: BRAND,
    });
    return config;
  });

  // 2) styles.xml — AppTheme이 그 색을 실제로 쓰게 연결.
  //    colorAccent = 다이얼로그 버튼·커서·체크박스 등 강조 요소(AppCompat).
  //    colorPrimary는 prebuild가 이미 넣지만, 위에서 값을 브랜드로 바꿨으니 함께 맞는다.
  config = withAndroidStyles(config, (config) => {
    config.modResults = assignStylesValue(config.modResults, {
      add: true,
      parent: getAppThemeGroup(),
      name: "colorAccent",
      value: "@color/colorAccent",
    });
    return config;
  });

  return config;
};
