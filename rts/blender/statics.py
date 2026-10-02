"""FATİH — Bina ve doğa modelleri (statik sprite'lar, 2x çözünürlük).
Kullanım: python3 statics.py <çıktı_klasörü> [isim ...]
Her model için <isim>.png, <isim>_m.png (takım maskesi) ve <isim>.json (çapa noktası) üretir.
"""
import bpy, math, os, sys, json, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *

PI = math.pi
SCALE = 2.0


def mats():
    return dict(
        stone=M('stone', (.62, .57, .49), .85, brick=4.2, noise=9, nf=.35),
        stone_d=M('stone_d', (.44, .41, .38), .85, brick=4.2, noise=9, nf=.35),
        stone_w=M('stone_w', (.78, .62, .5), .85, brick=4.6, noise=9, nf=.3),
        plaster=M('plaster', (.86, .8, .68), .8, noise=6, nf=.22),
        roof=M('roof', (.62, .24, .14), .75, brick=9, noise=12, nf=.3, tiles=True),
        roof_d=M('roof_d', (.4, .26, .2), .75, brick=9, noise=12, nf=.3, tiles=True),
        ivy=M('ivy', (.12, .3, .08), .8, noise=40, nf=.6),
        timber=M('timber', (.2, .12, .06), .7, noise=25, nf=.3),
        lead=M('lead', (.52, .56, .6), .5, .2, noise=3, nf=.06, bump=0),
        lead_t=M('lead_t', (.3, .55, .55), .45, .15, noise=3, nf=.06, bump=0),
        wood=M('swood', (.46, .3, .16), .75, stripes=((.38, .24, .12), 18), noise=12, nf=.25),
        wood_d=M('swood_d', (.24, .15, .08), .7, noise=12, nf=.25),
        thatch=M('thatch', (.8, .66, .36), .9, noise=22, nf=.5),
        straw=M('sstraw', (.92, .78, .36), .9, noise=30, nf=.45),
        soil=M('soil', (.38, .26, .15), .95, noise=14, nf=.5),
        dark=M('sdark', (.05, .035, .025), .9),
        gold=M('sgold', (1, .74, .3), .3, 1.),
        iron=M('siron', (.22, .22, .24), .45, .8),
        bronze=M('sbronze', (.72, .45, .2), .35, 1.),
        team=M('steam', (.86, .86, .86), .7, noise=20, nf=.12, team=True),
        white=M('swhite', (.95, .93, .88), .7, noise=20, nf=.12),
        red=M('sred', (.66, .1, .07), .6, noise=20, nf=.12),
        glow=M('glow', (1, .5, .1), .5, emit=(1, .45, .08)),
        leaf=M('leaf', (.13, .32, .07), .8, noise=18, nf=.4),
        leaf2=M('leaf2', (.2, .4, .09), .8, noise=18, nf=.4),
        pine=M('pine', (.07, .22, .09), .8, noise=18, nf=.35),
        bark=M('bark', (.3, .2, .12), .9, noise=30, nf=.4),
        rock=M('rock', (.36, .34, .31), .9, noise=6, nf=.4),
        berry=M('berry', (.75, .05, .12), .35),
    )


# ------------------------------------------------------------ yardımcılar
def arch(S, face, u, z, w, h, depth=.05, mat=None):
    """face: 'x' (+X yüzü, u=y) veya 'y' (+Y yüzü, u=x); konum yüz düzleminde."""
    m = mat or S['dark']
    if face[0] == 'x':
        fx = face[1]
        box(depth, w, h, (fx, u, z + h / 2), m); cyl(w / 2, depth, (fx, u, z + h), m, rot=(0, PI / 2, 0), v=16)
    else:
        fy = face[1]
        box(w, depth, h, (u, fy, z + h / 2), m); cyl(w / 2, depth, (u, fy, z + h), m, rot=(PI / 2, 0, 0), v=16)


def merlons(cx, cy, half, z, m, n=3, both=True, size=.17):
    for k in range(n):
        t = -half + (k + .5) * 2 * half / n
        for (x, y) in ((half, t), (t, half), (-half, t), (t, -half)) if both else ((half, t), (t, half)):
            box(size, size, .2, (cx + x, cy + y, z + .1), m)


def ring_merlons(cx, cy, r, z, m, n=10, size=.16):
    for k in range(n):
        a = k / n * 2 * PI
        box(size, size, .2, (cx + math.cos(a) * r, cy + math.sin(a) * r, z + .1), m, rot=(0, 0, a))


def flag(S, x, y, z, h=1.0, big=1.):
    cyl(.025, h, (x, y, z + h / 2), S['wood_d'], v=8)
    mesh([(0, 0, 0), (0, .55 * big, -.05), (0, .5 * big, -.3 * big), (0, 0, -.32 * big)], [(0, 1, 2, 3)], S['team'], loc=(x, y + .02, z + h - .02))
    ball(.04, (x, y, z + h + .02), S['gold'])


def minaret(S, x, y, h, body=None, cap=None):
    cyl(.17, .3, (x, y, .15), S['stone'], v=16)
    cyl(.13, h, (x, y, h / 2), body or S['plaster'], v=16)
    cyl(.2, .06, (x, y, h * .72), S['stone'], v=16); cyl(.19, .12, (x, y, h * .75), body or S['plaster'], v=16)
    cyl(.145, .62, (x, y, h + .31), cap or S['lead'], r2=0.0, v=16)
    cyl(.012, .25, (x, y, h + .7), S['gold'], v=6); ball(.035, (x, y, h + .84), S['gold'])


