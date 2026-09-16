"""
Build the master 3D Piku in Blender, headless.

    /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/piku3d/piku_build.py

Everything is real geometry, lathed or swept from art-directed profiles — no
planes, billboards or reference textures anywhere.

This script IS the source of truth for the model. The .blend is a build
artifact: delete it and re-run to get it back.

Parts stay SEPARATE named objects under an Empty root so the face and body can
be rigged and animated independently later.

MEASUREMENTS
------------
Proportions come from `_reference/piku/piku_ namaste.png` — a white-background,
symmetric front view, segmented cleanly (the model sheet's dark backdrop is the
same value as Piku's black body, so it cannot be auto-measured reliably).
Cross-checked against PIKU-BIBLE.md. Head w/h ~1.10 now agrees across three
independent references.
"""

import bpy, bmesh, math, os
from mathutils import Vector

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
BLEND_OUT = os.path.join(ROOT, "_reference", "piku", "blender", "piku_master.blend")
GLB_OUT = os.path.join(ROOT, "public", "brand", "piku", "piku.glb")
for d in (os.path.dirname(BLEND_OUT), os.path.dirname(GLB_OUT)):
    os.makedirs(d, exist_ok=True)

# --------------------------------------------------------------------------
# Palette — measured hexes (PIKU-BIBLE.md §2), sRGB -> linear
# --------------------------------------------------------------------------
def _lin(c):
    c = c / 255.0
    return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4

def hexc(h, a=1.0):
    h = h.lstrip("#")
    return (_lin(int(h[0:2], 16)), _lin(int(h[2:4], 16)), _lin(int(h[4:6], 16)), a)

C_BLACK   = hexc("161615")
C_TROUSER = hexc("1A1A19")
C_SHIRT   = hexc("B2C4E2")
C_TIE     = hexc("F6BB54")
C_BEAK    = hexc("D9670C")   # deeper than the feet — never merge the two
C_FOOT    = hexc("F97C0B")   # brighter than the beak
C_IRIS    = hexc("572709")
C_SILVER  = hexc("A2A0A1")
C_WHITE   = hexc("FFFFFF")
C_MOUTH   = hexc("A8281A")
C_PUPIL   = hexc("0B0A0A")

# --------------------------------------------------------------------------
# Proportions — measured. Total height 2.90 units.
# --------------------------------------------------------------------------
# All fractions below are of TOTAL figure height, measured from the top, and
# come from fitting the reference silhouette rather than eyeballing it.
#
# The skull's width profile fits a circle centred at 0.25h with radius 0.1825h
# to within ~2% at 0.20h / 0.30h / 0.35h — so the head is near-circular in
# front view and the eyes (measured at 0.2485h) sit at its VERTICAL CENTRE.
# An earlier pass put them at 0.75 of head height; that came from a collar line
# set by one stray blue pixel, which made the head far too short.
TOTAL_H   = 2.90

# Measured by tools/piku3d/measure_views.py from _reference/piku/views/.
# Fractions are of TOTAL figure height, from the top.
SKULL_CF  = 0.2564          # skull centre
SKULL_RF  = 0.2077          # skull radius  (depth 0.4165h ~= diameter 0.4153h)
HEAD_RX   = SKULL_RF * TOTAL_H              # 0.602
HEAD_RZ   = HEAD_RX                         # near-perfect sphere in front view
HEAD_RY   = 0.190 * TOTAL_H                 # marginally shallower than wide
HEAD_CZ   = TOTAL_H * (1 - SKULL_CF)        # 2.156
HEAD_W    = HEAD_RX * 2
SKULL_TOP = HEAD_CZ + HEAD_RZ               # 2.759
QUIFF_RISE = TOTAL_H - SKULL_TOP            # 0.141 — a short tuft, not a mohawk

COLLAR_Z  = TOTAL_H * (1 - 0.3738)          # 1.816  shoulder line
BODY_TOP  = COLLAR_Z + 0.075
BELT_Z    = TOTAL_H * (1 - 0.6773)          # 0.936  shirt hem / belt
FOOT_TOP  = TOTAL_H * (1 - 0.9161)          # 0.243
STANCE    = 0.4816 * TOTAL_H                # 1.397 outer-to-outer

