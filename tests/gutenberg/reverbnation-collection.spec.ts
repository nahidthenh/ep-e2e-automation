import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-gutenberg-reverbnation-collection';
const WRAPPER_SEL = '[data-embed-type="reverbnation"]';

// Reverbnation Collection (vs. Song) doesn't ship a server-side iframe; only the wrapper renders. Reverbnation Song does render a real iframe — see that spec.
test.describe('Gutenberg verify — Reverbnation Collection (wrapper only)', () => {
  test('seeded page emits the source wrapper', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const wrapper = page.locator(WRAPPER_SEL).first();
    await expect(wrapper).toBeVisible({ timeout: 30_000 });
  });
});
