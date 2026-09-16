"""
Render a 4-view turnaround of the master Piku for visual QC against the
model sheet.

    /Applications/Blender.app/Contents/MacOS/Blender -b \
        _reference/piku/blender/piku_master.blend -P tools/piku3d/piku_render.py

Writes _reference/piku/renders/{front,left34,side,back}.png.
Orthographic, to match the reference sheet's framing.

Set PIKU_RENDER_PREFIX (e.g. "obj_source_") to render a different stage of
the pipeline without overwriting another stage's turnaround.
"""
import bpy, math, os

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OUT = os.path.join(ROOT, "_reference", "piku", "renders")
PREFIX = os.environ.get("PIKU_RENDER_PREFIX", "")
os.makedirs(OUT, exist_ok=True)

scene = bpy.context.scene

# PIKU_RENDER_COLOR=<attribute> renders a different vertex-colour layer
# (e.g. PikuRegion) through every material's vertex-colour node.
COLOR_LAYER = os.environ.get("PIKU_RENDER_COLOR")
if COLOR_LAYER:
    for m in bpy.data.materials:
        if m.use_nodes:
            vc = None
            for nd in m.node_tree.nodes:
                if nd.type == 'VERTEX_COLOR':
                    nd.layer_name = COLOR_LAYER; vc = nd
            bsdf = m.node_tree.nodes.get("Principled BSDF")
            if bsdf:
                bsdf.inputs["Roughness"].default_value = 0.8
                if vc is not None:       # textured materials: the layer replaces the texture
                    m.node_tree.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])
    print(f"colour layer: {COLOR_LAYER}")

# ---- engine ---------------------------------------------------------------
for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "CYCLES"):
    try:
        scene.render.engine = eng
        break
    except Exception:
        continue
print(f"engine: {scene.render.engine}")

scene.render.resolution_x = 520
scene.render.resolution_y = 900
scene.render.film_transparent = False
scene.render.image_settings.file_format = 'PNG'
if hasattr(scene, "eevee"):
    try:
        scene.eevee.taa_render_samples = 48
    except Exception:
        pass

# ---- neutral studio world -------------------------------------------------
world = bpy.data.worlds.new("PikuWorld")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (0.62, 0.64, 0.68, 1.0)
bg.inputs[1].default_value = 1.0

# ---- lights: soft key / fill / rim ---------------------------------------
def add_light(name, kind, loc, energy, size=6.0, rot=(0, 0, 0)):
    d = bpy.data.lights.new(name, type=kind)
    d.energy = energy
    if kind == 'AREA':
        d.size = size
    ob = bpy.data.objects.new(name, d)
    ob.location = loc
    ob.rotation_euler = rot
    scene.collection.objects.link(ob)
    return ob

# PIKU_RENDER_FACE=1 frames the head only (eyes, beak, glasses QA)
FACE = os.environ.get("PIKU_RENDER_FACE") == "1"
target = bpy.data.objects.new("LookAt", None)
target.location = (0, 0, 2.15 if FACE else 1.42)
scene.collection.objects.link(target)

def aim(ob, tgt):
    c = ob.constraints.new('TRACK_TO')
    c.target = tgt
    c.track_axis = 'TRACK_NEGATIVE_Z'
    c.up_axis = 'UP_Y'

for nm, loc, en, sz in (
    ("Key",  (-3.4, -4.6, 5.0), 900, 8.0),
    ("Fill", ( 4.2, -3.4, 2.0), 320, 9.0),
    ("Rim",  ( 0.4,  5.2, 4.2), 520, 7.0),
):
    aim(add_light(nm, 'AREA', loc, en, sz), target)

# ---- orthographic camera --------------------------------------------------
cam_d = bpy.data.cameras.new("Cam")
cam_d.type = 'ORTHO'
cam_d.ortho_scale = 1.5 if FACE else 3.35
cam = bpy.data.objects.new("Cam", cam_d)
scene.collection.objects.link(cam)
scene.camera = cam
aim(cam, target)

R = 9.0
VIEWS = {"front": 0, "left34": 45, "side": 90, "back": 180}
for name, deg in VIEWS.items():
    a = math.radians(deg)
    cam.location = (R * math.sin(a), -R * math.cos(a), 2.15 if FACE else 1.62)
    scene.render.filepath = os.path.join(OUT, PREFIX + name + ".png")
    bpy.ops.render.render(write_still=True)
    print(f"rendered {PREFIX}{name}")

print("RENDER_DONE")
