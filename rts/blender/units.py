"""FATİH — Birim modelleri ve animasyon render'ı.
Kullanım: python3 units.py <çıktı_klasörü> [bakış ...]
Her bakış için 8 yön × (1 bekleme + 8 yürüme + 6 saldırı + 1 ölü) kare, ayrıca takım maskesi.
"""
import bpy, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *
from mathutils import Vector

PI = math.pi
WALK, ATK = 8, 6


def mats():
    T = True
    return dict(
        skin=MX('skin', (.84, .6, .44), 'skin'), eyew=MX('eyew', (.95, .93, .9), 'plain', rough=.3), lip=MX('lip', (.55, .22, .18), 'plain'),
        dark=MX('dark', (.07, .05, .04), 'plain'), mane=MX('mane', (.1, .07, .05), 'fur'), grayb=MX('grayb', (.78, .76, .72), 'fur'),
        team=MX('team', (.86, .86, .86), 'cloth', team=T), team_d=MX('team_d', (.58, .58, .58), 'cloth', team=T),
        team_pat=MX('team_pat', (.9, .9, .9), 'pattern', team=T, col2=(.66, .66, .66)),
        white=MX('white', (.94, .91, .84), 'cloth'), cream=MX('cream', (.86, .79, .64), 'cloth'), brown=MX('brown', (.42, .27, .14), 'cloth'),
        pants=MX('pants', (.34, .27, .2), 'cloth'), green=MX('green', (.24, .4, .2), 'cloth'), green2=MX('green2', (.1, .4, .24), 'cloth'),
        blue=MX('blue', (.12, .25, .52), 'cloth'), red=MX('red', (.62, .08, .06), 'cloth'), yellow=MX('yellow', (.85, .62, .15), 'cloth'),
        kaftan=MX('kaftan', (.58, .05, .05), 'brocade', col2=(.95, .7, .25)),        # Fatih: altın işlemeli al kaftan
        kaftan2=MX('kaftan2', (.1, .3, .2), 'brocade', col2=(.85, .68, .3)),
        goldc=MX('goldc', (1, .72, .28), 'cloth', metal=.6, rough=.35), straw=MX('straw', (.85, .72, .38), 'cloth', scale=2),
        mail=MX('mail', (.62, .64, .68), 'mail'), scale=MX('scale', (.66, .66, .68), 'scale'), lamel=MX('lamel', (.7, .7, .72), 'mail', scale=.7), steel=MX('steel', (.78, .8, .84), 'plate'),
        iron=MX('iron', (.28, .28, .3), 'plate', rough=.42), gold=MX('gold', (1, .74, .3), 'plate', rough=.26), bronze=MX('bronze', (.76, .46, .2), 'plate', rough=.32),
        leather=MX('leather', (.36, .21, .1), 'leather'), wood=MX('wood', (.46, .28, .14), 'wood'), fur=MX('fur', (.36, .24, .14), 'fur'), ermine=MX('ermine', (.95, .93, .88), 'fur'),
        ruby=MX('ruby', (.75, .03, .06), 'plain', rough=.08), emerald=MX('emerald', (.03, .55, .25), 'plain', rough=.08),
        horse=MX('horse', (.48, .26, .12), 'coat'), horse_w=MX('horse_w', (.93, .91, .87), 'coat'), horse_g=MX('horse_g', (.6, .6, .58), 'coat'), horse_b=MX('horse_b', (.13, .085, .06), 'coat'),
        hullw=MX('hullw', (.3, .19, .1), 'wood', scale=.5), deck=MX('deck', (.62, .45, .28), 'wood', scale=.4),
        sail=MX('sail', (.92, .9, .86), 'cloth', team=T, scale=.6), netm=MX('netm', (.75, .7, .55), 'mail', metal=.01, rough=.8, scale=.4),
        flash=M('flash', (1, .8, .3), .5, emit=(1, .7, .2)),
    )


# ------------------------------------------------------------ insan
def cape(parent, S, outer, lining, top=(-.06, 0, .02), L=.62, r0=.17, r1=.3, a0=1.75, a1=4.53):
    """Omuzdan sarkan pelerin (arka yarım silindir, astarlı)."""
    n, rows, vs, fs = 10, 6, [], []
    for j in range(rows + 1):
        t = j / rows; r = r0 + (r1 - r0) * t; z = -L * t
        for i in range(n + 1):
            a = a0 + (a1 - a0) * i / n; w = .02 * math.sin(i * 2.2 + j) * t
            vs.append((top[0] + (r + w) * math.cos(a) * .8, top[1] + (r + w) * math.sin(a), top[2] + z))
    for j in range(rows):
        for i in range(n):
            k = j * (n + 1) + i; fs.append((k, k + 1, k + n + 2, k + n + 1))
    o = mesh(vs, fs, outer, parent, smooth=True); md = o.modifiers.new('s', 'SOLIDIFY'); md.thickness = .018; md.material_offset = 1
    o.data.materials.append(lining)
    return o


