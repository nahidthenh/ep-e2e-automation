import { test, expect } from '@playwright/test';

const SEEDED_SLUG  = 'ep-elementor-opensea-single';
const ASSET_ID     = '2978';
const CONTRACT_FRAG = '0x5802c586f657c787902280ac091d81832d7faf84';

test.describe('Elementor verify — OpenSea Single (wrapper only)', () => {
  test('seeded page emits the OpenSea wrapper for the asset', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'commit' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const html = await response!.text();
    expect(html).toMatch(/data-embed-type="OpenSea ?"/);
    expect(html).toContain(CONTRACT_FRAG);
    expect(html).toContain(`/${ASSET_ID}`);
  });
});
