import { test, expect } from '@playwright/test';

const SOURCE_NAME  = 'YouTube Channel';
const SOURCE_URL   = 'https://www.youtube.com/@wpdeveloper';
const SEEDED_SLUG  = 'ep-elementor-youtube-channel';
// YouTube Channel requires a YouTube Data API key to render channel videos.
// Without a key, EmbedPress emits the wrapper + an "enter your YouTube API key"
// notice. We assert on the wrapper, which proves EmbedPress recognised the
// URL as a channel embed — the API-key gate is environmental, not a bug.
const EMBED_SEL    = '[data-embed-type="YoutubeChannel"]';

test.describe(`Elementor verify — ${SOURCE_NAME}`, () => {
  test('seeded page renders the channel wrapper', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(
      response?.ok(),
      `seeded page not found — run \`npm run seed -- --source "${SOURCE_NAME}"\``,
    ).toBeTruthy();

    const embed = page.locator(EMBED_SEL).first();
    await expect(embed).toBeVisible({ timeout: 30_000 });
  });
});
