import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-elementor-audiomeans';
const URL_FRAGMENT = 'smartlinks.audiomeans.fr';

// See Gutenberg variant: Audiomeans falls back to rendering the URL as plain
// text inside the EmbedPress widget. Elementor wraps it in widget markup but
// the embed itself is unrecognised by EmbedPress.
test.describe('Elementor verify — Audiomeans (URL fallback only)', () => {
  test('seeded page emits the source URL fallback', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'commit' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const html = await response!.text();
    expect(html).toContain(URL_FRAGMENT);
  });
});
