"""Meshy'den gelen dokulu bina/nesne GLB'lerini oyunun statik sprite'larına çevirir.
Kullanım: python3 meshy_static.py <çıktı_klasörü> [isim ...]
Takım maskesi: yalnızca koyu kırmızı (bayrak/sancak) alanlar; kiremit turuncusu hariç.
"""
import bpy, bmesh, math, os, sys, json
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *
import statics
from mathutils import Vector

M1 = '/home/user/Claude/rts/assets/models/'
M2 = '/home/user/Claude/rts/assets/models2/'
# isim: (dosya, kare sayısı, ölçek payı, ek)
SRC = {
    'ayasofya': (M1 + '01a10087-f365-75c0-9472-d869d8b4b6ee/Meshy_AI_model.glb', 5, .98, None),
    'ayasofya_cap': (M1 + '01a10087-f365-75c0-9472-d869d8b4b6ee/Meshy_AI_model.glb', 5, .98, 'minarets'),
    'hisar': (M1 + '01a10088-f5fd-77da-b997-713acc4cfd2a/Meshy_AI_model.glb', 4, .98, None),
    'sur': (M1 + '01a10088-2a51-7721-9926-bd5c7779d0bb/Meshy_AI_model.glb', 1, 1.0, 'wallcut'),
    'burc': (M1 + '01a1008a-2225-7224-855a-6ce2128f97af/Meshy_AI_model.glb', 2, .98, None),
    'kale': (M1 + '01a1008a-5182-72bb-b9e8-9f9933c1a3f7/Meshy_AI_model.glb', 4, .98, None),
    'kapi': (M1 + '01a1008a-7fc7-727b-bfb4-509da44252f8/Meshy_AI_model.glb', 1, 1.15, None),
    'pazar': (M1 + '01a1008a-ade5-72c2-80ad-151d664a67d6/Meshy_AI_model.glb', 3, .98, None),
    'medrese': (M1 + '01a1008a-ed82-700c-bd23-b6f95905316b/Meshy_AI_model.glb', 3, .98, None),
    'cami': (M1 + '01a1008b-1a0b-7609-994b-cd7be1e933a5/Meshy_AI_model.glb', 3, .98, None),
    'kule': (M1 + '01a1008b-4426-7486-88ec-18753ce66d24/Meshy_AI_model.glb', 2, .98, None),
    'kamp': (M1 + '01a1008d-f534-755a-9cec-24996871d982/Meshy_AI_model.glb', 3, .98, None),
    'kisla': (M1 + '01a1008e-21e9-7702-b5cb-048ef12e13e7/Meshy_AI_model.glb', 3, .98, None),
    'dokum': (M1 + '01a1008e-429f-7008-9b36-8b541d6cfa71/Meshy_AI_model.glb', 3, .98, None),
    'ahir': (M1 + '01a1008e-61c9-725e-985c-a85fe9fbdb08/Meshy_AI_model.glb', 3, .98, None),
    'demirhane': (M1 + '01a1008e-7e33-77cb-b9be-f7d63b1883d2/Meshy_AI_model.glb', 3, .98, None),
    'tersane': (M1 + '01a1008e-a425-766f-bfa3-1b8375ef5ad2/Meshy_AI_model.glb', 3, .98, None),
    'tarla': (M1 + '01a1008e-c9ee-77f7-8af1-86a492340da2/Meshy_AI_model.glb', 2, .98, None),
    'ev': (M1 + '01a1008e-eb03-7722-8da8-bfcc2dc6fd31/Meshy_AI_model.glb', 2, .98, None),
    'saray': (M1 + '01a1008f-104a-71f0-b689-717ba6e1e0d7/Meshy_AI_model.glb', 3, .98, None),
    'ambar': (M1 + '01a100ae-792b-7376-adf4-b214592e2bac/Meshy_AI_model.glb', 2, .98, None),
    'ocak': (M1 + 'Meshy_AI_Ottoman_Barracks_1003072903_texture.glb', 3, .98, None),
}


