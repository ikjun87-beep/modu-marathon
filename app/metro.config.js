// Metro 설정 — Expo 기본값 + firebase JS SDK(v10) 해석 교정.
//
// 왜 필요한가: Expo SDK 53+는 Metro의 package exports 해석을 기본 활성화한다
// (`unstable_enablePackageExports: true`). 그런데 firebase v10은 exports 맵이 이 방식과
// 맞지 않아 `@firebase/app` 사본이 둘로 갈린다(dual-package hazard) — auth 컴포넌트는 한쪽에
// 등록되고 앱 인스턴스는 다른 쪽에서 조회되어, 실기기에서 앱 시작과 동시에
//   `Error: Component auth has not been registered yet`
// 로 즉사한다(12차 APK에서 실제 발생, adb logcat으로 확정).
//
// 조치: package exports를 끄고 예전 main-fields 해석(resolverMainFields:
// ['react-native','browser','main'])으로 되돌린다 → @firebase/auth의 "react-native" 필드가
// 잡혀 RN 빌드(dist/rn, getReactNativePersistence 포함)가 단일 사본으로 번들된다.
//
// 대안이던 firebase 12 업그레이드는 Firestore까지 영향을 주는 메이저 변경이라 보류.
// (firebase를 12+로 올릴 때 이 플래그를 지우고 재검증할 것.)
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

config.resolver.unstable_enablePackageExports = false;

module.exports = config;
