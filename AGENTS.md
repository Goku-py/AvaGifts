<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# AvaGifts — Agent Guide

Corporate gifting site. Next.js `16.3.3` + React `19.2.8` + TypeScript + Tailwind CSS v4. Single landing page with flipbook catalog, Piku mascot, concierge modal, enquiry API.

## Commands

```bash
npm install
npm run dev        # → http://localhost:3000
npm run build
npm run start      # → http://localhost:3000 (add "-- -p 3100" for another port)
npx tsc --noEmit
node tools/visual-verify.mjs   # Playwright a11y + screenshots → _reference/screenshots/ (expects :3100)
npx eslint .                    # ignores: .next, out, build, next-env.d.ts, public/pdf, tools
```

Tests (expect built app on `:3100` — `npm run build` then `next start -p 3100`):

```bash
npx playwright test             # tests/*.spec.ts
```

## Structure

```
src/app/                  # layout.tsx (providers+shell), page.tsx (section order), globals.css, icon.svg, api/enquiry/route.ts
src/components/sections/  # Hero, Trusted, GiftDiscoveries, WhyAvadheshCo, HowWeExecute, PikuRunnerBand,
                          # AvaAssurance, GiftingBanner, GiftingJournal, FinalConversion (one named export each)
src/components/layout/    # Header (sticky), Footer
src/components/ui/        # button.tsx (Button/ButtonLink), section.tsx (Section tone), reveal.tsx (Reveal/MotionDefaults), logo.tsx
src/components/catalog/   # catalog-context.tsx (CatalogProvider/useCatalog, dynamic ssr:false), catalog-viewer.tsx, catalog-button.tsx
src/components/piku/      # Piku mascot: piku.tsx, piku-sprite.tsx, use-piku-brain.ts, piku.css (+README, PIKU-BIBLE.md)
src/components/piku-concierge/  # piku-concierge-context.tsx, piku-modal.tsx (multi-step form), piku-concierge.css
src/components/piku-game/       # piku-game-context.tsx, piku-game.tsx, piku-game.css
src/components/piku-runner/     # Piku Runner band + engine: PikuRunner.tsx, PikuRunnerCanvas.tsx, game.ts, tuning.ts, sprites.ts, piku-art.ts, piku-runner.css
src/lib/                  # data.ts, enquiry.ts, lead-time.ts, events.ts, motion.ts, piku-concierge.ts, piku-glance.ts, utils.ts
public/design/            # committed optimized imagery (hero slides 616x721, discovery/why/step/assurance/client/journal)
public/brand/             # logo.svg, logo-mono.svg, piku/{piku.glb,piku-still.webp,piku-idle.webp}
public/catalog/           # avagifts-catalog.pdf (any page count; viewer auto-detects)
public/pdf/               # vendored pdf.js worker (eslint-ignored, do not lint/edit)
public/models/            # piku_tripo.glb (unused by widget path)
tools/                    # visual-verify.mjs, serve.cjs (:3200 static server), catalog-source.html (A4 print source), piku3d/ (Blender headless pipeline)
tests/                    # date-validation, piku-widget, piku-runner, piku-heart specs
```

`src/Design src/` is gitignored raw Figma hand-off — never import from it. Path alias: `@/*` → `./src/*`.

## Rules

- **Content lives in `src/lib/data.ts`.** Edit copy, nav, categories, products, stats, steps, journal, footer there — not in section components. `page.tsx` defines section order; don't reorder without asking.
- **Styling is Tailwind v4 tokens in `src/app/globals.css`.** Use `@theme` names (`primary`, `interactive`, `accent`, `surface`, `paper`, `ink`, `line`, `cream`, `card`, `gold` …), never hardcode hex in tsx. `Section` `tone` sets `data-tone`; focus rings adapt to it. Merge classes with `cn()` from `@/lib/utils` (has font-size tailwind-merge group so `text-h2`-style classes survive). Per-feature CSS (`piku*.css`, `piku-runner.css`) stays next to its component.
- **Motion via `@/lib/motion` + `Reveal`.** Use exported `EASE`, `REVEAL_DURATION`, `STAGGER`, `SPRING_*`. Respect `prefers-reduced-motion` (see Piku + Reveal).
- **Enquiry validation is shared zod in `src/lib/enquiry.ts`.** Only `name`/`email` required; `deliveryDate` refines through `isDeliveryDateValid` (`MIN_LEAD_DAYS = 7`). Client uses `fieldErrorsFrom`; `POST /api/enquiry` re-validates with `safeParse` and returns field errors on 400. Currently simulates success (`~600ms`) — wire email/CRM in `src/app/api/enquiry/route.ts`. It is the single ingestion point.
- **Dates in `src/lib/lead-time.ts`.** Parse `YYYY-MM-DD` as local calendar (never `new Date(iso)`), reject rollover (Feb 30), do arithmetic with `setDate` (DST-safe), format `en-IN` with raw fallback.
- **Cross-component comms = window `CustomEvent` bus in `src/lib/events.ts`.** `OPEN/CLOSE_CATALOG_EVENT`, `PIKU_*` (glance, celebrate, enquiry-sent, concierge-closed, game opened/started/completed/exited). No analytics SDK — events are analytics-ready. Helpers: `glanceAt`/`endGlance`/`glanceHandlers` in `src/lib/piku-glance.ts`; `data-piku="<key>"` attributes surface contextual hints.
- **Catalog is lazy.** `catalog-context.tsx` loads `catalog-viewer.tsx` via `next/dynamic ssr:false`; viewer lazily imports `page-flip` + `pdfjs-dist` on first open only. PDF URL: `/catalog/avagifts-catalog.pdf`; worker is vendored at `public/pdf/pdf.worker.min.mjs`. Keep heavy deps out of the initial bundle.
- **Piku widget is static WebP, not 3D.** `piku-idle.webp`/`piku-still.webp` render the loop; never fetch `.glb`/`three.js` at runtime (`piku-widget.spec.ts` enforces this). Runner game is 2D canvas (`PikuGame`, 60Hz, `window.__pikuRunner` test hook, best score in `piku_runner_hi` + sound pref in `piku_runner_sound` localStorage keys — legacy `piku-runner-best` is migrated on first read; the run has generative WebAudio ambience — no audio file, no license — that starts with the run, fades out on crash, follows the sound preference and is released with the AudioContext; offline play via `public/sw.js` + `src/components/layout/service-worker-registrar.tsx`). Concierge WhatsApp number in `src/lib/piku-concierge.ts` is placeholder `9198XXXXXXX` — don't ship real number without confirmation.
- **Images:** `next.config.ts` allows only `images.unsplash.com` remote; prefer `public/design/`. Brand swap is 1:1 by filename (`public/brand/logo*.svg`, `src/app/icon.svg`, `public/catalog/avagifts-catalog.pdf`) — no code change needed. Regenerate sample catalog from `tools/catalog-source.html` (+ `tools/serve.cjs`).
- **A11y is tested.** Semantic landmarks, skip link `#main`, single `h1`, heading order, labelled sections, keyboard-operable viewer/modal/game, named buttons/links, `alt` text. `tools/visual-verify.mjs` audits h-overflow, img alt, h1 uniqueness/order, landmarks. Hero slide `category` must match visible `badge` (a11y rule in `data.ts`).
- **Tests pin behavior:** 7-day lead (`date-validation`), no-GLB widget (`piku-widget`), runner physics/persistence (`piku-runner`), greeting + heart burst (`piku-heart`). Update specs when changing those behaviors.
