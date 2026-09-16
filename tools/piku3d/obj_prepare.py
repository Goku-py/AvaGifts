"""
Step 0 — normalise the Piku mesh extracted from the WebGL viewer.

    /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/piku3d/obj_prepare.py

Reads  _reference/piku/3D_obj/piku.obj   (never modified)
Writes _reference/piku/blender/piku_source.blend

What the raw OBJ is: a draw-call dump of a gltfpack-quantized GLB. Positions
are 14-bit integers (0..16383), the shell is split into ~700 fragments by
duplicated seam vertices, and there are no normals, UVs, materials or colour.

What this script does:
  1. weld the seams back into one shell, drop degenerate faces, close holes
  2. rotate Y-up -> Z-up, scale to the pipeline's 2.90-unit height, feet on z=0
  3. detect which way Piku faces (no colour to read, so use the beak's
     protrusion from the skull) and turn him to face -Y, matching piku_build.py
  4. name everything, shade smooth, give it a neutral grey material so the
     turnaround renderer shows form
  5. save, and print the numbers the plan's verification step asks for
"""
import bpy, bmesh, math, os, time
import numpy as np
from mathutils import Matrix, Vector

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
OBJ_IN = os.path.join(ROOT, "_reference", "piku", "3D_obj", "piku.obj")
BLEND_OUT = os.path.join(ROOT, "_reference", "piku", "blender", "piku_source.blend")
os.makedirs(os.path.dirname(BLEND_OUT), exist_ok=True)

TOTAL_H = 2.90          # same convention as piku_build.py
WELD_DIST = 0.6         # in raw integer units: merges exact duplicates only

t0 = time.time()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.wm.obj_import(filepath=OBJ_IN)
ob = [o for o in bpy.data.objects if o.type == "MESH"][0]
ob.name = "Piku_Source"
me = ob.data
me.name = "Piku_Source"
print(f"imported {len(me.vertices)} verts / {len(me.polygons)} faces in {time.time()-t0:.0f}s")

# --------------------------------------------------------------------------
# 1. weld + clean
# --------------------------------------------------------------------------
bm = bmesh.new()
bm.from_mesh(me)
n_raw = len(bm.verts)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=WELD_DIST)
bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=0.01)

# Duplicate faces (same vertex set) are what make an edge "non-manifold" here;
# drop the extras before closing holes.
seen, dupes = set(), []
for f in bm.faces:
    key = tuple(sorted(v.index for v in f.verts))
    if key in seen:
        dupes.append(f)
    else:
        seen.add(key)
if dupes:
    bmesh.ops.delete(bm, geom=dupes, context='FACES_ONLY')
bm.verts.index_update(); bm.edges.index_update(); bm.faces.index_update()

boundary = [e for e in bm.edges if e.is_boundary]
if boundary:
    bmesh.ops.holes_fill(bm, edges=boundary, sides=0)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)

n_bound = sum(1 for e in bm.edges if e.is_boundary)
n_nonman = sum(1 for e in bm.edges if not e.is_manifold)
print(f"weld: {n_raw} -> {len(bm.verts)} verts, {len(dupes)} duplicate faces dropped, "
      f"{len(boundary)} boundary edges filled -> boundary {n_bound}, non-manifold {n_nonman}")

bm.to_mesh(me)
bm.free()
me.update()

# --------------------------------------------------------------------------
# 2. orient + scale
# --------------------------------------------------------------------------
co = np.empty(len(me.vertices) * 3)
me.vertices.foreach_get("co", co)
co = co.reshape(-1, 3)
ext = co.max(0) - co.min(0)
up = int(np.argmax(ext))
print(f"raw extents xyz = {ext.round(0)}  tallest axis = {'xyz'[up]}")

# Bring the tall axis to Z. The dump comes in Y-up; handle the general case
# anyway so a re-export with different axes still works.
if up == 1:
    co = np.stack([co[:, 0], -co[:, 2], co[:, 1]], axis=1)   # R_x(+90°): y->z