def human(root, S, X, seated_z=None):
    """Ayrıntılı insan. X: kıyafet sözlüğü. Eklem adları animasyonla uyumlu."""
    J = {}
    pz = seated_z if seated_z else .62
    pel = joint('pel', (0, 0, pz), root); J['pel'] = pel
    pants, boots = X.get('pants', S['pants']), X.get('boots', S['leather'])
    for s, n in ((1, 'L'), (-1, 'R')):
        hip = joint('hip' + n, (0, s * .088, 0), pel); J['hip' + n] = hip
        knee = joint('knee' + n, (0, 0, -.29), hip); J['knee' + n] = knee
        if seated_z:   # binici: uyluk öne-yana, diz bükük, ayak üzengide
            hip.rotation_euler = (s * .5, -1.15, 0); knee.rotation_euler = (0, 1.45, 0)
        loft([(.02, .08, .08), (-.12, .074, .07), (-.25, .056, .054), (-.31, .05, .049)], pants, hip, v=14)
        loft([(.03, .05, .049), (-.02, .052, .05), (-.11, .056, .051), (-.22, .037, .036), (-.27, .032, .032)], pants, knee, v=14)
        if X.get('greaves'):
            loft([(.04, .062, .06), (-.02, .066, .062), (-.13, .062, .058), (-.24, .046, .046)], X['greaves'], knee, v=14)
            ball(.062, (.035, 0, .0), X['greaves'], knee, sc=(1, 1, 1.1))
        loft([(-.05, .056, .055), (-.065, .063, .061), (-.21, .047, .045), (-.295, .047, .046)], boots, knee, v=14)
        loft([(-.05, .037, .046, 0), (.05, .034, .046, -.005), (.12, .021, .029, -.015), (.165, .005, .009, -.004)], boots, knee, loc=(0, 0, -.275), axis='x', v=12)
    L = X.get('skirt_len', .22 if seated_z else .42)
    if X.get('skirt'):
        if seated_z:   # at üstünde: etek yanlara açılır
            for s in (1, -1):
                loft([(.1, .1, .12, 0, 0, 0), (0, .13, .14, 0, 0, .03), (-L, .2, .16, -.04, 0, .08)], X['skirt'], pel, loc=(0, s * .1, 0), rot=(s * -.55, -.4, 0), nf=7)
        else:
            loft([(.1, .1, .14, 0, 0, 0), (0, .12, .155, 0, 0, .03), (-L * .5, .16, .19, 0, 0, .06), (-L, .2, .23, -.01, 0, .09)], X['skirt'], pel, nf=11, cap=(False, True))
        if X.get('trim'):
            if not seated_z:
                loft([(-L + .01, .205, .235, -.01, 0, .09), (-L - .015, .208, .238, -.01, 0, .09)], X['trim'], pel, nf=11)
    torso = [(-.06, .1, .14), (.04, .095, .133), (.14, .088, .124), (.26, .106, .155), (.36, .112, .172), (.43, .09, .16), (.47, .05, .07)]
    loft(torso, X['tunic'], pel, v=16)
    if X.get('armor'):
        A = X['armor']
        loft([(t, a + .014, b + .014) for (t, a, b) in torso[1:6]], A, pel, v=16)
        if X.get('mailskirt'):
            loft([(.08, .108, .146, 0, 0, 0), (-.05, .12, .158, 0, 0, .02), (-.2, .15, .18, 0, 0, .04)], X['mailskirt'], pel, nf=9)
        if A is S['steel']:   # göğüs sırtı
            box(.02, .02, .26, (.118, 0, .26), A, pel, rot=(0, .12, 0))
    if X.get('vest'):
        loft([(.12, .1, .138), (.26, .118, .166), (.36, .123, .18), (.42, .1, .168)], X['vest'], pel, v=16, cap=(False, False))
    if X.get('surcoat'):   # armalı cüppe: göğüsten kalçaya
        loft([(.3, .126, .18, 0, 0, 0), (.12, .118, .158, 0, 0, .02), (-.02, .13, .17, 0, 0, .05), (-.16 if seated_z else -.3, .16, .2, 0, 0, .07)], X['surcoat'], pel, nf=8, cap=(False, True))
    sash = X.get('sash', S['brown'])
    loft([(.05, .104, .146), (.06, .11, .152), (.12, .106, .147), (.13, .1, .14)], sash, pel, v=16)
    box(.02, .045, .16, (.11, .05, -.01), sash, pel, rot=(0, .15, .1))
    if X.get('belt'):    # mücevherli kemer
        loft([(.04, .108, .15), (.065, .11, .153)], X['belt'], pel, v=16)
        ball(.024, (.112, 0, .05), S['ruby'], pel); ball(.016, (.105, .05, .05), S['emerald'], pel); ball(.016, (.105, -.05, .05), S['emerald'], pel)
    chest = joint('chest', (0, 0, .42), pel); J['chest'] = chest
    if X.get('collar'):
        torus(.075, .03, (0, 0, .04), X['collar'], chest)
    hd = joint('hd', (0, 0, .06 * (1 - .74)), chest); hd.scale = (.74, .74, .74); J['hd'] = hd
    sk = X.get('skin', S['skin'])
    loft([(-.02, .065, .065), (.08, .058, .058), (.12, .06, .06)], sk, hd, v=12)
    loft([(.03, .085, .08, .01), (.08, .1, .095, .012), (.15, .108, .1, .008), (.22, .1, .095, 0), (.27, .07, .066, -.005), (.29, .02, .02, -.01)], sk, hd, v=16)
    J['head'] = (0, 0, .15)
    ball(.026, (.112, 0, .145), sk, hd, sc=(1.3, .75, 1.35))   # burun
    for s in (1, -1):
        ball(.026, (0, s * .1, .15), sk, hd, sc=(.6, 1, 1.2))
        if X.get('eyes', True):
            ball(.02, (.092, s * .04, .17), S['eyew'], hd, seg=12); ball(.012, (.106, s * .04, .17), S['dark'], hd, seg=8)
            box(.016, .052, .014, (.1, s * .043, .198), X.get('beard', S['mane']), hd, rot=(s * -.2, 0, 0))
        if X.get('mustache', True):
            box(.024, .08, .02, (.111, s * .036, .118), X.get('beard', S['mane']), hd, rot=(s * .5, 0, 0))
    box(.012, .03, .008, (.112, 0, .103), S['lip'], hd)
    if X.get('beard'):
        loft([(.12, .07, .1, .03), (.06, .08, .085, .045), (.0, .05, .05, .07), (-.03, .015, .015, .075)], X['beard'], hd, v=12)
    for s, n in ((1, 'L'), (-1, 'R')):
        sh = joint('sh' + n, (0, s * .2, -.02), chest); J['sh' + n] = sh
        sl = X.get('sleeve', X['tunic'])
        loft([(.05, .045, .045), (0, .064, .062), (-.1, .056, .053), (-.2, .046, .045), (-.24, .047, .046), (-.36, .041, .04), (-.4, .034, .034)], sl, sh, v=12)
        if X.get('cuff'):
            loft([(-.3, .045, .044), (-.4, .052, .05)], X['cuff'], sh, v=12, cap=(False, False))
        if X.get('pauldron'):
            for k in range(3):
                loft([(.0, .085 - k * .004, .08 - k * .004, 0, s * .012), (.035, .07 - k * .006, .062 - k * .006, 0, s * .005), (.05, .02, .02)], X['pauldron'], sh, loc=(0, 0, .04 - k * .045), v=14)
        hand = joint('hand' + n, (0, 0, -.45), sh); J['hand' + n] = hand
        g = X.get('gloves', sk)
        ball(.042, (0, 0, 0), g, hand, sc=(1.1, .8, 1.2)); ball(.016, (.03, s * .02, .01), g, hand, sc=(1, 1, 1.6))
    hat = X.get('hat')
    if hat == 'turban':
        cyl(.075, .16, (0, 0, .3), X.get('hatc', S['red']), hd, r2=.05)
        for k, (R, z, tl) in enumerate(((.105, .21, .12), (.112, .25, -.1), (.1, .29, .08))):
            torus(R, .045, (0, 0, z), S['white'], hd, rot=(tl, -tl * .6, 0))
    elif hat == 'big_turban':   # Fatih'in büyük kavuğu: kırmızı külah, beyaz sarık, sorguç
        cyl(.09, .32, (0, 0, .36), S['red'], hd, r2=.06, v=20); ball(.065, (0, 0, .52), S['red'], hd, sc=(1, 1, .6))
        for k, (R, r, z, tl) in enumerate(((.13, .065, .2, .1), (.155, .07, .25, -.12), (.16, .068, .3, .15), (.14, .062, .36, -.08), (.11, .05, .41, .1))):
            torus(R, r, (0, 0, z), S['white'], hd, rot=(tl, tl * .7, k * .5))
        sg = joint('sorguc', (.15, 0, .36), hd)
        ball(.035, (0, 0, 0), S['gold'], sg, sc=(.6, 1, 1.2)); ball(.022, (.02, 0, 0), S['ruby'], sg)
        for k in range(4):   # balıkçıl tüyü
            cyl(.012, .26, (-.02 - k * .012, (k - 1.5) * .018, .14), S['white'] if k % 2 else S['dark'], sg, rot=(0, -.35 - k * .08, 0), r2=.002, v=6)
        cyl(.012, .05, (0, 0, .045), S['gold'], sg)
    elif hat == 'bork':   # yeniçeri börkü: yatırtma ve kaşıklık
        loft([(.18, .108, .108), (.3, .1, .096), (.45, .088, .082), (.57, .07, .07), (.6, .055, .055)], S['white'], hd, rot=(0, -.2, 0), v=16)
        loft([(.55, .055, .13, -.07), (.35, .03, .15, -.17), (.0, .02, .14, -.2)], S['white'], hd, v=12)
        torus(.112, .022, (0, 0, .2), S['gold'], hd)
        box(.03, .06, .15, (.11, 0, .27), S['gold'], hd, bevel=.008); ball(.022, (.125, 0, .28), S['ruby'], hd)
    elif hat == 'hood':   # külah / üsküf
        loft([(.16, .12, .12), (.26, .11, .11), (.38, .07, .07), (.48, .02, .02)], X.get('hatc', S['team']), hd, rot=(0, -.35, 0), v=14)
        torus(.118, .025, (0, 0, .17), S['fur'], hd)
    elif hat == 'straw':
        loft([(.2, .26, .26), (.22, .24, .24), (.27, .11, .11), (.34, .06, .06), (.35, .01, .01)], S['straw'], hd, v=20)
    elif hat == 'helm':   # Avrupa miğferi, siperlik, sorguç
        loft([(.05, .12, .12, -.01), (.2, .135, .13), (.3, .12, .115), (.37, .07, .065), (.39, .02, .02)], S['steel'], hd, v=16)
        box(.02, .17, .02, (.128, 0, .17), S['dark'], hd); box(.02, .02, .2, (.13, 0, .2), S['steel'], hd)
        loft([(.0, .13, .14), (.06, .12, .13)], S['steel'], hd, v=16)
        if X.get('plume'):
            for k in range(5):
                cyl(.03, .3, (-.04 - k * .03, 0, .44 + k * .01), X['plume'], hd, rot=(0, -.5 - k * .22, 0), r2=.008, v=8)
    elif hat == 'chichak':  # sipahi miğferi: sivri tepe, burunluk, zincir peçe
        loft([(.12, .125, .125), (.22, .128, .128), (.32, .1, .1), (.42, .05, .05), (.52, .008, .008)], S['steel'], hd, v=16)
        torus(.126, .016, (0, 0, .13), S['gold'], hd); torus(.112, .012, (0, 0, .26), S['gold'], hd)
        box(.015, .022, .17, (.13, 0, .1), S['steel'], hd)
        loft([(.14, .128, .13, -.01), (.02, .14, .145, -.03), (-.04, .13, .14, -.045)], S['mail'], hd, v=16, cap=(False, False))
        if X.get('plume'):
            cyl(.02, .2, (-.03, 0, .6), X['plume'], hd, rot=(0, -.5, 0), r2=.005, v=6)
    elif hat == 'kavuk':
        cyl(.11, .26, (0, 0, .32), S['white'], hd, r2=.1, v=20)
        for k in range(3):
            torus(.15 - k * .006, .055, (0, 0, .22 + k * .05), S['white'], hd, rot=(.08 * (-1) ** k, 0, 0))
        torus(.16, .02, (0, 0, .24), S['green2'], hd, rot=(.08, 0, 0))
    elif hat == 'kalpak':
        loft([(.16, .125, .125), (.3, .135, .135), (.38, .12, .12), (.4, .06, .06)], S['fur'], hd, v=16)
        ball(.1, (-.02, 0, .38), X.get('hatc', S['red']), hd, sc=(1, 1, .45))
    elif hat == 'kettle':
        ball(.12, (0, 0, .2), S['steel'], hd, sc=(1, 1, .8)); cyl(.2, .02, (0, 0, .19), S['steel'], hd)
    return J


