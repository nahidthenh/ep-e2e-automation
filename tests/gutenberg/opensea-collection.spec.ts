import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-gutenberg-opensea-collection';
const COLLECTION  = 'bored-y00ts';

// EmbedPress emits both `data-embed-type="OpenSea "` (with trailing space)
// and a sibling `data-embed-type="OpenSea"` wrapper for collections — keep
// the literal space; "fixing" it would diverge from what EmbedPress writes.
// The OpenSea content (NFT cards) is built client-side from the OpenSea API.
test.describe('Gutenberg verify — OpenSea Collection (wrapper only)', () => {
  test('seeded page emits the OpenSea wrapper', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'commit' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const html = await response!.text();
    expect(html).toMatch(/data-embed-type="OpenSea ?"/);
    expect(html).toContain(COLLECTION);
  });
});
