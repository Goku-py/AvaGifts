"""
Step 1 — region-segment and flat-colour the source mesh.

    /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/piku3d/obj_segment.py

Reads  _reference/piku/blender/piku_source.blend
       _reference/piku/views/piku-{front,back,side,threequarter}-view.png
Writes _reference/piku/blender/piku_segmented.blend
       _reference/piku/renders/obj_proj_{front,back,side,threequarter}.png  (alignment overlays)

What the mesh is (measured): one shell; the head is a sphere with a flat
face plate; the glasses are a chunky bevelled frame fused to the head; the
beak protrudes from the plate; the eyes are NOT modelled (the face inside the
frame is flat at the cheek's depth — the viewer painted them); hands are
fused to the hips. So:

  * every rig region comes from GEOMETRY: skull sphere, front-view depth
    buffer (what stands off the face: frame, beak; what is hidden: chin),
    height bands for the body;
  * the only thing the reference photos decide is the painted black/white
    boundary on the head, and the tie / buckle. Those are read from
    morphologically cleaned class maps (thin highlight streaks and frame
    shadows removed in image space) projected back through the same
    row-wise mapping that the alignment overlays verify;
  * eyes are painted as discs on the plate for the flat look; the animated
    eyes come from separate objects in Step 3.
"""
import bpy, math, os, time
from collections import deque
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
SRC = os.path.join(ROOT, "_reference", "piku", "blender", "piku_source.blend")
OUT = os.path.join(ROOT, "_reference", "piku", "blender", "piku_segmented.blend")
VIEWS_DIR = os.path.join(ROOT, "_reference", "piku", "views")
DBG_DIR = os.path.join(ROOT, "_reference", "piku", "renders")
TOTAL_H = 2.90

t0 = time.time()
bpy.ops.wm.open_mainfile(filepath=SRC)
ob = bpy.data.objects["Piku_Source"]; me = ob.data
n = len(me.vertices)
co = np.empty(n * 3); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3)
nrm = np.empty(n * 3); me.vertex_normals.foreach_get("vector", nrm); nrm = nrm.reshape(-1, 3)
E = len(me.edges)
ev = np.empty(E * 2, dtype=np.int64); me.edges.foreach_get("vertices", ev); ev = ev.reshape(-1, 2)
EA, EB = ev[:, 0], ev[:, 1]
print(f"loaded {n} verts, {E} edges ({time.time()-t0:.0f}s)")

# --------------------------------------------------------------------------
# 1. skull sphere
# --------------------------------------------------------------------------
top = co[:, 2].max()
band = co[(co[:, 2] < top - 0.10 * TOTAL_H) & (co[:, 2] > top - 0.22 * TOTAL_H)]
def fit_sphere(pts):
    A = np.c_[2 * pts, np.ones(len(pts))]
    sol, *_ = np.linalg.lstsq(A, (pts ** 2).sum(1), rcond=None)
    c = sol[:3]
    return c, math.sqrt(sol[3] + (c ** 2).sum())
C, R = fit_sphere(band)
resid = np.abs(np.linalg.norm(band - C, axis=1) - R)
C, R = fit_sphere(band[resid < np.percentile(resid, 70)])
print(f"skull sphere: centre ({C[0]:+.3f}, {C[1]:+.3f}, {C[2]:.3f})  r {R:.3f}  "
      f"-> {(top-C[2])/TOTAL_H:.4f}h / r {R/TOTAL_H:.4f}h  (reference 0.2564h / 0.2077h)")
dC = np.linalg.norm(co - C, axis=1)

# --------------------------------------------------------------------------
# 2. reference views: raw classes + cleaned head maps
# --------------------------------------------------------------------------
def load_image(name):
    img = bpy.data.images.load(os.path.join(VIEWS_DIR, name))
    W, H = img.size
    px = np.empty(W * H * 4, dtype=np.float32)
    img.pixels.foreach_get(px)
    return px.reshape(H, W, 4)[::-1, :, :3], W, H       # top-down rows, drop alpha

def silhouette_mask(px):
    """Background = near-white pixels connected to the image border."""
    H, W = px.shape[:2]
    white = (px >= 243 / 255).all(2)
    bg = np.zeros((H, W), dtype=bool)
    dq = deque()
    for x in range(W):
        for y in (0, H - 1):
            if white[y, x] and not bg[y, x]:
                bg[y, x] = True; dq.append((y, x))
    for y in range(H):
        for x in (0, W - 1):
            if white[y, x] and not bg[y, x]:
                bg[y, x] = True; dq.append((y, x))
    while dq:
        y, x = dq.popleft()
        for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= ny < H and 0 <= nx < W and white[ny, nx] and not bg[ny, nx]:
                bg[ny, nx] = True; dq.append((ny, nx))
    return ~bg

def rgb_to_hsv(rgb):
    r, g, b = rgb[..., 0], rgb[..., 1], rgb[..., 2]
    mx = rgb.max(-1); mn = rgb.min(-1); d = mx - mn
    m = d > 1e-6
    safe = np.where(m, d, 1)
    rc = (mx - r) / safe; gc = (mx - g) / safe; bc = (mx - b) / safe
    h = np.where(mx == r, bc - gc, np.where(mx == g, 2 + rc - bc, 4 + gc - rc))
    h = np.where(m, (h / 6) % 1.0, 0) * 360
    s = np.where(mx > 1e-6, d / np.where(mx > 1e-6, mx, 1), 0)
    return h, s, mx

def erode(m, r):
    out = m.copy()
    for ax in (0, 1):
        acc = out.copy()
        for s in range(1, r + 1):
            acc &= np.roll(out, s, axis=ax); acc &= np.roll(out, -s, axis=ax)
        out = acc
    return out
def dilate(m, r): return ~erode(~m, r)
def opening(m, r): return dilate(erode(m, r), r)

UNK, BLACK, WHITE, BLUE, TIE, ORANGE, IRIS, MOUTH, SILVER = range(-1, 8)
NCLS = 8
NAMES = {UNK: "unk", BLACK: "black", WHITE: "white", BLUE: "blue", TIE: "tie", ORANGE: "orange",
         IRIS: "iris", MOUTH: "mouth", SILVER: "silver"}

def sat_classes(c, h, s, v):
    c[(h >= 195) & (h <= 245) & (s >= 0.18) & (v >= 0.30)] = BLUE
    c[(h > 34) & (h <= 52) & (s >= 0.55) & (v >= 0.60)] = TIE
    c[(h >= 8) & (h <= 34) & (s >= 0.60) & (v >= 0.45)] = ORANGE
    c[(h >= 8) & (h <= 48) & (s >= 0.40) & (s <= 0.99) & (v >= 0.15) & (v < 0.45)] = IRIS
    c[((h < 8) | (h > 340)) & (s >= 0.45) & (v >= 0.30) & (v < 0.85)] = MOUTH
    return c