def dome(S, x, y, z, r, m=None, hz=.85, fin='crescent', drum=None):
    if drum:
        cyl(r * 1.02, drum, (x, y, z + drum / 2), S['plaster'], v=32)
        for k in range(12):
            a = k / 12 * 2 * PI
            box(.03, .08, drum * .5, (x + math.cos(a) * r * 1.03, y + math.sin(a) * r * 1.03, z + drum * .5), S['dark'], rot=(0, 0, a))
        z += drum
    ball(r, (x, y, z), m or S['lead'], sc=(1, 1, hz), seg=40)
    top = z + r * hz
    if fin:
        cyl(.02, .3, (x, y, top + .15), S['gold'], v=6); ball(.045, (x, y, top + .05), S['gold'])
        if fin == 'crescent':
            torus(.09, .022, (x, y, top + .38), S['gold'], rot=(PI / 2, 0, PI / 4))
        else:
            box(.03, .03, .28, (x, y, top + .42), S['gold']); box(.18, .03, .03, (x, y, top + .46), S['gold'], rot=(0, 0, PI / 4))


def tent(S, x, y, r, h, wall=.5):
    bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=r, depth=wall); o = bpy.context.object
    o.data.materials.append(S['team']); o.data.materials.append(S['white'])
    for i, p in enumerate(o.data.polygons):
        p.material_index = i % 2
    o.location = (x, y, wall / 2)
    bpy.ops.mesh.primitive_cone_add(vertices=16, radius1=r * 1.12, radius2=0, depth=h); o = bpy.context.object
    o.data.materials.append(S['team']); o.data.materials.append(S['white'])
    for i, p in enumerate(o.data.polygons):
        p.material_index = i % 2
    o.location = (x, y, wall + h / 2)
    cyl(.02, .35, (x, y, wall + h + .15), S['gold'], v=6); ball(.06, (x, y, wall + h + .33), S['gold'])
    box(.05, r * .5, wall * .9, (x + r * .99, y, wall * .45), S['dark'])


def house_walls(S, w, d, h, mat, z0=0.):
    box(w, d, h, (0, 0, z0 + h / 2), mat)
    for (x, y) in ((w / 2, d / 2), (w / 2, -d / 2), (-w / 2, d / 2)):
        box(.07, .07, h, (x, y, z0 + h / 2), S['wood_d'])


def band(x0, y0, x1, y1, z, m, h=.07):
    """takım rengi şeridi (görünen iki yüz)"""
    box(.025, y1 - y0, h, (x1 + .012, (y0 + y1) / 2, z), m); box(x1 - x0, .025, h, ((x0 + x1) / 2, y1 + .012, z), m)


def timber_wall(S, x0, y0, x1, y1, z0, z1):
    """sıva + koyu ahşap çatkı (görünen iki yüz)"""
    box(x1 - x0, y1 - y0, z1 - z0, ((x0 + x1) / 2, (y0 + y1) / 2, (z0 + z1) / 2), S['plaster'])
    h = z1 - z0
    for (fx, a, b, ax) in ((x1, y0, y1, 'x'), (y1, x0, x1, 'y')):
        L = b - a; n = max(2, round(L / .38))
        for k in range(n + 1):
            u = a + L * k / n
            if ax == 'x':
                box(.03, .05, h, (fx + .015, u, z0 + h / 2), S['timber'])
            else:
                box(.05, .03, h, (u, fx + .015, z0 + h / 2), S['timber'])
        for zz in (z0 + .025, z1 - .025):
            if ax == 'x':
                box(.03, L, .05, (fx + .015, (a + b) / 2, zz), S['timber'])
            else:
                box(L, .03, .05, ((a + b) / 2, fx + .015, zz), S['timber'])
        for k in range(n):
            u0 = a + L * k / n; u1 = a + L * (k + 1) / n; ang = math.atan2(h, u1 - u0) * (1 if k % 2 else -1); d = math.hypot(h, u1 - u0)
            if ax == 'x':
                box(.03, d, .04, (fx + .016, (u0 + u1) / 2, z0 + h / 2), S['timber'], rot=(ang, 0, 0))
            else:
                box(d, .03, .04, ((u0 + u1) / 2, fx + .016, z0 + h / 2), S['timber'], rot=(0, -ang, 0))


def window(face, u, z, w, h, S):
    """kepenkli pencere"""
    if face[0] == 'x':
        fx = face[1]; box(.03, w, h, (fx + .01, u, z), S['dark']); box(.04, w + .06, .035, (fx + .02, u, z - h / 2 - .02), S['stone'])
        box(.025, w * .55, h, (fx + .02, u - w * .8, z), S['wood']); box(.025, w * .55, h, (fx + .02, u + w * .8, z), S['wood'])
    else:
        fy = face[1]; box(w, .03, h, (u, fy + .01, z), S['dark']); box(w + .06, .04, .035, (u, fy + .02, z - h / 2 - .02), S['stone'])
        box(w * .55, .025, h, (u - w * .8, fy + .02, z), S['wood']); box(w * .55, .025, h, (u + w * .8, fy + .02, z), S['wood'])


def dormer(x, y, z, face, S, w=.32):
    if face == 'x':
        box(.3, w, .26, (x, y, z + .13), S['plaster']); box(.03, w * .55, .14, (x + .16, y, z + .12), S['dark'])
        mesh([(x - .15, y - w / 2 - .04, z + .26), (x + .19, y - w / 2 - .04, z + .26), (x + .19, y, z + .44), (x - .15, y, z + .44), (x - .15, y + w / 2 + .04, z + .26), (x + .19, y + w / 2 + .04, z + .26)],
             [(0, 1, 2, 3), (3, 2, 5, 4)], S['roof'])
    else:
        box(w, .3, .26, (x, y, z + .13), S['plaster']); box(w * .55, .03, .14, (x, y + .16, z + .12), S['dark'])
        mesh([(x - w / 2 - .04, y - .15, z + .26), (x - w / 2 - .04, y + .19, z + .26), (x, y + .19, z + .44), (x, y - .15, z + .44), (x + w / 2 + .04, y - .15, z + .26), (x + w / 2 + .04, y + .19, z + .26)],
             [(0, 1, 2, 3), (3, 2, 5, 4)], S['roof'])


