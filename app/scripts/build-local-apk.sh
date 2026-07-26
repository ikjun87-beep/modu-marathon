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

# ── 중복 실행 방지 락 (2026-07-27 추가) ──────────────────────────────
# 왜: 2026-07-26 이 스크립트가 같은 탭에서 7분 간격으로 두 번 실행돼,
#     두 빌드가 같은 .cxx 디렉토리를 놓고 서로의 오브젝트 파일을 지웠다.
#     증상 = CPU 100%인데 빌드는 영원히 진척 없음 → 최종 링크에서
#     "no such file: Props.cpp.o" 로 실패. 노트북 전체가 멈춘 것처럼 느껴진다.
# 무엇: 빌드는 항상 한 번에 하나만. 이미 돌고 있으면 즉시 종료한다.
LOCKFILE="/tmp/modu-marathon-build.lock"
exec 9>"$LOCKFILE"
if ! flock -n 9; then
  echo "❌ 이미 빌드가 실행 중입니다 (락: $LOCKFILE)"
  echo "   진행 중인 빌드를 기다리거나, 확인: ps -ef | grep -E 'gradlew|build-local-apk'"
  exit 1
fi
# 락은 스크립트(및 자식)가 끝나면 fd 9가 닫히며 자동 해제된다.

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

# ── 빌드 부하 옵션 (2026-07-27) ───────────────────────────────────────
# ❗여기에 두는 이유: 위 prebuild가 --clean 으로 android/ 를 통째로 재생성하므로
#   android/gradle.properties 를 고쳐도 매 빌드마다 지워진다. 스크립트만 살아남는다.
#
# ABI: 기본값은 4종(armeabi-v7a,arm64-v8a,x86,x86_64) — 같은 C++ 코드를 4벌 컴파일해
#      빌드 시간·CPU가 4배가 된다. 실기기(arm64)만 쓰므로 1종으로 축소.
#      에뮬레이터를 쓸 땐 아래를 arm64-v8a,x86_64 로.
ABIS="${ABIS:-arm64-v8a}"
# 워커 수: 무제한이면 16코어를 전부 물어 과청약되고 오히려 느려진다(터미널도 멈춤).
MAXW="${MAXW:-6}"

echo "   ABI=$ABIS  최대워커=$MAXW  (빌드캐시 켬)"
./gradlew assembleRelease --no-daemon \
  -PreactNativeArchitectures="$ABIS" \
  --build-cache \
  --max-workers="$MAXW"

APK="app/build/outputs/apk/release/app-release.apk"
echo
echo "✅ 빌드 완료: $(cd .. && pwd)/android/$APK"
ls -lh "$APK" | awk '{print "   크기:", $5}'