def classify_raw(px):
    """Per-pixel classes for seeds (tie, iris, orange, silver)."""
    h, s, v = rgb_to_hsv(px)
    c = np.full(h.shape, UNK, dtype=np.int8)
    c[(s <= 0.12) & (v >= 0.80)] = WHITE
    c[(v <= 0.30)] = BLACK
    c = sat_classes(c, h, s, v)
    c[(s <= 0.15) & (v > 0.35) & (v < 0.80)] = SILVER
    return c

def classify_head(px, fg):
    """Black/white map for the painted head: only THICK dark (the feather
    black, the frame front) and THICK bright (the mask) survive; thin
    highlight streaks, rim highlights, pupils and shadowed mask fall to
    UNK and are decided by their surface neighbours later."""
    h, s, v = rgb_to_hsv(px)
    sat = s >= 0.45
    dark = (v < 0.30) & fg & ~sat
    white = (s < 0.30) & (v >= 0.62) & fg
    c = np.full(h.shape, UNK, dtype=np.int8)
    c[opening(dark, 8)] = BLACK
    c[opening(white, 5)] = WHITE
    return sat_classes(c, h, s, v)

def smooth(a, k=11):
    idx = np.arange(len(a)); ok = ~np.isnan(a)
    a = np.interp(idx, idx[ok], a[ok])
    return np.convolve(a, np.ones(k) / k, mode="same")

def view_setup(name, U, V):
    px, W, H = load_image(name)
    fg = silhouette_mask(px)
    rows = np.where(fg.any(1))[0]
    y0, y1 = rows[0], rows[-1]
    TOT = y1 - y0
    best_w, best_y = 0, y0
    for y in range(y0 + int(0.12 * TOT), y0 + int(0.36 * TOT)):
        xs = np.where(fg[y])[0]
        if len(xs) and xs[-1] - xs[0] > best_w:
            best_w, best_y = xs[-1] - xs[0], y
    scale = TOT / TOTAL_H
    U = np.array(U, float); V = np.array(V, float)
    # Row-wise horizontal mapping: per row, match the image silhouette's
    # centre and width to the mesh silhouette's at that height (the
    # references are perspective renders).
    cx_row = np.full(H, np.nan); w_row = np.full(H, np.nan)
    for y in rows:
        r = np.where(fg[y])[0]
        cx_row[y] = (r[0] + r[-1]) / 2; w_row[y] = r[-1] - r[0]
    cx_row, w_row = smooth(cx_row), smooth(w_row)
    u_all = co @ U
    NB = 320
    zb = np.clip((co[:, 2] / top * NB).astype(int), 0, NB - 1)
    umin = np.full(NB, np.inf); umax = np.full(NB, -np.inf)
    np.minimum.at(umin, zb, u_all); np.maximum.at(umax, zb, u_all)
    empty = ~np.isfinite(umin)
    umin[empty] = np.nan; umax[empty] = np.nan
    mc = smooth((umin + umax) / 2, 7); mw = smooth(umax - umin, 7)
    zc = (np.arange(NB) + 0.5) / NB * top
    print(f"  view {name:32s} figure {TOT}px  skull dia {best_w/TOT:.4f}h at {(best_y-y0)/TOT:.4f}h  (mesh {2*R/TOTAL_H:.4f}h)")
    return dict(name=name, raw=classify_raw(px), head=classify_head(px, fg), fg=fg, W=W, H=H, y0=y0,
                scale=scale, U=U, V=V, cx_row=cx_row, w_row=w_row, mc=mc, mw=mw, zc=zc)

# The references are perspective renders shot from above (camera height ZC,
# distance D_CAM from the skull centre's depth): surfaces nearer the camera
# than the head centre (face plate, beak, frame) appear slightly larger and
# LOWER. Fitted on the frame rims: photo z_lin 2.055 / 2.33 vs mesh 2.11 / 2.39
# at 0.54 nearer -> a 0.055 drop.
D_CAM, ZC = 13.0, 3.5
def project(v, p):
    persp = D_CAM / (D_CAM - (p @ v["V"] - C @ v["V"]))
    zp = ZC + (p[:, 2] - ZC) * persp
    row = v["y0"] + (top - zp) * v["scale"]
    rows = np.arange(v["H"])
    img_c = np.interp(row, rows, v["cx_row"]); img_w = np.interp(row, rows, v["w_row"])
    msh_c = np.interp(p[:, 2], v["zc"], v["mc"]); msh_w = np.interp(p[:, 2], v["zc"], v["mw"])
    ratio = np.clip(img_w / np.maximum(msh_w, 1e-3), 0.75 * v["scale"], 1.3 * v["scale"])
    return img_c + (p @ v["U"] - msh_c) * ratio * persp, row

def sample(v, sel, which):
    """Class of the `which` map under every selected vertex (UNK off-figure)."""
    p = co[sel]
    px, py = project(v, p)
    ix = np.clip(np.rint(px).astype(int), 0, v["W"] - 1)
    iy = np.clip(np.rint(py).astype(int), 0, v["H"] - 1)
    c = v[which][iy, ix].copy()
    c[~v["fg"][iy, ix]] = UNK
    return c

print("reference views:")
S45 = math.sin(math.radians(45))
views = [
    view_setup("piku-front-view.png",        U=(1, 0, 0),    V=(0, -1, 0)),
    view_setup("piku-back-view.png",         U=(-1, 0, 0),   V=(0, 1, 0)),
    # Piku's RIGHT side (no pocket visible), he faces image-right: camera at -X
    view_setup("piku-side-view.png",         U=(0, -1, 0),   V=(-1, 0, 0)),
    # shot from Piku's front-RIGHT: beak points image-right, pocket foreshortened
    view_setup("piku-threequarter-view.png", U=(S45, -S45, 0), V=(-S45, -S45, 0)),
]
# Piku's left side has no photo; his right side mirrored is on-model for
# everything but the pocket (shirt-blue either way).
views.append(dict(views[2], name="piku-side-view.png (mirrored for left)", V=np.array((1, 0, 0), float)))
FRONT, BACK, SIDE, THREEQ, SIDE_M = range(5)
print(f"views ready ({time.time()-t0:.0f}s)")