# Face, in head-local u (across) / w (up), both -1..1
EYE_U = 0.365
EYE_W = 0.020
EYE_X = EYE_U * HEAD_RX
EYE_Z = HEAD_CZ + EYE_W * HEAD_RZ
EYE_R = 0.180 * HEAD_RX                     # sclera
IRIS_R = 0.106 * HEAD_RX                    # measured iris dia 0.212*R

# Beak front-view silhouette, straight from the measurement table:
# (w, half-width in u). Narrow where it meets the face, widest below the eyes.
BEAK_SIL = [(+0.019, 0.048), (-0.050, 0.119), (-0.123, 0.169), (-0.196, 0.275),
            (-0.269, 0.362), (-0.338, 0.346), (-0.412, 0.296), (-0.485, 0.246),
            (-0.558, 0.177), (-0.631, 0.060)]
BEAK_SPLIT = -0.295                         # upper mandible / lower jaw

def beak_half(w):
    """Interpolate the measured beak silhouette; returns half-width in units."""
    t = BEAK_SIL
    if w >= t[0][0]:
        return t[0][1] * HEAD_RX
    if w <= t[-1][0]:
        return t[-1][1] * HEAD_RX
    for i in range(len(t) - 1):
        w0, h0 = t[i]; w1, h1 = t[i + 1]
        if w1 <= w <= w0:
            f = (w - w0) / (w1 - w0)
            return (h0 + (h1 - h0) * f) * HEAD_RX
    return t[-1][1] * HEAD_RX

bpy.ops.wm.read_factory_settings(use_empty=True)
scene = bpy.context.scene

# --------------------------------------------------------------------------
# Materials
# --------------------------------------------------------------------------
def material(name, color, rough=0.62, metallic=0.0, ior_level=0.35):
    m = bpy.data.materials.new(name)
    m.use_nodes = True
    b = m.node_tree.nodes.get("Principled BSDF")
    b.inputs["Base Color"].default_value = color
    b.inputs["Roughness"].default_value = rough
    b.inputs["Metallic"].default_value = metallic
    for key in ("Specular IOR Level", "Specular"):
        if key in b.inputs:
            b.inputs[key].default_value = ior_level
            break
    m.diffuse_color = color
    return m

MAT = {
    "black":   material("Piku_Black",   C_BLACK,   rough=0.56),
    "trouser": material("Piku_Trouser", C_TROUSER, rough=0.74),
    "shirt":   material("Piku_Shirt",   C_SHIRT,   rough=0.76),
    "tie":     material("Piku_Tie",     C_TIE,     rough=0.62),
    "beak":    material("Piku_Beak",    C_BEAK,    rough=0.38),
    "foot":    material("Piku_Foot",    C_FOOT,    rough=0.40),
    "iris":    material("Piku_Iris",    C_IRIS,    rough=0.22),
    "silver":  material("Piku_Silver",  C_SILVER,  rough=0.28, metallic=0.85),
    "white":   material("Piku_White",   C_WHITE,   rough=0.46),
    "mouth":   material("Piku_Mouth",   C_MOUTH,   rough=0.42),
    "pupil":   material("Piku_Pupil",   C_PUPIL,   rough=0.16),
    "frame":   material("Piku_Frame",   C_BLACK,   rough=0.20),
}

# --------------------------------------------------------------------------
# Geometry helpers
# --------------------------------------------------------------------------
def catmull(ctrl, n):
    pts = [ctrl[0]] + list(ctrl) + [ctrl[-1]]
    out, segs = [], len(pts) - 3
    for i in range(n):
        t = i / (n - 1) * segs
        k = min(int(t), segs - 1)
        u = t - k
        p0, p1, p2, p3 = pts[k], pts[k + 1], pts[k + 2], pts[k + 3]
        u2, u3 = u * u, u * u * u
        out.append(tuple(
            0.5 * ((2 * p1[d]) + (-p0[d] + p2[d]) * u +
                   (2 * p0[d] - 5 * p1[d] + 4 * p2[d] - p3[d]) * u2 +
                   (-p0[d] + 3 * p1[d] - 3 * p2[d] + p3[d]) * u3) for d in (0, 1)))
    return out

