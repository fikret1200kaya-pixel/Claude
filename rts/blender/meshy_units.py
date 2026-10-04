"""Meshy birimlerini (iskeletli yayalar, iskeletsiz atlılar/gemiler/toplar) oyun sprite'larına çevirir.
Kullanım: python3 meshy_units.py <çıktı> <bakış> [--test]
"""
import bpy, math, os, sys
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *
import units
from meshy_static import team_mask_nodes, warm, brighten as _b0
from mathutils import Vector, Matrix
PI = math.pi
M1 = '/home/user/Claude/rts/assets/models/'; M2 = '/home/user/Claude/rts/assets/models2/'
W = lambda d: M2 + d + '/Meshy_AI_Animation_Walking_withSkin.glb'
# bakış: (tür, dosya, boy/uzunluk, silah, ek dönüş)
CFG = {
    'yeniceri': ('foot', W('01a10104-e221-7020-98b3-8b0e11271986'), 1.66, 'musket', PI / 2),
    'reaya': ('foot', W('01a10105-3643-748d-9b55-207305108360'), 1.6, 'tool', PI / 2),
    'molla': ('foot', W('01a10105-a4ee-7395-ba97-7ba98fd02fae'), 1.62, 'staff', PI / 2),
    'azap': ('foot', W('01a10105-f497-75b3-96b2-8c33e843a7e3'), 1.62, 'spear', PI / 2),
    'okcu': ('foot', W('01a10106-380a-7437-8aae-6a137586fe54'), 1.62, 'bow', PI / 2),
    'avr_piyade': ('foot', W('01a10106-ca49-7187-922f-276c0276aaa6'), 1.64, 'pike', PI / 2),
    'avr_okcu': ('foot', W('01a10107-1878-7405-ae09-22de7b4ce019'), 1.62, 'xbow', PI / 2),
    'fatih': ('ride', M2 + 'Meshy_AI_Imperial_Rider_1003083501_texture (1).glb', 2.45, None, 0),
    'sipahi': ('ride', M2 + '01a100ba-bbdf-77b7-852a-b2304819e1d1/Meshy_AI_model.glb', 2.5, None, 0),
    'sovalye': ('ride', M2 + '01a100ba-d996-73bc-89ad-76ad4f6c5932/Meshy_AI_model.glb', 2.55, None, 0),
    'akinci': ('ride', M2 + '01a100ba-f78a-730c-ae2f-ff0592de1ad6/Meshy_AI_model.glb', 2.4, None, 0),
    'komutan': ('ride', M2 + '01a100bb-1cdd-7030-b177-40d8120b70c9/Meshy_AI_model.glb', 2.5, None, 0),
    'kadirga': ('ship', M1 + '01a100ae-0c6b-76f3-8c2c-4a34aad690da/Meshy_AI_model.glb', 3.2, None, 0),
    'bastarda': ('ship', M1 + '01a100ae-2d2a-734c-8710-2e4eb67c562f/Meshy_AI_model.glb', 3.9, None, 0),
    'balikci': ('ship', M2 + 'Meshy_AI_Weathered_Fishing_Boa_1003083321_texture_fbx/Meshy_AI_Weathered_Fishing_Boa_1003083321_texture.fbx', 1.5, None, 0),
    'top': ('gun', M1 + '01a1008f-31ae-720b-9d35-5989b9466278/Meshy_AI_model.glb', 1.7, None, 0),
    'sahi': ('gun', M1 + '01a100ae-52cf-7005-9c34-5baeaa0bef22/Meshy_AI_model.glb', 2.7, None, 0),
}
GUNNER = W('01a10106-8462-7015-8834-30e6ea4b3195')
ROT = {'fatih': PI / 2, 'akinci': PI / 2, 'komutan': PI / 2, 'sovalye': PI / 2, 'sipahi': PI, 'kadirga': PI, 'bastarda': 0, 'top': PI, 'sahi': 0, 'balikci': 0}   # model dosyasındaki yönü +X'e çevir
ROOT = [None]


