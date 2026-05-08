import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-gutenberg-blueskysocial';
const DID         = 'xqnyajfc36cfzgyym6f7yoqe';

// Bluesky's embed script transforms the blockquote into an iframe at runtime,
// so we check the raw response HTML — that's the integration surface
// EmbedPress is responsible for.
test.describe('Gutenberg verify — BlueskySocial', () => {
  test('seeded page emits the bluesky blockquote', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'commit' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const html = await response!.text();
    expect(html).toContain('class="bluesky-embed"');
    expect(html, `expected DID ${DID} in data-bluesky-uri`).toMatch(
      new RegExp(`data-bluesky-uri="[^"]*${DID}`),
    );
  });
});