OBJECTS = {}
def finish(name, bm, mat=None, smooth=True, part="misc", outward_from=None):
    me = bpy.data.meshes.new(name)
    bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
    if outward_from is not None:
        # recalc_face_normals guesses from enclosed volume, which is meaningless
        # for an OPEN patch like the face mask — it can orient the whole sheet
        # inward, rendering a white surface black. Orient explicitly instead.
        c = Vector(outward_from)
        flip = [f for f in bm.faces if f.normal.dot(f.calc_center_median() - c) < 0]
        if flip:
            bmesh.ops.reverse_faces(bm, faces=flip)
    bm.to_mesh(me); bm.free()
    ob = bpy.data.objects.new(name, me)
    scene.collection.objects.link(ob)
    if mat:
        ob.data.materials.append(mat)
    if smooth:
        for p in ob.data.polygons:
            p.use_smooth = True
    ob["piku_part"] = part
    OBJECTS[name] = ob
    return ob

def lathe(name, profile, segs=32, rx=1.0, ry=1.0, mat=None, origin=(0, 0, 0),
          part="misc", y_shift=None, smooth=True, pivot=None):
    """Revolve a (z, radius) profile around Z. radius 0 at an end makes a pole.

    `pivot` places the object via its transform instead of baking the offset
    into the vertices — required for anything that is then rotated, so it
    rotates about its own base rather than the world origin.
    """
    bm = bmesh.new()
    rings = []
    for (z, r) in profile:
        dy = y_shift(z) if y_shift else 0.0
        if r <= 1e-6:
            rings.append([bm.verts.new((origin[0], origin[1] + dy, origin[2] + z))])
        else:
            ring = [bm.verts.new((origin[0] + math.cos(2 * math.pi * j / segs) * r * rx,
                                  origin[1] + math.sin(2 * math.pi * j / segs) * r * ry + dy,
                                  origin[2] + z)) for j in range(segs)]
            rings.append(ring)
    for i in range(len(rings) - 1):
        A, B = rings[i], rings[i + 1]
        if len(A) == 1:
            for j in range(segs):
                bm.faces.new((A[0], B[j], B[(j + 1) % segs]))
        elif len(B) == 1:
            for j in range(segs):
                bm.faces.new((A[j], A[(j + 1) % segs], B[0]))
        else:
            for j in range(segs):
                bm.faces.new((A[j], A[(j + 1) % segs], B[(j + 1) % segs], B[j]))
    for cap in (rings[0], rings[-1]):
        if len(cap) > 1:
            bm.faces.new(cap)
    ob = finish(name, bm, mat, smooth, part)
    if pivot:
        ob.location = pivot
    return ob

def ellipsoid_profile(rz, n=26):
    out = []
    for i in range(n):
        z = -rz + 2 * rz * (i / (n - 1))
        out.append((z, math.sqrt(max(0.0, 1.0 - (z / rz) ** 2))))
    return out

def ellipsoid(name, rx, ry, rz, loc, mat, part="misc", segs=32, rings=26):
    return lathe(name, ellipsoid_profile(rz, rings), segs=segs, rx=rx, ry=ry,
                 mat=mat, origin=loc, part=part)

def tube(name, path, radius, mat, segs=10, close=False, part="misc", taper=None):
    """Sweep a circle along a polyline — glasses frames, temple arms."""
    bm = bmesh.new()
    pts = [Vector(p) for p in path]
    n = len(pts)
    rings = []
    for i, p in enumerate(pts):
        if close:
            tan = pts[(i + 1) % n] - pts[(i - 1) % n]
        else:
            tan = (pts[1] - pts[0]) if i == 0 else \
                  (pts[-1] - pts[-2]) if i == n - 1 else (pts[i + 1] - pts[i - 1])
        tan.normalize()
        up = Vector((0, 0, 1)) if abs(tan.dot(Vector((0, 0, 1)))) < 0.95 else Vector((0, 1, 0))
        nx = tan.cross(up).normalized()
        ny = tan.cross(nx).normalized()
        r = radius * (taper(i / (n - 1)) if taper else 1.0)
        rings.append([bm.verts.new(p + nx * (math.cos(2 * math.pi * j / segs) * r)
                                     + ny * (math.sin(2 * math.pi * j / segs) * r))
                      for j in range(segs)])
    span = range(n) if close else range(n - 1)
    for i in span:
        A, B = rings[i], rings[(i + 1) % n]
        for j in range(segs):
            bm.faces.new((A[j], A[(j + 1) % segs], B[(j + 1) % segs], B[j]))
    if not close:
        bm.faces.new(rings[0])
        bm.faces.new(list(reversed(rings[-1])))
    return finish(name, bm, mat, True, part)

