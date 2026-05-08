import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-elementor-nrk-radio';
const IFRAME_SEL  = 'iframe[src*="radio.nrk.no/podkast"]';
const URL_MARKER  = 'brenner_deler_dikt';

test.describe('Elementor verify — NRK Radio', () => {
  test('seeded page renders the embed', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const iframe = page.locator(IFRAME_SEL).first();
    await expect(iframe).toBeVisible({ timeout: 30_000 });
    await expect(iframe).toHaveAttribute('src', new RegExp(URL_MARKER));
  });
});
