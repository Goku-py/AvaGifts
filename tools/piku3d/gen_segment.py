"""
Generated-model path, step 1 — rig regions from the model's own texture.

    /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/piku3d/gen_segment.py

Reads  _reference/piku/blender/piku_gen.blend  (+ its packed colour texture)
Writes _reference/piku/blender/piku_gen_segmented.blend

The Tripo model already carries a clean baked colour map, so colour is not
our problem any more; what the rig needs is REGIONS (vertex groups with the
same names the rig step expects). Each vertex samples its own texel through
its UVs, the texel is classified with the same HSV rules as before, and
height zones + the skull sphere turn classes into parts.
"""
import bpy, math, os, time
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "_reference", "piku", "blender", "piku_gen.blend")
OUT = os.path.join(ROOT, "_reference", "piku", "blender", "piku_gen_segmented.blend")
TOTAL_H = 2.90

t0 = time.time()
bpy.ops.wm.open_mainfile(filepath=SRC)
ob = bpy.data.objects["Piku_Gen"]; me = ob.data
n = len(me.vertices)
co = np.empty(n * 3); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3)
nrm = np.empty(n * 3); me.vertex_normals.foreach_get("vector", nrm); nrm = nrm.reshape(-1, 3)
E = len(me.edges)
ev = np.empty(E * 2, dtype=np.int64); me.edges.foreach_get("vertices", ev); ev = ev.reshape(-1, 2)
EA, EB = ev[:, 0], ev[:, 1]
top = co[:, 2].max()

# --------------------------------------------------------------------------
# 1. per-vertex texel
# --------------------------------------------------------------------------
img = next(i for i in bpy.data.images if i.size[0] > 0)
W, H = img.size
px = np.empty(W * H * 4, dtype=np.float32); img.pixels.foreach_get(px); px = px.reshape(H, W, 4)[:, :, :3]
L = len(me.loops)
lv = np.empty(L, dtype=np.int64); me.loops.foreach_get("vertex_index", lv)
uv = np.empty(L * 2); me.uv_layers[0].data.foreach_get("uv", uv); uv = uv.reshape(-1, 2)
ix = np.clip((uv[:, 0] % 1.0 * W).astype(int), 0, W - 1)
iy = np.clip((uv[:, 1] % 1.0 * H).astype(int), 0, H - 1)
rgb_loop = px[iy, ix]
rgb = np.zeros((n, 3)); cnt = np.zeros(n)
np.add.at(rgb, lv, rgb_loop); np.add.at(cnt, lv, 1)
rgb /= np.maximum(cnt, 1)[:, None]

def rgb_to_hsv(c):
    r, g, b = c[:, 0], c[:, 1], c[:, 2]
    mx = c.max(1); mn = c.min(1); d = mx - mn
    m = d > 1e-6; safe = np.where(m, d, 1)
    rc = (mx - r) / safe; gc = (mx - g) / safe; bc = (mx - b) / safe
    h = np.where(mx == r, bc - gc, np.where(mx == g, 2 + rc - bc, 4 + gc - rc))
    h = np.where(m, (h / 6) % 1.0, 0) * 360
    s = np.where(mx > 1e-6, d / np.where(mx > 1e-6, mx, 1), 0)
    return h, s, mx
h, s, v = rgb_to_hsv(rgb)
UNK, BLACK, WHITE, BLUE, TIE, ORANGE, IRIS, MOUTH, SILVER = range(-1, 8)
cls = np.full(n, UNK, dtype=np.int8)
cls[(s <= 0.25) & (v >= 0.55)] = WHITE
cls[(v <= 0.30)] = BLACK
cls[(h >= 190) & (h <= 250) & (s >= 0.15) & (v >= 0.30)] = BLUE
cls[(h > 30) & (h <= 55) & (s >= 0.45) & (v >= 0.55)] = TIE
cls[(h >= 5) & (h <= 34) & (s >= 0.50) & (v >= 0.40)] = ORANGE
cls[(h >= 5) & (h <= 50) & (s >= 0.40) & (v >= 0.12) & (v < 0.42)] = IRIS
cls[((h < 8) | (h > 335)) & (s >= 0.40) & (v >= 0.30) & (v < 0.9)] = MOUTH
cls[(s <= 0.15) & (v > 0.30) & (v < 0.55)] = SILVER
NAMES = {UNK: "unk", BLACK: "black", WHITE: "white", BLUE: "blue", TIE: "tie", ORANGE: "orange",
         IRIS: "iris", MOUTH: "mouth", SILVER: "silver"}
