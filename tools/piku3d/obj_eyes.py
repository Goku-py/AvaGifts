"""
Step 2 — eyeballs. The sculpt paints its eyes on a flat plate inside the
frames; every reference draws round, slightly protruding eyeballs with a big
brown iris, a black pupil and one catch-light. Two spheres, vertex-coloured,
one glossy material, parented to the eye bones so they can look and blink.

Used by obj_rig.py:  from obj_eyes import build_eyes
"""
import bpy, bmesh, math
import numpy as np
from mathutils import Vector, Matrix

def _lin(hexs):
    def f(c):
        c /= 255.0
        return c / 12.92 if c <= 0.04045 else ((c + 0.055) / 1.055) ** 2.4
    return tuple(f(int(hexs[i:i + 2], 16)) for i in (0, 2, 4))

SCLERA, IRIS, PUPIL, HILITE = (1, 1, 1), _lin("572709"), _lin("0B0A0A"), (1, 1, 1)

def build_eyes(scene, arm, centres, radius, look=(0.0, -1.0, 0.0), iris_deg=27.0, pupil_deg=11.0):
    """centres: {'L': (x,y,z), 'R': (x,y,z)} of the eyeball centres (world).
    look: direction the pupils face in rest. Returns the two objects."""
    mat = bpy.data.materials.get("Piku_Eye")
    if mat is None:
        mat = bpy.data.materials.new("Piku_Eye"); mat.use_nodes = True
        nt = mat.node_tree; bsdf = nt.nodes["Principled BSDF"]
        vc = nt.nodes.new("ShaderNodeVertexColor"); vc.layer_name = "Col"
        nt.links.new(vc.outputs["Color"], bsdf.inputs["Base Color"])
        bsdf.inputs["Roughness"].default_value = 0.12
        bsdf.inputs["IOR"].default_value = 1.4
    look = Vector(look).normalized()
    out = []
    for side, c in centres.items():
        bm = bmesh.new()
        bmesh.ops.create_uvsphere(bm, u_segments=32, v_segments=16, radius=radius)
        # orient the sphere so its pole faces `look` (the iris sits on the pole)
        rot = Vector((0, 0, 1)).rotation_difference(look).to_matrix()
        bmesh.ops.transform(bm, matrix=rot.to_4x4(), verts=bm.verts)
        col = bm.loops.layers.color.new("Col")
        # each side's pupil is turned a little toward the nose and down, as
        # the references draw them
        sgn = 1 if side == "L" else -1
        gaze = (Matrix.Rotation(math.radians(-6), 3, 'Z') if sgn > 0 else Matrix.Rotation(math.radians(6), 3, 'Z')) @ \
               (Matrix.Rotation(math.radians(-4), 3, 'X') @ look)
        hi_dir = (Matrix.Rotation(math.radians(-14), 3, 'Z') @ Matrix.Rotation(math.radians(14), 3, 'X') @ gaze).normalized()
        for f in bm.faces:
            f.smooth = True
            d = f.calc_center_median().normalized()
            ang = math.degrees(math.acos(max(-1, min(1, d.dot(gaze)))))
            hang = math.degrees(math.acos(max(-1, min(1, d.dot(hi_dir)))))
            if hang < 5.0:
                rgb = HILITE
            elif ang < pupil_deg:
                rgb = PUPIL
            elif ang < iris_deg:
                rgb = IRIS
            else:
                rgb = SCLERA
            for l in f.loops:
                l[col] = (*rgb, 1.0)
        me = bpy.data.meshes.new(f"Piku_Eye_{side}")
        bm.to_mesh(me); bm.free()
        me.materials.append(mat)
        ob = bpy.data.objects.new(f"Piku_Eye_{side}", me)
        scene.collection.objects.link(ob)
        ob.parent = arm
        ob.parent_type = 'BONE'
        ob.parent_bone = f"eye_{side}"
        ob.matrix_world = Matrix.Translation(Vector(c))
        out.append(ob)
    return out
