/**
 * Expo config plugin — react-native-health-connect 권한 런처 등록.
 *
 * RNHC는 MainActivity.onCreate에서 `HealthConnectPermissionDelegate.setPermissionDelegate(this)`를
 * 호출해 ActivityResultLauncher를 등록해야 한다. 이게 없으면 requestPermission() 호출 시
 * `kotlin.UninitializedPropertyAccessException: lateinit property requestPermission has not been initialized`
 * 로 앱이 네이티브 크래시난다. (라이브러리 README "React Native CLI template v2+" 안내)
 *
 * Expo(prebuild)는 MainActivity.kt를 자동 생성하므로, 이 플러그인이 생성된 MainActivity에
 * import + setPermissionDelegate 호출을 주입한다. 라이브러리 기본 app.plugin.js는
 * 권한 rationale 인텐트만 추가하고 이 등록은 하지 않으므로 별도로 필요하다.
 */
const { withMainActivity } = require("@expo/config-plugins");

const IMPORT_LINE =
  "import dev.matinzd.healthconnect.permissions.HealthConnectPermissionDelegate";
const DELEGATE_CALL = "HealthConnectPermissionDelegate.setPermissionDelegate(this)";

module.exports = function withHealthConnectPermissionDelegate(config) {
  return withMainActivity(config, (config) => {
    const { language } = config.modResults;
    let src = config.modResults.contents;

    if (language !== "kt") {
      throw new Error(
        `[withHealthConnectPermissionDelegate] Kotlin MainActivity를 기대했지만 '${language}' 입니다.`
      );
    }

    // 1) import 추가 (package 선언 바로 아래) — 없을 때만
    if (!src.includes(IMPORT_LINE)) {
      src = src.replace(/(^package .*$)/m, `$1\n\n${IMPORT_LINE}`);
    }

    // 2) super.onCreate(...) 직후에 delegate 등록 호출 추가 — 없을 때만
    if (!src.includes(DELEGATE_CALL)) {
      src = src.replace(
        /(super\.onCreate\([^)]*\))/,
        `$1\n    ${DELEGATE_CALL}`
      );
    }

    config.modResults.contents = src;
    return config;
  });
};
