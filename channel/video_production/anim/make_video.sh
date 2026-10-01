#!/bin/bash
# usage: make_video.sh <video_folder> <version_tag>     e.g.  make_video.sh 02_kodak v1
# needs videos/<folder>/build.cfg with NARRATION, MIX, OUTNAME (paths relative to this anim/ folder)
set -e
VIDF="${1:?video folder required}"; TAG="${2:?version tag required}"
HERE="$(cd "$(dirname "$0")" && pwd)"; cd "$HERE"
source "videos/$VIDF/build.cfg"
SEG="${SEG_DIR:-/tmp/claude-0/-home-user-Claude/d27934de-5a55-594e-b8c8-323d42d6a1d1/scratchpad/seg_${VIDF}_$TAG}"
OUT="$HERE/../../exports"; mkdir -p "$SEG" "$OUT"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$NARRATION")
N=$(python3 -c "import math;print(math.ceil($DUR*30))"); Q=$(( (N+3)/4 ))
AUDIO="$MIX"; [ -f "$AUDIO" ] || AUDIO="$NARRATION"
for i in 0 1 2 3; do s=$((i*Q)); e=$(( (i+1)*Q )); [ $e -gt $N ] && e=$N; VID=$VIDF node render.js video $s $e "$SEG/p$i.mp4" > "$SEG/p$i.log" 2>&1 & done
wait
bash assemble.sh "$SEG" "$AUDIO" "$SEG/full_hq.mp4"
ffmpeg -y -loglevel error -i "$SEG/full_hq.mp4" -c:v libx264 -preset medium -crf 26 -maxrate 6M -bufsize 12M -pix_fmt yuv420p -movflags +faststart -c:a copy "$OUT/${OUTNAME}_$TAG.mp4"
cd "$SEG"
ffmpeg -y -loglevel error -i "$OUT/${OUTNAME}_$TAG.mp4" -vf scale=1280:720 -c:v libx264 -preset medium -b:v 700k -pass 1 -an -f null /dev/null
ffmpeg -y -loglevel error -i "$OUT/${OUTNAME}_$TAG.mp4" -vf scale=1280:720 -c:v libx264 -preset medium -b:v 700k -pass 2 -c:a aac -b:a 96k -movflags +faststart "$OUT/${OUTNAME}_preview_720p_$TAG.mp4"
ls -la --block-size=K "$OUT"
