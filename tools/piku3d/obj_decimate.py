"""
Step 2 — the web working copy: decimate to ~40k tris, UV-unwrap, bake the
1M-tri source's normals and the region colours into one 2048² texture set.

    /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/piku3d/obj_decimate.py

Reads  _reference/piku/blender/piku_segmented.blend
Writes _reference/piku/blender/piku_low.blend        (Piku_Low + hidden Piku_Source)
       _reference/piku/blender/tex/piku_color.png     (2048², flat bible colours by region)
       _reference/piku/blender/tex/piku_normal.png    (2048², tangent space, from the source)

The region vertex groups survive decimation (Blender interpolates them), so
the rig step can still address glasses / beak_lower / quiff etc. Delicate
regions (frame, quiff, beak, eyes) are decimated less through a weight group.
"""
import bpy, os, time
import numpy as np

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VARIANT = os.environ.get("PIKU_VARIANT", "")          # "" = viewer OBJ path, "gen" = Tripo model path
PFX = "piku_gen" if VARIANT == "gen" else "piku"
SRC = os.path.join(ROOT, "_reference", "piku", "blender", f"{PFX}_segmented.blend")
OUT = os.path.join(ROOT, "_reference", "piku", "blender", f"{PFX}_low.blend")
TEX = os.path.join(ROOT, "_reference", "piku", "blender", "tex_gen" if VARIANT == "gen" else "tex")
os.makedirs(TEX, exist_ok=True)
TARGET_TRIS = 33000   # + ~4.3k mitten and ~2k eye tris keeps the GLB under 40k
TEX_SIZE = 2048

t0 = time.time()
bpy.ops.wm.open_mainfile(filepath=SRC)
scene = bpy.context.scene
high = next(o for o in bpy.data.objects if o.type == "MESH" and o.get("piku_stage") == "segmented")
high.name = "Piku_Source"
n = len(high.data.vertices)
print(f"source: {n} verts / {len(high.data.polygons)} tris")

def vg_mask(ob, name):
    idx = ob.vertex_groups[name].index
    m = np.zeros(len(ob.data.vertices), bool)
    for v in ob.data.vertices:
        for g in v.groups:
            if g.group == idx:
                m[v.index] = True; break
    return m

# --------------------------------------------------------------------------
# 1. decimation weights: 1 = decimate fully, lower = keep more triangles
# --------------------------------------------------------------------------
w = np.ones(n, dtype=np.float32)
for name, keep in (("head", 0.85), ("beak_upper", 0.45), ("beak_lower", 0.45), ("mouth", 0.5),
                   ("eye_L", 0.5), ("eye_R", 0.5), ("quiff", 0.35), ("glasses", 0.3)):
    w[vg_mask(high, name)] = keep
vg = high.vertex_groups.new(name="DecimateWeight")
for val in np.unique(w):
    idx = np.where(w == val)[0]
    vg.add(idx.tolist(), float(val), 'REPLACE')

# --------------------------------------------------------------------------
# 2. the low copy
# --------------------------------------------------------------------------
low = high.copy(); low.data = high.data.copy()
low.name = "Piku_Low"; low.data.name = "Piku_Low"
scene.collection.objects.link(low)
mod = low.modifiers.new("Decimate", 'DECIMATE')
mod.decimate_type = 'COLLAPSE'
mod.use_collapse_triangulate = True
mod.vertex_group = "DecimateWeight"
mod.vertex_group_factor = 1.0

deps = bpy.context.evaluated_depsgraph_get()
ratio = TARGET_TRIS / len(high.data.polygons)
for it in range(5):
    mod.ratio = ratio
    deps.update()
    tris = len(low.evaluated_get(deps).data.polygons)
    print(f"  decimate ratio {ratio:.5f} -> {tris} tris")
    if abs(tris - TARGET_TRIS) < 0.06 * TARGET_TRIS:
        break
    ratio *= TARGET_TRIS / tris