def sweep(name, path, section, mat, N=20, S=18, part="misc"):
    """Sweep an elliptical cross-section along a path.

    path(t)    -> (x, y, z) centre at t in 0..1
    section(t) -> (half_width, half_height)
    Used for the beak and the quiff, whose forms curve as they taper.
    """
    bm = bmesh.new()
    rings = []
    for i in range(N):
        t = i / (N - 1)
        cx, cy, cz = path(t)
        hw, hh = section(t)
        hw, hh = max(hw, 1e-4), max(hh, 1e-4)
        rings.append([bm.verts.new((cx + math.cos(2 * math.pi * j / S) * hw, cy,
                                    cz + math.sin(2 * math.pi * j / S) * hh))
                      for j in range(S)])
    for i in range(N - 1):
        A, B = rings[i], rings[i + 1]
        for j in range(S):
            bm.faces.new((A[j], A[(j + 1) % S], B[(j + 1) % S], B[j]))
    bm.faces.new(rings[0])
    bm.faces.new(list(reversed(rings[-1])))
    return finish(name, bm, mat, True, part)

def box(name, size, loc, mat, radius=0.02, rot=(0, 0, 0), part="misc"):
    bpy.ops.mesh.primitive_cube_add(size=1, location=loc)
    ob = bpy.context.active_object
    ob.name = name
    ob.scale = (size[0] / 2, size[1] / 2, size[2] / 2)
    ob.rotation_euler = rot
    b = ob.modifiers.new("bev", "BEVEL")
    b.width, b.segments, b.limit_method = radius, 5, 'ANGLE'
    ob.data.materials.append(mat)
    ob["piku_part"] = part
    OBJECTS[name] = ob
    return ob

# ==========================================================================
# HEAD
# ==========================================================================
ellipsoid("Piku_Head", HEAD_RX, HEAD_RY, HEAD_RZ, (0, 0, HEAD_CZ),
          MAT["black"], "head", segs=44, rings=32)

# --- white face mask: a parametric patch ON the head surface.
# Built column-by-column between an analytic lower and upper boundary, so the
# silhouette edge is smooth instead of the stair-stepped result you get from
# deleting whole faces off a sphere.
SHELL = 1.014
MRX, MRY, MRZ = HEAD_RX * SHELL, HEAD_RY * SHELL, HEAD_RZ * SHELL

def mask_top(u):
    """Upper mask edge in head-local w.

    Two tall lobes rise over the eyes and the centre dips, leaving the broad
    black widow's peak that runs down between them to just above the beak.
    Calibrated against the reference head crop, not guessed.
    """
    # Fitted to the measured w_top table: peaks ~+0.47 at |u|=0.45-0.50,
    # ~+0.33 at |u|=0.20, ~+0.02 at the centre, dropping away past |u|=0.66.
    lobe = 0.78 * math.sqrt(max(0.0, 1.0 - ((abs(u) - 0.45) / 0.52) ** 2))
    fall = 5.00 * max(0.0, abs(u) - 0.66) ** 1.5
    return -0.30 + lobe - fall

NU, NV = 96, 40
cols = []
for i in range(NU):
    u = -0.94 + 1.88 * i / (NU - 1)
    if abs(u) >= 1.0:
        cols.append(None); continue
    wlim = math.sqrt(max(0.0, 1 - u * u))
    wt = min(mask_top(u), wlim * 0.995)
    wb = -wlim * 0.995
    if wt <= wb + 1e-4:
        cols.append(None); continue
    col = []
    for j in range(NV):
        w = wb + (wt - wb) * (j / (NV - 1))
        k = max(0.0, 1 - u * u - w * w)
        col.append((u * MRX, -MRY * math.sqrt(k), HEAD_CZ + w * MRZ))
    cols.append(col)

bm = bmesh.new()
vcols = [[bm.verts.new(p) for p in c] if c else None for c in cols]
for i in range(NU - 1):
    A, B = vcols[i], vcols[i + 1]
    if not A or not B:
        continue
    for j in range(NV - 1):
        bm.faces.new((A[j], A[j + 1], B[j + 1], B[j]))
finish("Piku_FaceMask", bm, MAT["white"], True, "face_mask",
       outward_from=(0, 0, HEAD_CZ))

# --- quiff: swept-back spikes rooted on the crown
def skull_z(x, y):
    k = max(0.0, 1 - (x / HEAD_RX) ** 2 - (y / HEAD_RY) ** 2)
    return HEAD_CZ + HEAD_RZ * math.sqrt(k)

