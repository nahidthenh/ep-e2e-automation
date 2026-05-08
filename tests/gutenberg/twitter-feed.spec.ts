import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-gutenberg-twitter-feed';
const TWEET_ID    = '1346487409035206657';

// Twitter's `widgets.js` rewrites the `<blockquote class="twitter-tweet">` into
// an iframe at runtime; the raw response is the stable surface to assert on.
test.describe('Gutenberg verify — Twitter Feed', () => {
  test('seeded page emits the tweet blockquote', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'commit' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const html = await response!.text();
    expect(html).toContain('class="twitter-tweet"');
    expect(html, `expected status/${TWEET_ID} link inside the blockquote`).toContain(
      `status/${TWEET_ID}`,
    );
  });
});
