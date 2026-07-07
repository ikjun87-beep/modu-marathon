/**
 * Expo config plugin — Health Connect Android 14+ 클라이언트 등록.
 *
 * 문제(회장 실기기 확정): Health Connect '앱 및 기기 권한' 목록에 나이키런·신한쏠은
 * 뜨는데 "모두의 마라톤"은 안 뜸 → requestPermission이 권한 UI를 못 띄우고 read 시
 * SecurityException. 즉 앱이 HC 클라이언트로 등록조차 안 됨.
 *
 * 근본원인: react-native-health-connect의 기본 app.plugin.js는 **구버전(Android 13 이하)**
 * 방식인 `androidx.health.ACTION_SHOW_PERMISSIONS_RATIONALE` 인텐트만 MainActivity에
 * 추가한다. **Android 14+(One UI 6 등, HC가 OS에 통합)** 에서는 앱이 HC 목록에 뜨고
 * 권한을 받으려면 아래가 매니페스트에 **필수**다(구글 공식 get-started 문서):
 *   1) VIEW_PERMISSION_USAGE 인텐트를 처리하는 activity-alias
 *      (category HEALTH_PERMISSIONS, permission START_VIEW_PERMISSION_USAGE)
 *      → 개인정보 처리방침(rationale)을 보여줄 액티비티. Expo는 별도 네이티브 액티비티가
 *        없으므로 MainActivity를 target으로 삼는다(선언만으로 HC 등록 조건 충족).
 *   2) <queries> 에 Health Connect 패키지(com.google.android.apps.healthdata) 가시성.
 *      (라이브러리 매니페스트에서 병합될 수 있으나, 명시로 확실히 보장)
 *
 * 참고: RNHC 기본 플러그인이 넣는 ACTION_SHOW_PERMISSIONS_RATIONALE(Android 13 이하)는
 *       그대로 두고, 여기서 Android 14+ 경로만 보강한다.
 */
const { withAndroidManifest } = require("@expo/config-plugins");

const ALIAS_NAME = "ViewPermissionUsageActivity";
const HEALTH_DATA_PACKAGE = "com.google.android.apps.healthdata";

module.exports = function withHealthConnectAndroid14(config) {
  return withAndroidManifest(config, (config) => {
    const manifest = config.modResults.manifest;
    const app = manifest.application && manifest.application[0];
    if (!app) {
      throw new Error("[withHealthConnectAndroid14] <application>을 찾지 못했습니다.");
    }

    // 1) VIEW_PERMISSION_USAGE activity-alias (Android 14+ HC 등록 필수)
    app["activity-alias"] = app["activity-alias"] || [];
    const aliasExists = app["activity-alias"].some(
      (a) => a && a.$ && a.$["android:name"] === ALIAS_NAME
    );
    if (!aliasExists) {
      app["activity-alias"].push({
        $: {
          "android:name": ALIAS_NAME,
          "android:exported": "true",
          "android:targetActivity": ".MainActivity",
          "android:permission": "android.permission.START_VIEW_PERMISSION_USAGE",
        },
        "intent-filter": [
          {
            action: [
              { $: { "android:name": "android.intent.action.VIEW_PERMISSION_USAGE" } },
            ],
            category: [
              { $: { "android:name": "android.intent.category.HEALTH_PERMISSIONS" } },
            ],
          },
        ],
      });
    }

    // 2) <queries> 에 Health Connect 패키지 가시성 보장
    manifest.queries = manifest.queries || [];
    if (manifest.queries.length === 0) manifest.queries.push({});
    const q = manifest.queries[0];
    q.package = q.package || [];
    const hasHealthData = q.package.some(
      (p) => p && p.$ && p.$["android:name"] === HEALTH_DATA_PACKAGE
    );
    if (!hasHealthData) {
      q.package.push({ $: { "android:name": HEALTH_DATA_PACKAGE } });
    }

    return config;
  });
};
