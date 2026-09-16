# Piku Character Bible

The single source of truth for Piku, AvaGift's mascot. Every Piku asset — 2D
sprite, 3D rig, generated still, animation — is checked against this document.
If an asset contradicts the bible, the asset is wrong.

**Anchor reference:** `_reference/piku/ANCHOR-Avagift.png` (864×1129)
**All references:** `_reference/piku/source/` (12 renders, gitignored)

Every number and hex below was **measured off the anchor**, not estimated.
Measurement scripts are disposable; the values are what matter.

---

## 1. Identity traits — non-negotiable

Piku's identity lives in six traits. Lose any one and he stops reading as Piku.
This is the acceptance checklist for every asset.

| # | Trait | Spec |
|---|---|---|
| 1 | **Quiff** | 3–4 spiky black points, off-centre, leaning back off the crown |
| 2 | **Glasses** | Thick black rounded-rectangle frames with visible temple arms, sitting over the white mask |
| 3 | **Eyes** | Large amber-brown irises, oversized white sclera, twin specular highlights |
| 4 | **Beak & feet** | Orange; open smiling beak, bare three-toed feet |
| 5 | **Wardrobe** | Cornflower-blue collared shirt (chest pocket, rolled sleeves) + amber tie + black belt with silver buckle + black cuffed trousers |
| 6 | **Proportions** | ~2.9 heads tall, no neck, pear/egg torso, black mitten hands |

---

## 2. Palette

Sampled by hue/saturation/value windows across the anchor and reduced to the
median, so highlights, shadows and anti-aliasing don't skew the result.

| Part | Base | Notes |
|---|---|---|
| Body black | `#161615` | 55% of the character by area — the dominant colour |
| Shirt blue | `#B2C4E2` | lit `#B6C8E5` · shadow `#748BB4` |
| Tie amber | `#F6BB54` | warmer and more golden than the beak — do not merge the two |
| Beak orange | `#D9670C` | deeper than the feet |
| Foot orange | `#F97C0B` | brighter than the beak |
| Iris brown | `#572709` | amber glint `#A85715` |
| Buckle silver | `#A2A0A1` | also the glasses-hinge highlight |
| Mask white | `#FFFFFF` | shadowed `#D4C4B6` |

Beak and feet are **not** the same orange. The beak is deeper and redder; the
feet are brighter and more yellow. Flattening them to one value is the most
common way renders drift off-model.

---

## 3. Proportions

All fractions below are of **total figure height, measured from the top**.
Measured by `tools/piku3d/measure_views.py` on the four clean views in
`_reference/piku/views/` (front / back / right side / three-quarter,
white background), which supersede the single `piku_ namaste.png` reading.

| Landmark | Position |
|---|---|
| Skull centre | **0.2564h** |
| Skull radius | **0.2077h** (diameter 0.415h) |
| Eyes | **0.245h**, at `u ≈ ±0.365` of the head width |
| Beak | **0.26h → 0.365h**; mouth line ~0.32h |
| Shoulder line | **0.3738h** |
| Sleeve cuff | **0.715h** (hands hang to ~0.81h) |
| Belt | **0.6773h** |
| Feet | top **0.9161h** → 1.0h |
| Width / height | **0.58** (arms), head diameter ~72% of the figure width |
| Overall height | **~2.4 heads tall** |

> **Geometry source.** The shipped 3D Piku is not built from these numbers: it
> is the mesh extracted from the original WebGL viewer
> (`_reference/piku/3D_obj/piku.obj`, 1.9 M triangles, one shell), normalised
> to 2.90 units tall, feet on z = 0, facing −Y, Piku's left = +X. The numbers
> above are the reference photos' landmarks and are used to place colour
> regions, bones and the camera, not to model the character. Where the mesh
> and the photos disagree (they do — the mesh's upper mandible sits directly
> under the frame bridge, the eyes are painted on a flat plate, and the
> photos were shot from slightly above), **the mesh wins**.
>
> Measured on the mesh (units, z up): skull centre (−0.026, +0.096, 2.183),
> radius 0.572; face plate at y ≈ −0.36; lens openings L x 0.065–0.295 /
> z 2.165–2.355, R x −0.345–−0.145 / z 2.125–2.315; frame bridge z 2.23–2.35;
> upper mandible z 2.07–2.25 (tip y −0.64); mouth opening z 1.97–2.05; lower
> lip z 1.87–1.97. The eyes have **no geometry** — animated eyes are separate
> objects parented to the `eye_L` / `eye_R` bones.

