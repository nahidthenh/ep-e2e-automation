import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-gutenberg-afreecatv';

// Afreecatv emits a wrapper but no server-side iframe; the player loads via
// JS at runtime. We assert on the wrapper, which is the integration boundary
// EmbedPress is responsible for.
test.describe('Gutenberg verify — Afreecatv (wrapper only)', () => {
  test('seeded page emits the source wrapper', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const wrapper = page.locator('[data-embed-type="Afreecatv"]').first();
    await expect(wrapper).toBeVisible({ timeout: 30_000 });
  });
});