# Flame-like tufts, swept back and clustered toward Piku's left (+X), as in
# the reference — not a centred mohawk.
# Measured rise above the skull is only 0.141 units, so these are short,
# thick, strongly swept tufts — not a tall mohawk.
QUIFF = [  # x, y(back+), length, base half-width, back-lean, side-lean
    (-0.060, 0.030, 0.150, 0.058, 52, -18),
    ( 0.020, 0.005, 0.205, 0.068, 44,  -5),
    ( 0.100, 0.035, 0.215, 0.066, 48,  10),
    ( 0.170, 0.090, 0.175, 0.056, 58,  22),
    ( 0.230, 0.150, 0.125, 0.044, 66,  32),
]
for i, (qx, qy, ln, bw, lean, side) in enumerate(QUIFF):
    def qpath(t, ln=ln):
        # curls backward as it rises
        return (0.0, 0.30 * ln * t ** 1.8, ln * t)
    def qsec(t, bw=bw):
        return (bw * (1 - t) ** 0.75, bw * 0.80 * (1 - t) ** 0.75)
    sp = sweep(f"Piku_Quiff_{i}", qpath, qsec, MAT["black"], N=14, S=10, part="quiff")
    sp.location = (qx, qy, skull_z(qx, qy) - 0.060)
    sp.rotation_euler = (math.radians(lean), math.radians(side), 0)

# ==========================================================================
# EYES
# ==========================================================================
def face_y(x, z):
    """Front surface of the head at (x, z)."""
    k = max(0.0, 1 - (x / HEAD_RX) ** 2 - ((z - HEAD_CZ) / HEAD_RZ) ** 2)
    return -HEAD_RY * math.sqrt(k)

for side, sx in (("L", -1), ("R", 1)):
    ex = sx * EYE_X
    ey = face_y(ex, EYE_Z) + EYE_R * 0.44
    ellipsoid(f"Piku_Eye_{side}", EYE_R, EYE_R * 0.88, EYE_R * 1.06, (ex, ey, EYE_Z),
              MAT["white"], "eye", segs=28, rings=22)
    ellipsoid(f"Piku_Iris_{side}", IRIS_R, IRIS_R * 0.72, IRIS_R,
              (ex, ey - EYE_R * 0.56, EYE_Z), MAT["iris"], "iris", segs=24, rings=18)
    ellipsoid(f"Piku_Pupil_{side}", IRIS_R * 0.52, IRIS_R * 0.38, IRIS_R * 0.52,
              (ex, ey - EYE_R * 0.72, EYE_Z), MAT["pupil"], "pupil", segs=18, rings=14)
    # twin specular highlights — bible trait #3
    for hi, (hx, hz, hr) in enumerate(((-0.30, 0.34, 0.22), (0.26, -0.24, 0.11))):
        ellipsoid(f"Piku_EyeHi_{side}{hi}", EYE_R * hr, EYE_R * hr * 0.5, EYE_R * hr,
                  (ex + hx * EYE_R, ey - EYE_R * 0.80, EYE_Z + hz * EYE_R),
                  MAT["white"], "eye_highlight", segs=12, rings=10)

# ==========================================================================
# BEAK — upper + lower separate so a jaw bone can open it for talking
# ==========================================================================
# Both mandibles are driven straight off the measured front-view silhouette
# (BEAK_SIL), so the front profile matches the reference by construction. The
# only art-directed part is how far each ring pushes forward in -Y, which the
# front view cannot show.
BEAK_W_TOP = BEAK_SIL[0][0]
BEAK_W_BOT = BEAK_SIL[-1][0]

def beak_z(w):
    return HEAD_CZ + w * HEAD_RZ

def beak_face_y(w):
    """Where the beak leaves the skull surface at this height."""
    return face_y(0, beak_z(w)) + 0.03

def make_mandible(name, w_hi, w_lo, reach, drop, part):
    """Sweep between two heights of the measured silhouette."""
    def path(t):
        w = w_hi + (w_lo - w_hi) * t
        # protrusion peaks mid-beak then eases back toward the tip
        push = reach * math.sin(math.pi * min(t * 0.78 + 0.10, 1.0)) ** 0.8
        return (0.0, beak_face_y(w_hi) - push, beak_z(w) + drop * t)
    def sec(t):
        w = w_hi + (w_lo - w_hi) * t
        hw = beak_half(w)
        return (hw, max(0.030, hw * 0.42))
    sweep(name, path, sec, MAT["beak"], N=24, S=22, part=part)

