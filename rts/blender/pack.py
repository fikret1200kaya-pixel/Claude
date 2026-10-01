"""FATİH — Render karelerini kırpıp atlaslara paketler.
Kullanım: python3 pack.py <units_dir> <static_dir> <rts/assets>
Çıktı: u_<bakış>.png / u_<bakış>_m.png, static.png / static_m.png, sprites.js (window.SPRITES)
"""
import os, sys, json, math
from PIL import Image, ImageChops

UNIT_ANCHOR = (64, 64 + .45 * math.cos(math.radians(30)) * 32 / math.cos(math.radians(45)))


def bbox(*ims):
    bb = None
    for im in ims:
        b = im.getchannel('A').point(lambda v: 255 if v > 6 else 0).getbbox()
        if b:
            bb = b if bb is None else (min(bb[0], b[0]), min(bb[1], b[1]), max(bb[2], b[2]), max(bb[3], b[3]))
    return bb or (0, 0, 1, 1)


def mask_rgba(m):
    """Maske render'ı (siyah/beyaz ışıma + alfa) -> beyaz renk, alfa = parlaklık × alfa."""
    m = m.convert('RGBA')
    a = ImageChops.multiply(m.convert('L'), m.getchannel('A'))
    out = Image.new('RGBA', m.size, (255, 255, 255, 0)); out.putalpha(a)
    return out


def shelf_pack(items, width):
    """items: [(key, w, h)] -> {key: (x, y)}, toplam yükseklik"""
    items = sorted(items, key=lambda t: -t[2])
    pos, x, y, rowh = {}, 0, 0, 0
    for k, w, h in items:
        if x + w > width:
            x, y, rowh = 0, y + rowh + 1, 0
        pos[k] = (x, y); x += w + 1; rowh = max(rowh, h)
    return pos, y + rowh + 1


def pack_group(entries, width, out_png, out_mask):
    """entries: {key: (color_img, mask_img, anchor_x, anchor_y)} -> {key: [x,y,w,h,ax,ay]}"""
    crops = {}
    for k, (c, m, ax, ay) in entries.items():
        bb = bbox(c)
        crops[k] = (c.crop(bb), m.crop(bb) if m is not None else None, ax - bb[0], ay - bb[1])
    pos, H = shelf_pack([(k, v[0].width, v[0].height) for k, v in crops.items()], width)
    atlas = Image.new('RGBA', (width, H), (0, 0, 0, 0)); matlas = Image.new('RGBA', (width, H), (255, 255, 255, 0))
    meta = {}
    for k, (c, m, ax, ay) in crops.items():
        x, y = pos[k]; atlas.paste(c, (x, y))
        if m is not None:
            matlas.paste(mask_rgba(m), (x, y))
        meta[k] = [x, y, c.width, c.height, round(ax, 1), round(ay, 1)]
    atlas.save(out_png, optimize=True); matlas.save(out_mask, optimize=True)
    return meta


def main(udir, sdir, out):
    os.makedirs(out, exist_ok=True)
    S = {'units': {}, 'statics': {}}
    for look in sorted(os.listdir(udir)):
        d = os.path.join(udir, look); entries = {}
        for f in os.listdir(d):
            if f.endswith('_m.png'):
                continue
            key = f[:-4]
            c = Image.open(os.path.join(d, f)).convert('RGBA'); m = Image.open(os.path.join(d, key + '_m.png'))
            entries[key] = (c, m, c.width / 2, c.height / 2 + UNIT_ANCHOR[1] - 64)
        meta = pack_group(entries, 2048, os.path.join(out, 'u_%s.png' % look), os.path.join(out, 'u_%s_m.png' % look))
        S['units'][look] = {'img': 'u_%s.png' % look, 'mask': 'u_%s_m.png' % look, 'f': meta}
        print('unit', look, len(meta), flush=True)
    entries = {}; scales = {}
    for f in os.listdir(sdir):
        if not f.endswith('.json'):
            continue
        name = f[:-5]; j = json.load(open(os.path.join(sdir, f)))
        c = Image.open(os.path.join(sdir, name + '.png')).convert('RGBA'); m = Image.open(os.path.join(sdir, name + '_m.png'))
        entries[name] = (c, m, j['ax'], j['ay']); scales[name] = j['scale']
    meta = pack_group(entries, 4096, os.path.join(out, 'static.png'), os.path.join(out, 'static_m.png'))
    S['statics'] = {'img': 'static.png', 'mask': 'static_m.png', 'f': meta, 'scale': 2}
    print('statics', len(meta))
    with open(os.path.join(out, 'sprites.js'), 'w') as fh:
        fh.write('/* Blender ile üretildi (rts/blender) */\nwindow.SPRITES = ' + json.dumps(S, separators=(',', ':')) + ';\n')


if __name__ == '__main__':
    main(*sys.argv[1:4])
