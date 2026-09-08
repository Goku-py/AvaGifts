# Piku — the AvaGifts penguin guide

Piku is a friendly, flat 2D penguin mascot (Duolingo-style) who floats over the site and reacts with organic, living motion. **This folder is fully modular** — it imports nothing outside itself (only `react`), so it can be developed, restyled or removed independently.

## Files

| File              | Role                                                                  |
| ----------------- | --------------------------------------------------------------------- |
| `piku.tsx`        | Root widget. Mount once near the end of `<body>`. No props. Central RAF writes `--rx/--ry/--rz/--pupil-*/--scarf-*/--shadow-*`. |
| `piku-sprite.tsx` | Flat 2D SVG sprite. Pure presentational — `emotion` drives face. Simple depth layers, solid fills, office dress (blue shirt, yellow tie, glasses). |
| `use-piku-brain.ts` | Autonomy engine: emotions, hints, wandering, sleep, organic reactions. |
| `piku.css`        | Flat 2D cascade, `@property` vars, emotion keyframes, reduced-motion safe. |
| `index.ts`        | Public exports (`Piku`, `PikuSprite`, `usePikuBrain`, types).          |

## Design

Flat, Duolingo-style penguin mascot:
- **Round black body** with large white/cream belly
- **Big expressive eyes** — white circles with dark pupils and tiny white shine dots
- **Small orange beak** — simple triangle
- **Office dress** — light blue shirt, yellow tie, black pants with belt
- **Thick black glasses** — rectangular frames
- **Small orange feet**
- **Simple curved wings** on sides

No gradients, no filters, no 3D depth — just bold flat shapes and solid fills.

## Behaviour

- **Greeting** — waves + says hello ~1.2 s after load, returns to idle after 2.6 s.
- **Click / tap / Enter / Space** — 80 ms squash (`scaleY 0.82 scaleX 1.12`) → 700 ms spring bounce → 5 heart burst (8 stars on rapid 4 clicks in 1.5 s → nervous). Random quip `happy / excited / thinking / proud`.
- **Idle life (no input needed)** — breathing period drifts 2.8–4.2 s (RAF `sin` phase drift), hip sway 0.5–0.8°, randomized blink 2.5–5.5 s with occasional double-blink, eye darts every 1–3 s ±1 px, tie tail 2-stage lag, wing ±1° breath, shadow penumbra reacts to lift.
- **Gaze** — organic delayed tracking: head `lerp 0.095`, pupils `0.18`, tie `0.04`, dampened prediction `vel*2` blended 0.7/0.3, velocity deadzone, centre deadzone 0.15, clamp `ry ±12° rx ±8°`.
- **Fast scroll** (>550 px in <400 ms + speed gate) — soft surprised (cooldown 4 s). Very fast fling → excited. Bottom 200 px → excited celebration.
- **Cursor approach** (desktop only, dot >200) — curious. Disabled on touch / <768 px.
- **Long hover 2 s** — wave. Form focus → thinking. `avagifts:open-catalog` → excited. Any `pointerdown/keydown` wakes from sleep.
- **Inactivity 35 s** — sleepy (head droop, slower breathe, Zzz). Wakes to curious.
- **Wandering** — every 32 s picks new anchor from `[{28,28},{28,172},{104,100}]` via 900 ms `cubic-bezier(0.22,1,0.36,1)` on `.piku-root` (desktop ≥768 px only).
- **Contextual hints** — `[data-piku="catalog|contact|featured|why"]` intersecting at 0.2 triggers once-per-key, 8 s cooldown.

## Adding a contextual hint

```tsx
<section data-piku="contact">…</section>
```
```ts
const HINTS = {
  contact: "Tell us what you're gifting — we reply within 48 hours.",
};
```

## Accessibility

- Real `<button>` with `aria-label`, `title`, keyboard `Enter/Space`, `focus-visible` gold outline.
- Bubble `role="status"` + `aria-live="polite"`.
- `prefers-reduced-motion: reduce` disables all animations/transitions.
- `pointer: coarse` disables gaze hover.

## Layering

`z-index: 40` — below catalog viewer overlay (`z-50`).

## Independent development

Mount `<Piku />` on any route and edit only this folder. No outside imports.
