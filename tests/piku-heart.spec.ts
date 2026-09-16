import { test, expect, type Page } from '@playwright/test';

/*
 * Piku as a floating chat assistant: greeting, click feedback, and the
 * concierge panel that opens beside him.
 *
 * Run against a production build on :3100:
 *   npm run build && npx next start -p 3100
 *   npx playwright test tests/piku-heart.spec.ts
 */
const BASE = 'http://localhost:3100';

/** One of the greeting lines in piku-dialogue.ts (picked at random per session). */
const GREETING = /Hey! 👋|Hi there!|Looking for a gift\?/;

async function openPanel(page: Page) {
  // Piku's idle bob is an intentional infinite animation, so real mouse
  // clicks trip Playwright's "element is stable" check under load. Dispatch
  // the click through the DOM instead — the same handler still runs.
  await tapPiku(page);
  const dialog = page.getByRole('dialog');
  await expect(dialog).toBeVisible();
  // let the entry spring settle before measuring
  await page.waitForTimeout(700);
  return dialog;
}

/** Clicks Piku through the DOM (no pointer-hover side-effects). */
async function tapPiku(page: Page) {
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>('.piku-btn')?.click();
  });
}

/** Waits until Piku wears the given emotion class (`piku--happy`, …). */
async function expectEmotion(page: Page, emotion: string, timeout = 3000) {
  await page.waitForFunction(
    (name) => document.querySelector('.piku-root')?.className.includes(`piku--${name}`),
    emotion,
    { timeout },
  );
}

