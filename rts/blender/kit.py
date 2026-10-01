"""FATİH — Blender yardımcıları: malzeme, ilkel parçalar, izometrik kamera, render.

Oyun projeksiyonu: ekran = (x - y, (x + y)/2 - z), 1 kare = 32 px.
Blender'da 1 birim = 1 kare. Kamera (+X,+Y) yönünden 30° yükseklikte bakar,
böylece +X sağ-aşağı, +Y sol-aşağı gider (oyunla aynı eksenler).
"""
import bpy, math, os
from mathutils import Vector

PX_PER_UNIT = 32 / math.cos(math.radians(45))   # 1x ölçek: 45.25 px / birim (yatay)
MATS = {}
SKIN = None


def reset():
    bpy.ops.wm.read_factory_settings(use_empty=True)
    MATS.clear()


def _link(nt, a, b):
    nt.links.new(a, b)


def M(name, col, rough=.7, metal=0., brick=None, noise=0., emit=None, stripes=None, team=False, nf=.45):
    """Principled malzeme. brick: tuğla ölçeği, noise: kir/doku ölçeği, stripes: (renk2, ölçek)."""
    if name in MATS:
        return MATS[name]
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    nt = m.node_tree
    b = nt.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1)
    b.inputs['Roughness'].default_value = rough
    b.inputs['Metallic'].default_value = metal
    if emit:
        b.inputs['Emission Color'].default_value = (*emit, 1)
        b.inputs['Emission Strength'].default_value = 6
    color_out = None
    if brick or noise or stripes:
        tc = nt.nodes.new('ShaderNodeTexCoord')
        sep = nt.nodes.new('ShaderNodeSeparateXYZ'); _link(nt, tc.outputs['Object'], sep.inputs[0])
        add = nt.nodes.new('ShaderNodeMath'); add.operation = 'ADD'
        _link(nt, sep.outputs[0], add.inputs[0]); _link(nt, sep.outputs[1], add.inputs[1])
        comb = nt.nodes.new('ShaderNodeCombineXYZ'); _link(nt, add.outputs[0], comb.inputs[0]); _link(nt, sep.outputs[2], comb.inputs[1])
        if brick:
            br = nt.nodes.new('ShaderNodeTexBrick'); _link(nt, comb.outputs[0], br.inputs['Vector'])
            br.inputs['Color1'].default_value = (*col, 1)
            br.inputs['Color2'].default_value = (*[c * .82 for c in col], 1)
            br.inputs['Mortar'].default_value = (*[c * .5 for c in col], 1)
            br.inputs['Scale'].default_value = brick
            br.inputs['Mortar Size'].default_value = .025
            br.inputs['Bias'].default_value = .1
            color_out = br.outputs['Color']
            bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = .5
            inv = nt.nodes.new('ShaderNodeMath'); inv.operation = 'SUBTRACT'; inv.inputs[0].default_value = 1
            _link(nt, br.outputs['Fac'], inv.inputs[1]); _link(nt, inv.outputs[0], bump.inputs['Height']); _link(nt, bump.outputs['Normal'], b.inputs['Normal'])
        if stripes:
            col2, sc = stripes
            wv = nt.nodes.new('ShaderNodeTexWave'); wv.wave_type = 'BANDS'; wv.inputs['Scale'].default_value = sc; wv.inputs['Distortion'].default_value = 0
            _link(nt, comb.outputs[0], wv.inputs['Vector'])
            rp = nt.nodes.new('ShaderNodeValToRGB'); rp.color_ramp.interpolation = 'CONSTANT'
            rp.color_ramp.elements[0].color = (*col, 1); rp.color_ramp.elements[1].position = .5; rp.color_ramp.elements[1].color = (*col2, 1)
            _link(nt, wv.outputs['Fac'], rp.inputs['Fac']); color_out = rp.outputs['Color']
        if noise:
            nz = nt.nodes.new('ShaderNodeTexNoise'); nz.inputs['Scale'].default_value = noise; nz.inputs['Detail'].default_value = 6
            _link(nt, tc.outputs['Object'], nz.inputs['Vector'])
            mix = nt.nodes.new('ShaderNodeMix'); mix.data_type = 'RGBA'; mix.blend_type = 'MULTIPLY'; mix.inputs['Factor'].default_value = nf
            if color_out is not None:
                _link(nt, color_out, mix.inputs[6])
            else:
                mix.inputs[6].default_value = (*col, 1)
            gr = nt.nodes.new('ShaderNodeValToRGB'); gr.color_ramp.elements[0].color = (.55, .55, .55, 1); gr.color_ramp.elements[1].color = (1, 1, 1, 1)
            _link(nt, nz.outputs['Fac'], gr.inputs['Fac']); _link(nt, gr.outputs['Color'], mix.inputs[7])
            color_out = mix.outputs[2]
            if not brick:
                bump = nt.nodes.new('ShaderNodeBump'); bump.inputs['Strength'].default_value = .12 if metal > .1 or rough < .6 else .25
                _link(nt, nz.outputs['Fac'], bump.inputs['Height']); _link(nt, bump.outputs['Normal'], b.inputs['Normal'])
        if color_out is not None:
            _link(nt, color_out, b.inputs['Base Color'])
    m['team'] = 1 if team else 0
    MATS[name] = m
    return m