bpy.ops.object.select_all(action='DESELECT')
low.select_set(True); bpy.context.view_layer.objects.active = low
bpy.ops.object.modifier_apply(modifier="Decimate")
low.vertex_groups.remove(low.vertex_groups["DecimateWeight"])
print(f"low mesh: {len(low.data.vertices)} verts / {len(low.data.polygons)} tris  ({time.time()-t0:.0f}s)")
for p in low.data.polygons:
    p.use_smooth = True

# --------------------------------------------------------------------------
# 3. UVs
# --------------------------------------------------------------------------
bpy.ops.object.mode_set(mode='EDIT')
bpy.ops.mesh.select_all(action='SELECT')
# wide angle limit: the decimated triangle soup has no clean crease loops, a
# tight limit shatters it into thousands of confetti islands
bpy.ops.uv.smart_project(angle_limit=np.radians(89), island_margin=0.003, area_weight=0.5,
                         correct_aspect=True, scale_to_bounds=False)
bpy.ops.object.mode_set(mode='OBJECT')
low.data.uv_layers[0].name = "UVMap"
print(f"uv islands unwrapped ({time.time()-t0:.0f}s)")

# --------------------------------------------------------------------------
# 4. bake targets + materials
# --------------------------------------------------------------------------
img_col = bpy.data.images.new("piku_color", TEX_SIZE, TEX_SIZE)
img_nrm = bpy.data.images.new("piku_normal", TEX_SIZE, TEX_SIZE, float_buffer=False)
img_nrm.colorspace_settings.name = 'Non-Color'
img_ao = bpy.data.images.new("piku_ao", TEX_SIZE, TEX_SIZE)
img_ao.colorspace_settings.name = 'Non-Color'
img_rgh = bpy.data.images.new("piku_rough", TEX_SIZE, TEX_SIZE)
img_rgh.colorspace_settings.name = 'Non-Color'

# per-region roughness on the source, baked like a colour: glossy frame,
# buckle and eye plate; satin beak and feet; matte cloth and feathers
rough = np.full(n, 0.72, dtype=np.float32)
for name, val in (("beak_upper", 0.45), ("beak_lower", 0.45), ("mouth", 0.5), ("foot_L", 0.45), ("foot_R", 0.45),
                  ("belt", 0.55), ("eye_L", 0.3), ("eye_R", 0.3), ("glasses", 0.22)):
    rough[vg_mask(high, name)] = val
rc = high.data.color_attributes.get("PikuRough") or high.data.color_attributes.new("PikuRough", 'FLOAT_COLOR', 'POINT')
rcols = np.ones((n, 4), dtype=np.float32); rcols[:, 0] = rough; rcols[:, 1] = rough; rcols[:, 2] = rough
rc.data.foreach_set("color", rcols.ravel())

mat = bpy.data.materials.new("Piku_Web"); mat.use_nodes = True
nt = mat.node_tree; bsdf = nt.nodes["Principled BSDF"]
bsdf.inputs["Roughness"].default_value = 0.55
tex_c = nt.nodes.new("ShaderNodeTexImage"); tex_c.image = img_col; tex_c.name = "BakeColor"
tex_n = nt.nodes.new("ShaderNodeTexImage"); tex_n.image = img_nrm; tex_n.name = "BakeNormal"
tex_a = nt.nodes.new("ShaderNodeTexImage"); tex_a.image = img_ao; tex_a.name = "BakeAO"
tex_r = nt.nodes.new("ShaderNodeTexImage"); tex_r.image = img_rgh; tex_r.name = "BakeRough"
nmap = nt.nodes.new("ShaderNodeNormalMap"); nmap.space = 'TANGENT'
nt.links.new(tex_c.outputs["Color"], bsdf.inputs["Base Color"])
nt.links.new(tex_r.outputs["Color"], bsdf.inputs["Roughness"])
nt.links.new(tex_n.outputs["Color"], nmap.inputs["Color"])
nt.links.new(nmap.outputs["Normal"], bsdf.inputs["Normal"])
low.data.materials.clear()
low.data.materials.append(mat)

