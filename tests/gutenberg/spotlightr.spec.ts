import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-gutenberg-spotlightr';
const IFRAME_SEL  = 'iframe[src*="cdn.spotlightr.com/watch"]';
const URL_MARKER  = 'MTkxMTYxMg';

// Spotlightr is JS-injected by its vendor script — the iframe appears in the
// DOM only after the vendor `<script>` runs. Playwright waits for the
// iframe to become visible before asserting on the URL marker.
test.describe('Gutenberg verify — Spotlightr', () => {
  test('seeded page renders the embed (vendor script-injected)', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const iframe = page.locator(IFRAME_SEL).first();
    await expect(iframe).toBeVisible({ timeout: 30_000 });
    await expect(iframe).toHaveAttribute('src', new RegExp(URL_MARKER));
  });
});
