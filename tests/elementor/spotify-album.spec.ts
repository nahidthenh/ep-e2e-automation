import { test, expect } from '@playwright/test';

const SOURCE_NAME = 'Spotify Album';
const SEEDED_SLUG = 'ep-elementor-spotify-album';
const IFRAME_SEL  = 'iframe[src*="spotify.com/embed/album"]';
const URL_MARKER  = '10xFwtVNORWs3GDSn8Zlcg';

test.describe(`Elementor verify — ${SOURCE_NAME}`, () => {
  test('seeded page renders the embed', async ({ page }) => {
    const response = await page.goto(`/${SEEDED_SLUG}/`, { waitUntil: 'load' });
    expect(response?.ok(), `seeded page not found — run \`npm run seed\``).toBeTruthy();
    const iframe = page.locator(IFRAME_SEL).first();
    await expect(iframe).toBeVisible({ timeout: 30_000 });
    await expect(iframe).toHaveAttribute('src', new RegExp(URL_MARKER));
  });
});
