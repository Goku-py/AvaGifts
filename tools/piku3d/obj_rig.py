"""
Step 4 — custom armature + weights for the low mesh.

    /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/piku3d/obj_rig.py

Reads  _reference/piku/blender/piku_low.blend
Writes _reference/piku/blender/piku_rigged.blend

Why custom, not Rigify: no neck, mitten hands, three-toed feet, a jaw, a
quiff and glasses — the humanoid meta-rig fits badly and generates hundreds
of helper bones that bloat a GLB. 24 deform bones map 1:1 onto what the
widget's emotion table needs (wave, tilt, look, talk, walk, lean).

Bone placement is data-driven: the skull sphere, eye centres, mouth line and
height landmarks measured in Step 1 (stored as custom properties), and the
centroids of the Step 1 region vertex groups for limbs.

Weights: Blender's automatic (bone heat) weights, then hard overrides from
the region groups for the rigid parts (frame, quiff, upper mandible -> head;
lower mandible + mouth floor -> jaw) and a cleanup so the jaw never pulls
the chin.
"""
import bpy, os, time
import numpy as np
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VARIANT = os.environ.get("PIKU_VARIANT", "")
PFX = "piku_gen" if VARIANT == "gen" else "piku"
SRC = os.path.join(ROOT, "_reference", "piku", "blender", f"{PFX}_low.blend")
OUT = os.path.join(ROOT, "_reference", "piku", "blender", f"{PFX}_rigged.blend")
# the Tripo model has whole mittens and painted eyes: keep them
BUILD_HANDS = VARIANT != "gen"
BUILD_EYES = VARIANT != "gen"

t0 = time.time()
bpy.ops.wm.open_mainfile(filepath=SRC)
scene = bpy.context.scene
low = bpy.data.objects["Piku_Low"]
me = low.data
n = len(me.vertices)
co = np.empty(n * 3); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3)
C = np.array(low["skull_centre"]); R = float(low["skull_r"])
eye = {"L": np.array(low["eye_L"]), "R": np.array(low["eye_R"])}
mouth_z = float(low["mouth_z"])
z_shoulder, z_belt, z_cuff, z_feet = (float(low[k]) for k in ("z_shoulder", "z_belt", "z_cuff", "z_feet"))
top = co[:, 2].max()

def vg_mask(name, thresh=0.5):
    """Decimation interpolated the region groups, so membership is fuzzy at
    the borders; a vertex belongs where its weight is a majority."""
    idx = low.vertex_groups[name].index
    m = np.zeros(n, bool)
    for v in me.vertices:
        for g in v.groups:
            if g.group == idx and g.weight >= thresh:
                m[v.index] = True; break
    return m
REG = {g.name: vg_mask(g.name) for g in low.vertex_groups}

def centroid(m, z_lo=None, z_hi=None):
    sel = m.copy()
    if z_lo is not None: sel &= co[:, 2] >= z_lo
    if z_hi is not None: sel &= co[:, 2] <= z_hi
    return co[sel].mean(0) if sel.any() else co[m].mean(0)

# --------------------------------------------------------------------------
# 0. free the arms. The sculpt fuses the sleeves to the shirt body and the
#    mittens to the hips; any arm rotation would tear those contacts. Split
#    the mesh along the limb/body seam below the shoulder joint (vertices are
#    duplicated, nothing is deleted): the rest pose is untouched, the seam
#    simply opens on the inside when the arm moves, and the joint itself
#    stays connected and blended.
# --------------------------------------------------------------------------
import bmesh
body_reg = REG["torso"] | REG["belt"] | REG["tie"] | REG["leg_L"] | REG["leg_R"] | REG["foot_L"] | REG["foot_R"]
bm = bmesh.new(); bm.from_mesh(me)
bm.verts.ensure_lookup_table(); bm.faces.ensure_lookup_table(); bm.edges.ensure_lookup_table()
side = {}                                    # face index -> "L", "R" or "body"
for f in bm.faces:
    vi = [v.index for v in f.verts]
    nl = sum(REG["arm_L"][i] | REG["hand_L"][i] for i in vi)
    nr = sum(REG["arm_R"][i] | REG["hand_R"][i] for i in vi)
    nb = sum(body_reg[i] for i in vi)
    # any limb vertex makes it a limb face: every straddling triangle goes
    # with the limb, so the seam is a clean closed loop
    side[f.index] = "L" if nl > nr and nl > 0 else ("R" if nr > 0 else ("body" if nb > 0 else None))
