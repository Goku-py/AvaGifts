"""
Step 6 — export the rigged low mesh as a web GLB and validate it.

    /Applications/Blender.app/Contents/MacOS/Blender -b -P tools/piku3d/obj_export.py

Reads  _reference/piku/blender/piku_rigged.blend
Writes public/brand/piku/piku.glb

Budget (from the plan): <= 40k tris, <= 32 bones, <= 4 MB, one skin, one
material with baked colour + normal maps. No animation clips yet — the
rig ships in rest pose; clips are authored on top of it later.
"""
import bpy, os, json, struct, time

ROOT = os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
VARIANT = os.environ.get("PIKU_VARIANT", "")
SRC = os.path.join(ROOT, "_reference", "piku", "blender", ("piku_gen" if VARIANT == "gen" else "piku") + "_rigged.blend")
OUT = os.path.join(ROOT, "public", "brand", "piku", "piku.glb")
os.makedirs(os.path.dirname(OUT), exist_ok=True)

t0 = time.time()
bpy.ops.wm.open_mainfile(filepath=SRC)
low = bpy.data.objects["Piku_Low"]; arm = bpy.data.objects["Piku_Rig"]
eyes = [o for o in bpy.data.objects if o.name.startswith("Piku_Eye_")]
for ob in bpy.data.objects:
    if ob.name.startswith("Piku_Source"):
        bpy.data.objects.remove(ob, do_unlink=True)      # never ship the 1M-tri source
for pb in arm.pose.bones:
    pb.rotation_euler = (0, 0, 0); pb.location = (0, 0, 0)

# the material: colour texture (sRGB) + tangent normal map; both are packed
mat = low.data.materials[0]
# the widget renders Piku at ~160 px: 1024² maps are more than enough and
# keep the GLB inside the 4 MB budget (the 2048² masters stay on disk)
WEB_TEX = 1024
for img in bpy.data.images:
    if img.name in ("piku_color", "piku_normal", "piku_rough"):
        if img.size[0] > WEB_TEX:
            img.scale(WEB_TEX, WEB_TEX)
        img.pack()
mat.node_tree.nodes["Principled BSDF"].inputs["Roughness"].default_value = 0.6

bpy.ops.object.select_all(action='DESELECT')
low.select_set(True); arm.select_set(True)
for o in eyes:
    o.select_set(True)
bpy.context.view_layer.objects.active = arm
bpy.ops.export_scene.gltf(
    filepath=OUT, export_format='GLB', use_selection=True,
    export_apply=True, export_skins=True, export_animations=False,
    export_yup=True, export_texcoords=True, export_normals=True, export_tangents=False,
    export_materials='EXPORT', export_image_format='WEBP', export_image_quality=90,
    export_def_bones=True, export_rest_position_armature=True,
)
size = os.path.getsize(OUT)

# ---- validate by reading the GLB back -------------------------------------
with open(OUT, "rb") as f:
    magic, version, length = struct.unpack("<III", f.read(12))
    clen, ctype = struct.unpack("<II", f.read(8))
    gltf = json.loads(f.read(clen))
tris = 0
for m in gltf["meshes"]:
    for p in m["primitives"]:
        acc = gltf["accessors"][p["indices"]]
        tris += acc["count"] // 3
skins = gltf.get("skins", [])
joints = len(skins[0]["joints"]) if skins else 0
mats = len(gltf.get("materials", []))
imgs = len(gltf.get("images", []))
skinned = [m for m in gltf["meshes"] if any("JOINTS_0" in p["attributes"] for p in m["primitives"])]
print("\n=== GLB ===")
print(f"  file      : {OUT}  {size/1e6:.2f} MB")
print(f"  tris      : {tris}")
print(f"  skins     : {len(skins)}  joints {joints}  skinned meshes {len(skinned)}")
print(f"  materials : {mats}  images {imgs}")
print(f"  nodes     : {[nd.get('name') for nd in gltf['nodes'] if 'skin' in nd or nd.get('name') in ('Piku_Rig', 'Piku_Low')]}")
checks = {
    "tris <= 40000": tris <= 40000,
    "joints <= 32": joints <= 32,
    "size <= 4 MB": size <= 4e6,
    "one skin": len(skins) == 1,
    "materials": mats == (1 if not eyes else 2),
    "colour + normal + roughness images": imgs == 3,
    "eye nodes": sum(1 for nd in gltf["nodes"] if str(nd.get("name", "")).startswith("Piku_Eye_")) == len(eyes),
}
ok = all(checks.values())
for k, v in checks.items():
    print(f"  [{'ok' if v else 'FAIL'}] {k}")
print(f"total {time.time()-t0:.0f}s")
print("EXPORT_DONE" if ok else "EXPORT_FAILED")
