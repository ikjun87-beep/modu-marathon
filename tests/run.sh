#!/usr/bin/env bash
# firestore.rules 검증 — 에뮬레이터를 띄우고 rules.test.mjs 를 돌린다.
#
#   cd tests && npm test
#
# ⚠️ 에뮬레이터는 **자바로 돈다**. 그런데 이 PC의 자바 사정이 두 갈래다:
#    · 안드로이드 빌드(gradlew)  = **JDK 17**  ~/android-dev/jdk17
#    · firebase-tools 에뮬레이터 = **JDK 21+** ~/android-dev/jre21   ← 21 미만이면 실행을 거부한다
#      ("firebase-tools no longer supports Java version before 21")
#    그래서 **JDK17을 절대 건드리지 않고** 여기서만 21을 앞에 세운다. PATH를 전역으로 바꾸거나
#    시스템 java를 21로 올리면 APK 빌드가 조용히 깨진다.
set -euo pipefail
cd "$(dirname "$0")"

pick_java21() {
  for CAND in "$HOME/android-dev/jre21" /usr/lib/jvm/java-21-openjdk-amd64; do
    if [ -x "$CAND/bin/java" ]; then echo "$CAND"; return 0; fi
  done
  # 이미 PATH의 java가 21 이상이면 그대로 쓴다
  if command -v java >/dev/null 2>&1; then
    V=$(java -version 2>&1 | head -1 | sed -E 's/.*"([0-9]+).*/\1/')
    if [ "${V:-0}" -ge 21 ] 2>/dev/null; then echo "PATH"; return 0; fi
  fi
  return 1
}

if JHOME=$(pick_java21); then
  if [ "$JHOME" != "PATH" ]; then
    export JAVA_HOME="$JHOME"
    export PATH="$JAVA_HOME/bin:$PATH"
  fi
else
  echo "❌ JDK 21 이상을 못 찾았습니다. Firestore 에뮬레이터에 필요합니다." >&2
  echo "   설치(sudo 불필요):" >&2
  echo "     mkdir -p ~/android-dev/jre21" >&2
  echo "     curl -sSL 'https://api.adoptium.net/v3/binary/latest/21/ga/linux/x64/jre/hotspot/normal/eclipse' \\" >&2
  echo "       | tar -xz -C ~/android-dev/jre21 --strip-components=1" >&2
  echo "   ⚠️ 안드로이드 빌드용 ~/android-dev/jdk17 은 그대로 두십시오(교체하면 APK 빌드가 깨집니다)." >&2
  exit 1
fi

echo "☕ java = $(java -version 2>&1 | head -1)"

# `emulators:exec` = 에뮬레이터를 띄우고 → 명령을 돌리고 → 반드시 내린다.
# 직접 start 하면 테스트가 실패했을 때 포트가 물린 채 남아 다음 실행이 "port taken"으로 죽는다.
exec npx --yes firebase-tools emulators:exec \
  --project modu-marathon-rules-test \
  --only firestore \
  --config ../firebase.json \
  "node --test rules.test.mjs"
