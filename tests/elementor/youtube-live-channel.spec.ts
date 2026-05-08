import { test, expect } from '@playwright/test';

const SOURCE_NAME  = 'YouTube Live (Channel)';
const SOURCE_URL   = 'https://www.youtube.com/@SaudiQuranTv/live';
const SEEDED_SLUG  = 'ep-elementor-youtube-live-channel';
// oEmbed resolves the `/live` path to an embed/live_stream iframe with the
// channel id baked in, so this works without a YouTube API key (unlike
// YouTube Channel, which does need one for full content).
const IFRAME_SEL   = 'iframe[src*="embed/live_stream"]';
const URL_MARKER   = 'channel=UCos52azQNBgW63_9uDJoPDA';

test.describe(`Elementor verify — ${SOURCE_NAME}`, () => {
  test('seeded page renders the embed', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(
      response?.ok(),
      `seeded page not found — run \`npm run seed -- --source "${SOURCE_NAME}"\``,
    ).toBeTruthy();

    const iframe = page.locator(IFRAME_SEL).first();
    await expect(iframe).toBeVisible({ timeout: 30_000 });
    await expect(iframe).toHaveAttribute('src', new RegExp(URL_MARKER));
  });
});