seam = []
for e in bm.edges:
    lf = e.link_faces
    if len(lf) == 2 and all(v.co.z < z_shoulder - 0.25 for v in e.verts):
        a, b = side.get(lf[0].index), side.get(lf[1].index)
        if a and b and a != b and "body" in (a, b):
            seam.append(e)
limb_faces = {s: [f for f in bm.faces if side.get(f.index) == s] for s in ("L", "R")}
bmesh.ops.split_edges(bm, edges=seam)
# mark, per side, the vertices of limb faces below the joint (after the split
# they are the limb's own copies)
lay = bm.verts.layers.int.new("limb_side")
for s, code in (("L", 1), ("R", 2)):
    for f in limb_faces[s]:
        for v in f.verts:
            if v.co.z < z_shoulder - 0.20:
                v[lay] = code
n_split = len(seam)

# --- the fused half-hands go; the cuff and the hip contact get capped ---------
uv_lay = bm.loops.layers.uv.active
bm.verts.ensure_lookup_table()
doomed = [v for v in bm.verts if v[lay] in (1, 2) and v.co.z <= z_cuff + 0.005] if BUILD_HANDS else []
n_hand_removed = len(doomed)
bmesh.ops.delete(bm, geom=doomed, context='VERTS')
# only the cuff openings are capped (the mitten emerges from a black disc);
# the long sleeve/torso seam stays open: its inner walls are the shirt's own
# back faces, which read correctly when an arm lifts
boundary = [e for e in bm.edges if e.is_boundary and all(v[lay] in (1, 2) and v.co.z < z_cuff + 0.10 for v in e.verts)]
caps = bmesh.ops.holes_fill(bm, edges=boundary, sides=0)["faces"]
caps = bmesh.ops.triangulate(bm, faces=caps)["faces"]
cap_set = set(f.index for f in caps)
bm.faces.index_update()
# caps are flat and take one known texel each: sleeve blue on the limb side,
# trouser black on the body side (their corners sit on different UV islands,
# so borrowed UVs would smear the atlas across them)
def texel_of(pred):
    v = next(v for v in bm.verts if pred(v) and v.link_loops)
    return v.link_loops[0][uv_lay].uv.copy()
blue_uv = texel_of(lambda v: v[lay] in (1, 2) and v.co.z > z_cuff + 0.25 and abs(v.co.x) > 0.6)
black_uv = texel_of(lambda v: v[lay] == 0 and v.co.z < z_belt - 0.25 and abs(v.co.x) < 0.25)
for f in caps:
    f.smooth = True
    # the seam runs the sleeve's length: above the belt the inner walls are
    # shirt, below it (hip contact, cuff) they are black
    zc = f.calc_center_median().z
    for l in f.loops:
        l[uv_lay].uv = blue_uv if zc > z_belt + 0.03 else black_uv

# --- new closed mittens (three fingers + thumb, as in every reference) ---------
# the trouser texel gives the mittens their black; the maps are flat there
def add_blob(centre, radii, code):
    r = bmesh.ops.create_uvsphere(bm, u_segments=18, v_segments=12, radius=1.0)
    faces = set()
    for v in r["verts"]:
        v.co = Vector((v.co.x * radii[0] + centre[0], v.co.y * radii[1] + centre[1], v.co.z * radii[2] + centre[2]))
        v[lay] = code
        faces.update(v.link_faces)
    faces = list(faces)
    faces = bmesh.ops.triangulate(bm, faces=faces)["faces"]
    for f in faces:
        f.smooth = True
        for l in f.loops:
            l[uv_lay].uv = black_uv
