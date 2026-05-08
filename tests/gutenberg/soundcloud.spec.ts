import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-gutenberg-soundcloud';
const IFRAME_SEL  = 'iframe[src*="soundcloud.com/player"]';
const URL_MARKER  = '560363814';

test.describe('Gutenberg verify — Soundcloud', () => {
  test('seeded page renders the embed', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const iframe = page.locator(IFRAME_SEL).first();
    await expect(iframe).toBeVisible({ timeout: 30_000 });
    await expect(iframe).toHaveAttribute('src', new RegExp(URL_MARKER));
  });
});
