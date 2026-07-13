#!/usr/bin/env bash
# 로컬 릴리스 APK 빌드 — EAS 클라우드 대신 이 PC에서 굽는다.
#
# 왜: EAS 무료 플랜은 월 안드로이드 빌드 횟수 제한이 있다(2026-07-13 소진, 8/1 리셋).
#     로컬 빌드는 횟수·대기열 제한이 없다.
#
# 준비(최초 1회):
#   ~/android-dev/jdk17          Temurin JDK 17
#   ~/android-dev/sdk            Android SDK (platform-tools, platforms;android-36,
#                                build-tools;36.0.0, ndk, cmake)
#   app/credentials/local-release.jks   서명 키(gitignore됨 — 절대 커밋 금지)
#
# 사용: bash scripts/build-local-apk.sh
# 결과: android/app/build/outputs/apk/release/app-release.apk
#
# 주의: EAS가 굽던 APK와 **서명 키가 다르다** → 기존 앱을 지우고 설치해야 한다
#       (adb install -r 이 서명 불일치로 실패하면 adb uninstall 후 재설치).
set -euo pipefail

cd "$(dirname "$0")/.."

export JAVA_HOME="$HOME/android-dev/jdk17"
export ANDROID_HOME="$HOME/android-dev/sdk"
export ANDROID_SDK_ROOT="$ANDROID_HOME"
export PATH="$JAVA_HOME/bin:$ANDROID_HOME/platform-tools:$PATH"

KEYSTORE="$(pwd)/credentials/local-release.jks"
[ -f "$KEYSTORE" ] || { echo "❌ 서명 키 없음: $KEYSTORE"; exit 1; }

echo "▶ prebuild (android/ 재생성)"
npx expo prebuild --platform android --clean

echo "▶ 릴리스 서명 주입 (android/는 prebuild마다 새로 생기므로 매번 주입)"
python3 - "$KEYSTORE" <<'PY'
import sys, re
keystore = sys.argv[1]
p = 'android/app/build.gradle'
s = open(p).read()

# 1) signingConfigs에 release 추가
if 'signingConfigs.release' not in s:
    s = s.replace("""        debug {
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }
    }""",
f"""        debug {{
            storeFile file('debug.keystore')
            storePassword 'android'
            keyAlias 'androiddebugkey'
            keyPassword 'android'
        }}
        release {{
            storeFile file('{keystore}')
            storePassword 'modumarathon'
            keyAlias 'modumarathon'
            keyPassword 'modumarathon'
        }}
    }}""", 1)

    # 2) release 빌드타입이 debug 키가 아니라 release 키를 쓰게
    s = s.replace("""        release {
            // Caution! In production, you need to generate your own keystore file.
            // see https://reactnative.dev/docs/signed-apk-android.
            signingConfig signingConfigs.debug""",
"""        release {
            signingConfig signingConfigs.release""", 1)

    open(p, 'w').write(s)
    print('  ✓ 서명 설정 주입 완료')
else:
    print('  = 이미 주입됨')
PY

echo "▶ gradle assembleRelease (첫 빌드는 10~20분)"
cd android
./gradlew assembleRelease --no-daemon

APK="app/build/outputs/apk/release/app-release.apk"
echo
echo "✅ 빌드 완료: $(cd .. && pwd)/android/$APK"
ls -lh "$APK" | awk '{print "   크기:", $5}'