wrist = {}
for s_, code, sgn in ((("L", 3, 1), ("R", 4, -1)) if BUILD_HANDS else ()):
    cuff = [v for v in bm.verts if v[lay] == (1 if s_ == "L" else 2) and v.co.z < z_cuff + 0.10]
    wc = sum((v.co for v in cuff), Vector()) / max(len(cuff), 1)
    w = Vector((wc.x + sgn * 0.005, wc.y - 0.01, z_cuff - 0.01))
    wrist[s_] = w
    # one mitten: a fat palm with three finger lobes sunk into its bottom and
    # a thumb lobe on the forward edge (piku_presenting.png, piku_ namaste.png)
    add_blob((w.x, w.y, w.z - 0.17), (0.085, 0.125, 0.185), code)                    # palm
    for k, dy in enumerate((-0.078, 0.0, 0.078)):
        add_blob((w.x, w.y + dy, w.z - 0.29 - (0.02 if k == 1 else 0)), (0.066, 0.062, 0.11), code)
    add_blob((w.x - sgn * 0.02, w.y - 0.15, w.z - 0.16), (0.06, 0.07, 0.07), code)     # thumb, forward
bm.to_mesh(me); bm.free(); me.update()
print(f"split {n_split} seam edges, removed {n_hand_removed} fused hand verts, capped {len(caps)} tris, "
      f"built mittens ({len(me.vertices)} verts, {len(me.polygons)} tris)")

# everything indexed by vertex is re-read after the topology change
n = len(me.vertices)
co = np.empty(n * 3); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3)
REG = {g.name: vg_mask(g.name) for g in low.vertex_groups}
limb_side = np.array([me.attributes["limb_side"].data[i].value for i in range(n)])
for s, code, hcode in (("L", 1, 3), ("R", 2, 4)):
    on = limb_side == code
    if BUILD_HANDS:
        REG[f"hand_{s}"] = limb_side == hcode
    else:
        REG[f"hand_{s}"] = (REG[f"hand_{s}"] | on) & (co[:, 2] <= z_cuff + 0.02)
    REG[f"arm_{s}"] = (REG[f"arm_{s}"] | on) & ~REG[f"hand_{s}"]
    for nm in ("torso", "belt", "tie", "leg_L", "leg_R", "foot_L", "foot_R", "head"):
        REG[nm] &= ~(on | REG[f"hand_{s}"])
body_reg = REG["torso"] | REG["belt"] | REG["tie"] | REG["leg_L"] | REG["leg_R"] | REG["foot_L"] | REG["foot_R"]
me.attributes.remove(me.attributes["limb_side"])

# --------------------------------------------------------------------------
# 1. bone layout
# --------------------------------------------------------------------------
cx = float(C[0])
z_hip = z_belt
z_chest = z_shoulder - 0.30
z_crown = C[2] + R
bones = {}   # name: (head, tail, parent, connect, deform)
def B(name, head, tail, parent=None, connect=False, deform=True):
    bones[name] = (Vector(head), Vector(tail), parent, connect, deform)

