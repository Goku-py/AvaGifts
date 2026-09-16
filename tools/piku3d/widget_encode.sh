#!/usr/bin/env bash
# Turn the frames from widget_render.py into the two assets the chat widget
# ships: a looping animated WebP and a still for prefers-reduced-motion.
#
#     tools/piku3d/widget_encode.sh
#
# Animated WebP rather than a <video>: this Blender build has no FFmpeg
# output and there is no ffmpeg binary, and a transparent <video> would need
# VP9-alpha WebM *and* HEVC-alpha MP4 to cover Safari. Animated WebP carries
# alpha, loops in a plain <img>, and works in Safari 14+.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
FRAMES="$ROOT/_reference/piku/widget/frames"
OUT="$ROOT/public/brand/piku"
FPS="${PIKU_WIDGET_FPS:-8}"
DELAY=$(( 1000 / FPS ))

mkdir -p "$OUT"
shopt -s nullglob
files=("$FRAMES"/f*.png)
if [ ${#files[@]} -eq 0 ]; then
  echo "no frames in $FRAMES — run widget_render.py first" >&2
  exit 1
fi

# -loop 0 = forever. Frame options must precede the files they apply to.
img2webp -loop 0 -lossy -q 82 -m 6 -d "$DELAY" "${files[@]}" -o "$OUT/piku-idle.webp" >/dev/null
cwebp -quiet -q 90 -alpha_q 100 "${files[0]}" -o "$OUT/piku-still.webp"

printf '%-18s %8s bytes  (%d frames @ %d fps)\n' "piku-idle.webp"  "$(wc -c < "$OUT/piku-idle.webp"  | tr -d ' ')" "${#files[@]}" "$FPS"
printf '%-18s %8s bytes\n'                       "piku-still.webp" "$(wc -c < "$OUT/piku-still.webp" | tr -d ' ')"
