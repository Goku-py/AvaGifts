import { test, expect, type Page } from '@playwright/test';

const BASE = 'http://localhost:3100';
const MIN_LEAD_DAYS = 7;

/**
 * Dates are computed from the real system clock at test-run time, never
 * hardcoded — the business rule ("at least 7 days from today") must hold on
 * whatever day this suite actually runs, including across month/year
 * boundaries.
 */
function toInputValue(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function daysFromToday(offset: number): string {
  const date = new Date();
  date.setDate(date.getDate() + offset);
  return toInputValue(date);
}

/**
 * Walk the concierge to its delivery-date step. The homepage enquiry form was
 * removed in the redesign, so this is now the only place the 7-day rule is
 * enforced in the UI.
 */
async function gotoConciergeDateStep(page: Page) {
  await page.goto(BASE);
  await page.waitForLoadState('networkidle');
  await page.waitForTimeout(1500);

  // Piku's idle bob is an infinite animation, so a real mouse click can trip
  // Playwright's stability check. Dispatch through the DOM — same handler.
  await page.evaluate(() => {
    document.querySelector<HTMLButtonElement>('.piku-btn')?.click();
  });
  await page.waitForTimeout(800);
  await page.getByRole('button', { name: /let.?s start/i }).click();

  // Occasion (single-select, auto-advances) → Feeling (auto-advances) →
  // Gift style (multi-select, needs Continue) → Quantity (Continue) →
  // Delivery date.
  await page.getByRole('button', { name: /employee appreciation/i }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /celebrate/i }).first().click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /open to suggestions/i }).click();
  await page.getByRole('button', { name: /^continue$/i }).click();
  await page.waitForTimeout(500);
  await page.getByRole('button', { name: /^continue$/i }).click(); // skip quantity input, just advance
  await page.waitForTimeout(500);

  // Scoped to the dialog: a second element also carries this label in the
  // review step, and an unscoped locator would trip strict mode there.
  const dateInput = page
    .getByRole('dialog')
    .locator('input[type="date"][aria-label="Delivery date"]');
  await expect(dateInput).toHaveCount(1);
  return dateInput;
}

test.describe('Delivery date — 7-day minimum lead time', () => {
  test('concierge: native min matches today + 7, and an invalid pick blocks Continue', async ({
    page,
  }) => {
    const dateInput = await gotoConciergeDateStep(page);
    await expect(dateInput).toHaveAttribute('min', daysFromToday(MIN_LEAD_DAYS));

    await dateInput.fill(daysFromToday(3));
    await page.getByRole('button', { name: /^continue$/i }).click();
    await expect(page.locator('#delivery-date-error')).toBeVisible();
    await expect(page.locator('#delivery-date-error')).toContainText(/at least 7 days/i);
  });

  test('concierge: today+1..today+6 rejected, today+7 advances the flow', async ({ page }) => {
    const dateInput = await gotoConciergeDateStep(page);

    // The business-rule table from the brief, generalised: every offset
    // from +1 to MIN_LEAD_DAYS-1 must be invalid, MIN_LEAD_DAYS itself valid.
    // This sweep is what catches an off-by-one in getMinDeliveryDate.
    for (let offset = 1; offset < MIN_LEAD_DAYS; offset++) {
      await dateInput.fill(daysFromToday(offset));
      await page.getByRole('button', { name: /^continue$/i }).click();
      await expect(
        page.locator('#delivery-date-error'),
        `offset +${offset} day(s) should block Continue`,
      ).toBeVisible();
    }

    await dateInput.fill(daysFromToday(MIN_LEAD_DAYS));
    await page.getByRole('button', { name: /^continue$/i }).click();

    // Assert the flow actually ADVANCED. Checking only that the error is gone
    // would pass vacuously — that node is absent before validation ever runs,
    // so the assertion would still hold if validation were deleted outright.
    await expect(dateInput).toHaveCount(0);
    await expect(page.locator('#delivery-date-error')).toHaveCount(0);
  });

  test('API rejects an invalid delivery date even when the UI is bypassed entirely', async ({
    request,
  }) => {
    const response = await request.post(`${BASE}/api/enquiry`, {
      data: {
        name: 'Bypass Test',
        email: 'bypass@example.com',
        // One day inside the boundary — the tightest case the server must reject.
        deliveryDate: daysFromToday(MIN_LEAD_DAYS - 1),
      },
    });
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.fieldErrors?.deliveryDate?.[0]).toMatch(/7 days/i);
  });

  test('API accepts a delivery date exactly at the minimum lead time', async ({ request }) => {
    const response = await request.post(`${BASE}/api/enquiry`, {
      data: {
        name: 'Valid Date Test',
        email: 'valid@example.com',
        deliveryDate: daysFromToday(MIN_LEAD_DAYS),
      },
    });
    expect(response.ok()).toBe(true);
  });

  test('API still accepts an enquiry with no delivery date at all (field stays optional)', async ({
    request,
  }) => {
    const response = await request.post(`${BASE}/api/enquiry`, {
      data: { name: 'No Date Test', email: 'nodate@example.com' },
    });
    expect(response.ok()).toBe(true);
  });
});

test.describe('Conversion band — structure after the enquiry form was removed', () => {
  test('the band still exists, is labelled, and keeps its Piku landmark', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const band = page.locator('#contact');
    await expect(band).toHaveCount(1);
    await expect(band).toHaveAttribute('aria-labelledby', 'contact-heading');
    // Losing this attribute costs the mascot its contextual hint, silently.
    await expect(band).toHaveAttribute('data-piku', 'contact');
    await expect(page.locator('#contact-heading')).toBeVisible();
  });

  test('both CTAs open the concierge on different steps', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    await page.locator('#contact').getByRole('button', { name: /get a custom quote/i }).click();
    await page.waitForTimeout(800);
    const quoteText = await page.getByRole('dialog').innerText();
    await page.keyboard.press('Escape');
    await page.waitForTimeout(600);

    await page.locator('#contact').getByRole('button', { name: /talk to a gifting expert/i }).click();
    await page.waitForTimeout(800);
    const expertText = await page.getByRole('dialog').innerText();

    expect(quoteText.length).toBeGreaterThan(0);
    expect(expertText.length).toBeGreaterThan(0);
    expect(quoteText).not.toBe(expertText);
  });

  test('the enquiry form is gone — no stray date input outside the concierge', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    await expect(page.locator('#contact input[name="deliveryDate"]')).toHaveCount(0);
    await expect(page.locator('#contact button[type="submit"]')).toHaveCount(0);
  });
});