def spear(hand, S, L=1.55, pennant=None):
    j = joint('wpn', (0, 0, 0), hand)
    cyl(.016, L, (.35, 0, 0), S['wood'], j, rot=(0, PI / 2, 0), v=8)
    tip = .35 + L / 2
    ball(.04, (tip + .1, 0, 0), S['steel'], j, sc=(2.6, .35, .7)); cyl(.02, .06, (tip, 0, 0), S['gold'], j, rot=(0, PI / 2, 0))
    if pennant:   # çatal uçlu flama
        mesh([(0, 0, 0), (.36, 0, -.02), (.26, 0, -.07), (.36, 0, -.14), (0, 0, -.13)], [(0, 1, 2, 4), (2, 3, 4)], pennant, j, loc=(tip - .42, 0, .0))
    return j


def shield(sh, S, side, r=.2, mat=None, kind='round'):
    j = joint('shield', (0, side * .07, -.26), sh)
    if kind == 'heater':   # Avrupa üçgen kalkan
        k = r / .2
        vs = [(x * k, 0, z * k) for (x, z) in [(.2, .2), (-.2, .2), (-.2, .02), (-.14, -.16), (0, -.27), (.14, -.16), (.2, .02)]]
        o = mesh(vs, [tuple(range(7))], mat or S['team'], j); md = o.modifiers.new('s', 'SOLIDIFY'); md.thickness = .03
        o2 = mesh([(x * 1.0, side * .016, z) for (x, _, z) in vs], [tuple(range(7))], S['gold'], j); md = o2.modifiers.new('w', 'WIREFRAME'); md.thickness = .02
        box(.05, .012, .3 * k, (0, side * .02, -.02 * k), S['gold'], j); box(.24 * k, .012, .05, (0, side * .02, .06 * k), S['gold'], j)
        return j
    # yuvarlak kalkan (kalkan): örgü desen, altın halkalar, çelik kabara
    cyl(r, .03, (0, 0, 0), mat or S['team_pat'], j, rot=(PI / 2, 0, 0), v=28)
    for k, rr in enumerate((r, r * .68, r * .36)):
        torus(rr, .014 if k else .02, (0, side * .016, 0), S['gold'], j, rot=(PI / 2, 0, 0))
    ball(.055, (0, side * .02, 0), S['steel'], j, sc=(1, .7, 1)); cyl(.012, .05, (0, side * .07, 0), S['gold'], j, rot=(PI / 2, 0, 0), r2=.0, v=6)
    return j


def bow(hand, S):
    j = joint('bow', (0, 0, 0), hand)
    pts = []
    for k in range(13):   # Türk yayı: çift kavisli
        t = k / 12 * 2 - 1; z = t * .42; x = .06 - .16 * (1 - t * t) + .07 * abs(t) ** 6
        pts.append((x, z))
    for (x0, z0), (x1, z1) in zip(pts, pts[1:]):
        Lg = math.hypot(x1 - x0, z1 - z0); ang = math.atan2(x1 - x0, z1 - z0)
        cyl(.016, Lg + .01, ((x0 + x1) / 2, 0, (z0 + z1) / 2), S['brown'] if abs(z0) > .08 else S['leather'], j, rot=(0, ang, 0), v=6)
    cyl(.003, .84, (pts[0][0], 0, 0), S['white'], j, v=4)
    return j


def sword(hand, S, curved=True, L=.6, jewel=False):
    j = joint('sword', (0, 0, 0), hand)
    loft([(.08, .02, .022), (-.04, .022, .024)], S['leather'] if not jewel else S['gold'], j, v=8)
    ball(.03, (0, 0, .1), S['gold'], j, sc=(1, .8, 1.3))
    box(.16, .03, .022, (0, 0, -.05), S['gold'], j)
    if jewel:
        ball(.016, (0, .02, -.05), S['ruby'], j); ball(.014, (0, 0, .12), S['emerald'], j)
    n = 6
    for k in range(n):    # kılıç: hafif eğri namlu
        t0, t1 = k / n, (k + 1) / n; a = .25 if curved else 0
        x0, z0 = math.sin(t0 * a) * L * t0 * .9, -.06 - L * t0; x1, z1 = math.sin(t1 * a) * L * t1 * .9, -.06 - L * t1
        box(.045 - .02 * t1, .01, math.hypot(x1 - x0, z1 - z0) + .005, ((x0 + x1) / 2, 0, (z0 + z1) / 2), S['steel'], j, rot=(0, math.atan2(x1 - x0, z0 - z1) * -1, 0))
    return j


def musket(hand, S):
    j = joint('musket', (0, 0, 0), hand)
    loft([(.3, .035, .03), (.16, .06, .028), (.0, .028, .024), (-.5, .02, .02)], S['wood'], j, v=10)
    cyl(.016, 1.05, (0, 0, -.42), S['iron'], j, v=10)
    for z in (-.1, -.35, -.6, -.85):
        torus(.022, .008, (0, 0, z), S['gold'], j)
    box(.03, .03, .06, (.03, 0, .02), S['iron'], j)
    return j


def tool(hand, S):
    j = joint('tool', (0, 0, 0), hand)
    cyl(.02, .75, (0, 0, -.22), S['wood'], j, v=8)
    loft([(-.04, .025, .035), (.16, .012, .06)], S['iron'], j, loc=(.02, 0, -.58), axis='x', v=8)
    return j


def quiver(chest, S):
    q = joint('q', (-.17, .06, .1), chest)
    loft([(-.22, .05, .045), (.18, .065, .055)], S['leather'], q, rot=(.3, -.25, 0), v=12)
    torus(.066, .012, (0, 0, .14), S['gold'], q, rot=(.3, -.25, 0))
    for k in range(4):
        cyl(.007, .24, (.015 * k - .02, .01 * k, .3), S['wood'], q, rot=(.3, -.25, 0), v=4)
        box(.004, .03, .05, (.015 * k - .02, .01 * k, .41), S['white'], q, rot=(.3, -.25, 0))
    return q


