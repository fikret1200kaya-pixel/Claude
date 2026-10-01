"""FATİH — Birim modelleri ve animasyon render'ı.
Kullanım: python3 units.py <çıktı_klasörü> [bakış ...]
Her bakış için 8 yön × (1 bekleme + 8 yürüme + 6 saldırı + 1 ölü) kare, ayrıca takım maskesi.
"""
import bpy, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *

PI = math.pi
WALK, ATK = 8, 6


def mats():
    return dict(
        skin=M('skin', (.86, .62, .45), .6),
        team=M('team', (.86, .86, .86), .6, noise=30, nf=.15, team=True),
        team_d=M('team_d', (.62, .62, .62), .7, noise=30, nf=.15, team=True),
        white=M('white', (.93, .9, .82), .7, noise=25, nf=.15),
        cream=M('cream', (.88, .82, .68), .7, noise=25, nf=.15),
        brown=M('brown', (.42, .27, .14), .7, noise=20),
        leather=M('leather', (.33, .2, .1), .6, noise=20),
        dark=M('dark', (.08, .06, .05), .6),
        pants=M('pants', (.32, .26, .2), .8, noise=20, nf=.15),
        green=M('green', (.25, .4, .2), .8, noise=20, nf=.15),
        blue=M('blue', (.16, .3, .5), .7, noise=20, nf=.15),
        red=M('red', (.62, .1, .07), .6, noise=20, nf=.15),
        straw=M('straw', (.85, .72, .38), .8, noise=40),
        steel=M('steel', (.7, .72, .76), .3, .9),
        iron=M('iron', (.25, .25, .27), .4, .8),
        gold=M('gold', (1, .74, .3), .3, 1.),
        bronze=M('bronze', (.72, .45, .2), .35, 1.),
        wood=M('wood', (.45, .29, .15), .7, noise=15),
        horse=M('horse', (.42, .24, .12), .55, noise=12),
        horse_w=M('horse_w', (.9, .88, .84), .5, noise=12),
        horse_g=M('horse_g', (.6, .6, .58), .5, noise=12),
        horse_b=M('horse_b', (.16, .1, .07), .5, noise=12),
        mane=M('mane', (.12, .08, .05), .8),
        flash=M('flash', (1, .8, .3), .5, emit=(1, .7, .2)),
    )


# ------------------------------------------------------------ insan
def human(root, S, X, seated_z=None):
    """X: kıyafet sözlüğü. Eklemleri döndürür."""
    J = {}
    pz = seated_z if seated_z else .55
    pel = joint('pel', (0, 0, pz), root); J['pel'] = pel
    for s, n in ((1, 'L'), (-1, 'R')):
        hip = joint('hip' + n, (0, s * .085, 0), pel); J['hip' + n] = hip
        if seated_z:
            hip.rotation_euler = (s * -.55, -.35, 0)
        cyl(.045, .48, (0, 0, -.24), X.get('pants', S['pants']), hip, r2=.062)
        box(.17, .085, .08, (.035, 0, -.5), X.get('boots', S['leather']), hip, bevel=.025)
    if X.get('skirt'):
        cyl(.21, .36, (0, 0, -.06), X['skirt'], pel, r2=.15, v=20)
    cyl(.15, .38, (0, 0, .19), X['tunic'], pel, r2=.175, v=20)
    if X.get('vest'):
        cyl(.155, .3, (.01, 0, .22), X['vest'], pel, r2=.18, v=20)
    cyl(.165, .07, (0, 0, .03), X.get('sash', S['brown']), pel, v=20)
    chest = joint('chest', (0, 0, .36), pel); J['chest'] = chest
    ball(.075, (0, 0, .05), X.get('skin', S['skin']), chest)            # boyun
    ball(.11, (0, 0, .15), X.get('skin', S['skin']), chest, sc=(1, .95, 1.08)); J['head'] = (0, 0, .15)
    ball(.025, (.1, 0, .14), X.get('skin', S['skin']), chest)            # burun
    if X.get('beard'):
        ball(.06, (.075, 0, .09), X['beard'], chest, sc=(1, 1.4, 1))
    for s, n in ((1, 'L'), (-1, 'R')):
        sh = joint('sh' + n, (0, s * .2, -.02), chest); J['sh' + n] = sh
        ball(.06, (0, 0, 0), X.get('sleeve', X['tunic']), sh)
        cyl(.042, .38, (0, 0, -.2), X.get('sleeve', X['tunic']), sh, r2=.052)
        hand = joint('hand' + n, (0, 0, -.41), sh); J['hand' + n] = hand
        ball(.045, (0, 0, 0), X.get('gloves', X.get('skin', S['skin'])), hand)
    hat = X.get('hat')
    if hat == 'turban':
        ball(.14, (0, 0, .23), S['white'], chest, sc=(1, 1, .72)); ball(.06, (0, 0, .3), X.get('hatc', S['red']), chest)
    elif hat == 'big_turban':
        ball(.18, (0, 0, .25), S['white'], chest, sc=(1, 1, .78)); ball(.08, (0, 0, .34), S['red'], chest)
        cyl(.012, .16, (.06, 0, .38), S['gold'], chest); ball(.03, (.06, 0, .46), S['gold'], chest)
    elif hat == 'bork':
        cyl(.1, .32, (-.03, 0, .36), S['white'], chest, rot=(0, -.25, 0), r2=.085, v=20)
        box(.06, .16, .3, (-.13, 0, .28), S['white'], chest, rot=(0, .35, 0))
        cyl(.118, .05, (0, 0, .22), S['gold'], chest, v=20)
    elif hat == 'hood':
        ball(.125, (-.01, 0, .19), X.get('hatc', S['team']), chest, sc=(1, 1, .95)); ball(.03, (-.02, 0, .32), S['white'], chest)
    elif hat == 'straw':
        cyl(.24, .07, (0, 0, .24), S['straw'], chest, r2=.08, v=20); cyl(.08, .07, (0, 0, .3), S['straw'], chest)
    elif hat == 'helm':
        cyl(.125, .24, (0, 0, .18), S['steel'], chest, v=16); ball(.125, (0, 0, .3), S['steel'], chest, sc=(1, 1, .5))
        box(.02, .16, .025, (.124, 0, .17), S['dark'], chest)
        if X.get('plume'):
            cyl(.025, .22, (-.03, 0, .42), X['plume'], chest, rot=(0, -.6, 0))
    elif hat == 'kettle':
        ball(.12, (0, 0, .2), S['steel'], chest, sc=(1, 1, .8)); cyl(.2, .02, (0, 0, .19), S['steel'], chest)
    return J


