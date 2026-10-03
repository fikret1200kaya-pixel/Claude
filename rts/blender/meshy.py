"""Meshy'den gelen iskeletli (Mixamo kemikli) GLB modeli oyun sprite'larına çevirir.
Kullanım: python3 meshy.py <glb> <bakış> <referans_resim> <çıktı_klasörü> [--test]
- Doku yoksa: referans resim önden yansıtılır, arka/yanlar bölge renkleriyle boyanır.
- Kareler: bekleme (yürüyüşün orta karesi), 8 yürüme, 6 saldırı (kemik pozu), 1 ölü.
"""
import bpy, math, os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *
import units
from mathutils import Vector, Matrix
PI = math.pi

# görüntüye göre ölçüler (yeniçeri resmi: 1024x1536, figür y 13..1491, merkez x 518)
REF = dict(yeniceri=dict(top=13, bottom=1491, cx=518, team=True, H=1.62))


def load(glb):
    bpy.ops.import_scene.gltf(filepath=glb)
    for o in list(bpy.data.objects):
        if o.type == 'MESH' and o.name.startswith('Icosphere'):
            bpy.data.objects.remove(o)
    arm = [o for o in bpy.data.objects if o.type == 'ARMATURE'][0]
    me = [o for o in bpy.data.objects if o.type == 'MESH'][0]
    return arm, me