print("texel classes: " + "  ".join(f"{nm} {(cls == k).sum()}" for k, nm in NAMES.items()))

# --------------------------------------------------------------------------
# 2. skull sphere + zones (same landmarks as the OBJ path)
# --------------------------------------------------------------------------
band = co[(co[:, 2] < top - 0.10 * TOTAL_H) & (co[:, 2] > top - 0.22 * TOTAL_H)]
def fit_sphere(pts):
    A = np.c_[2 * pts, np.ones(len(pts))]
    sol, *_ = np.linalg.lstsq(A, (pts ** 2).sum(1), rcond=None)
    c = sol[:3]; return c, math.sqrt(sol[3] + (c ** 2).sum())
C, R = fit_sphere(band)
resid = np.abs(np.linalg.norm(band - C, axis=1) - R)
C, R = fit_sphere(band[resid < np.percentile(resid, 70)])
dC = np.linalg.norm(co - C, axis=1)
print(f"skull centre ({C[0]:+.3f}, {C[1]:+.3f}, {C[2]:.3f}) r {R:.3f}")

z_shoulder = top - 0.3738 * TOTAL_H
z_belt = top - 0.6773 * TOTAL_H
z_cuff = top - 0.715 * TOTAL_H
z_feet = top - 0.9161 * TOTAL_H
front = nrm[:, 1] < 0
# the collar rises above the shoulder line: shirt colour there is body, not head
head_geo = (co[:, 2] > z_shoulder - 0.05) & (dC < R + 0.7)
head = head_geo & ~(np.isin(cls, (BLUE, TIE)) & (co[:, 2] < z_shoulder + 0.15))
quiff = head & (co[:, 2] > C[2] + R - 0.03) & (dC > R - 0.01)
def grow(seed, allowed, rings):
    cur = seed.copy()
    for _ in range(rings):
        nb = np.zeros(n, bool); nb[EB[cur[EA]]] = True; nb[EA[cur[EB]]] = True
        new = nb & allowed & ~cur
        if not new.any():
            break
        cur |= new
    return cur
quiff = grow(quiff, head & (dC > R + 0.01) & (co[:, 2] > C[2] + 0.6 * R), 150)

# face plate depth: front-facing head surface at eye height, off the sphere
plate_sel = head & (nrm[:, 1] < -0.85) & (co[:, 2] > C[2] - 0.05) & (co[:, 2] < C[2] + 0.2) & \
            (np.abs(co[:, 0] - C[0]) > 0.1) & (np.abs(co[:, 0] - C[0]) < 0.35)
plate_y = float(np.median(co[plate_sel, 1])) if plate_sel.any() else float(C[1] - R + 0.1)
# beak: orange on the head; mouth: red inside it
beak = head & (cls == ORANGE)
beak = grow(beak, head & (cls != BLACK) & (co[:, 1] < plate_y - 0.03) & (np.abs(co[:, 0] - C[0]) < 0.3) &
            (co[:, 2] < C[2] + 0.1), 6)
mouth = head & (cls == MOUTH)
mouth = grow(mouth, head & np.isin(cls, (BLACK, IRIS, UNK)) & (np.abs(co[:, 0] - C[0]) < 0.2) &
             (co[:, 2] > co[beak, 2].min() - 0.02) & (co[:, 2] < co[beak, 2].max()), 12) if beak.any() else mouth
if mouth.sum() > 50:
    A = np.c_[np.ones(mouth.sum()), co[mouth, 0], co[mouth, 0] ** 2]
    smile, *_ = np.linalg.lstsq(A, co[mouth, 2], rcond=None)
else:
    smile = np.array([co[beak, 2].mean() if beak.any() else C[2] - 0.4 * R, 0, 0])
