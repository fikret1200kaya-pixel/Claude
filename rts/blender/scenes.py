"""FATİH — Menü ve brifing için sinematik sahneler (perspektif, gerçekçi gökyüzü).
Kullanım: python3 scenes.py <çıktı_klasörü> [menu|camp ...]
"""
import bpy, math, os, sys, random
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *
import statics, units
from mathutils import Vector

PI = math.pi


PROTOS = {}


def proto(key, fn):
    """Modeli bir kez kurar, tek bir ağa (mesh) birleştirir; kopyalar bu ağı paylaşır."""
    import bmesh
    if key in PROTOS:
        return PROTOS[key]
    before = set(bpy.data.objects)
    fn()
    bpy.context.view_layer.update()
    new = [o for o in bpy.data.objects if o not in before]
    dg = bpy.context.evaluated_depsgraph_get()
    mats, bm = [], bmesh.new()
    for o in new:
        if o.type != 'MESH':
            continue
        me = bpy.data.meshes.new_from_object(o.evaluated_get(dg)); me.transform(o.matrix_world)
        remap = []
        for m in me.materials:
            if m not in mats:
                mats.append(m)
            remap.append(mats.index(m))
        for p in me.polygons:
            p.material_index = remap[p.material_index] if remap else 0
        bm.from_mesh(me); bpy.data.meshes.remove(me)
    out = bpy.data.meshes.new(key); bm.to_mesh(out); bm.free()
    for m in mats:
        out.materials.append(m)
    for o in new:
        bpy.data.objects.remove(o, do_unlink=True)
    PROTOS[key] = out
    return out


def place(fn, loc, s=1., rot=0., key=None):
    me = proto(key or fn.__name__, fn)
    o = bpy.data.objects.new(me.name, me); bpy.context.collection.objects.link(o)
    o.location = loc; o.rotation_euler = (0, 0, rot); o.scale = (s, s, s)
    return o


def sun(el, rot, energy, color, strength=1.):
    sky(el, rot, strength)
    d = Vector((math.sin(math.radians(rot)) * math.cos(math.radians(el)), math.cos(math.radians(rot)) * math.cos(math.radians(el)), math.sin(math.radians(el))))
    bpy.ops.object.light_add(type='SUN'); L = bpy.context.object; L.rotation_euler = d.to_track_quat('Z', 'Y').to_euler()
    L.data.energy = energy; L.data.color = color; L.data.angle = math.radians(1.5)


def sky(sun_elev, sun_rot, strength=1.):
    sc = bpy.context.scene
    if sc.world is None:
        sc.world = bpy.data.worlds.new('w')
    w = sc.world; w.use_nodes = True; nt = w.node_tree; nt.nodes.clear()
    out = nt.nodes.new('ShaderNodeOutputWorld'); bg = nt.nodes.new('ShaderNodeBackground'); sk = nt.nodes.new('ShaderNodeTexSky')
    sk.sky_type = 'NISHITA'; sk.sun_elevation = math.radians(sun_elev); sk.sun_rotation = math.radians(sun_rot)
    sk.air_density = 1.2; sk.dust_density = 3.5; sk.ozone_density = 1.
    bg.inputs['Strength'].default_value = strength
    nt.links.new(sk.outputs[0], bg.inputs[0]); nt.links.new(bg.outputs[0], out.inputs[0])


def sea(size=400, z=0.):
    m = bpy.data.materials.new('sea'); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (.02, .06, .08, 1); b.inputs['Roughness'].default_value = .06
    nt = m.node_tree; wv = nt.nodes.new('ShaderNodeTexWave'); wv.inputs['Scale'].default_value = 1.2; wv.inputs['Distortion'].default_value = 6; wv.inputs['Detail'].default_value = 4
    tc = nt.nodes.new('ShaderNodeTexCoord'); mp = nt.nodes.new('ShaderNodeMapping'); mp.inputs['Scale'].default_value = (1, 6, 1)
    nt.links.new(tc.outputs['Object'], mp.inputs[0]); nt.links.new(mp.outputs[0], wv.inputs[0])
    bm = nt.nodes.new('ShaderNodeBump'); bm.inputs['Strength'].default_value = .12; nt.links.new(wv.outputs['Fac'], bm.inputs['Height']); nt.links.new(bm.outputs[0], b.inputs['Normal'])
    bpy.ops.mesh.primitive_plane_add(size=size, location=(0, 0, z)); o = bpy.context.object; o.data.materials.append(m)
    return o


