"""İskeletsiz Meshy atlı modellerine (at + binici tek parça) otomatik iskelet kurar ve canlandırır.
At: 4 bacak (üst + alt kemik), gövde, boyun-baş, kuyruk.  Binici: bel, göğüs, baş, sağ kol (silahla birlikte), sol kol.
Ağırlıklar geometriden kurallarla atanır (Meshy ağları otomatik ağırlıkta sorun çıkarabildiği için)."""
import bpy, math, numpy as np
from mathutils import Vector, Matrix
PI = math.pi


def smooth(x, a, b):
    t = np.clip((x - a) / (b - a + 1e-9), 0, 1); return t * t * (3 - 2 * t)


def build_rig(body, meshes):
    """body: oyun gövde düğümü (ön = +X). meshes: modelin ağları (body altında)."""
    bpy.context.view_layer.update()
    bpy.ops.object.select_all(action='DESELECT')
    for o in meshes: o.select_set(True)
    bpy.context.view_layer.objects.active = meshes[0]
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
    if len(meshes) > 1: bpy.ops.object.join()
    me = bpy.context.view_layer.objects.active
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    V = np.array([v.co[:] for v in me.data.vertices])
    xmin, xmax = V[:, 0].min(), V[:, 0].max(); H = V[:, 2].max()
    # karın yüksekliği: merkez sütunda (gövde altı) en alçak noktaların üst çeyreği
    belly = .36 * H
    # bacak kümeleri: alt bölgede 4 küme
    low = V[V[:, 2] < belly * .55]
    c = np.array([[xmax * .5, .15], [xmax * .5, -.15], [xmin * .5, .15], [xmin * .5, -.15]])
    for _ in range(25):
        a = ((low[:, None, :2] - c[None]) ** 2).sum(-1).argmin(1)
        c = np.array([low[a == k, :2].mean(0) if (a == k).any() else c[k] for k in range(4)])
    # her küme bir çeyreğe: önce x'e göre ön/arka çiftlerine, sonra y'ye göre sol/sağa ayır
    ix = np.argsort(-c[:, 0]); order = [None] * 4
    for pair, f in ((ix[:2], 'F'), (ix[2:], 'B')):
        a_, b_ = pair if c[pair[0], 1] >= c[pair[1], 1] else pair[::-1]
        order[a_] = f + 'L'; order[b_] = f + 'R'
    legc = {order[k]: c[k] for k in range(4)}
    # leg radius
    rad = {}
    for k in range(4):
        pts = low[a == k, :2]; rad[order[k]] = max(.06, np.percentile(np.linalg.norm(pts - c[k], axis=1), 85) * 1.25)
    knee = belly * .48
    back = .5 * H                    # eyer
    neck_x = xmax * .42; tail_x = xmin * .78
    # binici gövdesi: eyerin üstünde, gövde ortasında
    rv = V[(V[:, 2] > back + .1 * H) & (np.abs(V[:, 1]) < .25)]
    rx = np.median(rv[:, 0]) if len(rv) else 0.
    sh_z = back + .3 * H; hd_z = back + .38 * H
    # --- iskelet
    bpy.ops.object.armature_add(enter_editmode=True, location=(0, 0, 0)); arm = bpy.context.object; arm.name = 'rig'
    eb = arm.data.edit_bones; eb.remove(eb[0])
    def bone(n, h, t, par=None):
        b = eb.new(n); b.head = h; b.tail = t
        if par: b.parent = eb[par]
        return b
    bone('root', (0, 0, belly), (0, 0, belly + .2))
    bone('torso', (0, 0, belly + .05), (.3, 0, belly + .05), 'root')
    for n, (cx, cy) in legc.items():
        bone('up' + n, (cx, cy, belly + .02), (cx, cy, knee), 'torso')
        bone('lo' + n, (cx, cy, knee), (cx, cy, 0), 'up' + n)
    bone('neck', (neck_x, 0, back), (xmax * .8, 0, back + .15 * H), 'torso')
    bone('tail', (tail_x, 0, back - .05 * H), (xmin, 0, belly), 'torso')
    bone('hips', (rx, 0, back), (rx, 0, back + .14 * H), 'torso')
    bone('chest', (rx, 0, back + .14 * H), (rx, 0, sh_z), 'hips')
    bone('head', (rx, 0, sh_z), (rx, 0, H), 'chest')
    bone('armR', (rx, -.17, sh_z - .02), (rx + .1, -.2, sh_z - .3), 'chest')
    bone('armL', (rx, .17, sh_z - .02), (rx + .1, .2, sh_z - .3), 'chest')
    bpy.ops.object.mode_set(mode='OBJECT')
    # --- ağırlıklar
    X, Y, Z = V[:, 0], V[:, 1], V[:, 2]
    W = {}
    leg_total = np.zeros(len(V))
    for n, (cx, cy) in legc.items():
        d = np.hypot(X - cx, Y - cy); inside = 1 - smooth(d, rad[n] * .8, rad[n] * 1.3)
        below = 1 - smooth(Z, belly - .06, belly + .08)
        w = inside * below; leg_total = np.maximum(leg_total, w)
        lo = 1 - smooth(Z, knee - .05, knee + .05)
        W['lo' + n] = w * lo; W['up' + n] = w * (1 - lo)
    rest = 1 - leg_total
    rider = smooth(Z, back + .02 * H, back + .1 * H) * (1 - smooth(np.abs(X - rx), .3, .45)) * (1 - smooth(X, neck_x, neck_x + .1))
    weap = smooth(Z, back + .05 * H, back + .15 * H) * smooth(np.abs(X - rx), .3, .45) * (1 - smooth(X, neck_x - .05, neck_x + .05))  # mızrak vb.
    neck = smooth(X, neck_x - .05, neck_x + .15) * smooth(Z, belly, back) * (1 - rider)
    tail = (1 - smooth(X, tail_x - .05, tail_x + .05)) * smooth(Z, belly * .7, belly + .1) * (1 - rider)
    armR = rider * smooth(-Y, .12, .2) * smooth(Z, sh_z - .5, sh_z - .3) * (1 - smooth(Z, sh_z + .05, sh_z + .12))
    armR = np.maximum(armR, weap * (Y < .05))
    armL = rider * smooth(Y, .12, .2) * smooth(Z, sh_z - .5, sh_z - .3) * (1 - smooth(Z, sh_z + .05, sh_z + .12))
    head = rider * smooth(Z, sh_z + .02, sh_z + .1) * (1 - np.maximum(armR, armL))
    chest = rider * smooth(Z, back + .12 * H, back + .2 * H) * (1 - head - np.maximum(armR, armL)).clip(0)
    hips = (rider - chest - head - armR - armL).clip(0)
    used = np.zeros(len(V))
    for k in ('neck', 'tail'):
        w = {'neck': neck, 'tail': tail}[k] * rest; W[k] = w; used += w
    for k, w in (('armR', armR), ('armL', armL), ('head', head), ('chest', chest), ('hips', hips)):
        w = w * rest; W[k] = w; used += w
    W['torso'] = (rest - used).clip(0)
    for k, w in W.items():
        g = me.vertex_groups.new(name=k); idxs = np.nonzero(w > .01)[0]
        for i in idxs: g.add([int(i)], float(w[i]), 'REPLACE')
    md = me.modifiers.new('arm', 'ARMATURE'); md.object = arm
    me.parent = arm; arm.parent = body
    arm['H'] = float(H); arm['belly'] = float(belly)
    for pb in arm.pose.bones: pb.rotation_mode = 'XYZ'
    return arm, me