B("root",  (0, 0, 0),           (0, -0.35, 0),        None, False, False)
B("hips",  (cx, 0, z_hip),      (cx, 0, z_hip + 0.28), "root")
B("spine", (cx, 0, z_hip + 0.28), (cx, 0, z_chest),   "hips", True)
B("chest", (cx, 0, z_chest),    (cx, 0, z_shoulder),  "spine", True)
B("head",  (cx, 0, z_shoulder), (cx, 0, z_crown),     "chest", True)
# jaw: hinge behind the mouth corners at the mouth line, reaching the lower lip
B("jaw",   (cx, C[1] - 0.15, mouth_z + 0.02), (cx, -0.62, mouth_z - 0.12), "head")
B("quiff", (cx, C[1], z_crown - 0.05), (cx, C[1] - 0.05, top), "head")
B("glasses", (cx, C[1] - 0.2, eye["L"][2]), (cx, C[1] - 0.55, eye["L"][2]), "head")
for s in ("L", "R"):
    e = eye[s]
    B(f"eye_{s}", (e[0], e[1] + 0.08, e[2]), (e[0], e[1] - 0.06, e[2]), "head")
    sgn = 1 if s == "L" else -1
    arm, hand = REG[f"arm_{s}"], REG[f"hand_{s}"]
    a_top = centroid(arm, z_shoulder - 0.12, z_shoulder + 0.05)
    if BUILD_HANDS:
        a_bot = np.array(wrist[s])
        h_bot = np.array([a_bot[0], a_bot[1], a_bot[2] - 0.36])
    else:
        a_bot = centroid(hand, z_cuff - 0.06, z_cuff + 0.02)
        h_bot = centroid(hand, None, co[hand, 2].min() + 0.08)
    elbow = (a_top + a_bot) / 2 + np.array([sgn * 0.02, -0.02, 0.0])
    B(f"shoulder_{s}", (cx + sgn * 0.12, a_top[1], z_shoulder - 0.06), (a_top[0], a_top[1], a_top[2]), "chest")
    B(f"upperarm_{s}", tuple(a_top), tuple(elbow), f"shoulder_{s}", True)
    B(f"forearm_{s}",  tuple(elbow), tuple(a_bot), f"upperarm_{s}", True)
    B(f"hand_{s}",     tuple(a_bot), tuple(h_bot), f"forearm_{s}", True)
    leg, foot = REG[f"leg_{s}"], REG[f"foot_{s}"]
    l_top = centroid(leg, z_hip - 0.12, z_hip - 0.02)
    l_mid = centroid(leg, z_feet + 0.25, z_feet + 0.40)
    l_bot = centroid(leg, z_feet, z_feet + 0.08)
    f_tip = co[foot][co[foot, 1].argmin()]
    B(f"thigh_{s}", (l_top[0], l_top[1], z_hip - 0.02), tuple(l_mid), "hips")
    B(f"shin_{s}",  tuple(l_mid), (l_bot[0], l_bot[1], z_feet + 0.02), f"thigh_{s}", True)
    B(f"foot_{s}",  (l_bot[0], l_bot[1], z_feet + 0.02), (f_tip[0], f_tip[1], 0.04), f"shin_{s}", True)

arm_data = bpy.data.armatures.new("PikuRig")
arm = bpy.data.objects.new("Piku_Rig", arm_data)
scene.collection.objects.link(arm)
bpy.ops.object.select_all(action='DESELECT')
arm.select_set(True); bpy.context.view_layer.objects.active = arm
bpy.ops.object.mode_set(mode='EDIT')
eb = {}
for name, (h, t, parent, connect, deform) in bones.items():
    b = arm_data.edit_bones.new(name)
    b.head, b.tail = h, t
    b.use_deform = deform
    eb[name] = b
for name, (h, t, parent, connect, deform) in bones.items():
    if parent:
        eb[name].parent = eb[parent]
        eb[name].use_connect = connect
bpy.ops.object.mode_set(mode='OBJECT')
print(f"armature: {len(bones)} bones ({sum(1 for b in bones.values() if b[4])} deform)")
for name, (h, t, *_ ) in bones.items():
    print(f"  {name:11s} head ({h.x:+.2f},{h.y:+.2f},{h.z:.2f})  tail ({t.x:+.2f},{t.y:+.2f},{t.z:.2f})")

# --------------------------------------------------------------------------
# 2. automatic weights
# --------------------------------------------------------------------------
bpy.ops.object.select_all(action='DESELECT')
low.select_set(True); arm.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.object.parent_set(type='ARMATURE_AUTO')
print(f"auto weights done ({time.time()-t0:.0f}s)")

# --------------------------------------------------------------------------
# 3. overrides from the regions
# --------------------------------------------------------------------------
deform_names = [nm for nm, b in bones.items() if b[4]]
def vg(name):
    return low.vertex_groups.get(name) or low.vertex_groups.new(name=name)

