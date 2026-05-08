import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-elementor-anniemusic';
const WRAPPER_SEL = '[data-embed-type="AnnieMusic"]';

// AnnieMusic's embed iframe is not rendered server-side; the wrapper is the integration boundary EmbedPress is responsible for.
test.describe('Elementor verify — AnnieMusic (wrapper only)', () => {
  test('seeded page emits the source wrapper', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();
    const wrapper = page.locator(WRAPPER_SEL).first();
    await expect(wrapper).toBeVisible({ timeout: 30_000 });
  });
});