def _fin(o, m, parent, loc, rot, smooth):
    if m is not None:
        if isinstance(m, (list, tuple)):
            for mm in m:
                o.data.materials.append(mm)
        else:
            o.data.materials.append(m)
    if smooth and o.type == 'MESH':
        for p in o.data.polygons:
            p.use_smooth = True
    o.parent = parent
    o.location = loc
    o.rotation_euler = rot
    return o


def _apply_scale(o, sc):
    o.scale = sc
    bpy.ops.object.transform_apply(location=False, rotation=False, scale=True)


def box(sx, sy, sz, loc=(0, 0, 0), m=None, parent=None, rot=(0, 0, 0), bevel=0.):
    bpy.ops.mesh.primitive_cube_add(size=1)
    o = bpy.context.object; _apply_scale(o, (sx, sy, sz))
    if bevel:
        md = o.modifiers.new('bv', 'BEVEL'); md.width = bevel; md.segments = 2
    return _fin(o, m, parent, loc, rot, False)


def cyl(r, h, loc=(0, 0, 0), m=None, parent=None, rot=(0, 0, 0), v=16, r2=None, smooth=True):
    """r2 verilirse koni: r alt (-Z), r2 üst (+Z)."""
    if r2 is None:
        bpy.ops.mesh.primitive_cylinder_add(vertices=v, radius=r, depth=h)
    else:
        bpy.ops.mesh.primitive_cone_add(vertices=v, radius1=r, radius2=r2, depth=h)
    o = bpy.context.object
    return _fin(o, m, parent, loc, rot, smooth)


