#!/usr/bin/env python3
"""audio.py: music + SFX + final mix for the reel. Stdlib + numpy only. Every sound is synthesized: no samples, no music model.

One original theme at 144 BPM through the whole reel; the arrangement/timbre follows each level's style
(timbre per level n, table STYLE): L1 chiptune 2A03, L2 riso-techno, L3 Karplus-Strong plucks, L4 pad+waves+flute,
L5 toy piano/xylophone, L6 noir pizz+brushes, L7 glockenspiel+ukulele, L8 candy-pop synths, L9 chip + everything.
Drums always on the grid (kick 1&3, snare 2&4, hats 8ths). Clock = reel/timeline.js (parsed, not hardcoded).

  python3 tools/audio.py                  # music.wav + drums.json (+ sfx.wav if events.json exists) + checks
  python3 tools/audio.py --demo-events    # first write a demo events.json from the timeline grid
  python3 tools/audio.py --mix out/vo.wav   # + mix.wav: 48k stereo, ducked music, -14 LUFS, TP <= -1 dBTP
"""
import argparse, json, re, subprocess, sys, wave
from functools import lru_cache
from pathlib import Path
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
OUT = ROOT / 'out'
SR = 48000
BPM = 144
BEAT = 60 / BPM                      # 0.41667 s = 20000 samples exactly
E = BEAT / 2                         # eighth
TWO_PI = 2 * np.pi


def load_segs():
    src = (ROOT / 'reel/timeline.js').read_text()
    segs, start = [], 0.0
    for line in src.splitlines():
        if line.lstrip().startswith('//'): continue
        m = re.search(r"lv\((\d+),\s*'(\w+)',\s*'[^']*',\s*(\d+)", line)
        if not m: continue
        n, bars = int(m[1]), int(m[3]); dur = bars * 4 * BEAT
        segs.append(dict(n=n, file=m[2], bars=bars, dur=dur, start=start,
                         kill=6 * BEAT if bars == 3 else 8 * BEAT, lootGrab=8 * BEAT if bars == 3 else 11 * BEAT,
                         doorIn=dur - 0.667, final='final: true' in line))
        start += dur
    return segs, start

def seg_at(segs, t):
    for g in reversed(segs):
        if t >= g['start']: return g
    return segs[0]


# ---------------------------------------------------------------- primitives
def add(*xs):  # sum arrays of different lengths
    out = np.zeros(max(len(x) for x in xs))
    for x in xs: out[:len(x)] += x
    return out

def mf(m): return 440.0 * 2 ** ((m - 69) / 12)
def tt(n): return np.arange(n) / SR
def ns(dur): return max(int(dur * SR), 16)

def env(n, a=.002, d=.08, s=.6, r=.015):
    t = tt(n); L = n / SR
    e = np.where(t < a, t / a, s + (1 - s) * np.exp(-(t - a) / max(d, 1e-4)))
    return e * np.clip((L - t) / r, 0, 1)                 # release ramp inside the note: no clicks

def noise(n, seed=0, rate=None):
    rng = np.random.default_rng(seed)
    if rate is None: return rng.uniform(-1, 1, n)
    idx = np.floor(np.cumsum(np.broadcast_to(rate, n) / SR)).astype(int)   # 2A03-style sample&hold noise
    return rng.choice([-1.0, 1.0], idx[-1] + 1)[idx]

def filt(x, lo=0, hi=None, order=2):  # FFT-domain band filter (Butterworth-like magnitude), for short arrays
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR) + 1e-9
    if hi: X /= np.sqrt(1 + (f / hi) ** (2 * order))
    if lo: X /= np.sqrt(1 + (lo / f) ** (2 * order))
    return np.fft.irfft(X, len(x))

def sweep_phase(n, f0, f1=None):
    return np.cumsum(np.geomspace(f0, f1 or f0, n) / SR)

def chip(f, dur, vol, wave='pulse', duty=.5, f1=None, **e):
    n = ns(dur); ph = sweep_phase(n, f, f1) % 1
    if wave == 'pulse': x = np.where(ph < duty, 1.0, -1.0) - (2 * duty - 1)
    elif wave == 'tri': x = np.round((4 * np.abs(ph - .5) - 1) * 7.5) / 7.5      # 4-bit stepped triangle
    else: x = np.sin(TWO_PI * ph)
    return vol * x * env(n, **e)

def partials(f, dur, vol, parts, a=.001, r=.03, trem=0):
    """sum of (ratio, amp, decay/s) sines: mallets, bells, toy piano"""
    n = ns(dur); t = tt(n); x = 0
    for ratio, amp, dec in parts:
        if f * ratio < 18000: x = x + amp * np.sin(TWO_PI * f * ratio * t) * np.exp(-dec * t)
    if trem: x = x * (1 - trem * (.5 + .5 * np.sin(TWO_PI * 5.5 * t)))
    return vol * x * env(n, a=a, d=1, s=1, r=r)

