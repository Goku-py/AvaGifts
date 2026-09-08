# AvaGifts — Corporate gifting, curated

A production-ready corporate gifting website built with **Next.js 16 + React 19 + TypeScript + Tailwind CSS v4**. Premium minimalist design, a realistic flipbook catalog viewer, and **Piku** — an interactive penguin guide mascot.

## Quick start

```bash
npm install
npm run dev        # development → http://localhost:3000
```

Production:

```bash
npm run build
npm run start      # → http://localhost:3000  (add "-- -p 3100" for another port)
```

Type-check and visual QA (optional, uses Playwright):

```bash
npx tsc --noEmit
node tools/visual-verify.mjs   # screenshots → _reference/screenshots/
```

## Drop in your real brand assets

All brand assets are **placeholders with production-ready filenames** — replace them 1:1, no code changes needed:

| Asset | File | Notes |
| --- | --- | --- |
| Logo (colour) | `public/brand/logo.svg` | Used in header/footer via `<Logo />` (`src/components/ui/logo.tsx`) |
| Logo (mono) | `public/brand/logo-mono.svg` | Footer on dark band |
| Favicon | `src/app/icon.svg` | Replace with a 32×32-friendly mark |
| Catalog PDF | `public/catalog/avagifts-catalog.pdf` | Any page count works; the viewer auto-detects pages + aspect ratio |

The sample catalog PDF can be regenerated from `tools/catalog-source.html` if needed.

## Project structure

```
src/
├── app/                    # App Router: layout, page, /api/enquiry
├── components/
│   ├── sections/           # Hero, Categories, Featured, CatalogCTA, Why,
│   │                       # Services, About, Contact
│   ├── layout/             # Header (sticky), Footer
│   ├── ui/                 # Button, Section, Eyebrow, Reveal, ProductArt, …
│   ├── catalog/            # Flipbook viewer + context (lazy-loaded)
│   └── piku/               # 🐧 Mascot — fully modular, see its README
├── lib/                    # data.ts (site content), utils, enquiry schema
public/
├── brand/                  # logo.svg, logo-mono.svg
└── catalog/                # avagifts-catalog.pdf
```

## Key features

- **Flipbook catalog** — pdf.js rasterises pages → StPageFlip renders a realistic page-turn book with zoom, fullscreen, keyboard nav, single-page mode on mobile, and a PDF download fallback. Libraries load lazily on first open.
- **Piku mascot** — waves on load, reacts to clicks / fast scroll / inactivity, wanders on desktop, and surfaces contextual hints for any element carrying a `data-piku="<key>"` attribute. Fully self-contained in `src/components/piku/` (independent development supported; reduced-motion safe).
- **Enquiry form** — zod-validated inline, POSTs to `/api/enquiry` (currently simulates success — wire your email/CRM provider in `src/app/api/enquiry/route.ts`).
- **Accessibility** — semantic landmarks, skip link, labelled sections, keyboard-operable everything, `prefers-reduced-motion` respected throughout.

## Editing site content

All copy, categories, featured products, stats and process steps live in **`src/lib/data.ts`** — edit there rather than in section components.