smile_z = smile[0] + smile[1] * co[:, 0] + smile[2] * co[:, 0] ** 2
mouth_z = float(smile[0])
# eyes: iris texels on the face, one cluster per side
eye_centre, in_eye = {}, np.zeros(n, bool)
for sname, sgn in (("L", 1), ("R", -1)):
    ir = head & (cls == IRIS) & (np.sign(co[:, 0] - C[0]) == sgn) & front & (co[:, 2] > C[2] - 0.35 * R) & ~beak
    if ir.sum() < 30:
        print(f"  WARNING: iris {sname} not found"); continue
    ec = co[ir].mean(0)
    eye_centre[sname] = ec
    disc = head & (np.linalg.norm(co[:, [0, 2]] - ec[[0, 2]], axis=1) < 0.11) & (co[:, 1] < 0) & ~beak
    in_eye |= disc
    print(f"  eye {sname}: ({ec[0]:+.3f}, {ec[1]:+.3f}, {ec[2]:.3f})  iris texels {ir.sum()}")
# frame: black on the face plate zone, forward of the plate, at frame height
frame_band = head & (co[:, 2] > C[2] - 0.35 * R) & (co[:, 2] < C[2] + 0.55 * R)
frame = frame_band & (cls == BLACK) & front & (co[:, 1] < plate_y - 0.02) & ~beak & ~quiff & ~in_eye
frame = grow(frame, frame_band & (cls == BLACK) & (co[:, 1] < plate_y + 0.02) & ~beak & ~in_eye, 3)
# temple arms: black or grey, outside the sphere, at eye height, on the sides
temple = frame_band & (dC > R + 0.02) & (np.abs(co[:, 0] - C[0]) > 0.4 * R) & np.isin(cls, (BLACK, SILVER)) & ~quiff
frame |= temple
mask = head & (cls == WHITE) & ~frame & ~beak & ~in_eye

body = ~head
# Arms are tubes hanging beside the torso. Per height slab, the sleeve's
# outer surface (|x| > 0.5) gives the tube's depth extent -> its centre and
# radius; everything inside that circle is arm, the torso beside it is not.
# (An |x| threshold cuts the sleeve lengthwise when it sits close in.)
# Hands and sleeves are fused to the body, so: per height slab fit the BODY's
# core as an axis-aligned ellipse (x²/a² + (y-yc)²/b² = 1), trimming points
# that stick out so the limbs drop out of the fit; whatever lies outside the
# core is limb. Works for the hip/mitten contact and the torso/sleeve contact.
arm_zone = np.zeros(n, bool)
SLAB = 0.02
def fit_ellipse(pts):
    A = np.c_[pts[:, 0] ** 2, pts[:, 1] ** 2, pts[:, 1]]
    sol, *_ = np.linalg.lstsq(A, np.ones(len(pts)), rcond=None)
    Ax, By, Cy = sol
    if Ax <= 0 or By <= 0:
        return None
    yc = -Cy / (2 * By)
    k = 1 + By * yc ** 2
    return math.sqrt(k / Ax), math.sqrt(k / By), yc
for z0 in np.arange(top - 0.84 * TOTAL_H, z_shoulder + 0.06, SLAB):
    slab = body & (co[:, 2] >= z0) & (co[:, 2] < z0 + SLAB)
    if slab.sum() < 40:
        continue
    pts = co[slab][:, :2]
    use = np.abs(pts[:, 0]) < 0.45
    fit = None
    for _ in range(3):
        if use.sum() < 20:
            break
        fit = fit_ellipse(pts[use])
        if fit is None:
            break
        a, b, yc = fit
        use = (pts[:, 0] / a) ** 2 + ((pts[:, 1] - yc) / b) ** 2 < 1.05 ** 2
    if fit is None:
        continue
    a, b, yc = fit
    e = (pts[:, 0] / a) ** 2 + ((pts[:, 1] - yc) / b) ** 2
    idx = np.where(slab)[0]
    outside = e > 1.06 ** 2
    # the limb's inner side sits within the core's footprint but faces the
    # body; the body's own surface there faces outward
    sgn = np.sign(pts[:, 0])
    inner = (e > 0.80 ** 2) & (nrm[idx, 0] * sgn < -0.15)
    arm_zone[idx[(outside | inner) & (np.abs(pts[:, 0]) > 0.30)]] = True
hands = arm_zone & (cls == BLACK) & (co[:, 2] < z_cuff + 0.04)
hands = grow(hands, arm_zone & (cls != BLUE) & (co[:, 2] < z_cuff + 0.08), 6)
arms = arm_zone & ~hands
feet_zone = body & (co[:, 2] < z_feet + 0.05)
feet = feet_zone & (cls == ORANGE)
feet = grow(feet, feet_zone & (cls != BLACK), 6)
lower = body & (co[:, 2] < z_belt) & ~arm_zone
belt = body & (np.abs(co[:, 2] - z_belt) < 0.06) & ~arm_zone
legs = lower & ~feet & ~belt
torso = body & ~lower & ~arm_zone
tie = torso & (cls == TIE) & front & (np.abs(co[:, 0]) < 0.3)
tie = grow(tie, torso & front & np.isin(cls, (TIE, ORANGE, IRIS)) & (np.abs(co[:, 0]) < 0.3), 20)