# --------------------------------------------------------------------------
# 3. depth buffers: hidden / stand-off layer per view
# --------------------------------------------------------------------------
facing = np.stack([nrm @ v["V"] for v in views], axis=1)        # n x views
CELL, HID_TOL, GAP_MIN, LAYER_MAX = 0.008, 0.030, 0.040, 0.40
hidden = np.zeros((n, len(views)), dtype=bool)
layer = np.zeros((n, len(views)), dtype=bool)
for vi, v in enumerate(views):
    u = co @ v["U"]; d = -(co @ v["V"])            # smaller d = closer to camera
    cu = np.floor(u / CELL).astype(np.int64); cz = np.floor(co[:, 2] / CELL).astype(np.int64)
    key = (cu - cu.min()) * 4096 + (cz - cz.min())
    ok = np.lexsort((d, key))
    ks, ds, fs = key[ok], d[ok], facing[ok, vi]
    first = np.r_[True, ks[1:] != ks[:-1]]
    starts = np.where(first)[0]
    cell_of = np.cumsum(first) - 1
    mins = np.minimum.reduceat(ds, starts)
    behind = ds > mins[cell_of] + HID_TOL
    # the next FRONT-FACING surface behind the closest one: a rim over the
    # face, the beak over the chin — never the back of the same shell
    cand = np.where((ds > mins[cell_of] + GAP_MIN) & (fs > 0.05), ds, np.inf)
    second = np.minimum.reduceat(cand, starts)
    hidden[ok, vi] = behind
    layer[ok, vi] = ~behind & (second[cell_of] < mins[cell_of] + LAYER_MAX)
print(f"depth buffers ({time.time()-t0:.0f}s)")

# --------------------------------------------------------------------------
# 4. raw sampling (seeds) + alignment overlays
# --------------------------------------------------------------------------
def best_view_sample(which, cand_views, sel_mask):
    out = np.full(n, UNK, dtype=np.int8)
    pref = np.full((n, len(views)), -9.0)
    for vi in cand_views:
        pref[:, vi] = facing[:, vi]
    order = np.argsort(-pref, axis=1)
    for rank in range(len(cand_views)):
        for vi in cand_views:
            sel = sel_mask & (order[:, rank] == vi) & (out == UNK) & (facing[:, vi] > 0.35) & ~hidden[:, vi]
            if sel.any():
                out[np.where(sel)[0]] = sample(views[vi], sel, which)
    return out

vraw = best_view_sample("raw", [FRONT, BACK, SIDE, THREEQ, SIDE_M], np.ones(n, bool))
print(f"raw classes sampled for {(vraw != UNK).sum()} / {n} verts ({time.time()-t0:.0f}s)")

DBG_COL = {BLACK: (0, 0, 0), WHITE: (1, 1, 1), BLUE: (0.3, 0.5, 1), TIE: (1, 0.75, 0.1),
           ORANGE: (1, 0.4, 0), IRIS: (0.5, 0.2, 0), MOUTH: (1, 0, 0.3), SILVER: (0.6, 0.6, 0.7),
           UNK: (0, 1, 0)}
for vi, tag in ((FRONT, "front"), (BACK, "back"), (SIDE, "side"), (THREEQ, "threequarter")):
    v = views[vi]
    sel = (facing[:, vi] > 0.35) & ~hidden[:, vi]
    px, py = project(v, co[sel])
    ix = np.clip(np.rint(px).astype(int), 0, v["W"] - 1)
    iy = np.clip(np.rint(py).astype(int), 0, v["H"] - 1)
    c = v["raw"][iy, ix].copy(); c[~v["fg"][iy, ix]] = UNK
    ref_px, _, _ = load_image(v["name"])
    canvas = 0.35 + 0.65 * ref_px * 0.35
    lut = np.zeros((NCLS + 1, 3), dtype=np.float32)
    for k, col in DBG_COL.items():
        lut[k + 1] = col
    canvas[iy, ix] = lut[c + 1]
    out = bpy.data.images.new(f"proj_{vi}", v["W"], v["H"])
    rgba = np.ones((v["H"], v["W"], 4), dtype=np.float32); rgba[:, :, :3] = canvas[::-1]
    out.pixels.foreach_set(rgba.ravel())
    out.filepath_raw = os.path.join(DBG_DIR, f"obj_proj_{tag}.png")
    out.file_format = 'PNG'; out.save()

# --------------------------------------------------------------------------
# 5. zones
# --------------------------------------------------------------------------
z_shoulder = top - 0.3738 * TOTAL_H
z_belt = top - 0.6773 * TOTAL_H
z_cuff = top - 0.715 * TOTAL_H          # rolled sleeve ends; mitten hands below
z_feet = top - 0.9161 * TOTAL_H
front = nrm[:, 1] < 0
head_geo = (co[:, 2] > z_shoulder - 0.05) & (dC < R + 0.7)
collar_band = co[:, 2] < z_shoulder + 0.12
head = head_geo & ~(np.isin(vraw, (BLUE, TIE)) & collar_band)
quiff = (co[:, 2] > C[2] + R - 0.02) & (dC > R - 0.01)
face_zone = head & front & (co[:, 2] < C[2] + 0.62 * R)
hid_front = hidden[:, FRONT] & (facing[:, FRONT] > 0.35)
standoff = layer[:, FRONT] & (facing[:, FRONT] > 0.15)
# the collar flaps stand off the neck; they are shirt, whatever the photo said
head &= ~(collar_band & standoff & (co[:, 2] < z_shoulder + 0.10) &
          ((np.abs(co[:, 0] - C[0]) > 0.10) | (co[:, 2] < z_shoulder + 0.04)))
face_zone = head & front & (co[:, 2] < C[2] + 0.62 * R)

arm_zone = (co[:, 2] > top - 0.82 * TOTAL_H) & (co[:, 2] < z_shoulder + 0.05) & \
           (np.abs(co[:, 0]) > np.where(co[:, 2] > z_belt, 0.46, 0.50))
belt_zone = (np.abs(co[:, 2] - z_belt) < 0.06) & ~arm_zone
feet_zone = co[:, 2] < z_feet + 0.025
trouser_zone = (co[:, 2] < z_belt - 0.06) & ~feet_zone & ~arm_zone
shirt_zone = (co[:, 2] >= z_belt + 0.06) & ~arm_zone & ~head
buckle_box = belt_zone & (np.abs(co[:, 0]) < 0.13) & front

# --------------------------------------------------------------------------
# 6. head structure from geometry
# --------------------------------------------------------------------------
def grow(seed, allowed, rings):
    cur = seed.copy()
    for _ in range(rings):
        nb = np.zeros(n, bool)
        nb[EB[cur[EA]]] = True; nb[EA[cur[EB]]] = True
        new = nb & allowed & ~cur
        if not new.any():
            break
        cur |= new
    return cur

# the tufts sweep back below the sphere's top; follow them down along the
# surface as long as they stay outside the skull (well above the frame)
quiff = grow(quiff, head & (dC > R + 0.01) & (co[:, 2] > C[2] + 0.6 * R), 150)