test.describe('Piku greeting, click feedback & floating panel', () => {
  test('greeting bubble appears on load, to Piku’s left', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const bubble = page.locator('.piku-bubble');
    await expect(bubble).toContainText(GREETING, { timeout: 4000 });
    await expect(bubble).toHaveAttribute('role', 'status');
    await expect(bubble).toHaveAttribute('aria-live', 'polite');

    const b = await bubble.boundingBox();
    const p = await page.locator('.piku-root').boundingBox();
    expect(b!.x + b!.width).toBeLessThanOrEqual(p!.x);
  });

  test('click opens the panel with a heart burst that cleans up', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    expect(await page.locator('.piku-heart-burst').count()).toBe(0);
    await tapPiku(page);

    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(page.locator('.piku-heart-burst')).toHaveCount(5);
    const anims = await page
      .locator('.piku-heart-burst')
      .evaluateAll((els) => els.map((el) => getComputedStyle(el).animationName));
    for (const a of anims) expect(a).toContain('piku-burst');

    await expect(page.locator('.piku-heart-burst')).toHaveCount(0, { timeout: 2000 });
  });

  test('desktop: panel floats to Piku’s left, bottom-aligned, non-modal', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const dialog = await openPanel(page);
    const root = page.locator('.piku-root');
    const d = (await dialog.boundingBox())!;
    const p = (await root.boundingBox())!;

    console.log(`panel x=${Math.round(d.x)}..${Math.round(d.x + d.width)} piku x=${Math.round(p.x)}`);
    // beside Piku, not centred
    expect(d.x + d.width).toBeLessThanOrEqual(p.x + 1);
    expect(d.x + d.width / 2).toBeGreaterThan(1440 * 0.6);
    // bottom edges line up
    expect(Math.abs(d.y + d.height - (p.y + p.height))).toBeLessThanOrEqual(2);

    // Piku stays visible and reports the open state
    await expect(root).toBeVisible();
    await expect(page.locator('.piku-btn')).toHaveAttribute('aria-expanded', 'true');
    // the bubble would sit under the panel, so it is hidden while open
    await expect(page.locator('.piku-bubble')).toHaveCount(0);

    // a floating assistant, not a modal: no scroll lock, page still reachable
    await expect(dialog).toHaveAttribute('aria-modal', 'false');
    expect(await page.evaluate(() => document.body.style.overflow)).not.toBe('hidden');
    const behind = await page.evaluate(() => {
      const el = document.elementFromPoint(200, 200);
      return el ? getComputedStyle(el).pointerEvents : 'none';
    });
    expect(behind).not.toBe('none');
  });

  test('desktop: Escape, the X, a click outside and a second click on Piku all close it', async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    const dialog = page.getByRole('dialog');

    await openPanel(page);
    await page.keyboard.press('Escape');
    await expect(dialog).toBeHidden();

    await openPanel(page);
    await page.getByRole('button', { name: 'Close chat with Piku' }).click();
    await expect(dialog).toBeHidden();

    await openPanel(page);
    await page.mouse.click(300, 300);
    await expect(dialog).toBeHidden();

    await openPanel(page);
    await tapPiku(page);
    await expect(dialog).toBeHidden();
    await expect(page.locator('.piku-btn')).toHaveAttribute('aria-expanded', 'false');
  });

  test('phone: panel is still a modal full-screen sheet', async ({ browser }) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });
    const page = await ctx.newPage();
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    await tapPiku(page);
    const dialog = page.getByRole('dialog');
    await expect(dialog).toBeVisible();
    await page.waitForTimeout(700);

    const d = (await dialog.boundingBox())!;
    expect(d.width).toBeGreaterThanOrEqual(389);
    expect(d.height).toBeGreaterThanOrEqual(840);
    await expect(dialog).toHaveAttribute('aria-modal', 'true');
    expect(await page.evaluate(() => document.body.style.overflow)).toBe('hidden');
    await ctx.close();
  });

  test('accessibility: semantic button, keyboard opens the panel', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const btn = page.locator('.piku-btn');
    await expect(btn).toBeVisible();
    expect(await btn.getAttribute('type')).toBe('button');
    expect(await btn.getAttribute('aria-haspopup')).toBe('dialog');
    const aria = (await btn.getAttribute('aria-label')) ?? '';
    expect(aria).toContain('Piku');
    expect(aria).toContain('gifting');

    await btn.focus();
    const outlineWidth = await btn.evaluate((el) => getComputedStyle(el).outlineWidth);
    expect(outlineWidth).not.toBe('0px');

    await page.keyboard.press('Enter');
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(btn).toHaveAttribute('aria-expanded', 'true');
    // focus moves into the panel on open
    await expect(page.getByRole('button', { name: 'Close chat with Piku' })).toBeFocused();
  });

  test('greets once per session and never repeats it after a reload', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const bubble = page.locator('.piku-bubble');
    await expect(bubble).toContainText(GREETING, { timeout: 4000 });
    expect(await page.evaluate(() => sessionStorage.getItem('piku:greeted'))).toBe('1');

    // Interact once so the session has seen the visitor, then reload.
    await tapPiku(page);
    await page.keyboard.press('Escape');
    await page.reload();
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(3500);

    // At most the optional welcome-back line may appear — never a greeting again.
    const texts = await page.locator('.piku-bubble').allTextContents();
    for (const text of texts) {
      expect(text).toMatch(/You're back! 👀|Missed me\?|Hey again!/);
    }
  });

  test('click cadence: happy, then curious, then nervous on a burst', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Let the greeting bubble and its global speech cooldown elapse.
    await page.waitForTimeout(7500);

    const first = Date.now();
    await tapPiku(page);
    await expectEmotion(page, 'happy');
    await page.keyboard.press('Escape');
    const untilSecond = 1900 - (Date.now() - first);
    if (untilSecond > 0) await page.waitForTimeout(untilSecond);

    await tapPiku(page);
    await expectEmotion(page, 'curious');
    await page.keyboard.press('Escape');
    await page.waitForTimeout(1900);

    // Four synchronous clicks trip the burst branch → nervous.
    await page.evaluate(() => {
      const button = document.querySelector<HTMLButtonElement>('.piku-btn');
      if (!button) throw new Error('missing .piku-btn');
      button.click();
      button.click();
      button.click();
      button.click();
    });
    await expectEmotion(page, 'nervous');
  });

  test('speech respects the global cooldown and never repeats a line', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const bubble = page.locator('.piku-bubble');
    await expect(bubble).toBeVisible({ timeout: 4000 });
    const greetingText = (await bubble.textContent()) ?? '';
    expect(greetingText).toMatch(GREETING);

    // Inside the 6s speech cooldown a click cannot replace the visible line.
    await page.waitForTimeout(600);
    await tapPiku(page);
    await page.waitForTimeout(120);
    await page.keyboard.press('Escape');
    await page.waitForTimeout(300);
    await expect(page.locator('.piku-bubble')).toHaveText(greetingText);

    // After the cooldown the next interaction speaks a fresh click line.
    await page.waitForTimeout(5000);
    await tapPiku(page);
    await page.waitForTimeout(120);
    await page.keyboard.press('Escape');
    await expect(page.locator('.piku-bubble')).toBeVisible({ timeout: 2000 });
    const secondText = (await page.locator('.piku-bubble').textContent()) ?? '';
    expect(secondText).not.toBe(greetingText);
    expect(secondText).toMatch(/Hi! 👋|Hey — that tickles!|Hello there!|Again\? 😄|Hey again!|Still me\./);
  });

  test('stays silent while the tab is hidden', async ({ page }) => {
    await page.addInitScript(() => {
      let hidden = true;
      Object.defineProperty(document, 'visibilityState', {
        configurable: true,
        get: () => (hidden ? 'hidden' : 'visible'),
      });
      (window as unknown as { __setHidden: (value: boolean) => void }).__setHidden = (
        value: boolean,
      ) => {
        hidden = value;
        document.dispatchEvent(new Event('visibilitychange'));
      };
    });

    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(2000);

    // The greeting fired at 1.2s but was gated by the hidden tab.
    expect(await page.locator('.piku-bubble').count()).toBe(0);
    await expectEmotion(page, 'idle');

    await page.evaluate(() => {
      const button = document.querySelector<HTMLButtonElement>('.piku-btn');
      if (!button) throw new Error('missing .piku-btn');
      button.click();
      button.click();
      button.click();
      button.click();
    });
    await page.waitForTimeout(250);
    expect(await page.locator('.piku-bubble').count()).toBe(0);
    await expectEmotion(page, 'idle');

    // Visible again: interactions speak normally.
    await page.evaluate(() =>
      (window as unknown as { __setHidden: (value: boolean) => void }).__setHidden(false),
    );
    await page.waitForTimeout(300);
    await tapPiku(page);
    await page.waitForTimeout(150);
    await page.keyboard.press('Escape');
    await expect(page.locator('.piku-bubble')).toBeVisible({ timeout: 2000 });
    await expect(page.locator('.piku-bubble')).toHaveText(
      /Hi! 👋|Hey — that tickles!|Hello there!|Again\? 😄|Hey again!|Still me\./,
    );
  });
});