# ------------------------------------------------------------ at
def horse(root, S, coat, X):
    """Kaslı at gövdesi, eyer takımı; X: barding ('mail'), cloth, trim, chanfron, plume."""
    J = {}
    body = joint('hbody', (0, 0, .95), root); J['body'] = body
    loft([(-.66, .03, .03, .05), (-.62, .2, .14, .05), (-.52, .29, .21, .03), (-.34, .31, .22, 0), (-.08, .3, .21, -.03), (.14, .31, .21, -.02), (.3, .32, .2, .02), (.42, .29, .175, .07), (.5, .22, .14, .12), (.55, .1, .07, .17)], coat, body, axis='x', v=20)
    neck = joint('neck', (.38, 0, .14), body); J['neck'] = neck
    loft([(-.04, .22, .15), (.14, .18, .125), (.3, .14, .1), (.46, .115, .085)], coat, neck, rot=(0, .62, 0), v=16)
    hh = joint('hhead', (.29, 0, .4), neck); J['hhead'] = hh
    hr = joint('hrot', (0, 0, 0), hh, rot=(0, .62, 0))
    loft([(-.1, .11, .085, .0), (.0, .108, .08, -.005), (.12, .08, .062, -.03), (.24, .06, .05, -.055), (.31, .052, .046, -.065), (.34, .025, .025, -.07)], coat, hr, axis='x', v=16)
    for s in (1, -1):
        ball(.045, (-.07, s * .055, .14), coat, hr, sc=(.55, .4, 1.35), rot=(s * -.3, -.25, 0))   # kulaklar
        ball(.02, (.03, s * .074, .03), S['dark'], hr, sc=(1.2, .7, 1))                         # gözler
        ball(.013, (.31, s * .03, -.07), S['dark'], hr)                                          # burun delikleri
    torus(.062, .009, (.2, 0, -.035), S['leather'], hr, rot=(0, PI / 2, 0)); torus(.1, .009, (-.04, 0, .0), S['leather'], hr, rot=(0, PI / 2, 0))
    box(.3, .012, .012, (.08, .085, -.02), S['leather'], hr); box(.3, .012, .012, (.08, -.085, -.02), S['leather'], hr)
    if X.get('chanfron'):
        loft([(-.05, .1, .095, .025), (.1, .08, .072, -.005), (.24, .058, .055, -.04)], X['chanfron'], hr, axis='x', v=14, cap=(False, True))
        cyl(.02, .1, (-.02, 0, .14), S['steel'], hr, r2=.003, v=6)
    if X.get('plume'):    # at sorgucu
        ball(.025, (-.06, 0, .12), S['gold'], hr); cyl(.022, .24, (-.12, 0, .24), X['plume'], hr, rot=(0, -.55, 0), r2=.004, v=6)
    if X.get('crinet'):   # boyun zırhı (lamlar)
        for k in range(5):
            loft([(.0, .2 - k * .02, .14 - k * .01, .03), (.1, .19 - k * .02, .135 - k * .01, .03)], X['crinet'], neck, loc=(0, 0, .04 + k * .08), rot=(0, .62, 0), v=16, cap=(False, False))
    for k in range(9):    # yele
        t = k / 8
        box(.06, .035, .13, (-.16 + t * .05, (k % 2 - .5) * .025, .04 + t * .42), S['mane'], neck, rot=(0, -.25 + .25 * (k % 3) * .3, (k % 2 - .5) * .3))
    box(.06, .05, .1, (-.08, 0, .12), S['mane'], hr, rot=(0, .9, 0))
    tail = joint('tail', (-.62, 0, .08), body)
    loft([(0, .05, .05), (-.12, .085, .065), (-.35, .08, .06), (-.55, .04, .035), (-.62, .01, .01)], S['mane'], tail, rot=(0, -.45, 0), v=10)
    for (x, y, n, back) in ((.36, .13, 'FL', 0), (.36, -.13, 'FR', 0), (-.42, .13, 'BL', 1), (-.42, -.13, 'BR', 1)):
        lg = joint('leg' + n, (x, y, -.1), body); J['leg' + n] = lg
        if back:
            loft([(.12, .19, .11, -.03), (-.06, .17, .1, -.03), (-.2, .1, .068, -.02), (-.31, .072, .052, -.035), (-.37, .066, .05, -.03), (-.58, .05, .044, -.01), (-.64, .06, .05), (-.7, .052, .048, .01)], coat, lg, v=12)
        else:
            loft([(.12, .17, .11), (-.06, .14, .095), (-.22, .085, .066), (-.31, .07, .058), (-.37, .058, .05), (-.58, .048, .044), (-.64, .06, .05), (-.7, .052, .048, .01)], coat, lg, v=12)
        loft([(-.7, .056, .052, .012), (-.8, .072, .066, .018), (-.81, .07, .064, .018)], S['dark'], lg, v=12)
    # eyer takımı
    cl = X.get('cloth', S['team'])
    ser = joint('saddle', (-.02, 0, .3), body)
    loft([(-.17, .08, .16, .03), (-.1, .045, .18), (.1, .045, .18), (.17, .1, .13, .05)], S['leather'], ser, axis='x', v=12)
    box(.04, .16, .12, (.15, 0, .07), S['leather'], ser, bevel=.02); box(.04, .2, .12, (-.16, 0, .06), S['leather'], ser, bevel=.02)
    for s in (1, -1):
        cyl(.004, .4, (0, s * .25, -.2), S['leather'], ser, v=4); torus(.03, .006, (0, s * .25, -.4), S['gold'] if X.get('rich') else S['iron'], ser, rot=(PI / 2, 0, 0))
    trim = X.get('trim', S['gold'])
    if X.get('barding'):   # tam at zırhı/çulu: gövdeyi diz hizasına kadar sarar
        B = X['barding']; rings = []
        prof = [(-.52, .29, .21), (-.34, .31, .225), (-.08, .3, .215), (.14, .31, .215), (.3, .32, .205), (.44, .28, .18), (.52, .2, .14)]
        n, vs, fs = 14, [], []
        for (t, a, b) in prof:
            for i in range(n + 1):
                th = PI * (-.62 + 1.24 * i / n)       # sırttan iki yana, alta doğru açık
                y = math.sin(th) * (b + .02); z = math.cos(th) * (a + .02)
                if abs(th) > PI * .45:
                    z -= .0
                vs.append((t, y, z))
            # yanlardan sarkan etek
        rows = len(prof)
        for j in range(rows - 1):
            for i in range(n):
                k = j * (n + 1) + i; fs.append((k, k + 1, k + n + 2, k + n + 1))
        top = mesh(vs, fs, B, body, smooth=True)
        for s in (1, -1):   # yan etekler (dalgalı alt kenar)
            vv, ff, cols = [], [], 18
            for i in range(cols + 1):
                t = -.52 + 1.04 * i / cols; b = .235 + .015 * math.sin(i)
                for z in (-.06, -.52 - .03 * math.sin(i * 1.7)):
                    vv.append((t, s * (b + (.0 if z > -.1 else .03)), z))
            for i in range(cols):
                ff.append((2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2))
            mesh(vv, ff, B, body, smooth=True)
            vv2 = [(v[0], v[1] * 1.01, v[2] if k % 2 == 0 else v[2]) for k, v in enumerate(vv)]
            hem = [(vv[2 * i + 1][0], vv[2 * i + 1][1] * 1.02, vv[2 * i + 1][2] + dz) for i in range(cols + 1) for dz in (0, .045)]
            mesh(hem, [(2 * i, 2 * i + 1, 2 * i + 3, 2 * i + 2) for i in range(cols)], trim, body)
            if X.get('tassels'):
                for i in range(0, cols + 1, 3):
                    cyl(.016, .07, (hem[2 * i][0], hem[2 * i][1], hem[2 * i][2] - .04), S['gold'], body, r2=.004, v=6)
        # göğüs koruması
        loft([(-.1, .2, .16, -.05), (.12, .22, .15, -.2)], B, neck, rot=(0, 1.0, 0), v=14, cap=(False, False))
        if cl is not B:   # üstte takım renkli eyer örtüsü
            loft([(-.36, .02, .2, .315), (.26, .02, .2, .315)], cl, body, axis='x', v=12)
            for s in (1, -1):
                box(.6, .02, .2, (-.05, s * .245, .2), cl, body, rot=(s * -.25, 0, 0)); box(.62, .025, .03, (-.05, s * .27, .1), trim, body, rot=(s * -.25, 0, 0))
    else:   # çul: sırttan sarkan desenli örtü
        loft([(-.4, .03, .2, .31), (.28, .03, .2, .31)], cl, body, axis='x', v=12)
        for s in (1, -1):
            box(.68, .022, .34, (-.06, s * .245, .13), cl, body, rot=(s * -.2, 0, 0))
            box(.7, .026, .04, (-.06, s * .28, -.03), trim, body, rot=(s * -.2, 0, 0))
            if X.get('tassels'):
                for k in range(6):
                    cyl(.018, .08, (-.38 + k * .13, s * .285, -.09), S['gold'], body, r2=.004, v=6)
    # göğüs kayışı
    torus(.24, .016, (.32, 0, .0), S['leather'], body, rot=(0, PI / 2 - .35, 0))
    if X.get('rich'):
        for k in range(5):
            ball(.025, (.46, (k - 2) * .08, -.12 - abs(k - 2) * .025), S['gold'], body)
    return J