# Measured layout at the centre line (x ~ 0): frame bridge z 2.23-2.35, upper
# mandible z 2.07-2.25 running under it (tip at 2.09, front y -0.64), mouth
# opening z 1.97-2.05 (interior y -0.34), lower lip z 1.87-1.97, chin below.
# The lens rims and the beak overlap in z, so the frame is seeded at the
# rims (|x| beyond the bridge) and grown along the stand-off surface with the
# beak's top slope as a barrier; the beak is seeded from photo-orange
# stand-off verts and takes everything protruding in its footprint.
BEAK_Z_TOP = 2.32
plate_sel = head & ~standoff & (facing[:, FRONT] > 0.85) & (co[:, 1] < 0) & \
            (co[:, 2] > 2.15) & (co[:, 2] < 2.35) & (np.abs(co[:, 0] - C[0]) > 0.12) & (np.abs(co[:, 0] - C[0]) < 0.35)
plate_y = float(np.median(co[plate_sel, 1]))
beak_slope = head & (nrm[:, 2] > 0.35) & (nrm[:, 1] < -0.3) & (np.abs(co[:, 0] - C[0]) < 0.22) & \
             (co[:, 2] > 2.0) & (co[:, 2] < BEAK_Z_TOP)
# the beak's volume: well forward of the plate, below the bridge, centred
beak_vol = head & (co[:, 1] < plate_y - 0.06) & (co[:, 2] < 2.22) & (np.abs(co[:, 0] - C[0]) < 0.24)
frame_seed = face_zone & standoff & (co[:, 2] > 2.05) & (np.abs(co[:, 0] - C[0]) > 0.13) & \
             (vraw != ORANGE) & ~quiff & ~beak_slope & ~beak_vol
frame = grow(frame_seed, face_zone & standoff & (vraw != ORANGE) & ~beak_slope & ~beak_vol & ~quiff & (co[:, 2] > 2.0), 40)
# temple arms: stand off the sides of the skull in the side views, or sit
# clearly outside the sphere at eye height
temple_band = head & (np.abs(co[:, 2] - (C[2] + 0.1 * R)) < 0.24 * R) & ~quiff
temple = temple_band & (((layer[:, SIDE_M] & (facing[:, SIDE_M] > 0.15)) & (co[:, 0] > C[0])) |
                        ((layer[:, SIDE] & (facing[:, SIDE] > 0.15)) & (co[:, 0] < C[0])))
temple |= temple_band & (dC > R + 0.035) & (np.abs(co[:, 0] - C[0]) > 0.45 * R)
frame |= temple

# beak: sampled orange that stands off the chin / mouth interior, grown along
# the stand-off surface well forward of the plate, then everything that
# protrudes forward of the plate in its footprint
beak_seed = head & standoff & (vraw == ORANGE) & (co[:, 2] < BEAK_Z_TOP) & \
            (np.abs(co[:, 0] - C[0]) < 0.25) & ~frame
beak = grow(beak_seed, head & standoff & ~frame & (co[:, 2] < BEAK_Z_TOP) &
            (np.abs(co[:, 0] - C[0]) < 0.28) & (co[:, 1] < plate_y - 0.04), 120)
bx0, bx1 = co[beak, 0].min() - 0.02, co[beak, 0].max() + 0.02
bz0, bz1 = co[beak, 2].min(), co[beak, 2].max() + 0.02
beak_box = head & (co[:, 0] > bx0) & (co[:, 0] < bx1) & (co[:, 2] > bz0) & (co[:, 2] < bz1)
beak |= beak_box & (co[:, 1] < plate_y - 0.03) & ~frame & ~quiff & ~temple & ~beak_slope
beak |= beak_slope & beak_box
beak = grow(beak, beak_box & (co[:, 1] < -0.40) & ~frame, 6)      # close the seam at the root
BEAK_Z = float(co[beak, 2].max()) if beak.any() else 2.25
frame &= ~beak
# mouth interior: inside the beak's footprint, not beak, visible from the
# front, and reading red or dark in the photo
# (the interior sits behind the plate; the lens plates and cheeks do not)
cavity = beak_box & ~beak & ~frame & (co[:, 1] > plate_y + 0.005) & (co[:, 2] < BEAK_Z - 0.03) & \
         (np.abs(co[:, 0] - C[0]) < 0.20)
MC = 0.01
mcx = np.clip(((co[:, 0] + 0.65) / MC).astype(int), 0, 129); mcz = np.clip(((co[:, 2] - 1.85) / MC).astype(int), 0, 74)
beak_cells = np.zeros((75, 130), bool); beak_cells[mcz[beak], mcx[beak]] = True
beak_cells = dilate(beak_cells, 1)
cavity &= beak_cells[mcz, mcx] & (np.abs(co[:, 0] - C[0]) < 0.14) & (co[:, 1] < C[1])
mouth = cavity & np.isin(vraw, (MOUTH, BLACK, IRIS, UNK))
tongue = mouth & (vraw == MOUTH)
mouth_z = float(np.median(co[tongue, 2])) if tongue.sum() > 20 else \
          (float(np.median(co[mouth, 2])) if mouth.any() else float(C[2] - 0.5 * R))
mouth &= co[:, 2] > mouth_z - 0.06            # never the chin under the lower lip
# the smile line: z = a + b x + c x^2 through the mouth interior, used to
# split the beak into the upper mandible (head) and the lower one (jaw)
if mouth.sum() > 50:
    A = np.c_[np.ones(mouth.sum()), co[mouth, 0], co[mouth, 0] ** 2]
    smile, *_ = np.linalg.lstsq(A, co[mouth, 2], rcond=None)
else:
    smile = np.array([mouth_z, 0.0, 0.0])
smile_z = smile[0] + smile[1] * co[:, 0] + smile[2] * co[:, 0] ** 2
mouth &= np.abs(co[:, 2] - smile_z) < 0.06       # the cavity, not the cheeks beside it
# the whole mouth band inside the beak footprint that is not beak is cavity:
# lips' inner surfaces included, whatever their depth
mouth |= beak_box & ~beak & ~frame & beak_cells[mcz, mcx] & (np.abs(co[:, 0] - C[0]) < 0.16) & \
         (np.abs(co[:, 2] - smile_z) < 0.07) & (co[:, 1] < C[1])      # front half only
print(f"frame {frame.sum()}  beak {beak.sum()}  (box x {bx0:+.2f}..{bx1:+.2f} z {bz0:.2f}..{bz1:.2f})  "
      f"mouth {mouth.sum()} (tongue {tongue.sum()}, mouth line z {mouth_z:.3f}, smile {smile.round(3)})")