def members(name):
    """Bool mask of the vertices currently in a group (removing a non-member
    crashes Blender 5.2 headless, so every removal is filtered by this)."""
    g = low.vertex_groups.get(name)
    m = np.zeros(n, bool)
    if g is None:
        return m
    for v in me.vertices:
        for ge in v.groups:
            if ge.group == g.index:
                m[v.index] = True; break
    return m

def safe_remove(name, mask):
    g = low.vertex_groups.get(name)
    if g is None:
        return
    idx = np.where(mask & members(name))[0].tolist()
    if idx:
        g.remove(idx)

def set_rigid(mask, bone):
    """Vertices in `mask` follow `bone` only."""
    if not mask.any():
        return
    for nm in deform_names:
        if nm != bone:
            safe_remove(nm, mask)
    vg(bone).add(np.where(mask)[0].tolist(), 1.0, 'REPLACE')

head_rigid = REG["glasses"] | REG["quiff"] | REG["beak_upper"] | REG["eye_L"] | REG["eye_R"]
set_rigid(REG["beak_upper"] | REG["eye_L"] | REG["eye_R"], "head")
set_rigid(REG["glasses"], "head")
set_rigid(REG["quiff"], "head")
set_rigid(REG["beak_lower"], "jaw")
# the jaw pulls nothing but the lower mandible
safe_remove("jaw", ~REG["beak_lower"])
# the glasses / quiff / eye bones are for attached objects and gestures, not skinning
for nm in ("glasses", "quiff", "eye_L", "eye_R"):
    g = low.vertex_groups.get(nm)
    if g:
        low.vertex_groups.remove(g)
# the skull well above the collar is rigid to the head (no candy-wrapping);
# the collar band keeps the automatic blend into the chest
set_rigid(REG["head"] & (co[:, 2] > z_shoulder + 0.20), "head")

# The hands are fused to the hips in the sculpt, so bone heat leaks limb
# weights across the contact. Body regions never follow limb bones and
# limbs never follow body bones; the contact patch stretches a little
# instead of the whole hip going along.
def strip(mask, bone_names):
    for nm in bone_names:
        safe_remove(nm, mask)
limb_bones = [f"{b}_{s}" for b in ("shoulder", "upperarm", "forearm", "hand") for s in ("L", "R")]
for s in ("L", "R"):
    set_rigid(REG[f"hand_{s}"], f"hand_{s}")
leg_bones = [f"{b}_{s}" for b in ("thigh", "shin", "foot") for s in ("L", "R")]
body = REG["torso"] | REG["belt"] | REG["tie"] | REG["leg_L"] | REG["leg_R"] | REG["foot_L"] | REG["foot_R"]
strip(body, limb_bones)
strip(REG["leg_L"] | REG["leg_R"] | REG["foot_L"] | REG["foot_R"] | REG["belt"], ["chest", "head"])
for s in ("L", "R"):
    limb = REG[f"arm_{s}"] | REG[f"hand_{s}"]
    strip(limb, leg_bones + ["hips", "spine", "head"])
    other = "R" if s == "L" else "L"
    strip(limb, [f"{b}_{other}" for b in ("shoulder", "upperarm", "forearm", "hand")])
    strip(REG[f"leg_{s}"] | REG[f"foot_{s}"], [f"{b}_{other}" for b in ("thigh", "shin", "foot")])

