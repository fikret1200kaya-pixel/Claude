"""Menü dokuları: taş panel (kesme taş) ve parşömen. python3 make_ui.py"""
import numpy as np
from PIL import Image, ImageFilter
rng = np.random.default_rng(7)
OUT = __file__.rsplit('/', 2)[0] + '/assets/ui/'

def noise(w, h, oct=6, p=.55):
    o = np.zeros((h, w)); a = 1; tot = 0
    for k in range(oct):
        s = 2 ** (8 - k)
        n = rng.random((h // s + 2, w // s + 2))
        im = Image.fromarray((n * 255).astype(np.uint8)).resize((w + s * 2, h + s * 2), Image.BICUBIC)
        o += np.asarray(im, float)[:h, :w] / 255 * a; tot += a; a *= p
    return o / tot

def stone(w=640, h=1280):
    base = np.array([132, 114, 92], float)
    n = noise(w, h); n2 = noise(w, h, 3, .7)
    img = np.ones((h, w, 3)) * base
    img *= (.72 + .55 * n)[..., None]
    shade = np.zeros((h, w))
    y = 0; row = 0
    while y < h:
        rh = int(rng.integers(70, 120)); x = -int(rng.integers(0, 140))
        while x < w:
            bw = int(rng.integers(130, 240))
            x0, x1, y0, y1 = max(x, 0), min(x + bw, w), y, min(y + rh, h)
            tint = np.array([1, .99, .97]) * rng.uniform(.82, 1.12) * rng.normal(1, .025, 3)
            img[y0:y1, x0:x1] *= tint
            # kenar pahı: üst/sol aydınlık, alt/sağ gölge
            for d in range(7):
                k = (7 - d) / 7
                if y0 + d < y1: shade[y0 + d, x0:x1] += .16 * k
                if y1 - 1 - d > y0: shade[y1 - 1 - d, x0:x1] -= .3 * k
                if x0 + d < x1: shade[y0:y1, x0 + d] += .1 * k
                if x1 - 1 - d > x0: shade[y0:y1, x1 - 1 - d] -= .22 * k
            # derz
            img[y0:y0 + 3, x0:x1] = img[y0:y0 + 3, x0:x1] * .3
            img[y0:y1, x0:min(x0 + 3, x1)] *= .3
            x += bw
        y += rh; row += 1
    img *= (1 + shade)[..., None]
    # çatlak/leke
    g = np.asarray(Image.fromarray((rng.random((h, w)) * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(.8)), float) / 255
    g2 = np.asarray(Image.fromarray((rng.random((h // 6, w // 6)) * 255).astype(np.uint8)).resize((w, h), Image.BICUBIC), float) / 255
    img *= (.8 + .25 * g + .2 * g2 + .1 * n2)[..., None] * .92
    img = np.clip(img, 0, 255).astype(np.uint8)
    Image.fromarray(img).filter(ImageFilter.GaussianBlur(.6)).save(OUT + 'stone.jpg', quality=82)

def parchment(w=1600, h=1000):
    n = noise(w, h, 7, .6); n2 = noise(w, h, 4, .5)
    c = np.array([226, 205, 160], float)
    img = np.ones((h, w, 3)) * c * (.86 + .22 * n)[..., None]
    img[..., 2] *= .92 + .1 * n2
    yy, xx = np.mgrid[0:h, 0:w]; d = np.maximum(abs(xx / w - .5), abs(yy / h - .5)) * 2
    img *= (1 - .45 * np.clip(d - .55, 0, 1) ** 1.4 * 2.2)[..., None]
    st = np.clip((noise(w, h, 3, .5) - .55) * 4, 0, 1)[..., None]
    img *= 1 - st * np.array([.1, .15, .22])
    Image.fromarray(np.clip(img, 0, 255).astype(np.uint8)).save(OUT + 'parchment.jpg', quality=80)

stone(); parchment()
