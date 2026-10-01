"""Original documentary underscore, synced to narration timings (one timeline function per video).
usage: python3 make_score.py <sentences.json> <out_base> <video_id: 01|02>
Fully synthesized (no samples, no third-party audio) -> no copyright issues.
Output: <base>_bed.wav (ducked under narration) and <base>_hits.wav (impacts, not ducked), 44.1 kHz stereo.
"""
import json, wave, sys
import numpy as np

SR = 44100
rng = np.random.default_rng(11)
S = json.load(open(sys.argv[1]))
VIDEO_ID = sys.argv[3] if len(sys.argv) > 3 else '01'
T_END = S[-1]['t1']
N = int(SR * (T_END + 2.0))
def T0(i): return S[i]['t0']
def CW(i, w):
    for x, t in S[i]['words']:
        if x == w: return t
    return S[i]['t0']

L = np.zeros(N); R = np.zeros(N); HL = np.zeros(N); HR = np.zeros(N)
def add(sig, start, pan=0.0, gain=1.0, stem='bed'):
    i = int(start * SR)
    if i >= N: return
    if i < 0: sig = sig[-i:]; i = 0
    n = min(len(sig), N - i)
    a = (pan + 1) * np.pi / 4
    tl, tr = (HL, HR) if stem == 'hit' else (L, R)
    tl[i:i + n] += sig[:n] * gain * np.cos(a); tr[i:i + n] += sig[:n] * gain * np.sin(a)

def hz(m): return 440.0 * 2 ** ((m - 69) / 12)
NOTE = {'C': 0, 'C#': 1, 'D': 2, 'Eb': 3, 'E': 4, 'F': 5, 'F#': 6, 'G': 7, 'Ab': 8, 'A': 9, 'Bb': 10, 'B': 11}
def chord(root, kind, octave=3):
    r = 12 * (octave + 1) + NOTE[root]
    third = 3 if kind == 'm' else 4
    return [r, r + 7, r + 12, r + 12 + third, r + 19]

# ---------- instruments ----------
def pad(notes, dur, att=1.8, rel=2.2, bright=6, gain=1.0):
    n = int((dur + rel) * SR); t = np.arange(n) / SR
    sig = np.zeros(n)
    for m in notes:
        for dc in (-8, 0, 8):
            f = hz(m) * 2 ** (dc / 1200); ph = rng.random() * 6.28
            for h in range(1, bright + 1):
                if f * h > 6000: break
                sig += np.sin(2 * np.pi * f * h * t + ph * h) * (0.8 ** h) / h
    env = np.minimum(1, t / att) * np.where(t > dur, np.exp(-(t - dur) / (rel / 3)), 1.0)
    env *= 1 + 0.07 * np.sin(2 * np.pi * 0.17 * t)
    return sig * env * gain / (len(notes) * 3)

def bass(m, dur, gain=1.0):
    n = int((dur + 1.0) * SR); t = np.arange(n) / SR; f = hz(m)
    sig = np.sin(2 * np.pi * f * t) + 0.25 * np.sin(2 * np.pi * 2 * f * t)
    env = np.minimum(1, t / 0.6) * np.where(t > dur, np.exp(-(t - dur) / 0.3), 1.0)
    return sig * env * gain

def pluck(m, dur=2.2, gain=1.0):
    n = int(dur * SR); t = np.arange(n) / SR; f = hz(m)
    sig = sum(np.sin(2 * np.pi * f * h * t) * (0.6 ** (h - 1)) * np.exp(-t * (1.6 + 0.9 * h)) for h in range(1, 7))
    return sig * np.minimum(1, t / 0.004) * gain

def kick(f0=62, f1=36, dur=0.7, gain=1.0):
    n = int(dur * SR); t = np.arange(n) / SR
    f = f1 + (f0 - f1) * np.exp(-t * 18); ph = 2 * np.pi * np.cumsum(f) / SR
    return np.sin(ph) * np.exp(-t * 6.5) * gain