### 3a. The 3D pipeline (`tools/piku3d/`)

Two sources exist. The **shipped GLB comes from the Magnific/Tripo
generation** (Sept 2026): a textured model generated from the three clean
views (front, back, right side) with Tripo v3.1, detailed textures, 298 k
tris, one 4096² colour map. It is on-model down to the pocket, cuffs,
buckle, catch-lights and tongue, and it replaced the viewer-OBJ path whose
colour had to be reconstructed by hand. Magnific's own auto-rig (biped and
avian) misassembles this body — arms hang tight to the torso, no neck — so
the skeleton is ours. Credits spent: 1,160 generation + 2 × 150 rig tries.

Run with `PIKU_VARIANT=gen` (the viewer-OBJ path runs without it):

| Step | Script | Output |
|---|---|---|
| 0 normalise | `gen_prepare.py` (`obj_prepare.py` for the OBJ) | `piku_gen.blend` — welded to one shell, 2.90 tall, facing −Y |
| 1 regions | `gen_segment.py` (`obj_segment.py` for the OBJ) | `piku_gen_segmented.blend` — 20 region groups from the model's own texels + geometry |
| 2 web copy | `obj_decimate.py` | `piku_gen_low.blend`, 33 k tris, baked colour / normal / AO / roughness (`tex_gen/`) |
| 4 rig | `obj_rig.py` (+ `obj_eyes.py` on the OBJ path) | `piku_gen_rigged.blend` — 23-bone custom armature |
| 5 pose test | `obj_pose_test.py` + `piku_render.py` | `renders/genpose_*.png` |
| 6 export | `obj_export.py` | `public/brand/piku/piku.glb` (2.1 MB, 1 skin, 1 material, 3 WebP maps) — source asset, not loaded by the site |
| 7 widget | `widget_render.py` + `widget_encode.sh` | `public/brand/piku/piku-idle.webp` (24-frame breathing loop, ~128 KB) and `piku-still.webp` (~7 KB) |

**What the website ships.** The chat launcher shows the step-7 WebPs, never
the GLB — 2.1 MB plus a three.js runtime is far too heavy for a corner
widget, and Piku is meant to stand still. The loop is rendered front-on at 2x
the 96×104 CSS box, with the only motion a 2% breath made by scaling the
armature object (no bone poses, so the mitten/hip contact can never web).
Piku no longer wanders, roams or walks; see `src/components/piku/README.md`.

Bones: `root › hips › spine › chest › head › {jaw, quiff, glasses, eye_L, eye_R}`,
`chest › shoulder_* › upperarm_* › forearm_* › hand_*`, `hips › thigh_* ›
shin_* › foot_*`. Eyes are painted (no eye objects on this path); the eye
bones are placeholders. The jaw closes with a negative X rotation (the rest
pose is the open smile); keep it within 15°.

**Motion limits.** The mittens and sleeves are fused to the hips and torso
in the generated mesh. The rig splits the seam below the shoulder, and head,
jaw, lean, waddle and sleeve swings up to ~45° render cleanly. Raising an
arm further, or bringing the hands to the chest, still webs at the
mitten/hip contact. Either keep clips inside those limits or have a
designer detach the two mittens in Blender (a few minutes by hand, then
re-run steps 2–6).

---

## 4. Face layout

Head-local coordinates: `u` runs −1 (left edge) to +1 (right edge) across the
skull; `w` runs +1 (crown) to −1 (chin), 0 at the skull's vertical centre.

| Feature | Position |
|---|---|
| Eyes | `w ≈ 0` — the skull's **vertical centre** — at `u ≈ ±0.30` |
| Eye separation | **0.303 of head width**; sclera diameter ~0.22 of head width |
| Beak | narrow point at `w ≈ +0.11` between the eyes, widening as it drops to `w ≈ −0.46` |
| Mask lobes | rise to `w ≈ +0.55` over each eye, dipping to `w ≈ +0.11` at the centre |

> **Correction.** An earlier revision of this bible placed the eyes at 0.75–0.79
> of head height ("the eyes sit low"). That was wrong. It came from a collar
> line detected at 0.331h by a **single stray blue pixel**; the real shoulder
> line is 0.360h, which made the head too short and pushed the eyes far too far
> down. The eyes sit at the skull's vertical centre.

The beak is **narrow where it meets the face** and only widens below the eyes.
Making it wide at eye level occludes the eyes entirely — the most common way to
break the face.

Mask geometry is best modelled as **two overlapping elliptical lobes**, one per
eye, rather than a single bump curve: the overlap is what produces the narrow
black widow's peak while still letting the white climb high over each eye.

