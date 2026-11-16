#!/usr/bin/env bash
# Render the screenshot scenes with headless Chrome while `node serve.ts --port 8093` runs,
# then save each as a JPEG under 256 KiB in screenshots/ (names sort into contact-sheet order).
# usage: bash tools/shots.sh [seed]
set -euo pipefail
cd "$(dirname "$0")/.."
SEED="${1:-1}"
CHROME="${CHROME:-/c/Program Files/Google/Chrome/Application/chrome.exe}"
TMP="$(mktemp -d)"
mkdir -p screenshots
render() {
  local scene="$1" name="$2" quality="${3:-3}"
  "$CHROME" --headless=new --disable-gpu --hide-scrollbars --force-device-scale-factor=1 \
    --window-size=1280,800 --virtual-time-budget=60000 --user-data-dir="$TMP/profile-$scene" \
    --screenshot="$TMP/$scene.png" "http://localhost:8093/index.html?shot=$scene&seed=$SEED" >/dev/null 2>&1
  ffmpeg -loglevel error -threads 1 -y -i "$TMP/$scene.png" -q:v "$quality" "screenshots/$name"
  local size
  size=$(stat -c %s "screenshots/$name")
  while [ "$size" -gt 262144 ]; do
    quality=$((quality + 1))
    ffmpeg -loglevel error -threads 1 -y -i "$TMP/$scene.png" -q:v "$quality" "screenshots/$name"
    size=$(stat -c %s "screenshots/$name")
  done
  echo "$name $size bytes (q $quality)"
}
ONLY="${2:-all}"
[ "$ONLY" = all ] || [ "$ONLY" = play ] && render play 1-play.jpg
[ "$ONLY" = all ] || [ "$ONLY" = title ] && render title 2-title.jpg
[ "$ONLY" = all ] || [ "$ONLY" = pick ] && render pick 3-rubric.jpg
[ "$ONLY" = all ] || [ "$ONLY" = results ] && render results 4-results.jpg
true
rm -rf "$TMP"