def ivy(S, pts, seed=0):
    rnd = random.Random(seed)
    for (x, y, z, r) in pts:
        for k in range(4):
            blob(r * (.4 + rnd.random() * .3), (x + rnd.uniform(-r, r) * .3, y + rnd.uniform(-r, r) * .3, z + rnd.uniform(-r, r) * 1.2), S['ivy'], sc=(.35, .35, .8), sub=2, disp=.9, seed=seed * 10 + k, tex_scale=9)


# ------------------------------------------------------------ binalar
def b_saray(S, cap):
    box(3, 3, .15, (0, 0, .075), S['stone_d'])
    box(2.4, 2.4, 1.05, (0, 0, .675), S['plaster'])
    box(2.52, 2.52, .1, (0, 0, 1.25), S['stone'])
    for u in (-.75, 0, .75):
        if u:
            arch(S, ('x', 1.205), u, .45, .3, .45); arch(S, ('y', 1.205), u, .45, .3, .45)
        arch(S, ('x', 1.205), u, .95, .18, .14); arch(S, ('y', 1.205), u, .95, .18, .14)
    arch(S, ('x', 1.21), 0, .15, .5, .62, mat=S['wood_d']); box(.03, .62, .08, (1.22, 0, .82), S['gold'])
    box(2.45, 2.45, .05, (0, 0, 1.32), S['lead'])
    dome(S, 0, 0, 1.33, .82, S['lead_t'], drum=.32)
    for (x, y) in ((.92, .92), (-.92, -.92), (.92, -.92), (-.92, .92)):
        cyl(.3, .12, (x, y, 1.39), S['plaster'], v=20); dome(S, x, y, 1.45, .28, S['lead_t'], fin=None)
    minaret(S, 1.32, -1.32, 2.9); minaret(S, -1.32, 1.32, 2.9)
    flag(S, 1.35, 1.35, .15, 1.6)


def b_ev(S, cap):
    box(1.6, 1.6, .06, (0, 0, .03), S['stone_d'])
    box(1.2, 1.2, .42, (0, 0, .27), S['stone'])                       # taş zemin kat
    arch(S, ('x', .605), .2, .06, .24, .3, mat=S['timber'])
    window(('y', .6), -.2, .3, .16, .16, S)
    for k in range(5):                                                   # cumba konsolları
        box(.05, .06, .12, (.6 + .04, -.5 + k * .25, .44), S['timber'], rot=(0, .6, 0)); box(.06, .05, .12, (-.5 + k * .25, .6 + .04, .44), S['timber'], rot=(-.6, 0, 0))
    timber_wall(S, -.68, -.68, .68, .68, .48, .98)                       # çıkmalı ahşap üst kat
    band(-.68, -.68, .68, .68, .5, S['team'], .05)
    window(('x', .69), -.3, .74, .17, .2, S); window(('x', .69), .3, .74, .17, .2, S); window(('y', .69), 0, .74, .17, .2, S)
    pyramid(1.75, 1.75, .55, (0, 0, .98), S['roof'])
    box(1.78, 1.78, .04, (0, 0, .985), S['timber'])
    box(.16, .16, .5, (-.35, .3, 1.3), S['stone']); box(.2, .2, .05, (-.35, .3, 1.56), S['stone_d'])
    ivy(S, [(.62, -.55, .2, .18)], 3)


def b_ambar(S, cap):
    box(1.6, 1.4, .08, (0, 0, .04), S['stone_d'])
    box(1.5, 1.25, .66, (0, 0, .41), S['wood'])
    arch(S, ('x', .755), 0, .08, .45, .4, mat=S['wood_d'])
    prism(1.65, 1.5, .55, (0, 0, .74), S['thatch'], S['wood'])
    for i, (x, y) in enumerate(((.25, .8), (.5, .82), (.75, .55))):
        cyl(.12, .26, (x, y, .13), S['wood'], v=14); torus(.12, .012, (x, y, .2), S['iron']); torus(.12, .012, (x, y, .06), S['iron'])
    for (x, y) in ((-.3, .85), (-.55, .78), (-.42, .95)):
        ball(.13, (x, y, .13), S['straw'], sc=(1, 1, 1.2))


def b_tarla(S, cap):
    box(1.9, 1.9, .05, (0, 0, .025), S['soil'])
    for k in range(7):
        y = -.78 + k * .26
        box(1.72, .1, .2, (0, y, .15), S['straw'])
        for j in range(9):
            ball(.05, (-.8 + j * .2, y, .27), S['straw'], sc=(1, .7, 1.4), seg=8)
    for (x, y) in ((.95, .95), (.95, -.95), (-.95, .95), (-.95, -.95), (0, .95), (.95, 0)):
        cyl(.03, .3, (x, y, .15), S['wood_d'], v=6)
    box(1.9, .03, .03, (0, .95, .22), S['wood']); box(.03, 1.9, .03, (.95, 0, .22), S['wood'])


def b_kisla(S, cap):
    box(2.8, 2.8, .08, (0, 0, .04), S['stone_d'])
    box(2.3, 1.8, .8, (0, -.15, .48), S['stone'])
    timber_wall(S, -1.2, -1.1, 1.2, .8, .88, 1.38)
    band(-1.15, -1.05, 1.15, .75, .86, S['team'], .08)
    for u in (-.75, -.25, .25, .75):
        window(('y', .76), u, .5, .14, .2, S); window(('y', .81), u, 1.13, .16, .22, S)
    arch(S, ('x', 1.155), -.15, .08, .55, .55, mat=S['timber'])
    for u in (-.75, .45):
        window(('x', 1.21), u, 1.13, .16, .22, S)
    pyramid(2.75, 2.25, .85, (0, -.15, 1.38), S['roof_d'], ridge=1.0)
    dormer(.4, .62, 1.5, 'y', S); dormer(-.5, .62, 1.5, 'y', S); dormer(1.05, -.15, 1.5, 'x', S)
    box(.2, .2, .6, (-.7, -.6, 2.0), S['stone'])
    for k in range(6):
        cyl(.015, 1.25, (-1.0 + k * .16, 1.15, .6), S['wood'], rot=(.22, 0, 0), v=6); cyl(.03, .14, (-1.0 + k * .16, 1.29, 1.22), S['iron'], r2=0, rot=(.22, 0, 0), v=6)
    box(1.1, .06, .05, (-.6, 1.05, .9), S['timber'])
    ivy(S, [(1.16, -.9, .3, .25), (-1.1, .78, .25, .2)], 5)
    flag(S, 1.2, 1.2, .08, 1.9); flag(S, -1.25, -1.25, .08, 1.9)