def team_mask_nodes(m):
    """Doku rengi koyu kırmızıysa (yeşil/kırmızı oranı küçük) maske=1."""
    nt = m.node_tree; L = nt.links.new
    b = nt.nodes.get('Principled BSDF')
    if not b or not b.inputs['Base Color'].is_linked: return
    src = b.inputs['Base Color'].links[0].from_socket
    sep = nt.nodes.new('ShaderNodeSeparateColor'); L(src, sep.inputs[0])
    eps = nt.nodes.new('ShaderNodeMath'); eps.operation = 'ADD'; eps.inputs[1].default_value = .002; L(sep.outputs[0], eps.inputs[0])
    gm = nt.nodes.new('ShaderNodeMath'); gm.operation = 'MAXIMUM'; L(sep.outputs[1], gm.inputs[0]); L(sep.outputs[2], gm.inputs[1])
    ratio = nt.nodes.new('ShaderNodeMath'); ratio.operation = 'DIVIDE'; L(gm.outputs[0], ratio.inputs[0]); L(eps.outputs[0], ratio.inputs[1])
    r1 = nt.nodes.new('ShaderNodeMapRange'); r1.inputs['From Min'].default_value = float(os.environ.get('RMAX', .11)); r1.inputs['From Max'].default_value = float(os.environ.get('RMIN', .06)); L(ratio.outputs[0], r1.inputs['Value'])
    r2 = nt.nodes.new('ShaderNodeMapRange'); r2.inputs['From Min'].default_value = .05; r2.inputs['From Max'].default_value = .1; L(sep.outputs[0], r2.inputs['Value'])
    mul = nt.nodes.new('ShaderNodeMath'); mul.operation = 'MULTIPLY'; L(r1.outputs['Result'], mul.inputs[0]); L(r2.outputs['Result'], mul.inputs[1])
    em = nt.nodes.new('ShaderNodeEmission'); em.name = 'mask_em'; L(mul.outputs[0], em.inputs['Color'])
    m['team'] = 0


def brighten(m):
    """Meshy dokuları koyu: metalikliği kapat, rengi aç."""
    nt = m.node_tree; b = nt.nodes.get('Principled BSDF')
    if not b: return
    for l in list(b.inputs['Metallic'].links): nt.links.remove(l)
    b.inputs['Metallic'].default_value = 0
    if b.inputs['Base Color'].is_linked:
        src = b.inputs['Base Color'].links[0].from_socket
        mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 1
        v = float(os.environ.get('BRIGHT', 1.6)); mx.inputs[7].default_value = (v, v, v, 1)
        nt.links.new(src, mx.inputs[6]); nt.links.new(mx.outputs[2], b.inputs['Base Color'])


def warm(m):
    """Boyalı görünüm: ortam kapanması ile girintileri koyulaştır."""
    nt = m.node_tree; L = nt.links.new; b = nt.nodes.get('Principled BSDF')
    if not b or not b.inputs['Base Color'].is_linked: return
    src = b.inputs['Base Color'].links[0].from_socket
    ao = nt.nodes.new('ShaderNodeAmbientOcclusion'); ao.inputs['Distance'].default_value = .08
    rp = nt.nodes.new('ShaderNodeValToRGB'); rp.color_ramp.elements[0].color = (.72, .68, .66, 1); L(ao.outputs['AO'], rp.inputs['Fac'])
    mx = nt.nodes.new('ShaderNodeMix'); mx.data_type = 'RGBA'; mx.blend_type = 'MULTIPLY'; mx.inputs['Factor'].default_value = 1
    L(src, mx.inputs[6]); L(rp.outputs['Color'], mx.inputs[7]); L(mx.outputs[2], b.inputs['Base Color'])
    if 'Roughness' in b.inputs and not b.inputs['Roughness'].is_linked: b.inputs['Roughness'].default_value = .8