make_mandible("Piku_Beak_Upper", BEAK_W_TOP, BEAK_SPLIT, 0.235, 0.010, "beak_upper")
make_mandible("Piku_Beak_Lower", BEAK_SPLIT + 0.020, BEAK_W_BOT, 0.165, 0.012, "beak_lower")

# open mouth between the mandibles
ellipsoid("Piku_Mouth", beak_half(BEAK_SPLIT) * 0.80, 0.085, 0.050,
          (0, beak_face_y(BEAK_SPLIT) - 0.205, beak_z(BEAK_SPLIT) - 0.008),
          MAT["mouth"], "mouth", segs=20, rings=14)

# ==========================================================================
# GLASSES — rims sized to sit over the eyes, plus bridge and temple arms
# ==========================================================================
# Big rectangular frames. Measured off the reference head crop: each lens is
# ~0.39 of head width and the lenses sit OUTBOARD of the eyes, so each eye
# reads slightly inboard of its lens centre.
LENS_W, LENS_H = 0.415 * HEAD_W, 0.315 * HEAD_W
LENS_X = 0.222 * HEAD_W
FRAME_R = 0.022
GLASS_Y = face_y(0, EYE_Z) - 0.030
LENS_Z = EYE_Z + 0.020

def rounded_rect(cx, cz, w, h, y, n=40, p=3.2):
    pts = []
    for i in range(n):
        a = 2 * math.pi * i / n
        c, s = math.cos(a), math.sin(a)
        k = (abs(c) ** p + abs(s) ** p) ** (1 / p)
        pts.append((cx + c / k * w / 2, y, cz + s / k * h / 2))
    return pts

for side, sx in (("L", -1), ("R", 1)):
    tube(f"Piku_Frame_{side}", rounded_rect(sx * LENS_X, LENS_Z, LENS_W, LENS_H, GLASS_Y),
         FRAME_R, MAT["frame"], segs=8, close=True, part="glasses_rim")
    ox = sx * (LENS_X + LENS_W / 2)
    arm = [(ox, GLASS_Y + 0.020, LENS_Z + LENS_H * 0.32),
           (ox + sx * 0.045, GLASS_Y + 0.14, LENS_Z + LENS_H * 0.36),
           (sx * HEAD_RX * 0.95, GLASS_Y + 0.44, LENS_Z + LENS_H * 0.38),
           (sx * HEAD_RX * 0.72, GLASS_Y + 0.82, LENS_Z + LENS_H * 0.26)]
    tube(f"Piku_Temple_{side}", arm, FRAME_R * 0.80, MAT["frame"], segs=8,
         part="glasses_temple")

tube("Piku_Bridge", [(-LENS_X + LENS_W / 2 - 0.012, GLASS_Y, LENS_Z + LENS_H * 0.22),
                     (0, GLASS_Y - 0.018, LENS_Z + LENS_H * 0.28),
                     (LENS_X - LENS_W / 2 + 0.012, GLASS_Y, LENS_Z + LENS_H * 0.22)],
     FRAME_R * 0.78, MAT["frame"], segs=8, part="glasses_bridge")

# ==========================================================================
# BODY — pear torso. Belly pushes forward, back stays rounded.
# ==========================================================================
def belly(z):
    t = max(0.0, min(1.0, (z - BELT_Z) / (BODY_TOP - BELT_Z)))
    return -0.045 * math.sin(math.pi * t) ** 1.3

body_ctrl = [
    (BELT_Z - 0.06, 0.555),
    (BELT_Z + 0.10, 0.575),
    (1.20,          0.578),
    (1.42,          0.560),
    (1.62,          0.545),
    (COLLAR_Z,      0.455),
    (BODY_TOP,      0.265),     # stops below the chin so it can't swallow the face
]
BODY_PROFILE = catmull(body_ctrl, 30)
lathe("Piku_Body", BODY_PROFILE, segs=40, rx=1.0, ry=0.96,
      mat=MAT["shirt"], part="body", y_shift=belly)

def body_r(z):
    """Torso radius at height z, interpolated from the built profile."""
    pts = BODY_PROFILE
    if z <= pts[0][0]:
        return pts[0][1]
    if z >= pts[-1][0]:
        return pts[-1][1]
    for i in range(len(pts) - 1):
        z0, r0 = pts[i]; z1, r1 = pts[i + 1]
        if z0 <= z <= z1:
            t = (z - z0) / max(z1 - z0, 1e-6)
            return r0 + (r1 - r0) * t
    return pts[-1][1]