def ball(r, loc=(0, 0, 0), m=None, parent=None, sc=(1, 1, 1), seg=16, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_uv_sphere_add(segments=seg, ring_count=max(8, seg // 2), radius=r)
    o = bpy.context.object; _apply_scale(o, sc)
    return _fin(o, m, parent, loc, rot, True)


def blob(r, loc, m, parent=None, sc=(1, 1, 1), sub=2, disp=.25, seed=0, tex_scale=1.2):
    """Gürültüyle bozulmuş küre (yaprak, kaya)."""
    bpy.ops.mesh.primitive_ico_sphere_add(subdivisions=sub, radius=r)
    o = bpy.context.object; _apply_scale(o, sc)
    t = bpy.data.textures.new('n%d' % seed, 'CLOUDS'); t.noise_scale = tex_scale * r; t.noise_depth = 2
    md = o.modifiers.new('d', 'DISPLACE'); md.texture = t; md.strength = disp * r; md.mid_level = .5
    o.modifiers['d'].texture_coords = 'GLOBAL'
    return _fin(o, m, parent, loc, (0, 0, 0), True)


def torus(R, r, loc=(0, 0, 0), m=None, parent=None, rot=(0, 0, 0)):
    bpy.ops.mesh.primitive_torus_add(major_radius=R, minor_radius=r, major_segments=32, minor_segments=8)
    o = bpy.context.object
    return _fin(o, m, parent, loc, rot, True)


def mesh(verts, faces, m=None, parent=None, loc=(0, 0, 0), rot=(0, 0, 0), mat_idx=None, smooth=False):
    me = bpy.data.meshes.new('m'); me.from_pydata(verts, [], faces); me.update()
    o = bpy.data.objects.new('o', me); bpy.context.collection.objects.link(o)
    _fin(o, m, parent, loc, rot, smooth)
    if mat_idx:
        for i, p in enumerate(o.data.polygons):
            p.material_index = mat_idx[i % len(mat_idx)]
    return o


def pyramid(w, d, h, loc, m, parent=None, ridge=0.):
    """Kırma çatı. ridge>0 ise sırt X ekseni boyunca (kırma-beşik)."""
    x, y = w / 2, d / 2
    if ridge:
        r = ridge / 2
        v = [(-x, -y, 0), (x, -y, 0), (x, y, 0), (-x, y, 0), (-r, 0, h), (r, 0, h)]
        f = [(0, 1, 5, 4), (1, 2, 5), (2, 3, 4, 5), (3, 0, 4)]
    else:
        v = [(-x, -y, 0), (x, -y, 0), (x, y, 0), (-x, y, 0), (0, 0, h)]
        f = [(0, 1, 4), (1, 2, 4), (2, 3, 4), (3, 0, 4)]
    return mesh(v, f, m, parent, loc)


def prism(L, w, h, loc, m, gable_mat=None, parent=None):
    """Beşik çatı: sırt X ekseni boyunca."""
    x, y = L / 2, w / 2
    v = [(-x, -y, 0), (x, -y, 0), (x, y, 0), (-x, y, 0), (-x, 0, h), (x, 0, h)]
    f = [(0, 1, 5, 4), (3, 2, 5, 4)[::-1], (1, 2, 5), (0, 4, 3)]
    o = mesh(v, f, [m, gable_mat or m], parent, loc)
    o.data.polygons[2].material_index = 1; o.data.polygons[3].material_index = 1
    return o


def joint(name, loc=(0, 0, 0), parent=None, rot=(0, 0, 0)):
    o = bpy.data.objects.new(name, None); bpy.context.collection.objects.link(o)
    o.parent = parent; o.location = loc; o.rotation_euler = rot
    return o


# ---------------------------------------------------------------- sahne
def setup_scene(res_x, res_y, scale=1., target=(0, 0, 0), samples=24):
    sc = bpy.context.scene
    w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True
    bg = w.node_tree.nodes['Background']; bg.inputs[0].default_value = (.62, .66, .74, 1); bg.inputs[1].default_value = .55
    bpy.ops.object.light_add(type='SUN', rotation=(math.radians(36), 0, math.radians(-20)))
    sun = bpy.context.object; sun.data.energy = 3.1; sun.data.angle = math.radians(6); sun.data.color = (1, .95, .86)
    bpy.ops.mesh.primitive_plane_add(size=40, location=(0, 0, 0)); g = bpy.context.object; g.is_shadow_catcher = True; g.name = 'catcher'
    bpy.ops.object.camera_add(); cam = bpy.context.object; sc.camera = cam
    cam.data.type = 'ORTHO'; cam.data.sensor_fit = 'HORIZONTAL'
    cam.data.ortho_scale = res_x / (PX_PER_UNIT * scale)
    cam.rotation_euler = (math.radians(60), 0, math.radians(135))
    cam.location = Vector(target) + cam.rotation_euler.to_matrix() @ Vector((0, 0, 40))
    cam.data.clip_end = 200
    sc.render.engine = 'CYCLES'; sc.cycles.samples = samples; sc.cycles.device = 'CPU'
    sc.cycles.use_denoising = True
    try:
        sc.cycles.denoiser = 'OPENIMAGEDENOISE'
    except Exception:
        pass
    sc.cycles.max_bounces = 4; sc.cycles.diffuse_bounces = 2; sc.cycles.glossy_bounces = 2; sc.cycles.transparent_max_bounces = 4
    sc.render.film_transparent = True
    sc.render.resolution_x = res_x; sc.render.resolution_y = res_y; sc.render.resolution_percentage = 100
    sc.view_settings.view_transform = 'Standard'; sc.view_settings.look = 'None'; sc.view_settings.exposure = 0
    sc.render.image_settings.file_format = 'PNG'; sc.render.image_settings.color_mode = 'RGBA'
    return sc


def render_to(path):
    sc = bpy.context.scene; sc.render.filepath = path
    bpy.ops.render.render(write_still=True)


def mask_mode(on):
    """Takım rengi maskesi: TEAM malzemeleri beyaz, diğerleri siyah ışıma (Cycles, 1 örnek)."""
    sc = bpy.context.scene
    cat = bpy.data.objects.get('catcher')
    for m in bpy.data.materials:
        nt = m.node_tree; out = nt.nodes.get('Material Output')
        if out is None:
            continue
        em = nt.nodes.get('mask_em')
        if em is None:
            em = nt.nodes.new('ShaderNodeEmission'); em.name = 'mask_em'
            em.inputs['Color'].default_value = (1, 1, 1, 1) if m.get('team') else (0, 0, 0, 1)
            em.inputs['Strength'].default_value = 1
        if on:
            nt.links.new(em.outputs[0], out.inputs['Surface'])
        else:
            nt.links.new(nt.nodes['Principled BSDF'].outputs[0], out.inputs['Surface'])
    if on:
        sc['_samples'] = sc.cycles.samples
        sc.cycles.samples = 4; sc.cycles.use_denoising = False
        if cat:
            cat.hide_render = True
        sc.view_settings.exposure = 0
        sc.world.node_tree.nodes['Background'].inputs[1].default_value = 0
    else:
        sc.cycles.samples = sc.get('_samples', sc.cycles.samples); sc.cycles.use_denoising = True
        if cat:
            cat.hide_render = False
        sc.view_settings.exposure = 0
        sc.world.node_tree.nodes['Background'].inputs[1].default_value = .55
