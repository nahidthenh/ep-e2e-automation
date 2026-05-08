import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-gutenberg-socialexplorer';
const URL_MARKER  = '3db1f7d2b6';

// EmbedPress emits SocialExplorer with a malformed `marginmarginsrc="…"`
// attribute (looks like a string-replace bug — the URL ends up where `src`
// should be). Asserting on the raw response lets us verify the embed URL
// reached the page even though the iframe DOM has no real `src`.
test.describe('Gutenberg verify — SocialExplorer', () => {
  test('seeded page emits the SocialExplorer iframe markup', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'commit' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const html = await response!.text();
    expect(html).toContain('data-embed-type="SocialExplorer"');
    expect(html).toContain(`socialexplorer.com/${URL_MARKER}`);
  });
});