def body_front(z, clear=0.0):
    """Y of the torso's front surface at height z — where trim must sit."""
    return belly(z) - body_r(z) * 0.96 - clear

for side, sx in (("L", -1), ("R", 1)):
    cz = BODY_TOP - 0.090
    c = box(f"Piku_Collar_{side}", (0.245, 0.05, 0.200),
            (sx * 0.125, body_front(cz, 0.012), cz),
            MAT["shirt"], radius=0.018, part="collar")
    c.rotation_euler = (math.radians(14), 0, math.radians(sx * -24))

pk = box("Piku_Pocket", (0.160, 0.016, 0.160),
         (0.225, body_front(1.55, 0.004), 1.55), MAT["shirt"], radius=0.010, part="pocket")
pk.rotation_euler = (math.radians(3), 0, math.radians(-5))

# ==========================================================================
# TIE
# ==========================================================================
KNOT_Z = BODY_TOP - 0.070
box("Piku_TieKnot", (0.100, 0.072, 0.090),
    (0, body_front(KNOT_Z, 0.022), KNOT_Z), MAT["tie"], radius=0.026, part="tie_knot")

bm = bmesh.new()
N, S = 22, 12
tz0, tz1 = KNOT_Z - 0.045, BELT_Z - 0.135
rings = []
for i in range(N):
    t = i / (N - 1)
    z = tz0 + (tz1 - tz0) * t
    half = 0.055 + 0.034 * t ** 1.2
    if t > 0.93:                                   # taper to the point
        half *= max(0.10, 1 - (t - 0.93) / 0.07)
    y = body_front(z, 0.014)                       # ride the actual belly curve
    rings.append([bm.verts.new((math.cos(2 * math.pi * j / S) * max(half, 0.006),
                                y + math.sin(2 * math.pi * j / S) * 0.019, z))
                  for j in range(S)])
for i in range(N - 1):
    A, B = rings[i], rings[i + 1]
    for j in range(S):
        bm.faces.new((A[j], A[(j + 1) % S], B[(j + 1) % S], B[j]))
bm.faces.new(rings[0]); bm.faces.new(list(reversed(rings[-1])))
finish("Piku_Tie", bm, MAT["tie"], True, "tie")

# ==========================================================================
# ARMS — outside the torso, hanging down; blue sleeve over a black flipper
# ==========================================================================
for side, sx in (("L", -1), ("R", 1)):
    ax = sx * 0.605
    lathe(f"Piku_Arm_{side}", catmull([(0.00, 0.128), (0.16, 0.145), (0.40, 0.143),
                                       (0.62, 0.130), (0.74, 0.108)], 20),
          segs=20, mat=MAT["black"], origin=(ax, -0.02, COLLAR_Z - 0.78), part="arm")
    lathe(f"Piku_Sleeve_{side}", catmull([(0.00, 0.128), (0.09, 0.158), (0.30, 0.163),
                                          (0.42, 0.150), (0.46, 0.100)], 16),
          segs=22, mat=MAT["shirt"], origin=(ax, -0.02, COLLAR_Z - 0.50), part="sleeve")
    ellipsoid(f"Piku_Hand_{side}", 0.140, 0.155, 0.170,
              (ax + sx * 0.010, -0.035, COLLAR_Z - 0.80), MAT["black"], "hand",
              segs=22, rings=18)

# ==========================================================================
# BELT + BUCKLE
# ==========================================================================
lathe("Piku_Belt", catmull([(-0.062, 0.588), (0.0, 0.605), (0.062, 0.588)], 10),
      segs=40, rx=1.0, ry=0.96, mat=MAT["trouser"], origin=(0, 0, BELT_Z),
      part="belt", y_shift=belly)
box("Piku_Buckle", (0.130, 0.030, 0.092),
    (0, body_front(BELT_Z, 0.040), BELT_Z), MAT["silver"], radius=0.010, part="buckle")

# ==========================================================================
# TROUSERS — hip mass splitting into two short cuffed legs
# ==========================================================================
lathe("Piku_Hips", catmull([(0.58, 0.480), (0.72, 0.545), (0.86, 0.578),
                            (BELT_Z + 0.06, 0.582)], 18),
      segs=36, rx=1.0, ry=0.94, mat=MAT["trouser"], part="hips", y_shift=belly)