def b_ahir(S, cap):
    box(2.8, 2.8, .06, (0, 0, .03), S['soil'])
    box(2.4, 1.7, .8, (0, -.25, .46), S['wood'])
    box(.06, 1.3, .62, (1.205, -.25, .4), S['dark'])
    prism(2.6, 1.95, .75, (0, -.25, .86), S['thatch'], S['wood'])
    for (x, y) in ((.5, .95), (.85, .9), (.7, 1.15)):
        box(.38, .26, .24, (x, y, .14), S['straw'], rot=(0, 0, .3))
    for x in (-1.2, -.6, 0, .6, 1.2):
        cyl(.03, .45, (x, 1.3, .22), S['wood_d'], v=6)
    box(2.4, .03, .04, (0, 1.3, .38), S['wood']); box(2.4, .03, .04, (0, 1.3, .2), S['wood'])
    flag(S, -1.25, 1.25, .06, 1.5)


def b_ocak(S, cap):
    box(2.8, 2.8, .1, (0, 0, .05), S['stone_d'])
    box(2.2, 2.2, .95, (0, 0, .575), S['plaster'])
    box(2.3, 2.3, .08, (0, 0, 1.08), S['stone'])
    for u in (-.6, .6):
        arch(S, ('x', 1.105), u, .45, .2, .3); arch(S, ('y', 1.105), u, .45, .2, .3)
    arch(S, ('x', 1.11), 0, .1, .44, .55, mat=S['wood_d'])
    pyramid(2.45, 2.45, .95, (0, 0, 1.12), S['red'])
    for k in range(4):
        box(2.46 - k * .5, .02, .02, (0, 0, 1.2 + k * .22), S['white'])
    cyl(.3, .06, (1.45, .55, .03), S['dark'], v=20)
    ball(.28, (1.45, .55, .32), S['iron'], sc=(1, 1, .75), seg=24); torus(.28, .03, (1.45, .55, .5), S['iron'])
    flag(S, 1.25, -1.2, .1, 1.8); flag(S, -1.2, 1.25, .1, 1.8)


def b_dokum(S, cap):
    box(2.8, 2.8, .1, (0, 0, .05), S['stone_d'])
    box(2.3, 2.1, .95, (0, -.1, .575), S['stone_d'])
    prism(2.45, 2.3, .6, (0, -.1, 1.05), S['roof_d'], S['stone_d'])
    box(.06, .6, .4, (1.16, -.2, .4), S['glow']); box(.08, .7, .06, (1.17, -.2, .62), S['stone'])
    arch(S, ('y', .955), -.4, .1, .5, .55, mat=S['wood_d'])
    cyl(.24, 2.4, (-.75, -.75, 1.2), S['stone'], v=16); cyl(.28, .1, (-.75, -.75, 2.4), S['stone_d'], v=16)
    cyl(.13, 1.3, (.7, 1.05, .16), S['bronze'], rot=(0, PI / 2, 0), r2=.1, v=20)
    box(.22, .14, .22, (-.2, 1.1, .11), S['iron'])
    flag(S, 1.2, 1.25, .1, 1.5)


def b_kule(S, cap):
    box(1.4, 1.4, .1, (0, 0, .05), S['stone_d'])
    cyl(.55, 2.0, (0, 0, 1.1), S['stone'], v=12, smooth=False)
    cyl(.66, .1, (0, 0, 2.1), S['stone_d'], v=12, smooth=False)
    cyl(.64, .45, (0, 0, 2.38), S['timber'], v=12, smooth=False)        # ahşap seğirdim
    for k in range(12):
        a = k / 12 * 2 * PI; box(.05, .1, .45, (math.cos(a) * .66, math.sin(a) * .66, 2.38), S['wood'], rot=(0, 0, a))
    cyl(.8, 1.0, (0, 0, 3.08), S['roof'], r2=0, v=12, smooth=False)
    torus(.56, .035, (0, 0, 1.5), S['team'])
    for a in (.4, 1.2):
        box(.04, .07, .28, (math.cos(a) * .56, math.sin(a) * .56, 1.3), S['dark'], rot=(0, 0, a))
    arch(S, ('x', .56), 0, .1, .26, .38, mat=S['timber'])
    ivy(S, [(.45, -.35, .4, .22)], 9)
    flag(S, 0, 0, 3.55, .6, .8)


def b_burc(S, cap):
    cyl(.82, .2, (0, 0, .1), S['stone_d'], v=28)
    cyl(.75, 2.0, (0, 0, 1.1), S['stone'], v=28)
    cyl(.82, .12, (0, 0, 2.1), S['stone_d'], v=28)
    ring_merlons(0, 0, .74, 2.16, S['stone'], 12)
    for a in (.3, 1.0, 1.5):
        box(.04, .06, .28, (math.cos(a) * .76, math.sin(a) * .76, 1.35), S['dark'], rot=(0, 0, a))
    flag(S, 0, 0, 2.16, 1.0)


def b_sur(S, cap):
    box(1.0, 1.0, 1.1, (0, 0, .55), S['stone'])
    box(1.02, 1.02, .08, (0, 0, 1.12), S['stone_d'])
    merlons(0, 0, .42, 1.16, S['stone'], 2)


