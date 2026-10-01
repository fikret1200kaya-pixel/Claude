"""Word-level alignment of narration audio to the script paragraphs.
usage: python3 align.py <narration.mp3> <paragraphs.txt> <out_sentences.json>
Uses a local streaming Zipformer ASR model (sherpa-onnx) for word timestamps, then maps them
onto the script words with difflib; unmatched words are interpolated.
"""
import json, re, sys, subprocess, wave, difflib, os
import numpy as np
import sherpa_onnx

MODEL = os.environ.get('ASR_MODEL', '/tmp/sherpa-onnx-streaming-zipformer-en-20M-2023-02-17/')
audio, paras_path, out = sys.argv[1:4]
wav = out + '.16k.wav'
subprocess.run(['ffmpeg', '-y', '-loglevel', 'error', '-i', audio, '-ar', '16000', '-ac', '1', wav], check=True)
T = float(subprocess.check_output(['ffprobe', '-v', 'error', '-show_entries', 'format=duration', '-of', 'csv=p=0', audio]).decode())

rec = sherpa_onnx.OnlineRecognizer.from_transducer(tokens=MODEL + 'tokens.txt', encoder=MODEL + 'encoder-epoch-99-avg-1.int8.onnx', decoder=MODEL + 'decoder-epoch-99-avg-1.int8.onnx', joiner=MODEL + 'joiner-epoch-99-avg-1.int8.onnx', num_threads=4, sample_rate=16000, feature_dim=80, decoding_method='greedy_search')
w = wave.open(wav); sr = w.getframerate(); x = np.frombuffer(w.readframes(w.getnframes()), dtype=np.int16).astype(np.float32) / 32768
s = rec.create_stream()
for i in range(0, len(x), 1600):
    s.accept_waveform(sr, x[i:i + 1600])
    while rec.is_ready(s): rec.decode_stream(s)
s.accept_waveform(sr, np.zeros(8000, dtype=np.float32)); s.input_finished()
while rec.is_ready(s): rec.decode_stream(s)
r = rec.get_result_all(s); os.remove(wav)

words = []; cur = ''; t0 = None
for tok, tm in zip(r.tokens, r.timestamps):
    if tok.startswith(' ') or tok.startswith('▁'):
        if cur: words.append((cur, t0))
        cur = tok.lstrip(' ▁'); t0 = tm
    else:
        if t0 is None: t0 = tm
        cur += tok
if cur: words.append((cur, t0))

paras = [p.strip() for p in open(paras_path).read().split('\n\n') if p.strip()]
sent_list = []
for pi, p in enumerate(paras):
    p2 = p.replace('C.E.O.', 'CEO').replace('I.P.O.', 'IPO').replace('U.S.', 'US')
    parts = re.split(r'(?<=[.?!])\s+', p2); outp = []
    for sx in parts:
        if outp and outp[-1].endswith('...'): outp[-1] += ' ' + sx
        else: outp.append(sx)
    for sx in outp: sent_list.append((pi, sx))
sw = []; sidx = []
for si, (pi, sx) in enumerate(sent_list):
    for wd in re.findall(r"[A-Za-z']+", sx.replace('-', ' ')):
        sw.append(wd.lower().replace("'", '')); sidx.append(si)
aw = [re.sub(r'[^a-z]', '', wd.lower()) for wd, _ in words]
sm = difflib.SequenceMatcher(None, sw, aw, autojunk=False)
tm = [None] * len(sw)
for blk in sm.get_matching_blocks():
    for k in range(blk.size): tm[blk.a + k] = words[blk.b + k][1]
known = [i for i, v in enumerate(tm) if v is not None]
for i in range(len(tm)):
    if tm[i] is None:
        lo = max([k for k in known if k < i], default=None); hi = min([k for k in known if k > i], default=None)
        if lo is None: tm[i] = 0.2
        elif hi is None: tm[i] = tm[lo] + 0.3 * (i - lo)
        else: tm[i] = tm[lo] + (tm[hi] - tm[lo]) * (i - lo) / (hi - lo)
sents = []
for si, (pi, sx) in enumerate(sent_list):
    idx = [i for i, v in enumerate(sidx) if v == si]
    sents.append({'i': si, 'para': pi, 'text': sx, 't0': round(tm[idx[0]], 2), 'words': [[sw[i], round(tm[i], 2)] for i in idx]})
for k, sx in enumerate(sents):
    sx['t1'] = round((sents[k + 1]['t0'] - 0.25) if k < len(sents) - 1 else T, 2)
json.dump(sents, open(out, 'w'), indent=1)
print(f'matched {len(known)}/{len(sw)} words, {len(sents)} sentences, duration {T:.2f}s')
for sx in sents: print(f"{sx['i']:02d} {sx['t0']:6.1f}-{sx['t1']:6.1f} {sx['text'][:60]}")