# --- the frame on a 2D (x, z) grid: openings, bridge stripe, footprint ------
GX0, GX1, GZ0, GZ1, GC = -0.65, 0.65, 1.85, 2.60, 0.01
NGX, NGZ = int(round((GX1 - GX0) / GC)), int(round((GZ1 - GZ0) / GC))
gix = np.clip(((co[:, 0] - GX0) / GC).astype(int), 0, NGX - 1)
giz = np.clip(((co[:, 2] - GZ0) / GC).astype(int), 0, NGZ - 1)
in_grid = (co[:, 0] >= GX0) & (co[:, 0] < GX1) & (co[:, 2] >= GZ0) & (co[:, 2] < GZ1)
occ = np.zeros((NGZ, NGX), bool)
ff = frame & ~temple & in_grid & (facing[:, FRONT] > 0.15)
occ[giz[ff], gix[ff]] = True
occ = dilate(occ, 1)
def flood(free, seeds):
    reached = np.zeros_like(free)
    dq = deque(seeds)
    for s in seeds:
        reached[s] = True
    while dq:
        y, x = dq.popleft()
        for ny, nx in ((y + 1, x), (y - 1, x), (y, x + 1), (y, x - 1)):
            if 0 <= ny < NGZ and 0 <= nx < NGX and free[ny, nx] and not reached[ny, nx]:
                reached[ny, nx] = True; dq.append((ny, nx))
    return reached
# The face inside each opening is the flat plate. Its depth: front-facing,
# non-stand-off head surface at eye height. Opening cells = cells whose
# front-most surface is at plate depth, inside that side's frame bbox; the
# frame's front (rims, bridge) is well forward of it.
front_layer = (co[:, 1] < -0.25) & front & in_grid
cid = giz * NGX + gix
fl = head & in_grid & (co[:, 1] < 0)
cellmin = np.full(NGZ * NGX, np.inf); np.minimum.at(cellmin, cid[fl], co[fl, 1])
cellmin = cellmin.reshape(NGZ, NGX)
plate_cells = (cellmin > plate_y - 0.025) & (cellmin < plate_y + 0.03) & ~occ
gxc = (np.arange(NGX) + 0.5) * GC + GX0; gzc = (np.arange(NGZ) + 0.5) * GC + GZ0
opening_grid = {}
for side_name, sgn in (("L", 1), ("R", -1)):
    fr = frame & ~temple & (np.sign(co[:, 0] - C[0]) == sgn) & (facing[:, FRONT] > 0.15)
    if fr.sum() < 100:
        print(f"  WARNING: no frame found on side {side_name}"); opening_grid[side_name] = np.zeros_like(occ); continue
    fx0, fx1, fz0, fz1 = co[fr, 0].min(), co[fr, 0].max(), co[fr, 2].min(), co[fr, 2].max()
    half = plate_cells & ((gxc > fx0) & (gxc < fx1))[None, :] & ((gzc > fz0) & (gzc < fz1))[:, None]
    best = None
    seen = np.zeros_like(half)
    for y, x in zip(*np.where(half)):
        if seen[y, x]:
            continue
        comp = flood(half & ~seen, [(y, x)])
        seen |= comp
        if best is None or comp.sum() > best.sum():
            best = comp
    if best is None or best.sum() < 50:
        print(f"  WARNING: no plate-depth opening on side {side_name}")
        opening_grid[side_name] = np.zeros_like(half)
    else:
        # the plate-depth cells ring the slight dome at the lens centre; the
        # opening is their filled bounding box minus the frame's front
        ys, xs = np.where(best)
        box = np.zeros_like(best); box[ys.min():ys.max() + 1, xs.min():xs.max() + 1] = True
        opening_grid[side_name] = box & ~occ & (cellmin > plate_y - 0.06)
        opening_box_any = (opening_box_any | box) if 'opening_box_any' in dir() else box
# the slight dome at each lens centre can read as a stand-off layer in the
# depth buffer; inside an opening only surfaces well forward of the plate are frame
opening_any = np.zeros_like(occ)
for g in opening_grid.values():
    opening_any |= g
dome_fix = frame & ~temple & in_grid & opening_box_any[giz, gix] & (co[:, 1] > plate_y - 0.06)
frame &= ~dome_fix
opening_v, ext = {}, {}
for s, g in opening_grid.items():
    opening_v[s] = head & front_layer & g[giz, gix] & ~frame & ~beak & (np.abs(co[:, 1] - plate_y) < 0.05)
    ys, xs = np.where(g)
    if len(xs):
        ext[s] = (gxc[xs.min()], gxc[xs.max()], gzc[ys.min()], gzc[ys.max()])
        print(f"  opening {s}: x {ext[s][0]:+.3f}..{ext[s][1]:+.3f}  z {ext[s][2]:.3f}..{ext[s][3]:.3f}  "
              f"cells {g.sum()}  plate verts {opening_v[s].sum()}")
# the frame's footprint on the plate: its bevel (well forward of the plate)
# is frame; whatever is left directly under it is decided by neighbours
under_frame = head & front_layer & occ[giz, gix] & ~frame & ~beak
bevel = under_frame & (co[:, 1] < plate_y - 0.02) & ~beak_slope & ~beak_box
for side_name, sgn in (("L", 1), ("R", -1)):
    fr = frame & ~temple & (np.sign(co[:, 0] - C[0]) == sgn)
    if fr.sum() < 100: continue
    fx0, fx1, fz0, fz1 = co[fr, 0].min() - 0.01, co[fr, 0].max() + 0.01, co[fr, 2].min() - 0.01, co[fr, 2].max() + 0.01
    bevel |= head & ~beak & ~beak_slope & ~beak_box & (co[:, 1] < plate_y - 0.045) & \
             (co[:, 0] > fx0) & (co[:, 0] < fx1) & (co[:, 2] > fz0) & (co[:, 2] < fz1) & (np.abs(co[:, 0] - C[0]) > 0.02)
bevel &= ~(in_grid & opening_box_any[giz, gix] & (co[:, 1] > plate_y - 0.06))   # the lens plate is never frame
frame |= bevel
under_frame &= ~bevel
# black stripe: between the two openings, from the beak root up (merges into the hood)
if "L" in ext and "R" in ext:
    stripe = head & front_layer & (co[:, 0] > ext["R"][1] + 0.005) & (co[:, 0] < ext["L"][0] - 0.005) & \
             (co[:, 2] > BEAK_Z - 0.02) & ~frame & ~beak & ~mouth
else:
    stripe = np.zeros(n, bool)
# the frame casts a shadow on the cheeks in every photo; dark pixels within
# ~0.05 of its footprint are not evidence of black feathers
near_frame = head & front_layer & dilate(occ, 5)[giz, gix] & ~frame & ~beak & ~stripe
# the temple arms hide a strip of the skull in the side views; that strip is
# black feather. Footprint on a (y, z) grid per side.
SY0, SGC = -0.7, 0.01
NSY = int(round(1.4 / SGC))
siy = np.clip(((co[:, 1] - SY0) / SGC).astype(int), 0, NSY - 1)
under_temple = np.zeros(n, bool)
for sgn in (1, -1):
    tocc = np.zeros((NGZ, NSY), bool)
    tv = temple & (np.sign(co[:, 0] - C[0]) == sgn) & in_grid
    tocc[giz[tv], siy[tv]] = True
    tocc = dilate(tocc, 2)
    under_temple |= head & ~frame & in_grid & tocc[giz, siy] & (np.sign(co[:, 0] - C[0]) == sgn) & \
                    (np.abs(co[:, 0] - C[0]) > 0.40) & (co[:, 1] > -0.15)
