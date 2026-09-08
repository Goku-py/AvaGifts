# Catalog (Lane 3)

This folder hosts the AvaGifts flipbook catalog viewer.

**Already in place (Lane 1):**

- `catalog-context.tsx` — `CatalogProvider` + `useCatalog()` exposing
  `isOpen` / `openCatalog()` / `closeCatalog()`. The provider is mounted in
  `src/app/layout.tsx` around the whole app.
- `catalog-button.tsx` — `CatalogButton`, wired to `openCatalog()` and tagged
  with `data-catalog-trigger` (used in the header, hero and catalog CTA).

**Lane 3 TODO:**

1. Build the flipbook `CatalogViewer` component in this folder.
2. Render it (portal/modal) from `CatalogProvider` when `isOpen` is true —
   see the marked comment inside `catalog-context.tsx`.
3. The source PDF lives at `public/catalog/avagifts-catalog.pdf`
   (drop it into `public/catalog/`).
