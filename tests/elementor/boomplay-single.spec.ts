import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-elementor-boomplay-single';
const IFRAME_SEL  = 'iframe[src*="boomplay.com/embed/85985069"]';
const URL_MARKER  = '85985069';

test.describe('Elementor verify — Boomplay Single', () => {
  test('seeded page renders the embed', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const iframe = page.locator(IFRAME_SEL).first();
    await expect(iframe).toBeVisible({ timeout: 30_000 });
    await expect(iframe).toHaveAttribute('src', new RegExp(URL_MARKER));
  });
});
