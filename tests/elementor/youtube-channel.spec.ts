import { test, expect } from '@playwright/test';

const SOURCE_NAME = 'YouTube Channel';
const SOURCE_URL  = 'https://www.youtube.com/@wpdeveloper';
const SEEDED_SLUG = 'ep-elementor-youtube-channel';

// See gutenberg variant for the API-key prerequisite — same applies here.
test.describe(`Elementor verify — ${SOURCE_NAME} (gallery)`, () => {
  test('seeded page renders the gallery layout with channel content', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(
      response?.ok(),
      `seeded page not found — run \`npm run seed\``,
    ).toBeTruthy();

    await expect(
      page.locator('text=enter your YouTube API key'),
      'EmbedPress is showing its API-key placeholder — set YT_SECRET in .env and re-run setup',
    ).toHaveCount(0);

    const wrapper = page.locator('[data-embed-type="YoutubeChannel"]').first();
    await expect(wrapper).toBeVisible({ timeout: 30_000 });
    await expect(wrapper.locator('.ep-player-wrap.layout-gallery')).toBeVisible();
    await expect(wrapper.locator('.channel-name', { hasText: 'WPDeveloper' })).toBeVisible();
    await expect(wrapper.locator('iframe[src*="youtube"]').first()).toBeVisible();
  });
});
