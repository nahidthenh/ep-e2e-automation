import { test, expect } from '@playwright/test';

const SOURCE_NAME  = 'YouTube Live (Channel)';
const SOURCE_URL   = 'https://www.youtube.com/@SaudiQuranTv/live';
const SEEDED_SLUG  = 'ep-elementor-youtube-live-channel';
// `@channel/live` resolves dynamically — sometimes to `embed/live_stream?channel=…`,
// sometimes to a specific live video's id (whichever is currently broadcasting).
// We assert on the YoutubeChannel wrapper plus a youtube iframe inside it,
// which holds for both shapes.
const WRAPPER_SEL = '[data-embed-type="YoutubeChannel"]';
const IFRAME_SEL  = 'iframe[src*="youtube"]';

test.describe(`Elementor verify — ${SOURCE_NAME}`, () => {
  test('seeded page renders the embed', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(
      response?.ok(),
      `seeded page not found — run \`npm run seed -- --source "${SOURCE_NAME}"\``,
    ).toBeTruthy();

    const wrapper = page.locator(WRAPPER_SEL).first();
    await expect(wrapper).toBeVisible({ timeout: 30_000 });
    await expect(wrapper.locator(IFRAME_SEL).first()).toBeVisible({ timeout: 30_000 });
  });
});