for side, sx in (("L", -1), ("R", 1)):
    lathe(f"Piku_Leg_{side}", catmull([(0.00, 0.225), (0.08, 0.243), (0.26, 0.252),
                                       (0.46, 0.262), (0.62, 0.290)], 16),
          segs=24, mat=MAT["trouser"], origin=(sx * 0.300, -0.015, FOOT_TOP - 0.03),
          part="leg")
    lathe(f"Piku_Cuff_{side}", catmull([(0.0, 0.255), (0.035, 0.276), (0.08, 0.270),
                                        (0.105, 0.240)], 10),
          segs=24, mat=MAT["trouser"], origin=(sx * 0.300, -0.015, FOOT_TOP - 0.045),
          part="cuff")

# ==========================================================================
# FEET — orange, three splayed toes each
# ==========================================================================
for side, sx in (("L", -1), ("R", 1)):
    fx = sx * 0.355
    lathe(f"Piku_Foot_{side}", catmull([(0.0, 0.175), (0.060, 0.225), (0.130, 0.205),
                                        (0.185, 0.120)], 12),
          segs=22, rx=1.0, ry=1.15, mat=MAT["foot"], origin=(fx, -0.030, 0.004),
          part="foot")
    # Toes sweep forward (-Y): built along +Z then pitched down, pivoting on
    # their own root rather than the world origin.
    for ti, (tox, spread) in enumerate(((-0.145, -22), (0.0, 0), (0.145, 22))):
        toe = lathe(f"Piku_Toe_{side}{ti}",
                    catmull([(0.0, 0.072), (0.10, 0.082), (0.23, 0.076),
                             (0.33, 0.048), (0.375, 0.0)], 14),
                    segs=14, mat=MAT["foot"], part="toe",
                    pivot=(fx + tox, -0.105, 0.068))
        toe.rotation_euler = (math.radians(95), 0, math.radians(spread))

# ==========================================================================
# Hierarchy
# ==========================================================================
bpy.ops.object.empty_add(type='PLAIN_AXES', location=(0, 0, 0))
root = bpy.context.active_object
root.name = "Piku"
head_grp = bpy.data.objects.new("Piku_HeadGroup", None)
scene.collection.objects.link(head_grp)
head_grp.parent = root

HEAD_PARTS = {"head", "face_mask", "quiff", "eye", "iris", "pupil", "eye_highlight",
              "beak_upper", "beak_lower", "mouth", "glasses_rim", "glasses_temple",
              "glasses_bridge"}
for ob in list(OBJECTS.values()):
    ob.parent = head_grp if ob["piku_part"] in HEAD_PARTS else root

# --------------------------------------------------------------------------
# Report, save, export
# --------------------------------------------------------------------------
deps = bpy.context.evaluated_depsgraph_get()
tris, zs, xs = 0, [], []
for ob in OBJECTS.values():
    ev = ob.evaluated_get(deps)
    me = ev.to_mesh()
    me.calc_loop_triangles()
    tris += len(me.loop_triangles)
    for v in me.vertices:
        p = ob.matrix_world @ v.co
        zs.append(p.z); xs.append(p.x)
    ev.to_mesh_clear()

print("\n================ PIKU BUILD ================")
print(f"  objects       : {len(OBJECTS)}")
print(f"  triangles     : {tris}")
print(f"  height        : {max(zs) - min(zs):.3f}  (target {TOTAL_H})")
print(f"  width         : {max(xs) - min(xs):.3f}")
print(f"  heads tall    : {(max(zs) - min(zs)) / (HEAD_RZ * 2):.2f}  (skull heights)")
print(f"  collar z      : {COLLAR_Z:.3f}")
print(f"  eye z / sep   : {EYE_Z:.3f} / {EYE_X * 2:.3f} ({EYE_X * 2 / HEAD_W:.3f} of head w)")
print(f"  head rx/ry/rz : {HEAD_RX:.3f} / {HEAD_RY:.3f} / {HEAD_RZ:.3f}")
print("============================================\n")

bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT)
print(f"blend -> {BLEND_OUT}")
bpy.ops.object.select_all(action='SELECT')
bpy.ops.export_scene.gltf(filepath=GLB_OUT, export_format='GLB',
                          use_selection=True, export_apply=True)
print(f"glb   -> {GLB_OUT}")
