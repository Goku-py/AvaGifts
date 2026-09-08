import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3100';

const GREETING = "Hi, I'm Piku";

test.describe('Piku Heart Burst, Greeting & A11y (3D default)', () => {
  test('Greeting bubble appears on load', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const bubble = page.locator('.piku-bubble');
    let greeting = '';
    for (let i = 0; i < 16; i++) {
      await page.waitForTimeout(200);
      const t = (await bubble.textContent().catch(() => null)) ?? '';
      if (t.includes(GREETING)) {
        greeting = t;
        break;
      }
    }
    console.log(`greeting="${greeting.slice(0, 60)}"`);
    expect(greeting).toContain(GREETING);
    console.log('✓ greeting bubble shown shortly after load');
  });

  test('Heart bursts on click + bubble + auto removal', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const btn = page.locator('.piku-btn');
    await expect(btn).toBeVisible();
    expect(await page.locator('.piku-heart-burst').count()).toBe(0);

    await btn.click();
    console.log('clicked');

    let heartCount = 0;
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(100);
      heartCount = await page.locator('.piku-heart-burst').count();
      if (heartCount === 5) break;
    }
    expect(heartCount).toBe(5);
    console.log('✓ 5 heart bursts present');

    const bubble = page.locator('.piku-bubble');
    await expect(bubble).toBeVisible({ timeout: 2000 });
    await expect(bubble).toHaveAttribute('role', 'status');
    await expect(bubble).toHaveAttribute('aria-live', 'polite');
    const bubbleText = await bubble.textContent();
    console.log(`bubble after click="${bubbleText}"`);
    expect((bubbleText ?? '').length).toBeGreaterThan(5);

    await page.waitForTimeout(1200);
    expect(await page.locator('.piku-heart-burst').count()).toBe(0);
    console.log('✓ heart burst + bubble + removal verified');
  });

  test('Rapid 4 clicks triggers star burst', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const btn = page.locator('.piku-btn');
    await expect(btn).toBeVisible();
    for (let i = 0; i < 4; i++) {
      await btn.click({ force: true });
      await page.waitForTimeout(180);
    }
    console.log('4 rapid clicks');

    let starCount = 0;
    for (let i = 0; i < 15; i++) {
      await page.waitForTimeout(100);
      starCount = await page.locator('.piku-star-burst').count();
      if (starCount === 8) break;
    }
    console.log(`star count=${starCount}`);
    expect(starCount).toBe(8);

    const bubble = page.locator('.piku-bubble');
    const bubbleText = await bubble.textContent();
    console.log(`nervous bubble="${bubbleText}"`);
    expect((bubbleText ?? '').length).toBeGreaterThan(5);
    console.log('✓ rapid 4 clicks → 8 stars + reaction bubble');
  });

  test('Click produces a friendly reaction (emotion bubble)', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const btn = page.locator('.piku-btn');
    await btn.click();
    await page.waitForTimeout(400);

    const bubble = page.locator('.piku-bubble');
    const bubbleText = (await bubble.textContent().catch(() => null)) ?? '';
    console.log(`reaction bubble="${bubbleText.slice(0, 60)}"`);
    // A reaction must be communicated (text), independent of 3D vs SVG rendering
    expect(bubbleText.length).toBeGreaterThan(5);
    console.log('✓ interaction produces a friendly reaction bubble');
  });

  test('Accessibility: semantic button and keyboard', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);

    const btn = page.locator('.piku-btn');
    await expect(btn).toBeVisible();

    const aria = await btn.getAttribute('aria-label');
    console.log(`aria-label="${aria}"`);
    expect(aria).toContain('Piku');
    expect(aria).toContain('gifting');
    expect(await btn.getAttribute('type')).toBe('button');

    // bubble exists with live-region semantics
    const bubble = page.locator('.piku-bubble');
    await expect(bubble).toBeVisible({ timeout: 3000 });
    expect(await bubble.getAttribute('role')).toBe('status');
    expect(await bubble.getAttribute('aria-live')).toBe('polite');

    // keyboard: Tab until Piku focused, then Enter triggers a burst
    for (let i = 0; i < 12; i++) {
      const isPiku = await page.evaluate(() => document.activeElement?.classList.contains('piku-btn'));
      if (isPiku) break;
      await page.keyboard.press('Tab');
      await page.waitForTimeout(120);
    }
    const focusedPiku = await page.evaluate(() => document.activeElement?.classList.contains('piku-btn'));
    console.log(`focusedPiku=${focusedPiku}`);
    expect(focusedPiku).toBe(true);

    const outlineWidth = await btn.evaluate((el) => getComputedStyle(el).outlineWidth);
    console.log(`focus-visible outline width=${outlineWidth}`);
    expect(outlineWidth).not.toBe('0px');

    await page.keyboard.press('Enter');
    let burst = 0;
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(100);
      burst = await page.locator('.piku-heart-burst, .piku-star-burst').count();
      if (burst > 0) break;
    }
    console.log(`burst after Enter=${burst}`);
    expect(burst).toBeGreaterThan(0);
    console.log('✓ a11y: semantic button, live status, keyboard focus + Enter burst');
  });

  test('Public API: Piku renders as 3D companion with no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (msg) => {
      if (msg.type() === 'error') errors.push(msg.text());
    });
    page.on('pageerror', (err) => errors.push(String(err)));

    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);

    const btn = page.locator('.piku-btn');
    await expect(btn).toBeVisible();
    await expect(page.locator('[data-piku-canvas] canvas')).toBeVisible();
    await expect(btn).toHaveClass(/piku-tracking/);
    console.log('✓ .piku-btn contains R3F canvas + piku-tracking');

    console.log(`console errors=${errors.length} ${errors.slice(0, 2).join('; ')}`);
    expect(errors.length).toBe(0);
    console.log('✓ public API compatibility (3D) with no console errors');
  });
});