scene.render.engine = 'CYCLES'
scene.cycles.device = 'CPU'
scene.cycles.samples = 4
scene.render.bake.use_selected_to_active = True
# short rays: where the sleeve sits 0.03 off the torso the bake must not
# see through to the torso's normals
scene.render.bake.cage_extrusion = 0.03
scene.render.bake.max_ray_distance = 0.08
scene.render.bake.margin = 6
scene.render.bake.use_clear = True

bpy.ops.object.select_all(action='DESELECT')
high.select_set(True); low.select_set(True)
bpy.context.view_layer.objects.active = low
high.hide_render = False; high.hide_viewport = False

def bake(kind, node):
    for nd in nt.nodes:
        nd.select = False
    node.select = True; nt.nodes.active = node
    t = time.time()
    if kind == 'DIFFUSE':
        scene.render.bake.use_pass_direct = False
        scene.render.bake.use_pass_indirect = False
        scene.render.bake.use_pass_color = True
    bpy.ops.object.bake(type=kind)
    print(f"  baked {kind} ({time.time()-t:.0f}s)")

bake('NORMAL', tex_n)
bake('DIFFUSE', tex_c)
scene.cycles.samples = 48
bake('AO', tex_a)
scene.cycles.samples = 4
# roughness: bake the source's PikuRough attribute through an emission material
high_mats = [m for m in high.data.materials]
for m in high_mats:
    m.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 1.0
    ncol = m.node_tree.nodes.new("ShaderNodeVertexColor"); ncol.layer_name = "PikuRough"
    m.node_tree.links.new(ncol.outputs["Color"], m.node_tree.nodes["Principled BSDF"].inputs["Emission Color"])
bake('EMIT', tex_r)
for m in high_mats:
    m.node_tree.nodes["Principled BSDF"].inputs["Emission Strength"].default_value = 0.0

# the finish: occlusion darkens the folds, cuff rolls, collar and belt
W = TEX_SIZE
cpx = np.empty(W * W * 4, dtype=np.float32); img_col.pixels.foreach_get(cpx); cpx = cpx.reshape(-1, 4)
apx = np.empty(W * W * 4, dtype=np.float32); img_ao.pixels.foreach_get(apx); apx = apx.reshape(-1, 4)
ao = np.clip(apx[:, 0], 0, 1)
cpx[:, :3] *= (0.72 + 0.28 * ao)[:, None]
img_col.pixels.foreach_set(cpx.ravel())
img_ao.filepath_raw = os.path.join(TEX, "piku_ao.png"); img_ao.file_format = 'PNG'; img_ao.save()
img_rgh.filepath_raw = os.path.join(TEX, "piku_rough.png"); img_rgh.file_format = 'PNG'; img_rgh.save()
img_rgh.filepath = img_rgh.filepath_raw; img_rgh.source = 'FILE'
img_col.filepath_raw = os.path.join(TEX, "piku_color.png"); img_col.file_format = 'PNG'; img_col.save()
img_nrm.filepath_raw = os.path.join(TEX, "piku_normal.png"); img_nrm.file_format = 'PNG'; img_nrm.save()
img_col.filepath = img_col.filepath_raw; img_nrm.filepath = img_nrm.filepath_raw
img_col.source = 'FILE'; img_nrm.source = 'FILE'

# --------------------------------------------------------------------------
# 5. finish
# --------------------------------------------------------------------------
high.hide_render = True; high.hide_viewport = True; high.hide_set(True)
low["piku_stage"] = "low"
for k in ("skull_centre", "skull_r", "eye_L", "eye_R", "eye_r", "mouth_z", "z_shoulder", "z_belt", "z_cuff", "z_feet"):
    if k in high:
        low[k] = high[k]
print("\n=== LOW ===")
print(f"  verts / tris : {len(low.data.vertices)} / {len(low.data.polygons)}")
print(f"  regions      : {', '.join(g.name for g in low.vertex_groups)}")
bpy.ops.wm.save_as_mainfile(filepath=OUT, compress=True)
print(f"saved -> {OUT}  ({os.path.getsize(OUT)/1e6:.1f} MB)  total {time.time()-t0:.0f}s")
print("DECIMATE_DONE")