# ------------------------------------------------------------ birimler
def build(look, root, S):
    """Modeli kurar; (J, anim_kind) döndürür."""
    J = {}
    if look == 'reaya':
        J = human(root, S, dict(tunic=S['cream'], vest=S['brown'], sash=S['team'], skirt=S['cream'], skirt_len=.3, hat='straw', beard=S['mane'], cuff=S['cream']))
        tool(J['handR'], S); kind = 'swing'
    elif look == 'azap':
        J = human(root, S, dict(tunic=S['team'], vest=S['leather'], sash=S['white'], skirt=S['team_d'], skirt_len=.34, pants=S['white'], hat='turban', hatc=S['team'], beard=S['mane'], trim=S['brown']))
        spear(J['handR'], S); shield(J['shL'], S, 1); kind = 'thrust'
    elif look == 'okcu':
        J = human(root, S, dict(tunic=S['green'], vest=S['team'], sash=S['brown'], skirt=S['green'], skirt_len=.36, trim=S['team_d'], hat='hood', hatc=S['team'], beard=S['mane']))
        bow(J['handL'], S); quiver(J['chest'], S); kind = 'bow'
    elif look == 'yeniceri':
        J = human(root, S, dict(tunic=S['blue'], skirt=S['blue'], vest=S['team'], sash=S['red'], boots=S['red'], hat='bork', beard=S['mane'], trim=S['goldc'], cuff=S['team_d']))
        musket(J['handR'], S)
        sword(J['pel'], S, L=.4).location = (.02, .16, .02)
        kind = 'musket'
    elif look == 'molla':
        J = human(root, S, dict(tunic=S['white'], skirt=S['white'], skirt_len=.55, vest=S['green2'], sash=S['team'], hat='kavuk', beard=S['grayb'], boots=S['dark'], trim=S['green2']))
        b = joint('book', (0, 0, 0), J['handL']); box(.1, .14, .03, (.05, 0, .02), S['red'], b, rot=(0, -.6, 0)); box(.09, .13, .032, (.05, 0, .021), S['white'], b, rot=(0, -.6, 0))
        st = joint('staff', (0, 0, 0), J['handR']); cyl(.016, 1.3, (0, 0, .25), S['wood'], st, v=8); ball(.03, (0, 0, .9), S['gold'], st)
        kind = 'pray'
    elif look == 'akinci':
        H = horse(root, S, S['horse_b'], dict(cloth=S['team_pat'], trim=S['fur']))
        Jh = human(root, S, dict(tunic=S['team'], vest=S['fur'], sash=S['gold'], skirt=S['team_d'], hat='kalpak', hatc=S['team'], beard=S['mane'], boots=S['yellow'], cuff=S['fur']), seated_z=1.38)
        sword(Jh['handR'], S); shield(Jh['shL'], S, 1, .15, S['team_d']); quiver(Jh['chest'], S)
        J = dict(Jh); J.update({'h_' + k: v for k, v in H.items()}); J['rider'] = True; kind = 'swing'
    elif look in ('sipahi', 'sovalye', 'fatih', 'komutan'):
        if look == 'sipahi':
            H = horse(root, S, S['horse'], dict(cloth=S['team_pat'], trim=S['gold'], tassels=True))
            Jh = human(root, S, dict(tunic=S['red'], armor=S['mail'], skirt=S['team'], sash=S['gold'], hat='chichak', plume=S['team'], beard=S['mane'], boots=S['yellow'], cuff=S['steel'], pauldron=S['scale']), seated_z=1.38)
            spear(Jh['handR'], S, 1.9, pennant=S['team'])
            shield(Jh['shL'], S, 1, .18); kind = 'thrust'
        elif look == 'sovalye':   # AoE2 paladin tarzı: zincir at zırhı, takım renkli örtü
            H = horse(root, S, S['horse_g'], dict(barding=S['lamel'], crinet=S['steel'], cloth=S['team_pat'], trim=S['gold'], chanfron=S['steel'], plume=S['team']))
            Jh = human(root, S, dict(tunic=S['mail'], sleeve=S['mail'], armor=S['steel'], mailskirt=S['mail'], surcoat=S['team'], sash=S['gold'], pants=S['mail'], greaves=S['steel'], boots=S['steel'], gloves=S['steel'], pauldron=S['steel'], hat='helm', plume=S['team'], mustache=False, eyes=False), seated_z=1.38)
            spear(Jh['handR'], S, 2.1, pennant=S['team'])
            shield(Jh['shL'], S, 1, .17, S['team_pat'], kind='heater'); kind = 'thrust'
        elif look == 'fatih':     # Sultan: en ayrıntılı model
            H = horse(root, S, S['horse_w'], dict(cloth=S['kaftan'], trim=S['gold'], tassels=True, rich=True, plume=S['white']))
            Jh = human(root, S, dict(tunic=S['kaftan'], sleeve=S['kaftan'], skirt=S['kaftan'], sash=S['goldc'], belt=S['gold'], pants=S['white'], boots=S['yellow'], hat='big_turban', beard=S['mane'], collar=S['ermine'], cuff=S['goldc'], trim=S['ermine']), seated_z=1.38)
            cape(Jh['chest'], S, S['team'], S['ermine'])
            sword(Jh['handR'], S, jewel=True); kind = 'swing'
        else:
            H = horse(root, S, S['horse_b'], dict(barding=S['team_pat'], cloth=S['team_pat'], trim=S['gold'], chanfron=S['steel']))
            Jh = human(root, S, dict(tunic=S['team'], sleeve=S['mail'], armor=S['steel'], mailskirt=S['mail'], sash=S['gold'], pants=S['iron'], greaves=S['steel'], boots=S['steel'], gloves=S['steel'], pauldron=S['steel'], hat='helm', plume=S['team'], beard=S['mane']), seated_z=1.38)
            cape(Jh['chest'], S, S['team_d'], S['red'])
            sword(Jh['handR'], S, curved=False); shield(Jh['shL'], S, 1, .2, S['team_pat'], kind='heater'); kind = 'swing'
        J = dict(Jh); J.update({'h_' + k: v for k, v in H.items()}); J['rider'] = True
    elif look in ('kadirga', 'bastarda', 'balikci'):
        J = ship(root, S, look); kind = 'ship'
    elif look in ('top', 'sahi'):
        k = 1. if look == 'top' else 1.55
        car = joint('car', (0, 0, 0), root); J['car'] = car
        if look == 'top':
            for s in (1, -1):
                box(1.1, .08, .14, (-.15, s * .2, .3), S['wood'], car, rot=(0, .18, 0), bevel=.01)
                w = joint('wheel' + ('L' if s > 0 else 'R'), (.1, s * .32, .3), car); J['wheel' + ('L' if s > 0 else 'R')] = w
                cyl(.3, .06, (0, 0, 0), S['wood'], w, rot=(PI / 2, 0, 0), v=24); cyl(.06, .1, (0, 0, 0), S['iron'], w, rot=(PI / 2, 0, 0))
                torus(.29, .02, (0, 0, 0), S['iron'], w, rot=(PI / 2, 0, 0))
                for q in range(6):
                    box(.03, .03, .54, (0, 0, 0), S['wood'], w, rot=(0, q * PI / 6, 0))
            box(.08, .64, .08, (.1, 0, .3), S['iron'], car)
            box(.5, .1, .06, (-.8, 0, .08), S['wood'], car, rot=(0, -.2, 0))
            bz = .52
        else:
            for s in (1, -1):
                box(2.1, .16, .2, (-.1, s * .28, .12), S['wood'], car, bevel=.02)
            for x in (-.7, 0, .7):
                box(.16, .76, .16, (x, 0, .26), S['wood'], car, bevel=.02)
            bz = .55
        bar = joint('barrel', (0, 0, bz), car); J['barrel'] = bar
        L = 1.25 * k
        cyl(.15 * k, L, (.1 * k, 0, 0), S['bronze'], bar, rot=(0, PI / 2, 0), r2=.11 * k, v=24)
        for xx in (-.45, .05, .55):
            torus(.14 * k - xx * .03, .022 * k, (xx * k + .1 * k, 0, 0), S['bronze'], bar, rot=(0, PI / 2, 0))
        ball(.12 * k, (-.55 * k, 0, 0), S['bronze'], bar); ball(.05 * k, (-.7 * k, 0, 0), S['bronze'], bar)
        cyl(.07 * k, .03, (.73 * k, 0, 0), S['dark'], bar, rot=(0, PI / 2, 0))
        fl = joint('flash', (.9 * k, 0, 0), bar); J['flash'] = fl
        ball(.22 * k, (0, 0, 0), S['flash'], fl, sc=(1.6, 1, 1)); fl.scale = (0.001, .001, .001)
        # topçu
        g = joint('gunner', (-.75 * k - .15, -.35, 0), root)
        Jg = human(g, S, dict(tunic=S['team'], skirt=S['team'], sash=S['brown'], hat='turban', hatc=S['red'], beard=S['mane']))
        rm = joint('rammer', (0, 0, 0), Jg['handR']); cyl(.015, 1.1, (0, 0, .25), S['wood'], rm, v=6); cyl(.05, .12, (0, 0, .82), S['brown'], rm)
        J.update({'g_' + kk: v for kk, v in Jg.items()})
        p = joint('pole', (-.5 * k, .3, 0), root); cyl(.015, 1.2, (0, 0, .6), S['wood'], p, v=6); mesh([(0, 0, 0), (.35, 0, -.06), (0, 0, -.22)], [(0, 1, 2)], S['team'], p, loc=(0, 0, 1.2))
        kind = 'cannon'
    return J, kind



