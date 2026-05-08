import { test, expect } from '@playwright/test';

const SEEDED_SLUG  = 'ep-gutenberg-byzart';
const URL_FRAGMENT = 'byzart.eu';

// Byzart isn't recognised by EmbedPress in this build — the shortcode falls
// back to rendering the URL as plain text inside the embedpress figure.
test.describe('Gutenberg verify — Byzart (URL fallback only)', () => {
  test('seeded page emits the source URL fallback', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'commit' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const html = await response!.text();
    expect(html).toMatch(
      new RegExp(`<figure class="wp-block-embedpress-embedpress">[^<]*${URL_FRAGMENT.replace(/\./g, '\\.')}`),
    );
  });
});