def paint(me, arm, ref_path, R):
    """Önden yansıtma UV'si + kemik ve yüksekliğe göre bölge rengi (köşe rengi)."""
    m = me.data; H = me.dimensions.z
    vs = [me.matrix_world @ v.co for v in m.vertices]
    zmin = min(v.z for v in vs); zmax = max(v.z for v in vs); Hm = zmax - zmin
    import bpy as _b
    img = _b.data.images.load(ref_path); W, Hpx = img.size
    k = (R['bottom'] - R['top']) / Hm
    # yansıtma UV katmanı (köşe başına -> döngü başına)
    uv = m.uv_layers.new(name='proj')
    gi = {g.index: g.name for g in me.vertex_groups}
    col = m.color_attributes.new('reg', 'FLOAT_COLOR', 'POINT'); armw = m.color_attributes.new('armm', 'FLOAT_COLOR', 'POINT')
    def bone_of(v):
        best, bw = '', 0
        for g in v.groups:
            if g.weight > bw: bw = g.weight; best = gi.get(g.group, '')
        return best
    C = dict(felt=(.88, .85, .78), gold=(.78, .58, .24), skin=(.78, .56, .42), hair=(.1, .07, .05), blue=(.13, .24, .55), red=(.6, .08, .06), navy=(.08, .1, .24), boot=(.55, .13, .08), cream=(.85, .8, .68))
    for i, v in enumerate(m.vertices):
        p = vs[i]; z = p.z - zmin; b = bone_of(v)
        armish = any(s in b for s in ('Arm', 'Hand', 'Shoulder'))
        if 'Hand' in b: c = C['skin']
        elif armish: c = C['blue']
        elif z > 1.585: c = C['felt']
        elif z > 1.48: c = C['gold'] if p.y < -.02 else C['felt']
        elif z > 1.38: c = (C['skin'] if p.y < .02 else C['felt'] if p.y > .05 else C['hair'])
        elif z > 1.11: c = C['cream'] if (abs(p.x) < .05 and p.y < 0) else C['blue']
        elif z > 1.0: c = C['red']
        elif z > .33: c = C['red'] if (p.x > .05 and p.y < -.05 and z > .45) else C['blue']
        elif z > .27: c = C['navy']
        else: c = C['boot']
        col.data[i].color = (*c, 1)
        armw.data[i].color = (1, 1, 1, 1) if armish else (0, 0, 0, 1)
    for poly in m.polygons:
        for li in poly.loop_indices:
            vi = m.loops[li].vertex_index; p = vs[vi]
            px = R['cx'] + p.x * k; py = R['top'] + (zmax - p.z) * k
            uv.data[li].uv = (px / W, 1 - py / Hpx)
    # malzeme: öne bakan, kol olmayan yerlerde resim; diğer yerlerde bölge rengi + kumaş dokusu
    mt = bpy.data.materials.new('meshy'); mt.use_nodes = True; nt = mt.node_tree; L = nt.links.new
    bsdf = nt.nodes['Principled BSDF']; bsdf.inputs['Roughness'].default_value = .7
    ti = nt.nodes.new('ShaderNodeTexImage'); ti.image = img; ti.extension = 'EXTEND'
    uvn = nt.nodes.new('ShaderNodeUVMap'); uvn.uv_map = 'proj'; L(uvn.outputs[0], ti.inputs[0])
    reg = nt.nodes.new('ShaderNodeVertexColor'); reg.layer_name = 'reg'
    am = nt.nodes.new('ShaderNodeVertexColor'); am.layer_name = 'armm'
    tc = nt.nodes.new('ShaderNodeTexCoord'); sep = nt.nodes.new('ShaderNodeSeparateXYZ'); L(tc.outputs['Normal'], sep.inputs[0])
    # öne bakış: normal.y < -0.25 -> 1  (model −Y'ye bakıyor; nesne uzayı)
    mr = nt.nodes.new('ShaderNodeMapRange'); mr.inputs['From Min'].default_value = -.15; mr.inputs['From Max'].default_value = -.55
    L(sep.outputs['Y'], mr.inputs['Value'])
    inv = nt.nodes.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1; L(am.outputs['Color'], inv.inputs[1])
    mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; L(mr.outputs['Result'], mul.inputs[0]); L(inv.outputs[0], mul.inputs[1])
    mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; L(mul.outputs[0], mix.inputs['Factor']); L(reg.outputs['Color'], mix.inputs[6]); L(ti.outputs['Color'], mix.inputs[7])
    nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = 60; L(tc.outputs['Object'], nz.inputs['Vector'])
    rp = nt.nodes.new('ShaderNodeValToRGB'); rp.color_ramp.elements[0].color = (.82, .82, .82, 1); L(nz.outputs['Fac'], rp.inputs['Fac'])
    m2 = nt.nodes.new('ShaderNodeMix'); m2.data_type = 'RGBA'; m2.blend_type = 'MULTIPLY'; m2.inputs['Factor'].default_value = 1; L(mix.outputs[2], m2.inputs[6]); L(rp.outputs['Color'], m2.inputs[7])
    ao = nt.nodes.new('ShaderNodeAmbientOcclusion'); ao.inputs['Distance'].default_value = .1
    ar = nt.nodes.new('ShaderNodeValToRGB'); ar.color_ramp.elements[0].color = (.45, .42, .4, 1); L(ao.outputs['AO'], ar.inputs['Fac'])
    m3 = nt.nodes.new('ShaderNodeMix'); m3.data_type = 'RGBA'; m3.blend_type = 'MULTIPLY'; m3.inputs['Factor'].default_value = 1; L(m2.outputs[2], m3.inputs[6]); L(ar.outputs['Color'], m3.inputs[7])
    L(m3.outputs[2], bsdf.inputs['Base Color'])
    bp = nt.nodes.new('ShaderNodeBump'); bp.inputs['Strength'].default_value = .15; L(nz.outputs['Fac'], bp.inputs['Height']); L(bp.outputs['Normal'], bsdf.inputs['Normal'])
    # takım maskesi: kırmızı alanlar (kuşak, çizme) -> takım rengi
    rgb = nt.nodes.new('ShaderNodeSeparateColor'); L(mix.outputs[2], rgb.inputs[0])
    d1 = nt.nodes.new('ShaderNodeMath'); d1.operation = 'SUBTRACT'; L(rgb.outputs[0], d1.inputs[0]); L(rgb.outputs[1], d1.inputs[1])
    tm = nt.nodes.new('ShaderNodeMapRange'); tm.inputs['From Min'].default_value = .18; tm.inputs['From Max'].default_value = .3; L(d1.outputs[0], tm.inputs['Value'])
    em = nt.nodes.new('ShaderNodeEmission'); em.name = 'mask_em'; L(tm.outputs['Result'], em.inputs['Color'])
    mt['team'] = 0
    me.data.materials.clear(); me.data.materials.append(mt)
    return mt


ROOT = [None]


def bone_rot(arm, name, axis, deg):
    """Kemiği karakterin kendi ekseni etrafında (+X ileri, +Z yukarı, −Y sağ), başı merkez alarak döndür."""
    pb = arm.pose.bones.get('mixamorig:' + name)
    if not pb: return
    bpy.context.view_layer.update()
    ax = ROOT[0].matrix_world.to_3x3() @ Vector(axis)
    mw = arm.matrix_world; M = mw @ pb.matrix; h = M.translation.copy()
    R = Matrix.Translation(h) @ Matrix.Rotation(math.radians(deg), 4, ax) @ Matrix.Translation(-h)
    pb.matrix = mw.inverted() @ (R @ M); bpy.context.view_layer.update()


