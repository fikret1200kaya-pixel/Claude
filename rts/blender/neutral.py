"""Takım maskesi altındaki renkleri açık griye çevirir (oyun takım rengini çarparak uygular).
Kullanım: python3 neutral.py <klasör> [--recursive]"""
import sys, os, glob
import numpy as np
from PIL import Image
root = sys.argv[1]
fs = glob.glob(os.path.join(root, '**', '*.png'), recursive=True)
n = 0
for f in fs:
    if f.endswith('_m.png'): continue
    mf = f[:-4] + '_m.png'
    if not os.path.exists(mf): continue
    im = Image.open(f).convert('RGBA'); m = Image.open(mf).convert('L').resize(im.size, Image.BILINEAR)
    a = np.asarray(im).astype(np.float32); w = (np.asarray(m).astype(np.float32) / 255)[..., None]
    if w.max() < .05: continue
    rgb = a[..., :3]; lum = (rgb * [.299, .587, .114]).sum(-1, keepdims=True)
    grey = np.clip(lum * 1.9 + 40, 0, 255).repeat(3, -1)    # kırmızı kumaşın parlaklığı ~ açık gri
    a[..., :3] = rgb * (1 - w) + grey * w
    Image.fromarray(a.astype(np.uint8)).save(f); n += 1
print('neutralized', n)
