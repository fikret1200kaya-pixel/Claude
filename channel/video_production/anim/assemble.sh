#!/bin/bash
# usage: assemble.sh <segments_dir> <final_audio> <out.mp4>   (audio is the finished mix: narration + music, already faded)
set -e
SEG="$1"; AUDIO="$2"; OUT="$3"
printf "file '%s/p0.mp4'\nfile '%s/p1.mp4'\nfile '%s/p2.mp4'\nfile '%s/p3.mp4'\n" "$SEG" "$SEG" "$SEG" "$SEG" > "$SEG/list.txt"
ffmpeg -y -loglevel error -f concat -safe 0 -i "$SEG/list.txt" -i "$AUDIO" -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest "$OUT"
ffprobe -v error -show_entries format=duration,size -of default=nw=1 "$OUT"
