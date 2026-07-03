#!/usr/bin/env bash
# GitHub에 올리는 것과 동일한 상태를 윈도우 폴더에도 미러링한다.
# node_modules·dist·.env 등 .gitignore 대상은 제외(= 저장소에 올라가는 파일만 복사).
# 사용: bash scripts/sync-win-mirror.sh   (푸시 직후 실행)
set -euo pipefail

SRC="/home/jun/projects/modu-marathon"
DEST="${WIN_MIRROR:-/mnt/c/Users/JUN/Claude/Projects/modu-marathon}"

if [ ! -d "$(dirname "$DEST")" ]; then
  echo "대상 상위 폴더 없음: $(dirname "$DEST")" >&2
  exit 1
fi

mkdir -p "$DEST"
rsync -a --delete \
  --exclude='.git/' \
  --filter=':- .gitignore' \
  "$SRC/" "$DEST/"

echo "미러 완료 → $DEST"
