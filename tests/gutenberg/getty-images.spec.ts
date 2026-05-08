import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-gutenberg-getty-images';
const WRAPPER_SEL = '[data-embed-type="GettyImages"]';

// Getty Images uses a JS-injected embed; the server response carries only the wrapper. Wrapper-only assertion.
test.describe('Gutenberg verify — Getty Images (wrapper only)', () => {
  test('seeded page emits the source wrapper', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const wrapper = page.locator(WRAPPER_SEL).first();
    await expect(wrapper).toBeVisible({ timeout: 30_000 });
  });
});