def ground(verts_fn, size, res, mat, loc=(0, 0, 0)):
    bpy.ops.mesh.primitive_grid_add(x_subdivisions=res, y_subdivisions=res, size=size, location=loc); o = bpy.context.object
    for v in o.data.vertices:
        v.co.z = verts_fn(v.co.x + loc[0], v.co.y + loc[1])
    for p in o.data.polygons:
        p.use_smooth = True
    o.data.materials.append(mat); return o


def boat(S, sail=True):
    hull = M('hull', (.18, .1, .05), .6, noise=20, nf=.3)
    ball(1, (0, 0, .25), hull, sc=(2.5, .42, .38), seg=24)
    box(4.4, .78, .06, (0, 0, .42), hull)
    cyl(.06, 1.2, (2.6, 0, .75), hull, rot=(0, -.9, 0), v=6)
    for k in range(-3, 4):
        cyl(.03, 1.6, (k * .5, .55, .1), hull, rot=(PI / 2.6, 0, 0), v=4); cyl(.03, 1.6, (k * .5, -.55, .1), hull, rot=(-PI / 2.6, 0, 0), v=4)
    if sail:
        cyl(.05, 3.6, (.3, 0, 2.1), hull, v=6)
        mesh([(0, 0, 0), (0, 0, 3.0), (1.7, 0, .6)], [(0, 1, 2)], S['white'], loc=(.35, .02, .9))
        cyl(.03, 1.0, (.3, 0, 4.1), hull, v=4); mesh([(0, 0, 0), (0, .9, -.1), (0, 0, -.5)], [(0, 1, 2)], S['red'], loc=(.3, 0, 4.45))


def cam_at(loc, target, lens=35):
    bpy.ops.object.camera_add(location=loc); c = bpy.context.object
    c.rotation_euler = (Vector(target) - Vector(loc)).to_track_quat('-Z', 'Y').to_euler(); c.data.lens = lens; c.data.clip_end = 2000
    bpy.context.scene.camera = c; return c


def render_setup(w, h, samples):
    if os.environ.get('FAST'):
        w, h, samples = w // 3, h // 3, 12
    sc = bpy.context.scene
    sc.render.engine = 'CYCLES'; sc.cycles.samples = samples; sc.cycles.device = 'CPU'; sc.cycles.use_denoising = True
    sc.render.resolution_x = w; sc.render.resolution_y = h; sc.render.film_transparent = False
    sc.view_settings.view_transform = 'AgX'; sc.view_settings.look = 'AgX - Punchy'; sc.view_settings.exposure = 0
    sc.render.image_settings.file_format = 'JPEG'; sc.render.image_settings.quality = 88
    sc.cycles.max_bounces = 4


def mist(sc, start, depth, col=(1, .7, .45), dens=.035):
    """hacimsiz sis: dünya hacmi (atmosfer derinliği)"""
    w = sc.world.node_tree; vs = w.nodes.new('ShaderNodeVolumeScatter')
    if not w.nodes.get('World Output'):
        w.nodes[0].name = 'World Output'; vs.inputs['Density'].default_value = dens * .02; vs.inputs['Color'].default_value = (*col, 1)
    w.links.new(vs.outputs[0], w.nodes['World Output'].inputs['Volume'])


# ------------------------------------------------------------ sahne 1: İstanbul, gün batımı
def scene_menu(out):
    reset(); PROTOS.clear(); S = statics.mats(); US = units.mats()
    sun(2.2, 12, 3.2, (1, .55, .28), .9)
    sea(800, 0)
    land = M('land', (.22, .2, .12), .9, noise=2, nf=.5)
    hill = lambda x, y: max(-.5, (1.6 + 2.2 * math.exp(-((x - 4) ** 2) / 900) + .7 * math.sin(x * .07) + .4 * math.sin(x * .19 + 1)) * min(1, max(0, (y - 2) / 6)) - .3)
    ground(hill, 160, 120, land, (0, 60, 0))
    # sahil surları
    for i in range(-30, 31):
        place(lambda: statics.b_sur(S, False), (i * 1.0, 3.2, 0), 1., key='sur')
    for i in range(-30, 31, 6):
        place(lambda: statics.b_burc(S, False), (i, 3.4, 0), 1., key='burc')
    # Ayasofya ve camiler tepede
    place(lambda: statics.b_ayasofya(S, True), (-2, 18, 1.6), 1.9, .15, key='aya_c')
    place(lambda: statics.b_cami(S, False), (16, 24, 2.2), 1.6, -.2, key='cami')
    place(lambda: statics.b_cami(S, False), (-24, 26, 2.4), 1.4, .3, key='cami')
    place(lambda: statics.b_saray(S, False), (30, 14, 1.4), 1.3, .1, key='saray')
    rnd = random.Random(7)
    for k in range(70):
        x = rnd.uniform(-45, 45); y = rnd.uniform(7, 34)
        if abs(x + 2) < 7 and abs(y - 18) < 7:
            continue
        z = hill(x, y)
        place(lambda: statics.b_ev(S, False), (x, y, z - .05), rnd.uniform(.8, 1.2), rnd.uniform(-.3, .3), key='ev')
    for k in range(40):
        x = rnd.uniform(-45, 45); y = rnd.uniform(6, 34)
        place(lambda v=k: statics.n_tree(S, 5 if v % 3 else 2), (x, y, hill(x, y) - .05), rnd.uniform(.9, 1.4), key='tree%d' % (5 if k % 3 else 2))
    # kadırgalar
    for (x, y, r) in ((-16, -4, .2), (10, -9, -.4), (26, -3, .6), (-36, -2, -.1)):
        place(lambda: boat(US), (x, y, 0), 1.2, r, key='boat')
    sc = bpy.context.scene
    cam_at((-10, -30, 3.0), (0, 18, 7.5), 40)
    render_setup(1920, 1080, 96)
    sc.render.filepath = os.path.join(out, 'menu_bg.jpg'); bpy.ops.render.render(write_still=True)


