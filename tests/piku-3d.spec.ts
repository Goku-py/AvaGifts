import { test, expect } from '@playwright/test';

const BASE = 'http://localhost:3100';

test.describe('Piku 3D (R3F) Verification', () => {
  test('R3F canvas renders at z-index 40 with correct placement', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1000);

    const root = page.locator('.piku-root');
    const btn = page.locator('.piku-btn');
    await expect(root).toBeVisible();
    await expect(btn).toBeVisible();
    console.log('✓ .piku-root and .piku-btn visible');

    const styles = await root.evaluate((el) => {
      const cs = getComputedStyle(el as HTMLElement);
      return {
        right: cs.right,
        bottom: cs.bottom,
        zIndex: cs.zIndex,
        perspective: cs.perspective,
        width: cs.width,
        height: cs.height,
        position: cs.position,
        transition: cs.transition,
        hasData3d: (el as HTMLElement).hasAttribute('data-3d'),
      };
    });
    console.log(
      `desktop .piku-root right=${styles.right} bottom=${styles.bottom} z=${styles.zIndex} perspective=${styles.perspective} size=${styles.width}x${styles.height} data-3d=${styles.hasData3d}`,
    );
    expect(styles.position).toBe('fixed');
    expect(styles.right).toBe('28px');
    expect(styles.bottom).toBe('28px');
    expect(styles.zIndex).toBe('40');
    expect(styles.width).toBe('96px');
    expect(styles.height).toBe('104px');
    expect(styles.transition).toContain('right');
    expect(styles.transition).toContain('900ms');
    // 3D mode disables the double CSS perspective
    expect(styles.perspective).toBe('none');
    expect(styles.hasData3d).toBe(true);

    // canvas must be present and visible in 3D default
    const canvas = page.locator('[data-piku-canvas] canvas');
    await expect(canvas).toBeVisible();
    console.log('✓ R3F <canvas> present inside [data-piku-canvas]');

    // mobile toggle keeps same anchor contract, smaller size
    await page.setViewportSize({ width: 375, height: 800 });
    await page.waitForTimeout(400);
    const mobile = await root.evaluate((el) => {
      const cs = getComputedStyle(el as HTMLElement);
      return { width: cs.width, height: cs.height };
    });
    console.log(`mobile .piku-root size=${mobile.width}x${mobile.height}`);
    expect(mobile.width).toBe('76px');
    expect(mobile.height).toBe('84px');
    console.log('✓ z-index placement + R3F canvas correct desktop + mobile');
  });

  test('Click squash → bounce → heart burst sequence (DOM)', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);

    const btn = page.locator('.piku-btn');
    await expect(btn).toBeVisible();

    await btn.click();
    console.log('clicked Piku');

    // squash within ~50ms
    await page.waitForTimeout(35);
    const hasSquash = await btn.evaluate((el) => el.classList.contains('piku-squashing'));
    console.log(`35ms hasSquash=${hasSquash}`);
    expect(hasSquash).toBe(true);

    // volume-preservation rule exists in stylesheet
    const hasVolumeRule = await page.evaluate(() => {
      for (const sheet of Array.from(document.styleSheets)) {
        try {
          for (const r of Array.from(sheet.cssRules)) {
            const txt = (r as CSSStyleRule).cssText || '';
            if (txt.includes('.piku-squashing') && txt.includes('scaleY(0.82') && txt.includes('scaleX(1.12')) return true;
          }
        } catch {}
      }
      return false;
    });
    console.log(`volume rule scaleY 0.82 / scaleX 1.12 exists=${hasVolumeRule}`);
    expect(hasVolumeRule).toBe(true);

    await page.waitForTimeout(150);
    const hasBounce = await btn.evaluate((el) => el.classList.contains('piku-bouncing'));
    console.log(`~185ms hasBounce=${hasBounce}`);
    expect(hasBounce).toBe(true);

    // heart burst appears after squash 80 + bounce 700
    let heartCount = 0;
    for (let i = 0; i < 12; i++) {
      await page.waitForTimeout(100);
      heartCount = await page.locator('.piku-heart-burst').count();
      if (heartCount === 5) break;
    }
    console.log(`heart count after burst=${heartCount}`);
    expect(heartCount).toBe(5);

    const burstsOk = await page.evaluate(() => {
      return Array.from(document.querySelectorAll<HTMLElement>('.piku-heart-burst')).map((el) => ({
        x: getComputedStyle(el).getPropertyValue('--burst-x').trim(),
        y: getComputedStyle(el).getPropertyValue('--burst-y').trim(),
        r: getComputedStyle(el).getPropertyValue('--burst-r').trim(),
        anim: getComputedStyle(el).animationName,
      }));
    });
    for (const b of burstsOk) {
      expect(b.x).toContain('px');
      expect(b.y).toContain('px');
      expect(b.r).toContain('deg');
      expect(b.anim).toContain('piku-burst');
    }

    const bubble = page.locator('.piku-bubble');
    await expect(bubble).toBeVisible({ timeout: 2000 });
    const bubbleText = await bubble.textContent();
    console.log(`bubble after click="${bubbleText}"`);
    expect((bubbleText ?? '').length).toBeGreaterThan(5);

    await page.waitForTimeout(1100);
    const after = await page.locator('.piku-heart-burst').count();
    console.log(`heart count after cleanup=${after}`);
    expect(after).toBe(0);
    console.log('✓ squash 80ms → bounce 700ms → burst 900ms (DOM) verified');
  });

  test('Rapid 4 clicks → star burst', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1200);

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

    const starOk = await page.evaluate(() => {
      return Array.from(document.querySelectorAll<HTMLElement>('.piku-star-burst')).map((el) => ({
        anim: getComputedStyle(el).animationName,
      }));
    });
    for (const s of starOk) expect(s.anim).toContain('piku-burst');
    console.log('✓ rapid 4 clicks → 8 star bursts');
  });

  test('Hover lift + glow on hover-capable device', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(900);

    const btn = page.locator('.piku-btn');
    await expect(btn).toBeVisible();

    await btn.hover();
    await page.waitForTimeout(320);
    const hasHovering = await btn.evaluate((el) => el.classList.contains('piku-hovering'));
    console.log(`after hover hasHovering=${hasHovering}`);
    expect(hasHovering).toBe(true);

    const afterFilter = await btn.evaluate((el) => getComputedStyle(el as HTMLElement).filter);
    const isHoverCapable = await page.evaluate(() => window.matchMedia('(hover: hover) and (pointer: fine)').matches);
    console.log(`after hover filter=${afterFilter} isHoverCapable=${isHoverCapable}`);
    if (isHoverCapable) expect(afterFilter).toContain('drop-shadow');

    await page.mouse.move(0, 0);
    await page.waitForTimeout(350);
    const afterLeave = await btn.evaluate((el) => el.classList.contains('piku-hovering'));
    console.log(`after leave hasHovering=${afterLeave}`);
    expect(afterLeave).toBe(false);
    console.log('✓ hover lifts + glow toggles correctly');
  });

  test('Greeting bubble appears shortly after load', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const bubble = page.locator('.piku-bubble');
    let greeting = '';
    for (let i = 0; i < 16; i++) {
      await page.waitForTimeout(200);
      const t = (await bubble.textContent().catch(() => null)) ?? '';
      if (t.includes("Hi, I'm Piku")) {
        greeting = t;
        break;
      }
    }
    console.log(`greeting="${greeting.slice(0, 50)}"`);
    expect(greeting).toContain("Hi, I'm Piku");
    console.log('✓ greeting bubble shown on load');
  });

  test('Autonomous roaming/walking after idle inactivity', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const btn = page.locator('.piku-btn');
    let roaming = false;
    for (let i = 0; i < 28; i++) {
      await page.waitForTimeout(500);
      const cls = await btn.evaluate((el) => el.className);
      if (cls.includes('piku--roaming') || cls.includes('piku--walking')) {
        roaming = true;
        console.log(`roaming/walking detected at ~${(i + 1) * 500}ms class="${cls}"`);
        break;
      }
    }
    expect(roaming).toBe(true);
    console.log('✓ Piku begins roaming/walking autonomously when idle');
  });

  test('Reduced-motion falls back to SVG sprite (fallback sanity)', async ({ page }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(900);

    const svg = page.locator('svg.piku-svg');
    await expect(svg).toBeVisible();
    expect(await svg.getAttribute('viewBox')).toBe('0 0 120 130');

    const layers = await page.locator('.piku-depth-layer').count();
    console.log(`fallback depth layers=${layers}`);
    expect(layers).toBe(7);

    const canvasCount = await page.locator('[data-piku-canvas] canvas').count();
    expect(canvasCount).toBe(0);
    console.log('✓ reduced-motion → SVG sprite fallback, no canvas');

    await page.emulateMedia({ reducedMotion: 'no-preference' });
  });
});
