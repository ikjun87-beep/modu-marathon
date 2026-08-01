#!/usr/bin/env bash
# 로컬 릴리스 **AAB** 빌드 — 플레이스토어 업로드용(스토어는 APK가 아니라 AAB를 받는다).
#
# APK판(build-local-apk.sh)과 갈리는 점 두 가지:
#  ① **ABI를 줄이지 않는다.** APK는 실기기(arm64)만 넣어 빌드를 줄였지만, AAB는 스토어가
#     기기별로 쪼개 배포하므로 4종을 다 담아야 한다. 줄이면 그 기기에 앱이 안 깔린다.
#     → 그만큼 빌드가 오래 걸린다(APK의 2~3배).
#  ② `bundleRelease` 태스크로 굽고 결과가 .aab 다.
#
# ⚠️ 서명: 여기서 쓰는 local-release.jks 는 **업로드 키**로 등록하고 Play App Signing 을 켤 것.
#    끄고 올리면 이 키가 최종 서명키가 되어 **분실 시 앱 업데이트가 영구 불가**하다.
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
LOCKFILE="/tmp/modu-marathon-build.lock"  # APK 빌드와 같은 락 — 동시에 굽지 않는다
exec 9>"$LOCKFILE"
if ! flock -n 9; then
  echo "❌ 이미 빌드가 실행 중입니다 (락: $LOCKFILE)"
  echo "   진행 중인 빌드를 기다리거나, 확인: ps -ef | grep -E 'gradlew|build-local-apk'"
  exit 1
fi
# 락은 스크립트(및 자식)가 끝나면 fd 9가 닫히며 자동 해제된다.
#
# ⚠️ **락 파일은 지워지지 않는다** — flock은 파일이 아니라 fd에 잠금을 건다.
#   그래서 `[ -f "$LOCKFILE" ]`로 "빌드 중인가"를 판단하면 **영원히 참**이라 무한 대기한다
#   (2026-07-29에 이 실수로 14시간을 헛돌았다). 빌드 종료를 기다리려면 이렇게:
#     flock -w 3600 9 < /tmp/modu-marathon-build.lock   # 잠금이 풀릴 때까지 대기
#   `pgrep -f "gradlew assembleRelease"`도 위험하다 — 그 문자열을 담은 **자기 자신**이 잡힌다.

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

echo "▶ gradle bundleRelease (ABI 4종이라 APK보다 오래 걸린다)"
cd android

# ── 빌드 부하 옵션 (2026-07-27) ───────────────────────────────────────
# ❗여기에 두는 이유: 위 prebuild가 --clean 으로 android/ 를 통째로 재생성하므로
#   android/gradle.properties 를 고쳐도 매 빌드마다 지워진다. 스크립트만 살아남는다.
#
# ABI: 기본값은 4종(armeabi-v7a,arm64-v8a,x86,x86_64) — 같은 C++ 코드를 4벌 컴파일해
#      빌드 시간·CPU가 4배가 된다. 실기기(arm64)만 쓰므로 1종으로 축소.
#      에뮬레이터를 쓸 땐 아래를 arm64-v8a,x86_64 로.
# AAB는 스토어가 기기별로 쪼개므로 **4종 전부** 담는다(줄이면 그 기기에서 설치 불가).
ABIS="${ABIS:-armeabi-v7a,arm64-v8a,x86,x86_64}"
# 워커 수: 무제한이면 16코어를 전부 물어 과청약되고 오히려 느려진다(터미널도 멈춤).
MAXW="${MAXW:-6}"

# 코어 예약: 빌드가 16코어를 전부 물면 PC 전체(터미널·Windows)가 멈춘 것처럼 느려진다.
# ❗--max-workers 로는 안 잡힌다 — 그건 Gradle '태스크' 병렬도만 제한하고,
#   C++를 실제로 컴파일하는 ninja는 별도로 "코어수+2"개를 띄운다(16코어 → 18개, 실측).
#   ninja 1.10.2는 sched_getaffinity 를 읽으므로 taskset 으로 코어를 가리면
#   기본 병렬도까지 따라 내려간다(10코어로 가리면 12개, 실측 확인).
NCPU=$(nproc)
RESERVE="${RESERVE:-6}"                      # 시스템·터미널용으로 남길 코어 수
LAST=$(( NCPU - RESERVE - 1 )); [ "$LAST" -lt 0 ] && LAST=$(( NCPU - 1 ))
CPUSET="${CPUSET:-0-$LAST}"

echo "   ABI=$ABIS  워커=$MAXW  코어=$CPUSET(전체 $NCPU 중 $((LAST+1))개)  빌드캐시 켬"
nice -n 10 taskset -c "$CPUSET" ./gradlew bundleRelease --no-daemon \
  -PreactNativeArchitectures="$ABIS" \
  --build-cache \
  --max-workers="$MAXW"

AAB="app/build/outputs/bundle/release/app-release.aab"
echo
echo "✅ AAB 빌드 완료: $(cd .. && pwd)/android/$AAB"
ls -la "$AAB" 2>/dev/null
echo
echo "다음: Play Console → 비공개 테스트 트랙 → 이 .aab 업로드"
echo "     (Play App Signing 을 반드시 켤 것 — 위 주석 참조)"
ls -lh "$APK" | awk '{print "   크기:", $5}'