def spear(hand, S, L=1.55):
    j = joint('wpn', (0, 0, 0), hand)
    cyl(.018, L, (.35, 0, 0), S['wood'], j, rot=(0, PI / 2, 0), v=8)
    cyl(.035, .16, (.35 + L / 2 + .07, 0, 0), S['steel'], j, rot=(0, PI / 2, 0), r2=.0, v=8)
    return j


def shield(sh, S, side, r=.2, mat=None):
    j = joint('shield', (0, side * .06, -.26), sh)
    cyl(r, .035, (0, 0, 0), mat or S['brown'], j, rot=(PI / 2, 0, 0), v=24)
    torus(r, .018, (0, 0, 0), S['gold'], j, rot=(PI / 2, 0, 0))
    ball(.045, (0, side * .03, 0), S['gold'], j)
    return j


def bow(hand, S):
    j = joint('bow', (0, 0, 0), hand)
    for k in range(-3, 4):
        a0, a1 = k / 3.5 * .9, (k + 1) / 3.5 * .9
        if k == 3:
            break
        z0, z1 = math.sin(a0) * .42, math.sin(a1) * .42
        x0, x1 = (math.cos(a0) - 1) * .2 + .06, (math.cos(a1) - 1) * .2 + .06
        L = math.hypot(x1 - x0, z1 - z0); ang = math.atan2(x1 - x0, z1 - z0)
        cyl(.016, L, ((x0 + x1) / 2, 0, (z0 + z1) / 2), S['brown'], j, rot=(0, ang, 0), v=6)
    return j


def sword(hand, S, curved=True, L=.6):
    j = joint('sword', (0, 0, 0), hand)
    box(.025, .03, .12, (0, 0, .02), S['gold'], j)
    box(.14, .03, .02, (0, 0, -.05), S['gold'], j)
    box(.04, .012, L, (.02 if curved else 0, 0, -.06 - L / 2), S['steel'], j, rot=(0, .12 if curved else 0, 0))
    return j


def musket(hand, S):
    j = joint('musket', (0, 0, 0), hand)
    box(.06, .05, .32, (0, 0, .1), S['wood'], j, bevel=.01)
    cyl(.018, 1.0, (0, 0, -.45), S['iron'], j, v=8)
    box(.03, .035, .5, (0, 0, -.18), S['wood'], j)
    return j


def tool(hand, S):
    j = joint('tool', (0, 0, 0), hand)
    cyl(.02, .7, (0, 0, -.22), S['wood'], j, v=8)
    box(.2, .03, .07, (.06, 0, -.55), S['iron'], j)
    return j


