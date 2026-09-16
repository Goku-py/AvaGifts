"""
Render the floating-widget Piku: a seamless breathing loop, front-on, on
transparency, at the size the chat launcher actually draws him.

    /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/piku3d/widget_render.py

Reads  _reference/piku/blender/piku_gen_rigged.blend
Writes _reference/piku/widget/frames/f####.png   (RGBA)

The widget shows an animated WebP, not the GLB — 2.1 MB of mesh plus a
three.js runtime is far too much for a corner ornament, and Piku is meant to
stand still anyway. `tools/piku3d/widget_encode.sh` turns these frames into
`public/brand/piku/piku-idle.webp` (+ a still for reduced motion).

The only motion is a breath, and it is done by scaling the ARMATURE OBJECT
rather than posing any bone: no bone deforms, so the mitten/hip contact that
webs on big arm poses (PIKU-BIBLE §3a) can never show up here. The origin
sits on the floor, so scaling up stretches the body from the feet.

Loop seam: the scale follows 1 + A·(1 − cos(2πi/N))/2, which is 1.0 at i=0
and at i=N. Only frames 0…N−1 are written, so the last frame hands back to
the first without a repeat.

Env overrides: PIKU_WIDGET_FRAMES (default 24), PIKU_WIDGET_SCALE (2 = 2x).
Set PIKU_WIDGET_FRAMES=1 for a completely motionless Piku.
"""
import bpy, math, os, time

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "_reference", "piku", "blender", "piku_gen_rigged.blend")
OUT_DIR = os.path.join(ROOT, "_reference", "piku", "widget", "frames")

# The CSS box is 96x104. Render at 2x for retina; the aspect matches the
# sprite viewBox (120x130) it replaces, so nothing reflows.
CSS_W, CSS_H = 96, 104
SCALE = int(os.environ.get("PIKU_WIDGET_SCALE", "2"))
FRAMES = int(os.environ.get("PIKU_WIDGET_FRAMES", "24"))
# 2% of 2.90 units is ~2 CSS px of head rise: a gentle breath you can see
# without it reading as motion. Set both to 0 for a completely frozen Piku.
BREATH_Z = 0.020
BREATH_XY = 0.010         # a little chest swell so it is not a pure stretch
TOTAL_H = 2.90

t0 = time.time()
bpy.ops.wm.open_mainfile(filepath=SRC)
scene = bpy.context.scene

arm = bpy.data.objects["Piku_Rig"]
# never render the 300k-tri source that rides along in the file
for ob in bpy.data.objects:
    if ob.type == "MESH" and ob.name.startswith("Piku_Source"):
        ob.hide_render = True
        ob.hide_viewport = True

# ---- engine ---------------------------------------------------------------
for eng in ("BLENDER_EEVEE_NEXT", "BLENDER_EEVEE", "CYCLES"):
    try:
        scene.render.engine = eng
        break
    except Exception:
        continue
print(f"engine: {scene.render.engine}")

scene.render.resolution_x = CSS_W * SCALE
scene.render.resolution_y = CSS_H * SCALE
scene.render.resolution_percentage = 100
scene.render.film_transparent = True
scene.render.image_settings.file_format = 'PNG'
scene.render.image_settings.color_mode = 'RGBA'
scene.render.image_settings.compression = 15      # fast; img2webp re-encodes anyway
if hasattr(scene, "eevee"):
    try:
        scene.eevee.taa_render_samples = 64
    except Exception:
        pass

# ---- world + lights: same recipe as the approved turnarounds --------------
world = bpy.data.worlds.new("PikuWidgetWorld")
scene.world = world
world.use_nodes = True
bg = world.node_tree.nodes["Background"]
bg.inputs[0].default_value = (0.62, 0.64, 0.68, 1.0)
bg.inputs[1].default_value = 1.0

target = bpy.data.objects.new("WidgetLookAt", None)
target.location = (0, 0, TOTAL_H / 2)
scene.collection.objects.link(target)

def aim(ob):
    c = ob.constraints.new('TRACK_TO')
    c.target = target
    c.track_axis = 'TRACK_NEGATIVE_Z'
    c.up_axis = 'UP_Y'

for nm, loc, energy, size in (
    ("Key",  (-3.4, -4.6, 5.0), 900, 8.0),
    ("Fill", ( 4.2, -3.4, 2.0), 320, 9.0),
    ("Rim",  ( 0.4,  5.2, 4.2), 520, 7.0),
):
    d = bpy.data.lights.new(nm, type='AREA')
    d.energy = energy
    d.size = size
    ob = bpy.data.objects.new(nm, d)
    ob.location = loc
    scene.collection.objects.link(ob)
    aim(ob)

# ---- camera: orthographic, dead level, Piku faces -Y ----------------------
cam_d = bpy.data.cameras.new("WidgetCam")
cam_d.type = 'ORTHO'
# ortho_scale spans the LONGER side of the frame; the render is portrait, so
# it is the height. 2.90 of character in 3.10 leaves a thin margin for the
# breath and for WebP's edge filtering.
cam_d.ortho_scale = 3.10
cam = bpy.data.objects.new("WidgetCam", cam_d)
cam.location = (0, -9.0, TOTAL_H / 2)
cam.rotation_euler = (math.radians(90), 0, 0)      # level, looking down +Y
scene.collection.objects.link(cam)
scene.camera = cam

# ---- frames ---------------------------------------------------------------
os.makedirs(OUT_DIR, exist_ok=True)
for old in os.listdir(OUT_DIR):
    if old.endswith(".png"):
        os.remove(os.path.join(OUT_DIR, old))

base = tuple(arm.scale)
for i in range(FRAMES):
    # 0 at i=0, 1 at the half way point, back to 0 at i=FRAMES
    t = (1 - math.cos(2 * math.pi * i / FRAMES)) / 2 if FRAMES > 1 else 0.0
    arm.scale = (
        base[0] * (1 + BREATH_XY * t),
        base[1] * (1 + BREATH_XY * t),
        base[2] * (1 + BREATH_Z * t),
    )
    scene.render.filepath = os.path.join(OUT_DIR, f"f{i:04d}.png")
    bpy.ops.render.render(write_still=True)
arm.scale = base

print(f"\n=== WIDGET ===")
print(f"  frames     : {FRAMES}")
print(f"  resolution : {scene.render.resolution_x}x{scene.render.resolution_y}  ({SCALE}x of {CSS_W}x{CSS_H})")
print(f"  breath     : z +{BREATH_Z*100:.1f}%  xy +{BREATH_XY*100:.1f}%")
print(f"  out        : {OUT_DIR}  ({time.time()-t0:.0f}s)")
print("WIDGET_RENDER_DONE")
