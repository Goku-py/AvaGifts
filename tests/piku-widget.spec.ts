import { test, expect } from '@playwright/test';

/*
 * The Piku launcher: a static rendered mascot, stationary.
 *
 * Replaces piku-3d.spec.ts and piku-r3f.spec.ts, which asserted a
 * React Three Fiber canvas that was never built and is no longer planned.
 * The launcher is an animated WebP rendered offline
 * (tools/piku3d/widget_render.py + widget_encode.sh) — 24 frames at 8fps,
 * 192x208 (2x of the 96x104 box). The GLB stays a source asset and nothing
 * loads three.js at runtime.
 *
 * Run against a production build on :3100:
 *   npm run build && npx next start -p 3100
 *   npx playwright test tests/piku-widget.spec.ts
 */
const BASE = 'http://localhost:3100';

test.describe('Piku widget — static rendered mascot', () => {
  test('pinned bottom-right at z-index 40, 96x104 desktop / 76x84 mobile', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const root = page.locator('.piku-root');
    await expect(root).toBeVisible();

    const desktop = await root.evaluate((el) => {
      const cs = getComputedStyle(el as HTMLElement);
      return { position: cs.position, right: cs.right, bottom: cs.bottom, zIndex: cs.zIndex, width: cs.width, height: cs.height };
    });
    expect(desktop).toEqual({
      position: 'fixed',
      right: '28px',
      bottom: '28px',
      zIndex: '40',
      width: '96px',
      height: '104px',
    });

    await page.setViewportSize({ width: 375, height: 800 });
    await page.waitForTimeout(200);
    const mobile = await root.evaluate((el) => {
      const cs = getComputedStyle(el as HTMLElement);
      return { width: cs.width, height: cs.height };
    });
    expect(mobile).toEqual({ width: '76px', height: '84px' });
  });

  test('renders the animated loop, and never the GLB or three.js', async ({ page }) => {
    const requested: string[] = [];
    page.on('request', (r) => requested.push(r.url()));

    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const img = page.locator('.piku-btn img.piku-img');
    await expect(img).toBeVisible();

    // Animated loop: 2x render of the 96x104 box.
    const src = await img.evaluate((el) => (el as HTMLImageElement).currentSrc);
    expect(src).toContain('piku-idle.webp');
    const size = await img.evaluate((el) => {
      const img = el as HTMLImageElement;
      return { w: img.naturalWidth, h: img.naturalHeight };
    });
    expect(size).toEqual({ w: 192, h: 208 });

    // The GLB stays a source asset — nothing loads it or three.js at runtime.
    expect(requested.filter((u) => u.endsWith('.glb'))).toEqual([]);
    expect(requested.filter((u) => /three/i.test(u))).toEqual([]);
  });

  test('stays put while idle — no wandering, no roaming', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const root = page.locator('.piku-root');
    const start = await root.boundingBox();
    // Roaming used to arm after 9s of inactivity; wait past that.
    await page.waitForTimeout(10_500);
    const end = await root.boundingBox();
    expect(end).toEqual(start);

    const classes = await page.locator('.piku-root, .piku-btn').evaluateAll((els) => els.map((e) => e.className).join(' '));
    expect(classes).not.toMatch(/piku--(walking|roaming|waking|stowed)/);
  });

  test('reduced motion gets the still frame', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const img = page.locator('.piku-btn img.piku-img');
    await expect(img).toBeVisible();
    const src = await img.evaluate((el) => (el as HTMLImageElement).currentSrc);
    expect(src).toContain('piku-still.webp');
  });

  test('renders with no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await expect(page.locator('.piku-btn')).toBeVisible();
    expect(errors).toEqual([]);
  });
});
