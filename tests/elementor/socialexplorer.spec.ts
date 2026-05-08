import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-elementor-socialexplorer';
const URL_MARKER  = '3db1f7d2b6';

// Same `marginmarginsrc` quirk as the Gutenberg variant — see comment there.
test.describe('Elementor verify — SocialExplorer', () => {
  test('seeded page emits the SocialExplorer iframe markup', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'commit' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const html = await response!.text();
    expect(html).toContain('data-embed-type="SocialExplorer"');
    expect(html).toContain(`socialexplorer.com/${URL_MARKER}`);
  });
});