regions = {
    "head": head & ~beak & ~mouth, "mask": mask, "glasses": frame, "quiff": quiff,
    "beak_upper": (beak | mouth) & (co[:, 2] >= smile_z - 0.003),
    "beak_lower": (beak | mouth) & (co[:, 2] < smile_z - 0.003),
    "mouth": mouth,
    "eye_L": in_eye & (co[:, 0] > C[0]), "eye_R": in_eye & (co[:, 0] < C[0]),
    "torso": torso, "tie": tie, "belt": belt,
    "arm_L": arms & (co[:, 0] > 0), "arm_R": arms & (co[:, 0] < 0),
    "hand_L": hands & (co[:, 0] > 0), "hand_R": hands & (co[:, 0] < 0),
    "leg_L": legs & (co[:, 0] > 0), "leg_R": legs & (co[:, 0] < 0),
    "foot_L": feet & (co[:, 0] > 0), "foot_R": feet & (co[:, 0] < 0),
}
for vg in list(ob.vertex_groups):
    ob.vertex_groups.remove(vg)
for name, m in regions.items():
    vg = ob.vertex_groups.new(name=name)
    idx = np.where(m)[0]
    if len(idx):
        vg.add(idx.tolist(), 1.0, 'REPLACE')
    print(f"  region {name:11s} {len(idx):7d}")

# region debug colour layer + keep the texture material as the colour source
REG_COL = {
    "quiff": (0.9, 0.1, 0.9), "glasses": (0.1, 0.1, 0.1), "beak_upper": (1.0, 0.5, 0.0), "beak_lower": (0.8, 0.2, 0.0),
    "mouth": (1.0, 0.0, 0.2), "eye_L": (0.2, 0.9, 1.0), "eye_R": (0.0, 0.5, 1.0), "mask": (1.0, 1.0, 1.0),
    "torso": (0.4, 0.6, 1.0), "tie": (1.0, 0.85, 0.1), "belt": (0.3, 0.3, 0.3),
    "arm_L": (0.2, 0.8, 0.2), "arm_R": (0.0, 0.5, 0.1), "hand_L": (0.7, 1.0, 0.4), "hand_R": (0.4, 0.7, 0.2),
    "leg_L": (0.6, 0.3, 0.8), "leg_R": (0.4, 0.1, 0.6), "foot_L": (1.0, 0.7, 0.3), "foot_R": (0.9, 0.5, 0.2),
}
rcols = np.zeros((n, 4), dtype=np.float32); rcols[:, 3] = 1
rcols[regions["head"], :3] = (0.35, 0.35, 0.35)
for name, col in REG_COL.items():
    rcols[regions[name], :3] = col
rc = me.color_attributes.get("PikuRegion") or me.color_attributes.new("PikuRegion", 'FLOAT_COLOR', 'POINT')
rc.data.foreach_set("color", rcols.ravel())
# a vertex-colour node so the region render switch works on this material too
for m in me.materials:
    if m.use_nodes and not any(nd.type == 'VERTEX_COLOR' for nd in m.node_tree.nodes):
        vc = m.node_tree.nodes.new("ShaderNodeVertexColor"); vc.layer_name = "PikuRegion"; vc.name = "RegionDebug"

ob["piku_stage"] = "segmented"
ob["skull_centre"] = C.tolist(); ob["skull_r"] = float(R)
for sname, c in eye_centre.items():
    ob[f"eye_{sname}"] = c.tolist()
ob["eye_r"] = 0.09; ob["mouth_z"] = mouth_z
ob["z_shoulder"] = float(z_shoulder); ob["z_belt"] = float(z_belt); ob["z_cuff"] = float(z_cuff); ob["z_feet"] = float(z_feet)
bpy.ops.wm.save_as_mainfile(filepath=OUT, compress=True)
print(f"saved -> {OUT}  ({time.time()-t0:.0f}s)")
print("GEN_SEGMENT_DONE")