elif up == 0:
    co = np.stack([co[:, 2], co[:, 1], co[:, 0]], axis=1)    # swap x<->z (mirror; fixed below)

H = co[:, 2].max() - co[:, 2].min()
s = TOTAL_H / H
co *= s
co[:, 0] -= (co[:, 0].max() + co[:, 0].min()) / 2
co[:, 1] -= (co[:, 1].max() + co[:, 1].min()) / 2
co[:, 2] -= co[:, 2].min()

# --------------------------------------------------------------------------
# 3. facing. The skull is a sphere; the beak is the only thing that breaks its
#    front/back symmetry. Compare how far the beak band (0.27..0.36h from the
#    top) reaches in +Y vs -Y beyond the skull centre measured in the clean
#    band above it (0.14..0.22h).
# --------------------------------------------------------------------------
top = co[:, 2].max()
def band(lo, hi):
    return co[(co[:, 2] <= top - lo * TOTAL_H) & (co[:, 2] >= top - hi * TOTAL_H)]
skull = band(0.14, 0.22)
cy = (skull[:, 1].max() + skull[:, 1].min()) / 2
beak = band(0.27, 0.36)
reach_neg = cy - beak[:, 1].min()
reach_pos = beak[:, 1].max() - cy
print(f"beak reach from skull centre: -Y {reach_neg:.3f}  +Y {reach_pos:.3f}")
if reach_pos > reach_neg:
    # facing +Y: spin 180° about Z so the beak points at -Y
    co[:, 0] *= -1
    co[:, 1] *= -1
    print("facing was +Y -> rotated 180° about Z")
else:
    print("facing already -Y")

me.vertices.foreach_set("co", co.ravel())
me.update()

# --------------------------------------------------------------------------
# 4. finish
# --------------------------------------------------------------------------
for p in me.polygons:
    p.use_smooth = True

mat = bpy.data.materials.new("Piku_Clay")
mat.use_nodes = True
bsdf = mat.node_tree.nodes.get("Principled BSDF")
bsdf.inputs["Base Color"].default_value = (0.55, 0.55, 0.56, 1.0)
bsdf.inputs["Roughness"].default_value = 0.65
me.materials.append(mat)

ob.location = (0, 0, 0)
ob.rotation_euler = (0, 0, 0)
ob.scale = (1, 1, 1)
ob["piku_stage"] = "source"

# --------------------------------------------------------------------------
# 5. report + save
# --------------------------------------------------------------------------
bm = bmesh.new(); bm.from_mesh(me)
bm.verts.ensure_lookup_table()
parent = np.arange(len(bm.verts))
def find(a):
    while parent[a] != a:
        parent[a] = parent[parent[a]]; a = parent[a]
    return a
for e in bm.edges:
    a, b = e.verts[0].index, e.verts[1].index
    ra, rb = find(a), find(b)
    if ra != rb:
        parent[ra] = rb
islands = len(set(find(i) for i in range(len(bm.verts))))
bm.free()

ext = co.max(0) - co.min(0)
print(f"\n=== SOURCE ===")
print(f"  verts / tris  : {len(me.vertices)} / {len(me.polygons)}")
print(f"  islands       : {islands}")
print(f"  boundary      : {n_bound}   non-manifold {n_nonman}")
print(f"  size w/d/h    : {ext[0]:.3f} / {ext[1]:.3f} / {ext[2]:.3f}   (w/h {ext[0]/ext[2]:.3f}, d/h {ext[1]/ext[2]:.3f})")
print(f"  feet at z     : {co[:, 2].min():.3f}")

bpy.ops.wm.save_as_mainfile(filepath=BLEND_OUT, compress=True)
print(f"saved -> {BLEND_OUT}  ({os.path.getsize(BLEND_OUT)/1e6:.1f} MB)  total {time.time()-t0:.0f}s")
print("PREPARE_DONE")
