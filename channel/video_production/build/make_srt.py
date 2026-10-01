"""Word-synced SRT captions from an aligned sentences.json.
usage: python3 make_srt.py <sentences.json> <out.srt>
Spelled-out numbers (written that way for the narrator) are turned back into digits for on-screen reading.
"""
import json, re, sys
S = json.load(open(sys.argv[1])); T_END = S[-1]['t1']
REP = [  # longest first
 ("zero point zero one megapixel", "0.01-megapixel"), ("three hundred million dollars", "$300 million"), ("fifty million dollars", "$50 million"),
 ("one billion dollars", "$1 billion"), ("forty-seven billion dollars", "$47 billion"), ("seven billion dollars", "$7 billion"),
 ("late eighteen hundreds", "late 1800s"), ("nineteen seventy-five", "1975"), ("nineteen eighty-five", "1985"), ("nineteen ninety-seven", "1997"),
 ("nineteen eighty-three", "1983"), ("nineteen ninety-three", "1993"), ("nineteen eighties", "1980s"), ("nineteen nineties", "1990s"), ("eighteen sixty-five", "1865"),
 ("two thousand twenty-four", "2024"), ("two thousand twenty-three", "2023"), ("two thousand twenty-one", "2021"), ("two thousand nineteen", "2019"),
 ("two thousand sixteen", "2016"), ("two thousand thirteen", "2013"), ("two thousand twelve", "2012"), ("two thousand eleven", "2011"), ("two thousand ten", "2010"),
 ("two thousand eight", "2008"), ("two thousand seven", "2007"), ("two thousand four", "2004"), ("two thousand", "2000"),
 ("mid two-thousands", "mid-2000s"), ("the two-thousands", "the 2000s"), ("Thirty-seven years", "37 years"), ("twenty-three seconds", "23 seconds"),
 ("a hundred thousand", "100,000"), ("nine thousand", "9,000"), ("thirteen employees", "13 employees"), ("forty percent", "40%"), ("Chapter Eleven", "Chapter 11"),
 ("one dollar and fifty cents", "$1.50"), ("fourteen percent", "14%"), ("fifteen percent", "15%"), ("ninety percent", "90%"),
]
def fmt(t):
    t = max(0, t); return f"{int(t//3600):02d}:{int(t%3600//60):02d}:{int(t%60):02d},{int(round((t-int(t))*1000))%1000:03d}"
toks = []
for si, s in enumerate(S):
    words = s['words']; wi = 0
    for tok in s['text'].split():
        n = len(re.findall(r"[A-Za-z']+", tok.replace('-', ' ')))
        toks.append((tok, words[min(wi, len(words)-1)][1] if words else s['t0'], si)); wi += n
# merge multi-word number phrases into one token (case-insensitive) so they are never split across captions
def norm(w): return re.sub(r"[^a-z0-9'-]", '', w.lower())
merged = []; i = 0
phr = [(a.lower().split(), b) for a, b in REP]
while i < len(toks):
    hit = None
    for words_a, b in phr:
        k = len(words_a); seg = toks[i:i + k]
        if len(seg) == k and seg[-1][2] == seg[0][2] and [norm(x[0]) for x in seg] == [norm(w) for w in words_a]:
            tail = re.sub(r"^.*?([.,:;?!\"]*)$", r"\1", seg[-1][0]); first = seg[0][0]
            disp = (b[0].upper() + b[1:]) if first[:1].isupper() and b[:1].isalpha() else b
            hit = (disp + tail, seg[0][1], seg[0][2], k); break
    if hit: merged.append(hit[:3]); i += hit[3]
    else: merged.append(toks[i]); i += 1
toks = merged
caps, cur = [], []
for tok, t, si in toks:
    if cur and (len(' '.join(x[0] for x in cur + [(tok, t, si)])) > 80 or si != cur[-1][2]): caps.append(cur); cur = []
    cur.append((tok, t, si))
    if tok.endswith(('.', '?', '!', ':')) and len(' '.join(x[0] for x in cur)) > 35: caps.append(cur); cur = []
if cur: caps.append(cur)
out = []
for k, c in enumerate(caps):
    st = c[0][1]; en = min((caps[k+1][0][1] - .05) if k + 1 < len(caps) else T_END, st + 6.0)
    txt = ' '.join(x[0] for x in c)
    if len(txt) > 42:
        sp = [m.start() for m in re.finditer(' ', txt)]; mid = min(sp, key=lambda p: abs(p - len(txt) / 2)); txt = txt[:mid] + '\n' + txt[mid+1:]
    out.append(f"{k+1}\n{fmt(st)} --> {fmt(en)}\n{txt}\n")
open(sys.argv[2], 'w').write('\n'.join(out)); print(len(out), 'captions ->', sys.argv[2])
