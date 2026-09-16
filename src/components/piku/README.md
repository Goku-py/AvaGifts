# Piku — the AvadheshCo chat launcher

Piku is the floating chat assistant in the bottom-right corner. He is a
**rendered image, and he never walks**: the motion is the breath baked into
the image plus a CSS idle bob and a JS-scheduled blink, the speech bubble, and
a puff of hearts when he is clicked. Clicking him opens the gifting concierge
beside him.

## Files

| File | Role |
| --- | --- |
| `piku.tsx` | The launcher. Mount once near the end of `<body>`, inside `PikuConciergeProvider`. No props. Renders the animated WebP via `<picture>` (still frame for reduced motion). Plain `img`, not `next/image` — the optimiser would re-encode the animated WebP and drop frames. |
| `use-piku-brain.ts` | Brain 2.0 behavior system: priority tiers, per-entry + global (~6s) speech cooldowns, session limits, greeting/welcome-back guards, click cadence, hover wave, cursor glance, scroll hints, sleepy/wake beats. No movement. |
| `piku.css` | Launcher, bubble, invite pill and heart burst, plus the `PikuSprite` styles. Wrapper-only motion hooks (idle bob, emotion hops) target the inner wrappers; `.piku-root` never transforms. |
| `piku-sprite.tsx` | The flat SVG Piku. Not used by the launcher; still used by the mini-game. |
| `index.ts` | Public exports (`Piku`, `PikuSprite`, `usePikuBrain`, types). |
| `PIKU-BIBLE.md` | Character bible: palette, proportions, the 3D pipeline. |

## The launcher art

```
src/components/piku/piku.tsx           <picture> loop + still
public/brand/piku/piku-idle.webp       24-frame breathing loop, 8fps, 192x208 (~128 KB)
public/brand/piku/piku-still.webp      frame 0 for prefers-reduced-motion (~7 KB)
public/brand/piku/piku.glb             source model — never loaded at runtime
```

The game and the concierge modal keep their previous art untouched
(`PikuSprite` / modal face + still).

## Behaviour

- **Position** — fixed at `right: 28px; bottom: 28px`, `z-index: 40`, 96x104
  (88x96 at 768–1023px, 76x84 below 768px). He does not wander, roam or walk.
- **Greeting** — a bubble ~1.2s after load, to Piku's left.
- **Click / Enter / Space** — opens the concierge and plays 5 hearts. A second
  click closes it. `aria-expanded` reflects the state.
- **While the panel is open** — Piku stays visible beside it; the bubble and the
  "Chat with Piku" hover pill are hidden, because both hang exactly where the
  panel sits.
- **Contextual hints** — `[data-piku="catalog|contact|featured|why"]` scrolling
  into view shows a hint once per key, with an 8s cooldown.
- **Inactivity 35s** — goes sleepy; the next input wakes him. This only changes
  which quip he says next, not how he looks.

## The concierge panel

`src/components/piku-concierge/piku-modal.tsx`.

- **From 640px up** — a non-modal floating panel anchored bottom-right, to
  Piku's left (`right: 140px` = his 28px inset + 96px box + 16px gap), bottom
  aligned with him, 400px wide. No dimming, no scroll lock, no focus trap. It
  closes on Escape, the X, a click elsewhere on the page, or a click on Piku.
- **Below 640px** — a modal full-screen sheet with a dimmed backdrop, scroll
  lock and a Tab trap.

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

- A real `<button>` with `aria-label`, `aria-haspopup="dialog"`,
  `aria-expanded`, and a `focus-visible` outline.
- The bubble is `role="status"` + `aria-live="polite"`.
- The cartoon art is the animated WebP; `prefers-reduced-motion: reduce`
  swaps in the still frame via `<picture>`.
- Keyboard: Enter/Space on the button opens the panel; focus moves into it.

## Layering

`z-index: 40` for Piku, `z-[95]` for the concierge panel.

## Tests

`tests/piku-widget.spec.ts` (placement, asset, stillness, reduced motion) and
`tests/piku-heart.spec.ts` (greeting, burst, panel position and closing). Both
expect a production build on `:3100`:

```sh
npm run build && npx next start -p 3100
npx playwright test tests/piku-widget.spec.ts tests/piku-heart.spec.ts
```