print(f"frame incl. bevel {frame.sum()}  under-frame {under_frame.sum()}  near-frame {near_frame.sum()}  "
      f"stripe {stripe.sum()}  under-temple {under_temple.sum()}  plate y {plate_y:+.3f}")

# eyes: painted discs inside each opening. The iris sits where the photo's
# iris lands, clamped to the opening's centre region.
EYE_R, IRIS_R, PUPIL_R, HI_R = 0.095, 0.052, 0.024, 0.011
eye_centre, in_eye, iris_m, pupil_m, hi_m = {}, np.zeros(n, bool), np.zeros(n, bool), np.zeros(n, bool), np.zeros(n, bool)
for side_name, sgn in (("L", 1), ("R", -1)):
    if side_name not in ext:
        continue
    x0, x1, z0, z1 = ext[side_name]
    ocx, ocz, ohw, ohh = (x0 + x1) / 2, (z0 + z1) / 2, (x1 - x0) / 2, (z1 - z0) / 2
    ir = head & (vraw == IRIS) & ~hid_front & (np.sign(co[:, 0] - C[0]) == sgn) & \
         (np.abs(co[:, 0] - ocx) < 0.25) & (np.abs(co[:, 2] - ocz) < 0.25)
    if ir.sum() >= 50:
        ix, iz = co[ir, 0].mean(), co[ir, 2].mean()
    else:
        ix, iz = ocx, ocz
        print(f"  WARNING: iris {side_name} not found in the photo, using the opening centre")
    ex = float(np.clip(ix, ocx - 0.30 * ohw, ocx + 0.30 * ohw))
    ez = float(np.clip(iz, ocz - 0.25 * ohh, ocz + 0.25 * ohh))
    near = opening_v[side_name] & (np.abs(co[:, 0] - ex) < 0.03) & (np.abs(co[:, 2] - ez) < 0.03)
    ey = float(np.median(co[near, 1])) if near.any() else plate_y
    eye_centre[side_name] = np.array([ex, ey, ez])
    dxz = np.hypot(co[:, 0] - ex, co[:, 2] - ez)
    disc = opening_v[side_name]
    in_eye |= disc & (dxz < EYE_R)
    iris_m |= disc & (dxz < IRIS_R)
    pupil_m |= disc & (dxz < PUPIL_R)
    hi_m |= disc & (np.hypot(co[:, 0] - (ex - 0.018), co[:, 2] - (ez + 0.02)) < HI_R)
    print(f"  eye {side_name}: opening centre ({ocx:+.3f}, {ocz:.3f}) half-size {ohw:.3f}x{ohh:.3f}  "
          f"photo iris ({ix:+.3f}, {iz:.3f}) -> eye ({ex:+.3f}, {ey:+.3f}, {ez:.3f})  disc {(disc & (dxz < EYE_R)).sum()} verts")
opening_all = opening_v.get("L", np.zeros(n, bool)) | opening_v.get("R", np.zeros(n, bool))

# groups: votes never cross between them
G_BASE, G_FRAME, G_BEAK, G_EYE, G_QUIFF, G_BODY = range(6)
group = np.full(n, G_BODY, dtype=np.int8)
group[head] = G_BASE
group[quiff] = G_QUIFF
group[frame] = G_FRAME
group[beak | mouth] = G_BEAK
group[in_eye] = G_EYE
cross = group[EA] != group[EB]
print(f"groups: base {np.sum(group==G_BASE)} frame {np.sum(group==G_FRAME)} beak {np.sum(group==G_BEAK)} "
      f"eye {np.sum(group==G_EYE)} quiff {np.sum(group==G_QUIFF)} body {np.sum(group==G_BODY)}  ({time.time()-t0:.0f}s)")

# --------------------------------------------------------------------------
# 7. colours
# --------------------------------------------------------------------------
vcls = np.full(n, UNK, dtype=np.int8)

# head base: cleaned black/white maps from the best-facing of front / side /
# mirrored side (the three-quarter photo carries the frame's cast shadows)
base = group == G_BASE
hb = best_view_sample("head", [FRONT, SIDE, SIDE_M], base)
hb[np.isin(hb, (BLUE, TIE, ORANGE, IRIS, MOUTH, SILVER))] = UNK   # not a base colour
vcls[base] = hb[base]
# structural overrides on the plate: inside the frame openings is mask,
# between them is the black stripe, directly under the frame is unknown
vcls[base & opening_all] = WHITE
vcls[base & stripe] = BLACK
vcls[base & under_frame & ~opening_all & ~stripe] = UNK
vcls[base & near_frame & (vcls == BLACK)] = UNK
# the chin and neck in front are mask down to the collar
vcls[base & (co[:, 2] < C[2] - 0.5 * R) & (nrm[:, 1] < -0.5) & ~beak_box] = WHITE
vcls[base & (co[:, 2] < z_shoulder + 0.08) & (nrm[:, 1] < -0.35)] = WHITE
# under the temple arms the skull is black
vcls[base & under_temple] = BLACK
# unseen surfaces: the back and the crown are feather-black, the underside of
# the chin is mask-white
unseen = base & (vcls == UNK)
vcls[unseen & (nrm[:, 1] > 0.25)] = BLACK
vcls[unseen & (nrm[:, 2] > 0.75)] = BLACK
vcls[unseen & (nrm[:, 2] < -0.5) & front] = WHITE

probe = base & (nrm[:, 1] < -0.35) & (co[:, 2] > C[2] - 0.45 * R) & (co[:, 2] < C[2] + 0.35 * R)
def probe_report(tag, v):
    print(f"  face probe after {tag:10s}: " + "  ".join(
        f"{nm}={((v == k) & probe).sum()}" for k, nm in NAMES.items() if ((v == k) & probe).sum()))
probe_report("sampling", vcls)

vcls[group == G_QUIFF] = BLACK
vcls[group == G_FRAME] = BLACK
vcls[beak] = ORANGE
vcls[mouth] = MOUTH
vcls[in_eye] = WHITE
vcls[iris_m] = IRIS
vcls[pupil_m] = BLACK
vcls[hi_m] = WHITE

