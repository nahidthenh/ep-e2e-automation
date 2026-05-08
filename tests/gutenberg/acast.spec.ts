import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-gutenberg-acast';
const IFRAME_SEL  = 'iframe[src*="embed.acast.com"]';
const URL_MARKER  = '67572068d59c6635eea1c5fc';

test.describe('Gutenberg verify — Acast', () => {
  test('seeded page renders the embed', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const iframe = page.locator(IFRAME_SEL).first();
    await expect(iframe).toBeVisible({ timeout: 30_000 });
    await expect(iframe).toHaveAttribute('src', new RegExp(URL_MARKER));
  });
});