# ------------------------------------------------------------ at
def horse(root, S, coat, blanket, trim=None):
    J = {}
    body = joint('hbody', (0, 0, .82), root); J['body'] = body
    ball(.26, (0, 0, 0), coat, body, sc=(1.85, 1, 1.05), seg=24)
    neck = joint('neck', (.38, 0, .12), body); J['neck'] = neck
    cyl(.13, .55, (.12, 0, .22), coat, neck, rot=(0, .6, 0), r2=.09)
    ball(.105, (.36, 0, .42), coat, neck, sc=(2.1, .85, 1), rot=(0, .7, 0))
    cyl(.025, .1, (.24, .05, .55), coat, neck, r2=.0, v=6); cyl(.025, .1, (.24, -.05, .55), coat, neck, r2=.0, v=6)
    box(.38, .04, .1, (.1, 0, .32), S['mane'], neck, rot=(0, -.95, 0))
    cyl(.06, .5, (-.6, 0, -.12), S['mane'], body, rot=(0, .55, 0), r2=.025, v=8)
    for (x, y, n) in ((.33, .13, 'FL'), (.33, -.13, 'FR'), (-.33, .13, 'BL'), (-.33, -.13, 'BR')):
        lg = joint('leg' + n, (x, y, -.1), body); J['leg' + n] = lg
        cyl(.04, .68, (0, 0, -.34), coat, lg, r2=.07, v=10)
        cyl(.05, .08, (0, 0, -.69), S['dark'], lg, v=10)
    box(.62, .6, .05, (-.02, 0, .245), blanket, body, bevel=.02)
    if trim:
        box(.64, .62, .02, (-.02, 0, .22), trim, body)
    box(.3, .3, .08, (0, 0, .3), S['leather'], body, bevel=.03)
    return J


# ------------------------------------------------------------ birimler
def build(look, root, S):
    """Modeli kurar; (J, anim_kind) döndürür."""
    J = {}
    if look == 'reaya':
        J = human(root, S, dict(tunic=S['cream'], vest=S['brown'], sash=S['team'], skirt=S['cream'], hat='straw', beard=S['mane']))
        tool(J['handR'], S); kind = 'swing'
    elif look == 'azap':
        J = human(root, S, dict(tunic=S['team'], vest=S['team_d'], sash=S['white'], skirt=S['team'], pants=S['white'], hat='turban', hatc=S['team'], beard=S['mane']))
        spear(J['handR'], S); shield(J['shL'], S, 1); kind = 'thrust'
    elif look == 'okcu':
        J = human(root, S, dict(tunic=S['green'], vest=S['brown'], sash=S['team'], skirt=S['green'], hat='hood', hatc=S['team']))
        bow(J['handL'], S)
        q = joint('q', (-.17, .05, .1), J['chest']); cyl(.06, .4, (0, 0, 0), S['leather'], q, rot=(.3, -.25, 0))
        for k in range(3):
            cyl(.008, .2, (.01 * k, 0, .27), S['white'], q, rot=(.3, -.25, 0), v=4)
        kind = 'bow'
    elif look == 'yeniceri':
        J = human(root, S, dict(tunic=S['blue'], skirt=S['blue'], vest=S['red'], sash=S['team'], boots=S['red'], hat='bork', beard=S['mane']))
        musket(J['handR'], S); kind = 'musket'
    elif look in ('sipahi', 'sovalye', 'fatih', 'komutan'):
        if look == 'sipahi':
            H = horse(root, S, S['horse'], S['team'], S['gold'])
            Jh = human(root, S, dict(tunic=S['white'], vest=S['team'], sash=S['gold'], hat='turban', hatc=S['team'], beard=S['mane']), seated_z=1.15)
            spear(Jh['handR'], S, 1.9)
            p = joint('pen', (.9, 0, .08), Jh['handR']); mesh([(0, 0, 0), (.32, 0, 0), (0, 0, .14)], [(0, 1, 2)], S['team'], p)
            shield(Jh['shL'], S, 1, .17, S['team_d']); kind = 'thrust'
        elif look == 'sovalye':
            H = horse(root, S, S['horse_g'], S['team'], S['white'])
            Jh = human(root, S, dict(tunic=S['steel'], sleeve=S['steel'], vest=S['team'], sash=S['iron'], pants=S['steel'], boots=S['iron'], gloves=S['iron'], hat='helm', plume=S['team']), seated_z=1.15)
            spear(Jh['handR'], S, 2.1)
            shield(Jh['shL'], S, 1, .22, S['team']); kind = 'thrust'
        elif look == 'fatih':
            H = horse(root, S, S['horse_w'], S['red'], S['gold'])
            Jh = human(root, S, dict(tunic=S['red'], vest=S['gold'], sash=S['gold'], pants=S['white'], hat='big_turban', beard=S['mane']), seated_z=1.15)
            c = joint('cape', (-.14, 0, .02), Jh['chest']); box(.04, .44, .62, (0, 0, -.3), S['team'], c, rot=(0, .25, 0))
            sword(Jh['handR'], S); kind = 'swing'
        else:
            H = horse(root, S, S['horse_b'], S['team'], S['gold'])
            Jh = human(root, S, dict(tunic=S['team'], vest=S['steel'], sash=S['gold'], pants=S['iron'], hat='helm', plume=S['team'], beard=S['mane']), seated_z=1.15)
            c = joint('cape', (-.14, 0, .02), Jh['chest']); box(.04, .44, .62, (0, 0, -.3), S['team_d'], c, rot=(0, .25, 0))
            sword(Jh['handR'], S, curved=False); shield(Jh['shL'], S, 1, .2, S['team']); kind = 'swing'
        J = dict(Jh); J.update({'h_' + k: v for k, v in H.items()}); J['rider'] = True
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


