import { test, expect, type Page } from '@playwright/test';

/**
 * Piku Runner band — 2D canvas pixel-art endless runner (`PikuGame` engine,
 * fully procedural: no external images, audio or fonts).
 *
 * Run against a production build on :3100:
 *   npm run build
 *   npx next start -p 3100
 *   npx playwright test tests/piku-runner.spec.ts
 */

const BASE = 'http://localhost:3100';

/** PALETTES[0].skyTop (day) from src/components/piku-runner/tuning.ts — sampled at pixel (3,3). */
const DAY_SKY = [0xea, 0xf2, 0xfb] as const;

/** PALETTES[6].skyTop (night) — painted once the score reaches NIGHT_SCORE = 1500. */
const NIGHT_SKY = [0x0f, 0x17, 0x2a] as const;

/**
 * Top-most dark pixel of the runner sprite, in canvas-logical coordinates.
 * Scans the column Piku stands in (PIKU_X = 46, PIKU_W = 20) below the sky.
 */
async function pikuTopY(page: Page): Promise<number> {
  return page.locator('#piku-run canvas').evaluate((element) => {
    const canvas = element as HTMLCanvasElement;
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('missing 2d context');
    const dpr = canvas.width / 400;
    const x0 = Math.round(46 * dpr);
    const y0 = Math.round(20 * dpr);
    const width = Math.round(20 * dpr);
    const height = Math.round(97 * dpr);
    const data = ctx.getImageData(x0, y0, width, height).data;
    for (let y = 0; y < height; y += 1) {
      for (let x = 0; x < width; x += 1) {
        const offset = (y * width + x) * 4;
        if (Math.max(data[offset], data[offset + 1], data[offset + 2]) < 90) {
          return (y0 + y) / dpr;
        }
      }
    }
    return -1;
  });
}

/** Polls the sprite position until `predicate` holds (40ms cadence). */
async function waitForTop(page: Page, predicate: (top: number) => boolean, timeoutMs: number) {
  const deadline = Date.now() + timeoutMs;
  let top = -1;
  while (Date.now() < deadline) {
    top = await pikuTopY(page);
    if (predicate(top)) return top;
    await page.waitForTimeout(40);
  }
  throw new Error(`runner sprite position never matched (last top=${top})`);
}

declare global {
  interface Window {
    __pikuEvents?: { name: string; detail?: unknown }[];
    __pikuRunner?: {
      forceHit: () => void;
      forceNight: () => void;
      seekScore: (score: number) => void;
      getScore: () => number;
      getHi: () => number;
      isOver: () => boolean;
      isNight: () => boolean;
      isDucking: () => boolean;
      canRestart: () => boolean;
      start: () => void;
      restart: () => void;
      setSound: (on: boolean) => void;
      getSound: () => boolean;
    };
  }
}