def b_kapi(S, cap):
    box(1.0, 1.0, 1.25, (0, 0, .625), S['stone'])
    box(1.04, 1.04, .08, (0, 0, 1.27), S['stone_d'])
    for f in ('x', 'y'):
        arch(S, (f, .505), 0, 0, .5, .62, mat=S['dark'])
    box(.03, .44, .58, (.52, 0, .29), S['wood_d']); box(.44, .03, .58, (0, .52, .29), S['wood_d'])
    for k in (-.12, .12):
        box(.035, .03, .58, (.535, k, .29), S['iron']); box(.03, .035, .58, (k, .535, .29), S['iron'])
    merlons(0, 0, .42, 1.31, S['stone'], 2)


def b_kale(S, cap):
    box(3.95, 3.95, .1, (0, 0, .05), S['stone_d'])
    h = 1.5
    for (x, y, w, d) in ((0, 1.6, 3.0, .45), (0, -1.6, 3.0, .45), (1.6, 0, .45, 3.0), (-1.6, 0, .45, 3.0)):
        box(w, d, h, (x, y, h / 2), S['stone'])
    for k in range(9):
        t = -1.4 + k * .35
        for (x, y) in ((1.8, t), (t, 1.8)):
            box(.17, .17, .2, (x, y, h + .1), S['stone'])
    band(-1.82, -1.82, 1.82, 1.82, 1.2, S['team'], .08)
    arch(S, ('x', 1.83), 0, .05, .65, .8, mat=S['timber']); box(.06, .9, .1, (1.86, 0, .95), S['stone_d'])
    # iç kale: taş gövde + ahşap üst kat + dik kiremit çatı ve çatı pencereleri
    box(1.7, 1.7, 1.9, (0, 0, .95), S['stone'])
    timber_wall(S, -.9, -.9, .9, .9, 1.9, 2.55)
    band(-.9, -.9, .9, .9, 1.92, S['team'], .07)
    for u in (-.45, .2):
        window(('x', .91), u, 2.25, .16, .24, S); window(('y', .91), u, 2.25, .16, .24, S)
        window(('x', .86), u, 1.35, .12, .26, S); window(('y', .86), u, 1.35, .12, .26, S)
    pyramid(2.05, 2.05, 1.25, (0, 0, 2.55), S['roof'])
    dormer(.55, 0, 2.7, 'x', S, .3); dormer(0, .55, 2.7, 'y', S, .3)
    for (x, y) in ((1.6, 1.6), (1.6, -1.6), (-1.6, 1.6), (-1.6, -1.6)):
        cyl(.55, 2.1, (x, y, 1.05), S['stone'], v=20); cyl(.62, .12, (x, y, 2.1), S['stone_d'], v=20)
        cyl(.6, .3, (x, y, 2.31), S['timber'], v=12)
        cyl(.72, 1.1, (x, y, 3.0), S['roof'], r2=0, v=20)
        band(x - .55, y - .55, x + .55, y + .55, 1.7, S['team'], .06) if False else None
    ivy(S, [(1.82, -1.1, .4, .35), (-1.1, 1.82, .5, .3), (1.85, .9, .3, .25)], 7)
    flag(S, 0, 0, 3.75, 1.0, 1.3); flag(S, 1.6, 1.6, 3.5, .7)


def b_hisar(S, cap):
    box(3.9, 3.9, .1, (0, 0, .05), S['stone_d'])
    T = ((-1.0, -1.0, .85, 2.7), (1.15, -.9, .7, 2.3), (-.9, 1.15, .7, 2.3))
    for i in range(3):
        a, b = T[i], T[(i + 1) % 3]
        mx, my = (a[0] + b[0]) / 2, (a[1] + b[1]) / 2; L = math.hypot(b[0] - a[0], b[1] - a[1]); ang = math.atan2(b[1] - a[1], b[0] - a[0])
        box(L, .4, 1.4, (mx, my, .7), S['stone'], rot=(0, 0, ang))
    for (x, y, r, h) in T:
        cyl(r, h, (x, y, h / 2), S['stone'], v=24); cyl(r + .06, .1, (x, y, h), S['stone_d'], v=24); cyl(r + .1, .95, (x, y, h + .47), S['lead'], r2=0, v=24)
    box(.8, .8, .6, (.4, .4, .3), S['plaster']); dome(S, .4, .4, .6, .32, S['lead'], fin='crescent')
    minaret(S, .95, .95, 1.6)
    flag(S, -1.0, -1.0, 3.6, .9, 1.2)


def b_kamp(S, cap):
    box(2.9, 2.9, .03, (0, 0, .015), S['soil'])
    tent(S, 0, 0, 1.0, 1.2, .5)
    tent(S, 1.0, -1.05, .38, .55, .28); tent(S, -1.05, 1.0, .38, .55, .28)
    flag(S, 1.2, 1.2, 0, 1.7); flag(S, -1.25, -1.2, 0, 1.7)


def b_ayasofya(S, cap):
    box(4.8, 4.8, .12, (0, 0, .06), S['stone_d'])
    box(4.0, 3.6, 1.3, (0, 0, .77), S['stone_w'])
    box(4.1, 3.7, .08, (0, 0, 1.45), S['stone'])
    for u in (-1.3, -.45, .45, 1.3):
        arch(S, ('y', 1.805), u, .5, .28, .5); arch(S, ('x', 2.005), u * .85, .5, .28, .5)
    arch(S, ('x', 2.01), 0, .12, .6, .75, mat=S['wood_d'])
    box(3.0, 3.0, .4, (0, 0, 1.7), S['stone_w'])
    for (x, y) in ((1.95, 1.75), (1.95, -1.75), (-1.95, 1.75), (-1.95, -1.75)):
        box(.5, .5, 1.9, (x, y, .95), S['stone_w'])
    dome(S, 0, 0, 1.9, 1.35, S['lead'], hz=.62, fin='crescent' if cap else 'cross', drum=.3)
    for s in (1, -1):
        ball(.95, (s * 1.35, 0, 1.75), S['lead'], sc=(1, 1, .6), seg=32)
    if cap:
        for (x, y) in ((2.25, 2.25), (2.25, -2.25), (-2.25, 2.25), (-2.25, -2.25)):
            minaret(S, x, y, 3.6)
        flag(S, 2.0, 0, 1.45, 1.4, 1.3)


