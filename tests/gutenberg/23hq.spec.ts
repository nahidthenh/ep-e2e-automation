import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-gutenberg-23hq';

// Strict assertion: 23hq integration must produce an iframe inside the
// EmbedPress figure / widget. As of the audit, this source emits the wrapper
// but no iframe ever renders (server-side or post-JS). Test fails to surface
// the broken integration; flip to passing when EmbedPress is fixed upstream.
test.describe('Gutenberg verify — 23hq', () => {
  test('seeded page renders an embed iframe', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const iframe = page.locator(
      'figure.wp-block-embedpress-embedpress iframe, .elementor-widget-embedpres_elementor iframe',
    ).first();
    await expect(
      iframe,
      'EmbedPress did not produce an iframe — integration appears broken in this build',
    ).toBeVisible({ timeout: 15_000 });
  });
});
