import { test, expect } from '@playwright/test';

const SOURCE_NAME = 'Spotify Single';
const SEEDED_SLUG = 'ep-gutenberg-spotify-single';
const IFRAME_SEL  = 'iframe[src*="spotify.com/embed/track"]';
const URL_MARKER  = '2Bo1bC4f6YNxXpHtVLO54a';

test.describe(`Gutenberg verify — ${SOURCE_NAME}`, () => {
  test('seeded page renders the embed', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), `seeded page not found — run \`npm run seed\``).toBeTruthy();
    const iframe = page.locator(IFRAME_SEL).first();
    await expect(iframe).toBeVisible({ timeout: 30_000 });
    await expect(iframe).toHaveAttribute('src', new RegExp(URL_MARKER));
  });
});
