@AGENTS.md

# Claude notes (supplement — AGENTS.md is source of truth)

- This file exists because `next dev` manages `AGENTS.md`'s header block; keep `@AGENTS.md` as line 1 so both stay in sync. Put Claude-only notes below, never duplicate project rules.
- Permissions live in `.claude/settings.json` (+ local overrides in `.claude/settings.local.json`): eslint via `node node_modules/eslint/bin/eslint.js`, type-check via `npx tsc`, tests via `node node_modules/@playwright/test/cli.js`, `npm run *`, `npm install *`. Prefer those exact binaries over bare `npx eslint` / `npx playwright` so you stay inside the allowlist.
- Figma MCP is allowlisted (`get_design_context`, `get_metadata`, `get_screenshot`, `get_figma_skill`): pull tokens/specs from Figma, but commit only to `public/design/` — `src/Design src/` is gitignored raw hand-off, never import from it.
- Windows PowerShell workspace (`D:\…\AvaGift copy` — note the space; quote paths). Port `3100` is the test/verify port (`next start -p 3100`, `visual-verify.mjs`, `tests/*.spec.ts`); dev stays on `3000`.
- Enquiry + WhatsApp handoff: `POST /api/enquiry` only simulates success — ask before wiring a real provider/number (`PIKU_WHATSAPP_NUMBER` in `src/lib/piku-concierge.ts` is a placeholder).