# ------------------------------------------------------------ gemiler
def sailor(parent, S, x, y, z, k):
    j = joint('crew%d' % k, (x, y, z), parent)
    loft([(0, .07, .07), (.16, .065, .07), (.26, .05, .06)], S['team'] if k % 2 else S['red'], j, v=10)
    ball(.05, (0, 0, .32), S['skin'], j); ball(.06, (0, 0, .38), S['white'], j, sc=(1, 1, .75))
    return j


def ship(root, S, look):
    """Kadırga / baştarda / balıkçı kayığı. Gövde +X yönüne bakar."""
    J = {'ship': True}
    L, B, Hh, nO = {'kadirga': (3.0, .42, .34, 9), 'bastarda': (3.8, .55, .42, 12), 'balikci': (1.25, .3, .2, 1)}[look]
    hull = joint('hull', (0, 0, 0), root); J['hull'] = hull
    wood, dark = S['wood'], S['hullw']
    rings = [(-.5, .1, .04, .55), (-.44, .5, .55, .3), (-.3, .52, .9, .12), (0, .5, 1, .0), (.28, .5, .9, .06), (.42, .44, .55, .2), (.5, .14, .06, .5)]
    loft([(t * L, a * Hh, b * B, Hh * .5 + du * Hh) for (t, a, b, du) in rings], dark, hull, axis='x', v=18)
    # takım renkli boya şeridi ve küpeşte
    loft([(t * L, a * Hh * .32, b * B * 1.015, Hh * .78 + du * Hh) for (t, a, b, du) in rings[1:-1]], S['team'], hull, axis='x', v=18, cap=(False, False))
    zd = Hh * .95
    loft([(-.42 * L, .02, B * .5, zd), (.4 * L, .02, B * .5, zd)], S['deck'], hull, axis='x', v=12)
    if look == 'balikci':
        for s in (1, -1):
            o = joint('oar' + ('L' if s > 0 else 'R') + '0', (0, s * B * .9, zd), hull); J[o.name] = o
            cyl(.015, .9, (0, s * .35, -.12), wood, o, rot=(s * 1.2, 0, 0), v=6)
        g = joint('fisher', (-.15, 0, zd - .3), hull); g.scale = (.6, .6, .6)
        Jf = human(g, S, dict(tunic=S['cream'], vest=S['team'], sash=S['brown'], skirt=S['cream'], skirt_len=.25, hat='straw', beard=S['mane']))
        J.update({'f_' + k: v for k, v in Jf.items()})
        net = joint('net', (.35, 0, zd + .2), hull); J['net'] = net
        ball(.22, (0, 0, 0), S['netm'], net, sc=(1, 1, .4)); net.scale = (.001, .001, .001)
        box(.3, .25, .08, (-.35, 0, zd + .04), S['straw'], hull)   # balık sepeti
        cyl(.015, .9, (.2, 0, zd + .45), wood, hull, v=6)
        J['pp'] = joint('pp', (0, 0, .4), root)
        return J
    # kürekler
    xs = [(-.32 + .64 * k / max(1, nO - 1)) * L for k in range(nO)]
    for s, n in ((1, 'L'), (-1, 'R')):
        for k, x in enumerate(xs):
            o = joint('oar%s%d' % (n, k), (x, s * B * .98, zd), hull); J[o.name] = o
            cyl(.014, 1.15, (0, s * .5, -.25), wood, o, rot=(s * 1.12, 0, 0), v=6)
            box(.1, .02, .12, (0, s * .98, -.5), wood, o, rot=(s * 1.12, 0, 0))
    # direk ve latin yelkeni
    mast = joint('mast', (.12 * L, 0, zd), hull)
    cyl(.045, 2.4 if look == 'bastarda' else 2.0, (0, 0, 1.1 if look == 'bastarda' else .95), wood, mast, v=10)
    top = 2.25 if look == 'bastarda' else 1.9
    A, Bp, C = (-1.15, 0, .55), (1.0, 0, top + .45), (.1, 0, .35)
    if look == 'bastarda':
        A, Bp, C = (-1.4, 0, .6), (1.2, 0, top + .55), (.1, 0, .4)
    n, vs, fs = 8, [], []
    for i in range(n + 1):
        for j in range(n + 1 - i):
            u, v = i / n, j / n; w = 1 - u - v
            bul = .32 * math.sin(math.pi * min(1, u + w * .5)) * math.sin(math.pi * min(1, v + w * .5)) * (1 - w * .6)
            vs.append(tuple(A[q] * w + Bp[q] * u + C[q] * v + (bul if q == 1 else 0) for q in range(3)))
    def vid(i, j): return sum(n + 1 - k for k in range(i)) + j
    for i in range(n):
        for j in range(n - i):
            fs.append((vid(i, j), vid(i + 1, j), vid(i, j + 1)))
            if j < n - i - 1:
                fs.append((vid(i + 1, j), vid(i + 1, j + 1), vid(i, j + 1)))
    sl = mesh(vs, fs, S['sail'], mast, smooth=True); md = sl.modifiers.new('s', 'SOLIDIFY'); md.thickness = .012
    Lg = math.dist(A, Bp); ang = math.atan2(Bp[0] - A[0], Bp[2] - A[2])
    cyl(.022, Lg + .2, ((A[0] + Bp[0]) / 2, 0, (A[2] + Bp[2]) / 2), wood, mast, rot=(0, ang, 0), v=8)
    # kıç köşkü, sayeban ve sancak
    k = joint('kosk', (-.4 * L, 0, zd), hull)
    box(.5, B * 1.1, .28, (0, 0, .14), S['wood'], k, bevel=.02)
    loft([(.3, .02, B * .6), (.5, .14, B * .6, -.05)], S['team'], k, axis='z', v=12)
    for sx in (.22, -.22):
        for sy in (B * .5, -B * .5):
            cyl(.012, .3, (sx, sy, .42), S['gold'], k, v=6)
    cyl(.015, 1.0, (-.3, 0, .8), wood, k, v=6); ball(.05, (-.3, 0, 1.32), S['gold'], k)
    mesh([(0, 0, 0), (.5, 0, -.08), (.42, 0, -.2), (.5, 0, -.32), (0, 0, -.3)], [(0, 1, 2, 4), (2, 3, 4)], S['team'], k, loc=(-.3, 0, 1.25))
    ball(.06, (-.3 + .08, 0, .5), S['gold'], k)   # fener
    # pruva: mahmuz ve top
    loft([(.48 * L, .06, .05, Hh * .55), (.62 * L, .012, .012, Hh * .5)], S['bronze'], hull, axis='x', v=8)
    bow = joint('bow', (.38 * L, 0, zd + .08), hull)
    for yy in ((0,) if look == 'kadirga' else (-.18, 0, .18)):
        cyl(.06, .55, (.15, yy, 0), S['bronze'], bow, rot=(0, PI / 2, 0), r2=.045, v=12)
    fl = joint('flash', (.5, 0, 0), bow); J['flash'] = fl
    ball(.2, (0, 0, 0), S['flash'], fl, sc=(1.6, 1, 1)); fl.scale = (.001, .001, .001)
    # tayfa
    for q in range(8 if look == 'kadirga' else 12):
        sailor(hull, S, (-.3 + .55 * ((q * .37) % 1)) * L, (q % 3 - 1) * B * .32, zd, q)
    J['pp'] = joint('pp', (0, 0, .6), root)
    return J