def saw(f, dur, vol, cut=4000, cdec=0., det=(1.,), odd=False, **e):
    """band-limited additive saw/square with a (decaying) lowpass cutoff: techno/pop/acid voices"""
    n = ns(dur); t = tt(n); x = 0; c = cut * np.exp(-cdec * t)
    for dt in det:
        ff = f * dt; ph = TWO_PI * ff * t + 7 * dt
        for k in range(1, min(40, int(16000 / ff)) + 1, 2 if odd else 1):
            x = x + np.sin(k * ph) / k / np.sqrt(1 + (k * ff / (c + ff)) ** 4)
    return vol * .6 * x / len(det) * env(n, **e)

def pluck(f, dur, vol, bright=.5, damp=.996, seed=0):
    """Karplus-Strong, vectorised per period; pitch corrected by resampling"""
    N = int(SR / f); n = ns(dur) + N + 2
    y = np.zeros(n); y[1:N + 1] = filt(noise(N, seed), hi=800 + 9000 * bright) if N > 32 else noise(N, seed)  # y[0] = 0 pad
    for s in range(N + 1, n, N):
        k = min(N, n - s)
        y[s:s + k] = damp * .5 * (y[s - N:s - N + k] + y[s - N - 1:s - N - 1 + k])
    src = np.arange(ns(dur)) * (SR / (N + .5)) / f        # KS pitch = SR/(N+0.5); stretch to f
    out = np.interp(src, np.arange(n), y)
    return vol * out / (np.abs(out).max() + 1e-9) * env(len(out), a=.0005, d=1, s=1, r=.03)

def flute(f, dur, vol, seed=0):
    n = ns(dur); t = tt(n)
    vib = 1 + .005 * np.sin(TWO_PI * 5 * t) * np.clip((t - .12) / .1, 0, 1)
    ph = TWO_PI * np.cumsum(f * vib) / SR
    x = np.sin(ph) + .18 * np.sin(2 * ph) + .06 * np.sin(3 * ph) + .05 * filt(noise(n, seed), 1500, 5000)
    return vol * x * env(n, a=.05, d=.4, s=.8, r=.06)

def pad(fs, dur, vol):
    return sum(saw(f, dur, vol / len(fs), cut=1200, det=(.994, 1., 1.006), a=.25, d=1, s=1, r=.3) for f in fs)

GLOCK = [(1, 1, 2.2), (2.76, .35, 5), (5.4, .18, 9), (8.93, .08, 14)]
XYLO = [(1, 1, 9), (3.93, .35, 16), (9.2, .1, 28)]
TOY = [(1, 1, 5), (2.01, .25, 9), (4.17, .3, 13), (7.2, .1, 22)]
VIBES = [(1, 1, 1.6), (4, .25, 5), (10, .05, 12)]


# ---------------------------------------------------------------- instruments per style
def inst(style, role, f, dur, vol, i=0):
    if style == 'chip':
        if role == 'lead': return chip(f, dur * .9, vol, 'pulse', .25, d=.12, s=.55)
        if role == 'arp': return chip(f, dur * .85, vol, 'pulse', .125, d=.04, s=.5)
        return chip(f, dur * .85, vol * 1.2, 'tri', d=.15, s=.7)
    if style == 'techno':
        if role == 'lead': return saw(f, dur * .9, vol, cut=2500, cdec=3, det=(.997, 1.003), odd=True, d=.15, s=.6)
        if role == 'arp': return saw(f, dur * .8, vol, cut=3500, cdec=25, d=.05, s=.2)
        return saw(f, dur * .85, vol * 1.3, cut=1800, cdec=18, d=.1, s=.5)                 # acid-ish saw bass
    if style == 'paper':
        if role == 'lead': return pluck(f, dur * 1.6, vol, .75, .997, seed=i)
        if role == 'arp': return pluck(f, dur * 1.2, vol, .35, .994, seed=i + 99)
        return pluck(f, dur * 1.2, vol * 1.3, .2, .993, seed=i + 7)
    if style == 'sea':
        if role == 'lead': return flute(f, dur * .95, vol, seed=i)
        return chip(f, dur * .95, vol * 1.1, 'sine', a=.02, d=.3, s=.7, r=.08)
    if style == 'crayon':
        if role == 'lead': return partials(f, dur * 1.5, vol, TOY)
        if role == 'arp': return partials(f, dur * 1.2, vol, XYLO)
        return chip(f, dur * .8, vol * 1.1, 'sine', d=.12, s=.5)
    if style == 'noir':
        if role == 'lead': return partials(f, dur * 1.4, vol, VIBES, a=.004, trem=.35)
        return pluck(f, dur * 1.3, vol * 1.4, .12, .99, seed=i)                          # double-bass pizzicato
    if style == 'kids':
        if role == 'lead': return partials(f, dur * 2, vol * .9, GLOCK)
        if role == 'arp': return pluck(f, dur * 1.2, vol, .55, .992, seed=i)              # ukulele
        return chip(f, dur * .8, vol * 1.1, 'sine', d=.12, s=.5)
    if style == 'pop':
        if role == 'lead': return saw(f, dur * .9, vol, cut=6000, det=(.993, 1., 1.007), d=.2, s=.7)
        if role == 'arp': return saw(f, dur * .8, vol, cut=7000, cdec=30, odd=True, d=.03, s=.2)
        return saw(f, dur * .85, vol * 1.2, cut=900, cdec=6, d=.1, s=.6)
    # final: chiptune + everything
    if role == 'lead': return add(chip(f, dur * .9, vol, 'pulse', .25, d=.12, s=.55), partials(f * 2, dur * 1.5, vol * .3, GLOCK))
    if role == 'arp': return chip(f, dur * .85, vol, 'pulse', .125, d=.04, s=.5)
    return chip(f, dur * .85, vol * 1.1, 'tri', d=.15, s=.7) + saw(f, dur * .85, vol * .4, cut=700, d=.1, s=.6)

