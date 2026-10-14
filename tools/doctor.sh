#!/bin/sh
# doctor.sh — checks what the kit needs and says how to fix each missing piece. Run it first.
cd "$(dirname "$0")/.."; ok=1
miss() { echo "✗ $1 — $2"; ok=0; }
command -v node >/dev/null && echo "✓ node $(node -v)" || miss node "https://nodejs.org (18+)"
command -v ffmpeg >/dev/null && echo "✓ ffmpeg" || miss ffmpeg "brew install ffmpeg | apt install ffmpeg | winget install ffmpeg"
command -v python3 >/dev/null && echo "✓ python3" || miss python3 "https://python.org"
python3 -c "import numpy" 2>/dev/null && echo "✓ numpy" || miss numpy "pip install -r requirements.txt"
[ -d node_modules/puppeteer-core ] && echo "✓ puppeteer-core" || miss puppeteer-core "npm i"
chrome=$(node -e "const fs=require('fs');const c=process.env.CHROME||['/Applications/Google Chrome.app/Contents/MacOS/Google Chrome','/Applications/Chromium.app/Contents/MacOS/Chromium','/usr/bin/google-chrome','/usr/bin/google-chrome-stable','/usr/bin/chromium','/usr/bin/chromium-browser','/snap/bin/chromium','C:/Program Files/Google/Chrome/Application/chrome.exe','C:/Program Files (x86)/Microsoft/Edge/Application/msedge.exe'].find(fs.existsSync);console.log(c||'')")
[ -n "$chrome" ] && echo "✓ chrome: $chrome" || miss chrome "install Google Chrome, or npx @puppeteer/browsers install chrome@stable and set CHROME=<path>"
[ -n "$ELEVENLABS_API_KEY" ] && echo "✓ ELEVENLABS_API_KEY (voice-over on)" || echo "· ELEVENLABS_API_KEY not set — the reel builds with music + SFX only"
python3 -c "import librosa" 2>/dev/null && echo "✓ librosa (beats.py)" || echo "· librosa not installed — only needed for tools/beats.py on your own track"
[ $ok = 1 ] && echo "ready: npm run demo" || exit 1