def pose_ship(look, J, act, f, root):
    root.rotation_euler.x = 0; root.rotation_euler.y = 0; root.location.z = 0
    oars = [v for k, v in J.items() if k.startswith('oar')]
    for o in oars:
        o.rotation_euler = (0, 0, 0)
    if 'flash' in J:
        J['flash'].scale = (.001, .001, .001)
    if 'net' in J:
        J['net'].scale = (.001, .001, .001)
    if act == 'walk':
        ph = f / WALK * 2 * PI
        for o in oars:
            s = 1 if 'L' in o.name else -1
            o.rotation_euler = (s * math.cos(ph) * .12, 0, s * math.sin(ph) * .38)
        root.rotation_euler.y = math.sin(ph) * .015
    elif act == 'atk':
        if look == 'balikci':
            t = f / (ATK - 1); sc = max(.001, min(1, t * 1.8)); J['net'].scale = (sc, sc, sc); J['net'].location.x = .35 + t * .4
            g = {k[2:]: v for k, v in J.items() if k.startswith('f_')}
            g['shR'].rotation_euler = (0, -2.2 + 2 * t, 0); g['shL'].rotation_euler = (0, -2.0 + 1.8 * t, 0)
        elif f in (1, 2):
            sc = 1.0 if f == 1 else .6; J['flash'].scale = (sc, sc, sc)
    elif act == 'dead':
        root.rotation_euler.x = .45; root.location.z = -.25


# ------------------------------------------------------------ pozlar
def reset_pose(J):
    for k, o in J.items():
        if hasattr(o, 'rotation_euler') and k not in ('pel',):
            pass
    for k in ('hipL', 'hipR', 'kneeL', 'kneeR'):
        if k in J and not J.get('rider'):
            J[k].rotation_euler = (0, 0, 0)
    for k in ('shL', 'shR', 'handL', 'handR'):
        if k in J:
            J[k].rotation_euler = (0, 0, 0); J[k].location.x = 0
    if 'pel' in J and not J.get('rider'):
        J['pel'].location.z = .62


def walk_human(J, ph, arms=True):
    s = math.sin(ph)
    J['hipL'].rotation_euler = (0, s * .5, 0); J['hipR'].rotation_euler = (0, -s * .5, 0)
    J['kneeL'].rotation_euler = (0, .1 + .75 * max(0, math.sin(ph + 1.2)), 0); J['kneeR'].rotation_euler = (0, .1 + .75 * max(0, -math.sin(ph + 1.2)), 0)
    J['pel'].location.z = .62 + abs(math.cos(ph)) * .025
    if arms:
        J['shL'].rotation_euler = (0, -s * .45, 0); J['shR'].rotation_euler = (0, s * .45, 0)


