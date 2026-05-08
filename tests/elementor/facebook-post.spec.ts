import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-elementor-facebook-post';
const IFRAME_SEL  = 'iframe[src*="facebook.com/plugins/post"]';
const URL_MARKER  = '2430125363903041';

test.describe('Elementor verify — Facebook Post', () => {
  test('seeded page renders the embed', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const iframe = page.locator(IFRAME_SEL).first();
    await expect(iframe).toBeVisible({ timeout: 30_000 });
    await expect(iframe).toHaveAttribute('src', new RegExp(URL_MARKER));
  });
});
