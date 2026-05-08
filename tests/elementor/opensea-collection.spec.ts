import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-elementor-opensea-collection';
const COLLECTION  = 'bored-y00ts';

test.describe('Elementor verify — OpenSea Collection (wrapper only)', () => {
  test('seeded page emits the OpenSea wrapper', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'commit' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const html = await response!.text();
    expect(html).toMatch(/data-embed-type="OpenSea ?"/);
    expect(html).toContain(COLLECTION);
  });
});