def heartbeat(start, end, bpm=62, gain=0.9):
    p = 60 / bpm; t = start
    while t < end - .3:
        add(kick(gain=gain), t); add(kick(f0=55, gain=gain * .55), t + .24); t += p

def brown(n):
    w = rng.standard_normal(n); b = np.cumsum(w); b -= np.convolve(b, np.ones(2001) / 2001, mode='same'); return b / (np.abs(b).max() + 1e-9)

def tick(gain=1.0):
    n = int(.03 * SR); t = np.arange(n) / SR; w = rng.standard_normal(n); hp = np.diff(w, prepend=0)
    return hp * np.exp(-t * 260) * gain

def ticks(start, end, step, gain=.25):
    t = start; k = 0
    while t < end: add(tick(gain * (1 if k % 2 == 0 else .7)), t, pan=(-.35 if k % 2 else .35)); t += step; k += 1

def boom(gain=1.0):
    n = int(3.2 * SR); t = np.arange(n) / SR
    f = 34 + 40 * np.exp(-t * 5); low = np.sin(2 * np.pi * np.cumsum(f) / SR) * np.exp(-t * 1.6)
    nz = brown(n) * np.exp(-t * 9) * .6
    return (low + nz) * gain

def riser(dur=1.4, gain=.6):
    n = int(dur * SR); t = np.arange(n) / SR; x = t / dur
    wh = rng.standard_normal(n) * .25; br = brown(n)
    sig = (br * (1 - x) + wh * x) * x ** 2.2
    return sig * gain

def hit(at, big=True, rise=True):
    if rise: add(riser(1.3 if big else .7, .55 if big else .3), at - (1.3 if big else .7), stem='hit')
    add(boom(1.0 if big else .55), at - .02, stem='hit')

