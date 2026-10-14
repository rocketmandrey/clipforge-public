"""vo.py: voice-over — one ElevenLabs eleven_v4 call per line of reel/lines.json, then one out/vo.wav of the full reel length
with each line placed at its level start + "at" seconds (clock = reel/timeline.js). Stdlib + ffmpeg. VOICE.md has the tag cheat sheet.
  ELEVENLABS_API_KEY=... [ELEVEN_VOICE_ID=...] python3 tools/vo.py [--force 1,6]
-> out/vo/<n>.mp3 (cached: delete or --force to redo), out/vo/costs.json (credits per call), out/vo.wav, out/vo.json (placement)."""
import json, os, subprocess, sys, urllib.request, pathlib
from audio import load_segs

ROOT = pathlib.Path(__file__).resolve().parents[1]
OUT = ROOT / "out/vo"
VOICE = os.environ.get("ELEVEN_VOICE_ID", "hU3rD0Yk7DoiYULTX1pD")   # «Дмитрий» from the public Voice Library; your clone works too
MODEL, SR = "eleven_v4", 48000


def tts(text, prev):
    body = {"text": text, "model_id": MODEL, "language_code": "ru", "voice_settings": {"stability": 0.0},   # Creative: widest emotion range
            **({"previous_text": prev} if prev else {})}                                                  # keeps intonation flowing line to line
    req = urllib.request.Request(f"https://api.elevenlabs.io/v1/text-to-speech/{VOICE}?output_format=mp3_44100_128", data=json.dumps(body).encode(),
                                 headers={"xi-api-key": os.environ["ELEVENLABS_API_KEY"], "content-type": "application/json"})
    with urllib.request.urlopen(req, timeout=180) as r:
        return r.read(), r.headers.get("character-cost")


def dur(p):
    return float(subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(p)], capture_output=True, text=True).stdout)


def main():
    OUT.mkdir(parents=True, exist_ok=True)
    segs, total = load_segs(); seg = {g["n"]: g for g in segs}
    lines = json.loads((ROOT / "reel/lines.json").read_text())
    force = {int(x) for x in sys.argv[sys.argv.index("--force") + 1].split(",")} if "--force" in sys.argv else set()
    costs = json.loads((OUT / "costs.json").read_text()) if (OUT / "costs.json").exists() else {"calls": []}
    prev = None
    for L in lines:
        f = OUT / f"{L['n']}.mp3"
        if L["n"] in force or not f.exists():
            audio, cost = tts(L["text"], prev)
            f.write_bytes(audio)
            costs["calls"].append({"n": L["n"], "credits": cost, "chars": len(L["text"])})
            print(f"line {L['n']}: {cost} credits")
        prev = L["text"]
    (OUT / "costs.json").write_text(json.dumps(costs, ensure_ascii=False, indent=1))
    # place lines; a line longer than its slot (level end − offset − 0.15 s) is sped up with atempo ≤ 1.15, else reported TOO LONG
    place, inputs, filt = [], [], []
    for i, L in enumerate(lines):
        g, f = seg[L["n"]], OUT / f"{L['n']}.mp3"
        d, slot = dur(f), g["dur"] - L["at"] - .15
        tempo = min(1.15, d / slot) if d > slot else 1.0
        at = g["start"] + L["at"]
        place.append({"n": L["n"], "t": round(at, 3), "dur": round(d / tempo, 3), "tempo": round(tempo, 3), "fits": d / tempo <= slot + 1e-3, "text": L["text"]})
        inputs += ["-i", str(f)]
        filt.append(f"[{i}:a]aresample={SR},atempo={tempo:.4f},adelay={int(at * 1000)}|{int(at * 1000)}[a{i}]")
    filt.append("".join(f"[a{i}]" for i in range(len(lines))) + f"amix=inputs={len(lines)}:normalize=0,apad[o]")
    subprocess.run(["ffmpeg", "-y", "-loglevel", "error", *inputs, "-filter_complex", ";".join(filt), "-map", "[o]", "-t", f"{total:.3f}", "-ac", "2", "-ar", str(SR),
                    str(ROOT / "out/vo.wav")], check=True)
    (ROOT / "out/vo.json").write_text(json.dumps(place, ensure_ascii=False, indent=1))
    for p in place:
        print(f"L{p['n']} at {p['t']:6.2f}s  {p['dur']:.2f}s  tempo {p['tempo']}  {'ok' if p['fits'] else 'TOO LONG'}")


if __name__ == "__main__":
    main()
