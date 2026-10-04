import bpy, math, sys
from mathutils import Vector
out = sys.argv[-1]
bpy.ops.wm.read_factory_settings(use_empty=True)
sc = bpy.context.scene
def mat(name, col, rough=.7, metal=0):
    m = bpy.data.materials.new(name); m.use_nodes = True; b = m.node_tree.nodes['Principled BSDF']
    b.inputs['Base Color'].default_value = (*col, 1); b.inputs['Roughness'].default_value = rough; b.inputs['Metallic'].default_value = metal; return m
def add(obj, m): obj.data.materials.append(m); bpy.ops.object.shade_smooth(); return obj
stone = mat('stone', (.78, .72, .6)); plaster = mat('plaster', (.9, .85, .74)); roof = mat('roof', (.6, .2, .12)); lead = mat('lead', (.35, .55, .55), .4, .3); gold = mat('gold', (1, .75, .25), .25, 1); dark = mat('dark', (.08, .05, .03)); red = mat('red', (.7, .08, .06))
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, .1)); o = bpy.context.object; o.scale = (3, 3, .2); add(o, stone)
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, .75)); o = bpy.context.object; o.scale = (2.5, 2.5, 1.1); add(o, plaster)
bpy.ops.object.modifier_add(type='BEVEL'); o.modifiers[0].width = .03
bpy.ops.mesh.primitive_cube_add(size=1, location=(0, 0, 1.35)); o = bpy.context.object; o.scale = (2.65, 2.65, .1); add(o, roof)
# pencere kemerleri
for i in range(3):
    for side in (1, -1):
        bpy.ops.mesh.primitive_cube_add(size=1, location=(1.26 * side, -0.8 + i * .8, .75)); o = bpy.context.object; o.scale = (.04, .3, .5); add(o, dark)
        bpy.ops.mesh.primitive_cube_add(size=1, location=(-0.8 + i * .8, 1.26 * side, .75)); o = bpy.context.object; o.scale = (.3, .04, .5); add(o, dark)
# kubbe kasnağı + kubbe
bpy.ops.mesh.primitive_cylinder_add(vertices=48, radius=.95, depth=.35, location=(0, 0, 1.55)); add(bpy.context.object, plaster)
bpy.ops.mesh.primitive_uv_sphere_add(segments=64, ring_count=32, radius=.95, location=(0, 0, 1.72)); o = bpy.context.object; o.scale = (1, 1, .85); add(o, lead)
for (x, y) in [(1.0, 1.0), (-1.0, -1.0), (1.0, -1.0), (-1.0, 1.0)]:
    bpy.ops.mesh.primitive_uv_sphere_add(segments=32, ring_count=16, radius=.35, location=(x * .9, y * .9, 1.42)); add(bpy.context.object, lead)
bpy.ops.mesh.primitive_cylinder_add(vertices=16, radius=.03, depth=.4, location=(0, 0, 2.7)); add(bpy.context.object, gold)
bpy.ops.mesh.primitive_torus_add(major_radius=.09, minor_radius=.02, location=(0, 0, 2.95), rotation=(math.pi / 2, 0, 0)); add(bpy.context.object, gold)
# minareler
for (x, y) in [(1.35, -1.35), (-1.35, 1.35)]:
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=.13, depth=3.2, location=(x, y, 1.6)); add(bpy.context.object, plaster)
    bpy.ops.mesh.primitive_cylinder_add(vertices=24, radius=.2, depth=.08, location=(x, y, 2.5)); add(bpy.context.object, stone)
    bpy.ops.mesh.primitive_cone_add(vertices=24, radius1=.15, depth=.7, location=(x, y, 3.55)); add(bpy.context.object, lead)
# kapı + sancak
bpy.ops.mesh.primitive_cube_add(size=1, location=(1.27, 0, .55)); o = bpy.context.object; o.scale = (.05, .5, .8); add(o, dark)
bpy.ops.mesh.primitive_cylinder_add(vertices=8, radius=.02, depth=1.2, location=(1.1, 1.1, 1.95)); add(bpy.context.object, dark)
bpy.ops.mesh.primitive_plane_add(size=.5, location=(1.1, 1.36, 2.35), rotation=(math.pi / 2, 0, 0)); o = bpy.context.object; o.scale = (1, .6, 1); add(o, red)
# zemin gölgesi yakalayıcı
bpy.ops.mesh.primitive_plane_add(size=12, location=(0, 0, 0)); g = bpy.context.object; g.is_shadow_catcher = True
# ışık ve kamera (2:1 izometrik)
bpy.ops.object.light_add(type='SUN', rotation=(math.radians(50), 0, math.radians(-130))); bpy.context.object.data.energy = 3.5; bpy.context.object.data.angle = math.radians(8)
w = bpy.data.worlds.new('w'); sc.world = w; w.use_nodes = True; w.node_tree.nodes['Background'].inputs[0].default_value = (.55, .6, .7, 1); w.node_tree.nodes['Background'].inputs[1].default_value = .7
bpy.ops.object.camera_add(); cam = bpy.context.object; sc.camera = cam; cam.data.type = 'ORTHO'; cam.data.ortho_scale = 8.5
cam.rotation_euler = (math.radians(60), 0, math.radians(135)); d = 20; cam.location = Vector((0, 0, 1.4)) + cam.rotation_euler.to_matrix() @ Vector((0, 0, d))
sc.render.engine = 'CYCLES'; sc.cycles.samples = 64; sc.cycles.device = 'CPU'; sc.render.film_transparent = True
sc.render.resolution_x = 512; sc.render.resolution_y = 512; sc.render.filepath = out; sc.view_settings.view_transform = 'Standard'
bpy.ops.render.render(write_still=True)