def arps(start, end, prog, clen, step, gain=.16, octave_up=24):
    t = start; k = 0
    while t < end - .2:
        ci = int((t - start) // clen) % len(prog); notes = chord(*prog[ci])
        seq = [notes[0], notes[1], notes[3], notes[2]]
        add(pluck(seq[k % 4] + octave_up - 12, gain=gain), t, pan=(-.4 if k % 2 else .4)); t += step; k += 1

def bed(start, end, prog, clen=5.0, gain=1.0, bass_gain=.35, octave=3):
    t = start; i = 0
    while t < end - .5:
        d = min(clen, end - t); r, k = prog[i % len(prog)]
        add(pad(chord(r, k, octave), d, gain=gain), t, pan=0)
        add(bass(12 * (octave) + NOTE[r], d, gain=bass_gain), t)
        t += clen; i += 1

WARM = [('D', 'm'), ('Bb', 'M'), ('F', 'M'), ('C', 'M')]
TENSE = [('D', 'm'), ('Bb', 'M'), ('G', 'm'), ('A', 'M')]
REFLECT = [('F', 'M'), ('C', 'M'), ('D', 'm'), ('Bb', 'M')]
DARK = [('D', 'm'), ('D', 'm'), ('Bb', 'M'), ('A', 'M')]

# ---------- timelines (seconds come from the narration alignment) ----------
def timeline_01():   # Blockbuster
    tNO, tBANK, tTITLE = CW(2, 'no') - .05, CW(5, 'bankrupt') - .1, T0(6)
    EMPIRE, HIDDEN, CHALL, OFFER, DECIDE = T0(7), T0(12), T0(16), T0(20), T0(22)
    LATE, CATCH, COLLAPSE, BRUTAL, CH11T = T0(27), T0(33), T0(39), T0(39), CW(44, 'bankruptcy') - .2
    LESSONS, DIFF, COMFY, OUTRO = T0(47), T0(59), T0(63), T0(65)

    # cold open
    bed(0.0, tTITLE, DARK, clen=4.6, gain=.9, bass_gain=.45, octave=2)
    heartbeat(1.0, tTITLE - .4, bpm=64)
    hit(tNO); hit(tBANK)
    ticks(T0(3), T0(5), .5, .18)
    # title
    hit(tTITLE, big=True)
    add(pad(chord('D', 'm', 3), EMPIRE - tTITLE, att=.3, gain=1.1), tTITLE)
    # empire (warm)
    bed(EMPIRE, HIDDEN, WARM, gain=.85)
    arps(EMPIRE + 2.5, HIDDEN, WARM, 5.0, .3125, gain=.11)
    ticks(EMPIRE + 5, HIDDEN, .3125, .07)
    # hidden problem + challenger + offer (drive)
    add(riser(.8, .3), HIDDEN - .8)
    bed(HIDDEN, DECIDE, WARM, gain=.85)
    arps(HIDDEN, DECIDE, WARM, 5.0, .3125, gain=.12)
    ticks(HIDDEN, DECIDE, .3125, .09)
    heartbeat(OFFER, DECIDE, bpm=72, gain=.7)
    # decision
    hit(DECIDE + .1, big=True)
    bed(DECIDE, LATE, DARK, clen=4.0, gain=.85, octave=2)
    # too late (tense)
    add(riser(.8, .3), LATE - .8)
    bed(LATE, COLLAPSE, TENSE, clen=4.0, gain=.85)
    ticks(LATE, COLLAPSE, .5, .16)
    heartbeat(CATCH, COLLAPSE, bpm=70, gain=.75)
    hit(CATCH + .05, big=False)
    # collapse
    hit(BRUTAL + .05, big=True)
    bed(COLLAPSE, T0(44), TENSE, clen=3.6, gain=.85)
    ticks(COLLAPSE, T0(44), .25, .12)
    hit(CH11T, big=True)
    bed(T0(44), LESSONS, DARK, clen=5.5, gain=.7, bass_gain=.3, octave=2)
    # lessons + difference (reflect)
    add(riser(1.0, .35), LESSONS - 1.0)
    bed(LESSONS, COMFY, REFLECT, gain=.8)
    arps(LESSONS + 1, COMFY, REFLECT, 5.0, .375, gain=.12)
    hit(COMFY, big=False)
    bed(COMFY, OUTRO, DARK, clen=4.0, gain=.75, octave=2)
    # outro: resolve to D major
    add(riser(1.2, .4), OUTRO - 1.2)
    add(boom(.5), OUTRO)
    for i, (r, k) in enumerate([('Bb', 'M'), ('C', 'M'), ('D', 'M')]):
        d = 3.0 if i < 2 else T_END + 1.5 - (OUTRO + 6.0)
        add(pad(chord(r, k, 3), d, gain=1.0), OUTRO + 3.0 * i); add(bass(36 + NOTE[r], d, .35), OUTRO + 3.0 * i)
    arps(OUTRO, T_END, [('D', 'M')], 9, .375, gain=.1)

def timeline_02():   # Kodak
    TITLE, EMPIRE, INVENT, DILEMMA = CW(3, 'bankruptcy') + 1.1, T0(4) + 2.4, T0(9), T0(16)
    PHONES, LESSONS, CLOSE, OUTRO = T0(24), T0(32), T0(45), T0(48)
    bed(0.0, TITLE, DARK, clen=4.4, gain=.9, bass_gain=.45, octave=2)
    heartbeat(.8, TITLE - .4, bpm=64)
    hit(T0(2) + .05, big=False); hit(CW(3, 'bankruptcy') - .1)
    ticks(CW(3, 'thirty') - .2, CW(3, 'bankruptcy') - .2, .25, .14)
    hit(TITLE, big=True); add(pad(chord('D', 'm', 3), EMPIRE - TITLE, att=.3, gain=1.1), TITLE)
    bed(EMPIRE, INVENT, WARM, gain=.85); arps(EMPIRE + 2, INVENT, WARM, 5.0, .3125, gain=.11); ticks(EMPIRE + 4, INVENT, .3125, .07)
    add(riser(.8, .3), INVENT - .8)
    bed(INVENT, DILEMMA, WARM, gain=.85); arps(INVENT, DILEMMA, WARM, 5.0, .3125, gain=.12); ticks(INVENT, DILEMMA, .3125, .09)
    heartbeat(T0(13), DILEMMA, bpm=70, gain=.7); hit(CW(14, 'patent') - .05, big=False, rise=False)
    hit(DILEMMA + .05, big=True)
    bed(DILEMMA, PHONES, TENSE, clen=4.0, gain=.85); ticks(DILEMMA, PHONES, .5, .16); heartbeat(T0(19), PHONES, bpm=72, gain=.75)
    hit(T0(19) + .05, big=False, rise=False); hit(T0(20) + .05, big=False, rise=False)
    hit(PHONES + .05, big=True)
    bed(PHONES, T0(28), TENSE, clen=3.6, gain=.85); ticks(PHONES, T0(27), .25, .12); hit(CW(27, 'bankruptcy') - .15, big=True)
    bed(T0(28), LESSONS, DARK, clen=5.0, gain=.7, bass_gain=.3, octave=2); hit(T0(28) + .05, big=False)
    add(riser(1.0, .35), LESSONS - 1.0)
    bed(LESSONS, CLOSE, REFLECT, gain=.8); arps(LESSONS + 1, CLOSE, REFLECT, 5.0, .375, gain=.12)
    bed(CLOSE, OUTRO, DARK, clen=4.0, gain=.75, octave=2); hit(CW(47, 'nothing') - .1, big=False)
    add(riser(1.2, .4), OUTRO - 1.2); add(boom(.5), OUTRO)
    for i, (r, k) in enumerate([('Bb', 'M'), ('C', 'M'), ('D', 'M')]):
        d = 2.2 if i < 2 else T_END + 1.5 - (OUTRO + 4.4)
        add(pad(chord(r, k, 3), d, gain=1.0), OUTRO + 2.2 * i); add(bass(36 + NOTE[r], d, .35), OUTRO + 2.2 * i)
    arps(OUTRO, T_END, [('D', 'M')], 9, .375, gain=.1)

{'01': timeline_01, '02': timeline_02}[VIDEO_ID]()

# ---------- reverb (FFT convolution with synthetic stereo IR) ----------
def reverb(x, seed, dur=2.6, wet=.28):
    n = int(dur * SR); t = np.arange(n) / SR; ir = np.random.default_rng(seed).standard_normal(n) * np.exp(-t / .55); ir[0] = 0
    ir /= np.sqrt((ir ** 2).sum())
    size = 1 << int(np.ceil(np.log2(len(x) + n)))
    y = np.fft.irfft(np.fft.rfft(x, size) * np.fft.rfft(ir, size), size)[:len(x)]
    return x * (1 - wet) + y * wet * 2.2
L = reverb(L, 1); R = reverb(R, 2); HL = reverb(HL, 3, wet=.35); HR = reverb(HR, 4, wet=.35)
t = np.arange(N) / SR
fade = np.minimum(1, t / 0.6) * np.clip((T_END + .3 - t) / 1.5, 0, 1)
out_base = sys.argv[2]
for name, (a, b) in {'bed': (L, R), 'hits': (HL, HR)}.items():
    a = a * fade; b = b * fade
    peak = max(np.abs(a).max(), np.abs(b).max()); a = a / (peak / .89); b = b / (peak / .89)
    out = (np.stack([a, b], 1) * 32767).astype(np.int16)
    with wave.open(f'{out_base}_{name}.wav', 'wb') as w:
        w.setnchannels(2); w.setsampwidth(2); w.setframerate(SR); w.writeframes(out.tobytes())
print('ok', N / SR, 'sec')