test.describe('Piku Runner band', () => {
  test('renders a pixel canvas with no 3D or remote assets', async ({ page }) => {
    const requests: string[] = [];
    page.on('request', (request) => requests.push(request.url()));

    await page.goto(BASE, { waitUntil: 'networkidle' });

    const band = page.locator('#piku-run');
    await expect(band).toBeVisible();
    await expect(band.locator('canvas')).toBeVisible();

    expect(requests.filter((url) => url.endsWith('.glb'))).toEqual([]);
    expect(requests.filter((url) => /three/i.test(url))).toEqual([]);

    // Pixel (3,3) is the top sky band: the day palette's skyTop must be painted there.
    const sample = await band.locator('canvas').evaluate((element) => {
      const canvas = element as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('missing 2d context');
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      const x = Math.round(3 * dpr);
      const y = Math.round(3 * dpr);
      return Array.from(ctx.getImageData(x, y, 1, 1).data.slice(0, 3));
    });
    for (let channel = 0; channel < 3; channel += 1) {
      expect(Math.abs(sample[channel] - DAY_SKY[channel])).toBeLessThanOrEqual(2);
    }
  });

  test('Space starts the run, score accrues, and night begins past 1500', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof window.__pikuRunner !== 'undefined', undefined, {
      timeout: 15_000,
    });
    await page.locator('#piku-run').scrollIntoViewIfNeeded();

    await page.keyboard.press('Space');
    await page.waitForFunction(() => (window.__pikuRunner?.getScore() ?? 0) > 0, undefined, {
      timeout: 10_000,
    });

    const before = await page.evaluate(() => window.__pikuRunner!.getScore());
    await page.waitForTimeout(600);
    const after = await page.evaluate(() => window.__pikuRunner!.getScore());
    expect(after).toBeGreaterThan(before);

    // Just before the night threshold the world must still be in the day cycle.
    await page.evaluate(() => window.__pikuRunner!.seekScore(1490));
    await page.waitForFunction(
      () => {
        const score = window.__pikuRunner?.getScore() ?? 0;
        return score >= 1495 && score < 1500;
      },
      undefined,
      { timeout: 10_000 },
    );
    expect(await page.evaluate(() => window.__pikuRunner!.isNight())).toBe(false);

    // Crossing 1500 flips the scene to night.
    await page.evaluate(() => window.__pikuRunner!.seekScore(1499));
    await page.waitForFunction(
      () => (window.__pikuRunner?.getScore() ?? 0) >= 1500 && window.__pikuRunner!.isNight(),
      undefined,
      { timeout: 5_000 },
    );
  });

  test('forceHit ends the run, HI persists, restart works', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof window.__pikuRunner !== 'undefined', undefined, {
      timeout: 15_000,
    });
    await page.locator('#piku-run').scrollIntoViewIfNeeded();

    await page.keyboard.press('Space');
    await page.waitForFunction(() => (window.__pikuRunner?.getScore() ?? 0) > 0, undefined, {
      timeout: 10_000,
    });

    await page.evaluate(() => window.__pikuRunner!.forceHit());
    await expect(page.locator('#piku-run [role="alert"]')).toBeAttached({ timeout: 10_000 });
    expect(await page.evaluate(() => localStorage.getItem('piku_runner_hi'))).not.toBeNull();

    // The restart gate is 600ms; give it a beat before pressing Space again.
    await page.waitForTimeout(1500);
    await page.keyboard.press('Space');
    await page.waitForFunction(() => window.__pikuRunner?.isOver() === false, undefined, {
      timeout: 5_000,
    });
  });

  test('ArrowDown ducks and releasing stands the runner back up', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof window.__pikuRunner !== 'undefined', undefined, {
      timeout: 15_000,
    });
    await page.locator('#piku-run').scrollIntoViewIfNeeded();

    await page.keyboard.press('Space');
    await page.waitForFunction(() => (window.__pikuRunner?.getScore() ?? 0) > 0, undefined, {
      timeout: 10_000,
    });
    // Let the opening jump land (full jump ≈ 0.5s at the starting speed).
    await page.waitForTimeout(900);

    await page.keyboard.down('ArrowDown');
    await page.waitForFunction(() => window.__pikuRunner?.isDucking() === true, undefined, {
      timeout: 5_000,
    });
    await page.keyboard.up('ArrowDown');
    await page.waitForFunction(() => window.__pikuRunner?.isDucking() === false, undefined, {
      timeout: 5_000,
    });
  });

  test('sound toggle is reachable and persists to localStorage', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });

    const mute = page.locator('#piku-run button[aria-label="Mute game sound"]');
    await expect(mute).toBeVisible();
    await expect(mute).toHaveAttribute('aria-pressed', 'true');

    await mute.click();
    const unmute = page.locator('#piku-run button[aria-label="Unmute game sound"]');
    await expect(unmute).toHaveAttribute('aria-pressed', 'false');
    expect(await page.evaluate(() => localStorage.getItem('piku_runner_sound'))).toBe('0');

    await unmute.click();
    await expect(page.locator('#piku-run button[aria-label="Mute game sound"]')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    expect(await page.evaluate(() => localStorage.getItem('piku_runner_sound'))).toBe('1');
  });

  test('plays offline once the service worker has warmed its cache', async ({ page, context }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof window.__pikuRunner !== 'undefined', undefined, {
      timeout: 15_000,
    });

    // Wait for activation (clients.claim) then do one controlled reload so the
    // document and its static chunks land in the cache.
    await page.waitForFunction(() => navigator.serviceWorker?.controller != null, undefined, {
      timeout: 15_000,
    });
    await page.reload({ waitUntil: 'networkidle' });

    await context.setOffline(true);
    try {
      await page.reload({ waitUntil: 'domcontentloaded' });
      await page.waitForFunction(() => typeof window.__pikuRunner !== 'undefined', undefined, {
        timeout: 20_000,
      });
      await page.locator('#piku-run').scrollIntoViewIfNeeded();
      await page.keyboard.press('Space');
      await page.waitForFunction(() => (window.__pikuRunner?.getScore() ?? 0) > 0, undefined, {
        timeout: 10_000,
      });
    } finally {
      await context.setOffline(false);
    }
  });

  test('renders with no console errors', async ({ page }) => {
    const errors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error') errors.push(message.text());
    });
    page.on('pageerror', (error) => errors.push(error.message));

    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.locator('#piku-run').scrollIntoViewIfNeeded();
    await page.waitForTimeout(1500);
    await page.keyboard.press('Space');
    await page.waitForTimeout(1000);

    await expect(page.locator('#piku-run')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('waits in READY until the player starts', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof window.__pikuRunner !== 'undefined', undefined, {
      timeout: 15_000,
    });
    await page.locator('#piku-run').scrollIntoViewIfNeeded();

    expect(await page.evaluate(() => window.__pikuRunner!.getScore())).toBe(0);
    expect(await page.evaluate(() => window.__pikuRunner!.isOver())).toBe(false);
    expect(await page.evaluate(() => window.__pikuRunner!.isDucking())).toBe(false);

    // The runner sprite is standing on the ground, fully inside the canvas.
    const top = await pikuTopY(page);
    expect(top).toBeGreaterThanOrEqual(55);
    expect(top).toBeLessThanOrEqual(105);

    // READY never auto-runs: no score accrues without input.
    await page.waitForTimeout(700);
    expect(await page.evaluate(() => window.__pikuRunner!.getScore())).toBe(0);

    await page.keyboard.press('Space');
    await page.waitForFunction(() => (window.__pikuRunner?.getScore() ?? 0) > 0, undefined, {
      timeout: 10_000,
    });
  });

  test('jumping lifts the runner off the ground and it lands again', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof window.__pikuRunner !== 'undefined', undefined, {
      timeout: 15_000,
    });
    await page.locator('#piku-run').scrollIntoViewIfNeeded();

    await page.keyboard.press('Space');
    await page.waitForFunction(() => (window.__pikuRunner?.getScore() ?? 0) > 0, undefined, {
      timeout: 10_000,
    });
    // The start press also performs the opening hop; let it land first.
    await page.waitForTimeout(900);

    const baseline = await pikuTopY(page);
    expect(baseline).toBeGreaterThan(0);

    await page.keyboard.down('Space');
    await page.waitForTimeout(120);
    await page.keyboard.up('Space');

    // Airborne: the top of the sprite rises well above its grounded position.
    await waitForTop(page, (value) => value > 0 && value <= baseline - 10, 2_000);
    // Landing: back down at the standing height (small tolerance for the run cycle).
    await waitForTop(page, (value) => value > 0 && value >= baseline - 6, 2_500);
  });

  test('night latches at exactly 1500 and paints the night sky', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof window.__pikuRunner !== 'undefined', undefined, {
      timeout: 15_000,
    });
    await page.locator('#piku-run').scrollIntoViewIfNeeded();

    // All synchronous: seekScore() repaints immediately, so no RAF interleaving.
    const result = await page.evaluate(() => {
      const hook = window.__pikuRunner!;
      hook.seekScore(1490);
      const at1490 = hook.isNight();
      hook.seekScore(1499);
      const at1499 = hook.isNight();
      hook.seekScore(1500);
      const at1500 = hook.isNight();
      const canvas = document.querySelector('#piku-run canvas') as HTMLCanvasElement;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('missing 2d context');
      const dpr = canvas.width / 400;
      const px = Array.from(
        ctx.getImageData(Math.round(3 * dpr), Math.round(3 * dpr), 1, 1).data.slice(0, 3),
      );
      hook.seekScore(1501);
      const at1501 = hook.isNight();
      return { at1490, at1499, at1500, at1501, px, score: hook.getScore() };
    });

    expect(result.at1490).toBe(false);
    expect(result.at1499).toBe(false);
    expect(result.at1500).toBe(true);
    expect(result.at1501).toBe(true);
    expect(result.score).toBe(1501);
    for (let channel = 0; channel < 3; channel += 1) {
      expect(Math.abs(result.px[channel] - NIGHT_SKY[channel])).toBeLessThanOrEqual(3);
    }
  });

  test('game-over input is gated until the restart window opens', async ({ page }) => {
    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof window.__pikuRunner !== 'undefined', undefined, {
      timeout: 15_000,
    });
    await page.locator('#piku-run').scrollIntoViewIfNeeded();

    await page.keyboard.press('Space');
    await page.waitForFunction(() => (window.__pikuRunner?.getScore() ?? 0) > 0, undefined, {
      timeout: 10_000,
    });

    // Crash, then try to restart immediately — the 600ms gate must swallow the input.
    const scoreAtHit = await page.evaluate(() => {
      window.__pikuRunner!.forceHit();
      return window.__pikuRunner!.getScore();
    });
    expect(await page.evaluate(() => window.__pikuRunner!.canRestart())).toBe(false);

    await page.keyboard.press('Space');
    await page.waitForTimeout(300);
    expect(await page.evaluate(() => window.__pikuRunner!.canRestart())).toBe(false);
    const scoreAfter = await page.evaluate(() => window.__pikuRunner!.getScore());
    expect(scoreAfter).toBeLessThanOrEqual(scoreAtHit + 1);

    // Once the window opens, the same input restarts the run.
    await page.waitForFunction(() => window.__pikuRunner?.canRestart() === true, undefined, {
      timeout: 3_000,
    });
    await page.keyboard.press('Space');
    await page.waitForFunction(() => window.__pikuRunner?.isOver() === false, undefined, {
      timeout: 3_000,
    });
  });

  test('announces its lifecycle on the shared event bus', async ({ page }) => {
    await page.addInitScript(() => {
      const events: { name: string; detail?: unknown }[] = [];
      (window as unknown as { __pikuEvents: typeof events }).__pikuEvents = events;
      for (const name of [
        'avagifts:piku-game-opened',
        'avagifts:piku-game-started',
        'avagifts:piku-game-hit',
        'avagifts:piku-game-milestone',
        'avagifts:piku-game-completed',
        'avagifts:piku-game-exited',
      ]) {
        window.addEventListener(name, (event) => {
          events.push({ name, detail: (event as CustomEvent).detail });
        });
      }
    });

    await page.goto(BASE, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => typeof window.__pikuRunner !== 'undefined', undefined, {
      timeout: 15_000,
    });
    await page.locator('#piku-run').scrollIntoViewIfNeeded();

    const seen = (name: string) =>
      page.evaluate((eventName) => window.__pikuEvents!.some((event) => event.name === eventName), name);

    // Scrolling the band into view is the "opened" signal.
    await expect.poll(() => seen('avagifts:piku-game-opened'), { timeout: 10_000 }).toBe(true);

    await page.keyboard.press('Space');
    await page.waitForFunction(() => (window.__pikuRunner?.getScore() ?? 0) > 0, undefined, {
      timeout: 10_000,
    });
    await expect.poll(() => seen('avagifts:piku-game-started'), { timeout: 5_000 }).toBe(true);

    await page.evaluate(() => window.__pikuRunner!.forceHit());
    await expect.poll(() => seen('avagifts:piku-game-completed'), { timeout: 10_000 }).toBe(true);
    const completed = await page.evaluate(() =>
      window.__pikuEvents!.find((event) => event.name === 'avagifts:piku-game-completed'),
    );
    expect(completed?.detail).toMatchObject({ score: expect.any(Number) });
  });
});