---

## 5. Render style

Soft-matte surfaces with subtle fabric weave, clean neutral studio light, no
harsh contact shadow, transparent or white background. Shading is gentle and
rounded — no hard cel edges, no rim-light rings, no gloss except the two eye
highlights and the buckle.

---

## 6. Variants

**Office Piku** is canonical — everything above describes him.

**Sunglasses Piku** is an alt-skin, not a separate character. Three of the
supplied references show a taller, unclothed, quiff-less penguin in sunglasses;
those are **off-model**. The sanctioned variant keeps canonical proportions and
full wardrobe, swapping only the clear frames for sunglasses.

---

## 7. Do / don't

**Do**
- Keep all six identity traits present and legible in every pose
- Keep beak and foot oranges distinct
- Keep the eyes low in the head
- Let props carry the story — gift, clipboard, magnifier, megaphone, parcel, mug
- Keep the open-beak smile as the default expression

**Don't**
- Give him a neck — the head meets the torso directly
- Drop the chest pocket, belt buckle, or rolled sleeves
- Drift the tie toward yellow or the shirt toward navy/teal
- Make the head a tall oval, or centre the eyes vertically
- Use the unclothed sunglasses body as a base
- Add gloss, rim lights, or hard cel shading

---

## 8. Acceptance check

Before any Piku asset ships:

1. All six identity traits present and legible.
2. Palette within tolerance of §2 — beak and feet still distinct.
3. Head-to-body ratio near 2.9 heads tall; head near-square.
4. Eyes low in the head, per §4.
5. Silhouette reads as Piku from front, three-quarter and side.

A miss means regenerate or rebuild — not patch over.

---

## 9. Piku 2.0 — shipped interaction contract

The rendered WebP stays the visual source of truth; the systems below never
recolour the artwork.

### UI tokens (globals.css `@theme`)
`--color-piku-black #111111`, `--color-piku-white #ffffff`,
`--color-piku-orange #f28c28`, `--color-piku-orange-soft #f59e0b`,
`--color-piku-yellow #ffc857`, `--color-piku-blue #2f80ed`,
`--color-piku-blue-deep #2468c7`, `--color-piku-cream #fff8e8`,
`--color-piku-surface #f5f6f7`, `--color-piku-text #171717`,
`--color-piku-muted #6b7280`, `--color-piku-success #22c55e`,
`--color-piku-warning #f59e0b`, `--color-piku-error #ef4444`.
These are interface colours (bubble, focus, chips, states, confetti) — the
character art keeps its canonical rendered palette.

### Surfaces
- Launcher: `piku-idle.webp` / `piku-still.webp` as `<img>` (never
  `next/image`, never GLB/three.js at runtime). Desktop 96×104 at 28/28;
  tablet 88×96 at 20/20; mobile 76×84 at 16/16.
- Concierge bust (`PikuFace` in `piku-modal.tsx`): black head, white face,
  round black glasses, orange beak — same character family, lightweight
  inline SVG.
- Runner: pixel-art Piku (`piku-runner/piku-art.ts`) — black/white/blue/
  orange/yellow, adjusted only where pixel readability requires.

### Behaviour pipeline
EVENT → brain (priority → cooldown → probability → session limits) →
emotion state → animation → optional 1–2 sentence dialogue → idle.
One brain (`use-piku-brain.ts`), one bus (`src/lib/events.ts`), one dialogue
library (`piku-dialogue.ts`).

- Priorities: critical (100) > high (80) > medium (60) > low (40) >
  background (20). A lower priority never interrupts a running higher one.
- Global speech cooldown ~6 s; per-entry cooldowns; greeting once per
  session (`sessionStorage` keys `piku:greeted`, `piku:welcomed`,
  `piku:interacted`).
- Idle: 2 px bob + ±1.5° lean + randomized 3–7 s blink; sleepy after 35 s
  of inactivity; wake beats surprised → happy.
- Reduced motion: still frame, no loops, no confetti/hearts; dialogue and
  function preserved.
- A11y: real `<button>` with `aria-haspopup="dialog"`/`aria-expanded`,
  focus ring on `--color-piku-blue`, bubble `role="status"` +
  `aria-live="polite"`, art `aria-hidden`, Escape/focus management in the
  concierge.

### Do not
- Speak on every event, repeat a line, or stack bubbles.
- Add a second brain/event bus, or bypass the scheduler.
- Recolour the WebP/GLB from UI tokens, or ship `.glb`/three.js at runtime.