# per level: style, kit, lead octave (over A3), arp subdivisions per eighth (0 = none), bass every eighth?
STYLE = {1: ('chip', 'chip', 12, 2, True), 2: ('techno', '909', 12, 2, True), 3: ('paper', 'soft', 12, 1, False),
         4: ('sea', 'sea', 12, 0, False), 5: ('crayon', 'soft', 12, 1, False), 6: ('noir', 'brush', 12, 0, False),
         7: ('kids', 'soft', 24, 1, False), 8: ('pop', 'pop', 12, 4, True), 9: ('final', 'final', 12, 2, True)}


@lru_cache(None)
def drum(kit, kind):
    if kind == 'kick':
        if kit == 'chip': return chip(180, .12, .95, 'tri', f1=45, d=.06, s=0) + .3 * noise(ns(.12), 1, 9000) * env(ns(.12), d=.012, s=0)
        if kit in ('909', 'pop', 'final'):
            n = ns(.35); return .95 * np.sin(TWO_PI * sweep_phase(n, 190, 48)) * env(n, d=.16, s=0, r=.05) + .2 * filt(noise(n, 1), 2000) * env(n, d=.004, s=0)
        n = ns(.2); return .7 * np.sin(TWO_PI * sweep_phase(n, 120, 50)) * env(n, d=.09, s=0, r=.04)   # soft / sea / brush
    if kind == 'snare':
        if kit == 'chip': return add(.5 * noise(ns(.16), 2, np.geomspace(7000, 4000, ns(.16))) * env(ns(.16), d=.05, s=0), chip(260, .05, .25, f1=140, d=.02, s=0))
        if kit == '909': n = ns(.2); return .55 * filt(noise(n, 2), 600, 9000) * env(n, d=.07, s=0) + .3 * np.sin(TWO_PI * sweep_phase(n, 220, 170)) * env(n, d=.04, s=0)
        if kit in ('pop', 'final'):                                                     # clap: 3 quick bursts + tail
            n = ns(.25); x = filt(noise(n, 2), 900, 6000); t = tt(n)
            e = sum(np.where(t >= k * .011, np.exp(-(t - k * .011) / (.004 if k < 2 else .07)), 0) for k in range(3))
            return .6 * x * e / e.max() * env(n, a=.0005, d=1, s=1, r=.03)
        if kit == 'brush': n = ns(.22); return .35 * filt(noise(n, 2), 1500, 7000) * env(n, a=.015, d=.08, s=0, r=.05)
        if kit == 'sea': n = ns(.12); return .3 * filt(noise(n, 2), 4000, 12000) * env(n, a=.01, d=.04, s=0)  # shaker
        n = ns(.08); return .4 * (np.sin(TWO_PI * 1700 * tt(n)) * .6 + filt(noise(n, 2), 2000) * .5) * env(n, d=.02, s=0)  # rim/woodblock
    if kind == 'hat':
        if kit in ('chip', 'final'): return .16 * noise(ns(.03), 3, 22000) * env(ns(.03), d=.008, s=0)
        if kit in ('brush', 'sea', 'soft'): n = ns(.04); return (.07 if kit == 'soft' else .1) * filt(noise(n, 3), 6000) * env(n, a=.004, d=.012, s=0)
        n = ns(.05); return .2 * filt(noise(n, 3), 8000) * env(n, d=.015, s=0)
    if kind == 'crash':
        n = ns(1.0)
        if kit in ('chip',): return .55 * noise(n, 4, np.geomspace(16000, 9000, n)) * env(n, d=.25, s=0, r=.05)
        return .45 * filt(noise(n, 4), 5000) * env(n, a=.002, d=.35, s=0, r=.1)


# ---------------------------------------------------------------- composition: one theme, styled per level
ROOT_M = 57                                               # A3: one key through the reel (continuity)
PROG = [(0, 'm'), (8, 'M'), (10, 'M'), (7, 'm')]          # Am F G Em, 2 beats each, 2-bar loop
# the theme: semitones over A per eighth, '-' = hold; written against PROG (original)
THEME = [12, '-', 7, 10, 8, 12, 15, '-', 14, '-', 10, 14, 7, 10, 14, 12]
FANFARE = [0, 4, 7, 12, '-', 7, 12, '-']                  # 1 bar, A major
FINAL = [7, '-', 4, 7, 12, '-', 11, 12,   9, '-', 5, 9, 14, '-', 12, 9,   # theme in major, bars I IV V I V
         11, '-', 7, 11, 14, '-', 16, 14,  16, '-', '-', 12, 14, '-', 16, '-', 11, 12, 14, 16]
