import { test, expect, type Page } from '@playwright/test';

const BASE = 'http://localhost:3100';

const EVENTS = [
  'avagifts:piku-concierge-opened',
  'avagifts:piku-concierge-step',
  'avagifts:piku-form-valid',
  'avagifts:piku-form-error',
  'avagifts:piku-enquiry-sent',
  'avagifts:piku-celebrate',
] as const;

declare global {
  interface Window {
    __pikuEvents?: { name: string; detail?: unknown }[];
  }
}

async function installCollector(page: Page) {
  await page.addInitScript((names: string[]) => {
    const store: { name: string; detail?: unknown }[] = [];
    window.__pikuEvents = store;
    for (const name of names) {
      window.addEventListener(name, (event) => {
        store.push({ name, detail: (event as CustomEvent).detail });
      });
    }
  }, EVENTS as unknown as string[]);
}

function daysFromToday(offset: number) {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

function eventNames(page: Page) {
  return page.evaluate(() => (window.__pikuEvents ?? []).map((event) => event.name));
}

/**
 * Piku's idle bob is an infinite animation, so a real mouse click can trip
 * Playwright's stability check. Dispatch through the DOM — same handler.
 */
async function tapPiku(page: Page) {
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>('.piku-btn')?.click();
  });
}

function eventSteps(page: Page) {
  return page.evaluate(() =>
    (window.__pikuEvents ?? [])
      .filter((event) => event.name === 'avagifts:piku-concierge-step')
      .map((event) => (event.detail as { step: string }).step),
  );
}

function seen(page: Page, name: string) {
  return page.evaluate(
    (eventName) => (window.__pikuEvents ?? []).some((event) => event.name === eventName),
    name,
  );
}

test.describe('Piku concierge event bus', () => {
  test('opening the concierge announces OPENED and every step', async ({ page }) => {
    await installCollector(page);
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await tapPiku(page);
    await page.waitForTimeout(800);

    const dialog = page.getByRole('dialog');
    await dialog.getByRole('button', { name: /let.?s start/i }).click();
    await dialog.getByRole('button', { name: /employee appreciation/i }).click();
    await dialog.getByRole('button', { name: /celebrate/i }).first().click();
    await page.waitForTimeout(400);

    const names = await eventNames(page);
    expect(names.filter((name) => name === 'avagifts:piku-concierge-opened')).toHaveLength(1);

    const steps = await eventSteps(page);
    expect(steps).toContain('intro');
    expect(steps).toContain('occasion');
    expect(steps).toContain('feeling');
  });

  test('form outcomes and enquiry success travel the bus', async ({ page }) => {
    await installCollector(page);
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    const dialog = page.getByRole('dialog');

    await tapPiku(page);
    await page.waitForTimeout(800);
    await dialog.getByRole('button', { name: /let.?s start/i }).click();
    await dialog.getByRole('button', { name: /employee appreciation/i }).click();
    await dialog.getByRole('button', { name: /celebrate/i }).first().click();
    await dialog.getByRole('button', { name: /open to suggestions/i }).click();
    await dialog.getByRole('button', { name: /^continue$/i }).click();
    await page.waitForTimeout(400);
    await dialog.getByRole('button', { name: /^continue$/i }).click();
    await page.waitForTimeout(400);

    const dateInput = dialog.locator('input[type="date"][aria-label="Delivery date"]');
    await expect(dateInput).toHaveCount(1);

    // Too soon: the form reports an error on the bus.
    await dateInput.fill(daysFromToday(3));
    await dialog.getByRole('button', { name: /^continue$/i }).click();
    await expect.poll(() => seen(page, 'avagifts:piku-form-error'), { timeout: 3000 }).toBe(true);

    // A valid date reports success on the bus.
    await dateInput.fill(daysFromToday(7));
    await dialog.getByRole('button', { name: /^continue$/i }).click();
    await expect.poll(() => seen(page, 'avagifts:piku-form-valid'), { timeout: 3000 }).toBe(true);

    await dialog.getByLabel('Delivery location').fill('Mumbai');
    await dialog.getByRole('button', { name: /^continue$/i }).click();
    await page.waitForTimeout(400);
    await dialog.getByRole('button', { name: 'Not sure yet' }).click();
    await page.waitForTimeout(400);
    await dialog.getByRole('button', { name: /see my brief/i }).click();
    await page.waitForTimeout(400);
    await dialog.getByRole('button', { name: /^continue$/i }).click();
    await page.waitForTimeout(400);

    await dialog.locator('#piku-name').fill('Test User');
    await dialog.locator('#piku-designation').fill('Manager');
    await dialog.locator('#piku-company').fill('AvaGifts QA');
    await dialog.locator('#piku-phone').fill('9876543210');
    await dialog.locator('#piku-email').fill('qa@example.com');
    await dialog.getByRole('button', { name: /review my brief/i }).click();

    await expect
      .poll(async () => {
        const names = await eventNames(page);
        return names.filter((name) => name === 'avagifts:piku-form-valid').length;
      }, { timeout: 3000 })
      .toBeGreaterThanOrEqual(2);

    await dialog.getByRole('button', { name: /connect with gifting team/i }).click();
    await expect(page.getByText(/your brief is with our gifting team/i)).toBeVisible({ timeout: 8000 });
    await expect.poll(() => seen(page, 'avagifts:piku-enquiry-sent'), { timeout: 8000 }).toBe(true);

    await page.keyboard.press('Escape');
    await expect.poll(() => seen(page, 'avagifts:piku-celebrate'), { timeout: 3000 }).toBe(true);
  });
});
