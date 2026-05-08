import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-gutenberg-beautifulai';
const WRAPPER_SEL = '[data-embed-type="beautiful"]';

// BeautifulAI's player iframe is loaded by its own client script. Wrapper-only assertion.
test.describe('Gutenberg verify — BeautifulAI (wrapper only)', () => {
  test('seeded page emits the source wrapper', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const wrapper = page.locator(WRAPPER_SEL).first();
    await expect(wrapper).toBeVisible({ timeout: 30_000 });
  });
});