# body: zones; only the tie and the buckle are read from the photos
body = group == G_BODY
vcls[body & shirt_zone] = BLUE
vcls[body & belt_zone] = BLACK
vcls[body & trouser_zone] = BLACK
vcls[body & feet_zone] = ORANGE
vcls[body & arm_zone & (co[:, 2] > z_cuff)] = BLUE
vcls[body & arm_zone & (co[:, 2] <= z_cuff)] = BLACK
tie_zone = body & front & (np.abs(co[:, 0]) < 0.30) & (co[:, 2] > z_belt - 0.08) & (co[:, 2] < z_shoulder + 0.10)
tie_seed = tie_zone & (vraw == TIE)
tie = grow(tie_seed, tie_zone & np.isin(vraw, (TIE, ORANGE, IRIS)), 40)
tie = grow(tie, tie_zone & (vraw == UNK), 3)
vcls[tie] = TIE
buckle = buckle_box & (vraw == SILVER)
buckle = grow(buckle, buckle_box & (vraw == UNK), 4)
vcls[buckle] = SILVER
print(f"tie {tie.sum()}  buckle {buckle.sum()}  body unknown {(body & (vcls == UNK)).sum()}")

# --------------------------------------------------------------------------
# 8. fill unknowns from surface neighbours (within group), smooth the
#    painted boundary on the skull
# --------------------------------------------------------------------------
KA_OK = ~cross
def neighbour_vote(cls, only_unknown, strong=0.7):
    votes = np.zeros((n, NCLS), dtype=np.int32)
    ka, kb = cls[EA], cls[EB]
    for k in range(NCLS):
        ma = KA_OK & (ka == k); mb = KA_OK & (kb == k)
        votes[:, k] += np.bincount(EB[ma], minlength=n) + np.bincount(EA[mb], minlength=n)
    tot = votes.sum(1); has = tot > 0
    best = votes.argmax(1).astype(np.int8)
    out = cls.copy()
    if only_unknown:
        m = (cls == UNK) & has
    else:
        m = has & (votes.max(1) >= strong * tot) & (best != cls)
    out[m] = best[m]
    return out

def fill(v):
    for it in range(400):
        if (v == UNK).sum() == 0:
            break
        v = neighbour_vote(v, True)
    v[(v == UNK) & base & front & (co[:, 2] < C[2])] = WHITE
    v[v == UNK] = BLACK
    return v

def smooth_head_bw(v, iters):
    v = v.copy()
    zone = base
    a, b = EA[~cross], EB[~cross]
    for _ in range(iters):
        isw = (v == WHITE) & zone; isb = (v == BLACK) & zone
        w = np.bincount(b, isw[a], minlength=n) + np.bincount(a, isw[b], minlength=n)
        k = np.bincount(b, isb[a], minlength=n) + np.bincount(a, isb[b], minlength=n)
        tot = w + k
        m = zone & np.isin(v, (WHITE, BLACK)) & (tot >= 3)
        v[m & (w >= 0.6 * tot)] = WHITE
        v[m & (k >= 0.6 * tot)] = BLACK
    return v

def grid_clean(v, vi, U, r=3, cell=0.006):
    """2D median of the painted black/white on the skull as seen from one
    view: project the base vertices facing that view onto a (u, z) grid,
    take the per-cell majority, close+open the white map, read it back.
    Removes speckle and highlight blobs the 1-ring vote can't."""
    sel = base & (facing[:, vi] > 0.3) & np.isin(v, (BLACK, WHITE)) & ~opening_all & ~stripe
    if sel.sum() < 100:
        return v
    u = co[sel] @ np.array(U, float); z = co[sel, 2]
    u0, z0 = u.min(), z.min()
    iu = ((u - u0) / cell).astype(int); iz = ((z - z0) / cell).astype(int)
    NU, NZ = iu.max() + 1, iz.max() + 1
    w = np.zeros((NZ, NU)); k = np.zeros((NZ, NU))
    np.add.at(w, (iz, iu), (v[sel] == WHITE).astype(float))
    np.add.at(k, (iz, iu), (v[sel] == BLACK).astype(float))
    known = (w + k) > 0
    white = w > k
    for _ in range(6):                      # fill empty cells from neighbours
        nk = dilate(known, 1) & ~known
        if not nk.any():
            break
        cnt = sum(np.roll(known, s, ax).astype(int) for s in (1, -1) for ax in (0, 1))
        wc = sum(np.roll(white & known, s, ax).astype(int) for s in (1, -1) for ax in (0, 1))
        white = np.where(nk, wc * 2 > cnt, white); known |= nk
    wm = dilate(erode(dilate(white, r), r), r); wm = erode(wm, r)     # close, then open
    out = v.copy()
    idx = np.where(sel)[0]
    out[idx] = np.where(wm[iz, iu], WHITE, BLACK)
    return out

vcls = fill(vcls);                probe_report("fill", vcls)
vcls = smooth_head_bw(vcls, 6)
vcls = grid_clean(vcls, SIDE, (0, -1, 0), r=5)
vcls = grid_clean(vcls, SIDE_M, (0, -1, 0), r=5)
vcls = grid_clean(vcls, FRONT, (1, 0, 0), r=4);  probe_report("observed", vcls)

# --------------------------------------------------------------------------
# 8b. the painted mask as AUTHORED shapes. The photo-derived labels above
#     are only evidence: the final boundary is two elliptical lobes (one over
#     each eye, mirrored) plus a neck bib, in skull angular coordinates, with
#     parameters fitted to the evidence. This is what the references show
#     (PIKU-BIBLE §4) and it leaves no per-vertex noise.
# --------------------------------------------------------------------------
dv = co - C
rv = np.maximum(np.linalg.norm(dv, axis=1), 1e-6)
phi = np.degrees(np.arctan2(dv[:, 0], -dv[:, 1]))          # 0 = front, + = Piku's left
theta = np.degrees(np.arcsin(np.clip(dv[:, 2] / rv, -1, 1)))
aphi = np.abs(phi)
evid = base & np.isin(vcls, (BLACK, WHITE)) & (aphi < 115) & ~under_frame & ~under_temple
ev_w = (vcls == WHITE)

def lobe_mask(pc, tc, rp, rt):
    return ((aphi - pc) / rp) ** 2 + ((theta - tc) / rt) ** 2 < 1.0

def iou(pred, sel):
    a = pred & ev_w & sel; b = (pred | ev_w) & sel
    return a.sum() / max(b.sum(), 1)

# lobes: fit on the upper face (above the beak's middle), both sides at once
sel_lobe = evid & (theta > -8)
best = (0, None)
for pc in range(24, 60, 4):
    for tc in range(-6, 30, 4):
        for rp in range(14, 46, 4):
            for rt in range(14, 46, 4):
                s = iou(lobe_mask(pc, tc, rp, rt), sel_lobe)
                if s > best[0]:
                    best = (s, (pc, tc, rp, rt))
LOBE = best[1]
lobes = lobe_mask(*LOBE)
print(f"  mask lobes: centre |phi| {LOBE[0]}° theta {LOBE[1]}°, radii {LOBE[2]}° x {LOBE[3]}°  (IoU {best[0]:.3f})")
# bib: below the lobes, a band |phi| < phi_b widening downward, from theta_top down to the collar
sel_bib = evid & (theta <= 4) & (co[:, 2] < C[2] + 0.2)
best = (0, None)
for tb in range(-40, 6, 3):
    for pb in range(30, 96, 4):
        for slope in (0.0, 0.5, 1.0, 1.5):
            pred = (theta < tb) & (aphi < pb + slope * (tb - theta))
            s = iou(pred | lobes, sel_bib)
            if s > best[0]:
                best = (s, (tb, pb, slope))
