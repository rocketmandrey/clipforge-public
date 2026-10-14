"""beats.py: where the drums hit in YOUR track — the grid for cuts, morphs and gags (RULES.md «Удары на барабаны»).
A BPM grid drifts and a guitar strum is not a hit, so: the drums stem (demucs, ~8 s per minute of track on a Mac), onsets in the kick
band and in the snare band separately, plus the few biggest "slams" and energy drops/stops of the full mix.
  pip install librosa demucs; python3 tools/beats.py track.mp3 [out/beats.json]
-> {"bpm", "stem", "kick": [s], "snare": [s], "slam": [s], "drop": [s], "stop": [s]}
Without demucs it falls back to HPSS on the mix: on a real Suno track that found 46/51 stem kicks but added 41 fake ones (bass notes)."""
import json, subprocess, sys, tempfile
from pathlib import Path
import numpy as np, librosa

def drums_stem(path, tmp):
    r = subprocess.run([sys.executable, "-m", "demucs", "--two-stems=drums", "-n", "htdemucs", "-o", tmp, path], capture_output=True, text=True)
    f = Path(tmp) / "htdemucs" / Path(path).stem / "drums.wav"
    return str(f) if r.returncode == 0 and f.exists() else None

def band_onsets(S, freqs, lo, hi, sr, hop, delta):
    env = librosa.onset.onset_strength(S=librosa.amplitude_to_db(S[(freqs >= lo) & (freqs < hi)]), sr=sr, hop_length=hop)
    return librosa.onset.onset_detect(onset_envelope=env, sr=sr, hop_length=hop, units="time", delta=delta, backtrack=False)

def beats(path, sr=22050, hop=256, stem=None):
    y, sr = librosa.load(path, sr=sr, mono=True)
    perc = librosa.load(stem, sr=sr, mono=True)[0] if stem else librosa.effects.hpss(y, margin=3.0)[1]   # HPSS: weaker fallback
    S, freqs = np.abs(librosa.stft(perc, hop_length=hop)), librosa.fft_frequencies(sr=sr)
    kick = band_onsets(S, freqs, 30, 150, sr, hop, .25)
    snare = band_onsets(S, freqs, 1500, 6000, sr, hop, .25)
    tempo, _ = librosa.beat.beat_track(y=y, sr=sr, hop_length=hop)
    env = librosa.onset.onset_strength(y=y, sr=sr, hop_length=hop); z = (env - env.mean()) / env.std(); t = librosa.times_like(env, sr=sr, hop_length=hop)
    pk = [p for p in librosa.util.peak_pick(z, pre_max=5, post_max=5, pre_avg=20, post_avg=20, delta=.5, wait=40) if z[p] >= 4]
    slam = sorted(t[p] for p in sorted(pk, key=lambda p: -z[p])[:max(4, int(len(y) / sr / 10))])   # ponytail: top 1 per 10 s = the few real slams
    db = librosa.amplitude_to_db(librosa.feature.rms(y=y, hop_length=hop)[0], ref=1.0); w = int(sr / hop)   # 1 s windows
    jump = np.array([db[i:i + w].mean() - db[i - w:i].mean() if w <= i <= len(db) - w else 0 for i in range(len(db))])
    pick = lambda x, thr: [float(t[p]) for p in librosa.util.peak_pick(x, pre_max=w, post_max=w, pre_avg=w, post_avg=w, delta=0, wait=w) if x[p] >= thr]
    r = lambda xs: [round(float(x), 3) for x in xs]
    return {"bpm": round(float(np.atleast_1d(tempo)[0]), 1), "stem": bool(stem), "kick": r(kick), "snare": r(snare), "slam": r(slam), "drop": r(pick(jump, 6)), "stop": r(pick(-jump, 10))}

if __name__ == "__main__":
    if len(sys.argv) < 2: sys.exit(__doc__)
    with tempfile.TemporaryDirectory() as tmp:
        stem = drums_stem(sys.argv[1], tmp)
        if not stem: print("! demucs not available: HPSS on the mix, expect extra kicks", file=sys.stderr)
        res = beats(sys.argv[1], stem=stem)
    out = sys.argv[2] if len(sys.argv) > 2 else "out/beats.json"
    open(out, "w").write(json.dumps(res)); print(out, {k: (len(v) if isinstance(v, list) else v) for k, v in res.items()})
