import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-gutenberg-slideshare';
const IFRAME_SEL  = 'iframe[src*="slideshare.net/slideshow/embed_code"]';
const URL_MARKER  = 'exvMftSyV7yRQR';

test.describe('Gutenberg verify — Slideshare', () => {
  test('seeded page renders the embed', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const iframe = page.locator(IFRAME_SEL).first();
    await expect(iframe).toBeVisible({ timeout: 30_000 });
    await expect(iframe).toHaveAttribute('src', new RegExp(URL_MARKER));
  });
});