def brighten(m):
    """Meshy dokuları koyu çıkıyor: metalikliği kapat, rengi aç."""
    nt = m.node_tree; b = nt.nodes.get('Principled BSDF')
    if not b: return
    for k in ('Metallic',):
        for l in list(b.inputs[k].links): nt.links.remove(l)
        b.inputs[k].default_value = 0
    if b.inputs['Base Color'].is_linked:
        src = b.inputs['Base Color'].links[0].from_socket
        mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 1
        v = float(os.environ.get('BRIGHT', 1.55)); mx.inputs[7].default_value = (v, v, v, 1)
        nt.links.new(src, mx.inputs[6]); nt.links.new(mx.outputs[2], b.inputs['Base Color'])


def prep_materials(objs):
    for o in objs:
        if o.type != 'MESH': continue
        for m in o.data.materials:
            if m and m.use_nodes and not m.get('_prep'):
                brighten(m); warm(m); team_mask_nodes(m); m['_prep'] = 1


def import_any(path):
    before = set(bpy.data.objects)
    if path.endswith('.fbx'): bpy.ops.import_scene.fbx(filepath=path)
    else: bpy.ops.import_scene.gltf(filepath=path)
    new = [o for o in bpy.data.objects if o not in before]
    for o in list(new):
        if o.type == 'MESH' and o.name.startswith('Icosphere'):
            bpy.data.objects.remove(o); new.remove(o)
    return new


def bounds(objs):
    bpy.context.view_layer.update()
    pts = [o.matrix_world @ v.co for o in objs if o.type == 'MESH' for v in o.data.vertices]
    mn = Vector((min(p.x for p in pts), min(p.y for p in pts), min(p.z for p in pts))); mx = Vector((max(p.x for p in pts), max(p.y for p in pts), max(p.z for p in pts)))
    return mn, mx


def bone_rot(arm, name, axis, deg):
    pb = arm.pose.bones.get('mixamorig:' + name)
    if not pb: return
    bpy.context.view_layer.update()
    ax = ROOT[0].matrix_world.to_3x3() @ Vector(axis); mw = arm.matrix_world; M = mw @ pb.matrix; h = M.translation.copy()
    R = Matrix.Translation(h) @ Matrix.Rotation(math.radians(deg), 4, ax) @ Matrix.Translation(-h)
    pb.matrix = mw.inverted() @ (R @ M); bpy.context.view_layer.update()


def attach(obj, arm, bone):
    bpy.context.view_layer.update(); mw = obj.matrix_world.copy()
    obj.parent = arm; obj.parent_type = 'BONE'; obj.parent_bone = 'mixamorig:' + bone
    bpy.context.view_layer.update(); obj.matrix_world = mw


def hand_pos(arm, side):
    pb = arm.pose.bones['mixamorig:%sHand' % side]; bpy.context.view_layer.update()
    return arm.matrix_world @ pb.head