def b_cami(S, cap):
    box(2.9, 2.9, .12, (0, 0, .06), S['stone_d'])
    box(2.0, 2.0, 1.0, (-.2, -.2, .62), S['plaster'])
    box(2.1, 2.1, .08, (-.2, -.2, 1.16), S['stone'])
    for u in (-.75, .35):
        arch(S, ('x', .805), u, .4, .22, .38); arch(S, ('y', .805), u, .4, .22, .38)
    dome(S, -.2, -.2, 1.2, .82, S['lead'], drum=.28)
    for (x, y) in ((.62, .62), (-1.02, .62), (.62, -1.02)):
        cyl(.26, .1, (x, y, 1.25), S['plaster'], v=16); dome(S, x, y, 1.3, .24, S['lead'], fin=None)
    # son cemaat yeri (revak)
    box(.5, 2.0, .05, (1.1, -.2, .9), S['stone'])
    for y in (-1.0, -.45, .1, .6):
        cyl(.05, .78, (1.3, y, .5), S['stone'], v=10)
    for y in (-.75, -.2, .35):
        dome(S, 1.1, y, .93, .2, S['lead'], fin=None)
    minaret(S, -1.25, 1.2, 3.3)
    cyl(.32, .25, (.95, 1.0, .12), S['stone'], v=8); cyl(.36, .06, (.95, 1.0, .5), S['lead'], r2=.05, v=8)   # şadırvan
    for k in range(4):
        cyl(.03, .25, (.95 + math.cos(k * PI / 2) * .28, 1.0 + math.sin(k * PI / 2) * .28, .37), S['stone'], v=6)
    flag(S, 1.3, -1.3, .12, 1.4)


def b_medrese(S, cap):
    box(2.9, 2.9, .1, (0, 0, .05), S['stone_d'])
    box(2.6, 2.6, .04, (0, 0, .12), S['stone'])
    # U biçimli hücreler + kubbeler
    cells = [(-1.05, y) for y in (-1.05, -.35, .35, 1.05)] + [(x, -1.05) for x in (-.35, .35, 1.05)] + [(x, 1.05) for x in (-.35, .35)]
    for (x, y) in cells:
        box(.62, .62, .7, (x, y, .45), S['stone_w']); dome(S, x, y, .8, .22, S['lead'], fin=None)
    for (x, y) in ((-1.05, -.35), (-1.05, .35), (-.35, -1.05), (.35, -1.05)):
        pass
    # revaklar
    for y in (-.5, 0, .5):
        cyl(.04, .6, (-.62, y, .42), S['stone'], v=8)
    for x in (-.1, .45):
        cyl(.04, .6, (x, -.62, .42), S['stone'], v=8)
    # dershane (büyük kubbe) ön köşede
    box(.9, .9, 1.0, (.95, .95, .6), S['stone_w']); dome(S, .95, .95, 1.1, .4, S['lead'])
    arch(S, ('x', 1.405), .95, .12, .3, .45, mat=S['wood_d'])
    # avluda ağaç ve havuz
    cyl(.22, .08, (.2, .2, .16), S['stone'], v=12); cyl(.18, .02, (.2, .2, .2), M('water', (.15, .35, .45), .1), v=12)
    cyl(.04, .5, (-.35, .35, .4), S['bark'], v=8); blob(.25, (-.35, .35, .78), S['leaf2'], sub=2, disp=.4, seed=77, tex_scale=3)
    flag(S, -1.3, 1.3, .1, 1.5)


def n_decor(S, v):
    rnd = random.Random(v * 41 + 9)
    k = v % 6
    if k == 0:
        for i in range(3):
            blob(.12 + rnd.random() * .08, (rnd.random() * .3 - .15, rnd.random() * .3 - .15, .05), S['rock'], sc=(1, 1, .7), sub=2, disp=.5, seed=v * 9 + i, tex_scale=2)
    elif k == 1:
        cyl(.12, .14, (0, 0, .07), S['bark'], v=12); cyl(.11, .01, (0, 0, .145), S['swood' if False else 'wood'], v=12)
    elif k == 2:
        for i in range(14):
            a = rnd.random() * 2 * PI; r = rnd.random() * .3
            cyl(.006, .12, (math.cos(a) * r, math.sin(a) * r, .06), S['leaf2'], v=4)
            ball(.025, (math.cos(a) * r, math.sin(a) * r, .13), [S['red'], S['white'], S['straw']][i % 3], seg=8)
    elif k == 3:
        blob(.2, (0, 0, .12), S['leaf'], sc=(1, 1, .7), sub=2, disp=.5, seed=v, tex_scale=4)
    elif k == 4:
        for i in range(18):
            a = rnd.random() * 2 * PI; r = rnd.random() * .3
            cyl(.012, .22, (math.cos(a) * r, math.sin(a) * r, .1), S['leaf2'], r2=0, v=4, rot=(rnd.random() * .5 - .25, rnd.random() * .5 - .25, 0))
    else:
        blob(.3, (0, 0, .1), S['rock'], sc=(1.3, 1, .6), sub=2, disp=.4, seed=v * 3, tex_scale=2)


