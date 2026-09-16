"""
Step 5 — pose test. Saves one .blend per pose so piku_render.py can render
each from the usual camera set.

    /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/piku3d/obj_pose_test.py
    for f in _reference/piku/blender/poses/*.blend; do
        PIKU_RENDER_PREFIX=pose_$(basename $f .blend)_ Blender -b $f -P tools/piku3d/piku_render.py; done

Poses exercise every bone group the emotion table will use: head tilt/turn,
jaw open, arm wave, leg step, body lean, and an "everything at once" stress
pose. Bone rotations are in the bone's local frame (Y along the bone).
"""
import bpy, os, math

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VARIANT = os.environ.get("PIKU_VARIANT", "")
PFX = "piku_gen" if VARIANT == "gen" else "piku"
SRC = os.path.join(ROOT, "_reference", "piku", "blender", f"{PFX}_rigged.blend")
OUT_DIR = os.path.join(ROOT, "_reference", "piku", "blender", "poses_gen" if VARIANT == "gen" else "poses")
os.makedirs(OUT_DIR, exist_ok=True)

POSES = {
    # name: {bone: (rx, ry, rz) degrees, XYZ euler in bone-local space}
    "rest":    {},
    "tilt":    {"head": (12, 18, -8)},
    "turn":    {"head": (0, 0, 35)},
    "jaw":     {"jaw": (-15, 0, 0)},
    # forearm flap from a modest raise: how a chunky mascot waves
    "wave":    {"shoulder_L": (0, 0, -15), "upperarm_L": (0, 0, -60), "forearm_L": (-20, 0, -40), "hand_L": (0, 0, -25)},
    # both forearms bent in, hands meeting at the chest (piku_ namaste.png)
    "namaste": {"upperarm_L": (-20, 0, -25), "forearm_L": (-70, 0, 40), "hand_L": (-10, 0, 30),
                "upperarm_R": (-20, 0, 25), "forearm_R": (-70, 0, -40), "hand_R": (-10, 0, -30)},
    # one forearm out, palm up (piku_presenting.png)
    "present": {"upperarm_L": (-15, 0, -30), "forearm_L": (-65, 0, -20), "hand_L": (10, 60, 0), "head": (5, 0, 15)},
    # a waddle frame: hip sway, body bob, a small foot lift, arms swinging little
    "waddle":  {"hips": (0, 0, 6), "spine": (0, 0, -4), "thigh_L": (14, 0, 0), "shin_L": (-8, 0, 0),
                "thigh_R": (-10, 0, 0), "upperarm_L": (-10, 0, 0), "upperarm_R": (10, 0, 0), "head": (0, 0, -4)},
    "lean":    {"hips": (0, 0, 8), "spine": (0, 0, 12), "chest": (0, 0, 8), "head": (0, 0, -10)},
    "stress":  {"head": (18, 25, 20), "jaw": (-15, 0, 0), "upperarm_L": (0, 0, -55), "forearm_L": (-60, 0, 0),
                "upperarm_R": (-30, 0, 0), "thigh_L": (20, 0, 0), "spine": (8, 0, 12)},
}

for name, rots in POSES.items():
    bpy.ops.wm.open_mainfile(filepath=SRC)
    arm = bpy.data.objects["Piku_Rig"]
    for pb in arm.pose.bones:
        pb.rotation_mode = 'XYZ'
        pb.rotation_euler = (0, 0, 0)
    for bone, (rx, ry, rz) in rots.items():
        arm.pose.bones[bone].rotation_euler = (math.radians(rx), math.radians(ry), math.radians(rz))
    path = os.path.join(OUT_DIR, f"{name}.blend")
    bpy.ops.wm.save_as_mainfile(filepath=path, compress=True)
    print(f"pose {name:8s} -> {path}")
print("POSES_DONE")