BIB = best[1]
bib = (theta < BIB[0]) & (aphi < BIB[1] + BIB[2] * (BIB[0] - theta))
print(f"  neck bib: below theta {BIB[0]}°, |phi| < {BIB[1]}° + {BIB[2]}·drop  (IoU {best[0]:.3f})")
mask_shape = (lobes | bib) & (co[:, 2] > z_shoulder - 0.06)
agree = (mask_shape == ev_w)[evid].mean()
print(f"  authored mask agrees with the photo evidence on {100*agree:.1f}% of the skull")

vcls[base] = np.where(mask_shape[base], WHITE, BLACK)
vcls[base & opening_all] = WHITE
vcls[base & stripe] = BLACK
# structural colours (the eye plate stays plain white: the eyes are objects)
vcls[group == G_FRAME] = BLACK; vcls[beak] = ORANGE; vcls[mouth] = MOUTH
vcls[in_eye] = WHITE
print(f"classes settled ({time.time()-t0:.0f}s)")

# --------------------------------------------------------------------------
# 9. regions + colour attribute + materials
# --------------------------------------------------------------------------
lower_z = co[:, 2] < z_belt
feet = body & feet_zone

def lin(hexs):
    def _l(c):
        c /= 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return tuple(_l(int(hexs[i:i+2], 16)) for i in (0, 2, 4))

PAL = {
    BLACK:  lin("161615"), WHITE: lin("FFFFFF"), BLUE: lin("B2C4E2"), TIE: lin("F6BB54"),
    ORANGE: lin("D9670C"), IRIS: lin("572709"), MOUTH: lin("A8281A"), SILVER: lin("A2A0A1"),
}
FOOT = lin("F97C0B")
cols = np.ones((n, 4), dtype=np.float32)
for k, c in PAL.items():
    cols[vcls == k, :3] = c
cols[feet, :3] = FOOT
# finish details from the references: the beak's underside is a shade
# darker, the tongue lighter than the cavity, the temple tips are metal
under_beak = beak & (nrm[:, 2] < -0.35)
cols[under_beak, :3] = np.array(PAL[ORANGE]) * 0.82
tongue_v = mouth & (nrm[:, 2] > 0.3)
cols[tongue_v, :3] = lin("C8463A")
temple_tip = temple & (co[:, 1] > 0.22)
cols[temple_tip, :3] = PAL[SILVER]

regions = {
    "head":       head & ~beak & ~mouth,
    "mask":       base & (vcls == WHITE),
    "glasses":    frame,
    "quiff":      quiff,
    "beak_upper": (beak | mouth) & (co[:, 2] >= smile_z - 0.003),
    "beak_lower": (beak | mouth) & (co[:, 2] <  smile_z - 0.003),
    "mouth":      mouth,
    "eye_L":      in_eye & (co[:, 0] > C[0]),
    "eye_R":      in_eye & (co[:, 0] < C[0]),
    "torso":      body & ~lower_z & ~arm_zone,
    "tie":        tie,
    "belt":       body & belt_zone,
    "arm_L":      body & arm_zone & (co[:, 0] > 0) & (co[:, 2] > z_cuff),
    "arm_R":      body & arm_zone & (co[:, 0] < 0) & (co[:, 2] > z_cuff),
    "hand_L":     body & arm_zone & (co[:, 0] > 0) & (co[:, 2] <= z_cuff),
    "hand_R":     body & arm_zone & (co[:, 0] < 0) & (co[:, 2] <= z_cuff),
    "leg_L":      body & lower_z & ~feet & ~arm_zone & ~belt_zone & (co[:, 0] > 0),
    "leg_R":      body & lower_z & ~feet & ~arm_zone & ~belt_zone & (co[:, 0] < 0),
    "foot_L":     feet & (co[:, 0] > 0),
    "foot_R":     feet & (co[:, 0] < 0),
}
for vg in list(ob.vertex_groups):
    ob.vertex_groups.remove(vg)
for name, m in regions.items():
    vg = ob.vertex_groups.new(name=name)
    idx = np.where(m)[0]
    if len(idx):
        vg.add(idx.tolist(), 1.0, 'REPLACE')
    print(f"  region {name:11s} {len(idx):8d} verts")

ca = me.color_attributes.get("PikuColor") or me.color_attributes.new("PikuColor", 'FLOAT_COLOR', 'POINT')
ca.data.foreach_set("color", cols.ravel())
me.color_attributes.active_color = ca

# region debug layer (render with PIKU_RENDER_COLOR=PikuRegion)
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

def vc_material(name, rough):
    m = bpy.data.materials.new(name); m.use_nodes = True
    nt = m.node_tree; bsdf = nt.nodes["Principled BSDF"]
    attr = nt.nodes.new("ShaderNodeVertexColor"); attr.layer_name = "PikuColor"
    nt.links.new(attr.outputs["Color"], bsdf.inputs["Base Color"])
    bsdf.inputs["Roughness"].default_value = rough
    return m
me.materials.clear()
me.materials.append(vc_material("Piku_Matte", 0.62))
me.materials.append(vc_material("Piku_Gloss", 0.22))
gloss_v = frame | buckle | in_eye | temple_tip
loops = np.empty(len(me.loops), dtype=np.int64); me.loops.foreach_get("vertex_index", loops)
lstart = np.empty(len(me.polygons), dtype=np.int64); me.polygons.foreach_get("loop_start", lstart)
g = gloss_v[loops]
tri_g = (g[lstart] & g[lstart + 1]) | (g[lstart] & g[lstart + 2]) | (g[lstart + 1] & g[lstart + 2])
me.polygons.foreach_set("material_index", tri_g.astype(np.int32))
me.update()

ob["piku_stage"] = "segmented"
ob["skull_centre"] = C.tolist(); ob["skull_r"] = float(R)
for s, c in eye_centre.items():
    ob[f"eye_{s}"] = c.tolist()
ob["eye_r"] = EYE_R
ob["mouth_z"] = mouth_z
ob["z_shoulder"] = float(z_shoulder); ob["z_belt"] = float(z_belt); ob["z_cuff"] = float(z_cuff); ob["z_feet"] = float(z_feet)

print("\nclass histogram:")
for k, nm in NAMES.items():
    if k != UNK:
        print(f"  {nm:7s} {(vcls == k).sum():8d}")
bpy.ops.wm.save_as_mainfile(filepath=OUT, compress=True)
print(f"saved -> {OUT}  ({time.time()-t0:.0f}s)")
print("SEGMENT_DONE")
