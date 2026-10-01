#!/bin/bash
# usage: make_video.sh <version_tag>   e.g. v3   (renders 4 parallel segments, assembles, compresses, makes 720p preview)
set -e
TAG="${1:?version tag required}"
HERE="$(cd "$(dirname "$0")" && pwd)"
SEG="${SEG_DIR:-/tmp/claude-0/-home-user-Claude/d27934de-5a55-594e-b8c8-323d42d6a1d1/scratchpad/seg_$TAG}"
OUT="$HERE/../../exports"
mkdir -p "$SEG" "$OUT"
N=7854; Q=$(( (N+3)/4 ))
cd "$HERE"
for i in 0 1 2 3; do s=$((i*Q)); e=$(( (i+1)*Q )); [ $e -gt $N ] && e=$N; node render.js video $s $e "$SEG/p$i.mp4" > "$SEG/p$i.log" 2>&1 & done
wait
bash assemble.sh "$SEG" "$HERE/../../audio/01_blockbuster_narration.mp3" "$SEG/full_hq.mp4"
ffmpeg -y -loglevel error -i "$SEG/full_hq.mp4" -c:v libx264 -preset medium -crf 26 -maxrate 6M -bufsize 12M -pix_fmt yuv420p -movflags +faststart -c:a copy "$OUT/01_blockbuster_draft_$TAG.mp4"
cd "$SEG"
ffmpeg -y -loglevel error -i "$OUT/01_blockbuster_draft_$TAG.mp4" -vf scale=1280:720 -c:v libx264 -preset medium -b:v 700k -pass 1 -an -f null /dev/null
ffmpeg -y -loglevel error -i "$OUT/01_blockbuster_draft_$TAG.mp4" -vf scale=1280:720 -c:v libx264 -preset medium -b:v 700k -pass 2 -c:a aac -b:a 96k -ac 1 -movflags +faststart "$OUT/01_blockbuster_preview_720p_$TAG.mp4"
ls -la --block-size=K "$OUT"