# ------------------------------------------------------------ pozlar
def reset_pose(J):
    for k, o in J.items():
        if hasattr(o, 'rotation_euler') and k not in ('pel',):
            pass
    for k in ('hipL', 'hipR'):
        if k in J and not J.get('rider'):
            J[k].rotation_euler = (0, 0, 0)
    for k in ('shL', 'shR', 'handL', 'handR'):
        if k in J:
            J[k].rotation_euler = (0, 0, 0); J[k].location.x = 0
    if 'pel' in J and not J.get('rider'):
        J['pel'].location.z = .55


def walk_human(J, ph, arms=True):
    s = math.sin(ph)
    J['hipL'].rotation_euler = (0, s * .55, 0); J['hipR'].rotation_euler = (0, -s * .55, 0)
    J['pel'].location.z = .55 + abs(math.cos(ph)) * .025
    if arms:
        J['shL'].rotation_euler = (0, -s * .45, 0); J['shR'].rotation_euler = (0, s * .45, 0)


def pose(look, kind, J, act, f, root):
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
        H['body'].location.z = .82; H['neck'].rotation_euler = (0, 0, 0)
        if act == 'walk':
            ph = f / WALK * 2 * PI
            for n, o in (('FL', 0), ('FR', PI * .5), ('BL', PI), ('BR', PI * 1.5)):
                H['leg' + n].rotation_euler = (0, math.sin(ph + o) * .55, 0)
            H['body'].location.z = .82 + abs(math.sin(ph)) * .04; J['pel'].location.z = 1.15 + abs(math.sin(ph)) * .04
            H['neck'].rotation_euler = (0, math.sin(ph) * .08, 0)
        else:
            J['pel'].location.z = 1.15
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
    if act == 'dead':
        root.rotation_euler.x = PI / 2 * (1 if not rider else .95); root.location.z = .16 if not rider else .35
        if not rider:
            J['shL'].rotation_euler = (0, -.8, 0); J['shR'].rotation_euler = (0, .7, 0)


# ------------------------------------------------------------ render
FRAME = {'sahi': 208, 'top': 160, 'sipahi': 176, 'sovalye': 176, 'fatih': 160, 'komutan': 160}
LOOKS = ['reaya', 'azap', 'okcu', 'yeniceri', 'sipahi', 'sovalye', 'fatih', 'komutan', 'top', 'sahi']


def frames():
    out = [('idle', 0)] + [('walk', i) for i in range(WALK)] + [('atk', i) for i in range(ATK)] + [('dead', 0)]
    return out


def render_look(look, outdir, dirs=range(8), only=None):
    reset()
    S = mats()
    fs = FRAME.get(look, 128)
    setup_scene(fs, fs, 1., target=(0, 0, .45), samples=20)
    root = joint('root')
    J, kind = build(look, root, S)
    os.makedirs(os.path.join(outdir, look), exist_ok=True)
    jobs = [(d, a, f) for d in dirs for (a, f) in frames() if not only or (a, f) in only]
    for mask in (False, True):
        mask_mode(mask)
        for (d, act, f) in jobs:
            root.rotation_euler.z = PI / 2 - d * PI / 4   # oyun (x,y) = Blender (Y,X)
            pose(look, kind, J, act, f, root)
            bpy.context.view_layer.update()
            render_to(os.path.join(outdir, look, '%d_%s_%d%s.png' % (d, act, f, '_m' if mask else '')))


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('-')]
    out = args[0] if args else 'out/units'
    looks = args[1:] or LOOKS
    for lk in looks:
        render_look(lk, out)
        print('DONE', lk, flush=True)