def setup_foot(root, path, H, rot, S, weapon):
    objs = import_any(path)
    arm = [o for o in objs if o.type == 'ARMATURE'][0]; meshes = [o for o in objs if o.type == 'MESH']
    prep_materials(meshes)
    act = arm.animation_data.action
    # yürüyüşte ileri kayma olmasın: kalçanın yatay konum eğrilerini sil
    for fc in list(act.fcurves):
        if fc.data_path.endswith('location') and 'Hips' in fc.data_path and fc.array_index in (0, 2):
            act.fcurves.remove(fc)
    bpy.context.scene.frame_set(int(act.frame_range[0])); mn, mx = bounds(meshes); s = H / (mx.z - mn.z)
    piv = joint('pivot', (0, 0, 0), root, rot=(0, 0, rot)); piv.scale = (s, s, s); arm.parent = piv
    lf, rf = arm.pose.bones['mixamorig:LeftFoot'], arm.pose.bones['mixamorig:RightFoot']
    a, b = act.frame_range; best = (9, a)
    for fr in range(int(a), int(b) + 1):
        bpy.context.scene.frame_set(fr); d = ((arm.matrix_world @ lf.head) - (arm.matrix_world @ rf.head)).length
        if d < best[0]: best = (d, fr)
    arm['idlef'] = best[1]; arm['act'] = act
    bpy.context.scene.frame_set(int(best[1])); bpy.context.view_layer.update()
    mn, mx = bounds(meshes); root['zoff'] = -mn.z; piv.location.z = -mn.z
    bpy.context.view_layer.update()
    W = {}
    rh, lh = hand_pos(arm, 'Right'), hand_pos(arm, 'Left')
    def place(build, pos, rotw, bone, name):
        j = joint(name, pos); j.rotation_euler = rotw; build(j); attach(j, arm, bone); W[name] = j
    if weapon == 'musket':
        place(lambda j: units.musket(j, S), rh, (0, 0, 0), 'RightHand', 'w_hand')
        aim = joint('w_aim', (.16, -.13, 1.18 * H / 1.62), root); aim.rotation_euler = (0, -PI / 2 + .05, 0); units.musket(aim, S); W['w_aim'] = aim
    elif weapon == 'xbow':
        def xb(j):
            box(.06, .05, .5, (0, 0, -.1), S['wood'], j); box(.6, .03, .03, (0, 0, -.32), S['wood'], j, rot=(0, 0, PI / 2)); cyl(.003, .55, (0, -.02, -.3), S['white'], j, rot=(PI / 2, 0, 0), v=4)
        place(xb, rh, (0, 0, 0), 'RightHand', 'w_hand')
        aim = joint('w_aim', (.2, -.1, 1.18 * H / 1.62), root); aim.rotation_euler = (0, -PI / 2, 0); xb(aim); W['w_aim'] = aim
    elif weapon in ('spear', 'pike'):
        L = 1.9 if weapon == 'spear' else 2.5
        def sp(j):
            cyl(.018, L, (0, 0, L * .3), S['wood'], j, v=8); ball(.04, (0, 0, L * .8 + .08), S['steel'], j, sc=(.35, .7, 2.6))
        place(sp, rh, (0, 0, 0), 'RightHand', 'w_hand')
        aim = joint('w_aim', (.0, -.18, 1.05 * H / 1.62), root); aim.rotation_euler = (0, PI / 2 - .08, 0); sp(aim); W['w_aim'] = aim
        if weapon == 'spear':
            sh = joint('w_shield', lh + Vector((0, 0, .15))); sh.rotation_euler = (0, 0, rot)
            units.shield(joint('sh_in', (0, 0, 0), sh), S, 1, .2); attach(sh, arm, 'LeftForeArm'); W['w_shield'] = sh
    elif weapon == 'bow':
        place(lambda j: units.bow(j, S), lh, (0, 0, rot), 'LeftHand', 'w_hand')
        q = joint('w_q', (0, 0, 0)); units.quiver(q, S); q.location = (-.05, .08, 1.05 * H / 1.62); q.parent = root
    elif weapon == 'tool':
        place(lambda j: units.tool(j, S), rh, (PI, 0, rot), 'RightHand', 'w_hand')
    elif weapon == 'staff':
        def st(j):
            cyl(.016, 1.35, (0, 0, .2), S['wood'], j, v=8); ball(.03, (0, 0, .88), S['gold'], j)
        place(st, rh, (0, 0, 0), 'RightHand', 'w_hand')
    root['kind'] = {'musket': 'musket', 'xbow': 'musket', 'spear': 'thrust', 'pike': 'thrust', 'bow': 'bow', 'tool': 'swing', 'staff': 'pray'}[weapon]
    return arm


def show(name, on):
    o = bpy.data.objects.get(name)
    if not o: return
    for c in [o] + list(o.children_recursive): c.hide_render = not on