def b_pazar(S, cap):
    box(2.9, 2.9, .08, (0, 0, .04), S['stone_d'])
    # bedesten (kubbeli kapalı çarşı) arkada
    box(1.3, 1.3, .8, (-.6, -.6, .48), S['stone_w']); dome(S, -.6, -.6, .88, .45, S['lead'], fin=None)
    arch(S, ('x', .055), -.6, .08, .3, .4, mat=S['wood_d']); arch(S, ('y', .055), -.6, .08, .3, .4, mat=S['wood_d'])
    # tenteli dükkânlar
    for (x, y, r) in ((.75, -.75, 0), (.75, .35, 0), (-.45, .8, PI / 2)):
        for (dx, dy) in ((-.35, -.3), (.35, -.3), (-.35, .3), (.35, .3)):
            cyl(.03, .62, (x + dx, y + dy, .31), S['wood_d'], v=6)
        bpy.ops.mesh.primitive_plane_add(size=1); o = bpy.context.object; o.scale = (.85, .75, 1); o.location = (x, y, .66); o.rotation_euler = (0, .12, r)
        o.data.materials.append(S['team']); o.data.materials.append(S['white'])
        bpy.ops.object.mode_set(mode='EDIT'); bpy.ops.mesh.subdivide(number_cuts=5); bpy.ops.object.mode_set(mode='OBJECT')
        for i, p in enumerate(o.data.polygons):
            p.material_index = int((p.center.x + .5) * 6) % 2
        box(.75, .45, .25, (x, y, .13), S['wood'])
        for k in range(3):
            ball(.07, (x - .2 + k * .2, y, .3), [S['red'], S['straw'], S['leaf2']][k], sc=(1, 1, .7), seg=10)
    for (x, y) in ((.1, -.1), (.25, .05), (-.05, .1)):
        ball(.13, (x, y, .13), S['straw'], sc=(1, 1, 1.2))
    for (x, y) in ((1.2, 1.1), (1.0, 1.25)):
        box(.22, .22, .22, (x, y, .11), S['wood'], rot=(0, 0, .3))
    flag(S, 1.3, -1.3, .08, 1.5)


def b_demirhane(S, cap):
    box(2.8, 2.8, .1, (0, 0, .05), S['stone_d'])
    box(2.2, 1.8, .85, (-.1, -.2, .52), S['stone'])
    timber_wall(S, -1.2, -1.1, 1.0, .7, .95, 1.4)
    band(-1.15, -1.05, .95, .65, .9, S['team'], .07)
    pyramid(2.45, 2.15, .75, (-.1, -.2, 1.4), S['roof_d'], ridge=.9)
    cyl(.26, 2.6, (-.85, -.9, 1.3), S['stone_d'], v=12); cyl(.3, .12, (-.85, -.9, 2.6), S['stone'], v=12)
    box(.08, .7, .45, (1.0, -.2, .35), S['glow']); arch(S, ('y', .71), -.4, .1, .45, .5, mat=S['wood_d'])
    window(('y', .76), .3, .5, .14, .2, S)
    # açık hava ocağı, örs ve silah sergisi
    box(.5, .5, .35, (.85, .9, .18), S['stone_d']); box(.36, .36, .04, (.85, .9, .37), S['glow'])
    box(.3, .12, .12, (.25, 1.05, .2), S['iron']); box(.12, .1, .14, (.25, 1.05, .07), S['iron']); cyl(.06, .14, (.42, 1.05, .2), S['iron'], rot=(0, PI / 2, 0), r2=0)
    for k in range(5):
        cyl(.012, 1.0, (-1.05 + k * .14, 1.2, .55), S['wood'], rot=(.2, 0, 0), v=6); box(.06, .02, .2, (-1.05 + k * .14, 1.3, 1.05), S['iron'], rot=(.2, 0, 0))
    box(.8, .05, .05, (-.77, 1.12, .8), S['timber'])
    cyl(.14, .5, (-.2, 1.15, .25), S['iron'], v=12); ball(.12, (-.2, 1.15, .6), S['iron'], sc=(1, 1, .9))   # zırh sehpası
    for x in (1.1, 1.25):
        cyl(.13, .26, (x, -1.15, .13), S['wood_d'], v=12)
    flag(S, 1.2, -1.25, .08, 1.7)


def b_tersane(S, cap):
    box(2.9, 2.9, .06, (0, 0, .03), S['wood'])
    for y in (-1.2, -.6, 0, .6, 1.2):
        box(2.9, .05, .07, (0, y, .07), S['wood_d'])
    # kızak üstünde yapımı süren gemi
    loft([(-1.0, .04, .04, .18), (-.8, .16, .26, .2), (0, .2, .36, .2), (.8, .16, .24, .22), (1.05, .05, .04, .3)], S['wood'], axis='x', loc=(0, .3, 0))
    for x in (-.6, -.35, -.1, .15, .4, .65):
        for sy in (1, -1):
            box(.04, .04, .42, (x, .3 + sy * .33, .52), S['wood_d'], rot=(sy * -.35, 0, 0))
    box(1.9, .06, .05, (0, .3, .22), S['wood_d'])
    cyl(.025, .5, (1.05, .3, .5), S['wood_d'], rot=(0, -.6, 0), v=6)
    for x in (-.9, -.3, .3, .9):
        for yy in (-.25, .85):
            cyl(.03, 1.2, (x, yy, .6), S['wood_d'], v=6)
    box(2.0, .04, .04, (0, -.25, 1.2), S['wood_d']); box(2.0, .04, .04, (0, .85, 1.2), S['wood_d'])
    # depo ve kalafat ocağı
    box(1.0, .8, .7, (-.85, -1.0, .4), S['stone']); prism(1.15, 1.0, .45, (-.85, -1.0, .75), S['roof'], S['stone'])
    box(.36, .36, .2, (.9, -1.05, .1), S['stone_d']); cyl(.2, .2, (.9, -1.05, .3), S['iron'], v=14); box(.3, .3, .03, (.9, -1.05, .41), S['dark'])
    for (x, y) in ((.3, -1.1), (.55, -1.2), (.4, -.9)):
        cyl(.1, .22, (x, y, .11), S['wood_d'], v=10)
    for k in range(4):
        box(1.0, .1, .08, (.2 + (k % 2) * .1, -1.35 + k * .04, .1 + k * .08), S['wood'])
    cyl(.02, 2.1, (1.3, 1.3, 1.05), S['wood_d'], v=6); box(.6, .04, .04, (1.0, 1.3, 1.9), S['wood_d']); cyl(.006, .9, (.75, 1.3, 1.45), S['dark'], v=4)
    flag(S, -1.3, 1.3, .08, 1.8)


