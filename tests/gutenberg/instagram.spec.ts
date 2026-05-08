import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-gutenberg-instagram';
const IFRAME_SEL  = 'iframe[src*="instagram.com/p/"]';
const URL_MARKER  = 'CL6nrBFBDa8';

test.describe('Gutenberg verify — Instagram', () => {
  test('seeded page renders the embed', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const iframe = page.locator(IFRAME_SEL).first();
    await expect(iframe).toBeVisible({ timeout: 30_000 });
    await expect(iframe).toHaveAttribute('src', new RegExp(URL_MARKER));
  });
});
