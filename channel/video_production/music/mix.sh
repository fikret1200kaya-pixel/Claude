#!/bin/bash
# usage: mix.sh <narration.mp3> <score_base> <out.wav>   -> narration + ducked music bed + undocked hits, 2-pass loudness to -14 LUFS (TP -1.5)
set -e
NAR="$1"; BASE="$2"; OUT="$3"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$NAR")
FADE=$(python3 -c "print(max(0,$DUR-1.2))")
FC="[0:a]aformat=channel_layouts=stereo,aresample=44100,asplit=2[nv][sc];[1:a]highpass=f=30,volume=0.089[bed];[bed][sc]sidechaincompress=threshold=0.02:ratio=5:attack=15:release=350[duck];[2:a]highpass=f=28,volume=0.35[hits];[nv][duck][hits]amix=inputs=3:duration=longest:normalize=0,atrim=0:$DUR,afade=t=out:st=$FADE:d=1.2"
TMP="$OUT.premix.wav"
ffmpeg -y -loglevel error -i "$NAR" -i "${BASE}_bed.wav" -i "${BASE}_hits.wav" -filter_complex "$FC[out]" -map "[out]" -c:a pcm_s16le "$TMP"
read I TP LRA TH OFF <<< $(ffmpeg -hide_banner -i "$TMP" -af loudnorm=I=-14:TP=-1.5:LRA=11:print_format=json -f null - 2>&1 | sed -n '/{/,/}/p' | python3 -c "import sys,json;d=json.load(sys.stdin);print(d['input_i'],d['input_tp'],d['input_lra'],d['input_thresh'],d['target_offset'])")
ffmpeg -y -loglevel error -i "$TMP" -af "loudnorm=I=-14:TP=-1.5:LRA=11:measured_I=$I:measured_TP=$TP:measured_LRA=$LRA:measured_thresh=$TH:offset=$OFF:linear=true" -ar 48000 "$OUT"
rm -f "$TMP"
ffmpeg -hide_banner -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I|Peak):" | tail -2