BUILD = dict(saray=(b_saray, 3, 3.9), demirhane=(b_demirhane, 3, 2.7), tersane=(b_tersane, 3, 2.2), ev=(b_ev, 2, 1.6), ambar=(b_ambar, 2, 1.4), tarla=(b_tarla, 2, .4), kisla=(b_kisla, 3, 2.0),
             ahir=(b_ahir, 3, 1.8), ocak=(b_ocak, 3, 2.3), dokum=(b_dokum, 3, 2.6), kule=(b_kule, 2, 3.4), burc=(b_burc, 2, 3.3),
             sur=(b_sur, 1, 1.4), kapi=(b_kapi, 1, 1.5), kale=(b_kale, 4, 4.0), hisar=(b_hisar, 4, 3.9), kamp=(b_kamp, 3, 2.3),
             ayasofya=(b_ayasofya, 5, 3.0), ayasofya_cap=(lambda S, c: b_ayasofya(S, True), 5, 4.6), cami=(b_cami, 3, 4.0), medrese=(b_medrese, 3, 2.0), pazar=(b_pazar, 3, 2.0))


# ------------------------------------------------------------ doğa
def n_tree(S, v):
    rnd = random.Random(v * 13 + 7)
    kind = ['oak', 'oak', 'pine', 'oak', 'pine', 'cypress'][v % 6]
    if kind == 'oak':
        cyl(.09, 1.0, (0, 0, .5), S['bark'], r2=.06, v=10)
        for k in range(6):
            a = rnd.random() * 2 * PI; r = .25 + rnd.random() * .2
            blob(.42 + rnd.random() * .15, (math.cos(a) * r, math.sin(a) * r, 1.05 + rnd.random() * .45), S['leaf'] if k % 2 else S['leaf2'], sub=3, disp=.45, seed=v * 10 + k, tex_scale=3)
        blob(.45, (0, 0, 1.65), S['leaf2'], sub=3, disp=.45, seed=v * 10 + 9, tex_scale=3)
    elif kind == 'pine':
        cyl(.07, .6, (0, 0, .3), S['bark'], v=8)
        for k in range(4):
            cyl(.62 - k * .13, .7, (0, 0, .55 + k * .42), S['pine'], r2=0.02, v=14)
    else:
        cyl(.06, .3, (0, 0, .15), S['bark'], v=8)
        blob(.3, (0, 0, 1.2), S['pine'], sc=(1, 1, 3.2), sub=3, disp=.3, seed=v, tex_scale=3)


def n_mine(S, v):
    rnd = random.Random(v * 7 + 1)
    for k in range(5):
        a = rnd.random() * 2 * PI; r = rnd.random() * .45
        blob(.32 + rnd.random() * .15, (math.cos(a) * r, math.sin(a) * r, .1), S['rock'], sc=(1, 1, .8), sub=2, disp=.5, seed=v * 20 + k, tex_scale=2)
    for k in range(14):
        a = rnd.random() * 2 * PI; r = rnd.random() * .55
        blob(.09 + rnd.random() * .07, (math.cos(a) * r, math.sin(a) * r, .2 + rnd.random() * .3), S['gold'], sub=1, disp=.4, seed=v * 50 + k)


def n_berry(S, v):
    rnd = random.Random(v * 3 + 2)
    for k in range(4):
        a = k / 4 * 2 * PI
        blob(.25, (math.cos(a) * .2, math.sin(a) * .2, .22), S['leaf2'], sub=2, disp=.5, seed=v * 30 + k, tex_scale=4)
    for k in range(22):
        a = rnd.random() * 2 * PI; r = .1 + rnd.random() * .3
        ball(.045, (math.cos(a) * r, math.sin(a) * r, .15 + rnd.random() * .35), S['berry'], seg=8)


NATURE = {}
for i in range(6):
    NATURE['tree%d' % i] = ((lambda i: lambda S, c: n_tree(S, i))(i), 1, 2.3)
for i in range(6):
    NATURE['decor%d' % i] = ((lambda i: lambda S, c: n_decor(S, i))(i), 1, .5)
for i in range(3):
    NATURE['mine%d' % i] = ((lambda i: lambda S, c: n_mine(S, i))(i), 1, .9)
    NATURE['berry%d' % i] = ((lambda i: lambda S, c: n_berry(S, i))(i), 1, .7)


def render_static(name, outdir):
    fn, n, hgt = BUILD.get(name) or NATURE[name]
    reset(); S = mats()
    px = PX_PER_UNIT * SCALE
    margin = 70
    res_x = int(n * 64 * SCALE + margin * 2 + 60)
    ground_half = n * 16 * SCALE           # elmasın yarı yüksekliği (px)
    top = hgt * math.cos(math.radians(30)) * px + ground_half
    res_y = int(top + ground_half + margin + 30)
    anchor_y = top + 30                    # orijinin (taban merkezi) piksel konumu
    off = anchor_y - res_y / 2              # merkezden aşağı
    zt = -off / (math.cos(math.radians(30)) * px)
    setup_scene(res_x, res_y, SCALE, target=(0, 0, 0), samples=48)
    cam = bpy.context.scene.camera
    cam.data.shift_y = -off / res_x * -1 if False else 0
    # kamerayı dikey kaydırarak orijini anchor_y'ye getir
    cam.data.shift_y = (off) / res_x
    fn(S, False)
    os.makedirs(outdir, exist_ok=True)
    mask_mode(False); render_to(os.path.join(outdir, name + '.png'))
    mask_mode(True); render_to(os.path.join(outdir, name + '_m.png'))
    json.dump(dict(ax=res_x / 2, ay=anchor_y, scale=SCALE, n=n), open(os.path.join(outdir, name + '.json'), 'w'))


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('-')]
    out = args[0] if args else 'out/static'
    names = args[1:] or (list(BUILD) + list(NATURE))
    for nm in names:
        render_static(nm, out)
        print('DONE', nm, flush=True)
