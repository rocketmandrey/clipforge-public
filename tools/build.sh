#!/bin/sh
# build.sh [wide] — the whole reel in one go: level events -> music + SFX -> voice (if ELEVENLABS_API_KEY) -> mix -> render -> mux -> sheet.
# Output: out/showreel[_wide].mp4 and out/sheet[_wide].png. Look at the sheet before you post anything.
set -e; cd "$(dirname "$0")/.."
q=""; s=""; [ "$1" = wide ] && { q="--query=w=1920"; s="_wide"; }
mkdir -p out
node tools/render.mjs --events
python3 tools/audio.py
if [ -n "$ELEVENLABS_API_KEY" ]; then (cd tools && python3 vo.py); python3 tools/audio.py --mix out/vo.wav; mix=out/mix.wav
else echo "! no ELEVENLABS_API_KEY: music + SFX only"; ffmpeg -y -loglevel error -i out/music.wav -i out/sfx.wav -filter_complex amix=inputs=2:normalize=0 out/mix.wav; fi
node tools/render.mjs $q --out=out/video$s.mp4
ffmpeg -y -loglevel error -i out/video$s.mp4 -i out/mix.wav -map 0:v -map 1:a -c:v copy -c:a aac -b:a 192k -shortest -movflags +faststart out/showreel$s.mp4
rm -f "out/video$s.mp4"
node tools/render.mjs --sheet $q --out=out/sheet$s.png
echo "done: out/showreel$s.mp4, out/sheet$s.png"
