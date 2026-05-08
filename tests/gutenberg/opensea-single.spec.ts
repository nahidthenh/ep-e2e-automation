import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-gutenberg-opensea-single';

// Like OpenSea Collection, the single-asset content comes from the OpenSea
// API at request time — wrapper-only assertion.
test.describe('Gutenberg verify — OpenSea Single (wrapper only)', () => {
  test('seeded page emits the OpenSea wrapper', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'commit' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const html = await response!.text();
    expect(html).toMatch(/data-embed-type="OpenSea ?"/);
  });
});