# the jaw blends into the chin: weight falls off with distance from the
# lower mandible over ~0.12 units, below the mouth line, front only
from mathutils import kdtree
lower_idx = np.where(REG["beak_lower"])[0]
if len(lower_idx):
    kd = kdtree.KDTree(len(lower_idx))
    for k, i in enumerate(lower_idx):
        kd.insert(Vector(co[i]), k)
    kd.balance()
    JAW_FALL = 0.18
    cand = np.where(~REG["beak_lower"] & ~REG["beak_upper"] & ~REG["glasses"] &
                    (co[:, 2] < mouth_z + 0.03) & (co[:, 2] > z_shoulder - 0.05) & (co[:, 1] < -0.10))[0]
    blended = 0
    jaw_g, head_g = vg("jaw"), vg("head")
    for i in cand:
        _, _, d = kd.find(Vector(co[i]))
        if d < JAW_FALL:
            w = (1 - d / JAW_FALL) ** 1.5
            if REG["mouth"][i]:
                w = max(w, 0.5)          # the cavity floor rides with the jaw
            # remove only from groups the vertex is actually in (removing a
            # non-member crashes Blender 5.2 headless)
            for ge in list(me.vertices[int(i)].groups):
                gname = low.vertex_groups[ge.group].name
                if gname not in ("jaw", "head"):
                    low.vertex_groups[ge.group].remove([int(i)])
            jaw_g.add([int(i)], float(w), 'REPLACE')
            head_g.add([int(i)], float(1 - w), 'REPLACE')
            blended += 1
    print(f"jaw falloff: {blended} chin verts blended")

# smooth the weights across joints (the sculpt has no joint loops to guide
# bone heat), then re-assert the rigid parts the smoothing blurred
bpy.ops.object.select_all(action='DESELECT')
low.select_set(True); bpy.context.view_layer.objects.active = low
try:
    bpy.ops.object.mode_set(mode='WEIGHT_PAINT')
    bpy.ops.object.vertex_group_smooth(group_select_mode='ALL', factor=0.5, repeat=3, expand=0.0)
    bpy.ops.object.mode_set(mode='OBJECT')
    print("weights smoothed")
except Exception as ex:
    bpy.ops.object.mode_set(mode='OBJECT')
    print(f"weight smoothing skipped: {ex}")
set_rigid(REG["beak_upper"] | REG["eye_L"] | REG["eye_R"] | REG["glasses"] | REG["quiff"], "head")
set_rigid(REG["head"] & (co[:, 2] > z_shoulder + 0.20), "head")
for s in ("L", "R"):
    set_rigid(REG[f"hand_{s}"], f"hand_{s}")
safe_remove("jaw", ~(REG["beak_lower"] | REG["mouth"]) & ~((co[:, 2] < mouth_z + 0.03) & (co[:, 1] < -0.10)))
bpy.ops.object.vertex_group_normalize_all(lock_active=False)

# report: verts with no weight, and per-bone counts
weights = {nm: np.zeros(n) for nm in deform_names}
for v in me.vertices:
    for g in v.groups:
        nm = low.vertex_groups[g.group].name
        if nm in weights:
            weights[nm][v.index] = g.weight
total = sum(weights.values())
print(f"unweighted verts: {(total < 1e-4).sum()}")
for nm in deform_names:
    print(f"  {nm:11s} {(weights[nm] > 0.5).sum():6d} verts >0.5   {(weights[nm] > 0).sum():6d} touched")

# eyeballs on the eye bones (Step 2)
import sys, importlib
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
build_eyes = importlib.import_module("obj_eyes").build_eyes
EYE_RADIUS = 0.085
if BUILD_EYES:
    eye_objs = build_eyes(scene, arm, {s: (eye[s][0], eye[s][1] + 0.035, eye[s][2]) for s in ("L", "R")}, EYE_RADIUS)
    print(f"eyes: {[o.name for o in eye_objs]}  radius {EYE_RADIUS}")
else:
    print("eyes: painted (Tripo texture), eye bones kept for later")

arm["piku_stage"] = "rigged"
for k in ("skull_centre", "skull_r", "eye_L", "eye_R", "eye_r", "mouth_z", "z_shoulder", "z_belt", "z_cuff", "z_feet"):
    arm[k] = low[k]
bpy.ops.wm.save_as_mainfile(filepath=OUT, compress=True)
print(f"saved -> {OUT}  ({os.path.getsize(OUT)/1e6:.1f} MB)  total {time.time()-t0:.0f}s")
print("RIG_DONE")