# ------------------------------------------------------------ sahne 2: surlar önünde ordugâh, şafak
def scene_camp(out):
    reset(); PROTOS.clear(); S = statics.mats(); US = units.mats()
    sun(5, -18, 3.4, (1, .62, .35), .9)
    dirt = M('dirt', (.28, .22, .13), .95, noise=3, nf=.5)
    ground(lambda x, y: .25 * math.sin(x * .3) * math.sin(y * .23) + (max(0, y - 30) * .05), 220, 140, dirt, (0, 40, 0))
    # surlar arkada
    for i in range(-25, 26):
        place(lambda: statics.b_sur(S, False), (i * 1.6, 34, 0), 1.6, key='sur')
    for i in range(-40, 41, 8):
        place(lambda: statics.b_burc(S, False), (i, 34.6, 0), 1.7, key='burc')
    place(lambda: statics.b_kapi(S, False), (2, 34, 0), 1.6, key='kapi')
    place(lambda: statics.b_ayasofya(S, False), (6, 52, 2.0), 2.4, key='aya')
    # çadırlar
    rnd = random.Random(3)
    for k in range(16):
        x = rnd.uniform(-28, 30); y = rnd.uniform(-6, 14)
        if abs(x) < 6 and y < 6:
            continue
        place(lambda: statics.b_kamp(S, False), (x, y, 0), rnd.uniform(.9, 1.3), rnd.uniform(0, 6), key='kamp')
    # toplar ve askerler
    def unit(look, x, y, rot, s=1.):
        def f():
            r = joint('r'); J, kind = units.build(look, r, US); units.pose(look, kind, J, 'idle', 0, r)
        place(f, (x, y, 0), s, rot, key='u_' + look)
    for x in (-10, -5, 0, 5, 10):
        unit('sahi' if x == 0 else 'top', x, 22, PI / 2, 1.3)
    for row in range(3):
        for k in range(14):
            unit('yeniceri', -9 + k * 1.3, 17 - row * 1.3, PI / 2)
    for k in range(10):
        unit('sipahi', -22 + k * 1.9, 14, PI / 2 + .1)
    unit('fatih', 2.6, 3.2, PI / 2 + .5, 1.15)
    for (x, y) in ((-1, 7), (3, 7.5)):
        unit('azap', x, y, PI / 2)
    sc = bpy.context.scene
    # takım rengini kırmızı yap
    for m in bpy.data.materials:
        if m.get('team') and m.use_nodes:
            b = m.node_tree.nodes.get('Principled BSDF')
            if b and not b.inputs['Base Color'].is_linked:
                b.inputs['Base Color'].default_value = (.55, .06, .04, 1)
            elif b:
                for n in m.node_tree.nodes:
                    if n.type == 'MIX':
                        n.inputs[6].default_value = (.55, .06, .04, 1)
    cam_at((9, -7, 2.3), (-1, 22, 4.2), 34)
    render_setup(1920, 1080, 96)
    sc.render.filepath = os.path.join(out, 'camp_bg.jpg'); bpy.ops.render.render(write_still=True)


if __name__ == '__main__':
    args = [a for a in sys.argv[1:] if not a.startswith('-')]
    out = args[0] if args else '.'
    for nm in (args[1:] or ['menu', 'camp']):
        {'menu': scene_menu, 'camp': scene_camp}[nm](out); print('DONE', nm, flush=True)
