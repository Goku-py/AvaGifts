"""
Generated-model path, step 0 — normalise the Tripo GLB the way obj_prepare.py
normalises the viewer OBJ: 2.90 units tall, feet on z=0, facing -Y, Piku's
left = +X. Keeps its baked texture. Prints what the file contains.

    /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/piku3d/gen_prepare.py

Reads  _reference/piku/gen/piku_tripo.glb
Writes _reference/piku/blender/piku_gen.blend
"""
import bpy, os, time
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
GLB = os.path.join(ROOT, "_reference", "piku", "gen", "piku_tripo.glb")
OUT = os.path.join(ROOT, "_reference", "piku", "blender", "piku_gen.blend")
TOTAL_H = 2.90

t0 = time.time()
bpy.ops.wm.read_factory_settings(use_empty=True)
bpy.ops.import_scene.gltf(filepath=GLB)
meshes = [o for o in bpy.data.objects if o.type == "MESH"]
print(f"imported {len(meshes)} mesh object(s): {[m.name for m in meshes]}")
ob = meshes[0]
if len(meshes) > 1:
    bpy.ops.object.select_all(action='DESELECT')
    for m in meshes:
        m.select_set(True)
    bpy.context.view_layer.objects.active = ob
    bpy.ops.object.join()
# bake transforms so the vertices carry the world positions
bpy.ops.object.select_all(action='DESELECT'); ob.select_set(True); bpy.context.view_layer.objects.active = ob
if ob.parent:
    bpy.ops.object.parent_clear(type='CLEAR_KEEP_TRANSFORM')
bpy.ops.object.transform_apply(location=True, rotation=True, scale=True)
ob.name = "Piku_Gen"; ob.data.name = "Piku_Gen"
me = ob.data
n = len(me.vertices)
co = np.empty(n * 3); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3)
ext = co.max(0) - co.min(0)
print(f"verts {n}  tris {len(me.polygons)}  extents xyz {ext.round(3)}  (after glTF Y-up -> Z-up import)")
up = int(np.argmax(ext))
if up != 2:
    print(f"  WARNING: tallest axis is {'xyz'[up]}, expected z")
s = TOTAL_H / ext[2]
co *= s
co[:, 0] -= (co[:, 0].max() + co[:, 0].min()) / 2
co[:, 1] -= (co[:, 1].max() + co[:, 1].min()) / 2
co[:, 2] -= co[:, 2].min()
top = co[:, 2].max()
def band(lo, hi):
    return co[(co[:, 2] <= top - lo * TOTAL_H) & (co[:, 2] >= top - hi * TOTAL_H)]
# facing: the beak is the only thing that breaks the skull's symmetry; find
# along which of ±X / ±Y it protrudes and rotate that direction onto -Y
skull = band(0.14, 0.22); beak = band(0.27, 0.36)
c = (skull.max(0) + skull.min(0)) / 2
reach = {"-Y": c[1] - beak[:, 1].min(), "+Y": beak[:, 1].max() - c[1],
         "-X": c[0] - beak[:, 0].min(), "+X": beak[:, 0].max() - c[0]}
facing = max(reach, key=reach.get)
print("beak reach from skull centre: " + "  ".join(f"{k} {v:.3f}" for k, v in reach.items()) + f"  -> faces {facing}")
x, y = co[:, 0].copy(), co[:, 1].copy()
if facing == "+Y":
    co[:, 0], co[:, 1] = -x, -y                 # 180° about Z
elif facing == "+X":
    co[:, 0], co[:, 1] = y, -x                  # -90° about Z: +X -> -Y
elif facing == "-X":
    co[:, 0], co[:, 1] = -y, x                  # +90° about Z: -X -> -Y
co[:, 0] -= (co[:, 0].max() + co[:, 0].min()) / 2
co[:, 1] -= (co[:, 1].max() + co[:, 1].min()) / 2
me.vertices.foreach_set("co", co.ravel()); me.update()
# save the baked colour texture next to the GLB for the segmentation step
for img in bpy.data.images:
    if img.size[0] > 0:
        img.filepath_raw = os.path.join(os.path.dirname(GLB), "piku_tripo_color.png")
        img.file_format = 'PNG'; img.save()
        print(f"texture saved -> {img.filepath_raw}")
for p in me.polygons:
    p.use_smooth = True

# materials / textures present?
for m in me.materials:
    imgs = [nd.image.name for nd in m.node_tree.nodes if nd.type == 'TEX_IMAGE' and nd.image] if m.use_nodes else []
    print(f"material {m.name}: images {imgs}")
for img in bpy.data.images:
    print(f"image {img.name}: {img.size[0]}x{img.size[1]}  packed={img.packed_file is not None}")
print(f"uv layers: {[u.name for u in me.uv_layers]}")

# the GLB splits the shell along its UV charts (duplicated seam vertices);
# weld them back — UVs live on face corners, so the texture is untouched
import bmesh
bm = bmesh.new(); bm.from_mesh(me)
n0 = len(bm.verts)
bmesh.ops.remove_doubles(bm, verts=bm.verts, dist=1e-4)
bmesh.ops.dissolve_degenerate(bm, edges=bm.edges, dist=1e-5)
bmesh.ops.recalc_face_normals(bm, faces=bm.faces)
nb = sum(1 for e in bm.edges if e.is_boundary); nm = sum(1 for e in bm.edges if not e.is_manifold)
bm.verts.ensure_lookup_table()
parent = list(range(len(bm.verts)))
def find(a):
    while parent[a] != a:
        parent[a] = parent[parent[a]]; a = parent[a]
    return a
for e in bm.edges:
    ra, rb = find(e.verts[0].index), find(e.verts[1].index)
    if ra != rb:
        parent[ra] = rb
islands = len(set(find(i) for i in range(len(bm.verts))))
bm.to_mesh(me); bm.free(); me.update()
print(f"weld: {n0} -> {len(me.vertices)} verts, islands {islands}")
n = len(me.vertices)
co = np.empty(n * 3); me.vertices.foreach_get("co", co); co = co.reshape(-1, 3)
for p in me.polygons:
    p.use_smooth = True
ext = co.max(0) - co.min(0)
print(f"\n=== GEN ===\n  size w/d/h {ext[0]:.3f} / {ext[1]:.3f} / {ext[2]:.3f}  (w/h {ext[0]/ext[2]:.3f})\n  boundary edges {nb}  non-manifold {nm}")
ob["piku_stage"] = "gen"
bpy.ops.wm.save_as_mainfile(filepath=OUT, compress=True)
print(f"saved -> {OUT}  ({os.path.getsize(OUT)/1e6:.1f} MB)  {time.time()-t0:.0f}s")
print("GEN_PREPARE_DONE")