def pose_foot(arm, kind, act, f):
    a_ = arm['act']; arm.animation_data.action = a_; sc = bpy.context.scene
    for pb in arm.pose.bones: pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
    aimk = kind in ('musket', 'thrust')
    show('w_hand', not (aimk and act == 'atk')); show('w_aim', aimk and act == 'atk')
    if act == 'walk':
        a, b = a_.frame_range; sc.frame_set(int(a + (b - a) * f / units.WALK)); return
    sc.frame_set(int(arm['idlef']))
    if act != 'atk': return
    bpy.context.view_layer.update(); mats = {pb.name: pb.matrix.copy() for pb in arm.pose.bones}
    arm.animation_data.action = None
    for pb in arm.pose.bones: pb.matrix = mats[pb.name]; bpy.context.view_layer.update()
    t = f / (units.ATK - 1)
    if kind == 'musket':
        r = [0, 1, .7, .35, .15, 0][f]; bpy.data.objects['w_aim'].location.x = bpy.data.objects['w_aim'].get('x0', bpy.data.objects['w_aim'].location.x) - .06 * r
        bpy.data.objects['w_aim']['x0'] = bpy.data.objects['w_aim'].get('x0', bpy.data.objects['w_aim'].location.x + .06 * r)
        bone_rot(arm, 'RightArm', (0, 1, 0), -48); bone_rot(arm, 'RightArm', (0, 0, 1), 18)
        bone_rot(arm, 'RightForeArm', (0, 1, 0), -75); bone_rot(arm, 'RightForeArm', (0, 0, 1), 50)
        bone_rot(arm, 'LeftArm', (0, 1, 0), -78); bone_rot(arm, 'LeftArm', (0, 0, 1), -28)
        bone_rot(arm, 'LeftForeArm', (0, 1, 0), -12); bone_rot(arm, 'LeftForeArm', (0, 0, 1), -18)
    elif kind == 'thrust':
        k = math.sin(t * PI); a = bpy.data.objects['w_aim']; a['x0'] = a.get('x0', a.location.x); a.location.x = a['x0'] + .28 * k
        bone_rot(arm, 'RightArm', (0, 1, 0), -40 - 35 * k); bone_rot(arm, 'RightForeArm', (0, 1, 0), -40 + 30 * k)
        bone_rot(arm, 'LeftArm', (0, 1, 0), -45 - 20 * k); bone_rot(arm, 'Spine1', (0, 1, 0), 8 * k)
    elif kind == 'bow':
        d = min(1, t * 1.6) if t < .85 else 0
        bone_rot(arm, 'LeftArm', (0, 1, 0), -85); bone_rot(arm, 'LeftArm', (0, 0, 1), -15)
        bone_rot(arm, 'RightArm', (0, 1, 0), -80); bone_rot(arm, 'RightArm', (0, 0, 1), 30 + 30 * d)
        bone_rot(arm, 'RightForeArm', (0, 0, 1), 60 + 60 * d)
    elif kind == 'swing':
        ang = -170 + 150 * t
        bone_rot(arm, 'RightArm', (0, 1, 0), ang); bone_rot(arm, 'Spine1', (0, 1, 0), 15 * t)
    elif kind == 'pray':
        k = math.sin(t * PI)
        bone_rot(arm, 'LeftArm', (0, 1, 0), -70 * k); bone_rot(arm, 'RightArm', (0, 1, 0), -70 * k); bone_rot(arm, 'Head', (0, 1, 0), -15 * k)


def setup_static(root, path, size, kind, rot):
    objs = import_any(path); meshes = [o for o in objs if o.type == 'MESH']; prep_materials(meshes)
    for o in objs:
        if o.parent is None and o.type in ('MESH', 'EMPTY'):
            o.parent = None
    mn, mx = bounds(meshes)
    s = size / (mx.z - mn.z) if kind == 'ride' else size / max(mx.x - mn.x, mx.y - mn.y)
    body = joint('body', (0, 0, 0), root); fix = joint('fix', (0, 0, 0), body, rot=(0, 0, rot)); inner = joint('inner', (0, 0, 0), fix)
    inner.scale = (s, s, s); inner.location = (-(mn.x + mx.x) / 2 * s, -(mn.y + mx.y) / 2 * s, -mn.z * s)
    for o in objs:
        if o.parent is None: o.parent = inner
    bpy.context.view_layer.update()
    mn, mx = bounds(meshes)
    root['len'] = max(mx.x - mn.x, mx.y - mn.y); root['h'] = mx.z - mn.z
    return body