def pose(look, kind, J, act, f, root):
    if kind == 'ship':
        return pose_ship(look, J, act, f, root)
    root.rotation_euler.x = 0; root.location.z = 0
    if kind == 'cannon':
        car = J['car']
        for w in ('wheelL', 'wheelR'):
            if w in J:
                J[w].rotation_euler = (0, 0, 0)
        J['barrel'].location.x = 0; J['flash'].scale = (.001, .001, .001)
        g = {k[2:]: v for k, v in J.items() if k.startswith('g_')}
        reset_pose(g)
        g['shR'].rotation_euler = (0, -.6, 0); g['shL'].rotation_euler = (0, -.6, 0); g['handR'].rotation_euler = (0, .6, 0)
        if act == 'walk':
            ph = f / WALK * 2 * PI
            for w in ('wheelL', 'wheelR'):
                if w in J:
                    J[w].rotation_euler = (0, ph, 0)
            walk_human(g, ph, arms=False)
        elif act == 'atk':
            t = f / (ATK - 1)
            J['barrel'].location.x = -.18 * max(0, 1 - t * 1.6) * (1 if f > 0 else 0)
            if f in (1, 2):
                s = 1.0 if f == 1 else .6
                J['flash'].scale = (s, s, s)
        elif act == 'dead':
            J['barrel'].rotation_euler = (0, .25, 0); car.rotation_euler = (.25, 0, 0)
        if act != 'dead':
            J['barrel'].rotation_euler = (0, 0, 0); car.rotation_euler = (0, 0, 0)
        return
    rider = J.get('rider')
    reset_pose(J)
    if rider:
        H = {k[2:]: v for k, v in J.items() if k.startswith('h_')}
        for n in ('FL', 'FR', 'BL', 'BR'):
            H['leg' + n].rotation_euler = (0, 0, 0)
        H['body'].location.z = .95; H['neck'].rotation_euler = (0, 0, 0)
        if act == 'walk':
            ph = f / WALK * 2 * PI
            for n, o in (('FL', 0), ('FR', PI * .5), ('BL', PI), ('BR', PI * 1.5)):
                H['leg' + n].rotation_euler = (0, math.sin(ph + o) * .55, 0)
            H['body'].location.z = .95 + abs(math.sin(ph)) * .04; J["pel"].location.z = 1.38 + abs(math.sin(ph)) * .04
            H['neck'].rotation_euler = (0, math.sin(ph) * .08, 0)
        else:
            J["pel"].location.z = 1.38
    elif act == 'walk':
        walk_human(J, f / WALK * 2 * PI, arms=kind not in ('bow',) or True)
    # silah tutuşları
    if kind == 'thrust':
        J['shR'].rotation_euler = (0, -.35, 0); J['handR'].rotation_euler = (0, .35, 0)
        if act == 'atk':
            t = math.sin(f / (ATK - 1) * PI); J['shR'].location.x = .3 * t; J['shR'].rotation_euler = (0, -.35 - .5 * t, 0); J['handR'].rotation_euler = (0, .35 + .5 * t, 0)
    elif kind == 'bow':
        if act == 'atk':
            t = f / (ATK - 1); draw = min(1, t * 1.7) if t < .8 else 0
            J['shL'].rotation_euler = (0, -PI / 2, 0); J['handL'].rotation_euler = (0, PI / 2, 0)
            J['shR'].rotation_euler = (0, -PI / 2 + .25, 0); J['shR'].location.x = -.32 * draw
        else:
            J['shL'].rotation_euler = (0, -.15 + J['shL'].rotation_euler.y, 0)
    elif kind == 'musket':
        if act == 'atk':
            t = f / (ATK - 1); rec = .12 * max(0, 1 - abs(t - .3) * 4)
            J['shR'].rotation_euler = (0, -PI / 2, 0); J['shL'].rotation_euler = (0, -PI / 2 + .1, 0); J['shL'].location.x = .2
            J['shR'].location.x = -rec; J['handR'].rotation_euler = (0, 0, 0)
        else:
            J['shR'].rotation_euler = (0, -.15, 0); J['handR'].rotation_euler = (0, PI - .15, 0)
    elif kind == 'swing':
        if act == 'atk':
            t = f / (ATK - 1); a = 2.5 - 3.2 * t
            J['shR'].rotation_euler = (0, a, 0)
        elif rider:
            J['shR'].rotation_euler = (0, -.5, 0)
    if kind == 'pray' and act == 'atk':
        t = math.sin(f / (ATK - 1) * PI); J['shL'].rotation_euler = (-.5 * t, -1.6 * t, 0); J['shR'].rotation_euler = (.5 * t, -1.6 * t, 0)
    if act == 'dead':
        root.rotation_euler.x = PI / 2 * (1 if not rider else .95); root.location.z = .16 if not rider else .35
        if not rider:
            J['shL'].rotation_euler = (0, -.8, 0); J['shR'].rotation_euler = (0, .7, 0)


# ------------------------------------------------------------ render
USCALE = 1.2
FRAME = {k: int(v * USCALE) // 2 * 2 for k, v in {'kadirga': 280, 'bastarda': 330, 'balikci': 150, 'sahi': 208, 'top': 160, 'sipahi': 176, 'sovalye': 176, 'fatih': 160, 'komutan': 160, 'akinci': 160, 'reaya': 128, 'azap': 128, 'okcu': 128, 'yeniceri': 128, 'molla': 128}.items()}
LOOKS = ['reaya', 'azap', 'okcu', 'yeniceri', 'sipahi', 'sovalye', 'fatih', 'komutan', 'top', 'sahi', 'molla', 'akinci', 'balikci', 'kadirga', 'bastarda']


def frames():
    out = [('idle', 0)] + [('walk', i) for i in range(WALK)] + [('atk', i) for i in range(ATK)] + [('dead', 0)]
    return out


def render_look(look, outdir, dirs=range(8), only=None):
    reset()
    S = mats()
    fs = FRAME.get(look, 154)
    setup_scene(fs, fs, USCALE, target=(0, 0, .45), samples=28)
    root = joint('root')
    J, kind = build(look, root, S)
    os.makedirs(os.path.join(outdir, look), exist_ok=True)
    jobs = [(d, a, f) for d in dirs for (a, f) in frames() if not only or (a, f) in only]
    rim_light()
    for mask in (False, True):
        mask_mode(mask)
        bpy.context.scene.render.resolution_percentage = 100 if mask else int(SS * 100)
        for (d, act, f) in jobs:
            root.rotation_euler.z = PI / 2 - d * PI / 4   # oyun (x,y) = Blender (Y,X)
            pose(look, kind, J, act, f, root)
            bpy.context.view_layer.update()
            path = os.path.join(outdir, look, '%d_%s_%d%s.png' % (d, act, f, '_m' if mask else ''))
            render_to(path)
            if not mask and SS > 1:
                sharpen_down(path, fs)


SS = float(os.environ.get('SS', 2))   # süper örnekleme: 2x render, keskinleştirerek küçült


def rim_light():
    """Arkadan soğuk kontur ışığı: siluet belirginleşir (AoE2 sprite görünümü)."""
    bpy.ops.object.light_add(type='SUN', rotation=(math.radians(55), 0, math.radians(-45 + 180 - 135)))
    L = bpy.context.object; L.data.energy = 1.6; L.data.color = (.75, .85, 1); L.data.angle = math.radians(3)


def sharpen_down(path, fs):
    from PIL import Image, ImageFilter
    im = Image.open(path).convert('RGBA'); a = im.getchannel('A')
    rgb = Image.new('RGB', im.size, (0, 0, 0)); rgb.paste(im.convert('RGB'), mask=a)
    rgb = rgb.resize((fs, fs), Image.LANCZOS).filter(ImageFilter.UnsharpMask(radius=1.1, percent=70, threshold=1))
    a = a.resize((fs, fs), Image.LANCZOS)
    out = rgb.convert('RGBA'); out.putalpha(a); out.save(path)



def render_portrait(look, outdir, size=160):
    reset(); S = mats()
    setup_scene(size, size, 1., samples=64)
    sc = bpy.context.scene
    root = joint('root')
    J, kind = build(look, root, S)
    pose(look, kind, J, 'idle', 0, root)
    bpy.data.objects['catcher'].hide_render = True
    bpy.context.view_layer.update()
    if kind == 'ship':
        head = J['pp'].matrix_world @ Vector((0, 0, 0)) if look != 'balikci' else J['f_hd'].matrix_world @ Vector((0, 0, .15))
    elif kind == 'cannon':
        head = J['g_hd'].matrix_world @ Vector((0, 0, .15))
    else:
        head = J['hd'].matrix_world @ Vector((0, 0, .15))
    cam = sc.camera; cam.data.type = 'PERSP'; cam.data.lens = 85; cam.data.sensor_fit = 'AUTO'
    cam.location = head + Vector((1.45, .8, .22)) * (4.2 if kind == 'ship' and look != 'balikci' else 1)
    d = head + Vector((0, 0, .06)) - cam.location; cam.rotation_euler = d.to_track_quat('-Z', 'Y').to_euler()
    bpy.ops.object.light_add(type='AREA', location=head + Vector((.8, -.6, .5))); L = bpy.context.object; L.data.energy = 25; L.data.size = .6
    L.rotation_euler = (head - L.location).to_track_quat('-Z', 'Y').to_euler()
    bpy.ops.object.light_add(type='AREA', location=head + Vector((-.6, .5, .3))); L = bpy.context.object; L.data.energy = 18; L.data.size = .5; L.data.color = (1, .8, .55)
    L.rotation_euler = (head - L.location).to_track_quat('-Z', 'Y').to_euler()
    os.makedirs(outdir, exist_ok=True)
    mask_mode(False); bpy.data.objects['catcher'].hide_render = True
    render_to(os.path.join(outdir, 'p_%s.png' % look))
    mask_mode(True); render_to(os.path.join(outdir, 'p_%s_m.png' % look))


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('-')]
    out = args[0] if args else 'out/units'
    looks = args[1:] or LOOKS
    only_p = '--portraits' in sys.argv
    for lk in looks:
        render_portrait(lk, out + '_portraits')
        if not only_p:
            render_look(lk, out)
        print('DONE', lk, flush=True)
