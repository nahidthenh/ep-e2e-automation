import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-gutenberg-wistia';
const MEDIA_ID    = 'kjgpmu64ul';

// Wistia is JS-rendered: the wrapper carries the media id and Wistia's
// E-v1.js loads the player at runtime. We assert on the wrapper + the
// wistia loader script in the raw response.
test.describe('Gutenberg verify — Wistia', () => {
  test('seeded page emits the wistia wrapper + loader', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'commit' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const html = await response!.text();
    expect(html).toContain(`ose-uid-${MEDIA_ID}`);
    expect(html).toContain('fast.wistia.com/assets/external/E-v1.js');
  });
});
