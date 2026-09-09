import { test, expect } from '@playwright/test';

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

test.describe('Delivery date — 7-day minimum lead time', () => {
  test('main contact form: native min matches today + 7 exactly', async ({ page }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const input = page.locator('#contact input[name="deliveryDate"]');
    await input.scrollIntoViewIfNeeded();
    await expect(input).toHaveAttribute('min', daysFromToday(MIN_LEAD_DAYS));
  });

  test('main contact form: today+1..today+6 rejected, today+7 accepted, submit blocked on invalid', async ({
    page,
  }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    const input = page.locator('#contact input[name="deliveryDate"]');
    await input.scrollIntoViewIfNeeded();

    // The business-rule table from the brief, generalised: every offset
    // from +1 to MIN_LEAD_DAYS-1 must be invalid, MIN_LEAD_DAYS itself valid.
    for (let offset = 1; offset < MIN_LEAD_DAYS; offset++) {
      await input.fill(daysFromToday(offset));
      await input.blur();
      const error = page.locator('#deliveryDate-error');
      await expect(error, `offset +${offset} day(s) should show an error`).toBeVisible();
    }

    await input.fill(daysFromToday(MIN_LEAD_DAYS));
    await input.blur();
    await expect(page.locator('#deliveryDate-error')).toHaveCount(0);
  });

  test('main contact form: an invalid date typed past the native min cannot submit', async ({
    page,
  }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');

    // Fill only the required fields plus an out-of-range date, then submit —
    // proves the JS-level check gates submission independently of the
    // native picker's `min` (which a pasted/typed value can bypass).
    await page.fill('#contact input[name="name"]', 'Test User');
    await page.fill('#contact input[name="email"]', 'test@example.com');
    const input = page.locator('#contact input[name="deliveryDate"]');
    await input.scrollIntoViewIfNeeded();
    await input.fill(daysFromToday(3));

    await page.click('#contact button[type="submit"]');
    // A validation error keeps the form on-page rather than showing success.
    await expect(page.locator('#contact')).toContainText(/at least 7 days/i);
    await expect(page.locator('text=Enquiry received')).toHaveCount(0);
  });

  test('API rejects an invalid delivery date even when the UI is bypassed entirely', async ({
    request,
  }) => {
    const response = await request.post(`${BASE}/api/enquiry`, {
      data: {
        name: 'Bypass Test',
        email: 'bypass@example.com',
        deliveryDate: daysFromToday(3), // 3 days out — invalid under the 7-day rule
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

  test('Piku concierge: date step has the same native minimum and blocks Continue on an invalid pick', async ({
    page,
  }) => {
    await page.goto(BASE);
    await page.waitForLoadState('networkidle');
    await page.waitForTimeout(1500);

    await page.locator('.piku-btn').click();
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

    const dateInput = page.locator('[aria-label="Delivery date"]');
    await expect(dateInput).toHaveAttribute('min', daysFromToday(MIN_LEAD_DAYS));

    await dateInput.fill(daysFromToday(3));
    await page.getByRole('button', { name: /^continue$/i }).click();
    await expect(page.locator('#delivery-date-error')).toBeVisible();
    await expect(page.locator('#delivery-date-error')).toContainText(/at least 7 days/i);
  });
});