FINAL_BASS = [0, 5, 7, 0, 7]

def tones(root, q): return [root, root + (3 if q == 'm' else 4), root + 7]
def ct(root, q, i): return tones(root, q)[i % 3] + 12 * (i // 3)

def mode_at(g, b):
    kb = round(g['kill'] / BEAT)
    if g['final']: return 'final'
    if g['n'] == 1 and b < 3: return 'silent'             # terminal until «Enter» (b3)
    if g['n'] == 7 and b in (6, 7): return 'pause'
    if b < 2 or (g['n'] == 1 and b == 3): return 'entry'
    if b < kb: return 'battle'
    if b < kb + 4: return 'fanfare'
    return 'run'

def compose(segs, total):
    n = int(round(total * SR))
    st = {k: np.zeros(n) for k in ('lead', 'arp', 'bass', 'drums', 'pad')}
    drums = {'kick': [], 'snare': [], 'crash': []}
    def put(stem, t, x):
        i = int(round(t * SR)); x = x[:max(0, n - i)]; st[stem][i:i + len(x)] += x
    def hit(kit, kind, t, v=1.):
        put('drums', t, v * drum(kit, kind))
        if kind in drums: drums[kind].append(round(t, 4))

    for g in segs:
        t0, nb = g['start'], g['bars'] * 4
        style, kit, loct, adiv, b8 = STYLE.get(g['n'], STYLE[(g['n'] - 1) % 9 + 1])   # your level n > 9 borrows a timbre
        R = ROOT_M; kb = round(g['kill'] / BEAT)
        # drums on the grid
        for b in range(nb):
            t = t0 + b * BEAT; m = mode_at(g, b)
            if m == 'silent' or (m == 'final' and b >= 18): continue
            if m == 'pause': hit(kit, 'hat', t, 1.4); continue        # music freezes, only the ticking hat
            hit(kit, 'kick' if b % 2 == 0 else 'snare', t)
            hd = 4 if g['n'] == 8 else 2
            for k in range(hd): hit(kit, 'hat', t + k * BEAT / hd, .75 if k % 2 else 1)
        if not g['final']: hit(kit, 'crash', t0 + g['kill'], 1.3 if g['n'] == 7 else 1.)
        if g['n'] == 1:                                    # terminal hum, then the band on «Enter»
            hn = ns(3 * BEAT)
            put('pad', t0, (.05 * np.sin(TWO_PI * 55 * tt(hn)) + .012 * filt(noise(hn, 9), 2000, 4000)) * env(hn, a=.3, d=1, s=1, r=.03))
            hit(kit, 'crash', t0 + 3 * BEAT, .7)
        # beds
        if style == 'sea':
            wn = ns(g['dur']); tw = tt(wn)
            put('pad', t0, .12 * filt(noise(wn, 21), 80, 700) * (.35 + .65 * np.sin(np.pi * ((tw / (2 * BEAT)) % 1)) ** 2) * env(wn, a=.2, d=1, s=1, r=.3))
        # melodic lines
        lead = []
        for e in range(nb * 2):
            b = e // 2; m = mode_at(g, b); t = t0 + e * E
            if m in ('silent', 'pause'): lead.append(None); continue
            if m == 'final':
                if b >= 18: lead.append(None); continue
                v = FINAL[e] if e < len(FINAL) else '-'; fb = FINAL_BASS[min(b // 4, 4)]
                lead.append(v if v == '-' else R + loct + v)
                put('bass', t, inst(style, 'bass', mf(R - 24 + fb + (12 if e % 2 else 0)), E, .45))
                for k in range(2): put('arp', t + k * E / 2, inst(style, 'arp', mf(R + fb + [0, 4, 7, 12][(e * 2 + k) % 4]), E / 2, .1))
                if e % 8 == 0: put('pad', t, pad([mf(R + fb + x) for x in (0, 4, 7)], 4 * BEAT, .12))
                continue
            if m == 'fanfare':
                cr, q = R, 'M'; v = FANFARE[e - kb * 2]
                lead.append(v if v == '-' else cr + loct + v)
            else:
                cr, q = PROG[(e // 4) % 4]; cr += R
                lead.append(None if m == 'entry' else (THEME[e % 16] if THEME[e % 16] == '-' else R + loct - 12 + THEME[e % 16]))
            # bass: eighths with octave bounce (drive) or quarters (acoustic styles)
            if b8 or e % 2 == 0:
                put('bass', t, inst(style, 'bass', mf(cr - 24 + (12 if b8 and e % 2 else 0)), E if b8 else BEAT, .5, i=e))
            if b8 and g['n'] == 8: put('bass', t + E / 2, inst(style, 'bass', mf(cr - 24), E / 2, .35, i=e))
            # arps / chord colour
            if m == 'entry':
                if e % 2 == 0 and adiv: put('arp', t, inst(style, 'arp', mf(ct(cr, q, 2)), E, .08, i=e))
            elif adiv:
                for k in range(adiv):
                    sub = E / adiv
                    put('arp', t + k * sub, inst(style, 'arp', mf(ct(cr, q, (e * adiv + k) % 4) + (12 if adiv == 4 and k % 2 else 0)), sub, .09 if m != 'fanfare' else .12, i=e * 4 + k))
            if style in ('sea', 'noir') and e % 4 == 0:
                if style == 'sea': put('pad', t, pad([mf(x) for x in tones(cr, q)], 2 * BEAT, .14))
                else: put('arp', t + E, sum(partials(mf(x), E, .05, VIBES, trem=.3) for x in tones(cr, q)))   # noir off-beat chord stab
        # lead render with holds
        k = 0
        while k < len(lead):
            v = lead[k]
            if v in (None, '-'): k += 1; continue
            L = 1
            while k + L < len(lead) and lead[k + L] == '-': L += 1
            put('lead', t0 + k * E, inst(style, 'lead', mf(v), L * E, .42, i=k))
            if g['n'] == 8: put('arp', t0 + k * E, inst('chip', 'arp', mf(v + 12), L * E, .05))   # densest: octave double
            k += L
        # transition: rising swish + tone into the door
        if not g['final']:
            dl = g['dur'] - g['doorIn']; dn = ns(dl)
            sw = filt(noise(dn, 30 + g['n']), 800, 8000) * np.linspace(0, 1, dn) ** 2 * env(dn, a=.01, d=1, s=1, r=.03)
            put('pad', t0 + g['doorIn'], .22 * sw)
            tone = chip(mf(R), dl, .08, 'pulse', .125, f1=mf(R + 36), a=.05, d=1, s=1, r=.04) if style == 'chip' \
                else chip(mf(R + 12), dl, .07, 'sine', f1=mf(R + 36), a=.1, d=1, s=1, r=.04)
            put('pad', t0 + g['doorIn'], tone)
        else:                                              # final chord on b18, fully decayed at TOTAL
            tf = t0 + 18 * BEAT; L = total - tf
            hit(kit, 'kick', tf); hit('chip', 'crash', tf, .9)
            put('lead', tf, chip(mf(R + 16), L, .4, 'pulse', .25, d=.35, s=.15, r=L * .6) + partials(mf(R + 28), L, .15, GLOCK, r=L * .6))
            put('arp', tf, chip(mf(R + 12), L, .28, 'pulse', .5, d=.35, s=.15, r=L * .6))
            put('bass', tf, chip(mf(R - 24), L, .65, 'tri', d=.4, s=.2, r=L * .6))
            put('pad', tf, pad([mf(R + x) for x in (0, 4, 7, 12)], L, .2) * np.linspace(1, 0, ns(L)))
    gains = {'lead': .8, 'arp': .8, 'bass': .75, 'drums': .7, 'pad': 1.}
    st = {k: highpass(v * gains[k]) for k, v in st.items()}
    # level balance: each segment to its loudness target (L8 densest/loudest, finale on top), 40 ms ramps at joins
    mix = sum(st.values()); gl = np.zeros(n); t = tt(n)
    for g in segs:
        a, b = int(g['start'] * SR), int((g['start'] + g['dur']) * SR)
        gl[a:b] = TARGET.get(g['n'], -21.5) - lufs([mix[a:b]])
    k = ns(.04); gl = np.convolve(np.pad(gl, k, mode='edge'), np.ones(k) / k, 'same')[k:-k]
    return {key: v * 10 ** (gl / 20) for key, v in st.items()}, drums

TARGET = {8: -20.5, 9: -19.5}                             # per-level loudness (LUFS, before the -3 dBFS peak norm)


# ---------------------------------------------------------------- sfx
def sfx_bank(chipstyle):
    cat = lambda *xs: np.concatenate(xs)
    arp = lambda ms, d, duty=.25, vol=.3: cat(*[chip(mf(m), d, vol, 'pulse', duty, d=.08, s=.6) for m in ms])
    soft = lambda L, lo, hi, vol, seed, **e: vol * filt(noise(ns(L), seed), lo, hi) * env(ns(L), **e)
    b = {
        'loot':   arp([72, 76, 79, 84, 88], .045) if chipstyle else cat(*[partials(mf(m), .09, .3, GLOCK) for m in (76, 79, 84, 88)]),
        'jump':   chip(300, .16, .22, 'pulse', .5, f1=900, d=.1, s=.4) if chipstyle else chip(250, .16, .22, 'sine', f1=700, d=.1, s=.4),
        'door':   .22 * filt(noise(ns(.5), 13), 300, 6000) * np.linspace(.2, 1, ns(.5)) * env(ns(.5), a=.08, d=.3, s=.5, r=.12),
        'whoosh': soft(.35, 600, 5000, .25, 14, a=.06, d=.15, s=.3, r=.1),
        'fail':   cat(chip(98, .16, .32, d=.3, s=.8), np.zeros(ns(.04)), chip(82, .24, .32, d=.3, s=.8)),
        'ok':     cat(chip(mf(84), .08, .25, d=.1, s=.6), chip(mf(91), .14, .25, d=.1, s=.6)),
        'click':  chip(3000, .012, .35, f1=800, a=.0005, d=.004, s=0, r=.004),
        'type':   .08 * noise(ns(.008), 15) * env(ns(.008), a=.0003, d=.003, s=0, r=.003),
        'enter':  .28 * noise(ns(.05), 16) * env(ns(.05), a=.0005, d=.012, s=0) + chip(220, .05, .15, f1=120, d=.01, s=0),
        'tv_on':  chip(2400, .28, .25, 'sine', f1=300, d=.12, s=.4) + .05 * noise(ns(.28), 17) * env(ns(.28), d=.05, s=0),
        'fanfare': cat(arp([67, 67, 67], .1, .5, .28), chip(mf(72), .4, .3, d=.3, s=.6)),
        'scan':   chip(500, .5, .12, 'pulse', .125, f1=2000, a=.02, d=1, s=1, r=.05) * (.6 + .4 * np.sign(np.sin(TWO_PI * 20 * tt(ns(.5))))),
        'splash': soft(.7, 300, 6000, .35, 18, a=.005, d=.2, s=.1, r=.2),
        'sparkle': add(*[np.pad(partials(mf(m), .25, .14, GLOCK[:2]), (int(i * .035 * SR), 0)) for i, m in enumerate([88, 95, 91, 100, 96, 103])]),
    }
    if chipstyle:
        b['shot'] = chip(1400, .07, .13, 'pulse', .25, f1=300, d=.03, s=.2)
        b['hit'] = .25 * noise(ns(.05), 11, np.geomspace(12000, 5000, ns(.05))) * env(ns(.05), d=.012, s=0)
        b['kill'] = .6 * noise(ns(.6), 12, np.geomspace(4000, 600, ns(.6))) * env(ns(.6), d=.18, s=.05, r=.1) + chip(160, .6, .5, 'tri', f1=40, d=.12, s=0)
    else:  # softer: puff / tick / muffled boom
        b['shot'] = add(soft(.08, 300, 2500, .22, 19, a=.002, d=.02, s=0), chip(300, .06, .08, 'sine', f1=120, d=.02, s=0))
        b['hit'] = soft(.04, 1500, 6000, .18, 11, a=.0005, d=.008, s=0)
        b['kill'] = add(soft(.6, 40, 1800, .7, 12, a=.003, d=.15, s=.05, r=.15), chip(110, .5, .45, 'sine', f1=40, d=.15, s=0))
    return b

def render_sfx(events, segs, total):
    banks = {True: sfx_bank(True), False: sfx_bank(False)}
    n = int(round(total * SR)); buf = np.zeros(n)
    for ev in events:
        bank = banks[seg_at(segs, ev['t'])['n'] in (1, 9)]
        if ev['k'] not in bank: print('  ! unknown sfx kind', ev['k'], file=sys.stderr); continue
        x = bank[ev['k']]; i = int(round(ev['t'] * SR)); x = x[:max(0, n - i)]; buf[i:i + len(x)] += x
    pk = true_peak(buf)
    return buf * (.89 / pk) if pk > .89 else buf

def demo_events(segs):
    ev = []; add = lambda t, k: ev.append(dict(t=round(t, 4), k=k))
    for g in segs:
        s, kb = g['start'], round(g['kill'] / BEAT)
        if g['final']:
            add(s, 'fanfare'); add(s + 2 * BEAT, 'sparkle'); add(s + 18 * BEAT, 'sparkle'); continue
        if g['n'] == 1:
            for i in range(10): add(s + .08 + i * .1, 'type')
            add(s + 3 * BEAT, 'enter'); add(s + 3 * BEAT + .05, 'tv_on'); add(s + 4 * BEAT, 'jump'); add(s + 7 * BEAT, 'shot')
        else:
            for b in range(2, kb):
                if g['n'] == 7 and b >= 6: continue
                add(s + b * BEAT, 'shot'); add(s + b * BEAT + E, 'hit')
        if g['n'] == 3: add(s + BEAT, 'scan')
        if g['n'] == 5: add(s + g['kill'] + BEAT, 'splash')
        if g['n'] == 6: add(s + 4 * BEAT, 'fail'); add(s + g['kill'], 'ok')
        if g['n'] == 7: add(s + g['kill'], 'click')
        if g['n'] == 8: add(s + g['lootGrab'] + BEAT, 'sparkle')
        add(s + g['kill'], 'kill'); add(s + g['lootGrab'], 'loot')
        add(s + (kb + 4) * BEAT, 'jump'); add(s + g['doorIn'], 'door'); add(s + g['doorIn'] + .3, 'whoosh')
    return sorted(ev, key=lambda e: e['t'])


# ---------------------------------------------------------------- full-length dsp (FFT domain, no scipy)
def highpass(x, fc=15.0):  # gentle 1st-order zero-phase magnitude: kills DC, no long pre-ringing before kicks
    X = np.fft.rfft(x); f = np.fft.rfftfreq(len(x), 1 / SR)
    return np.fft.irfft(X * f / np.sqrt(f * f + fc * fc), len(x))

def biquad_resp(b, a, w):
    z = np.exp(-1j * w)
    return (b[0] + b[1] * z + b[2] * z * z) / (a[0] + a[1] * z + a[2] * z * z)

def k_weight(x):  # BS.1770 K-filter (48 kHz coefficients) applied as its exact frequency response
    w = TWO_PI * np.fft.rfftfreq(len(x), 1 / SR) / SR
    H = biquad_resp([1.53512485958697, -2.69169618940638, 1.19839281085285], [1, -1.69065929318241, .73248077421585], w) \
        * biquad_resp([1, -2, 1], [1, -1.99004745483398, .99007225036621], w)
    return np.fft.irfft(np.fft.rfft(x) * H, len(x))

def lufs(ch):  # integrated loudness, BS.1770-4 gating (400 ms blocks, 75 % overlap, -70 abs / -10 rel)
    blk, hop = int(.4 * SR), int(.1 * SR); z = 0
    for x in ch:
        c = np.concatenate([[0], np.cumsum(k_weight(x) ** 2)]); s = np.arange(0, len(x) - blk + 1, hop)
        z = z + (c[s + blk] - c[s]) / blk
    l = -.691 + 10 * np.log10(z + 1e-20)
    rel = -.691 + 10 * np.log10(z[l > -70].mean()) - 10
    return -.691 + 10 * np.log10(z[(l > -70) & (l > rel)].mean())

def oversample4(x):
    X = np.fft.rfft(x); return np.fft.irfft(np.pad(X, (0, len(X) * 3)), 4 * len(x)) * 4

def true_peak(x): return np.abs(oversample4(x)).max()
def db(v): return 20 * np.log10(max(v, 1e-12))

def limiter(ch, ceil_db=-1.3, look_ms=5, rel_ms=80):
    """1 ms gain computer on the 4x-oversampled peak: lookahead min, instant attack, exponential release"""
    ceil = 10 ** (ceil_db / 20); B = SR // 1000; n = len(ch[0]); nb = -(-n // B); pk = np.zeros(nb)
    for x in ch:
        up = np.abs(oversample4(x)); up = np.pad(up, (0, nb * B * 4 - len(up)))
        pk = np.maximum(pk, up.reshape(nb, B * 4).max(1))
    need = np.minimum(1, ceil / np.maximum(pk, 1e-9))
    need = np.min([np.concatenate([need[k:], np.ones(k)]) for k in range(look_ms + 1)] + [np.concatenate([[1.], need[:-1]])], 0)
    g = np.empty(nb); cur = 1.0; r = np.exp(-1 / rel_ms)
    for i in range(nb):
        cur = need[i] if need[i] < cur else need[i] + (cur - need[i]) * r; g[i] = cur
    gs = np.interp(np.arange(n), np.arange(nb) * B + B / 2, g)
    return [x * gs for x in ch]


# ---------------------------------------------------------------- io + checks
def write_wav(path, ch):
    a = np.clip(np.stack(ch, 1), -1, 1)
    with wave.open(str(path), 'wb') as w:
        w.setnchannels(a.shape[1]); w.setsampwidth(2); w.setframerate(SR)
        w.writeframes(np.round(a * 32767).astype('<i2').tobytes())

def read_mono(path, n):
    raw = subprocess.run(['ffmpeg', '-v', 'error', '-i', str(path), '-ac', '1', '-ar', str(SR), '-f', 'f32le', '-'],
                         capture_output=True, check=True).stdout
    x = np.frombuffer(raw, '<f4').astype(float)
    if abs(len(x) - n) > SR / 24: print(f'  ! vo length {len(x) / SR:.3f} s != {n / SR:.3f} s, padded/trimmed', file=sys.stderr)
    return np.pad(x, (0, max(0, n - len(x))))[:n]

def onsets(x, lo, hi, thr):
    W, H = 1024, 240
    fr = np.lib.stride_tricks.sliding_window_view(np.pad(x, (W // 2, W)), W)[::H] * np.hanning(W)
    f = np.fft.rfftfreq(W, 1 / SR); band = (f >= lo) & (f <= hi)
    e = 10 * np.log10((np.abs(np.fft.rfft(fr, axis=1))[:, band] ** 2).sum(1) + 1e-9)
    flux = np.maximum(np.diff(e, prepend=e[0]), 0); out, last = [], -99
    for i in np.where(flux > thr)[0]:
        if i - last > int(.15 * SR / H) and flux[i] >= flux[max(0, i - 3):i + 4].max(): out.append(i * H / SR); last = i
    return np.array(out)

def match(det, ref, tol=1 / 24):
    ref = np.array(ref); err = np.array([np.abs(det - r).min() if len(det) else 9 for r in ref]); ok = err <= tol
    fp = int(sum(np.abs(ref - d).min() > tol for d in det))
    return int(ok.sum()), len(ref), fp, (np.median(err[ok]) * 1000 if ok.any() else -1), (err[ok].max() * 1000 if ok.any() else -1)

def report(name, ch, total):
    x = np.mean(ch, 0); sp = np.abs(np.fft.rfft(x)) ** 2; f = np.fft.rfftfreq(len(x), 1 / SR)
    print(f'  {name}: {len(ch[0]) / SR:.4f} s (timeline {total:.4f}), {len(ch)} ch, peak {db(max(np.abs(c).max() for c in ch)):.2f} dBFS, '
          f'TP {db(max(true_peak(c) for c in ch)):.2f} dBTP, {lufs(ch):.2f} LUFS, DC {x.mean():+.1e}, '
          f'centroid {(f * sp).sum() / sp.sum():.0f} Hz, <20 Hz energy {sp[f < 20].sum() / sp.sum():.1e}')


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--demo-events', action='store_true'); ap.add_argument('--mix'); ap.add_argument('--nocheck', action='store_true')
    A = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    segs, total = load_segs()
    print(f'timeline: {len(segs)} segs, {sum(g["bars"] for g in segs)} bars, {total:.4f} s')

    stems, drums = compose(segs, total)
    music = sum(stems.values()); norm = 10 ** (-3 / 20) / np.abs(music).max()       # music.wav peak -3 dBFS
    music *= norm; stems = {k: v * norm for k, v in stems.items()}
    write_wav(OUT / 'music.wav', [music])
    (OUT / 'drums.json').write_text(json.dumps({'bpm': BPM, 'beat': BEAT, **drums}))
    print(f'music.wav, drums.json: {len(drums["kick"])} kicks, {len(drums["snare"])} snares, {len(drums["crash"])} crashes')

    ev_path, sfx = OUT / 'events.json', None
    if A.demo_events: ev_path.write_text(json.dumps(demo_events(segs))); print('events.json: demo grid written')
    if ev_path.exists():
        events = json.loads(ev_path.read_text()); sfx = render_sfx(events, segs, total)
        write_wav(OUT / 'sfx.wav', [sfx]); print(f'sfx.wav: {len(events)} events, kinds {sorted({e["k"] for e in events})}')

    if not A.nocheck:
        report('music', [music], total)
        if sfx is not None: report('sfx', [sfx], total)
        grid = list(np.arange(0, total, E / (2 if any(g['n'] == 8 for g in segs) else 1)))   # 16th grid
        for nm, x in (('drums stem', stems['drums']), ('full music', music)):
            d = onsets(x, 30, 160, 10)
            print(f'  kick sync, {nm}: %d/%d kicks within 1 frame, err median %.1f ms, max %.1f ms' % tuple(np.array(match(d, drums['kick']))[[0, 1, 3, 4]])
                  + f'; onsets off the 16th grid: {match(d, grid)[2]} of {len(d)}')

    if A.mix:
        n = len(music); vo = read_mono(A.mix, n)
        # voice on top (v2, «голос тонет»): gentle 2:1 compression above -24 dBFS (whispers stay quieter than shouts), then the voice
        # is set VO_OVER dB above the ducked music bed; ducking -10 dB, attack 30 ms, release 250 ms
        VO_OVER, DUCK = 9.0, -10.0
        env = np.sqrt(np.convolve(vo ** 2, np.ones(SR // 50) / (SR // 50), 'same')) + 1e-9
        thr = 10 ** (-24 / 20); vo = vo * np.where(env > thr, (thr / env) ** .5, 1.0)
        B = SR // 1000; nb = n // B
        lev = np.sqrt((vo[:nb * B].reshape(nb, B) ** 2).mean(1))
        tgt = np.where(lev > 10 ** (-45 / 20), 10 ** (DUCK / 20), 1.0)
        hold = np.convolve(tgt < 1, np.ones(120), 'same') > 0          # 120 ms hold bridges syllable gaps
        tgt = np.where(hold, 10 ** (DUCK / 20), 1.0)
        ga, gr = np.exp(-1 / 30), np.exp(-1 / 250); g = np.empty(nb); cur = 1.0
        for i in range(nb):
            cur = tgt[i] + (cur - tgt[i]) * (ga if tgt[i] < cur else gr); g[i] = cur
        duck = np.interp(np.arange(n), np.arange(nb) * B + B / 2, g)
        print(f'  ducking: voice present {hold.mean() * 100:.0f}% of the time')
        pan = {'lead': (.6, .4), 'arp': (.4, .6), 'bass': (.5, .5), 'drums': (.5, .5), 'pad': (.45, .55)}   # light spread
        mus = [sum(stems[k] * pan[k][c] * 2 for k in stems) * .7 for c in (0, 1)]
        bed = mus; mus = [m * duck for m in mus]
        sf = sfx if sfx is not None else np.zeros(n)
        vo = vo * 10 ** ((lufs(mus) + VO_OVER - lufs([vo, vo])) / 20)   # voice level relative to the bed
        mix = [mus[c] + .8 * sf + vo for c in (0, 1)]
        for _ in range(4):                                 # gain to -14 LUFS, limit, repeat: converges in 2-3 passes
            mix = [c * 10 ** ((-14 - lufs(mix)) / 20) for c in mix]; mix = limiter(mix)
        tp = max(true_peak(c) for c in mix)
        if tp > 10 ** (-1 / 20): mix = [c * 10 ** (-1.05 / 20) / tp for c in mix]
        write_wav(OUT / 'mix.wav', mix)
        report('mix', mix, total)


if __name__ == '__main__':
    main()