def load_model(path, n, pad, extra):
    if path.endswith('.fbx'): bpy.ops.import_scene.fbx(filepath=path)
    else: bpy.ops.import_scene.gltf(filepath=path)
    ms = [o for o in bpy.data.objects if o.type == 'MESH']
    for o in ms:
        o.select_set(True)
    bpy.context.view_layer.objects.active = ms[0]
    if len(ms) > 1: bpy.ops.object.join()
    o = bpy.context.view_layer.objects.active
    for p in list(o.children_recursive): p.parent = None
    o.parent = None
    bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
    if extra == 'wallcut':   # uzun duvarın ortasından kare bir parça kes
        vs = [v.co for v in o.data.vertices]; xs = [v.x for v in vs]; ys = [v.y for v in vs]
        long_x = (max(xs) - min(xs)) > (max(ys) - min(ys))
        th = (max(ys) - min(ys)) if long_x else (max(xs) - min(xs)); mid = ((max(xs) + min(xs)) / 2) if long_x else ((max(ys) + min(ys)) / 2)
        mid -= .12 * (max(xs) - min(xs) if long_x else max(ys) - min(ys))   # uçtaki kuleden uzak
        bm = bmesh.new(); bm.from_mesh(o.data)
        ax = Vector((1, 0, 0)) if long_x else Vector((0, 1, 0))
        for sgn in (-1, 1):
            c = ax * (mid + sgn * th / 2)
            geom = bm.verts[:] + bm.edges[:] + bm.faces[:]
            bmesh.ops.bisect_plane(bm, geom=geom, plane_co=c, plane_no=ax * sgn, clear_outer=True)
        bm.to_mesh(o.data); bm.free(); o.data.update()
    vs = [o.matrix_world @ v.co for v in o.data.vertices]
    mn = Vector((min(v.x for v in vs), min(v.y for v in vs), min(v.z for v in vs))); mx = Vector((max(v.x for v in vs), max(v.y for v in vs), max(v.z for v in vs)))
    s = n * pad / max(mx.x - mn.x, mx.y - mn.y)
    o.location = (-(mn.x + mx.x) / 2 * s, -(mn.y + mx.y) / 2 * s, -mn.z * s); o.scale = (s, s, s)
    bpy.context.view_layer.update()
    for m in o.data.materials:
        if m and m.use_nodes:
            brighten(m); warm(m); team_mask_nodes(m)
    return o, (mx.z - mn.z) * s


def add_minarets(n, S):
    h = 3.4
    for (x, y) in ((1, 1), (1, -1), (-1, 1), (-1, -1)):
        x *= n * .47; y *= n * .47
        cyl(.13, h, (x, y, h / 2), S['white'], v=16); cyl(.18, .07, (x, y, h * .72), S['white'], v=16)
        cyl(.13, .7, (x, y, h + .35), S['lead'], r2=0, v=16); cyl(.012, .25, (x, y, h + .82), S['gold'])


def render_one(name, outdir):
    path, n, pad, extra = SRC[name]
    reset(); S = statics.mats()
    o, hgt = load_model(path, n, pad, extra)
    if extra == 'minarets':
        add_minarets(n, S); hgt = max(hgt, 4.6)
    SCALE = statics.SCALE; px = PX_PER_UNIT * SCALE; margin = 70
    res_x = int(n * 64 * SCALE + margin * 2 + 60); ground_half = n * 16 * SCALE
    top = hgt * math.cos(math.radians(30)) * px + ground_half; res_y = int(top + ground_half + margin + 30)
    anchor_y = top + 30; off = anchor_y - res_y / 2
    # sahneyi kurmak her şeyi silmesin: setup_scene yalnızca ışık/kamera ekler
    setup_scene(res_x, res_y, SCALE, target=(0, 0, 0), samples=int(os.environ.get('SAMPLES', 32)))
    bpy.context.scene.camera.data.shift_y = off / res_x
    os.makedirs(outdir, exist_ok=True)
    mask_mode(False); render_to(os.path.join(outdir, name + '.png'))
    mask_mode(True); render_to(os.path.join(outdir, name + '_m.png'))
    json.dump(dict(ax=res_x / 2, ay=anchor_y, scale=SCALE, n=n), open(os.path.join(outdir, name + '.json'), 'w'))


if __name__ == '__main__':
    a = [x for x in sys.argv[1:] if not x.startswith('-')]
    for nm in (a[1:] or list(SRC)):
        render_one(nm, a[0]); print('DONE', nm, flush=True)