def build(glb, look, ref):
    reset(); S = units.mats()
    arm, me = load(glb)
    R = REF[look]
    paint(me, arm, ref, R)
    root = joint('root'); ROOT[0] = root; s = R['H'] / me.dimensions.z
    arm.parent = root; arm.scale = (arm.scale[0] * s,) * 3; arm.rotation_euler.z += PI / 2
    # en durgun kare: ayakların en yakın olduğu yürüyüş karesi
    act_ = arm.animation_data.action; lf, rf = arm.pose.bones['mixamorig:LeftFoot'], arm.pose.bones['mixamorig:RightFoot']
    a, b = act_.frame_range; best = (9, a)
    for fr in range(int(a), int(b) + 1):
        bpy.context.scene.frame_set(fr); d = ((arm.matrix_world @ lf.head) - (arm.matrix_world @ rf.head)).length
        if d < best[0]: best = (d, fr)
    arm['idlef'] = best[1]
    # tüfek 1: sağ elde dik taşınır
    g = joint('gunhand', (0, 0, 0)); g.parent = arm; g.parent_type = 'BONE'; g.parent_bone = 'mixamorig:RightHand'
    bpy.context.view_layer.update()
    k = 1 / (arm.scale[0])
    gun = units.musket(g, S); gun.scale = (k * .95,) * 3; gun.rotation_euler = (-PI / 2, 0, 0); gun.location = (0, -.02 * k, 0)
    # tüfek 2: nişan alırken omuzdan ileri
    aim = joint('gunaim', (.16, -.13, 1.18), root); aim.rotation_euler = (0, -PI / 2 + .05, 0)
    units.musket(aim, S).scale = (.95, .95, .95)
    return root, arm, me, S


def show(name, on):
    o = bpy.data.objects[name]
    for c in [o] + list(o.children_recursive):
        c.hide_render = not on


def pose_frame(arm, act, f, nwalk):
    act_ = arm.get('act') or arm.animation_data.action
    sc = bpy.context.scene
    arm.animation_data.action = act_
    for pb in arm.pose.bones:
        pb.rotation_quaternion = (1, 0, 0, 0); pb.location = (0, 0, 0)
    show('gunhand', act != 'atk'); show('gunaim', act == 'atk')
    if act == 'walk':
        a, b = act_.frame_range; sc.frame_set(int(a + (b - a) * f / nwalk)); return
    sc.frame_set(int(arm['idlef']))
    if act != 'atk':
        return
    # nişan pozu: bu karedeki pozu sabitleyip kolları tüfeğe götür
    bpy.context.view_layer.update()
    mats = {pb.name: pb.matrix.copy() for pb in arm.pose.bones}
    arm.animation_data.action = None
    for pb in arm.pose.bones:
        pb.matrix = mats[pb.name]; bpy.context.view_layer.update()
    t = [0, 1, .7, .35, .15, 0][f]   # geri tepme
    ROOT[0].children[0]
    bpy.data.objects['gunaim'].location.x = .16 - .06 * t
    bone_rot(arm, 'RightArm', (0, 1, 0), -48); bone_rot(arm, 'RightArm', (0, 0, 1), 18)
    bone_rot(arm, 'RightForeArm', (0, 1, 0), -75); bone_rot(arm, 'RightForeArm', (0, 0, 1), 50)
    bone_rot(arm, 'LeftArm', (0, 1, 0), -78); bone_rot(arm, 'LeftArm', (0, 0, 1), -28)
    bone_rot(arm, 'LeftForeArm', (0, 1, 0), -12); bone_rot(arm, 'LeftForeArm', (0, 0, 1), -18)
    bone_rot(arm, 'Spine2', (0, 1, 0), 4 * t)


def render_unit(glb, look, ref, outdir, test=False):
    root, arm, me, S = build(glb, look, ref)
    act_ = arm.animation_data.action
    fs = units.FRAME.get(look, 154)
    setup_scene(fs, fs, units.USCALE, target=(0, 0, .45), samples=int(os.environ.get('SAMPLES', 24))); units.rim_light()
    bpy.context.scene.render.resolution_percentage = 100
    os.makedirs(os.path.join(outdir, look), exist_ok=True)
    jobs = [(d, a, f) for d in (range(8) if not test else [1, 3]) for (a, f) in units.frames() if not test or (a, f) in [('idle', 0), ('walk', 2), ('atk', 2), ('dead', 0)]]
    for mask in (False, True):
        mask_mode(mask)
        bpy.context.scene.render.resolution_percentage = 100 if mask else int(units.SS * 100)
        for (d, act, f) in jobs:
            root.rotation_euler = (0, 0, PI / 2 - d * PI / 4); root.location.z = 0
            arm['act'] = act_
            pose_frame(arm, act, f, 8)
            if act == 'dead':
                root.rotation_euler.x = PI / 2 * .97; root.location.z = .16
            bpy.context.view_layer.update()
            path = os.path.join(outdir, look, '%d_%s_%d%s.png' % (d, act, f, '_m' if mask else ''))
            render_to(path)
            if not mask and units.SS > 1:
                units.sharpen_down(path, fs)


if __name__ == '__main__':
    a = [x for x in sys.argv[1:] if not x.startswith('-')]
    render_unit(a[0], a[1], a[2], a[3], test='--test' in sys.argv)