def pose_static(root, body, kind, act, f, gun):
    body.location = (0, 0, 0); body.rotation_euler.x = 0; body.rotation_euler.y = 0
    fl = bpy.data.objects.get('flash')
    if fl: fl.scale = (.001,) * 3
    ph = f / units.WALK * 2 * PI
    if kind == 'ride':
        if act == 'walk':
            body.location.z = abs(math.sin(ph)) * .07; body.rotation_euler.y = math.sin(ph) * .045
        elif act == 'atk':
            k = math.sin(f / (units.ATK - 1) * PI); body.rotation_euler.y = .1 * k; body.location.x = .15 * k
    elif kind == 'ship':
        if act == 'walk':
            body.rotation_euler.x = math.sin(ph) * .04; body.location.z = math.sin(ph * 2) * .025
        elif act == 'atk' and f in (1, 2) and fl:
            s = 1. if f == 1 else .6; fl.scale = (s, s, s)
        body.location.z -= root['h'] * .12   # su çizgisi
    elif kind == 'gun':
        if act == 'atk':
            body.location.x = -.12 * [0, 1, .6, .3, .1, 0][f]
            if f in (1, 2) and fl: s = 1. if f == 1 else .6; fl.scale = (s, s, s)
    if act == 'dead':
        if kind == 'ride': body.rotation_euler.x = PI / 2 * .9; body.location.z = .3
        elif kind == 'ship': body.rotation_euler.x = .5; body.location.z = -root['h'] * .45
        else: body.rotation_euler.y = .3


def render(look, outdir, test=False):
    kind, path, size, weapon, rot = CFG[look]; rot += ROT.get(look, 0)
    reset(); S = units.mats()
    root = joint('root'); ROOT[0] = root
    arm = body = gunner = rig = None
    if kind == 'foot':
        arm = setup_foot(root, path, size, rot, S, weapon); fk = root['kind']
    else:
        body = setup_static(root, path, size, kind, rot)
        rig = None
        if kind == 'ride' and os.environ.get('RIG', '1') == '1':
            import meshy_rider
            meshes = [o for o in body.children_recursive if o.type == 'MESH']
            rig, _ = meshy_rider.build_rig(body, meshes)
        if kind in ('ship', 'gun'):   # ağız ateşi
            L = root['len']; fl = joint('flash', (L * .5 + .1, 0, root['h'] * (.55 if kind == 'gun' else .45)), body)
            ball(.09 + .02 * L, (0, 0, 0), S['flash'], fl, sc=(1.8, 1, 1)); fl.scale = (.001,) * 3
        if kind == 'gun':
            gr = joint('groot', (-root['len'] * .55 - .2, -.35, 0), root)
            gunner = setup_foot(gr, GUNNER, 1.6, PI / 2, S, 'staff'); gunner['gr'] = 1
    fs = units.FRAME.get(look, 154)
    setup_scene(fs, fs, units.USCALE, target=(0, 0, .45), samples=int(os.environ.get('SAMPLES', 16))); units.rim_light()
    os.makedirs(os.path.join(outdir, look), exist_ok=True)
    jobs = [(d, a, f) for d in (range(8) if not test else [1, 2]) for (a, f) in units.frames() if not test or (a, f) in [('idle', 0), ('walk', 2), ('atk', 2), ('dead', 0)]]
    for mask in (False, True):
        mask_mode(mask); bpy.context.scene.render.resolution_percentage = 100 if mask else int(units.SS * 100)
        for (d, act, f) in jobs:
            root.rotation_euler = (0, 0, PI / 2 - d * PI / 4); root.location.z = 0
            if arm:
                pose_foot(arm, fk, act, f)
                if act == 'dead': root.rotation_euler.x = PI / 2 * .97; root.location.z = .16
            elif kind == 'ride' and rig:
                import meshy_rider
                body.location = (0, 0, 0); body.rotation_euler = (0, 0, 0)
                meshy_rider.pose_rider(rig, act, f)
                if act == 'dead': body.rotation_euler.x = PI / 2 * .9; body.location.z = .3
            else:
                pose_static(root, body, kind, act, f, None)
                if gunner: pose_foot(gunner, 'pray', 'walk' if act == 'walk' else 'idle', f)
            bpy.context.view_layer.update()
            p = os.path.join(outdir, look, '%d_%s_%d%s.png' % (d, act, f, '_m' if mask else ''))
            render_to(p)
            if not mask and units.SS > 1: units.sharpen_down(p, fs)


if __name__ == '__main__':
    a = [x for x in sys.argv[1:] if not x.startswith('-')]
    for lk in a[1:]:
        render(lk, a[0], test='--test' in sys.argv); print('DONE', lk, flush=True)