def pose_rider(arm, act, f, nwalk=8, natk=6):
    P = arm.pose.bones
    for pb in P: pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0)
    if act == 'walk':
        ph = f / nwalk * 2 * PI
        for n, o in (('FL', 0), ('BR', 0), ('FR', PI), ('BL', PI)):
            s = math.sin(ph + o); k = max(0., math.sin(ph + o + 1.3))
            P['up' + n].rotation_euler = (0, .55 * s, 0)       # ileri-geri
            P['lo' + n].rotation_euler = (0, -1.0 * k, 0)      # diz bükümü
        P['root'].location = (0, 0, abs(math.sin(ph)) * .07)
        P['neck'].rotation_euler = (0, .16 * math.sin(ph * 2), 0)
        P['tail'].rotation_euler = (0, 0, .15 * math.sin(ph))
        P['chest'].rotation_euler = (.04 * math.sin(ph), .05 * math.sin(ph * 2), 0)
        P['armR'].rotation_euler = (0, .15 * math.sin(ph), 0); P['armL'].rotation_euler = (0, -.15 * math.sin(ph), 0)
    elif act == 'atk':
        t = f / (natk - 1); k = math.sin(t * PI)
        P['torso'].rotation_euler = (0, -.2 * k, 0)                      # hafif şahlanma
        for n in ('FL', 'FR'):
            P['up' + n].rotation_euler = (0, .8 * k, 0); P['lo' + n].rotation_euler = (0, -1.3 * k, 0)
        P['neck'].rotation_euler = (0, -.15 * k, 0)
        P['chest'].rotation_euler = (0, .35 * k, -.35 * k)                # öne eğilip döner
        P['armR'].rotation_euler = (0, -1.8 + 2.8 * t, 0)                 # kılıç/mızrak savurma
        P['armL'].rotation_euler = (0, -.3 * k, 0)
    elif act == 'idle':
        P['neck'].rotation_euler = (0, .06, 0)
