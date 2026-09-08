import { test, expect } from '@playwright/test';

/*
 * Piku R3F (Three.js / React Three Fiber) verification.
 *
 * This suite is gated: it only runs meaningful assertions when the app is
 * served with NEXT_PUBLIC_PIKU_3D="true". When that env is absent, Piku renders
 * the volumetric SVG (covered by piku-3d.spec.ts / piku-heart.spec.ts), so we
 * skip rather than fail. To exercise the 3D path:
 *
 *   NEXT_PUBLIC_PIKU_3D="true" npm run build && npm run start
 *   npx playwright test tests/piku-r3f.spec.ts
 */
const BASE = 'http://localhost:3100';

test.describe('Piku R3F 3D path', () => {
  test('renders a WebGL canvas inside the button when 3D is enabled', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);

    const canvas = page.locator('[data-piku-canvas] canvas');
    if ((await canvas.count()) === 0) {
      test.skip(true, 'NEXT_PUBLIC_PIKU_3D not enabled — SVG path active');
      return;
    }
    await expect(canvas.first()).toBeVisible();
    console.log('✓ R3F canvas present');
  });

  test('keeps correct floating placement and a11y in 3D mode', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);

    const btn = page.locator('.piku-btn');
    if ((await page.locator('[data-piku-canvas] canvas').count()) === 0) {
      test.skip(true, 'NEXT_PUBLIC_PIKU_3D not enabled — SVG path active');
      return;
    }
    await expect(btn).toBeVisible();

    const rootInfo = await page.locator('.piku-root').evaluate((el) => {
      const cs = getComputedStyle(el as HTMLElement);
      return { position: cs.position, right: cs.right, bottom: cs.bottom, z: cs.zIndex };
    });
    expect(rootInfo.position).toBe('fixed');
    expect(rootInfo.right).toBe('28px');
    expect(rootInfo.bottom).toBe('28px');
    expect(rootInfo.z).toBe('40');
    console.log('✓ z-index 40 / right / bottom preserved in 3D mode');

    const a11y = await btn.evaluate((el) => {
      const b = el as HTMLButtonElement;
      return { tag: b.tagName, type: b.type, label: b.getAttribute('aria-label') ?? '' };
    });
    expect(a11y.tag).toBe('BUTTON');
    expect(a11y.type).toBe('button');
    expect(a11y.label.toLowerCase()).toContain('piku');
    console.log('✓ semantic button + aria-label preserved');
  });

  test('falls back to SVG when prefers-reduced-motion is enabled', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const svgCount = await page.locator('svg.piku-svg').count();
    const r3fCount = await page.locator('[data-piku-canvas] canvas').count();
    // Reduced motion must never mount the WebGL canvas.
    expect(r3fCount).toBe(0);
    // SVG fallback (with its 7 depth layers) must be present instead.
    expect(svgCount).toBeGreaterThan(0);
    console.log('✓ reduced-motion → SVG fallback, no canvas');
  });
});
