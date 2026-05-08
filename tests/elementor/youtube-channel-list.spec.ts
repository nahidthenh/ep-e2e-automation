import { test, expect } from '@playwright/test';

const SEEDED_SLUG = 'ep-elementor-youtube-channel-list';

test.describe('Elementor verify — YouTube Channel (list layout)', () => {
  test('seeded page renders the list layout', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), 'seeded page not found — run `npm run seed`').toBeTruthy();

    const wrapper = page.locator('[data-embed-type="YoutubeChannel"]').first();
    await expect(wrapper).toBeVisible({ timeout: 30_000 });
    await expect(wrapper.locator('.ep-player-wrap.layout-list')).toBeVisible();
    await expect(wrapper.locator('.channel-name', { hasText: 'WPDeveloper' })).toBeVisible();
  });
});
